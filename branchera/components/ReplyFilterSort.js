'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';

export default function ReplyFilterSort({ 
  replies, 
  onResults, 
  onSearchChange, 
  onFilterChange, 
  onSortChange,
  initialSearchQuery = '',
  initialSortBy = 'newest',
  initialFilters = {
    author: '',
    hasFactCheck: false,
    hasPoints: false,
    claim: '',
    pointsEarned: false,
    dateRange: 'all',
    minViews: 0
  }
}) {
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [sortBy, setSortBy] = useState(initialSortBy);
  const [filters, setFilters] = useState(initialFilters);
  const [isExpanded, setIsExpanded] = useState(false);

  // Sync internal state with props when they change
  useEffect(() => {
    setSearchQuery(initialSearchQuery);
  }, [initialSearchQuery]);

  useEffect(() => {
    setSortBy(initialSortBy);
  }, [initialSortBy]);

  useEffect(() => {
    setFilters(initialFilters);
  }, [initialFilters]);

  // Helper functions for searching
  const searchInReply = useCallback((reply, query) => {
    const normalizedQuery = query.toLowerCase().trim();
    return (
      reply.content?.toLowerCase().includes(normalizedQuery) ||
      reply.authorName?.toLowerCase().includes(normalizedQuery) ||
      searchInFactCheck(reply.factCheckResults, normalizedQuery) ||
      searchInAIPoints(reply.aiPoints, normalizedQuery)
    );
  }, []);

  const searchInFactCheck = (factCheckResults, query) => {
    if (!factCheckResults || !Array.isArray(factCheckResults.claims)) return false;
    
    return factCheckResults.claims.some(claim =>
      claim.text?.toLowerCase().includes(query) ||
      claim.status?.toLowerCase().includes(query) ||
      claim.explanation?.toLowerCase().includes(query) ||
      claim.originalPoint?.toLowerCase().includes(query) ||
      (claim.webSearchResults?.results && Array.isArray(claim.webSearchResults.results) && 
       claim.webSearchResults.results.some(result => 
         result.title?.toLowerCase().includes(query) ||
         result.snippet?.toLowerCase().includes(query) ||
         result.source?.toLowerCase().includes(query)
       ))
    );
  };

  const searchInAIPoints = (aiPoints, query) => {
    if (!Array.isArray(aiPoints)) return false;
    
    return aiPoints.some(point =>
      point.text?.toLowerCase().includes(query) ||
      point.type?.toLowerCase().includes(query)
    );
  };

  // Search function that searches through replies recursively
  const searchReplies = useCallback((replies, query) => {
    if (!query.trim()) return replies;

    const normalizedQuery = query.toLowerCase().trim();
    
    const searchRecursively = (repliesArray) => {
      return repliesArray.filter(reply => {
        const matchesReply = searchInReply(reply, normalizedQuery);
        const matchesChildren = reply.children && reply.children.length > 0 
          ? searchRecursively(reply.children).length > 0
          : false;
        
        if (matchesReply || matchesChildren) {
          // If this reply or its children match, include it with filtered children
          return {
            ...reply,
            children: reply.children ? searchRecursively(reply.children) : []
          };
        }
        return false;
      }).filter(Boolean);
    };

    return searchRecursively(replies);
  }, [searchInReply]);

  // Filter function
  const filterReplies = useCallback((replies, filters) => {
    const filterRecursively = (repliesArray) => {
      return repliesArray.filter(reply => {
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

        // Claim filter (search in fact check claims)
        if (filters.claim && !searchInFactCheck(reply.factCheckResults, filters.claim)) {
          return false;
        }

        // Points earned filter (replies that earned points for the user)
        if (filters.pointsEarned && !reply.pointsEarnedByUser) {
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

        // Min views filter
        if (filters.minViews > 0 && (reply.views || 0) < filters.minViews) {
          return false;
        }

        return true;
      }).map(reply => ({
        ...reply,
        children: reply.children ? filterRecursively(reply.children) : []
      }));
    };

    return filterRecursively(replies);
  }, []);

  // Sort function
  const sortReplies = useCallback((replies, sortBy) => {
    const sortRecursively = (repliesArray) => {
      const sorted = [...repliesArray].sort((a, b) => {
        switch (sortBy) {
          case 'oldest':
            return new Date(a.createdAt) - new Date(b.createdAt);
          case 'views':
            return (b.views || 0) - (a.views || 0);
          case 'author':
            return (a.authorName || '').localeCompare(b.authorName || '');
          case 'points':
            const aPoints = (a.aiPoints || []).length;
            const bPoints = (b.aiPoints || []).length;
            return bPoints - aPoints;
          case 'relevance':
            if (!searchQuery.trim()) return 0;
            return calculateRelevanceScore(b, searchQuery) - calculateRelevanceScore(a, searchQuery);
          case 'newest':
          default:
            return new Date(b.createdAt) - new Date(a.createdAt);
        }
      });

      // Recursively sort children
      return sorted.map(reply => ({
        ...reply,
        children: reply.children ? sortRecursively(reply.children) : []
      }));
    };

    return sortRecursively(replies);
  }, [searchQuery, calculateRelevanceScore]);

  const calculateRelevanceScore = useCallback((reply, query) => {
    let score = 0;
    const normalizedQuery = query.toLowerCase();
    
    // Content matches
    const contentMatches = (reply.content?.toLowerCase().match(new RegExp(normalizedQuery, 'g')) || []).length;
    score += contentMatches * 5;
    
    // Author matches
    if (reply.authorName?.toLowerCase().includes(normalizedQuery)) {
      score += 3;
    }
    
    // Fact check matches
    if (searchInFactCheck(reply.factCheckResults, normalizedQuery)) {
      score += 4;
    }
    
    // AI points matches
    if (searchInAIPoints(reply.aiPoints, normalizedQuery)) {
      score += 3;
    }
    
    // Boost score for replies with more engagement
    score += Math.log(1 + (reply.views || 0)) * 0.5;
    
    return score;
  }, []);

  // Memoize processed replies to avoid recalculation
  const processedReplies = useMemo(() => {
    let processed = replies;

    // Apply search
    if (searchQuery.trim()) {
      processed = searchReplies(processed, searchQuery);
    }

    // Apply filters
    processed = filterReplies(processed, filters);

    // Apply sort
    processed = sortReplies(processed, sortBy);

    return processed;
  }, [replies, searchQuery, sortBy, filters, searchReplies, filterReplies, sortReplies]);

  // Effect to notify parent components when results change
  useEffect(() => {
    onResults?.(processedReplies);
    onSearchChange?.(searchQuery);
    onFilterChange?.(filters);
    onSortChange?.(sortBy);
  }, [processedReplies, searchQuery, filters, sortBy]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSortBy('newest');
    setFilters({
      author: '',
      hasFactCheck: false,
      hasPoints: false,
      claim: '',
      pointsEarned: false,
      dateRange: 'all',
      minViews: 0
    });
  };

  const hasActiveFilters = searchQuery.trim() || 
    filters.author || 
    filters.hasFactCheck || 
    filters.hasPoints ||
    filters.claim ||
    filters.pointsEarned ||
    filters.dateRange !== 'all' || 
    filters.minViews > 0 ||
    sortBy !== 'newest';

  // Count total replies (including nested)
  const countReplies = (replies) => {
    return replies.reduce((count, reply) => {
      return count + 1 + (reply.children ? countReplies(reply.children) : 0);
    }, 0);
  };

  const totalReplies = countReplies(replies);
  const filteredCount = countReplies(processedReplies);

  return (
    <div className="mb-4 border border-black/20 rounded-lg bg-white">
      {/* Search Bar */}
      <div className="p-3 border-b border-black/10">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Search replies, authors, claims..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 pr-10 border border-black/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={`px-3 py-2 border border-black/20 rounded-lg hover:bg-gray-50 flex items-center gap-2 text-sm`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Filter
            <svg className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Expanded Filters and Sort */}
      {isExpanded && (
        <div className="p-3 border-b border-black/10 bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {/* Sort Options */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Sort by</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-2 py-1 border border-black/20 rounded text-sm focus:outline-none focus:ring-2 focus:ring-black"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="views">Most Viewed</option>
                <option value="author">By Author</option>
                <option value="points">Most Points</option>
                {searchQuery.trim() && <option value="relevance">Most Relevant</option>}
              </select>
            </div>

            {/* Author Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Author</label>
              <input
                type="text"
                placeholder="Filter by author..."
                value={filters.author}
                onChange={(e) => handleFilterChange('author', e.target.value)}
                className="w-full px-2 py-1 border border-black/20 rounded text-sm focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>

            {/* Claim Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Claim Search</label>
              <input
                type="text"
                placeholder="Search in fact-check claims..."
                value={filters.claim}
                onChange={(e) => handleFilterChange('claim', e.target.value)}
                className="w-full px-2 py-1 border border-black/20 rounded text-sm focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>

            {/* Date Range */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Date Range</label>
              <select
                value={filters.dateRange}
                onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                className="w-full px-2 py-1 border border-black/20 rounded text-sm focus:outline-none focus:ring-2 focus:ring-black"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">Past Week</option>
                <option value="month">Past Month</option>
              </select>
            </div>

            {/* Min Views */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Min Views</label>
              <input
                type="number"
                min="0"
                value={filters.minViews}
                onChange={(e) => handleFilterChange('minViews', parseInt(e.target.value) || 0)}
                className="w-full px-2 py-1 border border-black/20 rounded text-sm focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>

            {/* Boolean Filters */}
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-700">Content Filters</label>
              <div className="space-y-1">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.hasFactCheck}
                    onChange={(e) => handleFilterChange('hasFactCheck', e.target.checked)}
                    className="mr-2 rounded focus:ring-black"
                  />
                  <span className="text-xs">Has Fact Check</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.hasPoints}
                    onChange={(e) => handleFilterChange('hasPoints', e.target.checked)}
                    className="mr-2 rounded focus:ring-black"
                  />
                  <span className="text-xs">Has AI Points</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.pointsEarned}
                    onChange={(e) => handleFilterChange('pointsEarned', e.target.checked)}
                    className="mr-2 rounded focus:ring-black"
                  />
                  <span className="text-xs">Points Earned</span>
                </label>
              </div>
            </div>
          </div>

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <div className="mt-3 pt-3 border-t border-black/10">
              <button
                onClick={clearFilters}
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

      {/* Results Summary */}
      {hasActiveFilters && (
        <div className="px-3 py-2 text-xs text-gray-600 bg-gray-50">
          {searchQuery && (
            <span>Search results for &ldquo;<strong>{searchQuery}</strong>&rdquo; • </span>
          )}
          <span>Showing {filteredCount} of {totalReplies} repl{filteredCount !== 1 ? 'ies' : 'y'}</span>
        </div>
      )}
    </div>
  );
}