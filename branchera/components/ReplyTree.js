'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';

export default function ReplyTree({ 
  replies, 
  aiPoints, 
  discussionId, 
  onReplyToReply, 
  onDeleteReply,
  maxLevel = 3 
}) {
  const { user } = useAuth();
  const [expandedReplies, setExpandedReplies] = useState(new Set());

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

  const getReplyTypeStyle = () => 'border-l-black bg-white';

  const getReplyTypeIcon = (type) => {
    switch (type) {
      case 'agree': return '👍';
      case 'challenge': return '🤔';
      case 'expand': return '💡';
      case 'clarify': return '❓';
      default: return '💬';
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
      <div key={reply.id} className={`${level > 0 ? 'ml-8 mt-2' : 'mt-3'}`}>
        {level > 0 && (
          <div className="flex items-start">
            <div className="flex-shrink-0 w-6 h-6 mr-2">
              <div className="w-3 h-3 border-l border-b border-black rounded-bl-sm"></div>
            </div>
            <div className="flex-1">
              {renderReplyContent(reply, level, hasChildren, isExpanded, canReply)}
            </div>
          </div>
        )}

        {level === 0 && renderReplyContent(reply, level, hasChildren, isExpanded, canReply)}

        {hasChildren && isExpanded && (
          <div className="relative">
            <div className="absolute left-3 top-0 bottom-0 w-px bg-black/60"></div>
            {reply.children.map(childReply => renderReply(childReply, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const renderReplyContent = (reply, level, hasChildren, isExpanded, canReply) => {
    return (
      <div className={`rounded p-3 border-l-2 ${getReplyTypeStyle(reply.type)} ${level === 0 ? '' : 'border border-black/20'}`}>
        <div className="flex items-center gap-3 mb-2">
          <span className="text-base">{getReplyTypeIcon(reply.type)}</span>
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
            <div className="text-xs text-gray-700">{reply.authorName} · {formatDate(reply.createdAt)}</div>
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
              <button
                onClick={() => onDeleteReply(discussionId, reply.id)}
                className="p-1 text-gray-800 hover:text-black"
                title="Delete reply"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
          </div>
        </div>
        <div>
          <p className="text-gray-900 text-sm whitespace-pre-wrap leading-relaxed">{reply.content}</p>
        </div>
        {/* If reply has AI points, show a compact list to anchor sub-replies */}
        {Array.isArray(reply.aiPoints) && reply.aiPoints.length > 0 && (
          <div className="mt-2 border border-black/20 rounded p-2">
            <div className="text-[11px] font-semibold text-gray-900 mb-1">Reply points</div>
            <ul className="space-y-1">
              {reply.aiPoints.map((p) => (
                <li key={p.id} className="flex items-start gap-2">
                  <div className="w-1 h-1 bg-black rounded-full mt-2"></div>
                  <div className="text-xs text-gray-900">{p.text}</div>
                </li>
              ))}
            </ul>
          </div>
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
              <div className="border border-black/20 rounded p-2 bg-white">
                <div className="flex items-start gap-2">
                  <div className="w-1 h-1 bg-black rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <div className="text-sm font-semibold text-gray-900">“{point.text}”</div>
                    {point.type && (
                      <span className="inline-block px-2 py-0.5 text-[10px] rounded-full bg-black text-white mt-1 uppercase tracking-wide">
                        {point.type}
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
