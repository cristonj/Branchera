'use client';

import { getAI, getGenerativeModel, GoogleAIBackend } from "firebase/ai";
import { app } from './firebase';

// AI service for generating points from discussion content using Firebase AI
export class AIService {
  static async generatePoints(content, title = '') {
    try {
      console.log('Generating AI points for content:', { title, content });
      
      const points = await this.generatePointsWithFirebaseAI(content, title);
      console.log('Generated AI points with Firebase AI:', points);
      return points;
    } catch (error) {
      console.error('Error generating AI points:', error);
      throw error;
    }
  }

  // Generate AI points for a reply's content
  static async generateReplyPoints(replyContent, context = '') {
    try {
      console.log('Generating AI points for reply:', { context, replyContent });

      // Reuse the same underlying generator with a reply-focused prompt wrapper
      const points = await this.generatePointsWithFirebaseAI(
        `Reply Context: ${context}\n\n${replyContent}`,
        `Reply: ${context}`
      );
      console.log('Generated AI points for reply with Firebase AI:', points);
      return points;
    } catch (error) {
      console.error('Error generating AI points for reply:', error);
      throw error;
    }
  }

  // Firebase AI point generation using Gemini
  static async generatePointsWithFirebaseAI(content, title = '') {
    // Initialize the Firebase AI backend service
    const ai = getAI(app, { backend: new GoogleAIBackend() });
    
    // Create a GenerativeModel instance
    const model = getGenerativeModel(ai, { model: "gemini-2.5-flash" });

    const prompt = `
Extract all discussion points from the following text that would be good anchor points for replies. Focus on the main claims, arguments, questions, or recommendations that people might want to respond to.

Title: ${title}
Content: ${content} 

Return ONLY a valid JSON array in this format:
[
  {"id": "p1", "text": "First key point or claim", "type": "claim"},
  {"id": "p2", "text": "Supporting evidence or argument", "type": "evidence"},
  {"id": "p3", "text": "Question or area needing clarification", "type": "question"}
]

Types should be one of: "claim", "evidence", "recommendation", "question", "topic"

Make the points:
- Specific and actionable for replies
- Clear and concise (under 100 characters each)
- Focused on the most important aspects
- Suitable for structured discussion

Do not include any explanation or additional text, just the JSON array.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    try {
      // Clean up the response to extract just the JSON
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('No JSON array found in response');
      }
      
      const points = JSON.parse(jsonMatch[0]);
      
      // Validate the structure
      if (!Array.isArray(points) || points.length === 0) {
        throw new Error('Invalid points structure');
      }
      
      // Ensure each point has required fields
      const validatedPoints = points.map((point, index) => ({
        id: point.id || `p${index + 1}`,
        text: point.text || 'Generated point',
        type: point.type || 'claim',
        originalSentence: point.text || ''
      }));
      
      return validatedPoints;
    } catch (parseError) {
      console.error('Error parsing Gemini response:', parseError);
      console.error('Raw response:', text);
      throw new Error('Failed to parse AI response');
    }
  }

}
