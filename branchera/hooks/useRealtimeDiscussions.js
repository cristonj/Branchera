'use client';

import { useState, useEffect, useCallback } from 'react';
import { useFirestore } from './useFirestore';
import { useDatabase } from './useDatabase';

export function useRealtimeDiscussions() {
  const [discussions, setDiscussions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const { subscribeToCollection, orderBy, limit } = useFirestore();
  const { getDiscussions } = useDatabase();

  // Subscribe to real-time discussions updates
  const subscribeToDiscussions = useCallback(() => {
    console.log('Setting up real-time discussions subscription...');
    
    try {
      const unsubscribe = subscribeToCollection(
        'discussions',
        [
          orderBy('createdAt', 'desc'),
          limit(20)
        ],
        (updatedDiscussions) => {
          console.log('Real-time update received:', updatedDiscussions.length, 'discussions');
          
          // Sort discussions by creation date (newest first)
          const sortedDiscussions = updatedDiscussions.sort((a, b) => 
            new Date(b.createdAt) - new Date(a.createdAt)
          );
          
          setDiscussions(sortedDiscussions);
          setLoading(false);
          setError(null);
        }
      );
      
      return unsubscribe;
    } catch (err) {
      console.error('Error setting up real-time subscription:', err);
      setError(err);
      setLoading(false);
      
      // Fallback to manual loading if real-time fails
      return null;
    }
  }, [subscribeToCollection, orderBy, limit]);

  // Fallback to manual loading if real-time subscription fails
  const loadDiscussionsManually = useCallback(async () => {
    try {
      setLoading(true);
      console.log('Loading discussions manually as fallback...');
      
      const discussionsData = await getDiscussions({
        limit: 20,
        orderField: 'createdAt',
        orderDirection: 'desc'
      });
      
      console.log('Manually loaded discussions:', discussionsData);
      setDiscussions(discussionsData);
      setError(null);
    } catch (err) {
      console.error('Error loading discussions manually:', err);
      setError(err);
      setDiscussions([]);
    } finally {
      setLoading(false);
    }
  }, [getDiscussions]);

  useEffect(() => {
    let unsubscribe = null;
    
    // Try to set up real-time subscription
    unsubscribe = subscribeToDiscussions();
    
    // If real-time subscription failed, fall back to manual loading
    if (!unsubscribe) {
      loadDiscussionsManually();
    }

    // Cleanup subscription on unmount
    return () => {
      if (unsubscribe && typeof unsubscribe === 'function') {
        console.log('Cleaning up discussions subscription');
        unsubscribe();
      }
    };
  }, [subscribeToDiscussions, loadDiscussionsManually]);

  // Method to update a discussion locally (for optimistic updates)
  const updateDiscussionLocally = useCallback((discussionId, updates) => {
    setDiscussions(prev =>
      prev.map(d =>
        d.id === discussionId ? { ...d, ...updates } : d
      )
    );
  }, []);

  // Method to add a new discussion locally (for optimistic updates)
  const addDiscussionLocally = useCallback((newDiscussion) => {
    setDiscussions(prev => [newDiscussion, ...prev]);
  }, []);

  // Method to remove a discussion locally (for optimistic updates)
  const removeDiscussionLocally = useCallback((discussionId) => {
    setDiscussions(prev => prev.filter(d => d.id !== discussionId));
  }, []);

  return {
    discussions,
    loading,
    error,
    updateDiscussionLocally,
    addDiscussionLocally,
    removeDiscussionLocally,
    refresh: loadDiscussionsManually
  };
}