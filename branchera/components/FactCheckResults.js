'use client';

import { useState } from 'react';

export default function FactCheckResults({ factCheckResults, isLoading = false }) {
  const [expandedClaims, setExpandedClaims] = useState(new Set());
  const [isExpanded, setIsExpanded] = useState(false);

  if (isLoading) {
    return (
      <div className="bg-white rounded border border-black/20 p-3 mt-3">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-semibold text-gray-900">Fact-checking content...</span>
        </div>
        <p className="text-xs text-gray-600">Analyzing claims and verifying with web search...</p>
      </div>
    );
  }

  if (!factCheckResults || !factCheckResults.claims || factCheckResults.claims.length === 0) {
    return (
      <div className="bg-white rounded border border-black/20 p-3 mt-3">
        <div className="flex items-center gap-2 mb-1">
          <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm font-semibold text-gray-900">Fact Check Complete</span>
        </div>
        <p className="text-xs text-gray-600">No verifiable factual claims found in this content.</p>
      </div>
    );
  }

  const toggleClaim = (claimId) => {
    setExpandedClaims(prev => {
      const next = new Set(prev);
      if (next.has(claimId)) {
        next.delete(claimId);
      } else {
        next.add(claimId);
      }
      return next;
    });
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'likely_accurate':
        return <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>;
      case 'needs_verification':
        return <svg className="w-3 h-3 text-yellow-600" fill="currentColor" viewBox="0 0 24 24"><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"/></svg>;
      case 'likely_inaccurate':
        return <svg className="w-3 h-3 text-red-600" fill="currentColor" viewBox="0 0 24 24"><path d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>;
      default:
        return <svg className="w-3 h-3 text-gray-600" fill="currentColor" viewBox="0 0 24 24"><path d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'likely_accurate': return 'text-green-700 bg-green-50 border-green-200';
      case 'needs_verification': return 'text-yellow-700 bg-yellow-50 border-yellow-200';
      case 'likely_inaccurate': return 'text-red-700 bg-red-50 border-red-200';
      default: return 'text-gray-700 bg-gray-50 border-gray-200';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'likely_accurate': return 'Likely Accurate';
      case 'needs_verification': return 'Needs Verification';
      case 'likely_inaccurate': return 'Questionable';
      case 'unverifiable': return 'Unverifiable';
      default: return 'Unknown';
    }
  };

  return (
    <div className="bg-white rounded border border-black/20 mt-3">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50"
      >
        <div className="flex items-center gap-2">
          <svg className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <svg className="w-4 h-4 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm font-semibold text-gray-900">Fact Check Results</span>
        </div>
        <div className="text-xs text-gray-600">
          {factCheckResults.claims.length} claim{factCheckResults.claims.length !== 1 ? 's' : ''} analyzed
        </div>
      </button>

      {isExpanded && (
        <div className="px-3 pb-3 border-t border-black/10">

      <div className="space-y-2">
        {factCheckResults.claims.map((claim) => {
          const isExpanded = expandedClaims.has(claim.id);
          return (
            <div key={claim.id} className={`border rounded p-2 ${getStatusColor(claim.status)}`}>
              <div className="flex items-start gap-2">
                {getStatusIcon(claim.status)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-gray-900 truncate pr-2">
                      &ldquo;{claim.text}&rdquo;
                    </p>
                    <span className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 bg-white rounded">
                      {getStatusLabel(claim.status)}
                    </span>
                  </div>
                  
                  {claim.explanation && (
                    <p className="text-[11px] text-gray-700 mt-1">
                      {claim.explanation}
                    </p>
                  )}
                  
                  {claim.webSearchResults && (
                    <button
                      onClick={() => toggleClaim(claim.id)}
                      className="text-[11px] text-gray-800 hover:text-black underline mt-1"
                    >
                      {isExpanded ? 'Hide' : 'Show'} verification sources
                    </button>
                  )}
                </div>
              </div>

              {isExpanded && claim.webSearchResults && (
                <div className="mt-2 pt-2 border-t border-gray-300">
                  <div className="text-[11px] text-gray-600 mb-2">
                    Search results for: &ldquo;{claim.webSearchResults.searchTerm}&rdquo;
                  </div>
                  <div className="space-y-1">
                    {claim.webSearchResults.results.map((result, idx) => (
                      <div key={idx} className="bg-white rounded border border-gray-200 p-2">
                        <div className="text-[11px] font-medium text-gray-900 mb-1">
                          {result.url !== '#' ? (
                            <a 
                              href={result.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="hover:underline"
                            >
                              {result.title}
                            </a>
                          ) : (
                            result.title
                          )}
                        </div>
                        <p className="text-[10px] text-gray-700 mb-1">
                          {result.snippet}
                        </p>
                        <div className="text-[10px] text-gray-500">
                          Source: {result.source}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

          {factCheckResults.summary && (
            <div className="mt-2 pt-2 border-t border-black/10">
              <div className="text-[11px] text-gray-600">
                Overall confidence: <span className="font-medium capitalize">{factCheckResults.summary.overallConfidence}</span>
                {factCheckResults.summary.needsVerification > 0 && (
                  <span className="ml-2">
                    • {factCheckResults.summary.needsVerification} claim{factCheckResults.summary.needsVerification !== 1 ? 's' : ''} need verification
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}