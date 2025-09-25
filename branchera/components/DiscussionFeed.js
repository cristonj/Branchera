'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { useFirestore } from '@/hooks/useFirestore';
import { useDatabase } from '@/hooks/useDatabase';
import { useAuth } from '@/contexts/AuthContext';
import TextReplyForm from './TextReplyForm';
import AIPointSelectionModal from './AIPointSelectionModal';
import ReplyTree from './ReplyTree';
import FactCheckResults from './FactCheckResults';
import { AIService } from '@/lib/aiService';

export default function DiscussionFeed({ newDiscussion }) {
  const [discussions, setDiscussions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replyingTo, setReplyingTo] = useState(null); // Track which discussion is being replied to
  const [expandedReplies, setExpandedReplies] = useState(new Set()); // Track which discussions have expanded replies
  const [expandedDiscussions, setExpandedDiscussions] = useState(new Set()); // Track expanded discussion cards
  const [showPointModal, setShowPointModal] = useState(false); // Track if AI point selection modal is open
  const [selectedDiscussion, setSelectedDiscussion] = useState(null); // Discussion for point selection
  const [selectedPoint, setSelectedPoint] = useState(null); // Selected AI point for reply
  const [selectedReplyType, setSelectedReplyType] = useState('agree'); // Selected reply type
  const [replyingToReply, setReplyingToReply] = useState(null); // Reply being replied to (for nested replies)
  const [selectedReplyForPoints, setSelectedReplyForPoints] = useState(null); // Reply context for AI points
  
  const { updateDocument } = useFirestore();
  const { getDiscussions, deleteDiscussion, deleteReply, updateAIPoints, updateReplyAIPoints, incrementDiscussionView, incrementReplyView } = useDatabase();
  const { user } = useAuth();

  const loadDiscussions = useCallback(async () => {
    try {
      setLoading(true);
      console.log('Loading discussions...');
      
      // Load discussions directly without setup
      const discussionsData = await getDiscussions({
        limit: 20,
        orderField: 'createdAt',
        orderDirection: 'desc'
      });
      
      console.log('Loaded discussions:', discussionsData);
      setDiscussions(discussionsData);
      
      // Generate AI points for older discussions that don't have them
      discussionsData.forEach(discussion => {
        if (!discussion.aiPointsGenerated && (!discussion.aiPoints || discussion.aiPoints.length === 0)) {
          generateAIPointsForDiscussion(discussion);
        }
      });
    } catch (error) {
      console.error('Error loading discussions:', error);
      // Set empty array to prevent crashes
      setDiscussions([]);
    } finally {
      setLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    loadDiscussions();
  }, [loadDiscussions]); // Include loadDiscussions dependency

  // Add new discussion to the top of the feed when created
  useEffect(() => {
    if (newDiscussion) {
      setDiscussions(prev => [newDiscussion, ...prev]);
      // AI points are now generated during discussion creation
    }
  }, [newDiscussion]);

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
      
      console.log('Discussion deleted successfully');
    } catch (error) {
      console.error('Error deleting discussion:', error);
      alert(error.message || 'Failed to delete discussion');
    }
  };

  const handleReplyClick = async (discussion) => {
    if (!user) return;
    
    // Generate AI points if they don't exist (for older discussions)
    if (!discussion.aiPointsGenerated && (!discussion.aiPoints || discussion.aiPoints.length === 0)) {
      try {
        await generateAIPointsForDiscussion(discussion);
        // Wait a moment for the state to update
        setTimeout(() => {
          setSelectedDiscussion(discussion);
          setShowPointModal(true);
        }, 500);
      } catch (error) {
        console.error('Error generating AI points:', error);
        alert('Unable to generate AI points for this discussion. Please try again.');
        return;
      }
    } else {
      // Open point selection modal immediately if points exist
      setSelectedDiscussion(discussion);
      setSelectedReplyForPoints(null);
      setShowPointModal(true);
    }
  };

  const handlePointSelected = (point, replyType) => {
    setSelectedPoint(point);
    setSelectedReplyType(replyType);
    setShowPointModal(false);
    
    // Start reply form with selected point
    setReplyingTo(selectedDiscussion.id);
  };

  const handleReplyToReply = async (reply) => {
    if (!user || !selectedDiscussion) return;

    setReplyingToReply(reply);
    setReplyingTo(selectedDiscussion.id);
    setSelectedPoint(null);
    setSelectedReplyType('agree');

    // Ensure AI points exist for this reply
    try {
      let replyPoints = Array.isArray(reply.aiPoints) ? reply.aiPoints : [];
      const hasPoints = reply.aiPointsGenerated && replyPoints.length > 0;

      if (!hasPoints) {
        replyPoints = await AIService.generateReplyPoints(
          reply.content,
          `${selectedDiscussion.title} — ${reply.authorName}`
        );

        await updateReplyAIPoints(selectedDiscussion.id, reply.id, replyPoints);

        // Update local state to include points on the reply
        setDiscussions(prev => prev.map(d =>
          d.id === selectedDiscussion.id
            ? {
                ...d,
                replies: (d.replies || []).map(r =>
                  r.id === reply.id ? { ...r, aiPoints: replyPoints, aiPointsGenerated: true } : r
                )
              }
            : d
        ));
      }

      setSelectedReplyForPoints({ ...reply, aiPoints: replyPoints });
      setShowPointModal(true);
    } catch (error) {
      console.error('Error generating AI points for reply:', error);
      // Fallback: open plain reply form without points
      setSelectedReplyForPoints(null);
      setShowPointModal(false);
    }
  };

  const handleReplyAdded = (discussionId, newReply) => {
    // Update the discussion with the new reply
    setDiscussions(prev =>
      prev.map(d =>
        d.id === discussionId
          ? {
              ...d,
              replies: [...(d.replies || []), newReply],
              replyCount: (d.replyCount || 0) + 1
            }
          : d
      )
    );
    
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
          <div key={i} className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
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
      <h2 className="text-xl font-bold text-gray-900 mb-6">Discussions</h2>

      {discussions.map((discussion) => {
        const isExpanded = expandedDiscussions.has(discussion.id);
        return (
          <div key={discussion.id} className="bg-white rounded-lg border border-black/20">
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
                  <span className="font-semibold text-gray-900 truncate flex-1 min-w-0">{discussion.title}</span>
                )}
              </button>
              {/* Hide action buttons when expanded */}
              {!isExpanded && (
                <div className="flex items-center gap-4">
                <button
                  onClick={() => handleReplyClick(discussion)}
                  className="flex items-center gap-1 text-sm text-gray-800 hover:text-black"
                  disabled={!user}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                  </svg>
                  Reply
                </button>
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
              )}
            </div>

            {/* Expanded Content */}
            {isExpanded && (
              <div className="px-4 pb-4 border-t border-black/10">
                {/* Title and author info */}
                <div className="py-3">
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
                <div className="mb-3">
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

                {/* AI points (monochrome) */}
                {discussion.aiPoints && discussion.aiPoints.length > 0 && (
                  <div className="mb-3 rounded border border-black/20 p-3">
                    <div className="text-xs font-semibold text-gray-900 mb-2">Key points</div>
                    <div className="space-y-2">
                      {discussion.aiPoints.map((point) => (
                        <div key={point.id} className="flex items-start gap-2">
                          <div className="w-1 h-1 bg-black rounded-full mt-2 flex-shrink-0"></div>
                          <div className="flex-1">
                            <p className="text-sm text-gray-900">{point.text}</p>
                            {point.type && (
                              <span className="inline-block px-2 py-0.5 text-[10px] rounded-full bg-black text-white mt-1 uppercase tracking-wide">
                                {point.type}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex items-center gap-4 mb-3 pb-3 border-b border-black/10">
                  <button
                    onClick={() => handleReplyClick(discussion)}
                    className="flex items-center gap-1 text-sm text-gray-800 hover:text-black"
                    disabled={!user}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                    </svg>
                    Reply
                  </button>
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
                {expandedReplies.has(discussion.id) && (discussion.replies || []).length > 0 && (
                  <div className="mt-3 pt-3 border-t border-black/10">
                    <ReplyTree
                      replies={discussion.replies}
                      aiPoints={discussion.aiPoints || []}
                      discussionId={discussion.id}
                      onReplyToReply={(reply) => {
                        setSelectedDiscussion(discussion);
                        handleReplyToReply(reply);
                      }}
                      onDeleteReply={handleDeleteReply}
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
                      maxLevel={3}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* AI Point Selection Modal for discussion or reply context */}
      <AIPointSelectionModal
        isOpen={showPointModal}
        onClose={() => setShowPointModal(false)}
        aiPoints={selectedReplyForPoints?.aiPoints || selectedDiscussion?.aiPoints || []}
        discussionTitle={selectedDiscussion?.title || ''}
        contextLabel={selectedReplyForPoints ? `Reply by ${selectedReplyForPoints.authorName}` : selectedDiscussion?.title || ''}
        onPointSelected={handlePointSelected}
      />
    </div>
  );
}
