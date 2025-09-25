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

  // Fact check content using web search
  static async factCheckContent(content, title = '') {
    try {
      console.log('Fact checking content:', { title, content });
      
      const factCheckResults = await this.performFactCheckWithFirebaseAI(content, title);
      console.log('Generated fact check results:', factCheckResults);
      return factCheckResults;
    } catch (error) {
      console.error('Error fact checking content:', error);
      throw error;
    }
  }

  // Firebase AI fact checking using Gemini with web search
  static async performFactCheckWithFirebaseAI(content, title = '') {
    // Initialize the Firebase AI backend service
    const ai = getAI(app, { backend: new GoogleAIBackend() });
    
    // Create a GenerativeModel instance
    const model = getGenerativeModel(ai, { model: "gemini-2.5-flash" });

    const prompt = `
You are a fact-checking AI. Analyze the following content for factual claims that can be verified.

Title: ${title}
Content: ${content}

For each factual claim found, determine:
1. If it's a verifiable fact (not opinion, prediction, or subjective statement)
2. Whether it appears to be accurate based on your knowledge
3. What specific search terms would be best to verify this claim

Return ONLY a valid JSON object in this format:
{
  "claims": [
    {
      "id": "claim1",
      "text": "The specific factual claim from the content",
      "category": "statistic|date|location|person|event|other",
      "confidence": "high|medium|low",
      "status": "likely_accurate|needs_verification|likely_inaccurate|unverifiable",
      "searchTerms": ["search term 1", "search term 2"],
      "explanation": "Brief explanation of why this needs fact-checking"
    }
  ],
  "summary": {
    "totalClaims": 0,
    "needsVerification": 0,
    "overallConfidence": "high|medium|low"
  }
}

Guidelines:
- Only include verifiable factual claims (no opinions, predictions, or subjective statements)
- Focus on specific numbers, dates, names, locations, events
- Exclude common knowledge or obviously true statements
- Maximum 5 claims per content
- Keep claim text under 100 characters
- Search terms should be specific and focused

Do not include any explanation or additional text, just the JSON object.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    try {
      // Clean up the response to extract just the JSON
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON object found in response');
      }
      
      const factCheckResult = JSON.parse(jsonMatch[0]);
      
      // Validate the structure
      if (!factCheckResult.claims || !Array.isArray(factCheckResult.claims)) {
        throw new Error('Invalid fact check result structure');
      }
      
      // If there are claims that need verification, perform web searches
      if (factCheckResult.claims.length > 0) {
        const verifiedClaims = await Promise.all(
          factCheckResult.claims.map(async (claim) => {
            if (claim.status === 'needs_verification' && claim.searchTerms && claim.searchTerms.length > 0) {
              try {
                // Use the first search term for web search
                const searchResults = await this.performWebSearch(claim.searchTerms[0]);
                return {
                  ...claim,
                  webSearchResults: searchResults,
                  verificationStatus: 'searched'
                };
              } catch (searchError) {
                console.error('Error performing web search for claim:', claim.id, searchError);
                return {
                  ...claim,
                  webSearchResults: null,
                  verificationStatus: 'search_failed'
                };
              }
            }
            return claim;
          })
        );
        
        factCheckResult.claims = verifiedClaims;
      }
      
      return factCheckResult;
    } catch (parseError) {
      console.error('Error parsing fact check response:', parseError);
      console.error('Raw response:', text);
      throw new Error('Failed to parse fact check response');
    }
  }

  // Perform web search for fact verification
  static async performWebSearch(searchTerm) {
    try {
      console.log('Performing web search for:', searchTerm);
      
      // In a server environment, you would make the web search call here
      // For client-side, we need to make a request to a backend endpoint
      // that performs the web search and returns the results
      
      try {
        const response = await fetch('/api/web-search', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ searchTerm }),
        });
        
        if (!response.ok) {
          throw new Error(`Web search API error: ${response.status}`);
        }
        
        const searchResults = await response.json();
        return {
          searchTerm,
          results: searchResults.results || [],
          searchedAt: new Date().toISOString(),
          status: 'success'
        };
      } catch (fetchError) {
        console.warn('Web search API not available, using placeholder:', fetchError.message);
        
        // Fallback to placeholder when API is not available
        return {
          searchTerm,
          results: [
            {
              title: "Web search not configured",
              snippet: `Fact-checking is enabled but web search API is not configured. The claim "${searchTerm}" would normally be verified against current web sources.`,
              url: "#",
              source: "System Notice"
            }
          ],
          searchedAt: new Date().toISOString(),
          status: 'fallback'
        };
      }
    } catch (error) {
      console.error('Error performing web search:', error);
      throw error;
    }
  }

}
