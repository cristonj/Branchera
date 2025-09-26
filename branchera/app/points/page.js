'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useDatabase } from '@/hooks/useDatabase';
import Link from 'next/link';
import TopNav from '@/components/TopNav';

export default function PointsPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [leaderboard, setLeaderboard] = useState([]);
  const [userRank, setUserRank] = useState(null);
  const [userStats, setUserStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const { getLeaderboard, getUserPoints } = useDatabase();

  const loadLeaderboard = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const leaderboardData = await getLeaderboard();
      setLeaderboard(leaderboardData);

      // Find current user's rank and stats
      const userIndex = leaderboardData.findIndex(entry => entry.userId === user.uid);
      if (userIndex !== -1) {
        setUserRank(userIndex + 1);
        setUserStats(leaderboardData[userIndex]);
      } else {
        // User not in leaderboard yet, get their points
        const userPoints = await getUserPoints(user.uid);
        const totalPoints = userPoints.reduce((sum, point) => sum + (point.pointsEarned || 1), 0);
        setUserStats({
          userId: user.uid,
          userName: user.displayName || 'You',
          totalPoints: totalPoints,
          pointCount: userPoints.length
        });
        setUserRank(null); // Not ranked yet
      }
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Remove dependencies to prevent constant refreshes

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    
    // Load leaderboard only once when component mounts and user is available
    loadLeaderboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid]); // Only depend on user ID to prevent constant refreshes

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
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


  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Navigation Bar */}
      <TopNav />

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Leaderboard</h1>
          <p className="text-gray-600">Top contributors in our community</p>
        </div>

        {/* User Stats Card */}
        {userStats && (
          <div className="rounded-lg border border-black/20 p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Your Performance</h2>
              {userRank && userRank <= 10 && (
                <span className="text-sm text-gray-600">Top 10 contributor</span>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{userStats.totalPoints}</div>
                <div className="text-xs text-gray-600">Total Points</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{userStats.pointCount}</div>
                <div className="text-xs text-gray-600">Claims Addressed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {userRank ? `#${userRank}` : 'Unranked'}
                </div>
                <div className="text-xs text-gray-600">Global Rank</div>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="space-y-3">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="rounded-lg border border-black/20 p-6 animate-pulse">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                    <div className="h-4 bg-gray-200 rounded w-32"></div>
                  </div>
                  <div className="h-6 bg-gray-200 rounded w-16"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {/* Leaderboard Entries */}
            {leaderboard.length === 0 ? (
              <div className="rounded-lg border border-black/20 p-12 text-center">
                <h3 className="text-xl font-bold text-gray-900 mb-3">No points collected yet</h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  Be the first to start collecting discussion points and claim your spot on the leaderboard.
                </p>
                <Link
                  href="/feed"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white rounded-full hover:bg-black/80 transition-colors text-sm"
                >
                  Start Collecting Points
                </Link>
              </div>
            ) : (
              <div className="rounded-lg border border-black/20 overflow-hidden">
                <div className="px-6 py-4 border-b border-black/20">
                  <h3 className="text-lg font-bold text-gray-900">Rankings</h3>
                </div>
                <div className="divide-y divide-black/10">
                  {leaderboard.map((entry, index) => (
                    <div
                      key={entry.userId}
                      className={`p-4 transition-colors ${
                        entry.userId === user?.uid 
                          ? 'bg-gray-50' 
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          {/* Rank Number */}
                          <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center text-sm font-bold">
                            {index + 1}
                          </div>
                          
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-gray-900 truncate">
                                {entry.userName}
                              </span>
                              {entry.userId === user?.uid && (
                                <span className="text-xs text-gray-600 font-medium">
                                  (You)
                                </span>
                              )}
                              {index < 3 && (
                                <span className="text-xs text-gray-600">
                                  Top 3
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <span className="flex-shrink-0">{entry.pointCount} claim{entry.pointCount !== 1 ? 's' : ''}</span>
                              <span className="truncate">Last active {formatDate(entry.lastEarned)}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className="text-xl font-bold text-gray-900">
                            {entry.totalPoints}
                          </div>
                          <div className="text-xs text-gray-500">
                            points
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Call to Action */}
        <div className="mt-8 rounded-lg border border-black/20 p-8 text-center">
          <h3 className="text-lg font-bold text-gray-900 mb-3">Ready to climb the ranks?</h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Join discussions, address claims, and earn points to boost your position.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/feed"
              className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white rounded-full hover:bg-black/80 transition-colors text-sm"
            >
              Browse Discussions
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-4 py-2 border border-black/20 text-gray-700 rounded-full hover:bg-gray-50 transition-colors text-sm"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}