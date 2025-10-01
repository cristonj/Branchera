import { getAllDiscussionSlugs } from '@/lib/discussionServer';

/**
 * Generate a dynamic sitemap for the site
 * This helps search engines discover and index all discussion pages
 */
export default async function sitemap() {
  const baseUrl = 'https://branches.live';

  // Static pages
  const staticPages = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/feed`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
  ];

  // Dynamic discussion pages
  let discussionPages = [];
  try {
    const discussions = await getAllDiscussionSlugs();
    discussionPages = discussions.map((discussion) => ({
      url: `${baseUrl}/discussion/${discussion.slug}`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    }));
  } catch (error) {
    console.error('Error generating sitemap for discussions:', error);
  }

  return [...staticPages, ...discussionPages];
}
