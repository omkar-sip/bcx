import { GoogleGenerativeAI } from '@google/generative-ai';
import type { EcoAction } from '../types';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
const hasGeminiKey = Boolean(apiKey && !apiKey.startsWith('YOUR_GEMINI_'));

const genAI = hasGeminiKey ? new GoogleGenerativeAI(apiKey) : null;

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
  if (!genAI) {
    return fallbackRecommendations(actions);
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
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
  } catch {
    return fallbackRecommendations(actions);
  }
};
