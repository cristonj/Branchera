'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useDatabase } from '@/hooks/useDatabase';
import EditReplyForm from './EditReplyForm';
import { useToast } from '@/contexts/ToastContext';
import { formatDate } from '@/lib/dateUtils';

export default function ReplyTree({ 
  replies, 
  discussionId, 
  onReplyToReply, 
  onDeleteReply,
  onReplyEdited
}) {
  const { user } = useAuth();
  const { voteOnReply } = useDatabase();
  const [expandedReplies, setExpandedReplies] = useState(new Set());
  const [editingReply, setEditingReply] = useState(null);
  
  const toastContext = useToast();
  const showErrorToast = toastContext?.showErrorToast || (() => {});

  const handleVoteOnReply = async (reply, voteType) => {
    if (!user) return;
    
    try {
      const updatedReply = await voteOnReply(discussionId, reply.id, user.uid, voteType);
      
      if (onReplyEdited) {
        onReplyEdited(updatedReply);
      }
    } catch (error) {
      showErrorToast('Failed to vote on reply');
      console.error('Vote error:', error);
    }
  };

  const toggleReply = (replyId) => {
    setExpandedReplies(prev => {
      const newSet = new Set(prev);
      if (newSet.has(replyId)) {
        newSet.delete(replyId);
      } else {
        newSet.add(replyId);
      }
      return newSet;
    });
  };

  const handleEditReply = (reply) => {
    if (!user || reply.authorId !== user.uid) return;
    setEditingReply(reply);
  };

  const handleEditComplete = (updatedReply) => {
    if (onReplyEdited) {
      onReplyEdited(updatedReply);
    }
    setEditingReply(null);
  };

  const handleEditCancel = () => {
    setEditingReply(null);
  };

  // Build reply tree structure
  const buildReplyTree = (replies) => {
    const replyMap = {};
    const rootReplies = [];

    replies.forEach(reply => {
      replyMap[reply.id] = { ...reply, children: [] };
    });

    replies.forEach(reply => {
      if (reply.replyToReplyId && replyMap[reply.replyToReplyId]) {
        replyMap[reply.replyToReplyId].children.push(replyMap[reply.id]);
      } else {
        rootReplies.push(replyMap[reply.id]);
      }
    });

    return rootReplies;
  };

  const renderReply = (reply, level = 0) => {
    const hasChildren = reply.children && reply.children.length > 0;
    const isExpanded = expandedReplies.has(reply.id);
    const isEditing = editingReply && editingReply.id === reply.id;
    const maxLevel = 3;
    const canReply = level < maxLevel && user;

    return (
      <div key={reply.id} className={`${level > 0 ? 'ml-8 mt-2 border-l-2 border-gray-200 pl-3' : 'mt-3'}`}>
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
              discussionId={discussionId}
              reply={reply}
              onEditComplete={handleEditComplete}
              onCancel={handleEditCancel}
            />
          ) : (
            <>
              <p className="text-sm text-gray-900 whitespace-pre-wrap leading-relaxed mb-2">
                {reply.content}
              </p>

              {/* Reply Actions */}
              <div className="flex items-center gap-4 text-xs flex-wrap">
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
                {canReply && onReplyToReply && (
                  <button
                    onClick={() => onReplyToReply(reply)}
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
                    onClick={() => toggleReply(reply.id)}
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
                      onClick={() => onDeleteReply && onDeleteReply(discussionId, reply.id)}
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

  const replyTree = buildReplyTree(replies);

  return (
    <div className="space-y-3">
      {replyTree.map(reply => renderReply(reply, 0))}
    </div>
  );
}
