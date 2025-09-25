'use client';

import { useEffect, useState } from 'react';
import { useRealtimeReplies } from '@/hooks/useRealtimeReplies';
import ReplyTree from './ReplyTree';

export default function RealtimeReplyTree({ 
  discussionId, 
  aiPoints, 
  onReplyToReply, 
  onDeleteReply,
  onReplyView,
  maxLevel = 3,
  isVisible = false
}) {
  const { 
    replies, 
    loading: repliesLoading, 
    error: repliesError,
    updateReplyLocally,
    addReplyLocally,
    removeReplyLocally 
  } = useRealtimeReplies(isVisible ? discussionId : null);

  const [newRepliesCount, setNewRepliesCount] = useState(0);
  const [lastViewedTime, setLastViewedTime] = useState(Date.now());

  // Track new replies for visual indicators
  useEffect(() => {
    if (replies.length > 0) {
      const newReplies = replies.filter(reply => 
        new Date(reply.createdAt) > new Date(lastViewedTime)
      );
      setNewRepliesCount(newReplies.length);
    }
  }, [replies, lastViewedTime]);

  // Reset new replies count when component becomes visible
  useEffect(() => {
    if (isVisible) {
      setLastViewedTime(Date.now());
      setNewRepliesCount(0);
    }
  }, [isVisible]);

  // Handle reply deletion with optimistic updates
  const handleDeleteReply = async (discussionId, replyId) => {
    // Optimistically remove the reply
    removeReplyLocally(replyId);
    
    try {
      await onDeleteReply(discussionId, replyId);
    } catch (error) {
      console.error('Error deleting reply:', error);
      // You might want to add the reply back on error
      // This would require keeping a reference to the deleted reply
    }
  };

  if (!isVisible) {
    return (
      <div className="text-center py-4">
        <div className="text-sm text-gray-500">
          {newRepliesCount > 0 && (
            <span className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full mr-2">
              {newRepliesCount} new
            </span>
          )}
          Click to load replies
        </div>
      </div>
    );
  }

  if (repliesLoading) {
    return (
      <div className="text-center py-4">
        <div className="text-sm text-gray-500">Loading replies...</div>
      </div>
    );
  }

  if (repliesError) {
    return (
      <div className="text-center py-4">
        <div className="text-sm text-red-600">Error loading replies</div>
      </div>
    );
  }

  if (replies.length === 0) {
    return (
      <div className="text-center py-4">
        <div className="text-sm text-gray-500">No replies yet</div>
      </div>
    );
  }

  return (
    <div>
      {newRepliesCount > 0 && (
        <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded text-center">
          <span className="text-sm text-blue-800">
            {newRepliesCount} new {newRepliesCount === 1 ? 'reply' : 'replies'}
          </span>
        </div>
      )}
      <ReplyTree
        replies={replies}
        aiPoints={aiPoints}
        discussionId={discussionId}
        onReplyToReply={onReplyToReply}
        onDeleteReply={handleDeleteReply}
        onReplyView={onReplyView}
        maxLevel={maxLevel}
      />
    </div>
  );
}