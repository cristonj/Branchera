/**
 * Generate robots.txt dynamically
 * This tells search engines which pages they can crawl and index
 */
export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/settings',
          '/dashboard',
          '/points',
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: [
          '/api/',
          '/settings',
          '/dashboard',
          '/points',
        ],
      },
    ],
    sitemap: 'https://branches.live/sitemap.xml',
  };
}
