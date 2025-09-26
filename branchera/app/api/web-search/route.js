import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { searchTerm } = await request.json();
    
    if (!searchTerm) {
      return NextResponse.json(
        { error: 'Search term is required' },
        { status: 400 }
      );
    }

    console.log('API: Legacy web search endpoint called for:', searchTerm);
    
    // Note: This endpoint is now primarily a fallback since Firebase AI Logic
    // with Google Search grounding handles web search automatically.
    // This API is kept for backward compatibility or custom search needs.
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Provide fallback results when Firebase AI Logic grounding is not available
    const fallbackResults = [
      {
        title: `Fallback Search for "${searchTerm}"`,
        snippet: `This is a fallback search result. Firebase AI Logic with Google Search grounding is now the primary method for fact verification, providing real-time web search results automatically.`,
        url: `https://firebase.google.com/docs/ai-logic/grounding-google-search`,
        source: "Firebase AI Logic Documentation"
      },
      {
        title: "Google Search Grounding",
        snippet: `Firebase AI Logic now supports grounding with Google Search, providing real-time verification of factual claims with actual web sources.`,
        url: "https://firebase.google.com/docs/ai-logic/grounding-google-search",
        source: "Firebase Documentation"
      }
    ];

    return NextResponse.json({
      results: fallbackResults,
      searchTerm,
      timestamp: new Date().toISOString(),
      note: "This is a fallback endpoint. Firebase AI Logic with Google Search grounding is now the primary fact verification method."
    });

  } catch (error) {
    console.error('Web search API error:', error);
    return NextResponse.json(
      { error: 'Failed to perform web search' },
      { status: 500 }
    );
  }
}