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

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    const loadDashboardData = async () => {
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
    };

    loadDashboardData();
  }, [user?.uid]); // Only run when user changes

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
    <div className="min-h-screen">
      {/* Navigation Bar */}
      <TopNav />

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Welcome back, {user.displayName?.split(' ')[0] || 'there'}!
          </h1>
          <p className="text-gray-600 mb-6">Here&apos;s what&apos;s happening in your community</p>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="rounded-lg border border-black/20 p-6 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="h-8 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* Simple Stats */}
            <div className="rounded-lg border border-black/20 p-6 mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">Your Activity</h2>
                <Link
                  href="/points"
                  className="text-sm text-gray-600 hover:text-black transition-colors"
                >
                  View leaderboard →
                </Link>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{stats?.user.totalPoints || 0}</div>
                  <div className="text-xs text-gray-600">Points earned</div>
                  {stats?.user.rank && (
                    <div className="text-xs text-gray-500">Rank #{stats.user.rank}</div>
                  )}
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{stats?.user.pointsCount || 0}</div>
                  <div className="text-xs text-gray-600">Claims addressed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{stats?.platform.totalDiscussions || 0}</div>
                  <div className="text-xs text-gray-600">Total discussions</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{stats?.platform.totalUsers || 0}</div>
                  <div className="text-xs text-gray-600">Active users</div>
                </div>
              </div>
            </div>

            {/* Hot Discussions */}
            <div className="rounded-lg border border-black/20 p-6 mb-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-gray-900">🔥 Hot Discussions</h2>
                <Link 
                  href="/feed" 
                  className="text-sm text-gray-600 hover:text-black transition-colors"
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
                  <div className="space-y-3">
                    {hotDiscussions.map((discussion, index) => (
                      <div key={discussion.id} className="border border-black/10 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-start gap-3">
                          <div className="text-sm font-bold text-gray-400">#{index + 1}</div>
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
            <div className="rounded-lg border border-black/20 p-6 mb-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-gray-900">📈 Recent Activity</h2>
                <Link 
                  href="/points" 
                  className="text-sm text-gray-600 hover:text-black transition-colors"
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

            {/* Quick Actions */}
            <div className="rounded-lg border border-black/20 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-6">Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link
                  href="/feed"
                  className="flex items-center gap-3 p-4 border border-black/20 rounded-lg hover:bg-gray-50 transition-colors group"
                >
                  <div className="p-2 bg-black rounded-lg">
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                  className="flex items-center gap-3 p-4 border border-black/20 rounded-lg hover:bg-gray-50 transition-colors group"
                >
                  <div className="p-2 bg-black rounded-lg">
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                  className="flex items-center gap-3 p-4 border border-black/20 rounded-lg hover:bg-gray-50 transition-colors group"
                >
                  <div className="p-2 bg-black rounded-lg">
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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