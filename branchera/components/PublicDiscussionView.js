'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useDatabase } from '@/hooks/useDatabase';
import { useToast } from '@/contexts/ToastContext';
import { formatDate } from '@/lib/dateUtils';
import TextReplyForm from './TextReplyForm';
import TopNav from './TopNav';

/**
 * PublicDiscussionView - Renders a full discussion page with all content in the DOM for SEO
 * This component ensures that search engines can crawl and index all discussion content
 */
export default function PublicDiscussionView({ discussion: initialDiscussion }) {
  const [discussion, setDiscussion] = useState(initialDiscussion);
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [expandedReplies, setExpandedReplies] = useState({});
  const [viewCountUpdated, setViewCountUpdated] = useState(false);
  const { user } = useAuth();
  const { updateDocument, incrementDiscussionView } = useDatabase();
  
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

  const handleLike = async () => {
    if (!user) {
      showErrorToast('Please log in to like discussions');
      return;
    }
    
    try {
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
      
      await updateDocument('discussions', discussion.id, { 
        likes: newLikes,
        likedBy: newLikedBy
      });
      
      setDiscussion(prev => ({
        ...prev,
        likes: newLikes,
        likedBy: newLikedBy
      }));
    } catch (error) {
      showErrorToast('Failed to update like');
    }
  };

  const handleReplyAdded = (discussionId, newReply) => {
    // Update discussion with new reply
    setDiscussion(prev => ({
      ...prev,
      replies: [...(prev.replies || []), newReply],
      replyCount: (prev.replyCount || 0) + 1
    }));
    
    setShowReplyForm(false);
    showSuccessToast('Reply added successfully');
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

  const toggleReply = (replyId) => {
    setExpandedReplies(prev => ({
      ...prev,
      [replyId]: !prev[replyId]
    }));
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
  const hasLiked = user ? (discussion.likedBy || []).includes(user.uid) : false;

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
                  <button
                    onClick={handleLike}
                    className="flex items-center gap-1.5 text-sm text-gray-700 hover:text-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={!user}
                    title={!user ? 'Log in to like' : hasLiked ? 'Unlike' : 'Like'}
                  >
                    <svg className="w-4 h-4 flex-shrink-0" fill={hasLiked ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    <span className="whitespace-nowrap">{discussion.likes || 0}</span>
                  </button>
                  
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
              <div className="mt-4 pt-4 border-t border-black/10">
                <TextReplyForm
                  discussionId={discussion.id}
                  onReplyAdded={handleReplyAdded}
                  onCancel={() => setShowReplyForm(false)}
                />
              </div>
            )}
          </footer>
        </article>

        {/* Replies Section - All replies visible in DOM for SEO */}
        {replies.length > 0 && (
          <section className="mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {replies.length} {replies.length === 1 ? 'Reply' : 'Replies'}
            </h2>
            
            <div className="space-y-3">
              {replies.map((reply) => (
                <article key={reply.id} className="bg-white rounded-lg border border-black/20 p-4">
                  <div className="flex items-start gap-3">
                    {reply.authorPhoto && (
                      <Image
                        src={reply.authorPhoto}
                        alt={reply.authorName}
                        width={32}
                        height={32}
                        className="w-8 h-8 rounded-full flex-shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-gray-900">{reply.authorName}</span>
                        <span className="text-xs text-gray-500">{formatDate(reply.createdAt)}</span>
                        {reply.isEdited && reply.editedAt && (
                          <span className="text-xs text-gray-500 italic">edited</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                        {reply.content}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {/* Call to Action for engagement */}
        {!user && (
          <div className="bg-white rounded-lg border border-black/20 p-6 text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Join the Discussion
            </h3>
            <p className="text-gray-600 mb-4">
              Log in to like, reply, and participate in this conversation
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
