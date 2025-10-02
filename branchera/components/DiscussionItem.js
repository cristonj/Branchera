'use client';

import { useState, useRef, useMemo } from 'react';
import Link from 'next/link';
import { useDatabase } from '@/hooks/useDatabase';
import { useAuth } from '@/contexts/AuthContext';
import TextReplyForm from './TextReplyForm';
import SearchHighlight from './SearchHighlight';
import EditDiscussionForm from './EditDiscussionForm';
import EditReplyForm from './EditReplyForm';
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
  const [editingReply, setEditingReply] = useState(null);
  const [expandedNestedReplies, setExpandedNestedReplies] = useState({});
  const replyFormRef = useRef(null);

  const {
    deleteDiscussion,
    deleteReply,
    incrementDiscussionView,
    updateDocument,
    voteOnReply,
    editReply
  } = useDatabase();
  const { user } = useAuth();

  const toastContext = useToast();
  const showSuccessToast = toastContext?.showSuccessToast || (() => {});
  const showErrorToast = toastContext?.showErrorToast || (() => {});

  const isExpanded = useMemo(() => {
    if (!expandedDiscussions || !discussion?.id) return false;
    return !!expandedDiscussions[discussion.id];
  }, [expandedDiscussions, discussion?.id]);

  // Safety check
  if (!discussion || !discussion.id) {
    return null;
  }

  const replies = discussion.replies || [];

  // Smooth scroll to reply form
  const smoothScrollToReplyForm = () => {
    if (replyFormRef.current) {
      setTimeout(() => {
        const elementTop = replyFormRef.current.getBoundingClientRect().top + window.pageYOffset;
        const offset = 80;
        window.scrollTo({
          top: elementTop - offset,
          behavior: 'smooth'
        });
      }, 100);
    }
  };

  const handleVote = async (discussionId, voteType) => {
    try {
      if (!user) return;
      
      const upvotedBy = discussion.upvotedBy || [];
      const downvotedBy = discussion.downvotedBy || [];
      const hasUpvoted = upvotedBy.includes(user.uid);
      const hasDownvoted = downvotedBy.includes(user.uid);
      
      let newUpvotedBy = [...upvotedBy];
      let newDownvotedBy = [...downvotedBy];
      let newUpvotes = discussion.upvotes || 0;
      let newDownvotes = discussion.downvotes || 0;
      
      if (voteType === 'upvote') {
        if (hasUpvoted) {
          // Remove upvote
          newUpvotedBy = upvotedBy.filter(uid => uid !== user.uid);
          newUpvotes = Math.max(0, newUpvotes - 1);
        } else {
          // Add upvote
          newUpvotedBy = [...upvotedBy, user.uid];
          newUpvotes = newUpvotes + 1;
          // Remove downvote if exists
          if (hasDownvoted) {
            newDownvotedBy = downvotedBy.filter(uid => uid !== user.uid);
            newDownvotes = Math.max(0, newDownvotes - 1);
          }
        }
      } else if (voteType === 'downvote') {
        if (hasDownvoted) {
          // Remove downvote
          newDownvotedBy = downvotedBy.filter(uid => uid !== user.uid);
          newDownvotes = Math.max(0, newDownvotes - 1);
        } else {
          // Add downvote
          newDownvotedBy = [...downvotedBy, user.uid];
          newDownvotes = newDownvotes + 1;
          // Remove upvote if exists
          if (hasUpvoted) {
            newUpvotedBy = upvotedBy.filter(uid => uid !== user.uid);
            newUpvotes = Math.max(0, newUpvotes - 1);
          }
        }
      }
      
      await updateDocument('discussions', discussionId, { 
        upvotes: newUpvotes,
        downvotes: newDownvotes,
        upvotedBy: newUpvotedBy,
        downvotedBy: newDownvotedBy
      });
      
      if (onDiscussionUpdate) {
        onDiscussionUpdate(discussionId, { 
          upvotes: newUpvotes, 
          downvotes: newDownvotes,
          upvotedBy: newUpvotedBy, 
          downvotedBy: newDownvotedBy 
        });
      }
    } catch (error) {
      console.error('Failed to vote:', error);
    }
  };

  const handleDelete = async (discussionId) => {
    if (!user) return;
    
    const confirmed = window.confirm('Are you sure you want to delete this discussion? This action cannot be undone.');
    if (!confirmed) return;
    
    try {
      await deleteDiscussion(discussionId, user.uid);
      
      if (onDiscussionUpdate) {
        onDiscussionUpdate(discussionId, null);
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
    setEditingReply(null);

    smoothScrollToReplyForm();
  };

  const handleReplyToReply = (reply) => {
    if (!user) return;

    setReplyingTo(discussion.id);
    setReplyingToReply(reply);
    setEditingDiscussion(null);
    setEditingReply(null);

    smoothScrollToReplyForm();
  };

  const handleVoteOnReply = async (reply, voteType) => {
    if (!user) return;
    
    try {
      const updatedReply = await voteOnReply(discussion.id, reply.id, user.uid, voteType);
      
      // Update local state
      if (onDiscussionUpdate) {
        const updatedReplies = replies.map(r => 
          r.id === updatedReply.id ? updatedReply : r
        );
        onDiscussionUpdate(discussion.id, { 
          ...discussion, 
          replies: updatedReplies 
        });
      }
    } catch (error) {
      showErrorToast('Failed to vote on reply');
      console.error('Vote error:', error);
    }
  };

  const handleEditReply = (reply) => {
    if (!user || reply.authorId !== user.uid) return;
    
    setEditingReply(reply);
    setReplyingTo(null);
    setReplyingToReply(null);
  };

  const handleEditReplyComplete = (updatedReply) => {
    if (onDiscussionUpdate) {
      const updatedReplies = replies.map(r => 
        r.id === updatedReply.id ? updatedReply : r
      );
      onDiscussionUpdate(discussion.id, { 
        ...discussion, 
        replies: updatedReplies 
      });
    }
    setEditingReply(null);
  };

  const handleEditReplyCancel = () => {
    setEditingReply(null);
  };

  const handleDeleteReply = async (replyId) => {
    if (!user) return;
    
    const confirmed = window.confirm('Are you sure you want to delete this reply? This action cannot be undone.');
    if (!confirmed) return;
    
    try {
      await deleteReply(discussion.id, replyId, user.uid);
      
      // Update local state
      if (onDiscussionUpdate) {
        const updatedReplies = replies.filter(r => r.id !== replyId);
        onDiscussionUpdate(discussion.id, { 
          ...discussion, 
          replies: updatedReplies,
          replyCount: updatedReplies.length
        });
      }
      
      showSuccessToast('Reply deleted successfully');
    } catch (error) {
      showErrorToast(error.message || 'Failed to delete reply');
    }
  };

  const toggleNestedReplies = (replyId) => {
    setExpandedNestedReplies(prev => ({
      ...prev,
      [replyId]: !prev[replyId]
    }));
  };

  const handleReplyAddedLocal = (discussionId, newReply) => {
    if (onReplyAdded) {
      onReplyAdded(discussionId, newReply);
    }
    
    setTimeout(() => {
      setReplyingTo(null);
      setReplyingToReply(null);
    }, 200);
    
    if (setExpandedReplies) {
      setExpandedReplies(prev => ({ ...prev, [discussionId]: true }));
    }
  };

  // Build reply tree structure
  const buildReplyTree = (replies) => {
    const replyMap = {};
    const rootReplies = [];

    // Create a map of all replies
    replies.forEach(reply => {
      replyMap[reply.id] = { ...reply, children: [] };
    });

    // Build the tree structure
    replies.forEach(reply => {
      if (reply.replyToReplyId && replyMap[reply.replyToReplyId]) {
        replyMap[reply.replyToReplyId].children.push(replyMap[reply.id]);
      } else {
        rootReplies.push(replyMap[reply.id]);
      }
    });

    return rootReplies;
  };

  // Render individual reply with Twitter-like UI
  const renderReply = (reply, level = 0) => {
    const hasChildren = reply.children && reply.children.length > 0;
    const isExpanded = expandedNestedReplies[reply.id];
    const isEditing = editingReply && editingReply.id === reply.id;
    const maxLevel = 3;
    const canReply = level < maxLevel && user;

    return (
      <div key={reply.id} className={`${level > 0 ? 'ml-8 mt-2 border-l-2 border-gray-200 pl-3' : ''}`}>
        <div className="bg-white rounded-lg border border-black/10 p-3">
          {/* Reply Header */}
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-900">{reply.authorName}</span>
              <span className="text-xs text-gray-500">{formatDate(reply.createdAt)}</span>
              {reply.isEdited && reply.editedAt && (
                <span className="text-xs text-gray-500 italic">· edited</span>
              )}
            </div>
          </div>

          {/* Reply Content */}
          {isEditing ? (
            <EditReplyForm
              discussionId={discussion.id}
              reply={reply}
              onEditComplete={handleEditReplyComplete}
              onCancel={handleEditReplyCancel}
            />
          ) : (
            <>
              <p className="text-sm text-gray-900 whitespace-pre-wrap leading-relaxed mb-2">
                {reply.content}
              </p>

              {/* Reply Actions */}
              <div className="flex items-center gap-4 text-xs">
                {/* Vote buttons */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleVoteOnReply(reply, 'upvote')}
                    className={`p-1 rounded hover:bg-gray-100 transition-colors ${
                      user && (reply.upvotedBy || []).includes(user.uid) 
                        ? 'text-green-600' 
                        : 'text-gray-600'
                    } ${!user ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={!user}
                    title={user ? 'Upvote' : 'Log in to vote'}
                  >
                    <svg className="w-4 h-4" fill={user && (reply.upvotedBy || []).includes(user.uid) ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  </button>
                  <span className="font-medium text-gray-700 min-w-[20px] text-center">
                    {(reply.upvotes || 0) - (reply.downvotes || 0)}
                  </span>
                  <button
                    onClick={() => handleVoteOnReply(reply, 'downvote')}
                    className={`p-1 rounded hover:bg-gray-100 transition-colors ${
                      user && (reply.downvotedBy || []).includes(user.uid) 
                        ? 'text-red-600' 
                        : 'text-gray-600'
                    } ${!user ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={!user}
                    title={user ? 'Downvote' : 'Log in to vote'}
                  >
                    <svg className="w-4 h-4" fill={user && (reply.downvotedBy || []).includes(user.uid) ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>

                {/* Reply button */}
                {canReply && (
                  <button
                    onClick={() => handleReplyToReply(reply)}
                    className="flex items-center gap-1 text-gray-600 hover:text-gray-900 hover:bg-gray-100 px-2 py-1 rounded transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                    </svg>
                    <span>Reply</span>
                  </button>
                )}

                {/* Show replies button */}
                {hasChildren && (
                  <button
                    onClick={() => toggleNestedReplies(reply.id)}
                    className="flex items-center gap-1 text-gray-600 hover:text-gray-900 hover:bg-gray-100 px-2 py-1 rounded transition-colors"
                  >
                    <svg className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                    <span>{reply.children.length} {reply.children.length === 1 ? 'reply' : 'replies'}</span>
                  </button>
                )}

                {/* Edit/Delete buttons for own replies */}
                {user && reply.authorId === user.uid && (
                  <>
                    <button
                      onClick={() => handleEditReply(reply)}
                      className="flex items-center gap-1 text-gray-600 hover:text-gray-900 hover:bg-gray-100 px-2 py-1 rounded transition-colors ml-auto"
                      title="Edit reply"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => handleDeleteReply(reply.id)}
                      className="flex items-center gap-1 text-gray-600 hover:text-red-600 hover:bg-red-50 px-2 py-1 rounded transition-colors"
                      title="Delete reply"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      <span>Delete</span>
                    </button>
                  </>
                )}
              </div>
            </>
          )}
        </div>

        {/* Nested replies */}
        {hasChildren && isExpanded && (
          <div className="mt-2">
            {reply.children.map(childReply => renderReply(childReply, level + 1))}
          </div>
        )}
      </div>
    );
  };

  // Main render function for all replies
  const renderReplies = (replies) => {
    const replyTree = buildReplyTree(replies);
    return replyTree.map(reply => renderReply(reply, 0));
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/discussion/${discussion.slug}`;
    
    try {
      if (navigator.share) {
        await navigator.share({
          title: discussion.title,
          text: discussion.content.substring(0, 100) + '...',
          url: url
        });
        showSuccessToast('Shared successfully!');
      } else {
        await navigator.clipboard.writeText(url);
        showSuccessToast('Link copied to clipboard!');
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
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

  const toggleReplies = async (discussionId) => {
    if (!setExpandedReplies) return;

    setExpandedReplies(prev => {
      const next = { ...prev };
      if (next[discussionId]) {
        delete next[discussionId];
      } else {
        next[discussionId] = true;
      }
      return next;
    });
  };

  const toggleDiscussion = async (discussionId) => {
    if (!setExpandedDiscussions) return;

    setExpandedDiscussions(prev => {
      const next = { ...prev };
      const currentlyExpanded = !!next[discussionId];

      if (currentlyExpanded) {
        delete next[discussionId];
      } else {
        next[discussionId] = true;
      }

      // Increment view count when expanding
      if (!currentlyExpanded && user && discussion) {
        incrementDiscussionView(discussionId, user.uid).then(result => {
          if (onDiscussionUpdate && result && discussion) {
            onDiscussionUpdate(discussionId, {
              ...discussion,
              views: result.views,
              viewedBy: result.viewedBy
            });
          }
        }).catch(error => {
          console.error('Failed to increment view count:', error);
        });
      }

      return next;
    });
  };

  // Compact view rendering
  if (showCompactView && !isExpanded) {
    return (
      <div className="w-full border border-black/10 rounded-lg p-4 hover:bg-gray-50 transition-colors">
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <h3 
              onClick={() => toggleDiscussion(discussion.id)}
              className="font-medium text-gray-900 mb-1 hover:text-black transition-colors cursor-pointer"
            >
              <SearchHighlight text={discussion.title} searchQuery={searchQuery} />
            </h3>
            
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
                  <Tag>+{discussion.tags.length - 3}</Tag>
                )}
              </div>
            )}
            
            <div className="flex items-center gap-2 sm:gap-4 text-sm text-gray-500 flex-wrap">
              <button
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
              </button>
              <div className="flex items-center gap-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (user) handleVote(discussion.id, 'upvote');
                  }}
                  className={`p-0.5 hover:text-gray-700 ${user ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'} ${user && (discussion.upvotedBy || []).includes(user.uid) ? 'text-green-600' : ''}`}
                  title="Upvote"
                >
                  <svg className="w-4 h-4" fill={user && (discussion.upvotedBy || []).includes(user.uid) ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                </button>
                <span className="text-xs font-medium">{(discussion.upvotes || 0) - (discussion.downvotes || 0)}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (user) handleVote(discussion.id, 'downvote');
                  }}
                  className={`p-0.5 hover:text-gray-700 ${user ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'} ${user && (discussion.downvotedBy || []).includes(user.uid) ? 'text-red-600' : ''}`}
                  title="Downvote"
                >
                  <svg className="w-4 h-4" fill={user && (discussion.downvotedBy || []).includes(user.uid) ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
              <span>{formatDate(discussion.createdAt)}</span>
            </div>
          </div>
          
          <button
            onClick={() => toggleDiscussion(discussion.id)}
            className="p-2 flex-shrink-0 hover:bg-gray-100 rounded-lg transition-colors"
            title="Expand discussion"
          >
            <svg className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-90' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    );
  }

  // Main card rendering
  return (
    <div className="rounded-lg border border-black/20">
      {/* Collapsed Header */}
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
                  <Tag>+{discussion.tags.length - 3}</Tag>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleDiscussion(discussion.id);
              }}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Expand discussion"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            
            <div
              onClick={(e) => {
                e.stopPropagation();
                toggleReplies(discussion.id);
              }}
              className="flex items-center gap-1 text-sm text-gray-800 hover:text-black cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span>{discussion.replyCount || 0}</span>
            </div>
            
            <div className="flex items-center gap-1 text-sm text-gray-800">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (user) handleVote(discussion.id, 'upvote');
                }}
                className={`p-1 hover:text-black ${user ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'} ${user && (discussion.upvotedBy || []).includes(user.uid) ? 'text-green-600' : ''}`}
                title="Upvote"
              >
                <svg className="w-4 h-4" fill={user && (discussion.upvotedBy || []).includes(user.uid) ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              </button>
              <span className="text-sm font-medium">{(discussion.upvotes || 0) - (discussion.downvotes || 0)}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (user) handleVote(discussion.id, 'downvote');
                }}
                className={`p-1 hover:text-black ${user ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'} ${user && (discussion.downvotedBy || []).includes(user.uid) ? 'text-red-600' : ''}`}
                title="Downvote"
              >
                <svg className="w-4 h-4" fill={user && (discussion.downvotedBy || []).includes(user.uid) ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Expanded Header */}
      {isExpanded && (
        <div className="w-full px-3 sm:px-4 py-2 sm:py-3 flex items-start justify-between hover:bg-gray-50 transition-colors rounded-lg">
          <div className="flex-1 min-w-0 mr-4">
            <div className="font-semibold text-gray-900 mb-1 flex items-center gap-2 flex-wrap">
              <SearchHighlight text={discussion.title} searchQuery={searchQuery} />
            </div>
            
            <div className="text-xs text-gray-600">
              <SearchHighlight text={discussion.authorName} searchQuery={searchQuery} /> · {formatDate(discussion.createdAt)}
              {discussion.isEdited && discussion.editedAt && (
                <span className="text-gray-500 italic"> · edited {formatDate(discussion.editedAt)}</span>
              )}
              {discussion.slug && (
                <Link 
                  href={`/discussion/${discussion.slug}`}
                  className="mt-1 flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 hover:underline"
                  title="View full page"
                  onClick={(e) => e.stopPropagation()}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  <span>Go to Discussion</span>
                </Link>
              )}
            </div>
          </div>
          
          <button
            onClick={() => toggleDiscussion(discussion.id)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
            title="Collapse discussion"
          >
            <svg className="w-5 h-5 transition-transform rotate-90" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}

      {/* Expanded Content */}
      {isExpanded && (
        <div className="relative px-3 sm:px-4 pb-16 pt-2">
          {/* Content */}
          <div className="mb-3">
            <p className="text-gray-900 whitespace-pre-wrap leading-relaxed text-sm break-words">
              <SearchHighlight text={discussion.content} searchQuery={searchQuery} />
            </p>
          </div>

          {/* Tags */}
          {discussion.tags && discussion.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
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

          {/* Action Buttons */}
          <div className="flex items-center justify-between pb-3 border-b border-black/10 gap-2">
            <div className="flex flex-col sm:flex-row items-start sm:items-center sm:gap-3 gap-2">
              {/* Share button */}
              {discussion.slug && (
                <button
                  onClick={handleShare}
                  className="flex items-center gap-1.5 text-sm text-gray-700 hover:text-black transition-colors"
                  title="Share this discussion"
                >
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                  <span>Share</span>
                </button>
              )}
              
              {/* Stat buttons */}
              <div className="flex items-center gap-2.5 sm:gap-3">
                <button
                  onClick={() => toggleReplies(discussion.id)}
                  className="flex items-center gap-1.5 text-sm text-gray-700 hover:text-black transition-colors"
                  title="Toggle replies"
                >
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <span className="whitespace-nowrap">{discussion.replyCount || 0}</span>
                  <svg className={`w-3 h-3 flex-shrink-0 transition-transform ${expandedReplies?.[discussion.id] ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleVote(discussion.id, 'upvote')}
                    className={`p-1 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${user && (discussion.upvotedBy || []).includes(user.uid) ? 'text-green-600 hover:text-green-700' : 'text-gray-700 hover:text-black'}`}
                    disabled={!user}
                    title={user ? "Upvote discussion" : "Login to vote"}
                  >
                    <svg className="w-4 h-4 flex-shrink-0" fill={user && (discussion.upvotedBy || []).includes(user.uid) ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  </button>
                  <span className="text-sm font-medium whitespace-nowrap">{(discussion.upvotes || 0) - (discussion.downvotes || 0)}</span>
                  <button
                    onClick={() => handleVote(discussion.id, 'downvote')}
                    className={`p-1 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${user && (discussion.downvotedBy || []).includes(user.uid) ? 'text-red-600 hover:text-red-700' : 'text-gray-700 hover:text-black'}`}
                    disabled={!user}
                    title={user ? "Downvote discussion" : "Login to vote"}
                  >
                    <svg className="w-4 h-4 flex-shrink-0" fill={user && (discussion.downvotedBy || []).includes(user.uid) ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>
                
                <div className="flex items-center gap-1.5 text-sm text-gray-600" title="Views">
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <span className="whitespace-nowrap">{discussion.views || 0}</span>
                </div>
              </div>
            </div>
            
            {/* Edit/Delete buttons */}
            {user && discussion.authorId === user.uid && (
              <div className="flex flex-col sm:flex-row items-center gap-1.5 flex-shrink-0">
                <button
                  onClick={() => handleEditDiscussion(discussion)}
                  className="p-1.5 text-gray-700 hover:text-black hover:bg-gray-100 rounded transition-colors"
                  title="Edit discussion"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  onClick={() => handleDelete(discussion.id)}
                  className="p-1.5 text-gray-700 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                  title="Delete discussion"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            )}
          </div>

          {/* Floating Reply Button */}
          {user && (
            <button
              onClick={handleStartReply}
              className="absolute bottom-3 right-3 sm:right-4 w-10 h-10 bg-black text-white rounded-full shadow-lg hover:bg-gray-800 transition-colors flex items-center justify-center"
              title="Reply to discussion"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          )}

          {/* Edit Form */}
          {editingDiscussion && editingDiscussion.id === discussion.id && (
            <div className="mt-4">
              <EditDiscussionForm
                discussion={editingDiscussion}
                onEditComplete={handleEditComplete}
                onCancel={handleEditCancel}
              />
            </div>
          )}

          {/* Reply Form */}
          {replyingTo === discussion.id && !editingDiscussion && (
            <div className="mt-4" ref={replyFormRef}>
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
          {expandedReplies && expandedReplies[discussion.id] && replies.length > 0 && (
            <div className="mt-4 pt-4 border-t border-black/10">
              <div className="space-y-2">
                {renderReplies(replies)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
