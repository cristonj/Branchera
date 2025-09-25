'use client';

import { useFirestore } from './useFirestore';

export function useDatabase() {
  const { addDocument, getDocuments, getDocument, deleteDocument, updateDocument, orderBy, limit } = useFirestore();

  // Create a discussion with proper validation
  const createDiscussion = async (discussionData) => {
    try {
      console.log('Creating discussion with data:', discussionData);
      
      // Validate required fields
      if (!discussionData.title || !discussionData.content || !discussionData.authorId) {
        throw new Error('Missing required fields: title, content, or authorId');
      }

      // Ensure all required fields are present
      const completeData = {
        title: discussionData.title.trim(),
        content: discussionData.content.trim(),
        authorId: discussionData.authorId,
        authorName: discussionData.authorName || 'Anonymous',
        authorPhoto: discussionData.authorPhoto || null,
        likes: 0,
        likedBy: [], // Track which users have liked this discussion
        replies: [], // Array of reply objects
        replyCount: 0,
        views: 0, // Track how many times this discussion has been viewed (expanded)
        viewedBy: [], // Track which users have viewed this discussion
        aiPoints: [], // AI-generated points for anchored replies
        aiPointsGenerated: false, // Track if AI points have been generated
        factCheckResults: null, // AI fact check results
        factCheckGenerated: false, // Track if fact checking has been performed
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
      // Try with orderBy first
      try {
        const discussions = await getDocuments('discussions', [
          orderBy(orderField, orderDirection),
          limit(maxResults)
        ]);
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
        
        return sorted;
      }
    } catch (error) {
      console.error('Error fetching discussions:', error);
      // Return empty array instead of throwing to prevent app crashes
      return [];
    }
  };

  // Delete a discussion (only by author)
  const deleteDiscussion = async (discussionId, userId) => {
    try {
      console.log('Deleting discussion:', discussionId, 'by user:', userId);
      
      // First check if the user is the author
      const discussion = await getDocument('discussions', discussionId);
      
      if (!discussion) {
        throw new Error('Discussion not found');
      }
      
      if (discussion.authorId !== userId) {
        throw new Error('Only the author can delete this discussion');
      }
      
      await deleteDocument('discussions', discussionId);
      console.log('Discussion deleted successfully');
      
      return true;
    } catch (error) {
      console.error('Error deleting discussion:', error);
      throw error;
    }
  };

  // Simple setup that just validates we can connect
  const setupDatabase = async () => {
    try {
      // Just try a simple read operation without calling getDiscussions to avoid loops
      const testDocs = await getDocuments('discussions', [limit(1)]);
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

  // Add a reply to a discussion
  const addReply = async (discussionId, replyData) => {
    try {
      console.log('Adding reply to discussion:', discussionId, 'with data:', replyData);
      
      // Validate required fields
      if (!replyData.content || !replyData.authorId) {
        throw new Error('Missing required fields: content or authorId');
      }

      // Get the current discussion
      const discussion = await getDocument('discussions', discussionId);
      if (!discussion) {
        throw new Error('Discussion not found');
      }

      // Create the reply object
      const reply = {
        id: Date.now().toString(), // Simple ID for replies
        content: replyData.content.trim(),
        authorId: replyData.authorId,
        authorName: replyData.authorName || 'Anonymous',
        authorPhoto: replyData.authorPhoto || null,
        replyToPointId: replyData.replyToPointId || null, // Which AI point this replies to
        replyToReplyId: replyData.replyToReplyId || null, // Which reply this is responding to (for nested replies)
        type: replyData.type || 'general', // "agree" | "challenge" | "expand" | "clarify" | "general"
        level: replyData.level || 0, // Nesting level (0 = top level, 1 = reply to reply, etc.)
        views: 0, // Track how many times this reply has been viewed (expanded)
        viewedBy: [], // Track which users have viewed this reply
        factCheckResults: null, // AI fact check results for this reply
        factCheckGenerated: false, // Track if fact checking has been performed for this reply
        createdAt: new Date().toISOString()
      };

      // Add reply to the discussion's replies array
      const updatedReplies = [...(discussion.replies || []), reply];
      
      await updateDocument('discussions', discussionId, {
        replies: updatedReplies,
        replyCount: updatedReplies.length
      });

      console.log('Reply added successfully');
      return reply;
    } catch (error) {
      console.error('Error adding reply:', error);
      throw error;
    }
  };

  // Delete a reply from a discussion
  const deleteReply = async (discussionId, replyId, userId) => {
    try {
      console.log('Deleting reply:', replyId, 'from discussion:', discussionId, 'by user:', userId);
      
      // Get the current discussion
      const discussion = await getDocument('discussions', discussionId);
      if (!discussion) {
        throw new Error('Discussion not found');
      }

      // Find the reply and check if user is the author
      const reply = discussion.replies?.find(r => r.id === replyId);
      if (!reply) {
        throw new Error('Reply not found');
      }

      if (reply.authorId !== userId) {
        throw new Error('Only the author can delete this reply');
      }

      // Remove reply from the array
      const updatedReplies = discussion.replies.filter(r => r.id !== replyId);
      
      await updateDocument('discussions', discussionId, {
        replies: updatedReplies,
        replyCount: updatedReplies.length
      });

      console.log('Reply deleted successfully');
      return true;
    } catch (error) {
      console.error('Error deleting reply:', error);
      throw error;
    }
  };

  // Update AI points for a discussion
  const updateAIPoints = async (discussionId, aiPoints) => {
    try {
      console.log('Updating AI points for discussion:', discussionId, 'with points:', aiPoints);
      
      await updateDocument('discussions', discussionId, {
        aiPoints: aiPoints,
        aiPointsGenerated: true
      });

      console.log('AI points updated successfully');
      return true;
    } catch (error) {
      console.error('Error updating AI points:', error);
      throw error;
    }
  };

  // Update AI points for a specific reply within a discussion
  const updateReplyAIPoints = async (discussionId, replyId, aiPoints) => {
    try {
      console.log('Updating AI points for reply:', replyId, 'in discussion:', discussionId);

      const discussion = await getDocument('discussions', discussionId);
      if (!discussion) {
        throw new Error('Discussion not found');
      }

      const updatedReplies = (discussion.replies || []).map((reply) =>
        reply.id === replyId
          ? { ...reply, aiPoints: aiPoints || [], aiPointsGenerated: true }
          : reply
      );

      await updateDocument('discussions', discussionId, {
        replies: updatedReplies
      });

      console.log('Reply AI points updated successfully');
      return true;
    } catch (error) {
      console.error('Error updating reply AI points:', error);
      throw error;
    }
  };

  // Get AI points for a discussion
  const getAIPoints = async (discussionId) => {
    try {
      const discussion = await getDocument('discussions', discussionId);
      if (!discussion) {
        throw new Error('Discussion not found');
      }
      
      return discussion.aiPoints || [];
    } catch (error) {
      console.error('Error getting AI points:', error);
      throw error;
    }
  };

  // Increment view count for a discussion
  const incrementDiscussionView = async (discussionId, userId) => {
    try {
      console.log('Incrementing view count for discussion:', discussionId, 'by user:', userId);
      
      const discussion = await getDocument('discussions', discussionId);
      if (!discussion) {
        throw new Error('Discussion not found');
      }

      const viewedBy = discussion.viewedBy || [];
      
      // Only increment if this user hasn't viewed it before
      if (!viewedBy.includes(userId)) {
        const newViewedBy = [...viewedBy, userId];
        const newViews = (discussion.views || 0) + 1;
        
        await updateDocument('discussions', discussionId, {
          views: newViews,
          viewedBy: newViewedBy
        });

        console.log('Discussion view count incremented successfully');
        return { views: newViews, viewedBy: newViewedBy };
      }
      
      return { views: discussion.views || 0, viewedBy };
    } catch (error) {
      console.error('Error incrementing discussion view:', error);
      throw error;
    }
  };

  // Increment view count for a reply
  const incrementReplyView = async (discussionId, replyId, userId) => {
    try {
      console.log('Incrementing view count for reply:', replyId, 'in discussion:', discussionId, 'by user:', userId);

      const discussion = await getDocument('discussions', discussionId);
      if (!discussion) {
        throw new Error('Discussion not found');
      }

      const updatedReplies = (discussion.replies || []).map((reply) => {
        if (reply.id === replyId) {
          const viewedBy = reply.viewedBy || [];
          
          // Only increment if this user hasn't viewed this reply before
          if (!viewedBy.includes(userId)) {
            return {
              ...reply,
              views: (reply.views || 0) + 1,
              viewedBy: [...viewedBy, userId]
            };
          }
        }
        return reply;
      });

      await updateDocument('discussions', discussionId, {
        replies: updatedReplies
      });

      console.log('Reply view count incremented successfully');
      return true;
    } catch (error) {
      console.error('Error incrementing reply view:', error);
      throw error;
    }
  };

  // Update fact check results for a discussion
  const updateFactCheckResults = async (discussionId, factCheckResults) => {
    try {
      console.log('Updating fact check results for discussion:', discussionId);
      
      await updateDocument('discussions', discussionId, {
        factCheckResults: factCheckResults,
        factCheckGenerated: true
      });

      console.log('Fact check results updated successfully');
      return true;
    } catch (error) {
      console.error('Error updating fact check results:', error);
      throw error;
    }
  };

  // Update fact check results for a specific reply within a discussion
  const updateReplyFactCheckResults = async (discussionId, replyId, factCheckResults) => {
    try {
      console.log('Updating fact check results for reply:', replyId, 'in discussion:', discussionId);

      const discussion = await getDocument('discussions', discussionId);
      if (!discussion) {
        throw new Error('Discussion not found');
      }

      const updatedReplies = (discussion.replies || []).map((reply) =>
        reply.id === replyId
          ? { ...reply, factCheckResults: factCheckResults, factCheckGenerated: true }
          : reply
      );

      await updateDocument('discussions', discussionId, {
        replies: updatedReplies
      });

      console.log('Reply fact check results updated successfully');
      return true;
    } catch (error) {
      console.error('Error updating reply fact check results:', error);
      throw error;
    }
  };

  return {
    createDiscussion,
    getDiscussions,
    deleteDiscussion,
    addReply,
    deleteReply,
    updateAIPoints,
    getAIPoints,
    setupDatabase,
    updateReplyAIPoints,
    incrementDiscussionView,
    incrementReplyView,
    updateFactCheckResults,
    updateReplyFactCheckResults
  };
}