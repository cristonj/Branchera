'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useDatabase } from '@/hooks/useDatabase';
import { useToast } from '@/contexts/ToastContext';

export default function TextReplyForm({
  discussionId,
  onReplyAdded,
  onCancel,
  replyingToReply = null
}) {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { user, getDisplayName } = useAuth();
  const { addReply } = useDatabase();

  // Safely get toast functions with fallbacks
  const toastContext = useToast();
  const showSuccessToast = toastContext?.showSuccessToast || (() => {});
  const showErrorToast = toastContext?.showErrorToast || (() => {});

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!content.trim()) {
      alert('Please write a reply before submitting.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Create reply data for text-based reply
      const replyData = {
        content: content.trim(),
        authorId: user.uid,
        authorName: getDisplayName(),
        authorPhoto: user.photoURL,
        replyToReplyId: replyingToReply?.id || null
      };

      const createdReply = await addReply(discussionId, replyData);

      // Reset form
      setContent('');

      // Notify parent component
      if (onReplyAdded) {
        onReplyAdded(createdReply);
      }

    } catch (error) {
      showErrorToast(`Failed to add reply: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <div className="bg-white rounded-lg border border-black/20 p-3">
      {replyingToReply ? (
        <div className="mb-3">
          <div className="text-xs font-semibold text-gray-900 mb-1">
            Replying to {replyingToReply.authorName}
          </div>
          <div className="p-3 rounded-lg border border-black/15 bg-white">
            <p className="text-xs text-gray-900">{replyingToReply.content}</p>
          </div>
        </div>
      ) : (
        <div className="text-xs font-semibold text-gray-900 mb-2">Write a reply</div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write your reply..."
            rows={3}
            className="w-full px-3 py-2 border border-black/20 rounded-lg focus:outline-none focus:ring-1 focus:ring-black resize-vertical text-sm text-gray-900"
            disabled={isSubmitting}
            required
          />
          <div className="text-xs text-gray-600 mt-1">
            {content.length} characters
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-3 py-1 text-sm border border-black/30 rounded-lg hover:bg-black/5 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !content.trim()}
            className="px-4 py-1 text-sm bg-black text-white rounded-lg hover:bg-black/80 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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

