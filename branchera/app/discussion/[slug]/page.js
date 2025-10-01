import { getDiscussionBySlugServer, generateDiscussionMetadata, generateDiscussionStructuredData } from '@/lib/discussionServer';
import { notFound } from 'next/navigation';
import PublicDiscussionView from '@/components/PublicDiscussionView';

// Enable dynamic rendering for this page
export const dynamic = 'force-dynamic';
export const revalidate = 60; // Revalidate every 60 seconds for fresh content

/**
 * Generate metadata for the discussion page (for SEO)
 */
export async function generateMetadata({ params }) {
  const { slug } = await params;
  const discussion = await getDiscussionBySlugServer(slug);
  
  return generateDiscussionMetadata(discussion);
}

/**
 * Public discussion page - accessible without authentication
 * All content is rendered server-side for SEO
 */
export default async function DiscussionPage({ params }) {
  const { slug } = await params;
  
  // Fetch discussion data on the server
  const discussion = await getDiscussionBySlugServer(slug);
  
  // Return 404 if discussion not found
  if (!discussion) {
    notFound();
  }
  
  // Generate structured data for search engines
  const structuredData = generateDiscussionStructuredData(discussion);
  
  return (
    <>
      {/* Structured Data (JSON-LD) for search engines */}
      {structuredData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      )}
      
      {/* Main Discussion Content - fully rendered for SEO */}
      <PublicDiscussionView discussion={discussion} />
    </>
  );
}
