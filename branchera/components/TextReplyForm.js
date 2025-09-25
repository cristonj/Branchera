'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useDatabase } from '@/hooks/useDatabase';
import { AIService } from '@/lib/aiService';
import FactCheckResults from './FactCheckResults';

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
  const [isFactChecking, setIsFactChecking] = useState(false);
  const [factCheckResults, setFactCheckResults] = useState(null);
  
  const { user } = useAuth();
  const { addReply, updateReplyFactCheckResults } = useDatabase();

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
      
      // Generate points and fact check the reply content based on those points
      setIsFactChecking(true);
      try {
        console.log('Generating points for reply content...');
        
        // Generate points from the reply content
        const replyPoints = await AIService.generateReplyPoints(replyData.content, selectedPoint?.text || '');
        console.log('Reply points generated:', replyPoints);
        
        // Fact check based on the generated points
        console.log('Fact checking reply based on generated points...');
        const factCheck = await AIService.factCheckPoints(replyPoints, 'Reply');
        console.log('Reply fact check results based on points:', factCheck);
        
        // Update the reply with fact check results
        await updateReplyFactCheckResults(discussionId, createdReply.id, factCheck);
        console.log('Reply fact check results saved:', factCheck);
        
        // Update the created reply object with fact check results
        createdReply.factCheckResults = factCheck;
        createdReply.factCheckGenerated = true;
        setFactCheckResults(factCheck);
      } catch (factCheckError) {
        console.error('Error fact checking reply:', factCheckError);
        // Don't fail the reply creation if fact checking fails
      } finally {
        setIsFactChecking(false);
      }
      
      // Reset form
      setContent('');
      setFactCheckResults(null);
      
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
    <div className="bg-white rounded border border-black/15 p-3">
      {selectedPoint ? (
        <div className="mb-3">
          <div className="text-xs font-semibold text-gray-900 mb-1">
            {getReplyTypeIcon(replyType)} {getReplyTypeLabel(replyType)}
          </div>
          <div className="p-2 rounded border border-black/15 bg-white">
            <p className="text-xs text-gray-900">{selectedPoint.text}</p>
          </div>
        </div>
      ) : replyingToReply ? (
        <div className="mb-3">
          <div className="text-xs font-semibold text-gray-900 mb-1">
            💬 Replying to {replyingToReply.authorName}
          </div>
          <div className="p-2 rounded border border-black/15 bg-white">
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
            className="w-full px-3 py-2 border border-black/20 rounded focus:outline-none focus:ring-1 focus:ring-black resize-vertical text-sm text-gray-900"
            disabled={isSubmitting}
            required
          />
          <div className="text-[11px] text-gray-600 mt-1">
            {content.length} characters
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-3 py-1 text-sm border border-black/30 rounded hover:bg-black/5 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !content.trim()}
            className="px-4 py-1 text-sm bg-black text-white rounded hover:bg-black/80 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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

      {/* Fact Check Results */}
      <FactCheckResults 
        factCheckResults={factCheckResults} 
        isLoading={isFactChecking} 
      />
    </div>
  );
}
