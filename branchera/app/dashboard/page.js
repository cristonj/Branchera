'use client';

import { useEffect, useState, useCallback } from 'react';

// Force dynamic rendering to prevent pre-rendering issues with Firebase
export const dynamic = 'force-dynamic';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useDatabase } from '@/hooks/useDatabase';
import Link from 'next/link';
import TopNav from '@/components/TopNav';

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState(null);
  const [hotDiscussions, setHotDiscussions] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const { getDiscussions, getLeaderboard, getUserPoints } = useDatabase();

  const loadDashboardData = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Load all data in parallel
      const [allDiscussions, leaderboardData, userPoints] = await Promise.all([
        getDiscussions({ limit: 50 }),
        getLeaderboard(),
        getUserPoints(user.uid)
      ]);

      // Calculate platform stats
      const totalDiscussions = allDiscussions.length;
      const totalReplies = allDiscussions.reduce((sum, d) => sum + (d.replyCount || 0), 0);
      const totalViews = allDiscussions.reduce((sum, d) => sum + (d.views || 0), 0);
      const totalLikes = allDiscussions.reduce((sum, d) => sum + (d.likes || 0), 0);
      const totalUsers = leaderboardData.length;

      // Get user's stats
      const userTotalPoints = userPoints.reduce((sum, point) => sum + (point.pointsEarned || 1), 0);
      const userRank = leaderboardData.findIndex(entry => entry.userId === user.uid) + 1;

      setStats({
        platform: {
          totalDiscussions,
          totalReplies,
          totalViews,
          totalLikes,
          totalUsers
        },
        user: {
          totalPoints: userTotalPoints,
          pointsCount: userPoints.length,
          rank: userRank || null
        }
      });

      // Get hot discussions (most liked + most replied in last 7 days)
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      
      const hotDiscussionsList = allDiscussions
        .filter(d => new Date(d.createdAt) > weekAgo)
        .sort((a, b) => {
          const scoreA = (a.likes || 0) * 2 + (a.replyCount || 0) * 3 + (a.views || 0) * 0.1;
          const scoreB = (b.likes || 0) * 2 + (b.replyCount || 0) * 3 + (b.views || 0) * 0.1;
          return scoreB - scoreA;
        })
        .slice(0, 5);

      setHotDiscussions(hotDiscussionsList);

      // Get recent activity (latest discussions and user activity)
      const recentDiscussions = allDiscussions.slice(0, 3);
      const recentUserActivity = userPoints
        .sort((a, b) => new Date(b.earnedAt) - new Date(a.earnedAt))
        .slice(0, 3);

      setRecentActivity({
        discussions: recentDiscussions,
        userActivity: recentUserActivity
      });

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, [user, getDiscussions, getLeaderboard, getUserPoints]);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    loadDashboardData();
  }, [user, router, loadDashboardData]);

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
      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user.displayName?.split(' ')[0] || 'there'}!
          </h1>
          <p className="text-gray-600">Here's what's happening in your community</p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm p-6 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {/* User Points */}
              <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-purple-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Your Points</p>
                    <p className="text-2xl font-bold text-gray-900">{stats?.user.totalPoints || 0}</p>
                    <p className="text-xs text-gray-500">{stats?.user.pointsCount || 0} claims addressed</p>
                  </div>
                  <div className="p-3 bg-purple-100 rounded-full">
                    <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                  </div>
                </div>
                {stats?.user.rank && (
                  <div className="mt-2 text-xs text-purple-600 font-medium">
                    Rank #{stats.user.rank}
                  </div>
                )}
              </div>

              {/* Total Discussions */}
              <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-blue-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Discussions</p>
                    <p className="text-2xl font-bold text-gray-900">{stats?.platform.totalDiscussions || 0}</p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-full">
                    <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Total Replies */}
              <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-green-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Replies</p>
                    <p className="text-2xl font-bold text-gray-900">{stats?.platform.totalReplies || 0}</p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-full">
                    <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a2 2 0 01-2-2v-6a2 2 0 012-2h8z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Active Users */}
              <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-orange-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Users</p>
                    <p className="text-2xl font-bold text-gray-900">{stats?.platform.totalUsers || 0}</p>
                  </div>
                  <div className="p-3 bg-orange-100 rounded-full">
                    <svg className="w-6 h-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Hot Discussions */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900">🔥 Hot Discussions</h2>
                  <Link 
                    href="/feed" 
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    View all →
                  </Link>
                </div>
                
                {hotDiscussions.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-3">💬</div>
                    <p className="text-gray-500 mb-4">No hot discussions this week</p>
                    <Link
                      href="/feed"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white rounded-full hover:bg-black/80 transition-colors text-sm"
                    >
                      Start a Discussion
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {hotDiscussions.map((discussion, index) => (
                      <div key={discussion.id} className="border border-gray-100 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-start gap-3">
                          <div className="text-lg font-bold text-gray-400">#{index + 1}</div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-gray-900 mb-1 truncate">
                              {discussion.title}
                            </h3>
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              <span className="flex items-center gap-1">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                </svg>
                                {discussion.likes || 0}
                              </span>
                              <span className="flex items-center gap-1">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                                {discussion.replyCount || 0}
                              </span>
                              <span>{formatDate(discussion.createdAt)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Recent Activity */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900">📈 Recent Activity</h2>
                  <Link 
                    href="/points" 
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    View leaderboard →
                  </Link>
                </div>

                <div className="space-y-6">
                  {/* Recent Discussions */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-3">Latest Discussions</h3>
                    <div className="space-y-2">
                      {recentActivity.discussions?.slice(0, 3).map((discussion) => (
                        <div key={discussion.id} className="flex items-center gap-3 text-sm">
                          <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                          <div className="flex-1 min-w-0">
                            <span className="text-gray-900 truncate block">{discussion.title}</span>
                            <span className="text-gray-500 text-xs">by {discussion.authorName} • {formatDate(discussion.createdAt)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Your Recent Points */}
                  {recentActivity.userActivity?.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-3">Your Recent Points</h3>
                      <div className="space-y-2">
                        {recentActivity.userActivity.map((point, index) => (
                          <div key={index} className="flex items-center gap-3 text-sm">
                            <div className="w-2 h-2 bg-purple-500 rounded-full flex-shrink-0"></div>
                            <div className="flex-1 min-w-0">
                              <span className="text-gray-900">+{point.pointsEarned || 1} points</span>
                              <span className="text-gray-500 text-xs block">{formatDate(point.earnedAt)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="mt-8 bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link
                  href="/feed"
                  className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors group"
                >
                  <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                    <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Browse Discussions</h3>
                    <p className="text-sm text-gray-500">Explore all discussions</p>
                  </div>
                </Link>

                <Link
                  href="/points"
                  className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors group"
                >
                  <div className="p-2 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
                    <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">View Leaderboard</h3>
                    <p className="text-sm text-gray-500">See top contributors</p>
                  </div>
                </Link>

                <Link
                  href="/about"
                  className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors group"
                >
                  <div className="p-2 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
                    <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Learn More</h3>
                    <p className="text-sm text-gray-500">About Branchera</p>
                  </div>
                </Link>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}