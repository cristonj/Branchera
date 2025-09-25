'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { useFirestore } from '@/hooks/useFirestore';
import { useDatabase } from '@/hooks/useDatabase';
import { useAuth } from '@/contexts/AuthContext';
import TextReplyForm from './TextReplyForm';
import AIPointSelectionModal from './AIPointSelectionModal';
import ReplyTree from './ReplyTree';
import { AIService } from '@/lib/aiService';

export default function DiscussionFeed({ newDiscussion }) {
  const [discussions, setDiscussions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replyingTo, setReplyingTo] = useState(null); // Track which discussion is being replied to
  const [expandedReplies, setExpandedReplies] = useState(new Set()); // Track which discussions have expanded replies
  const [showPointModal, setShowPointModal] = useState(false); // Track if AI point selection modal is open
  const [selectedDiscussion, setSelectedDiscussion] = useState(null); // Discussion for point selection
  const [selectedPoint, setSelectedPoint] = useState(null); // Selected AI point for reply
  const [selectedReplyType, setSelectedReplyType] = useState('agree'); // Selected reply type
  const [replyingToReply, setReplyingToReply] = useState(null); // Reply being replied to (for nested replies)
  
  const { updateDocument } = useFirestore();
  const { getDiscussions, deleteDiscussion, deleteReply, updateAIPoints } = useDatabase();
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

  const handleReplyToReply = (reply) => {
    if (!user) return;
    
    setReplyingToReply(reply);
    setReplyingTo(selectedDiscussion?.id || reply.discussionId);
    setSelectedPoint(null); // Clear point selection when replying to a reply
    setSelectedReplyType('general');
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
      <h2 className="text-xl font-bold text-gray-900 mb-6">Popular Discussions</h2>
      
      {discussions.map((discussion) => (
        <div key={discussion.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
          {/* Author Info */}
          <div className="flex items-center gap-3 mb-4">
            {discussion.authorPhoto ? (
              <Image
                src={discussion.authorPhoto}
                alt={discussion.authorName}
                width={40}
                height={40}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                <span className="text-gray-600 font-medium">
                  {discussion.authorName?.charAt(0)?.toUpperCase() || '?'}
                </span>
              </div>
            )}
            <div className="flex-1">
              <h4 className="font-medium text-gray-900">{discussion.authorName}</h4>
              <p className="text-sm text-gray-500">{formatDate(discussion.createdAt)}</p>
            </div>
            <div className="flex items-center gap-2">
              {user && discussion.authorId === user.uid && (
                <button
                  onClick={() => handleDelete(discussion.id)}
                  className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                  title="Delete discussion"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Discussion Title */}
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {discussion.title}
          </h3>

          {/* Discussion Content */}
          <div className="mb-4">
            <div className="prose max-w-none">
              <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">
                {discussion.content}
              </p>
            </div>
          </div>

          {/* AI Generated Points */}
          {discussion.aiPoints && discussion.aiPoints.length > 0 && (
            <div className="mb-4 bg-blue-50 rounded-lg p-4 border border-blue-200">
              <h4 className="text-sm font-medium text-blue-900 mb-3 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                Key Discussion Points
              </h4>
              <div className="space-y-2">
                {discussion.aiPoints.map((point) => (
                  <div key={point.id} className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                    <div className="flex-1">
                      <p className="text-sm text-blue-800">{point.text}</p>
                      {point.type && (
                        <span className={`inline-block px-2 py-1 text-xs rounded-full mt-1 ${
                          point.type === 'claim' ? 'bg-blue-100 text-blue-700' :
                          point.type === 'evidence' ? 'bg-green-100 text-green-700' :
                          point.type === 'recommendation' ? 'bg-purple-100 text-purple-700' :
                          point.type === 'question' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {point.type}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Engagement Stats */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <div className="flex items-center gap-4">
              <button
                onClick={() => handleLike(discussion.id)}
                className={`flex items-center gap-2 text-sm transition-colors ${
                  user && (discussion.likedBy || []).includes(user.uid)
                    ? 'text-red-500 hover:text-red-600'
                    : 'text-gray-600 hover:text-red-500'
                }`}
                disabled={!user}
              >
                <svg 
                  className="w-4 h-4" 
                  fill={user && (discussion.likedBy || []).includes(user.uid) ? "currentColor" : "none"} 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                <span>{discussion.likes || 0}</span>
              </button>
              
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <span>{discussion.likes || 0} views</span>
              </div>
              
              <button
                onClick={() => handleReplyClick(discussion)}
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-500 transition-colors"
                disabled={!user}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                </svg>
                <span>Reply</span>
              </button>
              
              {(discussion.replyCount || 0) > 0 && (
                <button
                  onClick={() => toggleReplies(discussion.id)}
                  className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-500 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <span>{discussion.replyCount} {discussion.replyCount === 1 ? 'reply' : 'replies'}</span>
                  <svg className={`w-3 h-3 transition-transform ${expandedReplies.has(discussion.id) ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              )}
            </div>
          </div>
          
          {/* Reply Form */}
          {replyingTo === discussion.id && (
            <div className="mt-4">
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
          
          {/* Replies Section */}
          {expandedReplies.has(discussion.id) && (discussion.replies || []).length > 0 && (
            <div className="mt-4 border-t border-gray-100 pt-4">
              <ReplyTree
                replies={discussion.replies}
                aiPoints={discussion.aiPoints || []}
                discussionId={discussion.id}
                onReplyToReply={(reply) => {
                  setSelectedDiscussion(discussion);
                  handleReplyToReply(reply);
                }}
                onDeleteReply={handleDeleteReply}
                maxLevel={3}
              />
            </div>
          )}
        </div>
      ))}
      
      {/* AI Point Selection Modal */}
      <AIPointSelectionModal
        isOpen={showPointModal}
        onClose={() => setShowPointModal(false)}
        aiPoints={selectedDiscussion?.aiPoints || []}
        discussionTitle={selectedDiscussion?.title || ''}
        onPointSelected={handlePointSelected}
      />
    </div>
  );
}
