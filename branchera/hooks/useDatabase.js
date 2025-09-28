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
        tags: discussionData.tags || [],
        metadata: discussionData.metadata || null,
        isActive: true
      };

      const discussionId = await addDocument('discussions', completeData);
      
      return { id: discussionId, ...completeData };
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
        
        // Fallback: get without orderBy and sort client-side
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
      // Return empty array instead of throwing to prevent app crashes
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

  // Set processing flag for AI points generation
  const setProcessingAIPoints = async (discussionId, processing = true) => {
    try {
      await updateDocument('discussions', discussionId, {
        processingAIPoints: processing
      });
      return true;
    } catch (error) {
      throw error;
    }
  };

  // Update AI points for a discussion
  const updateAIPoints = async (discussionId, aiPoints) => {
    try {
      
      await updateDocument('discussions', discussionId, {
        aiPoints: aiPoints,
        aiPointsGenerated: true,
        processingAIPoints: false // Clear processing flag
      });

      return true;
    } catch (error) {
      throw error;
    }
  };

  // Update AI points for a specific reply within a discussion
  const updateReplyAIPoints = async (discussionId, replyId, aiPoints) => {
    try {

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

      return true;
    } catch (error) {
      throw error;
    }
  };

  // Update key points for replying to a specific reply within a discussion
  const updateReplyKeyPoints = async (discussionId, replyId, replyPoints) => {
    try {

      const discussion = await getDocument('discussions', discussionId);
      if (!discussion) {
        throw new Error('Discussion not found');
      }

      const updatedReplies = (discussion.replies || []).map((reply) =>
        reply.id === replyId
          ? { ...reply, replyPoints: replyPoints || [], replyPointsGenerated: true }
          : reply
      );

      await updateDocument('discussions', discussionId, {
        replies: updatedReplies
      });

      return true;
    } catch (error) {
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

  // Set processing flag for fact check generation
  const setProcessingFactCheck = async (discussionId, processing = true) => {
    try {
      await updateDocument('discussions', discussionId, {
        processingFactCheck: processing
      });
      return true;
    } catch (error) {
      throw error;
    }
  };

  // Update fact check results for a discussion
  const updateFactCheckResults = async (discussionId, factCheckResults) => {
    try {
      
      await updateDocument('discussions', discussionId, {
        factCheckResults: factCheckResults,
        factCheckGenerated: true,
        processingFactCheck: false // Clear processing flag
      });

      return true;
    } catch (error) {
      throw error;
    }
  };

  // Update fact check results for a specific reply within a discussion
  const updateReplyFactCheckResults = async (discussionId, replyId, factCheckResults) => {
    try {

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

  // User Points Management
  const createUserPoint = async (pointData) => {
    try {
      
      // Validate required fields
      if (!pointData.userId || !pointData.discussionId || !pointData.originalPoint || !pointData.rebuttal) {
        throw new Error('Missing required fields for user point');
      }

      const completeData = {
        userId: pointData.userId,
        userName: formatNameForLeaderboard(pointData.userName || 'Anonymous User'),
        userPhoto: pointData.userPhoto || null,
        discussionId: pointData.discussionId,
        discussionTitle: pointData.discussionTitle || 'Unknown Discussion',
        originalPoint: pointData.originalPoint,
        originalPointId: pointData.originalPointId,
        rebuttal: pointData.rebuttal,
        pointsEarned: pointData.pointsEarned || 1,
        qualityScore: pointData.qualityScore || 'basic', // 'excellent', 'good', 'fair', 'basic'
        judgeExplanation: pointData.judgeExplanation || '',
        isFactual: pointData.isFactual || false,
        isCoherent: pointData.isCoherent || false,
        earnedAt: new Date().toISOString(),
        createdAt: new Date().toISOString()
      };

      const pointId = await addDocument('userPoints', completeData);
      
      return { id: pointId, ...completeData };
    } catch (error) {
      throw error;
    }
  };

  const getUserPoints = async (userId) => {
    try {
      // Try with orderBy first
      try {
        const points = await getDocuments('userPoints', [
          // Add where clause for userId when available
          orderBy('earnedAt', 'desc'),
          limit(100)
        ]);
        
        // Filter by userId client-side for now
        return points.filter(point => point.userId === userId);
      } catch (orderError) {
        
        // Fallback: get without orderBy and sort client-side
        const points = await getDocuments('userPoints', [limit(100)]);
        const userPoints = points.filter(point => point.userId === userId);
        
        return userPoints.sort((a, b) => new Date(b.earnedAt) - new Date(a.earnedAt));
      }
    } catch (error) {
      return [];
    }
  };

  const getUserPointsForDiscussion = async (userId, discussionId) => {
    try {
      const allPoints = await getUserPoints(userId);
      return allPoints.filter(point => point.discussionId === discussionId);
    } catch (error) {
      return [];
    }
  };

  const hasUserEarnedPointsForDiscussion = async (userId, discussionId) => {
    try {
      const points = await getUserPointsForDiscussion(userId, discussionId);
      return points.length > 0;
    } catch (error) {
      return false;
    }
  };

  // Enrich replies with points earned by user
  const enrichRepliesWithPoints = async (replies, userId) => {
    if (!replies || !userId) return replies;
    
    try {
      const userPoints = await getUserPoints(userId);
      const pointsByReplyId = new Map();
      
      // Create a map of reply IDs to points earned
      userPoints.forEach(point => {
        if (point.replyId && point.pointsEarned) {
          pointsByReplyId.set(point.replyId, point.pointsEarned);
        }
      });
      
      // Enrich replies with points data
      return replies.map(reply => ({
        ...reply,
        pointsEarnedByUser: pointsByReplyId.get(reply.id) || null
      }));
    } catch (error) {
      return replies;
    }
  };

  // Check if user has collected a specific AI point
  const hasUserCollectedPoint = async (userId, discussionId, originalPointId) => {
    try {
      const points = await getUserPointsForDiscussion(userId, discussionId);
      return points.some(point => point.originalPointId === originalPointId);
    } catch (error) {
      return false;
    }
  };

  // Get all users and their total points for leaderboard
  const getLeaderboard = async () => {
    try {
      const allPoints = await getDocuments('userPoints', [limit(1000)]);
      
      // Group points by user
      const userPointsMap = new Map();
      allPoints.forEach(point => {
        const userId = point.userId;
        if (!userPointsMap.has(userId)) {
          userPointsMap.set(userId, {
            userId: userId,
            userName: 'Loading...', // Will be updated with actual display name
            userPhoto: point.userPhoto || null,
            totalPoints: 0,
            pointCount: 0,
            lastEarned: null
          });
        }
        
        const userData = userPointsMap.get(userId);
        userData.totalPoints += point.pointsEarned || 1;
        userData.pointCount += 1;
        
        if (!userData.lastEarned || new Date(point.earnedAt) > new Date(userData.lastEarned)) {
          userData.lastEarned = point.earnedAt;
        }
      });
      
      // Get all user profiles to fetch current display names
      const userProfiles = await getDocuments('userProfiles', [limit(1000)]);
      const profilesMap = new Map();
      userProfiles.forEach(profile => {
        profilesMap.set(profile.userId, profile);
      });
      
      // Update user names with current display names from profiles
      userPointsMap.forEach((userData, userId) => {
        const profile = profilesMap.get(userId);
        let displayName = 'Anonymous User'; // Default fallback
        
        if (profile && profile.displayName) {
          // Use custom display name if set
          displayName = profile.displayName;
        }
        
        userData.userName = formatNameForLeaderboard(displayName);
      });
      
      // Convert to array and sort by total points
      const leaderboard = Array.from(userPointsMap.values())
        .sort((a, b) => b.totalPoints - a.totalPoints);
      
      return leaderboard;
    } catch (error) {
      return [];
    }
  };

  // Get point counts for AI points (how many users earned points for each point)
  const getPointCounts = async () => {
    try {
      const allPoints = await getDocuments('userPoints', [limit(1000)]);
      
      // Group by discussion and original point ID
      const pointCountsMap = new Map();
      allPoints.forEach(point => {
        if (point.originalPointId) {
          const pointKey = `${point.discussionId}-${point.originalPointId}`;
          const currentCount = pointCountsMap.get(pointKey) || 0;
          pointCountsMap.set(pointKey, currentCount + 1);
        }
      });
      
      return pointCountsMap;
    } catch (error) {
      return new Map();
    }
  };

  return {
    createDiscussion,
    getDiscussions,
    deleteDiscussion,
    editDiscussion,
    addReply,
    deleteReply,
    editReply,
    updateAIPoints,
    getAIPoints,
    setupDatabase,
    updateReplyAIPoints,
    updateReplyKeyPoints,
    incrementDiscussionView,
    incrementReplyView,
    updateFactCheckResults,
    updateReplyFactCheckResults,
    setProcessingAIPoints,
    setProcessingFactCheck,
    createUserPoint,
    getUserPoints,
    updateDocument,
    getUserPointsForDiscussion,
    hasUserEarnedPointsForDiscussion,
    enrichRepliesWithPoints,
    hasUserCollectedPoint,
    getLeaderboard,
    getPointCounts
  };
}