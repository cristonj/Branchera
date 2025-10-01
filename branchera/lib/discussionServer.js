/**
 * Server-side functions for fetching discussion data
 * These functions run on the server and can be used in Server Components
 */

import { db } from './firebase';
import { collection, query, where, getDocs, limit as firestoreLimit } from 'firebase/firestore';

/**
 * Fetch a discussion by its slug (server-side)
 * @param {string} slug - The discussion slug
 * @returns {Promise<Object|null>} The discussion data or null if not found
 */
export async function getDiscussionBySlugServer(slug) {
  try {
    if (!slug) {
      return null;
    }

    // Query Firestore for discussion with matching slug
    const discussionsRef = collection(db, 'discussions');
    const q = query(
      discussionsRef,
      where('slug', '==', slug),
      firestoreLimit(1)
    );

    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return null;
    }

    const doc = querySnapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data()
    };
  } catch (error) {
    console.error('Error fetching discussion by slug:', error);
    return null;
  }
}

/**
 * Fetch all discussion slugs for static generation
 * @returns {Promise<Array<{slug: string}>>} Array of discussion slugs
 */
export async function getAllDiscussionSlugs() {
  try {
    const discussionsRef = collection(db, 'discussions');
    const querySnapshot = await getDocs(discussionsRef);

    const slugs = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.slug) {
        slugs.push({ slug: data.slug });
      }
    });

    return slugs;
  } catch (error) {
    console.error('Error fetching discussion slugs:', error);
    return [];
  }
}

/**
 * Generate metadata for a discussion page
 * @param {Object} discussion - The discussion data
 * @returns {Object} Metadata object for Next.js
 */
export function generateDiscussionMetadata(discussion) {
  if (!discussion) {
    return {
      title: 'Discussion Not Found',
      description: 'The requested discussion could not be found.'
    };
  }

  const title = `${discussion.title} | Branches`;
  const description = discussion.content.length > 160 
    ? `${discussion.content.substring(0, 157)}...` 
    : discussion.content;
  
  const publishedTime = discussion.createdAt;
  const modifiedTime = discussion.editedAt || discussion.updatedAt || discussion.createdAt;
  
  return {
    title,
    description,
    keywords: [
      'discussion',
      'conversation',
      ...(discussion.tags || []),
      discussion.authorName
    ].filter(Boolean),
    authors: [{ name: discussion.authorName }],
    creator: discussion.authorName,
    publisher: 'Branches',
    openGraph: {
      title: discussion.title,
      description,
      type: 'article',
      publishedTime,
      modifiedTime,
      authors: [discussion.authorName],
      tags: discussion.tags || [],
      siteName: 'Branches',
      url: `https://branches.live/discussion/${discussion.slug}`,
      images: [
        {
          url: '/og-image.png',
          width: 1200,
          height: 630,
          alt: discussion.title,
        }
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: discussion.title,
      description,
      creator: '@branches',
      images: ['/og-image.png'],
    },
    alternates: {
      canonical: `https://branches.live/discussion/${discussion.slug}`,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };
}

/**
 * Generate JSON-LD structured data for a discussion
 * @param {Object} discussion - The discussion data
 * @returns {Object} JSON-LD structured data
 */
export function generateDiscussionStructuredData(discussion) {
  if (!discussion) return null;

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'DiscussionForumPosting',
    headline: discussion.title,
    articleBody: discussion.content,
    datePublished: discussion.createdAt,
    dateModified: discussion.editedAt || discussion.updatedAt || discussion.createdAt,
    author: {
      '@type': 'Person',
      name: discussion.authorName,
      image: discussion.authorPhoto || undefined,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Branches',
      logo: {
        '@type': 'ImageObject',
        url: 'https://branches.live/logo.svg'
      }
    },
    interactionStatistic: [
      {
        '@type': 'InteractionCounter',
        interactionType: 'https://schema.org/LikeAction',
        userInteractionCount: discussion.likes || 0
      },
      {
        '@type': 'InteractionCounter',
        interactionType: 'https://schema.org/CommentAction',
        userInteractionCount: discussion.replyCount || 0
      },
      {
        '@type': 'InteractionCounter',
        interactionType: 'https://schema.org/ViewAction',
        userInteractionCount: discussion.views || 0
      }
    ],
    comment: (discussion.replies || []).map(reply => ({
      '@type': 'Comment',
      text: reply.content,
      dateCreated: reply.createdAt,
      author: {
        '@type': 'Person',
        name: reply.authorName,
        image: reply.authorPhoto || undefined,
      }
    })),
    keywords: (discussion.tags || []).join(', '),
    url: `https://branches.live/discussion/${discussion.slug}`,
  };

  // Add news article specific data if it's a news discussion
  if (discussion.tags?.includes('News') && discussion.metadata?.newsStory) {
    const newsStory = discussion.metadata.newsStory;
    structuredData['@type'] = 'NewsArticle';
    
    if (newsStory.source) {
      structuredData.isBasedOn = {
        '@type': 'NewsArticle',
        headline: newsStory.source.groundingTitle || discussion.title,
        url: newsStory.source.url,
        publisher: {
          '@type': 'Organization',
          name: newsStory.source.name
        },
        datePublished: newsStory.source.publishedAt
      };
    }
  }

  return structuredData;
}
