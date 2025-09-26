'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useDatabase } from '@/hooks/useDatabase';
import { AIService } from '@/lib/aiService';
import FactCheckResults from './FactCheckResults';
import PointsAnimation from './PointsAnimation';

export default function TextReplyForm({ 
  discussionId, 
  onReplyAdded, 
  onCancel, 
  selectedPoint = null, 
  replyType = 'general',
  replyingToReply = null,
  selectedReplyForPoints = null,
  discussionTitle = '',
  discussionContent = '',
  parentFactCheck = null
}) {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFactChecking, setIsFactChecking] = useState(false);
  const [factCheckResults, setFactCheckResults] = useState(null);
  const [pointsEarned, setPointsEarned] = useState(0);
  const [qualityScore, setQualityScore] = useState('');
  const [showPointsAnimation, setShowPointsAnimation] = useState(false);
  const [isJudging, setIsJudging] = useState(false);
  
  const { user } = useAuth();
  const { addReply, updateReplyFactCheckResults, createUserPoint, hasUserEarnedPointsForDiscussion } = useDatabase();

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
      let replyFactCheck = null;
      
      try {
        console.log('Generating points for reply content...');
        
        // Generate points from the reply content
        const replyPoints = await AIService.generateReplyPoints(replyData.content, selectedPoint?.text || '');
        console.log('Reply points generated:', replyPoints);
        
        // Fact check based on the generated points
        console.log('Fact checking reply based on generated points...');
        replyFactCheck = await AIService.factCheckPoints(replyPoints, 'Reply');
        console.log('Reply fact check results based on points:', replyFactCheck);
        
        // Update the reply with fact check results
        await updateReplyFactCheckResults(discussionId, createdReply.id, replyFactCheck);
        console.log('Reply fact check results saved:', replyFactCheck);
        
        // Update the created reply object with fact check results
        createdReply.factCheckResults = replyFactCheck;
        createdReply.factCheckGenerated = true;
        setFactCheckResults(replyFactCheck);
      } catch (factCheckError) {
        console.error('Error fact checking reply:', factCheckError);
        // Don't fail the reply creation if fact checking fails
      } finally {
        setIsFactChecking(false);
      }

      // Check if this is a rebuttal to a specific point and if user can earn points
      if (selectedPoint && selectedPoint.text) {
        try {
          // Check if user has already earned points for this discussion
          const hasEarnedPoints = await hasUserEarnedPointsForDiscussion(user.uid, discussionId);
          
          if (!hasEarnedPoints) {
            setIsJudging(true);
            console.log('Judging rebuttal for points...');
            
            // Get AI judgement on the rebuttal
            const judgement = await AIService.judgeRebuttal(
              selectedPoint.text,
              replyData.content,
              parentFactCheck,
              replyFactCheck,
              `${discussionTitle}: ${discussionContent}`
            );
            
            console.log('AI judgement result:', judgement);
            
            if (judgement.pointsEarned > 0) {
              // Create user point record
              const pointData = {
                userId: user.uid,
                discussionId: discussionId,
                discussionTitle: discussionTitle,
                originalPoint: selectedPoint.text,
                originalPointId: selectedPoint.id,
                rebuttal: replyData.content,
                pointsEarned: judgement.pointsEarned,
                qualityScore: judgement.qualityScore,
                judgeExplanation: judgement.explanation,
                isFactual: judgement.isFactual,
                isCoherent: judgement.isCoherent
              };
              
              await createUserPoint(pointData);
              console.log('User point created successfully');
              
              // Show points animation
              setPointsEarned(judgement.pointsEarned);
              setQualityScore(judgement.qualityScore);
              setShowPointsAnimation(true);
            }
          } else {
            console.log('User has already earned points for this discussion');
          }
        } catch (judgingError) {
          console.error('Error judging rebuttal:', judgingError);
          // Don't fail the reply creation if judging fails
        } finally {
          setIsJudging(false);
        }
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


  const getReplyTypeLabel = (type) => {
    // Always just say "Replying to" regardless of type
    return 'Replying to';
  };

  return (
    <div className="bg-white rounded-lg border border-black/20 p-3">
      {selectedPoint ? (
        <div className="mb-3">
          <div className="text-xs font-semibold text-gray-900 mb-1">
            {getReplyTypeLabel(replyType)}
            {selectedReplyForPoints && ` ${selectedReplyForPoints.authorName}'s point`}
          </div>
          <div className="p-3 rounded-lg border border-black/15 bg-white">
            <p className="text-xs text-gray-900">{selectedPoint.text}</p>
            {selectedReplyForPoints && (
              <div className="mt-2 pt-2 border-t border-black/10">
                <div className="text-[10px] text-gray-600 mb-1">From reply:</div>
                <p className="text-[10px] text-gray-700 italic truncate">
                  &ldquo;{selectedReplyForPoints.content.slice(0, 100)}...&rdquo;
                </p>
              </div>
            )}
          </div>
        </div>
      ) : replyingToReply ? (
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
                {isJudging ? 'Judging...' : isFactChecking ? 'Fact-checking...' : 'Replying...'}
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

      {/* Points Animation */}
      {showPointsAnimation && (
        <PointsAnimation
          points={pointsEarned}
          qualityScore={qualityScore}
          onComplete={() => setShowPointsAnimation(false)}
        />
      )}

      {/* Points eligibility notice */}
      {selectedPoint && (
        <div className="mt-2 p-2 bg-purple-50 border border-purple-200 rounded-lg">
          <div className="text-xs text-purple-800">
            💡 <strong>Earn Points:</strong> Provide a factual and coherent rebuttal to this point to earn 1-5 points! 
            (One collection per discussion)
          </div>
        </div>
      )}
    </div>
  );
}
