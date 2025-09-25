'use client';

import { useState, useEffect } from 'react';
import { useFirestore } from '@/hooks/useFirestore';
import { useDatabase } from '@/hooks/useDatabase';
import { useAuth } from '@/contexts/AuthContext';
import AudioPlayer from './AudioPlayer';

export default function DiscussionFeed({ newDiscussion }) {
  const [discussions, setDiscussions] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const { updateDocument } = useFirestore();
  const { getDiscussions } = useDatabase();
  const { user } = useAuth();

  useEffect(() => {
    loadDiscussions();
  }, []);

  // Add new discussion to the top of the feed when created
  useEffect(() => {
    if (newDiscussion) {
      setDiscussions(prev => [newDiscussion, ...prev]);
    }
  }, [newDiscussion]);

  const loadDiscussions = async () => {
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
  };

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
      const discussion = discussions.find(d => d.id === discussionId);
      if (discussion) {
        const newLikes = (discussion.likes || 0) + 1;
        await updateDocument('discussions', discussionId, { likes: newLikes });
        
        // Update local state
        setDiscussions(prev =>
          prev.map(d =>
            d.id === discussionId ? { ...d, likes: newLikes } : d
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
              <img
                src={discussion.authorPhoto}
                alt={discussion.authorName}
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
            <div className="text-sm text-gray-500">
              {formatDuration(discussion.duration || 0)}
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
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-red-500 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
