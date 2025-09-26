'use client';

import { useState, useEffect } from 'react';

export default function ToastNotification({ 
  message, 
  type = 'success', 
  duration = 4000, 
  onClose,
  points = null,
  qualityScore = null,
  isVisible = false 
}) {
  const [show, setShow] = useState(false);
  const [stage, setStage] = useState('entering'); // 'entering', 'visible', 'exiting'

  useEffect(() => {
    if (isVisible) {
      setShow(true);
      setStage('entering');
      
      // Animation sequence
      const enterTimer = setTimeout(() => setStage('visible'), 100);
      const exitTimer = setTimeout(() => {
        setStage('exiting');
        setTimeout(() => {
          setShow(false);
          onClose?.();
        }, 300);
      }, duration);

      return () => {
        clearTimeout(enterTimer);
        clearTimeout(exitTimer);
      };
    }
  }, [isVisible, duration, onClose]);

  if (!show) return null;

  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'points':
        return 'bg-purple-50 border-purple-200 text-purple-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return (
          <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      case 'error':
        return (
          <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
      case 'warning':
        return (
          <svg className="w-5 h-5 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        );
      case 'info':
        return (
          <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'points':
        return (
          <div className="flex items-center gap-1">
            <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
            {points && <span className="text-sm font-bold">+{points}</span>}
          </div>
        );
      default:
        return null;
    }
  };

  const getAnimationClass = () => {
    switch (stage) {
      case 'entering':
        return 'translate-y-2 opacity-0 scale-95';
      case 'visible':
        return 'translate-y-0 opacity-100 scale-100';
      case 'exiting':
        return 'translate-y-2 opacity-0 scale-95';
      default:
        return 'translate-y-2 opacity-0 scale-95';
    }
  };

  const getQualityEmoji = () => {
    switch (qualityScore) {
      case 'excellent':
        return '🏆';
      case 'good':
        return '👍';
      case 'fair':
        return '👌';
      case 'basic':
        return '✓';
      default:
        return '';
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 pointer-events-none">
      <div className={`
        max-w-sm w-full bg-white border-2 rounded-lg shadow-lg pointer-events-auto
        transform transition-all duration-300 ease-out
        ${getTypeStyles()}
        ${getAnimationClass()}
      `}>
        <div className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              {getIcon()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">
                  {message}
                  {qualityScore && (
                    <span className="ml-2">
                      {getQualityEmoji()}
                    </span>
                  )}
                </p>
                <button
                  onClick={() => {
                    setStage('exiting');
                    setTimeout(() => {
                      setShow(false);
                      onClose?.();
                    }, 300);
                  }}
                  className="ml-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {/* Additional details for points notifications */}
              {type === 'points' && (points || qualityScore) && (
                <div className="mt-2 text-xs opacity-75">
                  {points && qualityScore && (
                    <span>
                      Quality: {qualityScore.charAt(0).toUpperCase() + qualityScore.slice(1)} • 
                      Points earned: {points}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Progress bar for duration */}
        <div className="h-1 bg-black/10 rounded-b-lg overflow-hidden">
          <div 
            className="h-full bg-current opacity-30 transition-all ease-linear"
            style={{
              width: stage === 'visible' ? '0%' : '100%',
              transitionDuration: stage === 'visible' ? `${duration}ms` : '0ms'
            }}
          />
        </div>
      </div>
    </div>
  );
}