'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useDatabase } from '@/hooks/useDatabase';
import { AIService } from '@/lib/aiService';

export default function TextDiscussionForm({ onDiscussionCreated }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { user } = useAuth();
  const { createDiscussion, updateAIPoints } = useDatabase();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!title.trim() || !content.trim()) {
      alert('Please provide both a title and content for your discussion.');
      return;
    }

    setIsSubmitting(true);
    console.log('Creating text discussion...');
    
    try {
      // Create discussion data for text-based discussion
      const discussionData = {
        title: title.trim(),
        content: content.trim(),
        authorId: user.uid,
        authorName: user.displayName || user.email,
        authorPhoto: user.photoURL
      };
      
      console.log('Creating discussion with data:', discussionData);
      const createdDiscussion = await createDiscussion(discussionData);
      console.log('Discussion created successfully:', createdDiscussion);
      
      // Generate AI points immediately after creation
      try {
        console.log('Generating AI points for new discussion...');
        const aiPoints = await AIService.generatePoints(discussionData.content, discussionData.title);
        
        // Update the discussion with AI points
        await updateAIPoints(createdDiscussion.id, aiPoints);
        console.log('AI points generated and saved:', aiPoints);
        
        // Update the created discussion object with AI points for the parent component
        createdDiscussion.aiPoints = aiPoints;
        createdDiscussion.aiPointsGenerated = true;
      } catch (aiError) {
        console.error('Error generating AI points:', aiError);
        // Don't fail the entire discussion creation if AI fails
        alert('Discussion created successfully, but AI point generation failed. You can still receive replies.');
      }
      
      // Reset form
      setTitle('');
      setContent('');
      
      // Notify parent component
      if (onDiscussionCreated) {
        console.log('Notifying parent component...');
        onDiscussionCreated(createdDiscussion);
      }
      
      console.log('Discussion creation process completed successfully');
    } catch (error) {
      console.error('Error creating discussion:', error);
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        code: error.code,
        stack: error.stack
      });
      alert(`Failed to create discussion: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
      <h2 className="text-lg font-semibold mb-4">Start a Discussion</h2>
      
      <form onSubmit={handleSubmit}>
        {/* Title Input */}
        <div className="mb-4">
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
            Discussion Title
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What would you like to discuss?"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isSubmitting}
            required
          />
        </div>

        {/* Content Textarea */}
        <div className="mb-4">
          <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
            Your thoughts
          </label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Share your thoughts, ideas, or questions..."
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-vertical"
            disabled={isSubmitting}
            required
          />
          <div className="text-sm text-gray-500 mt-1">
            {content.length} characters
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting || !title.trim() || !content.trim()}
            className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Creating...
              </>
            ) : (
              'Post Discussion'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
