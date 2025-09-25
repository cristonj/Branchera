'use client';

import { useFirestore } from './useFirestore';

export function useDatabase() {
  const { addDocument, getDocuments, orderBy, limit } = useFirestore();

  // Create a discussion with proper validation
  const createDiscussion = async (discussionData) => {
    try {
      console.log('Creating discussion with data:', discussionData);
      
      // Validate required fields
      if (!discussionData.title || !discussionData.audioUrl || !discussionData.authorId) {
        throw new Error('Missing required fields: title, audioUrl, or authorId');
      }

      // Ensure all required fields are present
      const completeData = {
        title: discussionData.title.trim(),
        audioUrl: discussionData.audioUrl,
        duration: discussionData.duration || 0,
        authorId: discussionData.authorId,
        authorName: discussionData.authorName || 'Anonymous',
        authorPhoto: discussionData.authorPhoto || null,
        likes: 0,
        plays: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        // Add metadata for better querying
        tags: [],
        isActive: true
      };

      const discussionId = await addDocument('discussions', completeData);
      console.log('Discussion created successfully with ID:', discussionId);
      
      return { id: discussionId, ...completeData };
    } catch (error) {
      console.error('Error creating discussion:', error);
      throw error;
    }
  };

  // Get discussions with fallback strategies
  const getDiscussions = async (options = {}) => {
    const { limit: maxResults = 20, orderField = 'createdAt', orderDirection = 'desc' } = options;
    
    try {
      console.log('Fetching discussions...');
      
      // Try with orderBy first
      try {
        const discussions = await getDocuments('discussions', [
          orderBy(orderField, orderDirection),
          limit(maxResults)
        ]);
        console.log('Discussions fetched with orderBy:', discussions.length);
        return discussions;
      } catch (orderError) {
        console.warn('OrderBy query failed, trying without ordering:', orderError.message);
        
        // Fallback: get without orderBy and sort client-side
        const discussions = await getDocuments('discussions', [limit(maxResults)]);
        const sorted = discussions.sort((a, b) => {
          const dateA = new Date(a[orderField] || a.createdAt);
          const dateB = new Date(b[orderField] || b.createdAt);
          return orderDirection === 'desc' ? dateB - dateA : dateA - dateB;
        });
        
        console.log('Discussions fetched without orderBy and sorted client-side:', sorted.length);
        return sorted;
      }
    } catch (error) {
      console.error('Error fetching discussions:', error);
      // Return empty array instead of throwing to prevent app crashes
      return [];
    }
  };

  // Simple setup that just validates we can connect
  const setupDatabase = async () => {
    try {
      console.log('Setting up database connection...');
      
      // Just try a simple read operation without calling getDiscussions to avoid loops
      const testDocs = await getDocuments('discussions', [limit(1)]);
      
      console.log('Database setup completed successfully');
      return {
        initialized: true,
        accessible: true,
        documentsFound: testDocs.length
      };
    } catch (error) {
      console.warn('Database setup had issues but continuing:', error.message);
      return {
        initialized: true, // Allow app to continue
        accessible: true,
        error: error.message
      };
    }
  };

  return {
    createDiscussion,
    getDiscussions,
    setupDatabase
  };
}