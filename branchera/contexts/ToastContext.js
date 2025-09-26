'use client';

import { createContext, useContext, useState, useCallback } from 'react';
import ToastNotification from '@/components/ToastNotification';

// Create context with a default value to prevent initialization issues
const defaultContextValue = {
  showPointsToast: () => {},
  showSuccessToast: () => {},
  showErrorToast: () => {},
  showInfoToast: () => {},
  showWarningToast: () => {},
  addToast: () => {},
  removeToast: () => {}
};

const ToastContext = createContext(defaultContextValue);

function useToast() {
  const context = useContext(ToastContext);
  // With default context values, this should always work
  return context;
}

function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((toast) => {
    const id = Date.now() + Math.random();
    const newToast = {
      id,
      ...toast,
      isVisible: true
    };
    
    setToasts(prev => [...prev, newToast]);
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const showPointsToast = useCallback((points, qualityScore, explanation = '') => {
    const getQualityMessage = (score, points) => {
      switch (score) {
        case 'excellent':
          return `🏆 Excellent rebuttal! You earned ${points} point${points !== 1 ? 's' : ''}!`;
        case 'good':
          return `👍 Good rebuttal! You earned ${points} point${points !== 1 ? 's' : ''}!`;
        case 'fair':
          return `👌 Fair rebuttal! You earned ${points} point${points !== 1 ? 's' : ''}!`;
        case 'basic':
          return `✓ Nice try! You earned ${points} point${points !== 1 ? 's' : ''}!`;
        default:
          return `🎯 Great work! You earned ${points} point${points !== 1 ? 's' : ''}!`;
      }
    };

    const message = explanation || getQualityMessage(qualityScore, points);
    return addToast({
      type: 'points',
      message,
      points,
      qualityScore,
      duration: 6000 // Longer duration for points
    });
  }, [addToast]);

  const showSuccessToast = useCallback((message, duration = 4000) => {
    return addToast({
      type: 'success',
      message,
      duration
    });
  }, [addToast]);

  const showErrorToast = useCallback((message, duration = 5000) => {
    return addToast({
      type: 'error',
      message,
      duration
    });
  }, [addToast]);

  const showInfoToast = useCallback((message, duration = 4000) => {
    return addToast({
      type: 'info',
      message,
      duration
    });
  }, [addToast]);

  const showWarningToast = useCallback((message, duration = 4000) => {
    return addToast({
      type: 'warning',
      message,
      duration
    });
  }, [addToast]);

  const value = {
    showPointsToast,
    showSuccessToast,
    showErrorToast,
    showInfoToast,
    showWarningToast,
    addToast,
    removeToast
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      
      {/* Render all toasts */}
      <div className="fixed top-4 right-4 z-50 space-y-2 pointer-events-none">
        {toasts.map((toast, index) => (
          <div
            key={toast.id}
            style={{
              transform: `translateY(${index * 10}px)`,
              zIndex: 50 - index
            }}
          >
            <ToastNotification
              {...toast}
              onClose={() => removeToast(toast.id)}
            />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// Export at the end to avoid hoisting issues
export { useToast, ToastProvider };