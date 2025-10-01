/**
 * Utility functions for generating and managing URL slugs
 */

/**
 * Convert a string to a URL-friendly slug
 * @param {string} text - The text to convert to a slug
 * @returns {string} The slugified text
 */
export function slugify(text) {
  if (!text) return '';
  
  return text
    .toString()
    .toLowerCase()
    .trim()
    // Replace spaces with hyphens
    .replace(/\s+/g, '-')
    // Remove all non-word chars except hyphens
    .replace(/[^\w\-]+/g, '')
    // Replace multiple hyphens with single hyphen
    .replace(/\-\-+/g, '-')
    // Remove leading/trailing hyphens
    .replace(/^-+/, '')
    .replace(/-+$/, '')
    // Limit length to 100 characters for reasonable URLs
    .substring(0, 100)
    // Remove trailing hyphen if substring cut in middle of word
    .replace(/-+$/, '');
}

/**
 * Generate a unique slug by appending a timestamp-based suffix
 * @param {string} baseSlug - The base slug to make unique
 * @param {string} discussionId - Optional discussion ID to use as suffix
 * @returns {string} A unique slug
 */
export function generateUniqueSlug(baseSlug, discussionId = null) {
  const slug = slugify(baseSlug);
  
  if (!slug) {
    // Fallback if no valid slug could be generated from title
    return `discussion-${Date.now()}`;
  }
  
  // If we have a discussion ID (Firebase doc ID), use last 8 chars for uniqueness
  if (discussionId) {
    const suffix = discussionId.substring(discussionId.length - 8);
    return `${slug}-${suffix}`;
  }
  
  // Otherwise use timestamp for uniqueness
  const timestamp = Date.now().toString(36); // Base36 for shorter string
  return `${slug}-${timestamp}`;
}

/**
 * Extract the base slug without the unique suffix
 * @param {string} fullSlug - The complete slug with suffix
 * @returns {string} The base slug without suffix
 */
export function getBaseSlug(fullSlug) {
  if (!fullSlug) return '';
  
  // Remove the last segment (after the last hyphen) which is usually the unique ID
  const parts = fullSlug.split('-');
  if (parts.length > 1) {
    parts.pop();
    return parts.join('-');
  }
  
  return fullSlug;
}

/**
 * Validate if a slug is in correct format
 * @param {string} slug - The slug to validate
 * @returns {boolean} True if slug is valid
 */
export function isValidSlug(slug) {
  if (!slug || typeof slug !== 'string') return false;
  
  // Check if slug only contains lowercase letters, numbers, and hyphens
  // Must not start or end with hyphen, no consecutive hyphens
  const slugRegex = /^[a-z0-9]+(-[a-z0-9]+)*$/;
  return slugRegex.test(slug) && slug.length <= 100;
}
