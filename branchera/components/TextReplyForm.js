'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useDatabase } from '@/hooks/useDatabase';
import { AIService } from '@/lib/aiService';
import FactCheckResults from './FactCheckResults';
import PointsAnimation from './PointsAnimation';
import { useToast } from '@/contexts/ToastContext';

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
  parentFactCheck = null,
  onPointsEarned = null
}) {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFactChecking, setIsFactChecking] = useState(false);
  const [factCheckResults, setFactCheckResults] = useState(null);
  const [pointsEarned, setPointsEarned] = useState(0);
  const [qualityScore, setQualityScore] = useState('');
  const [showPointsAnimation, setShowPointsAnimation] = useState(false);
  const [isJudging, setIsJudging] = useState(false);

  const { user, getDisplayName } = useAuth();
  const { addReply, updateReplyFactCheckResults, createUserPoint, hasUserCollectedPoint } = useDatabase();

  // Safely get toast functions with fallbacks
  const toastContext = useToast();
  const showPointsToast = toastContext?.showPointsToast || (() => {});
  const showSuccessToast = toastContext?.showSuccessToast || (() => {});
  const showErrorToast = toastContext?.showErrorToast || (() => {});
  const showNoPointsToast = toastContext?.showNoPointsToast || (() => {});

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
        replyToPointId: selectedPoint?.id || null,
        replyToReplyId: replyingToReply?.id || null,
        type: replyType,
        level: replyingToReply ? (replyingToReply.level || 0) + 1 : 0
      };

      const createdReply = await addReply(discussionId, replyData);

      // Fact check the reply content directly with discussion context
      setIsFactChecking(true);
      let replyFactCheck = null;

      try {

        // Build context for better fact checking
        const contextTitle = selectedPoint ?
          `Reply to: "${selectedPoint.text}"` :
          `Reply in: ${discussionTitle}`;

        const contextContent = selectedPoint ?
          `Original Discussion: ${discussionContent}\n\nPoint being addressed: ${selectedPoint.text}\n\nReply: ${replyData.content}` :
          `Original Discussion: ${discussionContent}\n\nReply: ${replyData.content}`;

        // Fact check the reply content directly with full context
        replyFactCheck = await AIService.factCheckContent(contextContent, contextTitle);

        // Update the reply with fact check results
        await updateReplyFactCheckResults(discussionId, createdReply.id, replyFactCheck);

        // Update the created reply object with fact check results
        createdReply.factCheckResults = replyFactCheck;
        createdReply.factCheckGenerated = true;
        setFactCheckResults(replyFactCheck);
      } catch (factCheckError) {
        // Don't fail the reply creation if fact checking fails
      } finally {
        setIsFactChecking(false);
      }

      // Check if this is a rebuttal to a specific point and if user can earn points
      if (selectedPoint && selectedPoint.text) {
        try {
          // Check if user has already collected points for this specific point
          const hasCollectedThisPoint = await hasUserCollectedPoint(user.uid, discussionId, selectedPoint.id);

          if (!hasCollectedThisPoint) {
            setIsJudging(true);

            try {
              // Get AI judgement on the rebuttal
              const judgement = await AIService.judgeRebuttal(
                selectedPoint.text,
                replyData.content,
                parentFactCheck,
                replyFactCheck,
                `${discussionTitle}: ${discussionContent}`
              );


              // Validate judgement object before using it
              if (!judgement || typeof judgement !== 'object') {
                throw new Error('Invalid judgement response from AI');
              }

              // Ensure required properties exist with defaults
              const safeJudgement = {
                pointsEarned: judgement.pointsEarned || 0,
                qualityScore: judgement.qualityScore || 'none',
                explanation: judgement.explanation || 'No explanation provided',
                isFactual: judgement.isFactual || false,
                isCoherent: judgement.isCoherent || false,
                ...judgement
              };

              if (safeJudgement.pointsEarned > 0) {

                // Create user point record
                const pointData = {
                  userId: user.uid,
                  userName: getDisplayName(),
                  userPhoto: user.photoURL,
                  discussionId: discussionId,
                  discussionTitle: discussionTitle,
                  replyId: createdReply.id,
                  originalPoint: selectedPoint.text,
                  originalPointId: selectedPoint.id,
                  rebuttal: replyData.content,
                  pointsEarned: safeJudgement.pointsEarned,
                  qualityScore: safeJudgement.qualityScore,
                  judgeExplanation: safeJudgement.explanation,
                  isFactual: safeJudgement.isFactual,
                  isCoherent: safeJudgement.isCoherent
                };

                await createUserPoint(pointData);

                // Refresh points data in parent component
                if (onPointsEarned && typeof onPointsEarned === 'function') {
                  try {
                    onPointsEarned();
                  } catch (refreshError) {
                    // Don't crash if refresh fails
                  }
                }

                // Show both animations and toast notification for immediate feedback
                setPointsEarned(safeJudgement.pointsEarned);
                setQualityScore(safeJudgement.qualityScore);
                setShowPointsAnimation(true);

                // Show immediate toast notification with safe error handling
                try {
                  if (showPointsToast && typeof showPointsToast === 'function') {
                    showPointsToast(
                      safeJudgement.pointsEarned,
                      safeJudgement.qualityScore
                    );
                  }
                } catch (toastError) {
                  // Fallback to console log if toast fails
                }
              } else {
                // Show feedback when no points are earned
                try {
                  if (showNoPointsToast && typeof showNoPointsToast === 'function') {
                    showNoPointsToast();
                  }
                } catch (toastError) {
                }
              }
            } catch (judgementError) {
              // Show user-friendly error message
              try {
                if (showErrorToast && typeof showErrorToast === 'function') {
                  showErrorToast('Reply submitted successfully, but point evaluation failed. Please try again.');
                }
              } catch (toastError) {
              }
            }
          } else {
            // Show info toast for already collected point
            try {
              if (showSuccessToast && typeof showSuccessToast === 'function') {
                showSuccessToast('Reply submitted! You\'ve already claimed points for this specific claim.', 4000);
              }
            } catch (toastError) {
            }
          }
        } catch (judgingError) {
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

    } catch (error) {
      showErrorToast(`Failed to add reply: ${error.message}`);
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
            <p className="text-xs text-gray-900 break-words">{selectedPoint.text}</p>
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
            💡 <strong>Earn Points:</strong> Provide a factual and coherent response to this point to earn 1-3 points!
            (One collection per discussion)
          </div>
        </div>
      )}
    </div>
  );
}

