'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useDatabase } from '@/hooks/useDatabase';
import Link from 'next/link';

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
    <div className="min-h-screen bg-white">
      {/* Navigation Bar */}
      <nav className="border-b border-black/20">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <Link href="/dashboard" className="text-xl font-bold text-gray-900 hover:text-gray-600 transition-colors">
              Branchera
            </Link>
            
            <div className="flex items-center gap-4">
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
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-black mb-2">Leaderboard</h1>
          <p className="text-gray-600">Top point collectors in the community</p>
        </div>

        {/* User Stats Card */}
        {userStats && (
          <div className="mb-8 p-6 border-2 border-black bg-gray-50">
            <h2 className="text-lg font-bold text-black mb-2">Your Stats</h2>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-black">{userStats.totalPoints}</div>
                <div className="text-sm text-gray-600">Points Collected</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-black">{userStats.pointCount}</div>
                <div className="text-sm text-gray-600">Total Points</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-black">
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
          <div className="space-y-0 border border-black">
            {/* Header */}
            <div className="bg-black text-white p-4 font-bold">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-8 text-center">Rank</div>
                  <div>User</div>
                </div>
                <div className="flex items-center gap-8">
                  <div>Points</div>
                  <div>Last Active</div>
                </div>
              </div>
            </div>

            {/* Leaderboard Entries */}
            {leaderboard.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <div className="text-4xl mb-4">🎯</div>
                <h3 className="text-lg font-medium text-black mb-2">No points collected yet</h3>
                <p className="text-gray-600 mb-4">
                  Be the first to start collecting discussion points!
                </p>
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-full hover:bg-purple-700 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Start Collecting Points
                </Link>
              </div>
            ) : (
              leaderboard.map((entry, index) => (
                <div
                  key={entry.userId}
                  className={`p-4 border-b border-black/20 last:border-b-0 ${
                    entry.userId === user?.uid ? 'bg-yellow-50' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-8 text-center font-bold text-black">
                        {getRankIcon(index + 1) || `#${index + 1}`}
                      </div>
                      <div>
                        <div className="font-medium text-black">
                          {entry.userName}
                          {entry.userId === user?.uid && (
                            <span className="ml-2 text-xs bg-black text-white px-2 py-0.5 rounded">YOU</span>
                          )}
                        </div>
                        <div className="text-sm text-gray-600">
                          {entry.pointCount} point{entry.pointCount !== 1 ? 's' : ''} collected
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-8 text-right">
                      <div>
                        <div className="font-bold text-black text-lg">{entry.totalPoints}</div>
                        <div className="text-xs text-gray-600">points</div>
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