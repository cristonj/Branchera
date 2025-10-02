'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useDatabase } from '@/hooks/useDatabase';
import { useToast } from '@/contexts/ToastContext';
import { formatDate } from '@/lib/dateUtils';
import TextReplyForm from './TextReplyForm';
import ReplyTree from './ReplyTree';
import TopNav from './TopNav';

/**
 * PublicDiscussionView - Renders a full discussion page with all content in the DOM for SEO
 * This component ensures that search engines can crawl and index all discussion content
 */
export default function PublicDiscussionView({ discussion: initialDiscussion }) {
  const [discussion, setDiscussion] = useState(initialDiscussion);
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyingToReply, setReplyingToReply] = useState(null);
  const [viewCountUpdated, setViewCountUpdated] = useState(false);
  const replyFormRef = useRef(null);
  const { user } = useAuth();
  const { updateDocument, incrementDiscussionView, deleteReply } = useDatabase();
  
  // Safely get toast functions with fallbacks
  const toastContext = useToast();
  const showSuccessToast = toastContext?.showSuccessToast || (() => {});
  const showErrorToast = toastContext?.showErrorToast || (() => {});

  // Update view count when component mounts (only if user is logged in)
  useEffect(() => {
    if (user && discussion?.id && !viewCountUpdated) {
      setViewCountUpdated(true);
      incrementDiscussionView(discussion.id, user.uid)
        .then(result => {
          if (result) {
            setDiscussion(prev => ({
              ...prev,
              views: result.views,
              viewedBy: result.viewedBy
            }));
          }
        })
        .catch(error => {
          console.error('Failed to increment view count:', error);
        });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, discussion?.id]);

  const handleVote = async (voteType) => {
    if (!user) {
      showErrorToast('Please log in to vote on discussions');
      return;
    }
    
    try {
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
      
      await updateDocument('discussions', discussion.id, { 
        upvotes: newUpvotes,
        downvotes: newDownvotes,
        upvotedBy: newUpvotedBy,
        downvotedBy: newDownvotedBy
      });
      
      setDiscussion(prev => ({
        ...prev,
        upvotes: newUpvotes,
        downvotes: newDownvotes,
        upvotedBy: newUpvotedBy,
        downvotedBy: newDownvotedBy
      }));
    } catch (error) {
      showErrorToast('Failed to update vote');
    }
  };

  const handleReplyAdded = (newReply) => {
    // Update discussion with new reply
    setDiscussion(prev => ({
      ...prev,
      replies: [...(prev.replies || []), newReply],
      replyCount: (prev.replyCount || 0) + 1
    }));
    
    setShowReplyForm(false);
    setReplyingToReply(null);
    showSuccessToast('Reply added successfully');
  };

  const handleReplyEdited = (updatedReply) => {
    // Update the reply in the local state
    setDiscussion(prev => ({
      ...prev,
      replies: (prev.replies || []).map(r => 
        r.id === updatedReply.id ? updatedReply : r
      )
    }));
  };

  const handleDeleteReply = async (discussionId, replyId) => {
    if (!user) {
      showErrorToast('Please log in to delete replies');
      return;
    }

    const confirmed = window.confirm('Are you sure you want to delete this reply? This action cannot be undone.');
    if (!confirmed) return;

    try {
      await deleteReply(discussionId, replyId, user.uid);
      
      // Update local state
      setDiscussion(prev => ({
        ...prev,
        replies: (prev.replies || []).filter(r => r.id !== replyId),
        replyCount: Math.max(0, (prev.replyCount || 0) - 1)
      }));
      
      showSuccessToast('Reply deleted successfully');
    } catch (error) {
      showErrorToast(error.message || 'Failed to delete reply');
    }
  };

  const handleReplyToReply = (reply) => {
    if (!user) {
      showErrorToast('Please log in to reply');
      return;
    }
    
    setReplyingToReply(reply);
    setShowReplyForm(true);
    
    // Scroll to reply form
    setTimeout(() => {
      if (replyFormRef.current) {
        const elementTop = replyFormRef.current.getBoundingClientRect().top + window.pageYOffset;
        const offset = 80;
        window.scrollTo({
          top: elementTop - offset,
          behavior: 'smooth'
        });
      }
    }, 100);
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


  if (!discussion) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Discussion Not Found</h1>
          <p className="text-gray-600">The discussion you&apos;re looking for doesn&apos;t exist.</p>
          <Link href="/feed" className="mt-4 inline-block px-6 py-2 bg-black text-white rounded-full hover:bg-gray-800">
            Go to Feed
          </Link>
        </div>
      </div>
    );
  }

  const replies = discussion.replies || [];
  const hasUpvoted = user ? (discussion.upvotedBy || []).includes(user.uid) : false;
  const hasDownvoted = user ? (discussion.downvotedBy || []).includes(user.uid) : false;

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNav />
      
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Breadcrumb for navigation */}
        <nav className="mb-6" aria-label="Breadcrumb">
          <ol className="flex items-center gap-2 text-sm text-gray-600">
            <li>
              <Link href="/feed" className="hover:text-gray-900 truncate">
                Discussions
              </Link>
            </li>
            <li>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </li>
            <li className="text-gray-900 truncate max-w-md">{discussion.title}</li>
          </ol>
        </nav>

        {/* Main Discussion Card - All content visible in DOM for SEO */}
        <article className="bg-white rounded-lg border border-black/20 shadow-sm mb-6">
          {/* Discussion Header */}
          <header className="p-6 border-b border-black/10">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
              {discussion.title}
            </h1>
            
            <div className="flex items-center gap-3 mb-4">
              <div>
                <div className="text-sm font-medium text-gray-900">{discussion.authorName}</div>
                <div className="text-xs text-gray-600">
                  {formatDate(discussion.createdAt)}
                  {discussion.isEdited && discussion.editedAt && (
                    <span className="text-gray-500 italic"> · edited {formatDate(discussion.editedAt)}</span>
                  )}
                </div>
              </div>
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
          </header>

          {/* Discussion Content - Fully visible for SEO */}
          <div className="p-6">
            <div className="prose prose-sm max-w-none">
              <p className="text-gray-900 whitespace-pre-wrap leading-relaxed">
                {discussion.content}
              </p>
            </div>
            </div>

          {/* Discussion Actions */}
          <footer className="px-6 py-4 border-t border-black/10 bg-gray-50">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex flex-col sm:flex-row items-start sm:items-center sm:gap-3 gap-2">
                {/* Share button - on top for small screens */}
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
                
                {/* Stat buttons */}
                <div className="flex items-center gap-2.5 sm:gap-3">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleVote('upvote')}
                      className={`p-1 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${hasUpvoted ? 'text-green-600 hover:text-green-700' : 'text-gray-700 hover:text-black'}`}
                      disabled={!user}
                      title={!user ? 'Log in to vote' : hasUpvoted ? 'Remove upvote' : 'Upvote'}
                    >
                      <svg className="w-4 h-4 flex-shrink-0" fill={hasUpvoted ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                    </button>
                    <span className="text-sm font-medium whitespace-nowrap">{(discussion.upvotes || 0) - (discussion.downvotes || 0)}</span>
                    <button
                      onClick={() => handleVote('downvote')}
                      className={`p-1 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${hasDownvoted ? 'text-red-600 hover:text-red-700' : 'text-gray-700 hover:text-black'}`}
                      disabled={!user}
                      title={!user ? 'Log in to vote' : hasDownvoted ? 'Remove downvote' : 'Downvote'}
                    >
                      <svg className="w-4 h-4 flex-shrink-0" fill={hasDownvoted ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>
                  
                  <div className="flex items-center gap-1.5 text-sm text-gray-600">
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <span className="whitespace-nowrap">{discussion.replyCount || 0}</span>
                  </div>
                  
                  <div className="flex items-center gap-1.5 text-sm text-gray-600">
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    <span className="whitespace-nowrap">{discussion.views || 0}</span>
                  </div>
                </div>
              </div>

              {/* Reply button */}
              {user && (
                <button
                  onClick={() => setShowReplyForm(!showReplyForm)}
                  className="px-4 py-2 bg-black text-white rounded-full hover:bg-gray-800 text-sm font-medium flex-shrink-0"
                >
                  {showReplyForm ? 'Cancel' : 'Reply'}
                </button>
              )}
              
              {!user && (
                <Link
                  href="/login"
                  className="px-4 py-2 bg-black text-white rounded-full hover:bg-gray-800 text-sm font-medium flex-shrink-0"
                >
                  Log in to Reply
                </Link>
              )}
            </div>

            {/* Reply Form */}
            {showReplyForm && user && (
              <div className="mt-4 pt-4 border-t border-black/10" ref={replyFormRef}>
                <TextReplyForm
                  discussionId={discussion.id}
                  replyingToReply={replyingToReply}
                  onReplyAdded={handleReplyAdded}
                  onCancel={() => {
                    setShowReplyForm(false);
                    setReplyingToReply(null);
                  }}
                />
              </div>
            )}
          </footer>
        </article>

        {/* Replies Section - Full featured reply tree */}
        {replies.length > 0 && (
          <section className="mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {replies.length} {replies.length === 1 ? 'Reply' : 'Replies'}
            </h2>
            
            <ReplyTree
              replies={replies}
              discussionId={discussion.id}
              onReplyToReply={handleReplyToReply}
              onDeleteReply={handleDeleteReply}
              onReplyEdited={handleReplyEdited}
            />
          </section>
        )}

        {/* Call to Action for engagement */}
        {!user && (
          <div className="bg-white rounded-lg border border-black/20 p-6 text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Join the Discussion
            </h3>
            <p className="text-gray-600 mb-4">
              Log in to vote, reply, and participate in this conversation
            </p>
            <Link
              href="/login"
              className="inline-block px-6 py-2 bg-black text-white rounded-full hover:bg-gray-800 font-medium"
            >
              Log In
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
