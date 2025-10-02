'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useDatabase } from '@/hooks/useDatabase';
import { useAuth } from '@/contexts/AuthContext';
import DiscussionItem from './DiscussionItem';
import SearchFilterSort from './SearchFilterSort';
import { usePolling } from '@/hooks/usePolling';
import { REALTIME_CONFIG } from '@/lib/realtimeConfig';
import { useToast } from '@/contexts/ToastContext';

export default function DiscussionFeed({ newDiscussion, onStartDiscussion }) {
  const [discussions, setDiscussions] = useState([]);
  const [filteredDiscussions, setFilteredDiscussions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [lastDoc, setLastDoc] = useState(null);
  const [expandedReplies, setExpandedReplies] = useState({}); // Track which discussions have expanded replies as object
  const [expandedDiscussions, setExpandedDiscussions] = useState({}); // Track expanded discussion cards as object
  const [searchQuery, setSearchQuery] = useState('');
  const [currentSort, setCurrentSort] = useState('newest');
  const searchTimeoutRef = useRef(null);
  const observerRef = useRef(null);
  const loadingTriggerRef = useRef(null);
  const loadMoreRef = useRef(null);
  
  const { getDiscussions, deleteDiscussion, deleteReply, editDiscussion, incrementDiscussionView, createDiscussion, updateDocument } = useDatabase();
  const { user } = useAuth();

  
  // Safely get toast functions with fallbacks
  const toastContext = useToast();
  const showSuccessToast = toastContext?.showSuccessToast || (() => {});
  const showErrorToast = toastContext?.showErrorToast || (() => {});


  const loadDiscussions = useCallback(async (isLoadingMore = false) => {
    try {
      if (!isLoadingMore) {
        setLoading(true);
        setLastDoc(null);
        setHasMore(true);
      } else {
        setLoadingMore(true);
      }
      
      // Load discussions directly without setup
      const discussionsData = await getDiscussions({
        limit: 15, // Optimized limit for better performance
        orderField: 'createdAt',
        orderDirection: 'desc',
        lastDoc: isLoadingMore ? lastDoc : null
      });
      
      if (!isLoadingMore) {
        setDiscussions(discussionsData);
      } else {
        // Append new discussions to existing ones
        setDiscussions(prev => [...prev, ...discussionsData]);
      }
      
      // Update pagination state
      if (discussionsData.length > 0) {
        setLastDoc(discussionsData[discussionsData.length - 1]);
        setHasMore(discussionsData.length === 15); // If we got fewer than requested, we've reached the end
      } else {
        setHasMore(false);
      }
      
      
      // Check if we should create an auto-news post (non-blocking, after page loads)
      
    } catch (error) {
      // Check if this is an index-related error that should be shown to the user
      if (error.message?.includes('Firebase index required')) {
        showErrorToast(error.message);
        // Still set empty array to prevent crashes, but show the error
        if (!isLoadingMore) {
          setDiscussions([]);
          setHasMore(false);
        }
      } else {
        // For other errors, handle silently to prevent crashes
        console.error('Error loading discussions:', error);
        if (!isLoadingMore) {
          setDiscussions([]);
          setHasMore(false);
        }
      }
    } finally {
      if (!isLoadingMore) {
        setLoading(false);
      } else {
        setLoadingMore(false);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Remove dependencies to prevent refresh loops

  // Separate function for loading more discussions (for infinite scroll)
  const loadMoreDiscussions = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    
    try {
      setLoadingMore(true);
      
      const discussionsData = await getDiscussions({
        limit: 15,
        orderField: 'createdAt',
        orderDirection: 'desc',
        lastDoc: lastDoc
      });
      
      // Append new discussions to existing ones
      setDiscussions(prev => [...prev, ...discussionsData]);
      
      // Update pagination state
      if (discussionsData.length > 0) {
        setLastDoc(discussionsData[discussionsData.length - 1]);
        setHasMore(discussionsData.length === 15);
      } else {
        setHasMore(false);
      }
      
      
    } catch (error) {
      // Check if this is an index-related error that should be shown to the user
      if (error.message?.includes('Firebase index required')) {
        showErrorToast(error.message);
      } else {
        // For other errors, log but don't show to user to avoid spam
        console.error('Error loading more discussions:', error);
      }
    } finally {
      setLoadingMore(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update the ref whenever the function changes
  useEffect(() => {
    loadMoreRef.current = loadMoreDiscussions;
  }, [loadMoreDiscussions]);

  // Check if we should create a news post and create one if needed (non-blocking)


  useEffect(() => {
    loadDiscussions();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  // Set up intersection observer for infinite scrolling
  useEffect(() => {
    const currentTriggerRef = loadingTriggerRef.current;
    
    if (!currentTriggerRef || !hasMore || loadingMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const target = entries[0];
        if (target.isIntersecting && loadMoreRef.current) {
          // Use requestIdleCallback for better performance
          if ('requestIdleCallback' in window) {
            requestIdleCallback(() => loadMoreRef.current());
          } else {
            setTimeout(() => loadMoreRef.current(), 0);
          }
        }
      },
      {
        root: null,
        rootMargin: '200px', // Start loading earlier for better UX
        threshold: 0.1,
      }
    );

    observer.observe(currentTriggerRef);
    observerRef.current = observer;

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMore, loadingMore]);


  // Silent refresh without showing loading skeleton to avoid flicker during polling
  const refreshDiscussions = useCallback(async () => {
    
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
    }
  }, [getDiscussions]);

  // Poll for near-realtime updates
  usePolling(
    refreshDiscussions,
    REALTIME_CONFIG.pollingIntervalMs,
    { enabled: true, immediate: false, pauseOnHidden: REALTIME_CONFIG.pauseOnHidden }
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
    }
  }, [newDiscussion]);


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
  setExpandedReplies(prev => ({ ...prev, [discussionId]: true }));
  }, []);


  // Initialize filtered discussions when discussions change, but preserve search results
  useEffect(() => {
    // Only reset to show all discussions if there's no active search
    if (!searchQuery.trim()) {
      setFilteredDiscussions(discussions);
    }
    // If there is an active search, let the SearchFilterSort component handle the filtering
  }, [discussions, searchQuery]);

  // Handle search query changes
  const handleSearchChange = useCallback((query) => {
    // Prevent duplicate calls with the same query
    if (query === searchQuery) {
      return;
    }

    setSearchQuery(query);
  }, [searchQuery]);

  // Clean up timeout on unmount
  useEffect(() => {
    const currentSearchTimeout = searchTimeoutRef.current;

    return () => {
      if (currentSearchTimeout) {
        clearTimeout(currentSearchTimeout);
        searchTimeoutRef.current = null;
      }
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
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-gray-900">Discussions</h2>
        </div>
      </div>

      <SearchFilterSort
        key="search-filter-sort"
        discussions={discussions}
        onResults={setFilteredDiscussions}
        onSearchChange={setSearchQuery}
        onSortChange={setCurrentSort}
        initialSearchQuery={searchQuery}
        initialSortBy={currentSort}
      />

      {/* Conditional content based on results */}
      {filteredDiscussions.length === 0 && searchQuery.trim() ? (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 mb-2">No matching discussions found</h3>
          <p className="text-gray-500">Try adjusting your search terms or filters.</p>
        </div>
      ) : (
        <>
          {filteredDiscussions.map((discussion) => (
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
              showCompactView={false}
            />
          ))}

          {/* Infinite scroll loading trigger and indicator */}
          {hasMore && (
            <div ref={loadingTriggerRef} className="py-8">
              {loadingMore ? (
                <div className="flex items-center justify-center">
                  <div className="flex items-center gap-3">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-black"></div>
                    <span className="text-gray-600">Loading more discussions...</span>
                  </div>
                </div>
              ) : (
                // Invisible trigger element
                <div className="h-4"></div>
              )}
            </div>
          )}

          {!hasMore && discussions.length > 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">You&apos;ve reached the end of the discussions</p>
            </div>
          )}
        </>
      )}

    </div>
  );
}
