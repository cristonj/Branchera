'use client';

import { FirebaseAIService } from './firebase-ai';

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

  // Generate key points for replying to a specific reply, taking discussion context into account
  static async generateReplyKeyPoints(replyContent, discussionTitle = '', discussionContent = '', discussionContext = []) {
    try {
      console.log('Generating key points for reply with discussion context:', { 
        replyContent, 
        discussionTitle, 
        discussionContent,
        discussionContextLength: discussionContext.length 
      });

      const points = await this.generateReplyKeyPointsWithFirebaseAI(
        replyContent,
        discussionTitle,
        discussionContent,
        discussionContext
      );
      console.log('Generated key points for reply with Firebase AI:', points);
      return points;
    } catch (error) {
      console.error('Error generating key points for reply:', error);
      throw error;
    }
  }

  // Firebase AI point generation using Gemini
  static async generatePointsWithFirebaseAI(content, title = '') {
    // Get the generative model instance
    const model = await FirebaseAIService.getGenerativeModel();

    const prompt = `
Analyze this text and extract GRANULAR discussion points that people can respond to with specific rebuttals, evidence, or counterarguments. Break down complex statements into their component parts.

Title: ${title}
Content: ${content} 

Create 6-12 specific, debatable points. For each point, identify:
- The exact claim or assertion being made
- Any underlying assumptions 
- Specific data points or statistics mentioned
- Causal relationships claimed
- Value judgments expressed
- Policy recommendations made

Return ONLY a valid JSON array in this format:
[
  {"id": "p1", "text": "Specific claim that can be challenged with evidence", "type": "claim"},
  {"id": "p2", "text": "Statistical assertion or data point mentioned", "type": "statistic"},
  {"id": "p3", "text": "Causal relationship claimed (X causes Y)", "type": "causation"},
  {"id": "p4", "text": "Value judgment or opinion expressed", "type": "opinion"},
  {"id": "p5", "text": "Underlying assumption being made", "type": "assumption"},
  {"id": "p6", "text": "Policy or solution recommendation", "type": "recommendation"}
]

Types should be one of: "claim", "evidence", "statistic", "causation", "opinion", "assumption", "recommendation", "prediction", "comparison"

Make each point:
- HIGHLY SPECIFIC (focus on one precise assertion)
- DEBATABLE (something reasonable people could disagree with)
- FACT-CHECKABLE (can be verified or challenged with evidence)
- CONCISE (under 80 characters)
- GRANULAR (break complex ideas into component parts)

Examples of GOOD granular points:
- "Remote work increases productivity by 20%" (specific statistic)
- "Social media causes depression in teenagers" (specific causal claim)
- "Tax cuts always stimulate economic growth" (challengeable assumption)

Examples of BAD vague points:
- "The economy is important" (too vague)
- "Technology has impacts" (not specific or debatable)

Do not include any explanation or additional text, just the JSON array.`;

    const response = await FirebaseAIService.generateContent(model, prompt);
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

  // Firebase AI key points generation for replies with discussion context using Gemini
  static async generateReplyKeyPointsWithFirebaseAI(replyContent, discussionTitle = '', discussionContent = '', discussionContext = []) {
    // Get the generative model instance
    const model = await FirebaseAIService.getGenerativeModel();

    // Build context from discussion and previous replies
    const contextText = discussionContext.length > 0 
      ? discussionContext.map(reply => `- ${reply.authorName}: ${reply.content}`).join('\n')
      : '';

    const prompt = `
You are analyzing a reply within an ongoing discussion to identify specific points that others could respond to. Consider the full discussion context when identifying what aspects of this reply are worth engaging with.

DISCUSSION TITLE: ${discussionTitle}
ORIGINAL DISCUSSION: ${discussionContent}

DISCUSSION CONTEXT (previous replies):
${contextText}

REPLY TO ANALYZE:
${replyContent}

Extract 3-6 specific, addressable points from this reply that others could meaningfully respond to. Consider:
- Claims or assertions made in the reply
- Evidence or examples provided
- Questions raised (explicit or implicit)
- Assumptions underlying the reply
- Points that build on or contradict the discussion context
- Statements that could benefit from additional perspective

Only include points that are:
- SPECIFIC enough to address directly
- SUBSTANTIAL enough to warrant a response
- DEBATABLE or open to additional input
- RELEVANT to the ongoing discussion

Return ONLY a valid JSON array in this format:
[
  {"id": "r1", "text": "Specific point from the reply that can be addressed", "type": "claim"},
  {"id": "r2", "text": "Question or assumption that could be explored further", "type": "question"},
  {"id": "r3", "text": "Evidence or example that could be built upon", "type": "evidence"}
]

Types should be one of: "claim", "evidence", "question", "assumption", "example", "counterpoint", "extension"

Make each point:
- DIRECTLY from the reply content (not general discussion topics)
- ADDRESSABLE (someone could specifically respond to it)
- CONCISE (under 100 characters)
- CONTEXTUAL (considers the ongoing discussion)

Examples of GOOD reply points:
- "The 15% statistic mentioned contradicts earlier data"
- "The assumption that remote work reduces collaboration"
- "The question about long-term sustainability effects"

Examples of BAD reply points:
- "This is interesting" (not specific)
- "The general topic of economics" (too broad)
- "Something not mentioned in the reply" (not from reply content)

Do not include any explanation or additional text, just the JSON array.`;

    const response = await FirebaseAIService.generateContent(model, prompt);
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
        id: point.id || `r${index + 1}`,
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
    // Get the generative model instance with Google Search grounding
    const model = await FirebaseAIService.getGenerativeModel("gemini-2.5-flash", {
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

    const response = await FirebaseAIService.generateContent(model, prompt);
    const text = response.text();
    
    // Get the grounding metadata from the response
    const groundingMetadata = result.groundingMetadata;
    
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
    // Get the generative model instance with Google Search grounding
    const model = await FirebaseAIService.getGenerativeModel("gemini-2.5-flash", {
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

    const { response, groundingMetadata } = await FirebaseAIService.generateContentWithGrounding(model, prompt);
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

  // Judge response quality for points system
  static async judgeRebuttal(originalPoint, rebuttal, parentFactCheck = null, childFactCheck = null, discussionContext = '') {
    try {
      console.log('Judging response quality:', { originalPoint, rebuttal });
      
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
      
      // Return a safe fallback judgement to prevent crashes
      const fallbackJudgement = {
        pointsEarned: 1,
        qualityScore: 'none',
        isFactual: false,
        isCoherent: true, // Assume basic coherence if we got this far
        isRelevant: true, // Assume relevance if replying to a point
        hasEvidence: false,
        isConstructive: true,
        explanation: 'Unable to evaluate this response due to a technical issue. Your reply has been submitted successfully. Please try replying again to earn points.',
        factualConcerns: ['Technical evaluation error - please try again'],
        strengths: ['Your reply was submitted successfully'],
        improvements: ['Try submitting your response again for point evaluation'],
        grounding: {
          searchPerformed: false,
          searchQueries: [],
          sources: [],
          searchEntryPoint: null,
          groundingSupports: []
        }
      };
      
      console.log('Returning fallback judgement due to error:', fallbackJudgement);
      return fallbackJudgement;
    }
  }

  // Firebase AI response judgement using Gemini with Google Search grounding
  static async performRebuttalJudgementWithFirebaseAI(originalPoint, rebuttal, parentFactCheck, childFactCheck, discussionContext) {
    // Get the generative model instance with Google Search grounding
    const model = await FirebaseAIService.getGenerativeModel("gemini-2.5-flash", {
      // Provide Google Search as a tool that the model can use to generate its response
      tools: [{ googleSearch: {} }]
    });

    const factCheckInfo = parentFactCheck || childFactCheck ? `

FACT CHECK CONTEXT:
${parentFactCheck ? `Original Point Fact Check: ${JSON.stringify(parentFactCheck, null, 2)}` : ''}
${childFactCheck ? `Rebuttal Fact Check: ${JSON.stringify(childFactCheck, null, 2)}` : ''}` : '';

    const prompt = `
You are an AI judge evaluating whether a response deserves points in a discussion system. Users earn points by providing factual, coherent, and constructive responses to discussion points.

DISCUSSION CONTEXT: ${discussionContext}

ORIGINAL POINT BEING ADDRESSED:
"${originalPoint}"

USER'S RESPONSE:
"${rebuttal}"
${factCheckInfo}

Your job is to evaluate if this response deserves points based on these criteria:

1. FACTUAL ACCURACY: Is the response factually correct? Use Google Search to verify claims if needed.
2. COHERENCE: Is the response well-structured, logical, and clearly written?
3. RELEVANCE: Does it directly address the original point?
4. EVIDENCE: Does it provide supporting evidence or reasoning?
5. CONSTRUCTIVENESS: Does it contribute meaningfully to the discussion?

SCORING SYSTEM (BE VERY STINGY WITH POINTS):
- 3 points: EXCEPTIONAL response with comprehensive research, perfect factual accuracy from authoritative sources, sophisticated analysis, and expert-level insight that significantly advances the discussion
- 2 points: GOOD response with solid research-backed evidence, strong factual accuracy, clear logical reasoning, and meaningful contribution to the discussion
- 1 point: Any response that addresses the original point and is coherent, relevant, and constructive - this includes rebuttals, supporting arguments, additional evidence, clarifying questions, or thoughtful extensions of the discussion

Use Google Search to verify any factual claims in the response before making your judgement.

Return ONLY a valid JSON object in this format:
{
  "pointsEarned": 1-3,
  "qualityScore": "exceptional|good|basic|none",
  "isFactual": true/false,
  "isCoherent": true/false,
  "isRelevant": true/false,
  "hasEvidence": true/false,
  "isConstructive": true/false,
  "explanation": "CLEAR, SPECIFIC explanation starting with 'You earned [X] points because...' followed by exactly what the user did well or poorly. Be very specific about which facts were verified, what evidence was strong/weak, and what could be improved. Use simple language and be encouraging even when awarding low points.",
  "factualConcerns": ["List any factual inaccuracies found with specific corrections"],
  "strengths": ["List specific strong aspects: 'You provided solid evidence from X', 'Your logical reasoning about Y was clear', etc."],
  "improvements": ["Specific actionable suggestions: 'Try citing authoritative sources like X', 'Consider addressing the counterargument about Y', etc."]
}

CRITICAL: Your explanation must be CRYSTAL CLEAR about why points were awarded. Users should immediately understand:
- What they did well (be specific about evidence, reasoning, sources)
- What they could improve (be specific about missing elements)
- Why this particular score was given (reference the scoring criteria directly)

Examples of GOOD explanations:
- "You earned 2 points because you provided factually accurate data from the CDC about vaccination rates and clearly explained how this relates to the original claim. Your reasoning was logical and well-structured. To earn 3 points, try including more diverse sources and addressing potential counterarguments."
- "You earned 1 point because your response directly addresses the original point and shows clear reasoning. However, you didn't provide any sources to back up your claims about economic growth, and some of your assertions need fact-checking. Try including links to authoritative sources next time."

Examples of BAD explanations:
- "Good job" (not specific)
- "Your argument needs work" (not actionable)
- "This deserves points because it's well-written" (doesn't explain criteria)

Be STINGY with higher points but always award at least 1 point for any coherent, relevant response. Award 3 points only for responses that demonstrate exceptional research, expert-level knowledge, and comprehensive sourced evidence. Award 2 points only for responses with solid research and strong factual backing. Award 1 point for any response that addresses the original point and is coherent, relevant, and constructive, even if it lacks extensive research or evidence.

Do not include any explanation or additional text, just the JSON object.`;

    const { response, groundingMetadata } = await FirebaseAIService.generateContentWithGrounding(model, prompt);
    const text = response.text();
    
    try {
      // Clean up the response to extract just the JSON
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error('AI response did not contain JSON object:', text);
        throw new Error('No JSON object found in response');
      }
      
      let judgement;
      try {
        judgement = JSON.parse(jsonMatch[0]);
      } catch (parseError) {
        console.error('Failed to parse JSON from AI response:', jsonMatch[0]);
        throw new Error(`JSON parsing failed: ${parseError.message}`);
      }
      
      // Validate and sanitize the structure with defaults
      if (!judgement || typeof judgement !== 'object') {
        console.error('Invalid judgement object:', judgement);
        throw new Error('Invalid judgement structure - not an object');
      }
      
      // Ensure all required properties exist with safe defaults
      const safeJudgement = {
        pointsEarned: 1,
        qualityScore: 'none',
        isFactual: false,
        isCoherent: false,
        isRelevant: false,
        hasEvidence: false,
        isConstructive: false,
        explanation: 'No explanation provided',
        factualConcerns: [],
        strengths: [],
        improvements: [],
        ...judgement
      };
      
      // Validate and fix pointsEarned
      if (typeof safeJudgement.pointsEarned !== 'number' || isNaN(safeJudgement.pointsEarned)) {
        console.warn('Invalid pointsEarned value, defaulting to 1:', safeJudgement.pointsEarned);
        safeJudgement.pointsEarned = 1;
      }
      
      // Ensure points are within valid range (1-3)
      safeJudgement.pointsEarned = Math.max(1, Math.min(3, Math.floor(safeJudgement.pointsEarned)));
      
      // Validate qualityScore
      const validQualityScores = ['exceptional', 'good', 'basic', 'none'];
      if (!validQualityScores.includes(safeJudgement.qualityScore)) {
        console.warn('Invalid qualityScore, defaulting to none:', safeJudgement.qualityScore);
        safeJudgement.qualityScore = 'none';
      }
      
      // Ensure explanation is a string
      if (typeof safeJudgement.explanation !== 'string') {
        console.warn('Invalid explanation type, converting to string:', safeJudgement.explanation);
        safeJudgement.explanation = String(safeJudgement.explanation || 'No explanation provided');
      }
      
      // Ensure arrays are actually arrays
      ['factualConcerns', 'strengths', 'improvements'].forEach(field => {
        if (!Array.isArray(safeJudgement[field])) {
          console.warn(`Invalid ${field} type, defaulting to empty array:`, safeJudgement[field]);
          safeJudgement[field] = [];
        }
      });
      
      // Use the sanitized judgement
      judgement = safeJudgement;
      
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
