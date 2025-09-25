'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * usePolling
 * Repeatedly invokes the provided async function at a fixed interval.
 * - Pauses when the document is hidden (configurable)
 * - Ensures only one run at a time; overlaps are skipped
 * - Cleans up timers and listeners on unmount
 */
export function usePolling(task, intervalMs, options = {}) {
  const { enabled = true, immediate = false, pauseOnHidden = true } = options;

  const timerRef = useRef(null);
  const isRunningRef = useRef(false);
  const taskRef = useRef(task);
  const [isActive, setIsActive] = useState(false);
  const [lastRunAt, setLastRunAt] = useState(null);

  // Update task ref when task changes
  useEffect(() => {
    taskRef.current = task;
  }, [task]);

  const runOnce = useCallback(async () => {
    if (isRunningRef.current) return; // Skip overlapping runs
    isRunningRef.current = true;
    try {
      await taskRef.current?.();
      setLastRunAt(Date.now());
    } finally {
      isRunningRef.current = false;
    }
  }, []);

  const shouldPause = useCallback(() => {
    return pauseOnHidden && typeof document !== 'undefined' && document.hidden;
  }, [pauseOnHidden]);

  const stop = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsActive(false);
  }, []);

  const start = useCallback(() => {
    // Clear any existing timer first
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    setIsActive(true);
    if (immediate && !shouldPause()) {
      void runOnce();
    }
    timerRef.current = setInterval(() => {
      if (shouldPause()) return;
      void runOnce();
    }, Math.max(250, Number(intervalMs) || 0));
  }, [immediate, intervalMs, runOnce, shouldPause]);

  // Main effect to control polling based on enabled state
  useEffect(() => {
    if (enabled) {
      // Clear any existing timer first
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      
      setIsActive(true);
      if (immediate && !(pauseOnHidden && typeof document !== 'undefined' && document.hidden)) {
        void runOnce();
      }
      timerRef.current = setInterval(() => {
        if (pauseOnHidden && typeof document !== 'undefined' && document.hidden) return;
        void runOnce();
      }, Math.max(250, Number(intervalMs) || 0));
      
      // Cleanup function
      return () => {
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        setIsActive(false);
      };
    } else {
      // Stop polling when disabled
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setIsActive(false);
    }
  }, [enabled, immediate, intervalMs, pauseOnHidden]);

  // Visibility handling to resume immediately when tab becomes visible
  useEffect(() => {
    if (!pauseOnHidden) return;
    const onVisibility = () => {
      if (!timerRef.current) return;
      if (!document.hidden) {
        void runOnce();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [pauseOnHidden]); // Remove runOnce from deps - it's stable

  return { start, stop, isRunning: isRunningRef.current, isActive, lastRunAt };
}

export default usePolling;

