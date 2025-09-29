'use client';

import { useEffect, useState, useCallback } from 'react';

// Force dynamic rendering to prevent pre-rendering issues with Firebase
export const dynamic = 'force-dynamic';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useDatabase } from '@/hooks/useDatabase';
import Link from 'next/link';
import TopNav from '@/components/TopNav';
import DiscussionItem from '@/components/DiscussionItem';


export default function DashboardPage() {
  const { user, logout, getDisplayName } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState(null);
  const [hotDiscussions, setHotDiscussions] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  // State for discussion components - separate for hot and recent sections
  const [expandedHotDiscussions, setExpandedHotDiscussions] = useState(new Set());
  const [expandedRecentDiscussions, setExpandedRecentDiscussions] = useState(new Set());
  const [expandedHotReplies, setExpandedHotReplies] = useState(new Set());
  const [expandedRecentReplies, setExpandedRecentReplies] = useState(new Set());

  const { getDiscussions } = useDatabase();


  // Handle discussion updates from DiscussionItem components
  const handleDiscussionUpdate = useCallback((discussionId, updatedData) => {
    if (updatedData === null) {
      // Delete discussion
      setHotDiscussions(prev => prev.filter(d => d.id !== discussionId));
      setRecentActivity(prev => ({
        ...prev,
        discussions: prev.discussions?.filter(d => d.id !== discussionId) || []
      }));
    } else {
      // Update discussion
      const updateDiscussion = (discussions) =>
        discussions.map(d => d.id === discussionId ? { ...d, ...updatedData } : d);

      setHotDiscussions(prev => updateDiscussion(prev));
      setRecentActivity(prev => ({
        ...prev,
        discussions: prev.discussions ? updateDiscussion(prev.discussions) : []
      }));
    }
  }, []);

  // Handle reply additions
  const handleReplyAdded = useCallback((discussionId, newReply, section) => {
    const updateDiscussion = (discussions) =>
      discussions.map(d => {
        if (d.id === discussionId) {
          const updatedReplies = [
            ...(d.replies || []).filter(r => r.id !== newReply.id),
            newReply
          ];
          return {
            ...d,
            replies: updatedReplies,
            replyCount: updatedReplies.length
          };
        }
        return d;
      });

    setHotDiscussions(prev => updateDiscussion(prev));
    setRecentActivity(prev => ({
      ...prev,
      discussions: prev.discussions ? updateDiscussion(prev.discussions) : []
    }));
  }, []);


  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    const loadDashboardData = async () => {
      try {
        setLoading(true);

        // Load discussions
        const allDiscussions = await getDiscussions({ limit: 50 });

        // Calculate platform stats
        const totalDiscussions = allDiscussions.length;
        const totalReplies = allDiscussions.reduce((sum, d) => sum + (d.replyCount || 0), 0);
        const totalViews = allDiscussions.reduce((sum, d) => sum + (d.views || 0), 0);
        const totalLikes = allDiscussions.reduce((sum, d) => sum + (d.likes || 0), 0);

        setStats({
          platform: {
            totalDiscussions,
            totalReplies,
            totalViews,
            totalLikes,
            totalUsers: 0 // Will be calculated differently in simplified version
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

        // Get recent activity (latest discussions)
        const recentDiscussions = allDiscussions.slice(0, 3);

        setRecentActivity({
          discussions: recentDiscussions
        });

      } catch (error) {
        // Check if this is an index-related error that should be shown to the user
        if (error.message?.includes('Firebase index required')) {
          console.error('Firebase index error:', error.message);
        } else {
          console.error('Error loading dashboard data:', error);
        }
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* Navigation Bar */}
      <TopNav />

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Welcome Header */}
        <div className="mb-12">
          <div className="flex items-center gap-4 mb-3">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                Welcome back, {getDisplayName().split(' ')[0] || 'there'}!
              </h1>
              <p className="text-gray-600 mt-1">Here&apos;s what&apos;s happening in your community</p>
            </div>
          </div>
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
                <h2 className="text-lg font-bold text-gray-900">Community Stats</h2>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{stats?.platform.totalDiscussions || 0}</div>
                  <div className="text-xs text-gray-600">Total discussions</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{stats?.platform.totalReplies || 0}</div>
                  <div className="text-xs text-gray-600">Total replies</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{stats?.platform.totalViews || 0}</div>
                  <div className="text-xs text-gray-600">Total views</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{stats?.platform.totalLikes || 0}</div>
                  <div className="text-xs text-gray-600">Total likes</div>
                </div>
              </div>
            </div>

            {/* Hot Discussions */}
            <div className="rounded-lg border border-black/20 p-6 mb-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-gray-900">Hot Discussions</h2>
                </div>
                <Link 
                  href="/feed" 
                  className="text-sm text-gray-600 hover:text-black transition-colors"
                >
                  View all →
                </Link>
              </div>
                
                {hotDiscussions.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="mb-3">
                      <svg className="w-12 h-12 text-gray-400 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
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
                    {hotDiscussions.map((discussion) => (
                      <DiscussionItem
                        key={discussion.id}
                        discussion={discussion}
                        searchQuery=""
                        onDiscussionUpdate={handleDiscussionUpdate}
                        onReplyAdded={(discussionId, newReply) => handleReplyAdded(discussionId, newReply, 'hot')}
                        expandedDiscussions={expandedHotDiscussions}
                        setExpandedDiscussions={setExpandedHotDiscussions}
                        expandedReplies={expandedHotReplies}
                        setExpandedReplies={setExpandedHotReplies}
                        showCompactView={true}
                      />
                    ))}
                  </div>
                )}
            </div>

            {/* Recent Activity */}
            <div className="rounded-lg border border-black/20 p-6 mb-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-gray-900">Recent Activity</h2>
                </div>
              </div>

                <div className="space-y-6">
                  {/* Recent Discussions */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-3">Latest Discussions</h3>
                    <div className="space-y-3">
                      {recentActivity.discussions?.slice(0, 3).map((discussion) => (
                        <DiscussionItem
                          key={discussion.id}
                          discussion={discussion}
                          searchQuery=""
                          onDiscussionUpdate={handleDiscussionUpdate}
                          onReplyAdded={(discussionId, newReply) => handleReplyAdded(discussionId, newReply, 'recent')}
                          expandedDiscussions={expandedRecentDiscussions}
                          setExpandedDiscussions={setExpandedRecentDiscussions}
                          expandedReplies={expandedRecentReplies}
                          setExpandedReplies={setExpandedRecentReplies}
                          showCompactView={true}
                        />
                      ))}
                    </div>
                  </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="rounded-lg border border-black/20 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-6">Quick Actions</h2>
              <div className="grid grid-cols-1 gap-4">
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
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}