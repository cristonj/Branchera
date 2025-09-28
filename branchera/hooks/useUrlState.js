'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export function useUrlState(key, defaultValue, options = {}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { serialize = JSON.stringify, deserialize = JSON.parse, replace = false } = options;
  
  // Get initial value from URL or use default
  const getInitialValue = useCallback(() => {
    const urlValue = searchParams.get(key);
    if (urlValue === null) return defaultValue;
    
    try {
      return deserialize(urlValue);
    } catch (error) {
      return defaultValue;
    }
  }, [key, defaultValue, searchParams, deserialize]);

  const [value, setValue] = useState(getInitialValue);

  // Update URL when value changes
  const updateUrl = useCallback((newValue) => {
    const params = new URLSearchParams(searchParams);
    
    if (newValue === defaultValue || newValue === '' || newValue === null || newValue === undefined) {
      params.delete(key);
    } else {
      try {
        params.set(key, serialize(newValue));
      } catch (error) {
        return;
      }
    }
    
    const newUrl = params.toString() ? `?${params.toString()}` : window.location.pathname;
    
    if (replace) {
      router.replace(newUrl);
    } else {
      router.push(newUrl);
    }
  }, [key, defaultValue, searchParams, serialize, router, replace]);

  // Update state and URL
  const setUrlState = useCallback((newValue) => {
    setValue(newValue);
    updateUrl(newValue);
  }, [updateUrl]);

  // Sync with URL changes (for browser back/forward)
  useEffect(() => {
    const newValue = getInitialValue();
    if (JSON.stringify(newValue) !== JSON.stringify(value)) {
      setValue(newValue);
    }
  }, [searchParams, getInitialValue, value]);

  return [value, setUrlState];
}

export function useSearchFilterSortState() {
  const [searchQuery, setSearchQuery] = useUrlState('q', '', {
    serialize: (v) => v,
    deserialize: (v) => v,
    replace: true
  });

  const [searchType, setSearchType] = useUrlState('type', 'all', {
    serialize: (v) => v,
    deserialize: (v) => v,
    replace: true
  });

  const [sortBy, setSortBy] = useUrlState('sort', 'newest', {
    serialize: (v) => v,
    deserialize: (v) => v,
    replace: true
  });

  const [filters, setFilters] = useUrlState('filters', {
    hasReplies: false,
    hasFactCheck: false,
    dateRange: 'all',
    author: '',
    minLikes: 0,
    minViews: 0
  }, {
    serialize: (v) => {
      // Only serialize non-default values to keep URL clean
      const nonDefaults = {};
      if (v.hasReplies) nonDefaults.hasReplies = v.hasReplies;
      if (v.hasFactCheck) nonDefaults.hasFactCheck = v.hasFactCheck;
      if (v.dateRange !== 'all') nonDefaults.dateRange = v.dateRange;
      if (v.author) nonDefaults.author = v.author;
      if (v.minLikes > 0) nonDefaults.minLikes = v.minLikes;
      if (v.minViews > 0) nonDefaults.minViews = v.minViews;
      
      return Object.keys(nonDefaults).length > 0 ? JSON.stringify(nonDefaults) : '';
    },
    deserialize: (v) => {
      if (!v) return {
        hasReplies: false,
        hasFactCheck: false,
        dateRange: 'all',
        author: '',
        minLikes: 0,
        minViews: 0
      };
      
      const parsed = JSON.parse(v);
      return {
        hasReplies: parsed.hasReplies || false,
        hasFactCheck: parsed.hasFactCheck || false,
        dateRange: parsed.dateRange || 'all',
        author: parsed.author || '',
        minLikes: parsed.minLikes || 0,
        minViews: parsed.minViews || 0
      };
    },
    replace: true
  });

  const clearAll = useCallback(() => {
    setSearchQuery('');
    setSearchType('all');
    setSortBy('newest');
    setFilters({
      hasReplies: false,
      hasFactCheck: false,
      dateRange: 'all',
      author: '',
      minLikes: 0,
      minViews: 0
    });
  }, [setSearchQuery, setSearchType, setSortBy, setFilters]);

  return {
    searchQuery,
    setSearchQuery,
    searchType,
    setSearchType,
    sortBy,
    setSortBy,
    filters,
    setFilters,
    clearAll
  };
}