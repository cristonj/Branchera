'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useDatabase } from '@/hooks/useDatabase';

export default function EditReplyForm({ discussionId, reply, onEditComplete, onCancel }) {
  const [content, setContent] = useState(reply.content || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { user } = useAuth();
  const { editReply } = useDatabase();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!content.trim()) {
      alert('Please write a reply before submitting.');
      return;
    }

    // Check if content has actually changed
    if (content.trim() === reply.content) {
      alert('No changes detected. Please make changes before saving.');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const updatedReply = await editReply(discussionId, reply.id, user.uid, content.trim());
      
      
      // Notify parent component
      if (onEditComplete) {
        onEditComplete(updatedReply);
      }
      
    } catch (error) {
      alert(`Failed to edit reply: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-black/20 p-3 mt-2">
      <div className="text-sm font-semibold text-gray-900 mb-3">Edit Reply</div>

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
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}