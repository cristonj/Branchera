'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useDatabase } from '@/hooks/useDatabase';

export default function EditDiscussionForm({ discussion, onEditComplete, onCancel }) {
  const [title, setTitle] = useState(discussion.title || '');
  const [content, setContent] = useState(discussion.content || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { user } = useAuth();
  const { editDiscussion } = useDatabase();
  
  const TITLE_CHAR_LIMIT = 100;

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!title.trim() || !content.trim()) {
      alert('Please provide both a title and content for your discussion.');
      return;
    }
    
    if (title.length > TITLE_CHAR_LIMIT) {
      alert(`Title must be ${TITLE_CHAR_LIMIT} characters or less.`);
      return;
    }

    // Check if content has actually changed
    if (title.trim() === discussion.title && content.trim() === discussion.content) {
      alert('No changes detected. Please make changes before saving.');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const updatedDiscussion = await editDiscussion(discussion.id, user.uid, {
        title: title.trim(),
        content: content.trim()
      });
      
      
      // Notify parent component
      if (onEditComplete) {
        onEditComplete(updatedDiscussion);
      }
      
    } catch (error) {
      alert(`Failed to edit discussion: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-black/20 p-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit Discussion</h3>
      
      <form onSubmit={handleSubmit}>
        {/* Title Input */}
        <div className="mb-4">
          <label htmlFor="edit-title" className="block text-sm font-medium text-gray-900 mb-2">
            Discussion Title
          </label>
          <input
            type="text"
            id="edit-title"
            value={title}
            onChange={(e) => {
              if (e.target.value.length <= TITLE_CHAR_LIMIT) {
                setTitle(e.target.value);
              }
            }}
            placeholder="What would you like to discuss?"
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-black ${
              title.length > TITLE_CHAR_LIMIT * 0.9 ? 'border-red-400' : 'border-black/20'
            }`}
            disabled={isSubmitting}
            required
            maxLength={TITLE_CHAR_LIMIT}
          />
          <div className={`text-sm mt-1 ${
            title.length > TITLE_CHAR_LIMIT * 0.9 
              ? title.length >= TITLE_CHAR_LIMIT 
                ? 'text-red-600' 
                : 'text-yellow-600'
              : 'text-gray-600'
          }`}>
            {title.length}/{TITLE_CHAR_LIMIT} characters
          </div>
        </div>

        {/* Content Textarea */}
        <div className="mb-4">
          <label htmlFor="edit-content" className="block text-sm font-medium text-gray-900 mb-2">
            Your thoughts
          </label>
          <textarea
            id="edit-content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Share your thoughts, ideas, or questions..."
            rows={4}
            className="w-full px-3 py-2 border border-black/20 rounded-lg focus:outline-none focus:ring-1 focus:ring-black resize-vertical"
            disabled={isSubmitting}
            required
          />
          <div className="text-sm text-gray-600 mt-1">
            {content.length} characters
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm border border-black/30 rounded-lg hover:bg-black/5 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !title.trim() || !content.trim()}
            className="px-6 py-2 bg-black text-white rounded-lg hover:bg-black/80 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
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