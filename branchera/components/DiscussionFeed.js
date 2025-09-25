'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { useFirestore } from '@/hooks/useFirestore';
import { useDatabase } from '@/hooks/useDatabase';
import { useAuth } from '@/contexts/AuthContext';
import AudioPlayer from './AudioPlayer';
import AudioReplyRecorder from './AudioReplyRecorder';

export default function DiscussionFeed({ newDiscussion }) {
  const [discussions, setDiscussions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replyingTo, setReplyingTo] = useState(null); // Track which discussion is being replied to
  const [expandedReplies, setExpandedReplies] = useState(new Set()); // Track which discussions have expanded replies
  
  const { updateDocument } = useFirestore();
  const { getDiscussions, deleteDiscussion, deleteReply } = useDatabase();
  const { user } = useAuth();

  useEffect(() => {
    loadDiscussions();
  }, [loadDiscussions]);

  // Add new discussion to the top of the feed when created
  useEffect(() => {
    if (newDiscussion) {
      setDiscussions(prev => [newDiscussion, ...prev]);
    }
  }, [newDiscussion]);

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
    } catch (error) {
      console.error('Error loading discussions:', error);
      // Set empty array to prevent crashes
      setDiscussions([]);
    } finally {
      setLoading(false);
    }
  }, [getDiscussions]);

  const handlePlay = async (discussionId) => {
    try {
      // Increment play count
      const discussion = discussions.find(d => d.id === discussionId);
      if (discussion) {
        const newPlays = (discussion.plays || 0) + 1;
        await updateDocument('discussions', discussionId, { plays: newPlays });
        
        // Update local state
        setDiscussions(prev =>
          prev.map(d =>
            d.id === discussionId ? { ...d, plays: newPlays } : d
          )
        );
      }
    } catch (error) {
      console.error('Error updating play count:', error);
    }
  };

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

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

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
    
    // Close the reply recorder
    setReplyingTo(null);
    
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
        <div className="text-gray-500 mb-4">
          <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No discussions yet</h3>
        <p className="text-gray-500">Be the first to start a discussion by recording an audio clip!</p>
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
              <div className="text-sm text-gray-500">
                {formatDuration(discussion.duration || 0)}
              </div>
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

          {/* Audio Player */}
          <div className="mb-4">
            <AudioPlayer
              audioUrl={discussion.audioUrl}
              onPlay={() => handlePlay(discussion.id)}
              className="w-full"
            />
          </div>

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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h6m2-7.127V9a4 4 0 00-4-4H9a4 4 0 00-4 4v2.873M12 2l3 3m-3-3l-3 3" />
                </svg>
                <span>{discussion.plays || 0} plays</span>
              </div>
              
              <button
                onClick={() => setReplyingTo(replyingTo === discussion.id ? null : discussion.id)}
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
          
          {/* Reply Recorder */}
          {replyingTo === discussion.id && (
            <div className="mt-4">
              <AudioReplyRecorder
                discussionId={discussion.id}
                onReplyAdded={(reply) => handleReplyAdded(discussion.id, reply)}
                onCancel={() => setReplyingTo(null)}
              />
            </div>
          )}
          
          {/* Replies Section */}
          {expandedReplies.has(discussion.id) && (discussion.replies || []).length > 0 && (
            <div className="mt-4 border-t border-gray-100 pt-4">
              <div className="space-y-3">
                {discussion.replies.map((reply) => (
                  <div key={reply.id} className="bg-gray-50 rounded-lg p-4 ml-8">
                    {/* Reply Author Info */}
                    <div className="flex items-center gap-3 mb-3">
                      {reply.authorPhoto ? (
                        <Image
                          src={reply.authorPhoto}
                          alt={reply.authorName}
                          width={24}
                          height={24}
                          className="w-6 h-6 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
                          <span className="text-gray-600 text-xs font-medium">
                            {reply.authorName?.charAt(0)?.toUpperCase() || '?'}
                          </span>
                        </div>
                      )}
                      <div className="flex-1">
                        <h5 className="text-sm font-medium text-gray-900">{reply.authorName}</h5>
                        <p className="text-xs text-gray-500">{formatDate(reply.createdAt)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-xs text-gray-500">
                          {formatDuration(reply.duration || 0)}
                        </div>
                        {user && reply.authorId === user.uid && (
                          <button
                            onClick={() => handleDeleteReply(discussion.id, reply.id)}
                            className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                            title="Delete reply"
                          >
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                    
                    {/* Reply Audio Player */}
                    <AudioPlayer
                      audioUrl={reply.audioUrl}
                      onPlay={() => handlePlay(discussion.id)} // Still count as play on main discussion
                      className="w-full"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
