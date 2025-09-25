'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useDatabase } from '@/hooks/useDatabase';
import { useAuth } from '@/contexts/AuthContext';

const DatabaseContext = createContext({});

export const useDatabaseContext = () => useContext(DatabaseContext);

export function DatabaseProvider({ children }) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [initializationError, setInitializationError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const { setupDatabase } = useDatabase();
  const { user, loading: authLoading } = useAuth();

  const initializeDatabase = useCallback(async () => {
    // Wait for auth to load
    if (authLoading) {
      return;
    }

    // Only initialize if user is authenticated
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const result = await setupDatabase();
      
      setIsInitialized(true);
      setInitializationError(null);
    } catch (error) {
      console.error('Database initialization error:', error);
      setInitializationError(error.message);
      setIsInitialized(false);
    } finally {
      setIsLoading(false);
    }
  }, [user, authLoading]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    initializeDatabase();
  }, [initializeDatabase]);

  const value = {
    isInitialized,
    initializationError,
    isLoading
  };

  // Show loading state while initializing
  if (authLoading || (user && isLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-4"></div>
          <div className="text-gray-600">Setting up database...</div>
        </div>
      </div>
    );
  }

  // Show error state if initialization failed
  if (user && initializationError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-500 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Database Setup Error</h3>
          <p className="text-gray-600 mb-4">
            There was an issue setting up the database. Please check your Firebase configuration.
          </p>
          <p className="text-sm text-gray-500 mb-4">
            Error: {initializationError}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <DatabaseContext.Provider value={value}>
      {children}
    </DatabaseContext.Provider>
  );
}
