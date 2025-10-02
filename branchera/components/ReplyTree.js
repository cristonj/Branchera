'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useDatabase } from '@/hooks/useDatabase';
import { AIService } from '@/lib/aiService';
import FactCheckResults from './FactCheckResults';
import SearchHighlight from './SearchHighlight';
import EditReplyForm from './EditReplyForm';
import { useToast } from '@/contexts/ToastContext';
import { formatDate } from '@/lib/dateUtils';

export default function ReplyTree({ 
  replies, 
  aiPoints, 
  discussionId, 
  discussionTitle,
  discussionContent,
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
  const { editReply, updateReplyKeyPoints, voteOnReply } = useDatabase();
  const [expandedReplies, setExpandedReplies] = useState(new Set());
  const [expandedReplyPoints, setExpandedReplyPoints] = useState(new Set());
  const [expandedPointSections, setExpandedPointSections] = useState(new Set());
  const [generatingReplyPoints, setGeneratingReplyPoints] = useState(new Set());
  const [editingReply, setEditingReply] = useState(null);
  const [replySearchQuery, setReplySearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [filters, setFilters] = useState({
    author: '',
    hasFactCheck: false,
    hasPoints: false,
    dateRange: 'all'
  });
  
  // Pagination state for each point section
  const [pointPagination, setPointPagination] = useState({});
  const REPLIES_PER_PAGE = 5;
  
  // Safely get toast functions with fallbacks
  const toastContext = useToast();
  const showErrorToast = toastContext?.showErrorToast || (() => {});

  const handleVoteOnReply = async (reply, voteType) => {
    if (!user) return;
    
    try {
      const updatedReply = await voteOnReply(discussionId, reply.id, user.uid, voteType);
      
      // Notify parent component that a reply was updated
      if (onReplyEdited) {
        onReplyEdited(updatedReply);
      }
    } catch (error) {
      showErrorToast('Failed to vote on reply');
      console.error('Vote error:', error);
    }
  };

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
        // Don't show error to user, just log it
      }
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

  const toggleReplyPoints = async (reply) => {
    const wasExpanded = expandedReplyPoints.has(reply.id);
    
    setExpandedReplyPoints(prev => {
      const newSet = new Set(prev);
      if (newSet.has(reply.id)) {
        newSet.delete(reply.id);
      } else {
        newSet.add(reply.id);
      }
      return newSet;
    });

    // Generate reply points if expanding and they don't exist yet
    if (!wasExpanded && (!reply.replyPoints || reply.replyPoints.length === 0) && !generatingReplyPoints.has(reply.id)) {
      setGeneratingReplyPoints(prev => new Set([...prev, reply.id]));
      
      try {
        
        // Build discussion context from other replies
        const discussionContext = replies.filter(r => r.id !== reply.id).slice(0, 5); // Limit context
        
        const replyPoints = await AIService.generateReplyKeyPoints(
          reply.content,
          discussionTitle,
          discussionContent,
          discussionContext
        );
        
        
        // Update the reply with the generated points
        await updateReplyKeyPoints(discussionId, reply.id, replyPoints);
        
        // Update the reply in the local state via parent component
        if (onReplyEdited) {
          onReplyEdited({
            ...reply,
            replyPoints: replyPoints,
            replyPointsGenerated: true
          });
        }
        
      } catch (error) {
        showErrorToast('Failed to generate key points for this reply');
      } finally {
        setGeneratingReplyPoints(prev => {
          const newSet = new Set(prev);
          newSet.delete(reply.id);
          return newSet;
        });
      }
    }
  };

  const handleReplyPointClick = (reply, point) => {
    if (!user || !onPointClick) return;
    
    // Call the point click handler with the reply and point
    onPointClick(reply, point);
  };

  const togglePointSection = (pointId) => {
    setExpandedPointSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(pointId)) {
        newSet.delete(pointId);
      } else {
        newSet.add(pointId);
        // Initialize pagination for this point if not already set
        if (!pointPagination[pointId]) {
          setPointPagination(prevPagination => ({
            ...prevPagination,
            [pointId]: { currentPage: 1 }
          }));
        }
      }
      return newSet;
    });
  };

  const loadMoreReplies = (pointId) => {
    setPointPagination(prevPagination => ({
      ...prevPagination,
      [pointId]: {
        ...prevPagination[pointId],
        currentPage: (prevPagination[pointId]?.currentPage || 1) + 1
      }
    }));
  };

  const getPaginatedReplies = (replies, pointId) => {
    const currentPage = pointPagination[pointId]?.currentPage || 1;
    const startIndex = 0;
    const endIndex = currentPage * REPLIES_PER_PAGE;
    return replies.slice(startIndex, endIndex);
  };

  const hasMoreReplies = (replies, pointId) => {
    const currentPage = pointPagination[pointId]?.currentPage || 1;
    return replies.length > currentPage * REPLIES_PER_PAGE;
  };

  // Enhanced search function for replies
  const searchReplies = (replies, query) => {
    if (!query.trim()) return replies;
    
    const normalizedQuery = query.toLowerCase();
    return replies.filter(reply => {
      return (
        reply.content?.toLowerCase().includes(normalizedQuery) ||
        reply.authorName?.toLowerCase().includes(normalizedQuery) ||
        // Search in fact check results
        (reply.factCheckResults?.claims || []).some(claim =>
          claim.text?.toLowerCase().includes(normalizedQuery) ||
          claim.status?.toLowerCase().includes(normalizedQuery) ||
          claim.explanation?.toLowerCase().includes(normalizedQuery)
        ) ||
        // Search in AI points
        (reply.aiPoints || []).some(point =>
          point.text?.toLowerCase().includes(normalizedQuery) ||
          point.type?.toLowerCase().includes(normalizedQuery)
        )
      );
    });
  };

  // Enhanced filter function
  const applyFilters = (replies, filters) => {
    return replies.filter(reply => {
      // Author filter
      if (filters.author && !reply.authorName?.toLowerCase().includes(filters.author.toLowerCase())) {
        return false;
      }

      // Has fact check filter
      if (filters.hasFactCheck && !reply.factCheckResults) {
        return false;
      }

      // Has AI points filter
      if (filters.hasPoints && (!reply.aiPoints || reply.aiPoints.length === 0)) {
        return false;
      }

      // Date range filter
      if (filters.dateRange !== 'all') {
        const replyDate = new Date(reply.createdAt);
        const now = new Date();
        const diffInDays = (now - replyDate) / (1000 * 60 * 60 * 24);
        
        switch (filters.dateRange) {
          case 'today':
            if (diffInDays > 1) return false;
            break;
          case 'week':
            if (diffInDays > 7) return false;
            break;
          case 'month':
            if (diffInDays > 30) return false;
            break;
        }
      }

      return true;
    });
  };

  // Enhanced sort function for replies
  const sortReplies = (replies, sortBy) => {
    return [...replies].sort((a, b) => {
      switch (sortBy) {
        case 'oldest':
          return new Date(a.createdAt) - new Date(b.createdAt);
        case 'author':
          return (a.authorName || '').localeCompare(b.authorName || '');
        case 'views':
          return (b.views || 0) - (a.views || 0);
        case 'points':
          const aPoints = (a.aiPoints || []).length;
          const bPoints = (b.aiPoints || []).length;
          return bPoints - aPoints;
        case 'newest':
        default:
          return new Date(b.createdAt) - new Date(a.createdAt);
      }
    });
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
        <div className="flex items-center justify-between mb-2">
          <div className="flex-1">
            <div className="text-xs text-gray-700 flex items-center gap-2">
              <SearchHighlight text={reply.authorName} searchQuery={replySearchQuery || searchQuery} /> · {formatDate(reply.createdAt)}
              {reply.isEdited && reply.editedAt && (
                <span className="text-gray-500 italic"> · edited {formatDate(reply.editedAt)}</span>
              )}
              {/* Visual indicator for points earned */}
              {reply.pointsEarnedByUser && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] rounded-full bg-green-100 text-green-800 font-medium">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                  +{reply.pointsEarnedByUser} Points
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1">
            {hasChildren && (
              <button
                onClick={() => toggleReply(reply.id)}
                className="p-1 text-gray-800 hover:text-black"
                title={`${isExpanded ? 'Hide' : 'Show'} ${reply.children?.length || 0} replies`}
              >
                <svg className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
                <span className="text-xs ml-1">{reply.children?.length || 0}</span>
              </button>
            )}
            <div className="flex items-center gap-0.5">
              <button
                onClick={() => handleVoteOnReply(reply, 'upvote')}
                className={`p-0.5 text-xs ${user ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'} ${user && (reply.upvotedBy || []).includes(user.uid) ? 'text-green-600' : 'text-gray-600 hover:text-gray-800'}`}
                disabled={!user}
                title="Upvote reply"
              >
                <svg className="w-3 h-3" fill={user && (reply.upvotedBy || []).includes(user.uid) ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              </button>
              <span className="text-xs font-medium text-gray-700">{(reply.upvotes || 0) - (reply.downvotes || 0)}</span>
              <button
                onClick={() => handleVoteOnReply(reply, 'downvote')}
                className={`p-0.5 text-xs ${user ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'} ${user && (reply.downvotedBy || []).includes(user.uid) ? 'text-red-600' : 'text-gray-600 hover:text-gray-800'}`}
                disabled={!user}
                title="Downvote reply"
              >
                <svg className="w-3 h-3" fill={user && (reply.downvotedBy || []).includes(user.uid) ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-600">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              {reply.views || 0}
            </div>
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
                  onClick={() => onDeleteReply && onDeleteReply(discussionId, reply.id)}
                  className="p-1 text-gray-800 hover:text-red-600 hover:bg-red-50 rounded"
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
        
        {/* Reply button for nested replies */}
        {canReply && onReplyToReply && (
          <div className="mt-2">
            <button
              onClick={() => onReplyToReply(reply)}
              className="text-xs text-gray-600 hover:text-gray-800 flex items-center gap-1 hover:underline"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
              </svg>
              Reply
            </button>
          </div>
        )}
        <div>
          <p className="text-gray-900 text-sm whitespace-pre-wrap leading-relaxed break-words">
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

        {/* Reply Key Points (collapsible and clickable) */}
        {(reply.replyPoints && reply.replyPoints.length > 0) || generatingReplyPoints.has(reply.id) ? (
          <div className="mt-2 rounded-lg border border-black/20">
            <button
              onClick={() => toggleReplyPoints(reply)}
              className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50"
            >
              <div className="flex items-center gap-2">
                {generatingReplyPoints.has(reply.id) ? (
                  <div className="w-4 h-4 border-2 border-gray-800 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <svg className={`w-4 h-4 transition-transform ${expandedReplyPoints.has(reply.id) ? 'rotate-90' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                )}
                <span className="text-sm font-semibold text-gray-900">
                  {generatingReplyPoints.has(reply.id) ? 'Generating Key Points...' : 'Key Reply Points'}
                </span>
              </div>
              <div className="text-xs text-gray-600">
                {generatingReplyPoints.has(reply.id) ? '' : `${reply.replyPoints?.length || 0} point${(reply.replyPoints?.length || 0) !== 1 ? 's' : ''}`}
              </div>
            </button>

            {expandedReplyPoints.has(reply.id) && reply.replyPoints && reply.replyPoints.length > 0 && (
              <div className="px-3 pb-3 border-t border-black/10">
                <div className="mt-2 space-y-2">
                  {reply.replyPoints.map((point) => (
                    <button
                      key={point.id}
                      onClick={() => handleReplyPointClick(reply, point)}
                      className="w-full flex items-start gap-3 p-3 text-left rounded-lg border transition-all hover:bg-gray-50 border-transparent hover:border-black/20"
                      disabled={!user}
                    >
                      <div className="flex-shrink-0 mt-0.5">
                        <div className="w-1 h-1 bg-black rounded-full mt-2"></div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900">
                          <SearchHighlight text={point.text} searchQuery={replySearchQuery || searchQuery} />
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          {point.type && (
                            <span className="inline-block px-2 py-0.5 text-[10px] rounded-full bg-black text-white uppercase tracking-wide">
                              <SearchHighlight text={point.type} searchQuery={replySearchQuery || searchQuery} />
                            </span>
                          )}
                        </div>
                        {user && (
                          <div className="text-xs mt-1 text-gray-600">
                            Click to reply to this point
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="mt-2">
            <button
              onClick={() => toggleReplyPoints(reply)}
              className="text-xs text-gray-600 hover:text-gray-800 flex items-center gap-1"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              Generate key points to reply to
            </button>
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

  // Apply search, filters, and sorting
  const searchedReplies = searchReplies(replies, replySearchQuery);
  const filteredReplies = applyFilters(searchedReplies, filters);
  const sortedReplies = sortReplies(filteredReplies, sortBy);
  const rootReplies = buildReplyTree(sortedReplies);
  const groupedReplies = groupRootRepliesByPoint(rootReplies);

  return (
    <div className="space-y-4">
      {/* Reply Search and Filter Interface */}
      {showFilters && replies.length > 1 && (
        <div className="mb-3 border border-black/20 rounded-lg bg-white">
          {/* Main search bar */}
          <div className="p-3 border-b border-black/10">
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                placeholder="Search replies, authors, claims..."
                value={replySearchQuery}
                onChange={(e) => setReplySearchQuery(e.target.value)}
                className="flex-1 min-w-0 px-3 py-2 border border-black/20 rounded focus:outline-none focus:ring-2 focus:ring-black text-sm"
              />
              <div className="flex gap-2">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 border border-black/20 rounded focus:outline-none focus:ring-2 focus:ring-black text-sm flex-shrink-0"
                >
                  <option value="newest">Newest</option>
                  <option value="oldest">Oldest</option>
                  <option value="author">By Author</option>
                  <option value="views">Most Viewed</option>
                  <option value="points">Most Points</option>
                </select>
                <button
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  className="px-3 py-2 border border-black/20 rounded hover:bg-gray-50 text-sm flex items-center justify-center gap-1 whitespace-nowrap flex-shrink-0"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                  <span className="hidden sm:inline">Filters</span>
                </button>
              </div>
            </div>
          </div>

          {/* Advanced filters */}
          {showAdvancedFilters && (
            <div className="p-3 bg-gray-50">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Author filter */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Author</label>
                  <input
                    type="text"
                    placeholder="Filter by author..."
                    value={filters.author}
                    onChange={(e) => setFilters(prev => ({ ...prev, author: e.target.value }))}
                    className="w-full px-2 py-1 border border-black/20 rounded text-sm focus:outline-none focus:ring-2 focus:ring-black"
                  />
                </div>

                {/* Date range filter */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Date Range</label>
                  <select
                    value={filters.dateRange}
                    onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value }))}
                    className="w-full px-2 py-1 border border-black/20 rounded text-sm focus:outline-none focus:ring-2 focus:ring-black"
                  >
                    <option value="all">All Time</option>
                    <option value="today">Today</option>
                    <option value="week">Past Week</option>
                    <option value="month">Past Month</option>
                  </select>
                </div>

                {/* Content filters */}
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-gray-700">Content</label>
                  <div className="space-y-1">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filters.hasFactCheck}
                        onChange={(e) => setFilters(prev => ({ ...prev, hasFactCheck: e.target.checked }))}
                        className="mr-2 rounded focus:ring-black"
                      />
                      <span className="text-xs">Has Fact Check</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filters.hasPoints}
                        onChange={(e) => setFilters(prev => ({ ...prev, hasPoints: e.target.checked }))}
                        className="mr-2 rounded focus:ring-black"
                      />
                      <span className="text-xs">Has AI Points</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Clear filters button */}
              {(replySearchQuery || sortBy !== 'newest' || filters.author || filters.hasFactCheck || filters.hasPoints || filters.dateRange !== 'all') && (
                <div className="mt-3 pt-3 border-t border-black/10">
                  <button
                    onClick={() => {
                      setReplySearchQuery('');
                      setSortBy('newest');
                      setFilters({
                        author: '',
                        hasFactCheck: false,
                        hasPoints: false,
                        dateRange: 'all'
                      });
                    }}
                    className="px-3 py-1 text-xs bg-white border border-black/20 rounded hover:bg-gray-50 flex items-center gap-2"
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Clear All Filters
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Results summary */}
          {(replySearchQuery || filters.author || filters.hasFactCheck || filters.hasPoints || filters.dateRange !== 'all') && (
            <div className="px-3 py-2 text-xs text-gray-600 bg-gray-50">
              {replySearchQuery && (
                <span>Search: &ldquo;<strong>{replySearchQuery}</strong>&rdquo; • </span>
              )}
              <span>Showing {sortedReplies.length} of {replies.length} replies</span>
            </div>
          )}
        </div>
      )}

      {/* No results message */}
      {showFilters && replies.length > 0 && sortedReplies.length === 0 && (
        <div className="text-center py-6 border border-black/20 rounded-lg bg-gray-50">
          <div className="text-3xl mb-2">🔍</div>
          <h3 className="text-sm font-medium text-gray-900 mb-1">No replies found</h3>
          <p className="text-xs text-gray-600">Try adjusting your search terms or filters.</p>
        </div>
      )}

      {Object.entries(groupedReplies.withPoints).map(([pointId, pointReplies]) => {
        const point = aiPoints?.find(p => p.id === pointId);
        const isExpanded = expandedPointSections.has(pointId);
        const paginatedReplies = getPaginatedReplies(pointReplies, pointId);
        const hasMore = hasMoreReplies(pointReplies, pointId);
        
        return (
          <div key={pointId} className="border border-black/20 rounded-lg bg-white">
            {point && (
              <button
                onClick={() => togglePointSection(pointId)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start gap-3 flex-1">
                  <svg className={`w-4 h-4 transition-transform flex-shrink-0 mt-0.5 ${isExpanded ? 'rotate-90' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-gray-900 mb-1">
                      &ldquo;<SearchHighlight text={point.text} searchQuery={replySearchQuery || searchQuery} />&rdquo;
                    </div>
                    <div className="flex items-center gap-2">
                      {point.type && (
                        <span className="inline-block px-2 py-0.5 text-[10px] rounded-full bg-black text-white uppercase tracking-wide">
                          <SearchHighlight text={point.type} searchQuery={replySearchQuery || searchQuery} />
                        </span>
                      )}
                      <span className="text-xs text-gray-600">
                        {pointReplies.length} {pointReplies.length === 1 ? 'reply' : 'replies'}
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            )}
            
            {isExpanded && (
              <div className="border-t border-black/10">
                <div className="p-4 space-y-3">
                  {paginatedReplies.map(reply => renderReply(reply, 0))}
                  
                  {hasMore && (
                    <div className="pt-2 border-t border-black/5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          loadMoreReplies(pointId);
                        }}
                        className="w-full py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-colors flex items-center justify-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                        Load {Math.min(REPLIES_PER_PAGE, pointReplies.length - paginatedReplies.length)} more replies
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
      {groupedReplies.general.length > 0 && (
        <div className="border border-black/20 rounded-lg bg-white">
          <button
            onClick={() => togglePointSection('general')}
            className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-start gap-3 flex-1">
              <svg className={`w-4 h-4 transition-transform flex-shrink-0 mt-0.5 ${expandedPointSections.has('general') ? 'rotate-90' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-gray-900 mb-1">
                  General Discussion
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-600">
                    {groupedReplies.general.length} {groupedReplies.general.length === 1 ? 'reply' : 'replies'}
                  </span>
                </div>
              </div>
            </div>
          </button>
          
          {expandedPointSections.has('general') && (
            <div className="border-t border-black/10">
              <div className="p-4 space-y-3">
                {getPaginatedReplies(groupedReplies.general, 'general').map(reply => renderReply(reply, 0))}
                
                {hasMoreReplies(groupedReplies.general, 'general') && (
                  <div className="pt-2 border-t border-black/5">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        loadMoreReplies('general');
                      }}
                      className="w-full py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                      Load {Math.min(REPLIES_PER_PAGE, groupedReplies.general.length - getPaginatedReplies(groupedReplies.general, 'general').length)} more replies
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
