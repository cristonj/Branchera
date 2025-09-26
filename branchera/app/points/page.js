'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useDatabase } from '@/hooks/useDatabase';
import Image from 'next/image';
import Link from 'next/link';

export default function PointsPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [userPoints, setUserPoints] = useState([]);
  const [totalPoints, setTotalPoints] = useState(0);
  const [loading, setLoading] = useState(true);
  const [achievements, setAchievements] = useState([]);
  const { getUserPoints } = useDatabase();

  const calculateAchievements = useCallback((points) => {
    const achievements = [];
    const totalEarned = points.reduce((sum, point) => sum + point.pointsEarned, 0);
    
    // Point-based achievements
    if (totalEarned >= 100) achievements.push({ name: 'Century Club', description: '100+ points earned', icon: '💯' });
    if (totalEarned >= 50) achievements.push({ name: 'Half Century', description: '50+ points earned', icon: '🎯' });
    if (totalEarned >= 25) achievements.push({ name: 'Quarter Master', description: '25+ points earned', icon: '⭐' });
    if (totalEarned >= 10) achievements.push({ name: 'Double Digits', description: '10+ points earned', icon: '🔟' });
    if (totalEarned >= 5) achievements.push({ name: 'High Five', description: '5+ points earned', icon: '✋' });
    if (totalEarned >= 1) achievements.push({ name: 'First Point', description: 'Earned your first point', icon: '🎉' });

    // Activity-based achievements
    const discussionCount = new Set(points.map(p => p.discussionId)).size;
    if (discussionCount >= 10) achievements.push({ name: 'Discussion Master', description: 'Engaged with 10+ discussions', icon: '🗣️' });
    if (discussionCount >= 5) achievements.push({ name: 'Active Participant', description: 'Engaged with 5+ discussions', icon: '💬' });

    // Quality-based achievements
    const perfectRebuttals = points.filter(p => p.qualityScore === 'excellent').length;
    if (perfectRebuttals >= 5) achievements.push({ name: 'Master Debater', description: '5+ excellent rebuttals', icon: '🏆' });
    if (perfectRebuttals >= 1) achievements.push({ name: 'Quality First', description: 'Made an excellent rebuttal', icon: '💎' });

    setAchievements(achievements);
  }, []);

  const loadUserPoints = useCallback(async () => {
    if (!user?.uid) return;
    try {
      setLoading(true);
      const points = await getUserPoints(user.uid);
      setUserPoints(points);
      setTotalPoints(points.reduce((sum, point) => sum + point.pointsEarned, 0));
      calculateAchievements(points);
    } catch (error) {
      console.error('Error loading user points:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.uid, getUserPoints, calculateAchievements]);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    loadUserPoints();
  }, [user, router, loadUserPoints]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now - date) / (1000 * 60));
      return diffInMinutes <= 1 ? 'Just now' : `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d ago`;
    }
  };

  const getQualityBadge = (qualityScore) => {
    switch (qualityScore) {
      case 'excellent':
        return { text: 'Excellent', color: 'bg-green-100 text-green-800', icon: '🏆' };
      case 'good':
        return { text: 'Good', color: 'bg-blue-100 text-blue-800', icon: '👍' };
      case 'fair':
        return { text: 'Fair', color: 'bg-yellow-100 text-yellow-800', icon: '👌' };
      default:
        return { text: 'Basic', color: 'bg-gray-100 text-gray-800', icon: '✓' };
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      {/* Navigation Bar */}
      <nav className="border-b border-black/20 bg-white/80 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="text-xl font-bold text-gray-900 hover:text-purple-600 transition-colors">
                Branchera
              </Link>
              <span className="text-purple-600 font-medium">Points Collection</span>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                {user.photoURL && (
                  <Image
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    width={32}
                    height={32}
                    className="w-8 h-8 rounded-full"
                  />
                )}
              </div>
              
              <button
                onClick={logout}
                className="px-3 py-1 text-sm bg-black text-white hover:bg-black/80 rounded-full"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Header with total points */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full mb-4 shadow-lg">
            <span className="text-3xl font-bold text-white">{totalPoints}</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Points Collection</h1>
          <p className="text-gray-600">
            Earned by providing factual and coherent rebuttals in discussions
          </p>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="rounded-lg border border-black/20 p-6 animate-pulse bg-white">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                  </div>
                </div>
                <div className="h-20 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-8">
            {/* Achievements Section */}
            {achievements.length > 0 && (
              <div className="bg-white rounded-lg border border-black/20 p-6 shadow-sm">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  🏅 Achievements
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {achievements.map((achievement, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg">
                      <span className="text-2xl">{achievement.icon}</span>
                      <div>
                        <div className="font-semibold text-gray-900">{achievement.name}</div>
                        <div className="text-sm text-gray-600">{achievement.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Points History */}
            <div className="bg-white rounded-lg border border-black/20 p-6 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                📊 Points History
              </h2>
              
              {userPoints.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🎯</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No points earned yet</h3>
                  <p className="text-gray-500 mb-4">
                    Start earning points by providing factual rebuttals to discussion points!
                  </p>
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-full hover:bg-purple-700 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    Join Discussions
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {userPoints.map((point) => {
                    const qualityBadge = getQualityBadge(point.qualityScore);
                    return (
                      <div key={point.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full text-white font-bold">
                              +{point.pointsEarned}
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900">{point.discussionTitle}</h3>
                              <p className="text-sm text-gray-600">{formatDate(point.earnedAt)}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${qualityBadge.color}`}>
                              <span>{qualityBadge.icon}</span>
                              {qualityBadge.text}
                            </span>
                          </div>
                        </div>
                        
                        <div className="bg-gray-50 rounded-lg p-3 mb-3">
                          <div className="text-sm text-gray-700 mb-2">
                            <strong>Point you challenged:</strong>
                          </div>
                          <div className="text-sm text-gray-900 italic">
                            &ldquo;{point.originalPoint}&rdquo;
                          </div>
                        </div>
                        
                        <div className="bg-blue-50 rounded-lg p-3 mb-3">
                          <div className="text-sm text-gray-700 mb-2">
                            <strong>Your rebuttal:</strong>
                          </div>
                          <div className="text-sm text-gray-900">
                            {point.rebuttal}
                          </div>
                        </div>
                        
                        {point.judgeExplanation && (
                          <div className="bg-green-50 rounded-lg p-3">
                            <div className="text-sm text-gray-700 mb-2">
                              <strong>AI Judge Feedback:</strong>
                            </div>
                            <div className="text-sm text-gray-900">
                              {point.judgeExplanation}
                            </div>
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200">
                          <Link
                            href={`/dashboard?discussion=${point.discussionId}`}
                            className="text-sm text-purple-600 hover:text-purple-800 font-medium"
                          >
                            View Discussion →
                          </Link>
                          <div className="text-xs text-gray-500">
                            Points: {point.pointsEarned} | Quality: {qualityBadge.text}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* How to Earn Points Guide */}
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                💡 How to Earn Points
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">🎯</span>
                    <div>
                      <div className="font-semibold text-gray-900">Find a Point to Challenge</div>
                      <div className="text-sm text-gray-600">Look for AI-extracted discussion points that you can provide factual rebuttals to</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">📝</span>
                    <div>
                      <div className="font-semibold text-gray-900">Write a Factual Rebuttal</div>
                      <div className="text-sm text-gray-600">Provide evidence-based, coherent responses that challenge or correct the point</div>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">🤖</span>
                    <div>
                      <div className="font-semibold text-gray-900">AI Judge Evaluation</div>
                      <div className="text-sm text-gray-600">Our AI evaluates your rebuttal for factual accuracy and coherence</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">🎉</span>
                    <div>
                      <div className="font-semibold text-gray-900">Earn Points</div>
                      <div className="text-sm text-gray-600">Get 1-5 points based on quality, with bonus visual feedback!</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}