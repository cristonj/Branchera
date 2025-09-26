'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';

export default function SearchFilterSort({ 
  discussions, 
  onResults, 
  onSearchChange, 
  onSearchTypeChange,
  onFilterChange, 
  onSortChange,
  initialSearchQuery = '',
  initialSearchType = 'all',
  initialSortBy = 'newest',
  initialFilters = {
    hasReplies: false,
    hasFactCheck: false,
    dateRange: 'all',
    author: '',
    minLikes: 0,
    minViews: 0
  }
}) {
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [searchType, setSearchType] = useState(initialSearchType);
  const [sortBy, setSortBy] = useState(initialSortBy);
  const [filters, setFilters] = useState(initialFilters);
  const [isExpanded, setIsExpanded] = useState(false);

  // Sync internal state with props when they change
  useEffect(() => {
    setSearchQuery(initialSearchQuery);
  }, [initialSearchQuery]);

  useEffect(() => {
    setSearchType(initialSearchType);
  }, [initialSearchType]);

  useEffect(() => {
    setSortBy(initialSortBy);
  }, [initialSortBy]);

  useEffect(() => {
    setFilters(initialFilters);
  }, [initialFilters]);

  // Helper functions for searching (no useCallback needed as they don't depend on props/state)
  const searchInDiscussion = (discussion, query, type) => {
    switch (type) {
      case 'title':
        return discussion.title?.toLowerCase().includes(query);
      case 'content':
        return discussion.content?.toLowerCase().includes(query);
      case 'factcheck':
        return searchInFactCheck(discussion.factCheckResults, query);
      case 'all':
      default:
        return (
          discussion.title?.toLowerCase().includes(query) ||
          discussion.content?.toLowerCase().includes(query) ||
          discussion.authorName?.toLowerCase().includes(query) ||
          searchInFactCheck(discussion.factCheckResults, query) ||
          searchInAIPoints(discussion.aiPoints, query)
        );
    }
  };

  const searchInReplies = (replies, query) => {
    if (!Array.isArray(replies)) return false;
    
    const searchRepliesRecursively = (repliesArray, searchQuery) => {
      return repliesArray.some(reply => 
        reply.content?.toLowerCase().includes(searchQuery) ||
        reply.authorName?.toLowerCase().includes(searchQuery) ||
        searchInFactCheck(reply.factCheckResults, searchQuery) ||
        searchInAIPoints(reply.aiPoints, searchQuery) ||
        (reply.children && searchRepliesRecursively(reply.children, searchQuery))
      );
    };
    
    return searchRepliesRecursively(replies, query);
  };

  // Search function that searches through discussions and replies
  const searchContent = useCallback((discussions, query, type) => {
    if (!query.trim()) return discussions;

    const normalizedQuery = query.toLowerCase().trim();
    
    return discussions.filter(discussion => {
      // Search in discussion
      const discussionMatches = searchInDiscussion(discussion, normalizedQuery, type);
      
      // Search in replies if type allows
      const replyMatches = (type === 'all' || type === 'replies') 
        ? searchInReplies(discussion.replies || [], normalizedQuery)
        : false;

      return discussionMatches || replyMatches;
    }).map(discussion => {
      // Add search metadata for highlighting
      return {
        ...discussion,
        searchMatches: getSearchMatches(discussion, normalizedQuery, type)
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
       )) ||
      claim.webSearchResults?.searchTerm?.toLowerCase().includes(query)
    );
  };

  const searchInAIPoints = (aiPoints, query) => {
    if (!Array.isArray(aiPoints)) return false;
    
    return aiPoints.some(point =>
      point.text?.toLowerCase().includes(query) ||
      point.type?.toLowerCase().includes(query)
    );
  };

  const getReplyMatches = (replies, query) => {
    if (!Array.isArray(replies)) return [];
    
    const getMatches = (repliesArray, searchQuery) => {
      return repliesArray.map(reply => ({
        id: reply.id,
        matches: {
          content: reply.content?.toLowerCase().includes(searchQuery),
          author: reply.authorName?.toLowerCase().includes(searchQuery),
          factCheck: searchInFactCheck(reply.factCheckResults, searchQuery),
          aiPoints: searchInAIPoints(reply.aiPoints, searchQuery)
        },
        children: getMatches(reply.children || [], searchQuery)
      })).filter(replyMatch => 
        replyMatch.matches.content || 
        replyMatch.matches.author || 
        replyMatch.matches.factCheck || 
        replyMatch.matches.aiPoints ||
        replyMatch.children.length > 0
      );
    };
    
    return getMatches(replies, query);
  };

  const getSearchMatches = (discussion, query, type) => {
    const matches = {
      title: false,
      content: false,
      author: false,
      factCheck: false,
      aiPoints: false,
      replies: []
    };

    if (type === 'all' || type === 'title') {
      matches.title = discussion.title?.toLowerCase().includes(query);
    }
    if (type === 'all' || type === 'content') {
      matches.content = discussion.content?.toLowerCase().includes(query);
    }
    if (type === 'all') {
      matches.author = discussion.authorName?.toLowerCase().includes(query);
      matches.factCheck = searchInFactCheck(discussion.factCheckResults, query);
      matches.aiPoints = searchInAIPoints(discussion.aiPoints, query);
    }
    if (type === 'factcheck') {
      matches.factCheck = searchInFactCheck(discussion.factCheckResults, query);
    }
    if (type === 'all' || type === 'replies') {
      matches.replies = getReplyMatches(discussion.replies || [], query);
    }

    return matches;
  };

  // Filter function
  const filterDiscussions = useCallback((discussions, filters) => {
    return discussions.filter(discussion => {
      // Has replies filter
      if (filters.hasReplies && (!discussion.replies || discussion.replies.length === 0)) {
        return false;
      }

      // Has fact check filter
      if (filters.hasFactCheck && !discussion.factCheckResults) {
        return false;
      }

      // Date range filter
      if (filters.dateRange !== 'all') {
        const discussionDate = new Date(discussion.createdAt);
        const now = new Date();
        const diffInDays = (now - discussionDate) / (1000 * 60 * 60 * 24);
        
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

      // Author filter
      if (filters.author && !discussion.authorName?.toLowerCase().includes(filters.author.toLowerCase())) {
        return false;
      }

      // Min likes filter
      if (filters.minLikes > 0 && (discussion.likes || 0) < filters.minLikes) {
        return false;
      }

      // Min views filter
      if (filters.minViews > 0 && (discussion.views || 0) < filters.minViews) {
        return false;
      }

      return true;
    });
  }, []);

  // Sort function
  const sortDiscussions = useCallback((discussions, sortBy, query = '') => {
    const sorted = [...discussions].sort((a, b) => {
      switch (sortBy) {
        case 'oldest':
          return new Date(a.createdAt) - new Date(b.createdAt);
        case 'likes':
          return (b.likes || 0) - (a.likes || 0);
        case 'views':
          return (b.views || 0) - (a.views || 0);
        case 'replies':
          return (b.replyCount || 0) - (a.replyCount || 0);
        case 'relevance':
          if (!query.trim()) return 0;
          return calculateRelevanceScore(b, query) - calculateRelevanceScore(a, query);
        case 'newest':
        default:
          return new Date(b.createdAt) - new Date(a.createdAt);
      }
    });

    return sorted;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const calculateRelevanceScore = (discussion, query) => {
    let score = 0;
    const normalizedQuery = query.toLowerCase();
    
    // Title matches get highest score
    if (discussion.title?.toLowerCase().includes(normalizedQuery)) {
      score += 10;
      // Exact title match gets bonus
      if (discussion.title?.toLowerCase() === normalizedQuery) {
        score += 20;
      }
    }
    
    // Content matches
    const contentMatches = (discussion.content?.toLowerCase().match(new RegExp(normalizedQuery, 'g')) || []).length;
    score += contentMatches * 3;
    
    // Author matches
    if (discussion.authorName?.toLowerCase().includes(normalizedQuery)) {
      score += 5;
    }
    
    // Fact check matches
    if (searchInFactCheck(discussion.factCheckResults, normalizedQuery)) {
      score += 7;
    }
    
    // AI points matches
    if (searchInAIPoints(discussion.aiPoints, normalizedQuery)) {
      score += 5;
    }
    
    // Reply matches (lower weight)
    if (searchInReplies(discussion.replies || [], normalizedQuery)) {
      score += 2;
    }
    
    // Boost score for discussions with more engagement
    score += Math.log(1 + (discussion.likes || 0)) * 0.5;
    score += Math.log(1 + (discussion.views || 0)) * 0.3;
    score += Math.log(1 + (discussion.replyCount || 0)) * 0.4;
    
    return score;
  };

  // Memoize processed discussions to avoid recalculation and infinite loops
  const processedDiscussions = useMemo(() => {
    let processed = discussions;

    // Apply search
    if (searchQuery.trim()) {
      processed = searchContent(processed, searchQuery, searchType);
    }

    // Apply filters
    processed = filterDiscussions(processed, filters);

    // Apply sort
    processed = sortDiscussions(processed, sortBy, searchQuery);

    return processed;
  }, [discussions, searchQuery, searchType, sortBy, filters, searchContent, filterDiscussions, sortDiscussions]);

  // Effect to notify parent components when results change
  // Remove callbacks from dependencies to prevent infinite loops
  useEffect(() => {
    onResults?.(processedDiscussions);
    onSearchChange?.(searchQuery);
    onSearchTypeChange?.(searchType);
    onFilterChange?.(filters);
    onSortChange?.(sortBy);
  }, [processedDiscussions, searchQuery, searchType, filters, sortBy]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSearchType('all');
    setSortBy('newest');
    setFilters({
      hasReplies: false,
      hasFactCheck: false,
      dateRange: 'all',
      author: '',
      minLikes: 0,
      minViews: 0
    });
  };

  const hasActiveFilters = searchQuery.trim() || 
    searchType !== 'all' ||
    filters.hasReplies || 
    filters.hasFactCheck || 
    filters.dateRange !== 'all' || 
    filters.author || 
    filters.minLikes > 0 || 
    filters.minViews > 0 ||
    sortBy !== 'newest';

  return (
    <div className="mb-6 border border-black/20 rounded-lg bg-white">
      {/* Search Bar */}
      <div className="p-4 border-b border-black/10">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <input
              key="search-input"
              type="text"
              placeholder="Search discussions, replies, fact-checks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 pr-10 border border-black/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={`px-4 py-2 border border-black/20 rounded-lg hover:bg-black-50 flex items-center gap-2`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Filters
            <svg className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Expanded Filters and Sort */}
      {isExpanded && (
        <div className="p-4 border-b border-black/10 bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Search Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search in</label>
              <select
                value={searchType}
                onChange={(e) => setSearchType(e.target.value)}
                className="w-full pl-3 py-2 border border-black/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              >
                <option value="all">All Content</option>
                <option value="title">Titles Only</option>
                <option value="content">Content Only</option>
                <option value="factcheck">Fact Checks</option>
                <option value="replies">Replies Only</option>
              </select>
            </div>

            {/* Sort Options */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sort by</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-3 py-2 border border-black/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="likes">Most Liked</option>
                <option value="views">Most Viewed</option>
                <option value="replies">Most Replies</option>
                {searchQuery.trim() && <option value="relevance">Most Relevant</option>}
              </select>
            </div>

            {/* Date Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
              <select
                value={filters.dateRange}
                onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                className="w-full px-3 py-2 border border-black/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">Past Week</option>
                <option value="month">Past Month</option>
              </select>
            </div>

            {/* Author Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Author</label>
              <input
                type="text"
                placeholder="Filter by author name..."
                value={filters.author}
                onChange={(e) => handleFilterChange('author', e.target.value)}
                className="w-full px-3 py-2 border border-black/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>

            {/* Min Likes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Minimum Likes</label>
              <input
                type="number"
                min="0"
                value={filters.minLikes}
                onChange={(e) => handleFilterChange('minLikes', parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-black/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>

            {/* Min Views */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Minimum Views</label>
              <input
                type="number"
                min="0"
                value={filters.minViews}
                onChange={(e) => handleFilterChange('minViews', parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-black/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>

            {/* Boolean Filters */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Content Filters</label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.hasReplies}
                    onChange={(e) => handleFilterChange('hasReplies', e.target.checked)}
                    className="mr-2 rounded focus:ring-black"
                  />
                  <span className="text-sm">Has Replies</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.hasFactCheck}
                    onChange={(e) => handleFilterChange('hasFactCheck', e.target.checked)}
                    className="mr-2 rounded focus:ring-black"
                  />
                  <span className="text-sm">Has Fact Check</span>
                </label>
              </div>
            </div>
          </div>

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <div className="mt-4 pt-4 border-t border-black/10">
              <button
                onClick={clearFilters}
                className="px-4 py-2 text-sm bg-white border border-black/20 rounded-lg hover:bg-gray-50 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
        <div className="px-4 py-2 text-sm text-gray-600 bg-gray-50">
          {searchQuery && (
            <span>Search results for &ldquo;<strong>{searchQuery}</strong>&rdquo; • </span>
          )}
          <span>Showing {processedDiscussions.length} discussion{processedDiscussions.length !== 1 ? 's' : ''}</span>
        </div>
      )}
    </div>
  );
}