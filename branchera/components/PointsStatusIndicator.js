'use client';

import { useState, useEffect } from 'react';

export default function PointsStatusIndicator({ 
  pointsEarned = 0, 
  qualityScore = null, 
  isCollected = false, 
  showAnimation = false,
  size = 'medium', // 'small', 'medium', 'large'
  variant = 'badge' // 'badge', 'inline', 'floating'
}) {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (showAnimation && pointsEarned > 0) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [showAnimation, pointsEarned]);

  if (!isCollected && pointsEarned <= 0) return null;

  const getSizeClasses = () => {
    switch (size) {
      case 'small':
        return 'text-xs px-2 py-0.5';
      case 'large':
        return 'text-sm px-3 py-1.5';
      case 'medium':
      default:
        return 'text-xs px-2 py-1';
    }
  };

  const getQualityColor = () => {
    switch (qualityScore) {
      case 'excellent':
        return 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white';
      case 'good':
        return 'bg-gradient-to-r from-blue-400 to-purple-500 text-white';
      case 'fair':
        return 'bg-gradient-to-r from-green-400 to-blue-500 text-white';
      case 'basic':
        return 'bg-gradient-to-r from-gray-400 to-gray-600 text-white';
      default:
        return 'bg-purple-100 text-purple-800 border border-purple-200';
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
        return '⭐';
    }
  };

  const baseClasses = `
    inline-flex items-center gap-1 rounded-full font-medium
    ${getSizeClasses()}
    ${getQualityColor()}
    ${isAnimating ? 'animate-bounce' : ''}
  `;

  const content = (
    <>
      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
      </svg>
      <span>+{pointsEarned}</span>
      {qualityScore && size !== 'small' && (
        <span>{getQualityEmoji()}</span>
      )}
    </>
  );

  switch (variant) {
    case 'inline':
      return <span className={baseClasses}>{content}</span>;
    case 'floating':
      return (
        <div className="fixed top-4 left-4 z-40 pointer-events-none">
          <div className={`${baseClasses} shadow-lg`}>
            {content}
          </div>
        </div>
      );
    case 'badge':
    default:
      return <div className={baseClasses}>{content}</div>;
  }
}