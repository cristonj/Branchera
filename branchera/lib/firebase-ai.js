'use client';

// Centralized Firebase AI service to avoid circular dependencies
import { app } from './firebase';

// Lazy import Firebase AI modules to avoid initialization issues
let firebaseAI = null;

const initializeFirebaseAI = async () => {
  if (firebaseAI) return firebaseAI;

  try {
    const { getAI, getGenerativeModel, GoogleAIBackend } = await import("firebase/ai");
    firebaseAI = { getAI, getGenerativeModel, GoogleAIBackend };
    return firebaseAI;
  } catch (error) {
    console.error('Failed to initialize Firebase AI:', error);
    throw new Error('Firebase AI not available');
  }
};

export class FirebaseAIService {
  static async getAIInstance() {
    await initializeFirebaseAI();
    return firebaseAI.getAI(app, { backend: new firebaseAI.GoogleAIBackend() });
  }

  static async getGenerativeModel(modelName = "gemini-2.5-flash", options = {}) {
    const ai = await this.getAIInstance();
    return firebaseAI.getGenerativeModel(ai, { model: modelName, ...options });
  }

  static async generateContent(model, prompt) {
    const result = await model.generateContent(prompt);
    return await result.response;
  }

  static async generateContentWithGrounding(model, prompt) {
    const result = await model.generateContent(prompt);
    const response = await result.response;

    // Get grounding metadata if available
    const groundingMetadata = result.response.candidates?.[0]?.groundingMetadata;

    return {
      response,
      groundingMetadata
    };
  }
}
