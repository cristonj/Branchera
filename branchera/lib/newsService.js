'use client';

import { getAI, getGenerativeModel, GoogleAIBackend } from "firebase/ai";
import { app } from './firebase';

export class NewsService {
  // Check if we should create a new news post (15 minutes since last AI post)
  static async shouldCreateNewsPost(discussions) {
    try {
      console.log('Checking if we should create a news post...');
      
      // Ensure discussions is an array
      if (!Array.isArray(discussions)) {
        console.log('No discussions provided, should create news post');
        return true;
      }
      
      // Find the most recent AI-generated news post
      const aiNewsPosts = discussions.filter(d => 
        d && d.tags && Array.isArray(d.tags) && d.tags.includes('News') && d.authorId === 'ai-news-bot'
      );
      
      if (aiNewsPosts.length === 0) {
        console.log('No previous AI news posts found, should create one');
        return true;
      }
      
      // Get the most recent AI news post
      const lastPost = aiNewsPosts.sort((a, b) => {
        const dateA = new Date(a.createdAt || 0);
        const dateB = new Date(b.createdAt || 0);
        return dateB - dateA;
      })[0];
      
      if (!lastPost || !lastPost.createdAt) {
        console.log('No valid last post found, should create one');
        return true;
      }
      
      const lastPostTime = new Date(lastPost.createdAt);
      const now = new Date();
      const timeDiff = now - lastPostTime;
      const minutesDiff = timeDiff / (1000 * 60);
      
      console.log(`Last AI news post was ${minutesDiff.toFixed(1)} minutes ago`);
      
      return minutesDiff >= 15;
    } catch (error) {
      console.error('Error checking if should create news post:', error);
      // Return false on error to avoid creating posts when there's an issue
      return false;
    }
  }

  // Fetch current news stories
  static async fetchNewsStories() {
    try {
      console.log('Fetching current news stories...');
      
      // Initialize the Firebase AI backend service
      const ai = getAI(app, { backend: new GoogleAIBackend() });
      
      // Create a GenerativeModel instance with Google Search grounding
      const model = getGenerativeModel(ai, { 
        model: "gemini-2.5-flash",
        tools: [{ googleSearch: {} }]
      });

      const prompt = `
Find 5-7 current, significant news stories from the past 24 hours that would generate interesting discussions. Focus on stories that:
- Are factual and verifiable
- Have multiple perspectives or viewpoints
- Are significant enough to warrant discussion
- Cover different topics (politics, technology, science, economics, social issues, etc.)
- Are from reputable news sources

For each story, provide:
- A clear, factual headline
- A brief summary (2-3 sentences)
- The main controversy or discussion points
- Key stakeholders or perspectives involved

Return ONLY a valid JSON array in this format:
[
  {
    "headline": "Clear, factual headline",
    "summary": "Brief 2-3 sentence summary of the story",
    "discussionPoints": ["Point 1 that people debate", "Point 2 that creates discussion", "Point 3 with different perspectives"],
    "stakeholders": ["Group 1", "Group 2", "Group 3"],
    "category": "politics|technology|science|economics|social|international|environment|other"
  }
]

Make sure all stories are current, factual, and from reliable sources. Do not include speculation or unverified claims.`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      try {
        // Clean up the response to extract just the JSON
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (!jsonMatch) {
          throw new Error('No JSON array found in response');
        }
        
        const stories = JSON.parse(jsonMatch[0]);
        
        if (!Array.isArray(stories) || stories.length === 0) {
          throw new Error('Invalid news stories structure');
        }
        
        console.log(`Fetched ${stories.length} news stories`);
        return stories;
      } catch (parseError) {
        console.error('Error parsing news stories response:', parseError);
        console.error('Raw response:', text);
        throw new Error('Failed to parse news stories response');
      }
    } catch (error) {
      console.error('Error fetching news stories:', error);
      throw error;
    }
  }

  // Filter out stories that match existing discussions
  static async filterUniqueStories(stories, existingDiscussions) {
    try {
      console.log('Filtering unique stories from existing discussions...');
      
      // Get titles and content from existing discussions for comparison
      const existingContent = existingDiscussions.map(d => ({
        title: (d.title || '').toLowerCase(),
        content: (d.content || '').toLowerCase()
      }));
      
      // Filter stories that don't match existing discussions
      const uniqueStories = stories.filter(story => {
        const storyTitle = (story.headline || '').toLowerCase();
        const storyContent = (story.summary || '').toLowerCase();
        
        // Check if this story is too similar to existing discussions
        const isSimilar = existingContent.some(existing => {
          // Check for title similarity (simple word matching)
          const titleWords = storyTitle.split(' ').filter(word => word.length > 3);
          const existingTitleWords = existing.title.split(' ').filter(word => word.length > 3);
          const titleOverlap = titleWords.filter(word => 
            existingTitleWords.some(existingWord => 
              existingWord.includes(word) || word.includes(existingWord)
            )
          ).length;
          
          // Check for content similarity
          const contentWords = storyContent.split(' ').filter(word => word.length > 4);
          const existingContentWords = existing.content.split(' ').filter(word => word.length > 4);
          const contentOverlap = contentWords.filter(word => 
            existingContentWords.some(existingWord => 
              existingWord.includes(word) || word.includes(existingWord)
            )
          ).length;
          
          // Consider similar if significant overlap in title or content
          return titleOverlap >= 2 || contentOverlap >= 3;
        });
        
        return !isSimilar;
      });
      
      console.log(`Filtered to ${uniqueStories.length} unique stories`);
      return uniqueStories;
    } catch (error) {
      console.error('Error filtering unique stories:', error);
      return stories; // Return all stories if filtering fails
    }
  }

