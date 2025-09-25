'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useDatabase } from '@/hooks/useDatabase';

export default function TextReplyForm({ 
  discussionId, 
  onReplyAdded, 
  onCancel, 
  selectedPoint = null, 
  replyType = 'general',
  replyingToReply = null
}) {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { user } = useAuth();
  const { addReply } = useDatabase();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!content.trim()) {
      alert('Please write a reply before submitting.');
      return;
    }

    setIsSubmitting(true);
    console.log('Adding text reply...');
    
    try {
      // Create reply data for text-based reply
      const replyData = {
        content: content.trim(),
        authorId: user.uid,
        authorName: user.displayName || user.email,
        authorPhoto: user.photoURL,
        replyToPointId: selectedPoint?.id || null,
        replyToReplyId: replyingToReply?.id || null,
        type: replyType,
        level: replyingToReply ? (replyingToReply.level || 0) + 1 : 0
      };
      
      console.log('Adding reply to discussion:', discussionId, 'with data:', replyData);
      const createdReply = await addReply(discussionId, replyData);
      console.log('Reply added successfully:', createdReply);
      
      // Reset form
      setContent('');
      
      // Notify parent component
      if (onReplyAdded) {
        onReplyAdded(createdReply);
      }
      
      console.log('Reply creation process completed successfully');
    } catch (error) {
      console.error('Error adding reply:', error);
      alert(`Failed to add reply: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getReplyTypeIcon = (type) => {
    switch (type) {
      case 'agree': return '👍';
      case 'challenge': return '🤔';
      case 'expand': return '💡';
      case 'clarify': return '❓';
      default: return '💬';
    }
  };

  const getReplyTypeLabel = (type) => {
    switch (type) {
      case 'agree': return 'Agreeing with';
      case 'challenge': return 'Challenging';
      case 'expand': return 'Expanding on';
      case 'clarify': return 'Clarifying';
      default: return 'Replying to';
    }
  };

  return (
    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
      {selectedPoint ? (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-900 mb-2">
            {getReplyTypeIcon(replyType)} {getReplyTypeLabel(replyType)}:
          </h4>
          <div className="bg-white p-3 rounded border-l-4 border-blue-400">
            <p className="text-sm text-gray-700">{selectedPoint.text}</p>
          </div>
        </div>
      ) : replyingToReply ? (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-900 mb-2">
            💬 Replying to {replyingToReply.authorName}:
          </h4>
          <div className="bg-white p-3 rounded border-l-4 border-gray-400">
            <p className="text-sm text-gray-700">{replyingToReply.content}</p>
          </div>
        </div>
      ) : (
        <h4 className="text-sm font-medium text-gray-900 mb-3">Write a reply</h4>
      )}
      
      <form onSubmit={handleSubmit}>
        {/* Content Textarea */}
        <div className="mb-4">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Share your thoughts on this discussion..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-vertical text-sm"
            disabled={isSubmitting}
            required
          />
          <div className="text-xs text-gray-500 mt-1">
            {content.length} characters
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-3 py-1 text-sm text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !content.trim()}
            className="px-4 py-1 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Replying...
              </>
            ) : (
              'Reply'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
