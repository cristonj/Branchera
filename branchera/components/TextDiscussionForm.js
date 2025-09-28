'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useDatabase } from '@/hooks/useDatabase';
import { AIService } from '@/lib/aiService';
import FactCheckResults from './FactCheckResults';

export default function TextDiscussionForm({ onDiscussionCreated, isInDialog = false }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFactChecking, setIsFactChecking] = useState(false);
  const [factCheckResults, setFactCheckResults] = useState(null);
  
  const { user, getDisplayName } = useAuth();
  const { createDiscussion, updateAIPoints, updateFactCheckResults } = useDatabase();
  
  const TITLE_CHAR_LIMIT = 100;

  // Predefined tag suggestions
  const suggestedTags = [
    'Politics', 'Technology', 'Science', 'Economics', 'Social Issues',
    'Environment', 'Health', 'Education', 'Entertainment', 'Sports',
    'Business', 'International', 'Local', 'Opinion', 'News'
  ];

  // Handle adding tags
  const handleAddTag = (tagToAdd) => {
    const trimmedTag = tagToAdd.trim();
    if (trimmedTag && !tags.includes(trimmedTag) && tags.length < 5) {
      setTags([...tags, trimmedTag]);
      setTagInput('');
    }
  };

  // Handle removing tags
  const handleRemoveTag = (tagToRemove) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  // Handle tag input key press
  const handleTagInputKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag(tagInput);
    } else if (e.key === 'Backspace' && !tagInput && tags.length > 0) {
      // Remove last tag if backspace is pressed on empty input
      handleRemoveTag(tags[tags.length - 1]);
    }
  };

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
    
    try {
      // Create discussion data for text-based discussion
      const discussionData = {
        title: title.trim(),
        content: content.trim(),
        authorId: user.uid,
        authorName: getDisplayName(),
        authorPhoto: user.photoURL,
        tags: tags.length > 0 ? tags : []
      };
      
      const createdDiscussion = await createDiscussion(discussionData);
      
      // Generate AI points first, then fact check based on those points
      setIsFactChecking(true);
      
      try {
        
        // Step 1: Generate AI points
        const aiPoints = await AIService.generatePoints(discussionData.content, discussionData.title);
        
        // Save AI points
        await updateAIPoints(createdDiscussion.id, aiPoints);
        createdDiscussion.aiPoints = aiPoints;
        createdDiscussion.aiPointsGenerated = true;
        
        // Step 2: Fact check based on the generated points
        const factCheckResults = await AIService.factCheckPoints(aiPoints, discussionData.title);
        
        // Save fact check results
        await updateFactCheckResults(createdDiscussion.id, factCheckResults);
        createdDiscussion.factCheckResults = factCheckResults;
        createdDiscussion.factCheckGenerated = true;
        setFactCheckResults(factCheckResults);
        
      } catch (error) {
        
        // Try to generate AI points at minimum, even if fact checking fails
        try {
          if (!createdDiscussion.aiPointsGenerated) {
            const aiPoints = await AIService.generatePoints(discussionData.content, discussionData.title);
            await updateAIPoints(createdDiscussion.id, aiPoints);
            createdDiscussion.aiPoints = aiPoints;
            createdDiscussion.aiPointsGenerated = true;
          }
        } catch (fallbackError) {
        }
        
        alert('Discussion created successfully, but AI processing had some issues.');
      } finally {
        setIsFactChecking(false);
      }
      
      // Reset form
      setTitle('');
      setContent('');
      setTags([]);
      setTagInput('');
      setFactCheckResults(null);
      
      // Notify parent component
      if (onDiscussionCreated) {
        onDiscussionCreated(createdDiscussion);
      }
      
    } catch (error) {
      alert(`Failed to create discussion: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={isInDialog ? "" : "bg-white rounded-lg border border-black/20 p-6 mb-6"}>
      {!isInDialog && <h2 className="text-lg font-semibold text-gray-900 mb-4">Start a Discussion</h2>}
      
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
          <label htmlFor="content" className="block text-sm font-medium text-gray-900 mb-2">
            Your thoughts
          </label>
          <textarea
            id="content"
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

        {/* Tags Input */}
        <div className="mb-4">
          <label htmlFor="tags" className="block text-sm font-medium text-gray-900 mb-2">
            Tags (optional)
          </label>
          
          {/* Selected Tags Display */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 px-3 py-1 text-xs rounded-full bg-gray-100 text-gray-700 border border-gray-200"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="text-gray-400 hover:text-gray-600"
                    disabled={isSubmitting}
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Tag Input */}
          <div className="relative">
            <input
              type="text"
              id="tags"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagInputKeyPress}
              placeholder={tags.length >= 5 ? "Maximum 5 tags allowed" : "Add a tag and press Enter"}
              className="w-full px-3 py-2 border border-black/20 rounded-lg focus:outline-none focus:ring-1 focus:ring-black"
              disabled={isSubmitting || tags.length >= 5}
              maxLength={20}
            />
            {tagInput.trim() && (
              <button
                type="button"
                onClick={() => handleAddTag(tagInput)}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 px-2 py-1 text-xs bg-black text-white rounded hover:bg-black/80"
                disabled={isSubmitting || tags.length >= 5}
              >
                Add
              </button>
            )}
          </div>

          {/* Suggested Tags */}
          {tags.length < 5 && (
            <div className="mt-2">
              <div className="text-xs text-gray-600 mb-2">Suggested tags:</div>
              <div className="flex flex-wrap gap-1">
                {suggestedTags
                  .filter(suggestedTag => !tags.includes(suggestedTag))
                  .slice(0, 8)
                  .map((suggestedTag) => (
                    <button
                      key={suggestedTag}
                      type="button"
                      onClick={() => handleAddTag(suggestedTag)}
                      className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50 text-gray-600"
                      disabled={isSubmitting}
                    >
                      {suggestedTag}
                    </button>
                  ))}
              </div>
            </div>
          )}

          <div className="text-sm text-gray-600 mt-1">
            {tags.length}/5 tags • Tags help others find and filter your discussion
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting || !title.trim() || !content.trim()}
            className="px-6 py-2 bg-black text-white rounded-lg hover:bg-black/80 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