  // Generate an opinionated discussion post about a news story
  static async generateOpinionatedPost(story) {
    try {
      console.log('Generating opinionated post for story:', story.headline);
      
      // Initialize the Firebase AI backend service
      const ai = getAI(app, { backend: new GoogleAIBackend() });
      
      // Create a GenerativeModel instance with Google Search grounding
      const model = getGenerativeModel(ai, { 
        model: "gemini-2.5-flash",
        tools: [{ googleSearch: {} }]
      });

      const prompt = `
You are an AI discussion moderator creating a CONCISE, focused post about this news story. Your goal is to spark debate with a clear, specific stance.

News Story:
Headline: ${story.headline}
Summary: ${story.summary}
Discussion Points: ${story.discussionPoints.join(', ')}
Category: ${story.category}

Your task:
1. Pick ONE specific, debatable aspect of this story
2. Take a clear position in 2-3 sentences
3. Give ONE strong reason supporting your position
4. End with a direct question that invites challenge

STRICT REQUIREMENTS:
- MAXIMUM 150 words total
- Be DIRECT and SPECIFIC (no fluff or filler)
- Focus on ONE precise claim, not multiple issues
- Use active voice and short sentences
- Write in first person ("I think", "I believe")
- Make ONE clear argument, not several weak ones

BAD example (too long, vague):
"This complex issue has many facets and various stakeholders have different perspectives on the matter, which creates an interesting dynamic that we should all consider carefully..."

GOOD example (concise, specific):
"I think this policy will backfire. Small businesses can't absorb these costs without laying off workers - we saw this exact pattern in Seattle in 2019. Are supporters ignoring the employment data, or do they think this time will be different?"

Return ONLY a valid JSON object in this format:
{
  "title": "Direct title stating your position (under 60 characters)",
  "content": "Your concise post (under 150 words, 2-4 short paragraphs max)",
  "stance": "One sentence describing your position",
  "category": "${story.category}"
}

Make it punchy, specific, and debate-worthy. Cut all unnecessary words.`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      try {
        // Clean up the response to extract just the JSON
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error('No JSON object found in response');
        }
        
        const post = JSON.parse(jsonMatch[0]);
        
        if (!post.title || !post.content || !post.stance) {
          throw new Error('Invalid post structure');
        }
        
        console.log('Generated opinionated post:', post.title);
        return post;
      } catch (parseError) {
        console.error('Error parsing opinionated post response:', parseError);
        console.error('Raw response:', text);
        throw new Error('Failed to parse opinionated post response');
      }
    } catch (error) {
      console.error('Error generating opinionated post:', error);
      throw error;
    }
  }

  // Create a news discussion post
  static async createNewsDiscussion(createDiscussion, updateAIPoints = null, updateFactCheckResults = null) {
    try {
      console.log('Creating AI news discussion...');
      
      // Fetch current news stories
      const stories = await this.fetchNewsStories();
      
      if (stories.length === 0) {
        console.log('No news stories found');
        return null;
      }
      
      // Pick a random story for variety
      const randomStory = stories[Math.floor(Math.random() * stories.length)];
      console.log('Selected story:', randomStory.headline);
      
      // Generate an opinionated post about the story
      const post = await this.generateOpinionatedPost(randomStory);
      
      // Create the discussion
      const discussionData = {
        title: post.title,
        content: post.content,
        authorId: 'ai-news-bot',
        authorName: 'AI News Bot',
        authorPhoto: null,
        tags: ['News', post.category || 'general'],
        metadata: {
          isAIGenerated: true,
          newsStory: {
            headline: randomStory.headline,
            summary: randomStory.summary,
            category: randomStory.category,
            stance: post.stance
          },
          generatedAt: new Date().toISOString()
        }
      };
      
      const discussion = await createDiscussion(discussionData);
      console.log('AI news discussion created successfully:', discussion.id);
      
      // Import AIService to generate points and fact-check results immediately
      const { AIService } = await import('./aiService');
      
      try {
        // Generate AI points immediately for the news post
        console.log('Generating AI points for news discussion...');
        const aiPoints = await AIService.generatePoints(post.content, post.title);
        
        // Update the discussion with AI points in database
        if (aiPoints && aiPoints.length > 0) {
          if (updateAIPoints) {
            await updateAIPoints(discussion.id, aiPoints);
            console.log('AI points saved to database for news discussion');
          }
          discussion.aiPoints = aiPoints;
          discussion.aiPointsGenerated = true;
          console.log('AI points generated for news discussion:', aiPoints.length);
        }
        
        // Generate fact-check results immediately
        console.log('Generating fact-check results for news discussion...');
        const factCheckResults = await AIService.factCheckPoints(aiPoints, post.title);
        
        if (factCheckResults) {
          if (updateFactCheckResults) {
            await updateFactCheckResults(discussion.id, factCheckResults);
            console.log('Fact-check results saved to database for news discussion');
          }
          discussion.factCheckResults = factCheckResults;
          discussion.factCheckGenerated = true;
          console.log('Fact-check results generated for news discussion');
        }
        
      } catch (aiError) {
        console.error('Error generating AI content for news discussion:', aiError);
        // Don't fail the news creation if AI generation fails
      }
      
      return discussion;
    } catch (error) {
      console.error('Error creating news discussion:', error);
      throw error;
    }
  }
}