import * as functions from 'firebase-functions';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Uses the API key defined in the functions/.env file
const apiKey = process.env.GEMINI_API_KEY || '';
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

export const getAIRecommendations = functions.https.onCall(async (data: { actionsText: string }) => {
  if (!genAI) {
    throw new functions.https.HttpsError('failed-precondition', 'Gemini API not configured');
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = [
      'You are an eco-action coach for an employee in Bharat Carbon Exchange.',
      'Return 3 concise and practical recommendations that help the employee improve their own habits and strengthen company Scope 3 reporting.',
      'No markdown bullets. One recommendation per line.',
      `Recent actions:\n${data.actionsText}`
    ].join('\n');

    const response = await model.generateContent(prompt);
    const text = response.response.text();
    return { text };
  } catch (error: any) {
    throw new functions.https.HttpsError('internal', error.message || 'Error generating recommendations');
  }
});

export const getBCXCopilotReply = functions.https.onCall(async (data: { question: string, history: any[] }) => {
  if (!genAI) {
    throw new functions.https.HttpsError('failed-precondition', 'Gemini API not configured');
  }

  const COPILOT_SYSTEM_PROMPT = `You are the BCX (Bharat Carbon Exchange) Copilot.
You are an expert in carbon accounting, GHG tracking, and the BCX platform features.
The BCX platform allows companies to:
1. Track Scope 1, 2, 3 emissions manually via Activity-Based Tracking.
2. Calculate footprints and see them on a Visualization Dashboard.
3. Use an AI Recommendation System for reduction strategies.
4. Stream live machinery tracking via Real-Time Telemetry.
5. Offset residual emissions on a carbon credit marketplace.

CRITICAL RULE: Only answer questions related to the BCX platform, carbon tracking, climate change, GHG protocols, sustainability workflows, or the features above. Keep answers concise and helpful.`;

  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: COPILOT_SYSTEM_PROMPT
    });
    
    const history = Array.isArray(data.history) ? data.history.map((msg: any) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text || '' }]
    })) : [];

    const chat = model.startChat({ history });
    const result = await chat.sendMessage(data.question || '');
    return { text: result.response.text().trim() };
  } catch (error: any) {
    throw new functions.https.HttpsError('internal', error.message || 'Error executing copilot');
  }
});

export const scanElectricityBill = functions.https.onCall(async (data: { mimeType: string, base64Data: string }) => {
  if (!genAI) {
    throw new functions.https.HttpsError('failed-precondition', 'Gemini API not configured');
  }

  const imagePart = {
    inlineData: {
      mimeType: data.mimeType,
      data: data.base64Data,
    },
  };

  const buildPrompt = () => `
Extract the RR Number, Consumer Name, Bill Date, Net Amount Payable, and Due Date from this Karnataka Electricity Bill.
Also extract consumed units in kWh, present meter reading, previous meter reading, and subsidy details when visible.

Return strict JSON matching this structure:
{
  "rr_number": "", "consumer_name": "", "bill_date": "", "net_payable": "", "due_date": "",
  "consumed_units_kwh": "", "present_reading": "", "previous_reading": "", "subsidy_status": "", "subsidy_amount": "",
  "bounding_boxes": [ { "field": "", "value": "", "confidence": 0.9, "box": [0,0,1000,1000] } ]
}

For bounding boxes, return one entry per detected field in "bounding_boxes":
- field: extracted field key
- value: extracted text
- confidence: number between 0 and 1
- box: [x1, y1, x2, y2] normalized to 0..1000, where x grows left->right and y grows top->bottom

If a field is missing, return an empty string for that field. No markdown.
`.trim();

  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        temperature: 0.1,
      },
    });

    const fallbackPrompt = `${buildPrompt()}\n\nReply with one JSON object only and no extra text.`;
    const response = await model.generateContent([{ text: fallbackPrompt }, imagePart]);
    const text = response.response.text().trim();
    
    return { text };
  } catch (error: any) {
    throw new functions.https.HttpsError('internal', error.message || 'Error processing bill');
  }
});
