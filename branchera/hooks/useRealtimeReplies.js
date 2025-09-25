'use client';

import { useState, useEffect, useCallback } from 'react';
import { useFirestore } from './useFirestore';

export function useRealtimeReplies(discussionId) {
  const [replies, setReplies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const { subscribeToCollection, where, orderBy } = useFirestore();

  // Subscribe to real-time replies updates for a specific discussion
  const subscribeToReplies = useCallback(() => {
    if (!discussionId) {
      setReplies([]);
      setLoading(false);
      return null;
    }

    console.log('Setting up real-time replies subscription for discussion:', discussionId);
    
    try {
      const unsubscribe = subscribeToCollection(
        'replies',
        [
          where('discussionId', '==', discussionId),
          orderBy('createdAt', 'asc')
        ],
        (updatedReplies) => {
          console.log('Real-time replies update received:', updatedReplies.length, 'replies for discussion', discussionId);
          
          // Sort replies by creation date (oldest first for proper threading)
          const sortedReplies = updatedReplies.sort((a, b) => 
            new Date(a.createdAt) - new Date(b.createdAt)
          );
          
          setReplies(sortedReplies);
          setLoading(false);
          setError(null);
        }
      );
      
      return unsubscribe;
    } catch (err) {
      console.error('Error setting up real-time replies subscription:', err);
      setError(err);
      setLoading(false);
      return null;
    }
  }, [discussionId, subscribeToCollection, where, orderBy]);

  useEffect(() => {
    let unsubscribe = null;
    
    // Set up real-time subscription
    unsubscribe = subscribeToReplies();

    // Cleanup subscription on unmount or when discussionId changes
    return () => {
      if (unsubscribe && typeof unsubscribe === 'function') {
        console.log('Cleaning up replies subscription for discussion:', discussionId);
        unsubscribe();
      }
    };
  }, [subscribeToReplies]);

  // Method to update a reply locally (for optimistic updates)
  const updateReplyLocally = useCallback((replyId, updates) => {
    setReplies(prev =>
      prev.map(r =>
        r.id === replyId ? { ...r, ...updates } : r
      )
    );
  }, []);

  // Method to add a new reply locally (for optimistic updates)
  const addReplyLocally = useCallback((newReply) => {
    setReplies(prev => [...prev, newReply]);
  }, []);

  // Method to remove a reply locally (for optimistic updates)
  const removeReplyLocally = useCallback((replyId) => {
    setReplies(prev => prev.filter(r => r.id !== replyId));
  }, []);

  return {
    replies,
    loading,
    error,
    updateReplyLocally,
    addReplyLocally,
    removeReplyLocally
  };
}