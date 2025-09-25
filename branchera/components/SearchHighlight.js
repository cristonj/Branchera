'use client';

import { useMemo } from 'react';

export default function SearchHighlight({ 
  text, 
  searchQuery, 
  className = '', 
  highlightClassName = 'bg-yellow-200 font-semibold' 
}) {
  const highlightedText = useMemo(() => {
    if (!text || !searchQuery?.trim()) {
      return text;
    }

    const query = searchQuery.trim();
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, index) => {
      const isMatch = regex.test(part);
      regex.lastIndex = 0; // Reset regex for next test
      
      if (isMatch) {
        return (
          <mark key={index} className={highlightClassName}>
            {part}
          </mark>
        );
      }
      return part;
    });
  }, [text, searchQuery, highlightClassName]);

  return (
    <span className={className}>
      {highlightedText}
    </span>
  );
}

export function SearchHighlightList({ 
  items, 
  searchQuery, 
  renderItem,
  className = '',
  highlightClassName = 'bg-yellow-200 font-semibold'
}) {
  if (!items || !Array.isArray(items)) {
    return null;
  }

  return (
    <div className={className}>
      {items.map((item, index) => (
        <div key={index}>
          {renderItem ? 
            renderItem(item, index, (text) => (
              <SearchHighlight 
                text={text} 
                searchQuery={searchQuery}
                highlightClassName={highlightClassName}
              />
            )) : 
            <SearchHighlight 
              text={item} 
              searchQuery={searchQuery}
              highlightClassName={highlightClassName}
            />
          }
        </div>
      ))}
    </div>
  );
}