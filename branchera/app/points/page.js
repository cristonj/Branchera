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

  const getRankIcon = (rank) => {
    switch(rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return null;
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
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Leaderboard</h2>
        </div>

        {/* User Stats Card */}
        {userStats && (
          <div className="mb-6 p-4 border border-black/20 rounded-lg bg-white">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Your Stats</h3>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-900">{userStats.totalPoints}</div>
                <div className="text-sm text-gray-600">Total Points</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{userStats.pointCount}</div>
                <div className="text-sm text-gray-600">Claims Addressed</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {userRank ? `#${userRank}` : 'Unranked'}
                </div>
                <div className="text-sm text-gray-600">Rank</div>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="space-y-4">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="border border-black/20 p-4 animate-pulse">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded w-32"></div>
                  </div>
                  <div className="h-6 bg-gray-200 rounded w-16"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Leaderboard Entries */}
            {leaderboard.length === 0 ? (
              <div className="p-8 text-center border border-black/20 rounded-lg bg-white">
                <div className="text-4xl mb-4">🎯</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No points collected yet</h3>
                <p className="text-gray-600 mb-4">
                  Be the first to start collecting discussion points!
                </p>
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white rounded-full hover:bg-black/80 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  Start Collecting Points
                </Link>
              </div>
            ) : (
              leaderboard.map((entry, index) => (
                <div
                  key={entry.userId}
                  className={`p-4 border border-black/20 rounded-lg bg-white transition-colors ${
                    entry.userId === user?.uid ? 'ring-2 ring-purple-200 bg-purple-50' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-8 text-center font-bold text-gray-900 text-lg">
                        {getRankIcon(index + 1) || `#${index + 1}`}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">
                          {entry.userName}
                          {entry.userId === user?.uid && (
                            <span className="ml-2 text-xs bg-purple-600 text-white px-2 py-0.5 rounded-full">YOU</span>
                          )}
                        </div>
                        <div className="text-sm text-gray-600">
                          {entry.pointCount} claim{entry.pointCount !== 1 ? 's' : ''} addressed
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-6 text-right">
                      <div>
                        <div className="font-bold text-gray-900 text-xl">{entry.totalPoints}</div>
                        <div className="text-xs text-gray-600">total points</div>
                      </div>
                      <div className="text-sm text-gray-600 min-w-[80px]">
                        {formatDate(entry.lastEarned)}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Call to Action */}
        <div className="mt-8 text-center">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white rounded-full hover:bg-black/80 transition-colors font-medium"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            Back to Discussions
          </Link>
        </div>
      </main>
    </div>
  );
}