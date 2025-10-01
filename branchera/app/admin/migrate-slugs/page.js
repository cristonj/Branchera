'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { migrateDiscussionSlugs, checkSlugMigrationStatus } from '@/lib/migrateDiscussionSlugs';
import TopNav from '@/components/TopNav';

export default function MigrateSlugsPage() {
  const { user } = useAuth();
  const [status, setStatus] = useState(null);
  const [migrating, setMigrating] = useState(false);
  const [result, setResult] = useState(null);
  const [checking, setChecking] = useState(false);

  const handleCheckStatus = async () => {
    setChecking(true);
    try {
      const statusResult = await checkSlugMigrationStatus();
      setStatus(statusResult);
    } catch (error) {
      console.error('Error checking status:', error);
      alert('Failed to check migration status: ' + error.message);
    } finally {
      setChecking(false);
    }
  };

  const handleMigrate = async () => {
    if (!window.confirm('This will add slugs to all discussions that don&apos;t have one. Continue?')) {
      return;
    }

    setMigrating(true);
    setResult(null);
    
    try {
      const migrationResult = await migrateDiscussionSlugs();
      setResult(migrationResult);
      
      // Refresh status
      const statusResult = await checkSlugMigrationStatus();
      setStatus(statusResult);
      
      alert(`Migration complete!\nUpdated: ${migrationResult.updated}\nErrors: ${migrationResult.errors}`);
    } catch (error) {
      console.error('Migration error:', error);
      alert('Migration failed: ' + error.message);
    } finally {
      setMigrating(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Authentication Required</h1>
          <p className="text-gray-600">Please log in to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNav />
      
      <main className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Discussion Slug Migration
        </h1>
        <p className="text-gray-600 mb-8">
          Add SEO-friendly slugs to existing discussions for better search engine indexing.
        </p>

        {/* Status Card */}
        <div className="bg-white rounded-lg border border-black/20 p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Migration Status</h2>
          
          {status ? (
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-gray-700">Total Discussions:</span>
                <span className="font-semibold text-gray-900">{status.total}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-gray-700">With Slugs:</span>
                <span className="font-semibold text-green-600">{status.withSlugs}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-700">Needs Slugs:</span>
                <span className="font-semibold text-orange-600">{status.needsSlugs}</span>
              </div>
              
              {status.needsSlugs === 0 && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-green-800 font-medium">
                    ✓ All discussions have slugs! No migration needed.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-gray-600">Click &quot;Check Status&quot; to see migration status.</p>
          )}
          
          <button
            onClick={handleCheckStatus}
            disabled={checking}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {checking ? 'Checking...' : 'Check Status'}
          </button>
        </div>

        {/* Migration Card */}
        <div className="bg-white rounded-lg border border-black/20 p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Run Migration</h2>
          
          <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>Warning:</strong> This will update all discussions that don&apos;t have a slug.
              The operation is safe and won&apos;t overwrite existing slugs.
            </p>
          </div>
          
          <button
            onClick={handleMigrate}
            disabled={migrating || (status && status.needsSlugs === 0)}
            className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {migrating ? 'Migrating...' : 'Run Migration'}
          </button>
          
          {result && (
            <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <h3 className="font-semibold mb-2">Migration Results:</h3>
              <ul className="space-y-1 text-sm">
                <li className="text-green-600">✓ Updated: {result.updated} discussions</li>
                {result.errors > 0 && (
                  <li className="text-red-600">✗ Errors: {result.errors} discussions</li>
                )}
              </ul>
            </div>
          )}
        </div>

        {/* Information Card */}
        <div className="bg-white rounded-lg border border-black/20 p-6">
          <h2 className="text-xl font-semibold mb-4">About Slugs</h2>
          
          <div className="prose prose-sm max-w-none text-gray-700">
            <p className="mb-3">
              Slugs are SEO-friendly URLs that make discussions easily shareable and indexable by search engines.
            </p>
            
            <div className="mb-3">
              <strong>Example:</strong>
              <div className="mt-1 p-3 bg-gray-50 rounded font-mono text-xs break-all">
                /discussion/global-climate-summit-2025-abc123
              </div>
            </div>
            
            <ul className="space-y-2 list-disc list-inside">
              <li>Each discussion gets a unique, human-readable URL</li>
              <li>Slugs are automatically generated from discussion titles</li>
              <li>Search engines can crawl and index discussion content</li>
              <li>Users can easily share direct links to discussions</li>
              <li>All content is rendered server-side for SEO</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
