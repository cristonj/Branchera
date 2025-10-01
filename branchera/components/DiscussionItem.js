'use client';

import { useState, useRef, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useDatabase } from '@/hooks/useDatabase';
import { useAuth } from '@/contexts/AuthContext';
import TextReplyForm from './TextReplyForm';
import SearchHighlight from './SearchHighlight';
import EditDiscussionForm from './EditDiscussionForm';
import { useToast } from '@/contexts/ToastContext';
import Tag from './Tag';
import { formatDate } from '@/lib/dateUtils';

export default function DiscussionItem({
  discussion,
  searchQuery = '',
  onDiscussionUpdate,
  onReplyAdded,
  expandedDiscussions,
  setExpandedDiscussions,
  expandedReplies,
  setExpandedReplies,
  showCompactView = false
}) {
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyingToReply, setReplyingToReply] = useState(null);
  const [editingDiscussion, setEditingDiscussion] = useState(null);
  const [selectedDiscussion, setSelectedDiscussion] = useState(null);
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [selectedReplyType, setSelectedReplyType] = useState('general');
  const [selectedReplyForPoints, setSelectedReplyForPoints] = useState(null);
  const replyFormRef = useRef(null);

  const {
    deleteDiscussion,
    deleteReply,
    incrementDiscussionView,
    updateDocument
  } = useDatabase();
  const { user } = useAuth();

  // Safely get toast functions with fallbacks
  const toastContext = useToast();
  const showSuccessToast = toastContext?.showSuccessToast || (() => {});
  const showErrorToast = toastContext?.showErrorToast || (() => {});

  const isExpanded = useMemo(() => {
    if (!expandedDiscussions || !discussion?.id) return false;
    return !!expandedDiscussions[discussion.id];
  }, [expandedDiscussions, discussion?.id]);

  // Safety check - return null if discussion is not provided
  if (!discussion || !discussion.id) {
    return null;
  }

  const replies = discussion.replies || [];

  // Enhanced smooth scroll function with fallbacks and top spacing
  const smoothScrollToReplyForm = () => {
    if (replyFormRef.current) {
      if ('scrollBehavior' in document.documentElement.style) {
        replyFormRef.current.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
          inline: 'nearest'
        });

        // Add additional space at the top by scrolling up a bit more
        setTimeout(() => {
          const elementTop = replyFormRef.current.getBoundingClientRect().top + window.pageYOffset;
          const offset = 80; // Adjust this value to control how much space to leave at the top
          window.scrollTo({
            top: elementTop - offset,
            behavior: 'smooth'
          });

        }, 100);
      } else {
        replyFormRef.current.scrollIntoView();
        // Fallback for older browsers - scroll up a bit more
        setTimeout(() => {
          const elementTop = replyFormRef.current.getBoundingClientRect().top + window.pageYOffset;
          const offset = 80; // Adjust this value to control how much space to leave at the top
          window.scrollTo(0, elementTop - offset);

        }, 100);
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

  const handleStartReply = () => {
    if (!user) return;

    setReplyingTo(discussion.id);
    setReplyingToReply(null);
    setEditingDiscussion(null);
    setSelectedDiscussion(discussion);
    setSelectedPoint(null);
    setSelectedReplyType('general');
    setSelectedReplyForPoints(null);

    setTimeout(smoothScrollToReplyForm, 100);
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
      setExpandedReplies(prev => ({ ...prev, [discussionId]: true }));
    }
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/discussion/${discussion.slug}`;
    
    try {
      // Try to use the Web Share API first (mobile-friendly)
      if (navigator.share) {
        await navigator.share({
          title: discussion.title,
          text: discussion.content.substring(0, 100) + '...',
          url: url
        });
        showSuccessToast('Shared successfully!');
      } else {
        // Fallback to clipboard
        await navigator.clipboard.writeText(url);
        showSuccessToast('Link copied to clipboard!');
      }
    } catch (error) {
      // If clipboard fails, show the URL in an alert
      if (error.name !== 'AbortError') {
        // Create a temporary input to copy
        const input = document.createElement('input');
        input.value = url;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
        showSuccessToast('Link copied to clipboard!');
      }
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
      showErrorToast(error.message || 'Failed to delete reply');
    }
  };

  const toggleReplies = async (discussionId) => {
    if (!setExpandedReplies) return;

    const wasExpanded = expandedReplies ? !!expandedReplies[discussionId] : false;

    setExpandedReplies(prev => {
      const next = { ...prev };
      if (next[discussionId]) {
        delete next[discussionId];
      } else {
        next[discussionId] = true;
      }
      return next;
    });

    // Generate fact-check results for replies when expanding (if needed)
    if (!wasExpanded && discussion.replies && discussion.replies.length > 0) {
      // This could be implemented if needed for dashboard
    }
  };

  const toggleAIPoints = (discussionId) => {
    // AI Points functionality not implemented yet
    console.log('AI Points toggle for discussion:', discussionId);
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

    const wasExpanded = isExpanded;

    setExpandedDiscussions(prev => {
      const next = { ...prev };
      const currentlyExpanded = !!next[discussionId];

      if (currentlyExpanded) {
        delete next[discussionId];
      } else {
        next[discussionId] = true;
      }

      // Increment view count only when expanding (not collapsing) and user is authenticated
      if (!currentlyExpanded && user && discussion) {
        // Increment view count asynchronously
        incrementDiscussionView(discussionId, user.uid).then(result => {
          // Check if component is still mounted and discussion still exists
          if (onDiscussionUpdate && result && discussion) {
            onDiscussionUpdate(discussionId, {
              ...discussion,
              views: result.views,
              viewedBy: result.viewedBy
            });
          }
        }).catch(error => {
          // Silently handle errors to prevent crashes
          console.error('Failed to increment view count:', error);
        });
      }

      return next;
    });
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
                        : tag === 'Bot'
                        ? 'bg-blue-100 text-blue-800 border border-blue-200'
                        : 'bg-gray-100 text-gray-600 border border-gray-200'
                    }`}
                  >
                    {tag}
                  </span>
                ))}
                {discussion.tags.length > 3 && (
                  <Tag>
                    +{discussion.tags.length - 3}
                  </Tag>
                )}
              </div>
            )}
            <div className="flex items-center gap-2 sm:gap-4 text-sm text-gray-500 flex-wrap">
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  toggleReplies(discussion.id);
                }}
                className="flex items-center gap-1 hover:text-gray-700 cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                {discussion.replyCount || 0}
              </div>
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  if (user) handleLike(discussion.id);
                }}
                className={`flex items-center gap-1 text-xs sm:text-sm hover:text-gray-700 ${user ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`}
              >
                <svg className="w-4 h-4" fill={user && (discussion.likedBy || []).includes(user.uid) ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                {discussion.likes || 0}
              </div>
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
      {/* Collapsed Header - shows when not expanded */}
      {!isExpanded && (
        <div className="w-full px-3 sm:px-4 py-2 sm:py-3 flex items-center justify-between hover:bg-gray-50 transition-colors min-h-10 rounded-lg">
          <div className="flex-1 min-w-0 mr-4">
            <div className="font-semibold text-gray-900 mb-1">
              {discussion.slug ? (
                <Link 
                  href={`/discussion/${discussion.slug}`}
                  className="hover:underline hover:text-blue-600 transition-colors"
                  title="View full discussion"
                >
                  <SearchHighlight text={discussion.title} searchQuery={searchQuery} />
                </Link>
              ) : (
                <button
                  onClick={() => toggleDiscussion(discussion.id)}
                  className="text-left truncate w-full"
                  title="Expand discussion"
                >
                  <SearchHighlight text={discussion.title} searchQuery={searchQuery} />
                </button>
              )}
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
                        : tag === 'Bot'
                        ? 'bg-blue-100 text-blue-800 border border-blue-200'
                        : 'bg-gray-100 text-gray-600 border border-gray-200'
                    }`}
                  >
                    {tag}
                  </span>
                ))}
                {discussion.tags.length > 3 && (
                  <Tag>
                    +{discussion.tags.length - 3}
                  </Tag>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleDiscussion(discussion.id);
              }}
              className="flex items-center gap-3 text-left flex-shrink-0"
              title="Expand discussion"
            >
              <svg className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-90' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <div
              onClick={(e) => {
                e.stopPropagation();
                toggleReplies(discussion.id);
              }}
              className="flex items-center gap-1 text-xs sm:text-sm text-gray-800 hover:text-black cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              {discussion.replyCount || 0}
            </div>
            <div
              onClick={(e) => {
                e.stopPropagation();
                if (user) handleLike(discussion.id);
              }}
              className={`flex items-center gap-1 text-sm text-gray-800 hover:text-black ${user ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`}
            >
              <svg className="w-4 h-4" fill={user && (discussion.likedBy || []).includes(user.uid) ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              {discussion.likes || 0}
            </div>
          </div>
        </div>
      )}

      {/* Expanded Header - shows when expanded */}
      {isExpanded && (
        <div className="w-full px-3 sm:px-4 py-2 sm:py-3 flex items-center justify-between hover:bg-gray-50 transition-colors rounded-lg">
          <div className="flex-1 min-w-0 mr-4">
            <div className="font-semibold text-gray-900 mb-1 flex items-center gap-2">
              <SearchHighlight text={discussion.title} searchQuery={searchQuery} />
              {discussion.slug && (
                <Link 
                  href={`/discussion/${discussion.slug}`}
                  className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 hover:underline ml-2"
                  title="View full page"
                  onClick={(e) => e.stopPropagation()}
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  <span className="hidden sm:inline">View</span>
                </Link>
              )}
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="text-xs text-gray-600">
                <SearchHighlight text={discussion.authorName} searchQuery={searchQuery} /> · {formatDate(discussion.createdAt)}
                {discussion.isEdited && discussion.editedAt && (
                  <span className="text-gray-500 italic"> · edited {formatDate(discussion.editedAt)}</span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={() => toggleDiscussion(discussion.id)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Collapse discussion"
          >
            <svg className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-90' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}

      {/* Expanded Content */}
      {isExpanded && (
        <div className="relative px-3 sm:px-4 pb-16 pt-2">
          {/* Content */}
          <div className="mb-2">
            <p className="text-gray-900 whitespace-pre-wrap leading-relaxed text-sm break-words">
              <SearchHighlight text={discussion.content} searchQuery={searchQuery} />
            </p>
          </div>

          {/* Tags */}
          {discussion.tags && discussion.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 sm:gap-2 mb-3">
              {discussion.tags.map((tag, index) => (
                <span
                  key={index}
                  className={`inline-block px-3 py-1 text-xs rounded-full font-medium ${
                    tag === 'News' 
                      ? 'bg-red-100 text-red-800 border border-red-200' 
                      : tag === 'Bot'
                      ? 'bg-blue-100 text-blue-800 border border-blue-200'
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


          {/* Action buttons */}
          <div className="flex items-center gap-2 sm:gap-4 mt-4 pb-3 border-b border-black/10 flex-wrap">
            <button
              onClick={() => toggleReplies(discussion.id)}
              className="flex items-center gap-1 text-xs sm:text-sm text-gray-800 hover:text-black"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              {discussion.replyCount || 0}
              <svg className={`w-3 h-3 transition-transform ${expandedReplies?.[discussion.id] ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <button
              onClick={() => handleLike(discussion.id)}
              className="flex items-center gap-1 text-xs sm:text-sm text-gray-800 hover:text-black"
              disabled={!user}
            >
              <svg className="w-4 h-4" fill={user && (discussion.likedBy || []).includes(user.uid) ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              {discussion.likes || 0}
            </button>
            <div className="flex items-center gap-1 text-xs sm:text-sm text-gray-600">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              {discussion.views || 0}
            </div>
            {discussion.slug && (
              <button
                onClick={handleShare}
                className="flex items-center gap-1 text-xs sm:text-sm text-gray-800 hover:text-black"
                title="Share this discussion"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                <span className="hidden sm:inline">Share</span>
              </button>
            )}
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

          {/* Floating Reply Button - Bottom Right Corner */}
          {user && (
            <button
              onClick={handleStartReply}
              className="absolute bottom-3 right-3 w-10 h-10 bg-black text-white rounded-full shadow-lg hover:bg-gray-800 transition-colors z-10 flex items-center justify-center"
              title="Reply to discussion"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          )}

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
                replyingToReply={replyingToReply}
                onReplyAdded={(reply) => handleReplyAddedLocal(discussion.id, reply)}
                onCancel={() => {
                  setReplyingTo(null);
                  setReplyingToReply(null);
                }}
              />
            </div>
          )}

          {/* Replies */}
          {expandedReplies && !!expandedReplies[discussion.id] && discussion.replies && discussion.replies.length > 0 && (
            <div className="mt-3 pt-3 border-t border-black/10">
              <div className="space-y-3">
                {discussion.replies.map((reply) => (
                  <div key={reply.id} className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-start gap-3">
                      <Image
                        src={reply.authorPhoto || '/default-avatar.png'}
                        alt={reply.authorName}
                        width={24}
                        height={24}
                        className="w-6 h-6 rounded-full flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-gray-900">{reply.authorName}</span>
                          <span className="text-xs text-gray-500">{new Date(reply.createdAt).toLocaleDateString()}</span>
                        </div>
                        <p className="text-sm text-gray-800">{reply.content}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}