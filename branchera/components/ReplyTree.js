'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { useDatabase } from '@/hooks/useDatabase';
import FactCheckResults from './FactCheckResults';
import SearchHighlight from './SearchHighlight';
import EditReplyForm from './EditReplyForm';

export default function ReplyTree({ 
  replies, 
  aiPoints, 
  discussionId, 
  searchQuery,
  onReplyToReply, 
  onDeleteReply,
  onReplyEdited,
  onReplyView,
  onPointClick,
  maxLevel = 3 
}) {
  const { user } = useAuth();
  const { editReply } = useDatabase();
  const [expandedReplies, setExpandedReplies] = useState(new Set());
  const [editingReply, setEditingReply] = useState(null);

  const toggleReply = async (replyId) => {
    const wasExpanded = expandedReplies.has(replyId);
    
    setExpandedReplies(prev => {
      const newSet = new Set(prev);
      if (newSet.has(replyId)) {
        newSet.delete(replyId);
      } else {
        newSet.add(replyId);
      }
      return newSet;
    });

    // Increment view count only when expanding (not collapsing) and user is authenticated
    if (!wasExpanded && user && onReplyView) {
      try {
        await onReplyView(replyId, user.uid);
      } catch (error) {
        console.error('Error incrementing reply view:', error);
        // Don't show error to user, just log it
      }
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

  const getReplyTypeStyle = () => 'bg-white';

  const handleEditReply = (reply) => {
    if (!user || reply.authorId !== user.uid) return;
    setEditingReply(reply);
  };

  const handleEditComplete = (updatedReply) => {
    // Notify parent component that a reply was updated
    // We'll need to pass this up through props
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

  // Group ROOT replies by AI point, keeping full child chains regardless of their own point
  const groupRootRepliesByPoint = (rootReplies) => {
    const grouped = {
      withPoints: {},
      general: []
    };

    rootReplies.forEach((root) => {
      const pointId = root.replyToPointId;
      if (pointId) {
        if (!grouped.withPoints[pointId]) {
          grouped.withPoints[pointId] = [];
        }
        grouped.withPoints[pointId].push(root);
      } else {
        grouped.general.push(root);
      }
    });

    return grouped;
  };

  const renderReply = (reply, level = 0) => {
    const hasChildren = reply.children && reply.children.length > 0;
    const isExpanded = expandedReplies.has(reply.id);
    const canReply = level < maxLevel && user;

    return (
      <div key={reply.id} className={`${level > 0 ? 'ml-4 mt-2' : 'mt-3'}`}>
        {renderReplyContent(reply, level, hasChildren, isExpanded, canReply)}
        {hasChildren && isExpanded && (
          <div className="ml-4 mt-2">
            {reply.children.map(childReply => renderReply(childReply, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const renderReplyContent = (reply, level, hasChildren, isExpanded, canReply) => {
    return (
      <div className={`rounded-lg border border-black/20 bg-white p-3 ${getReplyTypeStyle(reply.type)}`}>
        <div className="flex items-center gap-3 mb-2">
          {reply.authorPhoto ? (
            <Image
              src={reply.authorPhoto}
              alt={reply.authorName}
              width={20}
              height={20}
              className="w-5 h-5 rounded-full object-cover"
            />
          ) : (
            <div className="w-5 h-5 rounded-full border border-black/40 flex items-center justify-center">
              <span className="text-[10px] text-gray-900 font-medium">
                {reply.authorName?.charAt(0)?.toUpperCase() || '?'}
              </span>
            </div>
          )}
          <div className="flex-1">
            <div className="text-xs text-gray-700">
              <SearchHighlight text={reply.authorName} searchQuery={searchQuery} /> · {formatDate(reply.createdAt)}
              {reply.isEdited && reply.editedAt && (
                <span className="text-gray-500 italic"> · edited {formatDate(reply.editedAt)}</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {hasChildren && (
              <button
                onClick={() => toggleReply(reply.id)}
                className="p-1 text-gray-800 hover:text-black"
                title={`${isExpanded ? 'Hide' : 'Show'} ${reply.children.length} replies`}
              >
                <svg className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
                <span className="text-xs ml-1">{reply.children.length}</span>
              </button>
            )}
            <div className="flex items-center gap-1 text-xs text-gray-600">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              {reply.views || 0}
            </div>
            {canReply && (
              <button
                onClick={() => onReplyToReply(reply)}
                className="p-1 text-gray-800 hover:text-black"
                title="Reply to this"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                </svg>
              </button>
            )}
            {user && reply.authorId === user.uid && (
              <>
                <button
                  onClick={() => handleEditReply(reply)}
                  className="p-1 text-gray-800 hover:text-black"
                  title="Edit reply"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  onClick={() => onDeleteReply(discussionId, reply.id)}
                  className="p-1 text-gray-800 hover:text-black"
                  title="Delete reply"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </>
            )}
          </div>
        </div>
        <div>
          <p className="text-gray-900 text-sm whitespace-pre-wrap leading-relaxed">
            <SearchHighlight text={reply.content} searchQuery={searchQuery} />
          </p>
        </div>
        
        {/* Fact Check Results for Reply */}
        {reply.factCheckResults && (
          <div className="mt-2">
            <FactCheckResults 
              factCheckResults={reply.factCheckResults} 
              isLoading={false}
              searchQuery={searchQuery}
            />
          </div>
        )}
        
        {Array.isArray(reply.aiPoints) && reply.aiPoints.length > 0 && (
          <div className="mt-2 border border-black/15 rounded-lg p-3 bg-white">
            <div className="text-xs font-semibold text-gray-900 mb-1">Reply points</div>
            <ul className="space-y-1">
              {reply.aiPoints.map((p) => (
                <li key={p.id}>
                  <button
                    onClick={() => onPointClick && onPointClick(reply, p)}
                    className="w-full flex items-start gap-2 p-2 text-left rounded-lg hover:bg-gray-50 border border-transparent hover:border-black/20"
                    disabled={!user || !onPointClick}
                  >
                    <div className="w-1 h-1 bg-black rounded-full mt-2 flex-shrink-0"></div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-gray-900">
                        <SearchHighlight text={p.text} searchQuery={searchQuery} />
                      </div>
                      {p.type && (
                        <span className="inline-block px-2 py-0.5 text-[10px] rounded-full bg-black text-white mt-1 uppercase tracking-wide">
                          <SearchHighlight text={p.type} searchQuery={searchQuery} />
                        </span>
                      )}
                      {user && onPointClick && (
                        <div className="text-[10px] text-gray-600 mt-1">
                          Click to reply to this point
                        </div>
                      )}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {/* Edit form for this reply */}
        {editingReply && editingReply.id === reply.id && (
          <EditReplyForm
            discussionId={discussionId}
            reply={editingReply}
            onEditComplete={handleEditComplete}
            onCancel={handleEditCancel}
          />
        )}
      </div>
    );
  };

  const rootReplies = buildReplyTree(replies);
  const groupedReplies = groupRootRepliesByPoint(rootReplies);

  return (
    <div className="space-y-4">
      {Object.entries(groupedReplies.withPoints).map(([pointId, pointReplies]) => {
        const point = aiPoints?.find(p => p.id === pointId);
        return (
          <div key={pointId} className="space-y-2">
            {point && (
              <div className="border border-black/20 rounded-lg p-3 bg-white">
                <div className="flex items-start gap-2">
                  <div className="w-1 h-1 bg-black rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <div className="text-sm font-semibold text-gray-900">
                      &ldquo;<SearchHighlight text={point.text} searchQuery={searchQuery} />&rdquo;
                    </div>
                    {point.type && (
                      <span className="inline-block px-2 py-0.5 text-[10px] rounded-full bg-black text-white mt-1 uppercase tracking-wide">
                        <SearchHighlight text={point.type} searchQuery={searchQuery} />
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
            <div className="space-y-2">
              {pointReplies.map(reply => renderReply(reply, 0))}
            </div>
          </div>
        );
      })}
      {groupedReplies.general.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs font-semibold text-gray-900 border-b border-black/20 pb-2">General discussion</div>
          <div className="space-y-2">
            {groupedReplies.general.map(reply => renderReply(reply, 0))}
          </div>
        </div>
      )}
    </div>
  );
}
