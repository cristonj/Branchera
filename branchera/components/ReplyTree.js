'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { useDatabase } from '@/hooks/useDatabase';
import FactCheckResults from './FactCheckResults';
import SearchHighlight from './SearchHighlight';
import EditReplyForm from './EditReplyForm';
import ReplyFilterSort from './ReplyFilterSort';
import ReplyHeader from './ReplyHeader';

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
  maxLevel = 3,
  showFilters = true
}) {
  const { user } = useAuth();
  const { editReply } = useDatabase();
  const [expandedReplies, setExpandedReplies] = useState(new Set());
  const [editingReply, setEditingReply] = useState(null);
  const [filteredReplies, setFilteredReplies] = useState(replies);
  const [replySearchQuery, setReplySearchQuery] = useState('');
  const [replyFilters, setReplyFilters] = useState({
    author: '',
    hasFactCheck: false,
    hasPoints: false,
    claim: '',
    pointsEarned: false,
    dateRange: 'all',
    minViews: 0
  });
  const [replySort, setReplySort] = useState('newest');

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
        <ReplyHeader
          reply={reply}
          searchQuery={replySearchQuery || searchQuery}
          onToggle={() => toggleReply(reply.id)}
          hasChildren={hasChildren}
          isExpanded={isExpanded}
          canReply={canReply}
          onReplyTo={() => onReplyToReply(reply)}
          onEdit={() => handleEditReply(reply)}
          onDelete={() => onDeleteReply(discussionId, reply.id)}
          user={user}
        />
        <div>
          <p className="text-gray-900 text-sm whitespace-pre-wrap leading-relaxed">
            <SearchHighlight text={reply.content} searchQuery={replySearchQuery || searchQuery} />
          </p>
        </div>
        
        {/* Fact Check Results for Reply */}
        {reply.factCheckResults && (
          <div className="mt-2">
            <FactCheckResults 
              factCheckResults={reply.factCheckResults} 
              isLoading={false}
              searchQuery={replySearchQuery || searchQuery}
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
                        <SearchHighlight text={p.text} searchQuery={replySearchQuery || searchQuery} />
                      </div>
                      {p.type && (
                        <span className="inline-block px-2 py-0.5 text-[10px] rounded-full bg-black text-white mt-1 uppercase tracking-wide">
                          <SearchHighlight text={p.type} searchQuery={replySearchQuery || searchQuery} />
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

  const rootReplies = buildReplyTree(filteredReplies);
  const groupedReplies = groupRootRepliesByPoint(rootReplies);

  return (
    <div className="space-y-4">
      {/* Reply Filtering System */}
      {showFilters && replies.length > 0 && (
        <ReplyFilterSort
          replies={replies}
          onResults={setFilteredReplies}
          onSearchChange={setReplySearchQuery}
          onFilterChange={setReplyFilters}
          onSortChange={setReplySort}
          initialSearchQuery={replySearchQuery}
          initialSortBy={replySort}
          initialFilters={replyFilters}
        />
      )}

      {/* Show message when no replies match filters */}
      {showFilters && replies.length > 0 && filteredReplies.length === 0 && (
        <div className="text-center py-8 border border-black/20 rounded-lg bg-gray-50">
          <div className="text-4xl mb-4">🔍</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No replies found</h3>
          <p className="text-gray-600">Try adjusting your search terms or filters.</p>
        </div>
      )}

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
                      &ldquo;<SearchHighlight text={point.text} searchQuery={replySearchQuery || searchQuery} />&rdquo;
                    </div>
                    {point.type && (
                      <span className="inline-block px-2 py-0.5 text-[10px] rounded-full bg-black text-white mt-1 uppercase tracking-wide">
                        <SearchHighlight text={point.type} searchQuery={replySearchQuery || searchQuery} />
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
