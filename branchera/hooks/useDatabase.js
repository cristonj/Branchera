'use client';

import { useFirestore } from './useFirestore';

export function useDatabase() {
  const { addDocument, getDocuments, getDocument, deleteDocument, updateDocument, orderBy, limit, startAfter } = useFirestore();

  // Helper function to format names as "First Name Last Initial"
  const formatNameForLeaderboard = (fullName) => {
    if (!fullName || fullName === 'Anonymous User') return 'Anonymous User';
    
    const nameParts = fullName.trim().split(' ');
    if (nameParts.length === 1) {
      // If only one name part, return it as is
      return nameParts[0];
    }
    
    const firstName = nameParts[0];
    const lastName = nameParts[nameParts.length - 1];
    const lastInitial = lastName.charAt(0).toUpperCase();
    
    return `${firstName} ${lastInitial}.`;
  };

  // Create a discussion with proper validation
  const createDiscussion = async (discussionData) => {
    try {

      // Validate required fields
      if (!discussionData.title || !discussionData.content || !discussionData.authorId) {
        throw new Error('Missing required fields: title, content, or authorId');
      }

      // Import slug utility
      const { generateUniqueSlug } = await import('@/lib/slugUtils');
      
      // Generate a temporary slug (will be updated with final one after getting doc ID)
      const tempSlug = generateUniqueSlug(discussionData.title);

      // Ensure all required fields are present
      const completeData = {
        title: discussionData.title.trim(),
        content: discussionData.content.trim(),
        slug: tempSlug, // Temporary slug, will be updated
        authorId: discussionData.authorId,
        authorName: discussionData.authorName || 'Anonymous',
        authorPhoto: discussionData.authorPhoto || null,
        likes: 0,
        likedBy: [], // Track which users have liked this discussion
        replies: [], // Array of reply objects
        replyCount: 0,
        views: 0, // Track how many times this discussion has been viewed (expanded)
        viewedBy: [], // Track which users have viewed this discussion
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        // Add metadata for better querying
        tags: discussionData.tags || [],
        metadata: discussionData.metadata || null,
        isActive: true
      };

      const discussionId = await addDocument('discussions', completeData);
      
      // Generate final unique slug with discussion ID
      const finalSlug = generateUniqueSlug(discussionData.title, discussionId);
      
      // Update the discussion with the final slug
      await updateDocument('discussions', discussionId, { slug: finalSlug });

      return { id: discussionId, ...completeData, slug: finalSlug };
    } catch (error) {
      throw error;
    }
  };

  // Get discussions with fallback strategies
  const getDiscussions = async (options = {}) => {
    const { 
      limit: maxResults = 20, 
      orderField = 'createdAt', 
      orderDirection = 'desc',
      lastDoc = null // For pagination
    } = options;
    
    try {
      // Try with orderBy first
      try {
        const queryConstraints = [
          orderBy(orderField, orderDirection),
          limit(maxResults)
        ];
        
        // Add startAfter for pagination if lastDoc is provided
        if (lastDoc) {
          queryConstraints.push(startAfter(lastDoc));
        }
        
        const discussions = await getDocuments('discussions', queryConstraints);
        return discussions;
      } catch (orderError) {
        // Check if this is an index-related error
        if (orderError.code === 'failed-precondition' || 
            orderError.message?.includes('index') || 
            orderError.message?.includes('The query requires an index')) {
          // Re-throw index errors so they can be properly displayed to the user
          throw new Error(`Firebase index required: ${orderError.message}. Please create the required index in your Firebase Console. Go to Firestore Database → Indexes and create an index for the 'discussions' collection with fields: ${orderField} (${orderDirection}).`);
        }
        
        // For other errors, fall back to client-side sorting
        console.warn('OrderBy query failed, falling back to client-side sorting:', orderError);
        
        const queryConstraints = [limit(maxResults)];
        
        // Note: startAfter won't work without orderBy, so we'll skip pagination in fallback
        if (!lastDoc) {
          const discussions = await getDocuments('discussions', queryConstraints);
          const sorted = discussions.sort((a, b) => {
            const dateA = new Date(a[orderField] || a.createdAt);
            const dateB = new Date(b[orderField] || b.createdAt);
            return orderDirection === 'desc' ? dateB - dateA : dateA - dateB;
          });
          
          return sorted;
        } else {
          // For pagination fallback, we'll need to get more docs and filter client-side
          // This is less efficient but ensures pagination works
          const discussions = await getDocuments('discussions', [limit(maxResults * 3)]);
          const sorted = discussions.sort((a, b) => {
            const dateA = new Date(a[orderField] || a.createdAt);
            const dateB = new Date(b[orderField] || b.createdAt);
            return orderDirection === 'desc' ? dateB - dateA : dateA - dateB;
          });
          
          // Find the index of the lastDoc and return the next batch
          const lastDocIndex = sorted.findIndex(doc => doc.id === lastDoc.id);
          if (lastDocIndex >= 0) {
            return sorted.slice(lastDocIndex + 1, lastDocIndex + 1 + maxResults);
          }
          
          return [];
        }
      }
    } catch (error) {
      // Check if this is an index-related error that should be shown to the user
      if (error.message?.includes('Firebase index required')) {
        throw error; // Re-throw index errors so they can be displayed
      }
      
      // For other errors, return empty array to prevent app crashes
      console.error('Error loading discussions:', error);
      return [];
    }
  };

  // Delete a discussion (only by author)
  const deleteDiscussion = async (discussionId, userId) => {
    try {
      
      // First check if the user is the author
      const discussion = await getDocument('discussions', discussionId);
      
      if (!discussion) {
        throw new Error('Discussion not found');
      }
      
      if (discussion.authorId !== userId) {
        throw new Error('Only the author can delete this discussion');
      }
      
      await deleteDocument('discussions', discussionId);
      
      return true;
    } catch (error) {
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
        replyToReplyId: replyData.replyToReplyId || null, // Which reply this is responding to (for nested replies)
        createdAt: new Date().toISOString()
      };

      // Add reply to the discussion's replies array
      const updatedReplies = [...(discussion.replies || []), reply];

      await updateDocument('discussions', discussionId, {
        replies: updatedReplies,
        replyCount: updatedReplies.length
      });

      return reply;
    } catch (error) {
      throw error;
    }
  };

  // Delete a reply from a discussion
  const deleteReply = async (discussionId, replyId, userId) => {
    try {
      
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

      return true;
    } catch (error) {
      throw error;
    }
  };



  // Increment view count for a discussion
  const incrementDiscussionView = async (discussionId, userId) => {
    try {
      
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

        return { views: newViews, viewedBy: newViewedBy };
      }
      
      return { views: discussion.views || 0, viewedBy };
    } catch (error) {
      throw error;
    }
  };

  // Increment view count for a reply
  const incrementReplyView = async (discussionId, replyId, userId) => {
    try {

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

      return true;
    } catch (error) {
      throw error;
    }
  };



  // Edit a discussion (only by author)
  const editDiscussion = async (discussionId, userId, updatedData) => {
    try {
      
      // First check if the user is the author
      const discussion = await getDocument('discussions', discussionId);
      
      if (!discussion) {
        throw new Error('Discussion not found');
      }
      
      if (discussion.authorId !== userId) {
        throw new Error('Only the author can edit this discussion');
      }
      
      // Validate required fields
      if (!updatedData.title || !updatedData.content) {
        throw new Error('Title and content are required');
      }
      
      const updatePayload = {
        title: updatedData.title.trim(),
        content: updatedData.content.trim(),
        editedAt: new Date().toISOString(),
        isEdited: true
      };
      
      await updateDocument('discussions', discussionId, updatePayload);
      
      return { ...discussion, ...updatePayload };
    } catch (error) {
      throw error;
    }
  };

  // Edit a reply (only by author)
  const editReply = async (discussionId, replyId, userId, updatedContent) => {
    try {
      
      // Get the current discussion
      const discussion = await getDocument('discussions', discussionId);
      if (!discussion) {
        throw new Error('Discussion not found');
      }

      // Find the reply and check if user is the author
      const replyIndex = discussion.replies?.findIndex(r => r.id === replyId);
      if (replyIndex === -1) {
        throw new Error('Reply not found');
      }

      const reply = discussion.replies[replyIndex];
      if (reply.authorId !== userId) {
        throw new Error('Only the author can edit this reply');
      }

      // Validate content
      if (!updatedContent || !updatedContent.trim()) {
        throw new Error('Reply content cannot be empty');
      }

      // Update reply in the array
      const updatedReplies = [...discussion.replies];
      updatedReplies[replyIndex] = {
        ...reply,
        content: updatedContent.trim(),
        editedAt: new Date().toISOString(),
        isEdited: true
      };
      
      await updateDocument('discussions', discussionId, {
        replies: updatedReplies
      });

      return updatedReplies[replyIndex];
    } catch (error) {
      throw error;
    }
  };

  // Get a discussion by its slug
  const getDiscussionBySlug = async (slug) => {
    try {
      if (!slug) {
        throw new Error('Slug is required');
      }
      
      // Query discussions by slug field
      const discussions = await getDocuments('discussions', []);
      
      // Find discussion with matching slug
      const discussion = discussions.find(d => d.slug === slug);
      
      if (!discussion) {
        return null;
      }
      
      return discussion;
    } catch (error) {
      console.error('Error getting discussion by slug:', error);
      return null;
    }
  };

  return {
    createDiscussion,
    getDiscussions,
    getDiscussionBySlug,
    deleteDiscussion,
    editDiscussion,
    addReply,
    deleteReply,
    editReply,
    incrementDiscussionView,
    setupDatabase,
    updateDocument
  };
}