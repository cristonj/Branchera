'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { useFirestore } from '@/hooks/useFirestore';
import { useDatabase } from '@/hooks/useDatabase';
import { useRealtimeDiscussions } from '@/hooks/useRealtimeDiscussions';
import { useAuth } from '@/contexts/AuthContext';
import TextReplyForm from './TextReplyForm';
import RealtimeReplyTree from './RealtimeReplyTree';
import FactCheckResults from './FactCheckResults';
import { AIService } from '@/lib/aiService';

export default function DiscussionFeed({ newDiscussion }) {
  // Use real-time discussions hook
  const { 
    discussions, 
    loading, 
    error: discussionsError,
    updateDiscussionLocally,
    addDiscussionLocally,
    removeDiscussionLocally 
  } = useRealtimeDiscussions();
  
  const [replyingTo, setReplyingTo] = useState(null); // Track which discussion is being replied to
  const [expandedReplies, setExpandedReplies] = useState(new Set()); // Track which discussions have expanded replies
  const [expandedDiscussions, setExpandedDiscussions] = useState(new Set()); // Track expanded discussion cards
  const [expandedAIPoints, setExpandedAIPoints] = useState(new Set()); // Track expanded AI points sections
  const [selectedDiscussion, setSelectedDiscussion] = useState(null); // Discussion for point selection
  const [selectedPoint, setSelectedPoint] = useState(null); // Selected AI point for reply
  const [selectedReplyType, setSelectedReplyType] = useState('agree'); // Selected reply type
  const [replyingToReply, setReplyingToReply] = useState(null); // Reply being replied to (for nested replies)
  const [selectedReplyForPoints, setSelectedReplyForPoints] = useState(null); // Reply context for AI points
  const [discussionReplies, setDiscussionReplies] = useState({}); // Store replies for each discussion
  const [replySubscriptions, setReplySubscriptions] = useState(new Set()); // Track active reply subscriptions
  const [lastViewedTime, setLastViewedTime] = useState(Date.now()); // Track when user last viewed the feed
  
  const { updateDocument } = useFirestore();
  const { deleteDiscussion, deleteReply, updateAIPoints, updateReplyAIPoints, incrementDiscussionView, incrementReplyView, updateFactCheckResults, updateReplyFactCheckResults } = useDatabase();
  const { user } = useAuth();

  // Generate AI points and fact-check results for discussions that don't have them
  useEffect(() => {
    if (!loading && discussions.length > 0) {
      discussions.forEach(discussion => {
        if (!discussion.aiPointsGenerated && (!discussion.aiPoints || discussion.aiPoints.length === 0)) {
          generateAIPointsForDiscussion(discussion);
        }
        if (!discussion.factCheckGenerated && !discussion.factCheckResults) {
          generateFactCheckForDiscussion(discussion);
        }
      });
    }
  }, [discussions, loading]); // eslint-disable-line react-hooks/exhaustive-deps

  // Add new discussion to the feed when created (optimistic update)
  useEffect(() => {
    if (newDiscussion) {
      addDiscussionLocally(newDiscussion);
      // AI points are now generated during discussion creation
    }
  }, [newDiscussion, addDiscussionLocally]);

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
      updateDiscussionLocally(discussion.id, { aiPoints, aiPointsGenerated: true });
      
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
        updateDiscussionLocally(discussion.id, { factCheckResults, factCheckGenerated: true });
        
        console.log('Fact-check results generated successfully for discussion using points:', discussion.id);
      } else {
        // Fallback to content-based fact checking if no points available
        console.log('No AI points available, falling back to content-based fact checking for discussion:', discussion.id);
        const factCheckResults = await AIService.factCheckContent(discussion.content, discussion.title);
        
        // Update discussion in database
        await updateFactCheckResults(discussion.id, factCheckResults);
        
        // Update local state
        updateDiscussionLocally(discussion.id, { factCheckResults, factCheckGenerated: true });
        
        console.log('Fact-check results generated successfully for discussion using content fallback:', discussion.id);
      }
    } catch (error) {
      console.error('Error generating fact-check results for discussion:', discussion.id, error);
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
        updateDiscussionLocally(discussionId, { likes: newLikes, likedBy: newLikedBy });
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
      removeDiscussionLocally(discussionId);
      
      console.log('Discussion deleted successfully');
    } catch (error) {
      console.error('Error deleting discussion:', error);
      alert(error.message || 'Failed to delete discussion');
    }
  };


  const handleReplyToReply = async (reply) => {
    if (!user || !selectedDiscussion) return;

    setReplyingToReply(reply);
    setReplyingTo(selectedDiscussion.id);
    setSelectedPoint(null);
    setSelectedReplyType('agree');

    // For now, just start a basic reply to the reply without points
    // This can be enhanced later if needed
    setSelectedReplyForPoints(null);
  };

  const handleReplyAdded = (discussionId, newReply) => {
    // Update the discussion's reply count locally
    updateDiscussionLocally(discussionId, {
      replyCount: discussions.find(d => d.id === discussionId)?.replyCount + 1 || 1
    });
    
    // Close the reply recorder and clear selections
    setReplyingTo(null);
    setSelectedPoint(null);
    setSelectedReplyType('agree');
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
      
      // Update local state - just update reply count since replies are managed by RealtimeReplyTree
      const discussion = discussions.find(d => d.id === discussionId);
      updateDiscussionLocally(discussionId, {
        replyCount: Math.max(0, (discussion?.replyCount || 0) - 1)
      });
      
      console.log('Reply deleted successfully');
    } catch (error) {
      console.error('Error deleting reply:', error);
      alert(error.message || 'Failed to delete reply');
    }
  };

  const toggleReplies = (discussionId) => {
    setExpandedReplies(prev => {
      const newSet = new Set(prev);
      if (newSet.has(discussionId)) {
        newSet.delete(discussionId);
      } else {
        newSet.add(discussionId);
      }
      return newSet;
    });
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
    setSelectedReplyType('agree'); // Default reply type
    setReplyingToReply(null);
    setSelectedReplyForPoints(null);
    
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
        updateDiscussionLocally(discussionId, { views: result.views, viewedBy: result.viewedBy });
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

  // Calculate new discussions count
  const newDiscussionsCount = discussions.filter(d => 
    new Date(d.createdAt) > new Date(lastViewedTime)
  ).length;

  const markAllAsRead = () => {
    setLastViewedTime(Date.now());
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">Discussions</h2>
        {newDiscussionsCount > 0 && (
          <div className="flex items-center gap-3">
            <span className="text-sm text-blue-600">
              {newDiscussionsCount} new discussion{newDiscussionsCount !== 1 ? 's' : ''}
            </span>
            <button
              onClick={markAllAsRead}
              className="px-3 py-1 text-xs bg-blue-100 text-blue-800 hover:bg-blue-200 rounded-full"
            >
              Mark all as read
            </button>
          </div>
        )}
      </div>

      {discussions.map((discussion) => {
        const isExpanded = expandedDiscussions.has(discussion.id);
        return (
          <div key={discussion.id} className="rounded-lg border border-black/20">
            {/* Header Row - shows title and controls */}
            <div className="px-4 py-3 flex items-center justify-between">
              <button
                onClick={() => toggleDiscussion(discussion.id)}
                className="flex items-center gap-3 text-left flex-1 min-w-0"
                title={isExpanded ? 'Collapse' : 'Expand'}
              >
                <svg className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              {/* Hide title when expanded to avoid duplication */}
              {!isExpanded && (
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="font-semibold text-gray-900 truncate">{discussion.title}</span>
                  {new Date(discussion.createdAt) > new Date(lastViewedTime) && (
                    <span className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                      NEW
                    </span>
                  )}
                </div>
              )}
              </button>
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
                </div>
              )}
            </div>

            {/* Expanded Content */}
            {isExpanded && (
              <div className="px-4 pb-4 border-t border-black/10">
                {/* Title and author info */}
                <div className="pt-3 pb-2">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">{discussion.title}</h3>
                  <div className="flex items-center gap-3">
                    {discussion.authorPhoto ? (
                      <Image
                        src={discussion.authorPhoto}
                        alt={discussion.authorName}
                        width={28}
                        height={28}
                        className="w-7 h-7 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-7 h-7 rounded-full border border-black/40 flex items-center justify-center">
                        <span className="text-xs text-gray-900 font-medium">
                          {discussion.authorName?.charAt(0)?.toUpperCase() || '?'}
                        </span>
                      </div>
                    )}
                    <div className="text-xs text-gray-600">
                      {discussion.authorName} · {formatDate(discussion.createdAt)}
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="mb-2">
                  <p className="text-gray-900 whitespace-pre-wrap leading-relaxed text-sm">
                    {discussion.content}
                  </p>
                </div>

                {/* Fact Check Results */}
                {discussion.factCheckResults && (
                  <FactCheckResults 
                    factCheckResults={discussion.factCheckResults} 
                    isLoading={false} 
                  />
                )}

                {/* AI points (collapsible and clickable) */}
                {discussion.aiPoints && discussion.aiPoints.length > 0 && (
                  <div className="mt-2 mb-2 rounded border border-black/20">
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
                          {discussion.aiPoints.map((point) => (
                            <button
                              key={point.id}
                              onClick={() => handlePointClick(discussion, point)}
                              className="w-full flex items-start gap-2 p-2 text-left rounded hover:bg-gray-50 border border-transparent hover:border-black/20"
                              disabled={!user}
                            >
                              <div className="w-1 h-1 bg-black rounded-full mt-2 flex-shrink-0"></div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-gray-900">{point.text}</p>
                                {point.type && (
                                  <span className="inline-block px-2 py-0.5 text-[10px] rounded-full bg-black text-white mt-1 uppercase tracking-wide">
                                    {point.type}
                                  </span>
                                )}
                                {user && (
                                  <div className="text-xs text-gray-600 mt-1">
                                    Click to reply to this point
                                  </div>
                                )}
                              </div>
                            </button>
                          ))}
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
                    <button
                      onClick={() => handleDelete(discussion.id)}
                      className="p-1 text-gray-800 hover:text-black"
                      title="Delete discussion"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>

                {/* Reply form */}
                {replyingTo === discussion.id && (
                  <div className="mt-3">
                    <TextReplyForm
                      discussionId={discussion.id}
                      selectedPoint={selectedPoint}
                      replyType={selectedReplyType}
                      replyingToReply={replyingToReply}
                      onReplyAdded={(reply) => handleReplyAdded(discussion.id, reply)}
                      onCancel={() => {
                        setReplyingTo(null);
                        setSelectedPoint(null);
                        setSelectedReplyType('agree');
                        setReplyingToReply(null);
                      }}
                    />
                  </div>
                )}

                {/* Replies */}
                {expandedReplies.has(discussion.id) && (
                  <div className="mt-3 pt-3 border-t border-black/10">
                    <RealtimeReplyTree
                      discussionId={discussion.id}
                      aiPoints={discussion.aiPoints || []}
                      onReplyToReply={(reply) => {
                        setSelectedDiscussion(discussion);
                        handleReplyToReply(reply);
                      }}
                      onDeleteReply={handleDeleteReply}
                      onReplyView={async (replyId, userId) => {
                        try {
                          await incrementReplyView(discussion.id, replyId, userId);
                        } catch (error) {
                          console.error('Error incrementing reply view:', error);
                          throw error;
                        }
                      }}
                      maxLevel={3}
                      isVisible={expandedReplies.has(discussion.id)}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

    </div>
  );
}
