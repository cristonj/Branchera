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
          <div className="flex items-center justify-center mb-6">
            <div className="relative">
              <svg 
                width="48" 
                height="48" 
                viewBox="0 0 512 512" 
                className="animate-pulse text-black"
                fill="currentColor"
              >
                <polygon points="365.284,332.418 365.284,305.202 272.767,305.202 387.051,212.689 376.17,174.592 169.368,316.092 180.253,141.939 147.601,152.828 125.83,348.761 0.664,452.14 0.664,512 49.643,512 240.114,343.3"/>
                <path d="M448.163,41.908c-67.94,15.609-85.271,84.366-46.608,131.48C435.48,175.564,496.759,99.05,448.163,41.908z"/>
                <path d="M388.215,327.476c13.457,19.787,82.469,20.759,93.207-30.955C443.376,265.519,397.673,285.616,388.215,327.476z"/>
                <path d="M194.275,410.152c-2.594,28.061,59.378,80.659,107.876,41.708C290.815,395.196,234.234,379.221,194.275,410.152z"/>
                <path d="M395.844,214.419c5.895,27.582,80.787,59.318,115.492,7.646C483.585,171.331,424.774,172.95,395.844,214.419z"/>
                <path d="M273.866,79.44c-26.323-12.93-100.453,27.83-80.575,89.436C252.613,178.872,289.141,129.774,273.866,79.44z"/>
                <path d="M155.457,137.594C184.645,117.665,185.881,15.721,109.463,0C63.772,56.297,93.599,123.747,155.457,137.594z"/>
                <path d="M122.828,279.804c16.633-25.486-16.028-106.951-81.979-94.235C23.096,245.414,69.069,289.203,122.828,279.804z"/>
                <path d="M368.488,362.114c-21.842,27.79,7.657,125.373,85.267,117.377C480.386,412.058,431.645,356.709,368.488,362.114z"/>
              </svg>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 animate-pulse">Branchera</h1>
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
