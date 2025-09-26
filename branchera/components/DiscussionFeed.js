'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import { useFirestore } from '@/hooks/useFirestore';
import { useDatabase } from '@/hooks/useDatabase';
import { useAuth } from '@/contexts/AuthContext';
import TextReplyForm from './TextReplyForm';
import ReplyTree from './ReplyTree';
import FactCheckResults from './FactCheckResults';
import SearchFilterSort from './SearchFilterSort';
import SearchHighlight from './SearchHighlight';
import EditDiscussionForm from './EditDiscussionForm';
import { AIService } from '@/lib/aiService';
import { usePolling } from '@/hooks/usePolling';
import { REALTIME_CONFIG } from '@/lib/realtimeConfig';
import { NewsService } from '@/lib/newsService';
import { useToast } from '@/contexts/ToastContext';

export default function DiscussionFeed({ newDiscussion, onStartDiscussion }) {
  const [discussions, setDiscussions] = useState([]);
  const [filteredDiscussions, setFilteredDiscussions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replyingTo, setReplyingTo] = useState(null); // Track which discussion is being replied to
  const [expandedReplies, setExpandedReplies] = useState(new Set()); // Track which discussions have expanded replies
  const [expandedDiscussions, setExpandedDiscussions] = useState(new Set()); // Track expanded discussion cards
  const [expandedAIPoints, setExpandedAIPoints] = useState(new Set()); // Track expanded AI points sections
  const [selectedDiscussion, setSelectedDiscussion] = useState(null); // Discussion for point selection
  const [selectedPoint, setSelectedPoint] = useState(null); // Selected AI point for reply
  const [selectedReplyType, setSelectedReplyType] = useState('general'); // Selected reply type
  const [replyingToReply, setReplyingToReply] = useState(null); // Reply being replied to (for nested replies)
  const [selectedReplyForPoints, setSelectedReplyForPoints] = useState(null); // Reply context for AI points
  const [editingDiscussion, setEditingDiscussion] = useState(null); // Discussion being edited
  const [searchQuery, setSearchQuery] = useState('');
  const [currentSearchType, setCurrentSearchType] = useState('all');
  const [currentFilters, setCurrentFilters] = useState({
    hasReplies: false,
    hasFactCheck: false,
    showNewsOnly: false,
    dateRange: 'all',
    author: '',
    minLikes: 0,
    minViews: 0
  });
  const [currentSort, setCurrentSort] = useState('newest');
  const [isUserSearching, setIsUserSearching] = useState(false);
  const [collectedPoints, setCollectedPoints] = useState(new Map()); // Track which points user has collected
  const [pointCounts, setPointCounts] = useState(new Map()); // Track how many points earned for each AI point
  const searchTimeoutRef = useRef(null);
  
  const { updateDocument } = useFirestore();
  const { getDiscussions, deleteDiscussion, deleteReply, editDiscussion, updateAIPoints, updateReplyAIPoints, incrementDiscussionView, incrementReplyView, updateFactCheckResults, updateReplyFactCheckResults, hasUserCollectedPoint, createUserPoint, getUserPoints, getPointCounts, createDiscussion } = useDatabase();
  const { user } = useAuth();
  const { showSuccessToast, showErrorToast } = useToast();

  const loadCollectedPoints = useCallback(async () => {
    if (!user) return;
    
    try {
      // Load all user's points to show visual indicators
      const userPoints = await getUserPoints(user.uid);
      const collected = new Map();
      
      // For each point, create a key to track collection status
      userPoints.forEach(point => {
        if (point.originalPointId) {
          const pointKey = `${point.discussionId}-${point.originalPointId}`;
          collected.set(pointKey, true);
        }
      });
      
      setCollectedPoints(collected);
      console.log('Loaded collected points:', collected.size);
    } catch (error) {
      console.error('Error loading collected points:', error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Remove dependencies to prevent constant refreshes

  const loadPointCounts = useCallback(async () => {
    try {
      // Load point counts for all AI points
      const counts = await getPointCounts();
      setPointCounts(counts);
      console.log('Loaded point counts:', counts.size);
    } catch (error) {
      console.error('Error loading point counts:', error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Remove dependencies to prevent constant refreshes

  const loadDiscussions = useCallback(async () => {
    try {
      setLoading(true);
      // Load discussions directly without setup
      const discussionsData = await getDiscussions({
        limit: 20,
        orderField: 'createdAt',
        orderDirection: 'desc'
      });
      setDiscussions(discussionsData);
      
      // Generate AI points and fact-check results for older discussions that don't have them
      discussionsData.forEach(discussion => {
        if (!discussion.aiPointsGenerated && (!discussion.aiPoints || discussion.aiPoints.length === 0)) {
          generateAIPointsForDiscussion(discussion);
        }
        if (!discussion.factCheckGenerated && !discussion.factCheckResults) {
          generateFactCheckForDiscussion(discussion);
        }
      });
      
      // Check if we should create an auto-news post (non-blocking, after page loads)
      setTimeout(() => {
        checkAndCreateNewsPost(discussionsData);
      }, 100);
      
    } catch (error) {
      console.error('Error loading discussions:', error);
      // Set empty array to prevent crashes
      setDiscussions([]);
    } finally {
      setLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Check if we should create a news post and create one if needed (non-blocking)
  const checkAndCreateNewsPost = useCallback(async (discussionsData) => {
    // Wrap everything in a try-catch to ensure this never blocks the UI
    try {
      console.log('Checking if we should create an AI news post...');
      
      // Only check if we have user context (don't create posts for anonymous users)
      if (!user) {
        console.log('No user logged in, skipping news post check');
        return;
      }
      
      // Add a timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('News post creation timeout')), 30000)
      );
      
      const shouldCreatePromise = NewsService.shouldCreateNewsPost(discussionsData);
      
      const shouldCreate = await Promise.race([shouldCreatePromise, timeoutPromise]);
      
      if (shouldCreate) {
        console.log('Creating AI news post...');
        
        // Create news post with timeout protection
        const createNewsPromise = NewsService.createNewsDiscussion(createDiscussion);
        const newsDiscussion = await Promise.race([createNewsPromise, timeoutPromise]);
        
        if (newsDiscussion) {
          console.log('AI news post created successfully:', newsDiscussion.title);
          
          // Add the new discussion to the current list
          setDiscussions(prev => [newsDiscussion, ...prev]);
          
          // Optional: refresh discussions after a delay (don't await this)
          setTimeout(() => {
            loadDiscussions().catch(err => console.error('Error refreshing after news post:', err));
          }, 2000);
        }
      } else {
        console.log('No need to create AI news post at this time');
      }
    } catch (error) {
      console.error('Error in news post creation (non-blocking):', error);
      // This is intentionally non-blocking - errors here should never affect the main UI
    }
  }, [user, createDiscussion, loadDiscussions]);

  useEffect(() => {
    loadDiscussions();
  }, [loadDiscussions]); // Include loadDiscussions dependency

  // Load collected points and point counts separately to avoid refresh loops
  useEffect(() => {
    if (user) {
      loadCollectedPoints();
    }
    loadPointCounts(); // Load point counts for all users
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid]); // Only load when user ID changes

  // Silent refresh without showing loading skeleton to avoid flicker during polling
  const refreshDiscussions = useCallback(async () => {
    // Don't refresh if user is actively searching
    if (isUserSearching) {
      console.log('Skipping refresh - user is searching');
      return;
    }
    
    try {
      const discussionsData = await getDiscussions({
        limit: 20,
        orderField: 'createdAt',
        orderDirection: 'desc'
      });
      
      // Merge fresh data with existing state to prevent duplicates
      setDiscussions(prev => {
        const updatedDiscussions = discussionsData.map(freshDiscussion => {
          const existingDiscussion = prev.find(d => d.id === freshDiscussion.id);
          
          if (existingDiscussion) {
            // Merge replies, removing duplicates by ID
            const existingReplies = existingDiscussion.replies || [];
            const freshReplies = freshDiscussion.replies || [];
            
            // Create a map of existing replies for quick lookup
            const existingRepliesMap = new Map(existingReplies.map(r => [r.id, r]));
            
            // Merge replies, preferring existing ones to maintain local updates
            const mergedReplies = [...existingReplies];
            freshReplies.forEach(freshReply => {
              if (!existingRepliesMap.has(freshReply.id)) {
                mergedReplies.push(freshReply);
              }
            });
            
            return {
              ...freshDiscussion,
              replies: mergedReplies,
              replyCount: mergedReplies.length
            };
          }
          
          return freshDiscussion;
        });
        
        // Add any discussions that exist locally but not in fresh data
        const freshIds = new Set(discussionsData.map(d => d.id));
        const localOnlyDiscussions = prev.filter(d => !freshIds.has(d.id));
        
        return [...updatedDiscussions, ...localOnlyDiscussions];
      });
    } catch (error) {
      console.error('Background refresh failed:', error);
    }
  }, [isUserSearching, getDiscussions]);

  // Poll for near-realtime updates, but pause when user is actively searching
  usePolling(
    refreshDiscussions,
    REALTIME_CONFIG.pollingIntervalMs,
    { enabled: !isUserSearching, immediate: false, pauseOnHidden: REALTIME_CONFIG.pauseOnHidden }
  );

  // Add new discussion to the top of the feed when created
  useEffect(() => {
    if (newDiscussion) {
      setDiscussions(prev => {
        // Check if discussion already exists to prevent duplicates
        const existsIndex = prev.findIndex(d => d.id === newDiscussion.id);
        if (existsIndex !== -1) {
          // Update existing discussion with new data
          const updated = [...prev];
          updated[existsIndex] = newDiscussion;
          return updated;
        } else {
          // Add new discussion to the top
          return [newDiscussion, ...prev];
        }
      });
      // Refresh point counts to show new points earned
      loadPointCounts();
    }
  }, [newDiscussion, loadPointCounts]);

  // Function to refresh point counts and collected points (called after earning points)
  const refreshPointsData = useCallback(() => {
    if (user) {
      loadCollectedPoints();
    }
    loadPointCounts();
  }, [user, loadCollectedPoints, loadPointCounts]);

  // Initialize filtered discussions when discussions change
  useEffect(() => {
    setFilteredDiscussions(discussions);
  }, [discussions]);

  // Handle search query changes and manage searching state
  const handleSearchChange = useCallback((query) => {
    // Prevent duplicate calls with the same query
    if (query === searchQuery) {
      return;
    }
    
    setSearchQuery(query);
    
    // Clear any existing timeout since we're removing the timeout mechanism
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
      searchTimeoutRef.current = null;
    }
    
    if (query.trim()) {
      // User is searching - pause polling until search is cleared
      console.log('User started searching:', query, '- polling paused');
      setIsUserSearching(true);
    } else {
      // Search cleared - resume polling
      console.log('Search cleared, resuming polling');
      setIsUserSearching(false);
    }
  }, [searchQuery]);

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
        searchTimeoutRef.current = null;
      }
    };
  }, []);

  // Generate AI points for a discussion
  const generateAIPointsForDiscussion = async (discussion) => {
    try {
      if (discussion.aiPointsGenerated || (discussion.aiPoints && discussion.aiPoints.length > 0)) {
        return; // Already has points
      }

      console.log('Generating AI points for discussion:', discussion.id);
      const aiPoints = await AIService.generatePoints(discussion.content, discussion.title);
      
      // Update discussion in database
      await updateAIPoints(discussion.id, aiPoints);
      
      // Update local state
      setDiscussions(prev =>
        prev.map(d =>
          d.id === discussion.id 
            ? { ...d, aiPoints, aiPointsGenerated: true }
            : d
        )
      );
      
      console.log('AI points generated successfully for discussion:', discussion.id);
    } catch (error) {
      console.error('Error generating AI points for discussion:', discussion.id, error);
    }
  };

  // Generate fact-check results for a discussion based on its AI points
  const generateFactCheckForDiscussion = async (discussion) => {
    try {
      if (discussion.factCheckGenerated || discussion.factCheckResults) {
        return; // Already has fact-check results
      }

      console.log('Generating fact-check results for discussion:', discussion.id);
      
      // If discussion has AI points, use them for fact checking
      if (discussion.aiPoints && discussion.aiPoints.length > 0) {
        console.log('Using AI points for fact checking discussion:', discussion.id);
        const factCheckResults = await AIService.factCheckPoints(discussion.aiPoints, discussion.title);
        
        // Update discussion in database
        await updateFactCheckResults(discussion.id, factCheckResults);
        
        // Update local state
        setDiscussions(prev =>
          prev.map(d =>
            d.id === discussion.id 
              ? { ...d, factCheckResults, factCheckGenerated: true }
              : d
          )
        );
        
        console.log('Fact-check results generated successfully for discussion using points:', discussion.id);
      } else {
        // Fallback to content-based fact checking if no points available
        console.log('No AI points available, falling back to content-based fact checking for discussion:', discussion.id);
        const factCheckResults = await AIService.factCheckContent(discussion.content, discussion.title);
        
        // Update discussion in database
        await updateFactCheckResults(discussion.id, factCheckResults);
        
        // Update local state
        setDiscussions(prev =>
          prev.map(d =>
            d.id === discussion.id 
              ? { ...d, factCheckResults, factCheckGenerated: true }
              : d
          )
        );
        
        console.log('Fact-check results generated successfully for discussion using content fallback:', discussion.id);
      }
    } catch (error) {
      console.error('Error generating fact-check results for discussion:', discussion.id, error);
    }
  };

  // Generate fact-check results for replies that don't have them based on points
  const generateFactCheckForReplies = async (discussionId, replies) => {
    try {
      const repliesToUpdate = replies.filter(reply => 
        !reply.factCheckGenerated && !reply.factCheckResults && reply.content && reply.content.trim()
      );

      if (repliesToUpdate.length === 0) return;

      console.log(`Generating fact-check results for ${repliesToUpdate.length} replies in discussion:`, discussionId);

      // Process replies in parallel
      const factCheckPromises = repliesToUpdate.map(async (reply) => {
        try {
          // First generate points for the reply content
          console.log('Generating points for reply:', reply.id);
          const replyPoints = await AIService.generateReplyPoints(reply.content, '');
          
          // Then fact check based on those points
          console.log('Fact checking reply based on points:', reply.id);
          const factCheckResults = await AIService.factCheckPoints(replyPoints, 'Reply');
          
          await updateReplyFactCheckResults(discussionId, reply.id, factCheckResults);
          return { replyId: reply.id, factCheckResults };
        } catch (error) {
          console.error('Error generating fact-check for reply:', reply.id, error);
          
          // Fallback to content-based fact checking if points generation fails
          try {
            console.log('Falling back to content-based fact checking for reply:', reply.id);
            const factCheckResults = await AIService.factCheckContent(reply.content, 'Reply');
            await updateReplyFactCheckResults(discussionId, reply.id, factCheckResults);
            return { replyId: reply.id, factCheckResults };
          } catch (fallbackError) {
            console.error('Error with fallback fact-check for reply:', reply.id, fallbackError);
            return { replyId: reply.id, error: fallbackError };
          }
        }
      });

      const results = await Promise.all(factCheckPromises);

      // Update local state with the new fact-check results
      setDiscussions(prev =>
        prev.map(d =>
          d.id === discussionId
            ? {
                ...d,
                replies: (d.replies || []).map(reply => {
                  const result = results.find(r => r.replyId === reply.id);
                  if (result && result.factCheckResults) {
                    return { ...reply, factCheckResults: result.factCheckResults, factCheckGenerated: true };
                  }
                  return reply;
                })
              }
            : d
        )
      );

      console.log('Fact-check results generated for replies in discussion:', discussionId);
    } catch (error) {
      console.error('Error generating fact-check results for replies:', error);
    }
  };

  // Remove handlePlay function as it's no longer needed for text-based discussions

  const handleLike = async (discussionId) => {
    try {
      if (!user) return;
      
      const discussion = discussions.find(d => d.id === discussionId);
      if (discussion) {
        const likedBy = discussion.likedBy || [];
        const hasLiked = likedBy.includes(user.uid);
        
        let newLikedBy, newLikes;
        
        if (hasLiked) {
          // Remove like
          newLikedBy = likedBy.filter(uid => uid !== user.uid);
          newLikes = Math.max(0, (discussion.likes || 0) - 1);
        } else {
          // Add like
          newLikedBy = [...likedBy, user.uid];
          newLikes = (discussion.likes || 0) + 1;
        }
        
        await updateDocument('discussions', discussionId, { 
          likes: newLikes,
          likedBy: newLikedBy
        });
        
        // Update local state
        setDiscussions(prev =>
          prev.map(d =>
            d.id === discussionId ? { ...d, likes: newLikes, likedBy: newLikedBy } : d
          )
        );
      }
    } catch (error) {
      console.error('Error updating like count:', error);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now - date) / (1000 * 60));
      return diffInMinutes <= 1 ? 'Just now' : `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d ago`;
    }
  };

  // Remove formatDuration function as it's no longer needed for text-based discussions

  const handleDelete = async (discussionId) => {
    if (!user) return;
    
    const confirmed = window.confirm('Are you sure you want to delete this discussion? This action cannot be undone.');
    if (!confirmed) return;
    
    try {
      await deleteDiscussion(discussionId, user.uid);
      
      // Remove from local state
      setDiscussions(prev => prev.filter(d => d.id !== discussionId));
      
      showSuccessToast('Discussion deleted successfully');
      console.log('Discussion deleted successfully');
    } catch (error) {
      console.error('Error deleting discussion:', error);
      showErrorToast(error.message || 'Failed to delete discussion');
    }
  };

  const handleEditDiscussion = (discussion) => {
    if (!user || discussion.authorId !== user.uid) return;
    
    setEditingDiscussion(discussion);
    // Close any open reply forms
    setReplyingTo(null);
    setSelectedPoint(null);
    setSelectedReplyType('general');
    setReplyingToReply(null);
    setSelectedReplyForPoints(null);
  };

  const handleEditComplete = (updatedDiscussion) => {
    // Update local state
    setDiscussions(prev =>
      prev.map(d =>
        d.id === updatedDiscussion.id ? updatedDiscussion : d
      )
    );
    
    // Close edit form
    setEditingDiscussion(null);
  };

  const handleEditCancel = () => {
    setEditingDiscussion(null);
  };

  const handleReplyEdited = (updatedReply) => {
    // Update the specific reply in the discussions state
    setDiscussions(prev =>
      prev.map(d => {
        if (d.replies && d.replies.some(r => r.id === updatedReply.id)) {
          return {
            ...d,
            replies: d.replies.map(r =>
              r.id === updatedReply.id ? updatedReply : r
            )
          };
        }
        return d;
      })
    );
  };


  const handleReplyToReply = async (reply) => {
    if (!user || !selectedDiscussion) return;

    setReplyingToReply(reply);
    setReplyingTo(selectedDiscussion.id);
    setSelectedPoint(null);
    setSelectedReplyType('general');

    // For now, just start a basic reply to the reply without points
    // This can be enhanced later if needed
    setSelectedReplyForPoints(null);
  };

  const handleReplyAdded = (discussionId, newReply) => {
    // Update the discussion with the new reply, but check for duplicates
    setDiscussions(prev =>
      prev.map(d =>
        d.id === discussionId
          ? {
              ...d,
              replies: [
                ...(d.replies || []).filter(r => r.id !== newReply.id), // Remove any existing reply with same ID
                newReply // Add the new reply
              ],
              replyCount: Math.max((d.replyCount || 0), (d.replies || []).length + 1) // Ensure count is accurate
            }
          : d
      )
    );
    
    // Close the reply recorder and clear selections
    setReplyingTo(null);
    setSelectedPoint(null);
    setSelectedReplyType('general');
    setSelectedDiscussion(null);
    setReplyingToReply(null);
    
    // Expand replies to show the new reply
    setExpandedReplies(prev => new Set([...prev, discussionId]));
  };

  const handleDeleteReply = async (discussionId, replyId) => {
    if (!user) return;
    
    const confirmed = window.confirm('Are you sure you want to delete this reply?');
    if (!confirmed) return;
    
    try {
      await deleteReply(discussionId, replyId, user.uid);
      
      // Update local state
      setDiscussions(prev =>
        prev.map(d =>
          d.id === discussionId
            ? {
                ...d,
                replies: d.replies.filter(r => r.id !== replyId),
                replyCount: Math.max(0, (d.replyCount || 0) - 1)
              }
            : d
        )
      );
      
      showSuccessToast('Reply deleted successfully');
      console.log('Reply deleted successfully');
    } catch (error) {
      console.error('Error deleting reply:', error);
      showErrorToast(error.message || 'Failed to delete reply');
    }
  };

  const toggleReplies = async (discussionId) => {
    const wasExpanded = expandedReplies.has(discussionId);
    
    setExpandedReplies(prev => {
      const newSet = new Set(prev);
      if (newSet.has(discussionId)) {
        newSet.delete(discussionId);
      } else {
        newSet.add(discussionId);
      }
      return newSet;
    });

    // Generate fact-check results for replies when expanding
    if (!wasExpanded) {
      const discussion = discussions.find(d => d.id === discussionId);
      if (discussion && discussion.replies && discussion.replies.length > 0) {
        try {
          await generateFactCheckForReplies(discussionId, discussion.replies);
        } catch (error) {
          console.error('Error generating fact-check results for replies:', error);
        }
      }
    }
  };

  const toggleAIPoints = (discussionId) => {
    setExpandedAIPoints(prev => {
      const next = new Set(prev);
      if (next.has(discussionId)) {
        next.delete(discussionId);
      } else {
        next.add(discussionId);
      }
      return next;
    });
  };

  const handlePointClick = (discussion, point) => {
    if (!user) return;
    
    // Set the discussion and point for reply
    setSelectedDiscussion(discussion);
    setSelectedPoint(point);
    setSelectedReplyType('general'); // Default reply type
    setReplyingToReply(null);
    setSelectedReplyForPoints(null);
    
    // Start reply form
    setReplyingTo(discussion.id);
  };

  // Handle point clicks from replies
  const handleReplyPointClick = (reply, point) => {
    if (!user) return;
    
    // Find the discussion this reply belongs to by searching through all replies recursively
    const findDiscussionForReply = (replyId) => {
      for (const discussion of discussions) {
        if (discussion.replies) {
          const findReplyInTree = (replies) => {
            for (const r of replies) {
              if (r.id === replyId) return true;
              if (r.children && findReplyInTree(r.children)) return true;
            }
            return false;
          };
          
          if (findReplyInTree(discussion.replies)) {
            return discussion;
          }
        }
      }
      return null;
    };
    
    const discussion = findDiscussionForReply(reply.id);
    if (!discussion) return;
    
    // Set the discussion, point, and reply context for reply
    setSelectedDiscussion(discussion);
    setSelectedPoint(point);
    setSelectedReplyType('general'); // Default reply type
    setReplyingToReply(reply); // Set the reply we're replying to
    setSelectedReplyForPoints(reply); // Set context for points from reply
    
    // Start reply form
    setReplyingTo(discussion.id);
  };

  const toggleDiscussion = async (discussionId) => {
    const wasExpanded = expandedDiscussions.has(discussionId);
    
    setExpandedDiscussions(prev => {
      const next = new Set(prev);
      if (next.has(discussionId)) {
        next.delete(discussionId);
      } else {
        next.add(discussionId);
      }
      return next;
    });

    // Generate AI points and fact-check results when expanding if they don't exist
    if (!wasExpanded) {
      const discussion = discussions.find(d => d.id === discussionId);
      if (discussion) {
        // Generate AI points if missing
        if (!discussion.aiPointsGenerated && (!discussion.aiPoints || discussion.aiPoints.length === 0)) {
          try {
            await generateAIPointsForDiscussion(discussion);
          } catch (error) {
            console.error('Error generating AI points for discussion:', discussionId, error);
          }
        }
        
        // Generate fact-check results if missing
        if (!discussion.factCheckGenerated && !discussion.factCheckResults) {
          try {
            await generateFactCheckForDiscussion(discussion);
          } catch (error) {
            console.error('Error generating fact-check results for discussion:', discussionId, error);
          }
        }
      }
    }

    // Increment view count only when expanding (not collapsing) and user is authenticated
    if (!wasExpanded && user) {
      try {
        const result = await incrementDiscussionView(discussionId, user.uid);
        
        // Update local state with new view count
        setDiscussions(prev =>
          prev.map(d =>
            d.id === discussionId 
              ? { ...d, views: result.views, viewedBy: result.viewedBy }
              : d
          )
        );
      } catch (error) {
        console.error('Error incrementing discussion view:', error);
        // Don't show error to user, just log it
      }
    }
  };


  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="rounded-lg border border-black/20 p-6 animate-pulse">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/6"></div>
              </div>
            </div>
            <div className="h-5 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  if (discussions.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 mb-2">No discussions yet</h3>
        <p className="text-gray-500">Be the first to start a discussion by sharing your thoughts!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">Discussions</h2>
        {onStartDiscussion && (
          <button
            onClick={onStartDiscussion}
            className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-full hover:bg-black/80 transition-colors font-medium text-sm"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Start a Discussion
          </button>
        )}
      </div>

      <SearchFilterSort
        key="search-filter-sort"
        discussions={discussions}
        onResults={setFilteredDiscussions}
        onSearchChange={handleSearchChange}
        onSearchTypeChange={setCurrentSearchType}
        onFilterChange={setCurrentFilters}
        onSortChange={setCurrentSort}
        initialSearchQuery={searchQuery}
        initialSearchType={currentSearchType}
        initialSortBy={currentSort}
        initialFilters={currentFilters}
      />

      {/* Conditional content based on results */}
      {filteredDiscussions.length === 0 && searchQuery.trim() ? (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 mb-2">No matching discussions found</h3>
          <p className="text-gray-500">Try adjusting your search terms or filters.</p>
        </div>
      ) : (
        filteredDiscussions.map((discussion) => {
        const isExpanded = expandedDiscussions.has(discussion.id);
        return (
          <div key={discussion.id} className="rounded-lg border border-black/20">
                              <button
                onClick={() => toggleDiscussion(discussion.id)}
                className={`flex ${isExpanded ? '' : 'hidden'} w-full justify-end `}
                title={isExpanded ? 'Collapse' : 'Expand'}
              >
                                <svg className={`w-5 h-5 rotate-90 mr-4 mt-4`} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            {/* Header Row - shows title and controls */}
            <div className={`px-4 py-3 flex items-center justify-between ${isExpanded ? 'h-0' : ''}`}>
                {!isExpanded && (
                  <span className="font-semibold text-gray-900 truncate flex-1 min-w-0 mr-4">
                    <SearchHighlight text={discussion.title} searchQuery={searchQuery} />
                  </span>
                )}
              {/* Hide action buttons when expanded - only show likes and replies count */}
              {!isExpanded && (
                <div className="flex items-center gap-4">
                <button
                  onClick={() => toggleReplies(discussion.id)}
                  className="flex items-center gap-1 text-sm text-gray-800 hover:text-black"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  {discussion.replyCount || 0}
                </button>
                <button
                  onClick={() => handleLike(discussion.id)}
                  className="flex items-center gap-1 text-sm text-gray-800 hover:text-black"
                  disabled={!user}
                >
                  <svg className="w-4 h-4" fill={user && (discussion.likedBy || []).includes(user.uid) ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  {discussion.likes || 0}
                </button>

                <button
                onClick={() => toggleDiscussion(discussion.id)}
                className="flex items-center gap-3 text-left flex-1 min-w-0"
                title={isExpanded ? 'Collapse' : 'Expand'}
              >
                <svg className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-90' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
                </div>
              )}
            </div>

            {/* Expanded Content */}
            {isExpanded && (
              <div className="px-4 pb-4 -mt-12">
                {/* Title and author info */}
                <div className="pb-2">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 -mt-4 mr-12">
                    <SearchHighlight text={discussion.title} searchQuery={searchQuery} />
                  </h3>
                  <div className="flex items-center gap-3">
                    <div className="text-xs text-gray-600">
                      <SearchHighlight text={discussion.authorName} searchQuery={searchQuery} /> · {formatDate(discussion.createdAt)}
                      {discussion.isEdited && discussion.editedAt && (
                        <span className="text-gray-500 italic"> · edited {formatDate(discussion.editedAt)}</span>
                      )}
                    </div>
                  </div>
                  
                </div>

                {/* Content */}
                <div className="mb-2">
                  <p className="text-gray-900 whitespace-pre-wrap leading-relaxed text-sm">
                    <SearchHighlight text={discussion.content} searchQuery={searchQuery} />
                  </p>
                </div>

                {/* Tags */}
                {discussion.tags && discussion.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {discussion.tags.map((tag, index) => (
                      <span
                        key={index}
                        className={`inline-block px-3 py-1 text-xs rounded-full font-medium ${
                          tag === 'News' 
                            ? 'bg-red-100 text-red-800 border border-red-200' 
                            : 'bg-gray-100 text-gray-700 border border-gray-200'
                        }`}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* AI Generated Indicator */}
                {discussion.metadata?.isAIGenerated && (
                  <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center gap-2 text-sm">
                      <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                      <span className="text-blue-800 font-medium">AI-Generated Discussion</span>
                      {discussion.metadata.newsStory?.stance && (
                        <span className="text-blue-700">
                          • Stance: {discussion.metadata.newsStory.stance}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Fact Check Results */}
                {discussion.factCheckResults && (
                  <FactCheckResults 
                    factCheckResults={discussion.factCheckResults} 
                    isLoading={false}
                    searchQuery={searchQuery}
                  />
                )}

                {/* AI points (collapsible and clickable) */}
                {discussion.aiPoints && discussion.aiPoints.length > 0 && (
                  <div className="mt-2 mb-2 rounded-lg border border-black/20">
                    <button
                      onClick={() => toggleAIPoints(discussion.id)}
                      className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-2">
                        <svg className={`w-4 h-4 transition-transform ${expandedAIPoints.has(discussion.id) ? 'rotate-90' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                        <span className="text-sm font-semibold text-gray-900">Key Discussion Points</span>
                      </div>
                      <div className="text-xs text-gray-600">
                        {discussion.aiPoints.length} point{discussion.aiPoints.length !== 1 ? 's' : ''}
                      </div>
                    </button>

                    {expandedAIPoints.has(discussion.id) && (
                      <div className="px-3 pb-3 border-t border-black/10">
                        <div className="mt-2 space-y-2">
                          {discussion.aiPoints.map((point) => {
                            const pointKey = `${discussion.id}-${point.id}`;
                            const isCollected = collectedPoints.has(pointKey);
                            const pointCount = pointCounts.get(pointKey) || 0;
                            
                            return (
                              <button
                                key={point.id}
                                onClick={() => handlePointClick(discussion, point)}
                                className={`w-full flex items-start gap-3 p-3 text-left rounded-lg border transition-all ${
                                  isCollected 
                                    ? 'bg-green-50 border-green-200' 
                                    : 'hover:bg-gray-50 border-transparent hover:border-black/20'
                                }`}
                                disabled={!user}
                              >
                                {/* Checkbox indicator */}
                                <div className="flex-shrink-0 mt-0.5">
                                  {isCollected ? (
                                    <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                      </svg>
                                    </div>
                                  ) : (
                                    <div className="w-1 h-1 bg-black rounded-full mt-2"></div>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className={`text-sm ${isCollected ? 'text-green-800' : 'text-gray-900'}`}>
                                    <SearchHighlight text={point.text} searchQuery={searchQuery} />
                                  </p>
                                <div className="flex items-center gap-2 mt-1">
                                  {point.type && (
                                    <span className="inline-block px-2 py-0.5 text-[10px] rounded-full bg-black text-white uppercase tracking-wide">
                                      <SearchHighlight text={point.type} searchQuery={searchQuery} />
                                    </span>
                                  )}
                                  {pointCount > 0 && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] rounded-full bg-purple-100 text-purple-800 font-medium">
                                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                      </svg>
                                      {pointCount}
                                    </span>
                                  )}
                                </div>
                                {user && (
                                  <div className={`text-xs mt-1 ${isCollected ? 'text-green-600' : 'text-gray-600'}`}>
                                    {isCollected ? 'Point earned!' : 'Click to reply to this point'}
                                  </div>
                                )}
                              </div>
                            </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex items-center gap-4 mt-4 pb-3 border-b border-black/10">
                  <button
                    onClick={() => toggleReplies(discussion.id)}
                    className="flex items-center gap-1 text-sm text-gray-800 hover:text-black"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    {discussion.replyCount || 0}
                    <svg className={`w-3 h-3 transition-transform ${expandedReplies.has(discussion.id) ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleLike(discussion.id)}
                    className="flex items-center gap-1 text-sm text-gray-800 hover:text-black"
                    disabled={!user}
                  >
                    <svg className="w-4 h-4" fill={user && (discussion.likedBy || []).includes(user.uid) ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    {discussion.likes || 0}
                  </button>
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    {discussion.views || 0}
                  </div>
                  {user && discussion.authorId === user.uid && (
                    <>
                      <button
                        onClick={() => handleEditDiscussion(discussion)}
                        className="p-1 text-gray-800 hover:text-black"
                        title="Edit discussion"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(discussion.id)}
                        className="p-1 text-gray-800 hover:text-black"
                        title="Delete discussion"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </>
                  )}
                </div>

                {/* Edit form */}
                {editingDiscussion && editingDiscussion.id === discussion.id && (
                  <div className="mt-3">
                    <EditDiscussionForm
                      discussion={editingDiscussion}
                      onEditComplete={handleEditComplete}
                      onCancel={handleEditCancel}
                    />
                  </div>
                )}

                {/* Reply form */}
                {replyingTo === discussion.id && !editingDiscussion && (
                  <div className="mt-3">
                    <TextReplyForm
                      discussionId={discussion.id}
                      selectedPoint={selectedPoint}
                      replyType={selectedReplyType}
                      replyingToReply={replyingToReply}
                      selectedReplyForPoints={selectedReplyForPoints}
                      discussionTitle={discussion.title}
                      discussionContent={discussion.content}
                      parentFactCheck={discussion.factCheckResults}
                      onReplyAdded={(reply) => handleReplyAdded(discussion.id, reply)}
                      onPointsEarned={refreshPointsData}
                      onCancel={() => {
                        setReplyingTo(null);
                        setSelectedPoint(null);
                        setSelectedReplyType('general');
                        setReplyingToReply(null);
                        setSelectedReplyForPoints(null);
                      }}
                    />
                  </div>
                )}

                {/* Replies */}
                {expandedReplies.has(discussion.id) && (discussion.replies || []).length > 0 && (
                  <div className="mt-3 pt-3 border-t border-black/10">
                    <ReplyTree
                      replies={discussion.replies}
                      aiPoints={discussion.aiPoints || []}
                      discussionId={discussion.id}
                      searchQuery={searchQuery}
                      onReplyToReply={(reply) => {
                        setSelectedDiscussion(discussion);
                        handleReplyToReply(reply);
                      }}
                      onDeleteReply={handleDeleteReply}
                      onReplyEdited={handleReplyEdited}
                      onReplyView={async (replyId, userId) => {
                        try {
                          await incrementReplyView(discussion.id, replyId, userId);
                          // Update local state to reflect the view count increment
                          setDiscussions(prev =>
                            prev.map(d =>
                              d.id === discussion.id
                                ? {
                                    ...d,
                                    replies: (d.replies || []).map(r =>
                                      r.id === replyId
                                        ? { ...r, views: (r.views || 0) + 1, viewedBy: [...(r.viewedBy || []), userId] }
                                        : r
                                    )
                                  }
                                : d
                            )
                          );
                        } catch (error) {
                          console.error('Error incrementing reply view:', error);
                          throw error;
                        }
                      }}
                      onPointClick={handleReplyPointClick}
                      maxLevel={3}
                      showFilters={true}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })
      )}

    </div>
  );
}
