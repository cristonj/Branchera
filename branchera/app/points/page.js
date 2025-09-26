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
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Bar */}
      <TopNav />

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">🏆 Leaderboard</h1>
          <p className="text-gray-600">Top contributors making a difference in our community</p>
        </div>

        {/* User Stats Card */}
        {userStats && (
          <div className="mb-8 bg-gradient-to-r from-purple-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Your Performance
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold mb-1">{userStats.totalPoints}</div>
                <div className="text-purple-100 text-sm">Total Points</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold mb-1">{userStats.pointCount}</div>
                <div className="text-purple-100 text-sm">Claims Addressed</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold mb-1">
                  {userRank ? `#${userRank}` : 'Unranked'}
                </div>
                <div className="text-purple-100 text-sm">Global Rank</div>
              </div>
            </div>
            {userRank && userRank <= 10 && (
              <div className="mt-4 text-center">
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-white/20 rounded-full text-sm font-medium">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                  Top 10 Contributor!
                </span>
              </div>
            )}
          </div>
        )}

        {loading ? (
          <div className="space-y-4">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm p-6 animate-pulse">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
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
              <div className="p-12 text-center bg-white rounded-xl shadow-sm">
                <div className="text-6xl mb-6">🎯</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">No points collected yet</h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  Be the first to start collecting discussion points and claim your spot on the leaderboard!
                </p>
                <Link
                  href="/feed"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full hover:from-purple-700 hover:to-blue-700 transition-all transform hover:scale-105 font-medium shadow-lg"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  Start Collecting Points
                </Link>
              </div>
            ) : (
              <>
                {/* Top 3 Podium */}
                {leaderboard.length >= 3 && (
                  <div className="bg-white rounded-xl shadow-sm p-8 mb-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-6 text-center">🥇 Top Contributors</h3>
                    <div className="flex items-end justify-center gap-4 mb-6">
                      {/* Second Place */}
                      <div className="text-center">
                        <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-2 mx-auto">
                          <span className="text-2xl">🥈</span>
                        </div>
                        <div className="font-bold text-gray-900">{leaderboard[1]?.userName}</div>
                        <div className="text-sm text-gray-600">{leaderboard[1]?.totalPoints} pts</div>
                        <div className="w-20 h-16 bg-gray-300 rounded-t-lg mt-2"></div>
                      </div>
                      
                      {/* First Place */}
                      <div className="text-center">
                        <div className="w-20 h-20 bg-yellow-200 rounded-full flex items-center justify-center mb-2 mx-auto ring-4 ring-yellow-300">
                          <span className="text-3xl">🥇</span>
                        </div>
                        <div className="font-bold text-gray-900 text-lg">{leaderboard[0]?.userName}</div>
                        <div className="text-sm text-gray-600">{leaderboard[0]?.totalPoints} pts</div>
                        <div className="w-20 h-20 bg-yellow-400 rounded-t-lg mt-2"></div>
                      </div>
                      
                      {/* Third Place */}
                      <div className="text-center">
                        <div className="w-16 h-16 bg-orange-200 rounded-full flex items-center justify-center mb-2 mx-auto">
                          <span className="text-2xl">🥉</span>
                        </div>
                        <div className="font-bold text-gray-900">{leaderboard[2]?.userName}</div>
                        <div className="text-sm text-gray-600">{leaderboard[2]?.totalPoints} pts</div>
                        <div className="w-20 h-12 bg-orange-300 rounded-t-lg mt-2"></div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Full Leaderboard */}
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-900">Full Rankings</h3>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {leaderboard.map((entry, index) => (
                      <div
                        key={entry.userId}
                        className={`p-6 transition-colors ${
                          entry.userId === user?.uid 
                            ? 'bg-gradient-to-r from-purple-50 to-blue-50 ring-2 ring-purple-200' 
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            {/* Rank Badge */}
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
                              index === 0 ? 'bg-yellow-100 text-yellow-800' :
                              index === 1 ? 'bg-gray-100 text-gray-700' :
                              index === 2 ? 'bg-orange-100 text-orange-700' :
                              'bg-blue-50 text-blue-700'
                            }`}>
                              {getRankIcon(index + 1) || `#${index + 1}`}
                            </div>
                            
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-gray-900 text-lg">
                                  {entry.userName}
                                </span>
                                {entry.userId === user?.uid && (
                                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-600 text-white text-xs rounded-full font-medium">
                                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
                                      <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"/>
                                    </svg>
                                    YOU
                                  </span>
                                )}
                                {index < 3 && (
                                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-yellow-400 to-orange-400 text-white text-xs rounded-full font-medium">
                                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                    </svg>
                                    TOP 3
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                                <span className="flex items-center gap-1">
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                  </svg>
                                  {entry.pointCount} claim{entry.pointCount !== 1 ? 's' : ''}
                                </span>
                                <span className="flex items-center gap-1">
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  {formatDate(entry.lastEarned)}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <div className="text-2xl font-bold text-gray-900 flex items-center gap-1">
                              {entry.totalPoints}
                              <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                              </svg>
                            </div>
                            <div className="text-xs text-gray-500 uppercase tracking-wide font-medium">
                              total points
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Call to Action */}
        <div className="mt-8 bg-white rounded-xl shadow-sm p-8 text-center">
          <h3 className="text-xl font-bold text-gray-900 mb-3">Ready to climb the ranks?</h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Join discussions, address claims, and earn points to boost your position on the leaderboard!
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/feed"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full hover:from-purple-700 hover:to-blue-700 transition-all transform hover:scale-105 font-medium shadow-lg"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              Browse Discussions
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-full hover:bg-gray-50 transition-colors font-medium"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Back to Dashboard
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}