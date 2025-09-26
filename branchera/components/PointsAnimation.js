'use client';

import { useState, useEffect } from 'react';

export default function PointsAnimation({ points, qualityScore, onComplete }) {
  const [isVisible, setIsVisible] = useState(false);
  const [stage, setStage] = useState('appearing'); // 'appearing', 'celebrating', 'disappearing'

  useEffect(() => {
    if (points > 0) {
      setIsVisible(true);
      setStage('appearing');

      // Animation sequence - shorter duration since we also have toast notifications
      const timer1 = setTimeout(() => setStage('celebrating'), 100);
      const timer2 = setTimeout(() => setStage('disappearing'), 1500);
      const timer3 = setTimeout(() => {
        setIsVisible(false);
        onComplete?.();
      }, 2000);

      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
        clearTimeout(timer3);
      };
    }
  }, [points, onComplete]);

  if (!isVisible || points <= 0) return null;

  const getAnimationClass = () => {
    switch (stage) {
      case 'appearing':
        return 'animate-bounce scale-0 opacity-0';
      case 'celebrating':
        return 'animate-pulse scale-100 opacity-100';
      case 'disappearing':
        return 'scale-75 opacity-0';
      default:
        return 'scale-0 opacity-0';
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
        return '🎯';
    }
  };

  const getQualityColor = () => {
    switch (qualityScore) {
      case 'excellent':
        return 'from-yellow-400 to-orange-500';
      case 'good':
        return 'from-blue-400 to-purple-500';
      case 'fair':
        return 'from-green-400 to-blue-500';
      case 'basic':
        return 'from-gray-400 to-gray-600';
      default:
        return 'from-purple-400 to-pink-500';
    }
  };

  const getQualityText = () => {
    switch (qualityScore) {
      case 'excellent':
        return 'Excellent Rebuttal!';
      case 'good':
        return 'Good Rebuttal!';
      case 'fair':
        return 'Fair Rebuttal!';
      case 'basic':
        return 'Nice Try!';
      default:
        return 'Points Earned!';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      {/* Background overlay */}
      <div className={`absolute inset-0 bg-black/20 transition-opacity duration-300 ${
        stage === 'celebrating' ? 'opacity-100' : 'opacity-0'
      }`} />
      
      {/* Main animation container */}
      <div className={`
        relative transform transition-all duration-500 ease-out
        ${getAnimationClass()}
      `}>
        {/* Celebration effects */}
        {stage === 'celebrating' && (
          <>
            {/* Confetti particles */}
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                className={`absolute w-2 h-2 rounded-full animate-ping`}
                style={{
                  background: `hsl(${i * 30}, 70%, 60%)`,
                  top: `${-20 + Math.sin(i * 0.5) * 30}px`,
                  left: `${-20 + Math.cos(i * 0.5) * 30}px`,
                  animationDelay: `${i * 0.1}s`,
                  animationDuration: '1s'
                }}
              />
            ))}
            
            {/* Sparkle effects */}
            {[...Array(8)].map((_, i) => (
              <div
                key={`sparkle-${i}`}
                className="absolute text-yellow-400 animate-pulse"
                style={{
                  top: `${-40 + Math.sin(i * 0.8) * 40}px`,
                  left: `${-40 + Math.cos(i * 0.8) * 40}px`,
                  animationDelay: `${i * 0.2}s`,
                  fontSize: '12px'
                }}
              >
                ✨
              </div>
            ))}
          </>
        )}
        
        {/* Main points display */}
        <div className={`
          relative bg-gradient-to-r ${getQualityColor()} 
          rounded-full p-8 shadow-2xl border-4 border-white
          flex flex-col items-center justify-center min-w-[200px]
        `}>
          {/* Points number */}
          <div className="text-6xl font-bold text-white mb-2 drop-shadow-lg">
            +{points}
          </div>
          
          {/* Quality indicator */}
          <div className="flex items-center gap-2 mb-2">
            <span className="text-3xl">{getQualityEmoji()}</span>
          </div>
          
          {/* Quality text */}
          <div className="text-white font-bold text-lg text-center drop-shadow-md">
            {getQualityText()}
          </div>
          
          {/* Floating text */}
          {stage === 'celebrating' && (
            <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 animate-bounce">
              <div className="bg-white rounded-full px-4 py-2 shadow-lg">
                <span className="text-gray-900 font-bold text-sm">
                  Point Scored! 🎯
                </span>
              </div>
            </div>
          )}
        </div>
        
        {/* Ripple effect */}
        {stage === 'celebrating' && (
          <div className="absolute inset-0 rounded-full border-4 border-white animate-ping opacity-75" />
        )}
      </div>
    </div>
  );
}