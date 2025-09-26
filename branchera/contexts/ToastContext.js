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
  showNoPointsToast: () => {},
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
          return `🏆 You earned ${points} point${points !== 1 ? 's' : ''}!`;
        case 'good':
          return `👍 You earned ${points} point${points !== 1 ? 's' : ''}!`;
        case 'fair':
          return `👌 You earned ${points} point${points !== 1 ? 's' : ''}!`;
        case 'basic':
          return `✓ You earned ${points} point${points !== 1 ? 's' : ''}!`;
        default:
          return `🎯 You earned ${points} point${points !== 1 ? 's' : ''}!`;
      }
    };

    // Always use simple message, ignore explanation
    const message = getQualityMessage(qualityScore, points);
    return addToast({
      type: 'points',
      message,
      points,
      qualityScore,
      duration: 4000 // Shorter duration since message is simpler
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

  const showNoPointsToast = useCallback(() => {
    return addToast({
      type: 'info',
      message: '💭 No points this time - try providing more evidence or sources!',
      duration: 4000
    });
  }, [addToast]);

  const value = {
    showPointsToast,
    showSuccessToast,
    showErrorToast,
    showInfoToast,
    showWarningToast,
    showNoPointsToast,
    addToast,
    removeToast
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      
      {/* Render all toasts */}
      <div className="fixed top-4 left-1/2 transform -translate-x-1/2 sm:left-auto sm:right-4 sm:transform-none z-50 space-y-2 pointer-events-none">
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