'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useFirestore } from '@/hooks/useFirestore';
import { useDatabase } from '@/hooks/useDatabase';
import { useAuth } from '@/contexts/AuthContext';
import TextReplyForm from './TextReplyForm';
import ReplyTree from './ReplyTree';
import FactCheckResults from './FactCheckResults';
import SearchHighlight from './SearchHighlight';
import EditDiscussionForm from './EditDiscussionForm';
import { AIService } from '@/lib/aiService';
import { useToast } from '@/contexts/ToastContext';

export default function DiscussionItem({ 
  discussion, 
  searchQuery = '', 
  onDiscussionUpdate,
  onReplyAdded,
  expandedDiscussions,
  setExpandedDiscussions,
  expandedReplies,
  setExpandedReplies,
  expandedAIPoints,
  setExpandedAIPoints,
  collectedPoints,
  pointCounts,
  refreshPointsData,
  showCompactView = false
}) {
  const [replyingTo, setReplyingTo] = useState(null);
  const [selectedDiscussion, setSelectedDiscussion] = useState(null);
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [selectedReplyType, setSelectedReplyType] = useState('general');
  const [replyingToReply, setReplyingToReply] = useState(null);
  const [selectedReplyForPoints, setSelectedReplyForPoints] = useState(null);
  const [editingDiscussion, setEditingDiscussion] = useState(null);
  const replyFormRef = useRef(null);
  
  const { updateDocument } = useFirestore();
  const { 
    deleteDiscussion, 
    deleteReply, 
    updateAIPoints, 
    updateReplyAIPoints, 
    incrementDiscussionView, 
    incrementReplyView, 
    updateFactCheckResults, 
    updateReplyFactCheckResults
  } = useDatabase();
  const { user } = useAuth();
  
  // Safely get toast functions with fallbacks
  const toastContext = useToast();
  const showSuccessToast = toastContext?.showSuccessToast || (() => {});
  const showErrorToast = toastContext?.showErrorToast || (() => {});

  const isExpanded = expandedDiscussions?.has(discussion.id) || false;

  // Enhanced smooth scroll function with fallbacks
  const smoothScrollToReplyForm = () => {
    if (replyFormRef.current) {
      if ('scrollBehavior' in document.documentElement.style) {
        replyFormRef.current.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
          inline: 'nearest'
        });
      } else {
        replyFormRef.current.scrollIntoView();
      }
    }
  };

  const handleLike = async (discussionId) => {
    try {
      if (!user) return;
      
      const likedBy = discussion.likedBy || [];
      const hasLiked = likedBy.includes(user.uid);
      
      let newLikedBy, newLikes;
      
      if (hasLiked) {
        newLikedBy = likedBy.filter(uid => uid !== user.uid);
        newLikes = Math.max(0, (discussion.likes || 0) - 1);
      } else {
        newLikedBy = [...likedBy, user.uid];
        newLikes = (discussion.likes || 0) + 1;
      }
      
      await updateDocument('discussions', discussionId, { 
        likes: newLikes,
        likedBy: newLikedBy
      });
      
      // Update parent component
      if (onDiscussionUpdate) {
        onDiscussionUpdate(discussionId, { likes: newLikes, likedBy: newLikedBy });
      }
    } catch (error) {
      console.error('Error updating like count:', error);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now - date) / (1000 * 60));
      return diffInMinutes <= 1 ? 'Just now' : `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d ago`;
    }
  };

  const handleDelete = async (discussionId) => {
    if (!user) return;
    
    const confirmed = window.confirm('Are you sure you want to delete this discussion? This action cannot be undone.');
    if (!confirmed) return;
    
    try {
      await deleteDiscussion(discussionId, user.uid);
      
      // Notify parent component
      if (onDiscussionUpdate) {
        onDiscussionUpdate(discussionId, null); // null means delete
      }
      
      showSuccessToast('Discussion deleted successfully');
    } catch (error) {
      console.error('Error deleting discussion:', error);
      showErrorToast(error.message || 'Failed to delete discussion');
    }
  };

  const handleEditDiscussion = (discussion) => {
    if (!user || discussion.authorId !== user.uid) return;
    
    setEditingDiscussion(discussion);
    setReplyingTo(null);
    setSelectedPoint(null);
    setSelectedReplyType('general');
    setReplyingToReply(null);
    setSelectedReplyForPoints(null);
  };

  const handleEditComplete = (updatedDiscussion) => {
    if (onDiscussionUpdate) {
      onDiscussionUpdate(updatedDiscussion.id, updatedDiscussion);
    }
    setEditingDiscussion(null);
  };

  const handleEditCancel = () => {
    setEditingDiscussion(null);
  };

  const handleReplyEdited = (updatedReply) => {
    // Notify parent to update the reply
    if (onDiscussionUpdate) {
      onDiscussionUpdate(discussion.id, { 
        ...discussion,
        replies: (discussion.replies || []).map(r =>
          r.id === updatedReply.id ? updatedReply : r
        )
      });
    }
  };

  const handleReplyToReply = async (reply) => {
    if (!user || !selectedDiscussion) return;

    setReplyingToReply(reply);
    setReplyingTo(selectedDiscussion.id);
    setSelectedPoint(null);
    setSelectedReplyType('general');
    setSelectedReplyForPoints(null);
    
    setTimeout(smoothScrollToReplyForm, 100);
  };

  const handleReplyAddedLocal = (discussionId, newReply) => {
    if (onReplyAdded) {
      onReplyAdded(discussionId, newReply);
    }
    
    // Close the reply form
    setTimeout(() => {
      setReplyingTo(null);
      setSelectedPoint(null);
      setSelectedReplyType('general');
      setSelectedDiscussion(null);
      setReplyingToReply(null);
    }, 200);
    
    // Expand replies to show the new reply
    if (setExpandedReplies) {
      setExpandedReplies(prev => new Set([...prev, discussionId]));
    }
  };

  const handleDeleteReply = async (discussionId, replyId) => {
    if (!user) return;
    
    const confirmed = window.confirm('Are you sure you want to delete this reply?');
    if (!confirmed) return;
    
    try {
      await deleteReply(discussionId, replyId, user.uid);
      
      // Update parent component
      if (onDiscussionUpdate) {
        onDiscussionUpdate(discussionId, {
          ...discussion,
          replies: discussion.replies.filter(r => r.id !== replyId),
          replyCount: Math.max(0, (discussion.replyCount || 0) - 1)
        });
      }
      
      showSuccessToast('Reply deleted successfully');
    } catch (error) {
      console.error('Error deleting reply:', error);
      showErrorToast(error.message || 'Failed to delete reply');
    }
  };

  const toggleReplies = async (discussionId) => {
    if (!setExpandedReplies) return;
    
    const wasExpanded = expandedReplies?.has(discussionId);
    
    setExpandedReplies(prev => {
      const newSet = new Set(prev);
      if (newSet.has(discussionId)) {
        newSet.delete(discussionId);
      } else {
        newSet.add(discussionId);
      }
      return newSet;
    });

    // Generate fact-check results for replies when expanding (if needed)
    if (!wasExpanded && discussion.replies && discussion.replies.length > 0) {
      // This could be implemented if needed for dashboard
    }
  };

  const toggleAIPoints = (discussionId) => {
    if (!setExpandedAIPoints) return;
    
    setExpandedAIPoints(prev => {
      const next = new Set(prev);
      if (next.has(discussionId)) {
        next.delete(discussionId);
      } else {
        next.add(discussionId);
      }
      return next;
    });
  };

  const handlePointClick = (discussion, point) => {
    if (!user) return;
    
    setSelectedDiscussion(discussion);
    setSelectedPoint(point);
    setSelectedReplyType('general');
    setReplyingToReply(null);
    setSelectedReplyForPoints(null);
    setReplyingTo(discussion.id);
    
    setTimeout(smoothScrollToReplyForm, 100);
  };

  const handleReplyPointClick = (reply, point) => {
    if (!user) return;
    
    setSelectedDiscussion(discussion);
    setSelectedPoint(point);
    setSelectedReplyType('general');
    setReplyingToReply(reply);
    setSelectedReplyForPoints(reply);
    setReplyingTo(discussion.id);
    
    setTimeout(smoothScrollToReplyForm, 100);
  };

  const toggleDiscussion = async (discussionId) => {
    if (!setExpandedDiscussions) return;
    
    const wasExpanded = expandedDiscussions?.has(discussionId);
    
    setExpandedDiscussions(prev => {
      const next = new Set(prev);
      if (next.has(discussionId)) {
        next.delete(discussionId);
      } else {
        next.add(discussionId);
      }
      return next;
    });

    // Generate AI points and fact-check results when expanding if they don't exist
    if (!wasExpanded && discussion) {
      // Generate AI points if missing
      if (!discussion.aiPointsGenerated && (!discussion.aiPoints || discussion.aiPoints.length === 0)) {
        try {
          console.log('Generating AI points for discussion:', discussion.id);
          const aiPoints = await AIService.generatePoints(discussion.content, discussion.title);
          await updateAIPoints(discussion.id, aiPoints);
          
          // Update parent component
          if (onDiscussionUpdate) {
            onDiscussionUpdate(discussion.id, { ...discussion, aiPoints, aiPointsGenerated: true });
          }
        } catch (error) {
          console.error('Error generating AI points for discussion:', discussionId, error);
        }
      }
      
      // Generate fact-check results if missing
      if (!discussion.factCheckGenerated && !discussion.factCheckResults) {
        try {
          console.log('Generating fact-check results for discussion:', discussion.id);
          let factCheckResults;
          
          if (discussion.aiPoints && discussion.aiPoints.length > 0) {
            factCheckResults = await AIService.factCheckPoints(discussion.aiPoints, discussion.title);
          } else {
            factCheckResults = await AIService.factCheckContent(discussion.content, discussion.title);
          }
          
          await updateFactCheckResults(discussion.id, factCheckResults);
          
          // Update parent component
          if (onDiscussionUpdate) {
            onDiscussionUpdate(discussion.id, { ...discussion, factCheckResults, factCheckGenerated: true });
          }
        } catch (error) {
          console.error('Error generating fact-check results for discussion:', discussionId, error);
        }
      }
    }

    // Increment view count only when expanding (not collapsing) and user is authenticated
    if (!wasExpanded && user) {
      try {
        const result = await incrementDiscussionView(discussionId, user.uid);
        
        // Update parent component with new view count
        if (onDiscussionUpdate) {
          onDiscussionUpdate(discussionId, { 
            ...discussion, 
            views: result.views, 
            viewedBy: result.viewedBy 
          });
        }
      } catch (error) {
        console.error('Error incrementing discussion view:', error);
      }
    }
  };

  // If showing compact view and not expanded, show simplified version
  if (showCompactView && !isExpanded) {
    return (
      <button
        onClick={() => toggleDiscussion(discussion.id)}
        className="w-full border border-black/10 rounded-lg p-4 hover:bg-gray-50 transition-colors text-left"
      >
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-gray-900 mb-1 hover:text-black transition-colors">
              <SearchHighlight text={discussion.title} searchQuery={searchQuery} />
            </h3>
            {/* Tags in compact view */}
            {discussion.tags && discussion.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {discussion.tags.slice(0, 3).map((tag, index) => (
                  <span
                    key={index}
                    className={`inline-block px-2 py-0.5 text-xs rounded-full font-medium ${
                      tag === 'News' 
                        ? 'bg-red-100 text-red-800 border border-red-200' 
                        : 'bg-gray-100 text-gray-600 border border-gray-200'
                    }`}
                  >
                    {tag}
                  </span>
                ))}
                {discussion.tags.length > 3 && (
                  <span className="inline-block px-2 py-0.5 text-xs rounded-full font-medium bg-gray-50 text-gray-500 border border-gray-200">
                    +{discussion.tags.length - 3}
                  </span>
                )}
              </div>
            )}
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleReplies(discussion.id);
                }}
                className="flex items-center gap-1 hover:text-gray-700"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                {discussion.replyCount || 0}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleLike(discussion.id);
                }}
                className="flex items-center gap-1 hover:text-gray-700"
                disabled={!user}
              >
                <svg className="w-4 h-4" fill={user && (discussion.likedBy || []).includes(user.uid) ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                {discussion.likes || 0}
              </button>
              <span>{formatDate(discussion.createdAt)}</span>
            </div>
          </div>
          <div className="flex items-center gap-3 text-left flex-shrink-0">
            <svg className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-90' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </button>
    );
  }

  return (
    <div className="rounded-lg border border-black/20">
      <button
        onClick={() => toggleDiscussion(discussion.id)}
        className={`flex ${isExpanded ? '' : 'hidden'} w-full justify-end `}
        title={isExpanded ? 'Collapse' : 'Expand'}
      >
        <svg className={`w-5 h-5 rotate-90 mr-4 mt-2`} viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
      
      {/* Header Row - shows title and controls */}
      {!isExpanded && (
        <button
          onClick={() => toggleDiscussion(discussion.id)}
          className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors text-left"
        >
          <div className="flex-1 min-w-0 mr-4">
            <div className="font-semibold text-gray-900 truncate mb-1">
              <SearchHighlight text={discussion.title} searchQuery={searchQuery} />
            </div>
            {/* Tags in compressed view */}
            {discussion.tags && discussion.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {discussion.tags.slice(0, 3).map((tag, index) => (
                  <span
                    key={index}
                    className={`inline-block px-2 py-0.5 text-xs rounded-full font-medium ${
                      tag === 'News' 
                        ? 'bg-red-100 text-red-800 border border-red-200' 
                        : 'bg-gray-100 text-gray-600 border border-gray-200'
                    }`}
                  >
                    {tag}
                  </span>
                ))}
                {discussion.tags.length > 3 && (
                  <span className="inline-block px-2 py-0.5 text-xs rounded-full font-medium bg-gray-50 text-gray-500 border border-gray-200">
                    +{discussion.tags.length - 3}
                  </span>
                )}
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-4">
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleReplies(discussion.id);
              }}
              className="flex items-center gap-1 text-sm text-gray-800 hover:text-black"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              {discussion.replyCount || 0}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleLike(discussion.id);
              }}
              className="flex items-center gap-1 text-sm text-gray-800 hover:text-black"
              disabled={!user}
            >
              <svg className="w-4 h-4" fill={user && (discussion.likedBy || []).includes(user.uid) ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              {discussion.likes || 0}
            </button>

            <div className="flex items-center gap-3 text-left flex-shrink-0">
              <svg className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-90' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </button>
      )}

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-4 pb-4 pt-1">
          {/* Title and author info */}
          <div className="pb-2">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              <SearchHighlight text={discussion.title} searchQuery={searchQuery} />
            </h3>
            <div className="flex items-center gap-3">
              <div className="text-xs text-gray-600">
                <SearchHighlight text={discussion.authorName} searchQuery={searchQuery} /> · {formatDate(discussion.createdAt)}
                {discussion.isEdited && discussion.editedAt && (
                  <span className="text-gray-500 italic"> · edited {formatDate(discussion.editedAt)}</span>
                )}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="mb-2">
            <p className="text-gray-900 whitespace-pre-wrap leading-relaxed text-sm break-words">
              <SearchHighlight text={discussion.content} searchQuery={searchQuery} />
            </p>
          </div>

          {/* Tags */}
          {discussion.tags && discussion.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {discussion.tags.map((tag, index) => (
                <span
                  key={index}
                  className={`inline-block px-3 py-1 text-xs rounded-full font-medium ${
                    tag === 'News' 
                      ? 'bg-red-100 text-red-800 border border-red-200' 
                      : 'bg-gray-100 text-gray-700 border border-gray-200'
                  }`}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* AI Generated Indicator with Source */}
          {discussion.metadata?.isAIGenerated && (
            <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="text-sm mb-2">
                <div className="text-blue-800 font-medium mb-1">AI Generated Discussion</div>
                {discussion.metadata.newsStory?.stance && (
                  <div className="text-blue-700">
                    Stance: {discussion.metadata.newsStory.stance}
                  </div>
                )}
              </div>
              
              {/* Source Information */}
              {discussion.metadata.newsStory?.source && (
                <div className="text-xs">
                  <div className="text-blue-700 min-w-0 break-words">
                    Based on: <strong>{discussion.metadata.newsStory.source.name}</strong>
                    {discussion.metadata.newsStory.source.url && (
                      <>
                        {' • '}
                        <a 
                          href={discussion.metadata.newsStory.source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 underline break-all"
                          title={discussion.metadata.newsStory.source.urlValidated === false 
                            ? `Original article link unavailable. This links to ${discussion.metadata.newsStory.source.name}'s website.`
                            : discussion.metadata.newsStory.source.groundingTitle 
                              ? `Read: ${discussion.metadata.newsStory.source.groundingTitle}`
                              : 'Read the original article'
                          }
                        >
                          {discussion.metadata.newsStory.source.urlValidated === false 
                            ? `Visit ${discussion.metadata.newsStory.source.name}`
                            : 'Read Original Article'
                          }
                        </a>
                        {discussion.metadata.newsStory.source.urlValidated === false && (
                          <span className="text-orange-600 ml-1" title="Original article link was not accessible">
                            ⚠️
                          </span>
                        )}
                      </>
                    )}
                    {discussion.metadata.newsStory.source.publishedAt && (
                      <span className="text-blue-600 ml-2">
                        • Published: {new Date(discussion.metadata.newsStory.source.publishedAt).toLocaleDateString()}
                      </span>
                    )}
                    {discussion.metadata.newsStory.source.searchQuery && (
                      <span className="text-gray-500 ml-2 text-xs break-words">
                        • Search: &ldquo;{discussion.metadata.newsStory.source.searchQuery}&rdquo;
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Fact Check Results */}
          {discussion.factCheckResults && (
            <FactCheckResults 
              factCheckResults={discussion.factCheckResults} 
              isLoading={false}
              searchQuery={searchQuery}
            />
          )}

          {/* AI points (collapsible and clickable) */}
          {discussion.aiPoints && discussion.aiPoints.length > 0 && (
            <div className="mt-2 mb-2 rounded-lg border border-black/20">
              <button
                onClick={() => toggleAIPoints(discussion.id)}
                className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50"
              >
                <div className="flex items-center gap-2">
                  <svg className={`w-4 h-4 transition-transform ${expandedAIPoints?.has(discussion.id) ? 'rotate-90' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  <span className="text-sm font-semibold text-gray-900">Key Discussion Points</span>
                </div>
                <div className="text-xs text-gray-600">
                  {discussion.aiPoints.length} point{discussion.aiPoints.length !== 1 ? 's' : ''}
                </div>
              </button>

              {expandedAIPoints?.has(discussion.id) && (
                <div className="px-3 pb-3 border-t border-black/10">
                  <div className="mt-2 space-y-2">
                    {discussion.aiPoints.map((point) => {
                      const pointKey = `${discussion.id}-${point.id}`;
                      const isCollected = collectedPoints?.has(pointKey);
                      const pointCount = pointCounts?.get(pointKey) || 0;
                      
                      return (
                        <button
                          key={point.id}
                          onClick={() => handlePointClick(discussion, point)}
                          className={`w-full flex items-start gap-3 p-3 text-left rounded-lg border transition-all ${
                            isCollected 
                              ? 'bg-green-50 border-green-200' 
                              : 'hover:bg-gray-50 border-transparent hover:border-black/20'
                          }`}
                          disabled={!user}
                        >
                          {/* Checkbox indicator */}
                          <div className="flex-shrink-0 mt-0.5">
                            {isCollected ? (
                              <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              </div>
                            ) : (
                              <div className="w-1 h-1 bg-black rounded-full mt-2"></div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm ${isCollected ? 'text-green-800' : 'text-gray-900'}`}>
                              <SearchHighlight text={point.text} searchQuery={searchQuery} />
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              {point.type && (
                                <span className="inline-block px-2 py-0.5 text-[10px] rounded-full bg-black text-white uppercase tracking-wide">
                                  <SearchHighlight text={point.type} searchQuery={searchQuery} />
                                </span>
                              )}
                              {pointCount > 0 && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] rounded-full bg-purple-100 text-purple-800 font-medium">
                                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                  </svg>
                                  {pointCount}
                                </span>
                              )}
                            </div>
                            {user && (
                              <div className={`text-xs mt-1 ${isCollected ? 'text-green-600' : 'text-gray-600'}`}>
                                {isCollected ? 'Point earned!' : 'Click to reply to this point'}
                              </div>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center gap-4 mt-4 pb-3 border-b border-black/10">
            <button
              onClick={() => toggleReplies(discussion.id)}
              className="flex items-center gap-1 text-sm text-gray-800 hover:text-black"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              {discussion.replyCount || 0}
              <svg className={`w-3 h-3 transition-transform ${expandedReplies?.has(discussion.id) ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <button
              onClick={() => handleLike(discussion.id)}
              className="flex items-center gap-1 text-sm text-gray-800 hover:text-black"
              disabled={!user}
            >
              <svg className="w-4 h-4" fill={user && (discussion.likedBy || []).includes(user.uid) ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              {discussion.likes || 0}
            </button>
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              {discussion.views || 0}
            </div>
            {user && discussion.authorId === user.uid && (
              <>
                <button
                  onClick={() => handleEditDiscussion(discussion)}
                  className="p-1 text-gray-800 hover:text-black"
                  title="Edit discussion"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  onClick={() => handleDelete(discussion.id)}
                  className="p-1 text-gray-800 hover:text-black"
                  title="Delete discussion"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </>
            )}
          </div>

          {/* Edit form */}
          {editingDiscussion && editingDiscussion.id === discussion.id && (
            <div className="mt-3">
              <EditDiscussionForm
                discussion={editingDiscussion}
                onEditComplete={handleEditComplete}
                onCancel={handleEditCancel}
              />
            </div>
          )}

          {/* Reply form */}
          {replyingTo === discussion.id && !editingDiscussion && (
            <div className="mt-3" ref={replyFormRef}>
              <TextReplyForm
                discussionId={discussion.id}
                selectedPoint={selectedPoint}
                replyType={selectedReplyType}
                replyingToReply={replyingToReply}
                selectedReplyForPoints={selectedReplyForPoints}
                discussionTitle={discussion.title}
                discussionContent={discussion.content}
                parentFactCheck={discussion.factCheckResults}
                onReplyAdded={(reply) => handleReplyAddedLocal(discussion.id, reply)}
                onPointsEarned={refreshPointsData}
                onCancel={() => {
                  setReplyingTo(null);
                  setSelectedPoint(null);
                  setSelectedReplyType('general');
                  setReplyingToReply(null);
                  setSelectedReplyForPoints(null);
                }}
              />
            </div>
          )}

          {/* Replies */}
          {expandedReplies?.has(discussion.id) && (discussion.replies || []).length > 0 && (
            <div className="mt-3 pt-3 border-t border-black/10">
              <ReplyTree
                replies={discussion.replies}
                aiPoints={discussion.aiPoints || []}
                discussionId={discussion.id}
                searchQuery={searchQuery}
                onReplyToReply={(reply) => {
                  setSelectedDiscussion(discussion);
                  handleReplyToReply(reply);
                }}
                onDeleteReply={handleDeleteReply}
                onReplyEdited={handleReplyEdited}
                onReplyView={async (replyId, userId) => {
                  try {
                    await incrementReplyView(discussion.id, replyId, userId);
                    // Update parent component
                    if (onDiscussionUpdate) {
                      onDiscussionUpdate(discussion.id, {
                        ...discussion,
                        replies: (discussion.replies || []).map(r =>
                          r.id === replyId
                            ? { ...r, views: (r.views || 0) + 1, viewedBy: [...(r.viewedBy || []), userId] }
                            : r
                        )
                      });
                    }
                  } catch (error) {
                    console.error('Error incrementing reply view:', error);
                    throw error;
                  }
                }}
                onPointClick={handleReplyPointClick}
                maxLevel={3}
                showFilters={true}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}