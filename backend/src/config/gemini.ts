import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from './env';

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);

export const getGeminiModel = (modelName: string = 'gemini-3.8-flash') => {
  return genAI.getGenerativeModel({
    model: modelName,
    generationConfig: {
      temperature: 0.7,
      topP: 0.9,
      responseMimeType: 'application/json',
    },
  });
};
