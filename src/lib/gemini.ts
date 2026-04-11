import { GoogleGenerativeAI } from '@google/generative-ai';
import type { EcoAction } from '../types';

const rawApiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
const apiKey = rawApiKey?.trim().replace(/^['"]|['"]$/g, '');
const hasGeminiKey = Boolean(apiKey && !apiKey.startsWith('YOUR_GEMINI_'));

const genAI = hasGeminiKey && apiKey ? new GoogleGenerativeAI(apiKey) : null;
let geminiUnavailableReason: string | null = null;

const markUnavailableIfNeeded = (error: unknown) => {
  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  if (
    message.includes('api key was reported as leaked') ||
    message.includes('[403]') ||
    message.includes('permission') ||
    message.includes('api key not valid')
  ) {
    geminiUnavailableReason = message;
  }
};

const canUseGemini = () => Boolean(genAI && !geminiUnavailableReason);

const fallbackRecommendations = (actions: EcoAction[]): string[] => {
  const carTrips = actions.filter((item) => item.type === 'car').length;
  const bikeTrips = actions.filter((item) => item.type === 'bike').length;
  const busTrips = actions.filter((item) => item.type === 'bus').length;
  const wfhDays = actions.filter((item) => item.type === 'wfh').length;
  const carpools = actions.filter((item) => item.type === 'carpool').length;
  const electricitySaves = actions.filter((item) => item.type === 'electricity').length;

  const ideas: string[] = [];
  if (carTrips > 1) {
    ideas.push('Swap at least two solo-car commutes for bus, metro, or carpool to improve your Scope 3 signal.');
  }
  if (bikeTrips < 2) {
    ideas.push('Plan one bike-friendly workday this week for a strong low-carbon commute entry.');
  }
  if (electricitySaves < 2) {
    ideas.push('Build a shutdown habit for screens and chargers before leaving your desk.');
  }
  if (busTrips === 0 && carpools === 0) {
    ideas.push('Try public transport or a shared ride once this week to diversify your commute pattern.');
  }
  if (wfhDays === 0) {
    ideas.push('If your role allows it, use one planned work-from-home day to avoid a full commute.');
  }
  if (!ideas.length) {
    ideas.push('Keep your current streak going and add one new low-carbon habit next week.');
  }
  return ideas;
};

export const getAIRecommendations = async (actions: EcoAction[]): Promise<string[]> => {
  if (!canUseGemini()) {
    return fallbackRecommendations(actions);
  }

  try {
    const model = genAI!.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const actionText =
      actions
        .slice(0, 10)
        .map((item) => `${item.action} (${item.type}, ${item.pts} pts)`)
        .join('\n') || 'No actions yet';

    const prompt = [
      'You are an eco-action coach for an employee in Bharat Carbon Exchange.',
      'Return 3 concise and practical recommendations that help the employee improve their own habits and strengthen company Scope 3 reporting.',
      'No markdown bullets. One recommendation per line.',
      `Recent actions:\n${actionText}`
    ].join('\n');

    const response = await model.generateContent(prompt);
    const text = response.response.text();
    const lines = text
      .split('\n')
      .map((line) => line.trim().replace(/^[\d\-.*)\s]+/, ''))
      .filter(Boolean);
    return lines.slice(0, 3).length ? lines.slice(0, 3) : fallbackRecommendations(actions);
  } catch (error) {
    markUnavailableIfNeeded(error);
    return fallbackRecommendations(actions);
  }
};

const copilotFallback = (question: string): string => {
  const normalized = question.trim().toLowerCase();

  if (normalized.includes('what ai') || normalized.includes('which ai') || normalized.includes('ai is being used')) {
    return 'BCX uses Google Gemini for copilot-style answers when the AI service is configured and available. If that service is unavailable, BCX falls back to built-in platform guidance.';
  }
  if (normalized.includes('scope 1') && normalized.includes('scope 2')) {
    return 'Scope 1 covers direct emissions you control, like fuel burned in vehicles or generators. Scope 2 covers indirect emissions from purchased electricity, heating, or cooling.';
  }
  if (normalized.includes('facility') || normalized.includes('location') || normalized.includes('site')) {
    return 'You can add a facility from My Organization or by using the Add Locations card on Home. Bulk upload will import the sheet rows, store them locally and in Firestore sync, and feed the visualization views.';
  }
  if (normalized.includes('telemetry') || normalized.includes('iot')) {
    return 'The real-time telemetry module streams equipment power data, converts kWh into emissions using configured factors, and visualizes live equipment behavior in the dashboard.';
  }
  if (normalized.includes('offset') || normalized.includes('carbon credit')) {
    return 'Yes. BCX lets companies offset residual emissions through the carbon credit marketplace using verified farmer-side listings.';
  }
  if (normalized.includes('upload') || normalized.includes('excel') || normalized.includes('sample file')) {
    return 'Use the Bulk Upload button on the relevant Home card, download the matching sample file if needed, and upload the completed sheet. BCX will parse the uploaded rows and use them in calculations and visualizations.';
  }
  if (
    normalized.includes('recipe') ||
    normalized.includes('history') ||
    normalized.includes('movie') ||
    normalized.includes('code')
  ) {
    return 'I am the BCX Climate Copilot, so I can only help with BCX platform features, carbon tracking, sustainability workflows, and related climate questions.';
  }

  return 'I can help with BCX platform features like Scope 1/2/3 tracking, Excel uploads, visualization dashboards, AI recommendations, telemetry, and carbon credit offsets.';
};

const COPILOT_SYSTEM_PROMPT = `You are the BCX (Bharat Carbon Exchange) Copilot.
You are an expert in carbon accounting, GHG tracking, and the BCX platform features.
The BCX platform allows companies to:
1. Track Scope 1, 2, 3 emissions manually via Activity-Based Tracking.
2. Calculate footprints and see them on a Visualization Dashboard.
3. Use an AI Recommendation System for reduction strategies.
4. Stream live machinery tracking via Real-Time Telemetry.
5. Offset residual emissions on a carbon credit marketplace.

CRITICAL RULE: Only answer questions related to the BCX platform, carbon tracking, climate change, GHG protocols, sustainability workflows, or the features above. Keep answers concise and helpful.`;

export const getBCXCopilotReply = async (
  question: string,
  history: Array<{ role: 'user' | 'assistant'; text: string }> = []
): Promise<string> => {
  if (!canUseGemini()) {
    return copilotFallback(question);
  }

  try {
    const model = genAI!.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: COPILOT_SYSTEM_PROMPT
    });
    const chat = model.startChat({
      history: history.map((message) => ({
        role: message.role === 'user' ? 'user' : 'model',
        parts: [{ text: message.text }]
      }))
    });

    const result = await chat.sendMessage(question);
    const responseText = result.response.text().trim();
    return responseText || copilotFallback(question);
  } catch (error) {
    markUnavailableIfNeeded(error);
    return copilotFallback(question);
  }
};
