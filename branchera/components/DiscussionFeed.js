'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import { useFirestore } from '@/hooks/useFirestore';
import { useDatabase } from '@/hooks/useDatabase';
import { useAuth } from '@/contexts/AuthContext';
import DiscussionItem from './DiscussionItem';
import SearchFilterSort from './SearchFilterSort';
import { AIService } from '@/lib/aiService';
import { usePolling } from '@/hooks/usePolling';
import { REALTIME_CONFIG } from '@/lib/realtimeConfig';
import { NewsService } from '@/lib/newsService';
import { useToast } from '@/contexts/ToastContext';

export default function DiscussionFeed({ newDiscussion, onStartDiscussion }) {
  const [discussions, setDiscussions] = useState([]);
  const [filteredDiscussions, setFilteredDiscussions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedReplies, setExpandedReplies] = useState(new Set()); // Track which discussions have expanded replies
  const [expandedDiscussions, setExpandedDiscussions] = useState(new Set()); // Track expanded discussion cards
  const [expandedAIPoints, setExpandedAIPoints] = useState(new Set()); // Track expanded AI points sections
  const [searchQuery, setSearchQuery] = useState('');
  const [currentSearchType, setCurrentSearchType] = useState('all');
  const [currentFilters, setCurrentFilters] = useState({
    hasReplies: false,
    hasFactCheck: false,
    showNewsOnly: false,
    selectedTags: [],
    dateRange: 'all',
    author: '',
    minLikes: 0,
    minViews: 0
  });
  const [currentSort, setCurrentSort] = useState('newest');
  const [isUserSearching, setIsUserSearching] = useState(false);
  const [collectedPoints, setCollectedPoints] = useState(new Map()); // Track which points user has collected
  const [pointCounts, setPointCounts] = useState(new Map()); // Track how many points earned for each AI point
  const searchTimeoutRef = useRef(null);
  
  const { updateDocument } = useFirestore();
  const { getDiscussions, deleteDiscussion, deleteReply, editDiscussion, updateAIPoints, updateReplyAIPoints, incrementDiscussionView, incrementReplyView, updateFactCheckResults, updateReplyFactCheckResults, hasUserCollectedPoint, createUserPoint, getUserPoints, getPointCounts, createDiscussion } = useDatabase();
  const { user } = useAuth();
  
  // Safely get toast functions with fallbacks
  const toastContext = useToast();
  const showSuccessToast = toastContext?.showSuccessToast || (() => {});
  const showErrorToast = toastContext?.showErrorToast || (() => {});

  const loadCollectedPoints = useCallback(async () => {
    if (!user) return;
    
    try {
      // Load all user's points to show visual indicators
      const userPoints = await getUserPoints(user.uid);
      const collected = new Map();
      
      // For each point, create a key to track collection status
      userPoints.forEach(point => {
        if (point.originalPointId) {
          const pointKey = `${point.discussionId}-${point.originalPointId}`;
          collected.set(pointKey, true);
        }
      });
      
      setCollectedPoints(collected);
      console.log('Loaded collected points:', collected.size);
    } catch (error) {
      console.error('Error loading collected points:', error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Remove dependencies to prevent constant refreshes

  const loadPointCounts = useCallback(async () => {
    try {
      // Load point counts for all AI points
      const counts = await getPointCounts();
      setPointCounts(counts);
      console.log('Loaded point counts:', counts.size);
    } catch (error) {
      console.error('Error loading point counts:', error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Remove dependencies to prevent constant refreshes

  const loadDiscussions = useCallback(async () => {
    try {
      setLoading(true);
      // Load discussions directly without setup
      const discussionsData = await getDiscussions({
        limit: 20,
        orderField: 'createdAt',
        orderDirection: 'desc'
      });
      setDiscussions(discussionsData);
      
      // Generate AI points and fact-check results for older discussions that don't have them
      discussionsData.forEach(discussion => {
        if (!discussion.aiPointsGenerated && (!discussion.aiPoints || discussion.aiPoints.length === 0)) {
          generateAIPointsForDiscussion(discussion);
        }
        if (!discussion.factCheckGenerated && !discussion.factCheckResults) {
          generateFactCheckForDiscussion(discussion);
        }
      });
      
      // Check if we should create an auto-news post (non-blocking, after page loads)
      setTimeout(() => {
        checkAndCreateNewsPost(discussionsData);
      }, 100);
      
    } catch (error) {
      console.error('Error loading discussions:', error);
      // Set empty array to prevent crashes
      setDiscussions([]);
    } finally {
      setLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Check if we should create a news post and create one if needed (non-blocking)
  const checkAndCreateNewsPost = useCallback(async (discussionsData) => {
    // Wrap everything in a try-catch to ensure this never blocks the UI
    try {
      console.log('Checking if we should create an AI news post...');
      
      // Database operations require authentication - only run when user is logged in
      if (!user) {
        console.log('No user logged in, skipping news post check (DB requires auth)');
        return;
      }
      
      console.log('User authenticated, proceeding with news post check...');
      
      // Add a timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('News post creation timeout')), 30000)
      );
      
      const shouldCreatePromise = NewsService.shouldCreateNewsPost(discussionsData);
      
      const shouldCreate = await Promise.race([shouldCreatePromise, timeoutPromise]);
      
      if (shouldCreate) {
        console.log('Creating AI news post...');
        
        // Create news post with timeout protection and immediate AI generation
        const createNewsPromise = NewsService.createNewsDiscussion(
          createDiscussion, 
          updateAIPoints, 
          updateFactCheckResults
        );
        const newsDiscussion = await Promise.race([createNewsPromise, timeoutPromise]);
        
        if (newsDiscussion) {
          console.log('AI news post created successfully:', newsDiscussion.title);
          console.log('News discussion includes AI points:', newsDiscussion.aiPoints?.length || 0);
          console.log('News discussion includes fact-check:', !!newsDiscussion.factCheckResults);
          
          // Add the new discussion to the current list with all AI-generated content
          setDiscussions(prev => [newsDiscussion, ...prev]);
          
          // No need to refresh since we already have the complete discussion with AI content
        }
      } else {
        console.log('No need to create AI news post at this time');
      }
    } catch (error) {
      console.error('❌ Error in news post creation (non-blocking):', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      // This is intentionally non-blocking - errors here should never affect the main UI
    }
  }, [user, createDiscussion, updateAIPoints, updateFactCheckResults]);

  useEffect(() => {
    loadDiscussions();
  }, [loadDiscussions]); // Include loadDiscussions dependency

  // Trigger news bot check when user logs in
  useEffect(() => {
    if (user && discussions.length > 0) {
      console.log('User logged in, checking for news post creation...');
      // Small delay to ensure discussions are loaded
      setTimeout(() => {
        checkAndCreateNewsPost(discussions);
      }, 1000);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid, discussions.length]); // Run when user logs in or discussions change

  // Load collected points and point counts separately to avoid refresh loops
  useEffect(() => {
    if (user) {
      loadCollectedPoints();
    }
    loadPointCounts(); // Load point counts for all users
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid]); // Only load when user ID changes

  // Silent refresh without showing loading skeleton to avoid flicker during polling
  const refreshDiscussions = useCallback(async () => {
    // Don't refresh if user is actively searching
    if (isUserSearching) {
      console.log('Skipping refresh - user is searching');
      return;
    }
    
    try {
      const discussionsData = await getDiscussions({
        limit: 20,
        orderField: 'createdAt',
        orderDirection: 'desc'
      });
      
      // Merge fresh data with existing state to prevent duplicates
      setDiscussions(prev => {
        const updatedDiscussions = discussionsData.map(freshDiscussion => {
          const existingDiscussion = prev.find(d => d.id === freshDiscussion.id);
          
          if (existingDiscussion) {
            // Merge replies, removing duplicates by ID
            const existingReplies = existingDiscussion.replies || [];
            const freshReplies = freshDiscussion.replies || [];
            
            // Create a map of existing replies for quick lookup
            const existingRepliesMap = new Map(existingReplies.map(r => [r.id, r]));
            
            // Merge replies, preferring existing ones to maintain local updates
            const mergedReplies = [...existingReplies];
            freshReplies.forEach(freshReply => {
              if (!existingRepliesMap.has(freshReply.id)) {
                mergedReplies.push(freshReply);
              }
            });
            
            return {
              ...freshDiscussion,
              replies: mergedReplies,
              replyCount: mergedReplies.length
            };
          }
          
          return freshDiscussion;
        });
        
        // Add any discussions that exist locally but not in fresh data
        const freshIds = new Set(discussionsData.map(d => d.id));
        const localOnlyDiscussions = prev.filter(d => !freshIds.has(d.id));
        
        return [...updatedDiscussions, ...localOnlyDiscussions];
      });
    } catch (error) {
      console.error('Background refresh failed:', error);
    }
  }, [isUserSearching, getDiscussions]);

  // Poll for near-realtime updates, but pause when user is actively searching
  usePolling(
    refreshDiscussions,
    REALTIME_CONFIG.pollingIntervalMs,
    { enabled: !isUserSearching, immediate: false, pauseOnHidden: REALTIME_CONFIG.pauseOnHidden }
  );

  // Add new discussion to the top of the feed when created
  useEffect(() => {
    if (newDiscussion) {
      setDiscussions(prev => {
        // Check if discussion already exists to prevent duplicates
        const existsIndex = prev.findIndex(d => d.id === newDiscussion.id);
        if (existsIndex !== -1) {
          // Update existing discussion with new data
          const updated = [...prev];
          updated[existsIndex] = newDiscussion;
          return updated;
        } else {
          // Add new discussion to the top
          return [newDiscussion, ...prev];
        }
      });
      // Refresh point counts to show new points earned
      loadPointCounts();
    }
  }, [newDiscussion, loadPointCounts]);

  // Function to refresh point counts and collected points (called after earning points)
  const refreshPointsData = useCallback(() => {
    if (user) {
      loadCollectedPoints();
    }
    loadPointCounts();
  }, [user, loadCollectedPoints, loadPointCounts]);

  // Handle discussion updates from DiscussionItem components
  const handleDiscussionUpdate = useCallback((discussionId, updatedData) => {
    if (updatedData === null) {
      // Delete discussion
      setDiscussions(prev => prev.filter(d => d.id !== discussionId));
    } else {
      // Update discussion
      setDiscussions(prev =>
        prev.map(d => d.id === discussionId ? { ...d, ...updatedData } : d)
      );
    }
  }, []);

  // Handle reply additions
  const handleReplyAdded = useCallback((discussionId, newReply) => {
    setDiscussions(prev =>
      prev.map(d => {
        if (d.id === discussionId) {
          const updatedReplies = [
            ...(d.replies || []).filter(r => r.id !== newReply.id),
            newReply
          ];
          return {
            ...d,
            replies: updatedReplies,
            replyCount: updatedReplies.length
          };
        }
        return d;
      })
    );
    
    // Expand replies to show the new reply
    setExpandedReplies(prev => new Set([...prev, discussionId]));
  }, []);


  // Initialize filtered discussions when discussions change
  useEffect(() => {
    setFilteredDiscussions(discussions);
  }, [discussions]);

  // Handle search query changes and manage searching state
  const handleSearchChange = useCallback((query) => {
    // Prevent duplicate calls with the same query
    if (query === searchQuery) {
      return;
    }
    
    setSearchQuery(query);
    
    // Clear any existing timeout since we're removing the timeout mechanism
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
      searchTimeoutRef.current = null;
    }
    
    if (query.trim()) {
      // User is searching - pause polling until search is cleared
      console.log('User started searching:', query, '- polling paused');
      setIsUserSearching(true);
    } else {
      // Search cleared - resume polling
      console.log('Search cleared, resuming polling');
      setIsUserSearching(false);
    }
  }, [searchQuery]);

  // Clean up timeout and refs on unmount
  useEffect(() => {
    const currentSearchTimeout = searchTimeoutRef.current;
    const currentReplyFormRefs = replyFormRefs.current;
    
    return () => {
      if (currentSearchTimeout) {
        clearTimeout(currentSearchTimeout);
        searchTimeoutRef.current = null;
      }
      // Clear reply form refs
      currentReplyFormRefs.clear();
    };
  }, []);





  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="rounded-lg border border-black/20 p-6 animate-pulse">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/6"></div>
              </div>
            </div>
            <div className="h-5 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  if (discussions.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 mb-2">No discussions yet</h3>
        <p className="text-gray-500">Be the first to start a discussion by sharing your thoughts!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">Discussions</h2>
        <div className="flex items-center gap-3">
          {user && process.env.NODE_ENV === 'development' && (
            <button
              onClick={() => {
                console.log('🤖 Manual news bot trigger...');
                checkAndCreateNewsPost(discussions);
              }}
              className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors font-medium text-xs"
              title="Debug: Trigger news bot manually"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Test News Bot
            </button>
          )}
          {onStartDiscussion && (
            <button
              onClick={onStartDiscussion}
              className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-full hover:bg-black/80 transition-colors font-medium text-sm"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Start a Discussion
            </button>
          )}
        </div>
      </div>

      <SearchFilterSort
        key="search-filter-sort"
        discussions={discussions}
        onResults={setFilteredDiscussions}
        onSearchChange={handleSearchChange}
        onSearchTypeChange={setCurrentSearchType}
        onFilterChange={setCurrentFilters}
        onSortChange={setCurrentSort}
        initialSearchQuery={searchQuery}
        initialSearchType={currentSearchType}
        initialSortBy={currentSort}
        initialFilters={currentFilters}
      />

      {/* Conditional content based on results */}
      {filteredDiscussions.length === 0 && searchQuery.trim() ? (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 mb-2">No matching discussions found</h3>
          <p className="text-gray-500">Try adjusting your search terms or filters.</p>
        </div>
      ) : (
        filteredDiscussions.map((discussion) => (
          <DiscussionItem
            key={discussion.id}
            discussion={discussion}
            searchQuery={searchQuery}
            onDiscussionUpdate={handleDiscussionUpdate}
            onReplyAdded={handleReplyAdded}
            expandedDiscussions={expandedDiscussions}
            setExpandedDiscussions={setExpandedDiscussions}
            expandedReplies={expandedReplies}
            setExpandedReplies={setExpandedReplies}
            expandedAIPoints={expandedAIPoints}
            setExpandedAIPoints={setExpandedAIPoints}
            collectedPoints={collectedPoints}
            pointCounts={pointCounts}
            refreshPointsData={refreshPointsData}
            showCompactView={false}
          />
        ))
      )}

    </div>
  );
}
