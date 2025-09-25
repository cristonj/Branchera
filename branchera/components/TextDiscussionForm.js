'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useDatabase } from '@/hooks/useDatabase';
import { AIService } from '@/lib/aiService';
import FactCheckResults from './FactCheckResults';

export default function TextDiscussionForm({ onDiscussionCreated }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFactChecking, setIsFactChecking] = useState(false);
  const [factCheckResults, setFactCheckResults] = useState(null);
  
  const { user } = useAuth();
  const { createDiscussion, updateAIPoints, updateFactCheckResults } = useDatabase();
  
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
      
      // Generate AI points first, then fact check based on those points
      setIsFactChecking(true);
      
      try {
        console.log('Generating AI points for new discussion...');
        
        // Step 1: Generate AI points
        const aiPoints = await AIService.generatePoints(discussionData.content, discussionData.title);
        console.log('AI points generated:', aiPoints);
        
        // Save AI points
        await updateAIPoints(createdDiscussion.id, aiPoints);
        createdDiscussion.aiPoints = aiPoints;
        createdDiscussion.aiPointsGenerated = true;
        
        // Step 2: Fact check based on the generated points
        console.log('Fact checking based on generated points...');
        const factCheckResults = await AIService.factCheckPoints(aiPoints, discussionData.title);
        console.log('Fact check results based on points:', factCheckResults);
        
        // Save fact check results
        await updateFactCheckResults(createdDiscussion.id, factCheckResults);
        createdDiscussion.factCheckResults = factCheckResults;
        createdDiscussion.factCheckGenerated = true;
        setFactCheckResults(factCheckResults);
        
        console.log('AI points and fact checking completed successfully');
      } catch (error) {
        console.error('Error with AI processing:', error);
        
        // Try to generate AI points at minimum, even if fact checking fails
        try {
          if (!createdDiscussion.aiPointsGenerated) {
            console.log('Attempting to generate AI points as fallback...');
            const aiPoints = await AIService.generatePoints(discussionData.content, discussionData.title);
            await updateAIPoints(createdDiscussion.id, aiPoints);
            createdDiscussion.aiPoints = aiPoints;
            createdDiscussion.aiPointsGenerated = true;
            console.log('AI points generated successfully as fallback');
          }
        } catch (fallbackError) {
          console.error('Error with fallback AI points generation:', fallbackError);
        }
        
        alert('Discussion created successfully, but AI processing had some issues.');
      } finally {
        setIsFactChecking(false);
      }
      
      // Reset form
      setTitle('');
      setContent('');
      setFactCheckResults(null);
      
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
    <div className="bg-white rounded border border-black/20 p-6 mb-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Start a Discussion</h2>
      
      <form onSubmit={handleSubmit}>
        {/* Title Input */}
        <div className="mb-4">
          <label htmlFor="title" className="block text-sm font-medium text-gray-900 mb-2">
            Discussion Title
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => {
              if (e.target.value.length <= TITLE_CHAR_LIMIT) {
                setTitle(e.target.value);
              }
            }}
            placeholder="What would you like to discuss?"
            className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-1 focus:ring-black ${
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
          <label htmlFor="content" className="block text-sm font-medium text-gray-900 mb-2">
            Your thoughts
          </label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Share your thoughts, ideas, or questions..."
            rows={4}
            className="w-full px-3 py-2 border border-black/20 rounded focus:outline-none focus:ring-1 focus:ring-black resize-vertical"
            disabled={isSubmitting}
            required
          />
          <div className="text-sm text-gray-600 mt-1">
            {content.length} characters
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting || !title.trim() || !content.trim()}
            className="px-6 py-2 bg-black text-white rounded hover:bg-black/80 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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

      {/* Fact Check Results */}
      <FactCheckResults 
        factCheckResults={factCheckResults} 
        isLoading={isFactChecking} 
      />
    </div>
  );
}
