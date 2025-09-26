'use client';

import { useState } from 'react';
import SearchHighlight from './SearchHighlight';

export default function FactCheckResults({ factCheckResults, isLoading = false, searchQuery = '' }) {
  const [expandedClaims, setExpandedClaims] = useState(new Set());
  const [isExpanded, setIsExpanded] = useState(false);

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-black/20 p-3 mt-3">
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
      <div className="bg-white rounded-lg border border-black/20 p-3 mt-3">
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
      case 'verified_accurate':
        return <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>;
      case 'verified_inaccurate':
        return <svg className="w-3 h-3 text-red-600" fill="currentColor" viewBox="0 0 24 24"><path d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>;
      case 'partially_accurate':
        return <svg className="w-3 h-3 text-yellow-600" fill="currentColor" viewBox="0 0 24 24"><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"/></svg>;
      case 'insufficient_evidence':
        return <svg className="w-3 h-3 text-orange-600" fill="currentColor" viewBox="0 0 24 24"><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"/></svg>;
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
      case 'verified_accurate': return 'text-green-700 bg-green-50 border-green-200';
      case 'verified_inaccurate': return 'text-red-700 bg-red-50 border-red-200';
      case 'partially_accurate': return 'text-yellow-700 bg-yellow-50 border-yellow-200';
      case 'insufficient_evidence': return 'text-orange-700 bg-orange-50 border-orange-200';
      case 'likely_accurate': return 'text-green-700 bg-green-50 border-green-200';
      case 'needs_verification': return 'text-yellow-700 bg-yellow-50 border-yellow-200';
      case 'likely_inaccurate': return 'text-red-700 bg-red-50 border-red-200';
      default: return 'text-gray-700 bg-gray-50 border-gray-200';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'verified_accurate': return 'Verified Accurate';
      case 'verified_inaccurate': return 'Verified Inaccurate';
      case 'partially_accurate': return 'Partially Accurate';
      case 'insufficient_evidence': return 'Insufficient Evidence';
      case 'likely_accurate': return 'Likely Accurate';
      case 'needs_verification': return 'Needs Verification';
      case 'likely_inaccurate': return 'Questionable';
      case 'unverifiable': return 'Unverifiable';
      default: return 'Unknown';
    }
  };

  return (
    <div className="bg-white rounded-lg border border-black/20 mt-3">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-start justify-between p-2 sm:p-3 text-left hover:bg-gray-50"
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <svg className={`w-4 h-4 flex-shrink-0 transition-transform ${isExpanded ? 'rotate-90' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
              <span className="text-xs sm:text-sm font-semibold text-gray-900">Fact Check</span>
              {factCheckResults.grounding?.searchPerformed && (
                <span className="text-[10px] sm:text-xs text-green-700 bg-green-50 px-1 sm:px-2 py-0.5 rounded-full border border-green-200 whitespace-nowrap">
                  ✓ Verified
                </span>
              )}
            </div>
            <div className="text-[10px] sm:text-xs text-gray-600 mt-0.5 sm:hidden">
              {factCheckResults.claims.length} claim{factCheckResults.claims.length !== 1 ? 's' : ''}
              {factCheckResults.grounding?.sources?.length > 0 && (
                <span className="ml-1">• {factCheckResults.grounding.sources.length} source{factCheckResults.grounding.sources.length !== 1 ? 's' : ''}</span>
              )}
            </div>
          </div>
        </div>
        <div className="text-xs text-gray-600 ml-2 flex-shrink-0 hidden sm:block">
          {factCheckResults.claims.length} claim{factCheckResults.claims.length !== 1 ? 's' : ''} analyzed
          {factCheckResults.grounding?.sources?.length > 0 && (
            <span className="ml-2">• {factCheckResults.grounding.sources.length} source{factCheckResults.grounding.sources.length !== 1 ? 's' : ''} found</span>
          )}
        </div>
      </button>

      {isExpanded && (
        <div className="px-3 pb-3 border-t border-black/10">

          <div className="mt-2 space-y-2">
        {factCheckResults.claims.map((claim) => {
          const isExpanded = expandedClaims.has(claim.id);
          return (
            <div key={claim.id} className={`border rounded-lg p-2 ${getStatusColor(claim.status)}`}>
              <div className="flex items-start gap-2">
                {getStatusIcon(claim.status)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-gray-900 truncate pr-2">
                      &ldquo;<SearchHighlight text={claim.text} searchQuery={searchQuery} />&rdquo;
                    </p>
                    <span className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 bg-white rounded-full">
                      <SearchHighlight text={getStatusLabel(claim.status)} searchQuery={searchQuery} />
                    </span>
                  </div>
                  
                  {claim.originalPoint && (
                    <div className="mt-1 p-1.5 bg-gray-100 rounded-lg text-[10px] text-gray-600">
                      <span className="font-medium">From point:</span> <SearchHighlight text={claim.originalPoint} searchQuery={searchQuery} />
                    </div>
                  )}
                  
                  {claim.explanation && (
                    <p className="text-[11px] text-gray-700 mt-1">
                      <SearchHighlight text={claim.explanation} searchQuery={searchQuery} />
                    </p>
                  )}
                  
                  {claim.evidence && (
                    <div className="mt-1 p-1.5 bg-white/50 rounded text-[10px] text-gray-700">
                      <span className="font-medium">Evidence:</span> <SearchHighlight text={claim.evidence} searchQuery={searchQuery} />
                    </div>
                  )}
                  
                  {claim.lastUpdated && (
                    <div className="text-[10px] text-gray-500 mt-1">
                      Last verified: {claim.lastUpdated}
                    </div>
                  )}
                  
                  {(claim.webSearchResults || factCheckResults.grounding?.sources?.length > 0) && (
                    <button
                      onClick={() => toggleClaim(claim.id)}
                      className="text-[11px] text-gray-800 hover:text-black underline mt-1"
                    >
                      {isExpanded ? 'Hide' : 'Show'} verification sources
                    </button>
                  )}
                </div>
              </div>

              {isExpanded && (claim.webSearchResults || factCheckResults.grounding?.sources?.length > 0) && (
                <div className="mt-2 pt-2 border-t border-gray-300">
                  
                  {/* Display grounding sources (from Google Search grounding) */}
                  {factCheckResults.grounding?.sources?.length > 0 && (
                    <div className="mb-3">
                      <div className="text-[11px] text-gray-600 mb-1 font-medium">
                        ✓ Verified Sources:
                      </div>
                      <div className="text-[11px]">
                        {factCheckResults.grounding.sources.map((source, idx) => (
                          <span key={idx}>
                            <a 
                              href={source.uri} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="hover:underline text-blue-700"
                            >
                              <SearchHighlight text={source.title} searchQuery={searchQuery} />
                            </a>
                            {idx < factCheckResults.grounding.sources.length - 1 && ', '}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Display legacy web search results if available */}
                  {claim.webSearchResults && (
                    <div>
                      <div className="text-[11px] text-gray-600 mb-2">
                        Search results for: &ldquo;<SearchHighlight text={claim.webSearchResults.searchTerm} searchQuery={searchQuery} />&rdquo;
                      </div>
                      <div className="space-y-1">
                        {claim.webSearchResults.results.map((result, idx) => (
                          <div key={idx} className="bg-white rounded-lg border border-gray-200 p-2">
                            <div className="text-[11px] font-medium text-gray-900 mb-1 break-words">
                              {result.url !== '#' ? (
                                <a 
                                  href={result.url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="hover:underline break-words"
                                >
                                  <SearchHighlight text={result.title} searchQuery={searchQuery} />
                                </a>
                              ) : (
                                <SearchHighlight text={result.title} searchQuery={searchQuery} />
                              )}
                            </div>
                            <p className="text-[10px] text-gray-700 mb-1 break-words">
                              <SearchHighlight text={result.snippet} searchQuery={searchQuery} />
                            </p>
                            <div className="text-[10px] text-gray-500 break-words">
                              Source: <SearchHighlight text={result.source} searchQuery={searchQuery} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

          {factCheckResults.summary && (
            <div className="mt-2 pt-2 border-t border-black/10">
              <div className="text-[11px] text-gray-600">
                {/* Display accuracy for grounded results */}
                {factCheckResults.summary.accuracy && (
                  <div>
                    Overall accuracy: <span className="font-medium capitalize">{factCheckResults.summary.accuracy}</span>
                    {factCheckResults.summary.verifiedClaims > 0 && (
                      <span className="ml-2">
                        • {factCheckResults.summary.verifiedClaims} claim{factCheckResults.summary.verifiedClaims !== 1 ? 's' : ''} verified
                      </span>
                    )}
                  </div>
                )}
                
                {/* Fallback to confidence for legacy results */}
                {!factCheckResults.summary.accuracy && factCheckResults.summary.overallConfidence && (
                  <div>
                    Overall confidence: <span className="font-medium capitalize">{factCheckResults.summary.overallConfidence}</span>
                    {factCheckResults.summary.needsVerification > 0 && (
                      <span className="ml-2">
                        • {factCheckResults.summary.needsVerification} claim{factCheckResults.summary.needsVerification !== 1 ? 's' : ''} need verification
                      </span>
                    )}
                  </div>
                )}
                
                {/* Display search status */}
                {factCheckResults.summary.searchPerformed !== undefined && (
                  <div className="mt-1 text-[10px] text-gray-500">
                    {factCheckResults.summary.searchPerformed ? '✓ Verified with Google Search' : 'No web search performed'}
                    {factCheckResults.summary.sourcesFound > 0 && (
                      <span className="ml-2">• {factCheckResults.summary.sourcesFound} source{factCheckResults.summary.sourcesFound !== 1 ? 's' : ''} found</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}