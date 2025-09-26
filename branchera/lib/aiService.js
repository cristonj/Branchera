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

  // Fact check points-based claims using web search
  static async factCheckPoints(points, title = '') {
    try {
      console.log('Fact checking points:', { title, points });
      
      // Filter points that are likely to contain factual claims
      const claimPoints = points.filter(point => 
        point.type === 'claim' || 
        point.type === 'evidence' ||
        point.type === 'recommendation'
      );
      
      if (claimPoints.length === 0) {
        return {
          claims: [],
          summary: {
            totalClaims: 0,
            needsVerification: 0,
            overallConfidence: 'high'
          }
        };
      }
      
      const factCheckResults = await this.performPointsFactCheckWithFirebaseAI(claimPoints, title);
      console.log('Generated points-based fact check results:', factCheckResults);
      return factCheckResults;
    } catch (error) {
      console.error('Error fact checking points:', error);
      throw error;
    }
  }

  // Firebase AI fact checking using Gemini with Google Search grounding
  static async performFactCheckWithFirebaseAI(content, title = '') {
    // Initialize the Firebase AI backend service
    const ai = getAI(app, { backend: new GoogleAIBackend() });
    
    // Create a GenerativeModel instance with Google Search grounding
    const model = getGenerativeModel(ai, { 
      model: "gemini-2.5-flash",
      // Provide Google Search as a tool that the model can use to generate its response
      tools: [{ googleSearch: {} }]
    });

    const prompt = `
You are a fact-checking AI with access to Google Search. Analyze the following content for factual claims that can be verified using current, real-time information from the web.

Title: ${title}
Content: ${content}

For each factual claim you find, use Google Search to verify its accuracy with current information. Then provide a comprehensive fact-check analysis.

Return ONLY a valid JSON object in this format:
{
  "claims": [
    {
      "id": "claim1",
      "text": "The specific factual claim from the content",
      "category": "statistic|date|location|person|event|other",
      "confidence": "high|medium|low",
      "status": "verified_accurate|verified_inaccurate|partially_accurate|insufficient_evidence|unverifiable",
      "explanation": "Detailed explanation based on search results",
      "evidence": "Key evidence found through web search",
      "lastUpdated": "When this information was last verified"
    }
  ],
  "summary": {
    "totalClaims": 0,
    "verifiedClaims": 0,
    "accuracy": "high|medium|low",
    "searchPerformed": true
  }
}

Guidelines:
- Use Google Search to verify each claim with current information
- Only include verifiable factual claims (no opinions, predictions, or subjective statements)
- Focus on specific numbers, dates, names, locations, events
- Provide evidence-based verification using search results
- Maximum 5 claims per content
- Keep claim text under 100 characters

Do not include any explanation or additional text, just the JSON object.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Get the grounding metadata from the response
    const groundingMetadata = result.response.candidates?.[0]?.groundingMetadata;
    
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
      
      // If we have grounding metadata, this is a grounded result with real Google Search
      if (groundingMetadata) {
        console.log('Fact check was grounded with Google Search');
        
        // Add grounding information to the result
        factCheckResult.grounding = {
          searchPerformed: true,
          searchQueries: groundingMetadata.webSearchQueries || [],
          sources: (groundingMetadata.groundingChunks || []).map(chunk => ({
            title: chunk.web?.title,
            uri: chunk.web?.uri
          })).filter(source => source.title && source.uri),
          searchEntryPoint: groundingMetadata.searchEntryPoint?.renderedContent || null,
          groundingSupports: groundingMetadata.groundingSupports || []
        };
        
        // Update summary to reflect that search was performed
        factCheckResult.summary.searchPerformed = true;
        factCheckResult.summary.sourcesFound = factCheckResult.grounding.sources.length;
      } else {
        // No grounding metadata means the model didn't use Google Search
        console.log('Fact check completed without Google Search grounding');
        factCheckResult.grounding = {
          searchPerformed: false,
          searchQueries: [],
          sources: [],
          searchEntryPoint: null,
          groundingSupports: []
        };
        factCheckResult.summary.searchPerformed = false;
        factCheckResult.summary.sourcesFound = 0;
      }
      
      return factCheckResult;
    } catch (parseError) {
      console.error('Error parsing fact check response:', parseError);
      console.error('Raw response:', text);
      throw new Error('Failed to parse fact check response');
    }
  }

  // Firebase AI fact checking for points using Gemini with Google Search grounding
  static async performPointsFactCheckWithFirebaseAI(claimPoints, title = '') {
    // Initialize the Firebase AI backend service
    const ai = getAI(app, { backend: new GoogleAIBackend() });
    
    // Create a GenerativeModel instance with Google Search grounding
    const model = getGenerativeModel(ai, { 
      model: "gemini-2.5-flash",
      // Provide Google Search as a tool that the model can use to generate its response
      tools: [{ googleSearch: {} }]
    });

    const pointsText = claimPoints.map(point => `- ${point.text} (${point.type})`).join('\n');

    const prompt = `
You are a fact-checking AI with access to Google Search. Analyze the following discussion points that have been identified as potential claims or evidence. Use Google Search to verify any factual claims you find.

Title: ${title}
Discussion Points:
${pointsText}

For each point that contains a verifiable factual claim, extract the specific claim and use Google Search to verify its accuracy with current information:

Return ONLY a valid JSON object in this format:
{
  "claims": [
    {
      "id": "claim1",
      "pointId": "p1",
      "text": "The specific factual claim from the point",
      "originalPoint": "The original point text",
      "category": "statistic|date|location|person|event|other",
      "confidence": "high|medium|low",
      "status": "verified_accurate|verified_inaccurate|partially_accurate|insufficient_evidence|unverifiable",
      "explanation": "Detailed explanation based on search results",
      "evidence": "Key evidence found through web search",
      "lastUpdated": "When this information was last verified"
    }
  ],
  "summary": {
    "totalClaims": 0,
    "verifiedClaims": 0,
    "accuracy": "high|medium|low",
    "searchPerformed": true
  }
}

Guidelines:
- Use Google Search to verify each claim with current information
- Only extract verifiable factual claims from the points (no opinions, predictions, or subjective statements)
- Focus on specific numbers, dates, names, locations, events within the points
- Provide evidence-based verification using search results
- Maximum 5 claims total
- Keep claim text under 100 characters
- Include the original point ID for reference

Do not include any explanation or additional text, just the JSON object.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Get the grounding metadata from the response
    const groundingMetadata = result.response.candidates?.[0]?.groundingMetadata;
    
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
      
      // If we have grounding metadata, this is a grounded result with real Google Search
      if (groundingMetadata) {
        console.log('Points fact check was grounded with Google Search');
        
        // Add grounding information to the result
        factCheckResult.grounding = {
          searchPerformed: true,
          searchQueries: groundingMetadata.webSearchQueries || [],
          sources: (groundingMetadata.groundingChunks || []).map(chunk => ({
            title: chunk.web?.title,
            uri: chunk.web?.uri
          })).filter(source => source.title && source.uri),
          searchEntryPoint: groundingMetadata.searchEntryPoint?.renderedContent || null,
          groundingSupports: groundingMetadata.groundingSupports || []
        };
        
        // Update summary to reflect that search was performed
        factCheckResult.summary.searchPerformed = true;
        factCheckResult.summary.sourcesFound = factCheckResult.grounding.sources.length;
      } else {
        // No grounding metadata means the model didn't use Google Search
        console.log('Points fact check completed without Google Search grounding');
        factCheckResult.grounding = {
          searchPerformed: false,
          searchQueries: [],
          sources: [],
          searchEntryPoint: null,
          groundingSupports: []
        };
        factCheckResult.summary.searchPerformed = false;
        factCheckResult.summary.sourcesFound = 0;
      }
      
      return factCheckResult;
    } catch (parseError) {
      console.error('Error parsing points fact check response:', parseError);
      console.error('Raw response:', text);
      throw new Error('Failed to parse points fact check response');
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

  // Judge rebuttal quality for points system
  static async judgeRebuttal(originalPoint, rebuttal, parentFactCheck = null, childFactCheck = null, discussionContext = '') {
    try {
      console.log('Judging rebuttal quality:', { originalPoint, rebuttal });
      
      const judgement = await this.performRebuttalJudgementWithFirebaseAI(
        originalPoint, 
        rebuttal, 
        parentFactCheck, 
        childFactCheck, 
        discussionContext
      );
      console.log('Generated rebuttal judgement:', judgement);
      return judgement;
    } catch (error) {
      console.error('Error judging rebuttal:', error);
      throw error;
    }
  }

  // Firebase AI rebuttal judgement using Gemini with Google Search grounding
  static async performRebuttalJudgementWithFirebaseAI(originalPoint, rebuttal, parentFactCheck, childFactCheck, discussionContext) {
    // Initialize the Firebase AI backend service
    const ai = getAI(app, { backend: new GoogleAIBackend() });
    
    // Create a GenerativeModel instance with Google Search grounding
    const model = getGenerativeModel(ai, { 
      model: "gemini-2.5-flash",
      // Provide Google Search as a tool that the model can use to generate its response
      tools: [{ googleSearch: {} }]
    });

    const factCheckInfo = parentFactCheck || childFactCheck ? `

FACT CHECK CONTEXT:
${parentFactCheck ? `Original Point Fact Check: ${JSON.stringify(parentFactCheck, null, 2)}` : ''}
${childFactCheck ? `Rebuttal Fact Check: ${JSON.stringify(childFactCheck, null, 2)}` : ''}` : '';

    const prompt = `
You are an AI judge evaluating whether a rebuttal deserves points in a discussion system. Users earn points by providing factual and coherent rebuttals to discussion points.

DISCUSSION CONTEXT: ${discussionContext}

ORIGINAL POINT BEING CHALLENGED:
"${originalPoint}"

USER'S REBUTTAL:
"${rebuttal}"
${factCheckInfo}

Your job is to evaluate if this rebuttal deserves points based on these criteria:

1. FACTUAL ACCURACY: Is the rebuttal factually correct? Use Google Search to verify claims if needed.
2. COHERENCE: Is the rebuttal well-structured, logical, and clearly written?
3. RELEVANCE: Does it directly address the original point?
4. EVIDENCE: Does it provide supporting evidence or reasoning?
5. CONSTRUCTIVENESS: Does it contribute meaningfully to the discussion?

SCORING SYSTEM:
- Excellent (5 points): Exceptional rebuttal with strong evidence, perfect factual accuracy, and excellent coherence
- Good (3 points): Solid rebuttal with good evidence, mostly accurate facts, and good coherence  
- Fair (2 points): Decent rebuttal with some evidence, minor factual issues, adequate coherence
- Basic (1 point): Simple rebuttal that addresses the point but lacks depth or has factual concerns
- No Points (0 points): Inaccurate, incoherent, irrelevant, or unconstructive

Use Google Search to verify any factual claims in the rebuttal before making your judgement.

Return ONLY a valid JSON object in this format:
{
  "pointsEarned": 0-5,
  "qualityScore": "excellent|good|fair|basic|none",
  "isFactual": true/false,
  "isCoherent": true/false,
  "isRelevant": true/false,
  "hasEvidence": true/false,
  "isConstructive": true/false,
  "explanation": "Detailed explanation of why this score was given, including fact-check results if applicable",
  "factualConcerns": ["List any factual inaccuracies found"],
  "strengths": ["List the strongest aspects of this rebuttal"],
  "improvements": ["Suggestions for improvement if score is low"]
}

Be fair but rigorous. Only award high scores for truly exceptional rebuttals that are both factually accurate and well-reasoned.

Do not include any explanation or additional text, just the JSON object.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Get the grounding metadata from the response
    const groundingMetadata = result.response.candidates?.[0]?.groundingMetadata;
    
    try {
      // Clean up the response to extract just the JSON
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON object found in response');
      }
      
      const judgement = JSON.parse(jsonMatch[0]);
      
      // Validate the structure
      if (typeof judgement.pointsEarned !== 'number' || !judgement.qualityScore) {
        throw new Error('Invalid judgement structure');
      }
      
      // Ensure points are within valid range
      judgement.pointsEarned = Math.max(0, Math.min(5, judgement.pointsEarned));
      
      // If we have grounding metadata, this judgement was made with Google Search
      if (groundingMetadata) {
        console.log('Rebuttal judgement was grounded with Google Search');
        
        // Add grounding information to the result
        judgement.grounding = {
          searchPerformed: true,
          searchQueries: groundingMetadata.webSearchQueries || [],
          sources: (groundingMetadata.groundingChunks || []).map(chunk => ({
            title: chunk.web?.title,
            uri: chunk.web?.uri
          })).filter(source => source.title && source.uri),
          searchEntryPoint: groundingMetadata.searchEntryPoint?.renderedContent || null,
          groundingSupports: groundingMetadata.groundingSupports || []
        };
      } else {
        // No grounding metadata means the model didn't use Google Search
        console.log('Rebuttal judgement completed without Google Search grounding');
        judgement.grounding = {
          searchPerformed: false,
          searchQueries: [],
          sources: [],
          searchEntryPoint: null,
          groundingSupports: []
        };
      }
      
      return judgement;
    } catch (parseError) {
      console.error('Error parsing rebuttal judgement response:', parseError);
      console.error('Raw response:', text);
      throw new Error('Failed to parse rebuttal judgement response');
    }
  }

}
