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

  const getReplyTypeStyle = (type) => {
    switch (type) {
      case 'agree': return 'border-l-green-400 bg-green-50';
      case 'challenge': return 'border-l-red-400 bg-red-50';
      case 'expand': return 'border-l-blue-400 bg-blue-50';
      case 'clarify': return 'border-l-yellow-400 bg-yellow-50';
      default: return 'border-l-gray-400 bg-gray-50';
    }
  };

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

  // Group replies by AI point
  const groupRepliesByPoint = (replies) => {
    const grouped = {
      withPoints: {},
      general: []
    };

    replies.forEach(reply => {
      if (reply.replyToPointId) {
        if (!grouped.withPoints[reply.replyToPointId]) {
          grouped.withPoints[reply.replyToPointId] = [];
        }
        grouped.withPoints[reply.replyToPointId].push(reply);
      } else {
        grouped.general.push(reply);
      }
    });

    // Build tree structure for each group
    Object.keys(grouped.withPoints).forEach(pointId => {
      grouped.withPoints[pointId] = buildReplyTree(grouped.withPoints[pointId]);
    });
    grouped.general = buildReplyTree(grouped.general);

    return grouped;
  };

  const renderReply = (reply, level = 0) => {
    const hasChildren = reply.children && reply.children.length > 0;
    const isExpanded = expandedReplies.has(reply.id);
    const canReply = level < maxLevel && user;

    return (
      <div key={reply.id} className={`${level > 0 ? 'ml-8 mt-3' : 'mt-4'}`}>
        {/* Connection line for nested replies */}
        {level > 0 && (
          <div className="flex items-start">
            <div className="flex-shrink-0 w-6 h-6 mr-2">
              <div className="w-3 h-3 border-l-2 border-b-2 border-gray-300 rounded-bl-md"></div>
            </div>
            <div className="flex-1">
              {renderReplyContent(reply, level, hasChildren, isExpanded, canReply)}
            </div>
          </div>
        )}
        
        {level === 0 && renderReplyContent(reply, level, hasChildren, isExpanded, canReply)}

        {/* Nested replies */}
        {hasChildren && isExpanded && (
          <div className="relative">
            {/* Vertical line for tree structure */}
            <div className="absolute left-3 top-0 bottom-0 w-px bg-gray-200"></div>
            {reply.children.map(childReply => renderReply(childReply, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const renderReplyContent = (reply, level, hasChildren, isExpanded, canReply) => {
    return (
      <div className={`rounded-lg p-4 border-l-4 ${getReplyTypeStyle(reply.type)} ${level === 0 ? '' : 'border border-gray-200'}`}>
        {/* Reply header */}
        <div className="flex items-center gap-3 mb-3">
          <span className="text-lg">{getReplyTypeIcon(reply.type)}</span>
          {reply.authorPhoto ? (
            <Image
              src={reply.authorPhoto}
              alt={reply.authorName}
              width={24}
              height={24}
              className="w-6 h-6 rounded-full object-cover"
            />
          ) : (
            <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
              <span className="text-gray-600 text-xs font-medium">
                {reply.authorName?.charAt(0)?.toUpperCase() || '?'}
              </span>
            </div>
          )}
          <div className="flex-1">
            <h5 className="text-sm font-medium text-gray-900">{reply.authorName}</h5>
            <p className="text-xs text-gray-500">{formatDate(reply.createdAt)}</p>
          </div>
          
          {/* Action buttons */}
          <div className="flex items-center gap-2">
            {hasChildren && (
              <button
                onClick={() => toggleReply(reply.id)}
                className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
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
                className="p-1 text-gray-400 hover:text-blue-500 transition-colors"
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
                className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                title="Delete reply"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
          </div>
        </div>
        
        {/* Reply content */}
        <div className="prose max-w-none">
          <p className="text-gray-700 text-sm whitespace-pre-wrap leading-relaxed">
            {reply.content}
          </p>
        </div>
      </div>
    );
  };

  const groupedReplies = groupRepliesByPoint(replies);

  return (
    <div className="space-y-6">
      {/* Replies grouped by AI points */}
      {Object.entries(groupedReplies.withPoints).map(([pointId, pointReplies]) => {
        const point = aiPoints?.find(p => p.id === pointId);
        return (
          <div key={pointId} className="space-y-3">
            {/* Point Header */}
            {point && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                <h5 className="text-sm font-medium text-blue-900 mb-1">
                  &ldquo;{point.text}&rdquo;
                </h5>
                    {point.type && (
                      <span className="inline-block px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700">
                        {point.type}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            {/* Reply tree for this point */}
            <div className="space-y-2">
              {pointReplies.map(reply => renderReply(reply, 0))}
            </div>
          </div>
        );
      })}
      
      {/* General replies (not anchored to points) */}
      {groupedReplies.general.length > 0 && (
        <div className="space-y-3">
          <h5 className="text-sm font-medium text-gray-700 border-b border-gray-200 pb-2">
            General Discussion
          </h5>
          <div className="space-y-2">
            {groupedReplies.general.map(reply => renderReply(reply, 0))}
          </div>
        </div>
      )}
    </div>
  );
}
