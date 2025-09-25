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

  const shouldPause = () => pauseOnHidden && typeof document !== 'undefined' && document.hidden;

  const start = useCallback(() => {
    if (!enabled || isActive) return;
    setIsActive(true);
    if (immediate && !shouldPause()) {
      void runOnce();
    }
    timerRef.current = setInterval(() => {
      if (shouldPause()) return;
      void runOnce();
    }, Math.max(250, Number(intervalMs) || 0));
  }, [enabled, immediate, intervalMs, runOnce, isActive]);

  const stop = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsActive(false);
  }, []);

  useEffect(() => {
    if (!enabled) {
      stop();
      return;
    }
    start();
    return stop;
  }, [enabled, start, stop]);

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
  }, [pauseOnHidden, runOnce]);

  return { start, stop, isRunning: isRunningRef.current, isActive, lastRunAt };
}

export default usePolling;

