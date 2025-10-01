/**
 * Migration utility to add slugs to existing discussions
 * Run this once to add slugs to discussions that were created before the slug feature
 */

import { db } from './firebase';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { generateUniqueSlug } from './slugUtils';

/**
 * Add slugs to all discussions that don't have one
 * @returns {Promise<{updated: number, errors: number}>}
 */
export async function migrateDiscussionSlugs() {
  try {
    console.log('Starting discussion slug migration...');
    
    const discussionsRef = collection(db, 'discussions');
    const querySnapshot = await getDocs(discussionsRef);
    
    let updated = 0;
    let errors = 0;
    const usedSlugs = new Set();
    
    // First pass - collect existing slugs
    querySnapshot.forEach((docSnapshot) => {
      const data = docSnapshot.data();
      if (data.slug) {
        usedSlugs.add(data.slug);
      }
    });
    
    console.log(`Found ${usedSlugs.size} discussions with existing slugs`);
    
    // Second pass - add slugs to discussions without them
    const updatePromises = [];
    
    querySnapshot.forEach((docSnapshot) => {
      const data = docSnapshot.data();
      
      // Only update if discussion doesn't have a slug
      if (!data.slug && data.title) {
        const discussionId = docSnapshot.id;
        let slug = generateUniqueSlug(data.title, discussionId);
        
        // Ensure slug is unique (shouldn't happen with ID suffix, but just in case)
        let counter = 1;
        while (usedSlugs.has(slug)) {
          slug = `${slug}-${counter}`;
          counter++;
        }
        
        usedSlugs.add(slug);
        
        const docRef = doc(db, 'discussions', discussionId);
        const updatePromise = updateDoc(docRef, { slug })
          .then(() => {
            console.log(`✓ Updated discussion ${discussionId}: ${data.title} -> ${slug}`);
            updated++;
          })
          .catch((error) => {
            console.error(`✗ Failed to update discussion ${discussionId}:`, error);
            errors++;
          });
        
        updatePromises.push(updatePromise);
      }
    });
    
    // Wait for all updates to complete
    await Promise.all(updatePromises);
    
    console.log(`\nMigration complete!`);
    console.log(`Updated: ${updated} discussions`);
    console.log(`Errors: ${errors} discussions`);
    
    return { updated, errors };
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

/**
 * Check how many discussions need slug migration
 * @returns {Promise<{total: number, withSlugs: number, needsSlugs: number}>}
 */
export async function checkSlugMigrationStatus() {
  try {
    const discussionsRef = collection(db, 'discussions');
    const querySnapshot = await getDocs(discussionsRef);
    
    let total = 0;
    let withSlugs = 0;
    let needsSlugs = 0;
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      total++;
      
      if (data.slug) {
        withSlugs++;
      } else {
        needsSlugs++;
      }
    });
    
    return { total, withSlugs, needsSlugs };
  } catch (error) {
    console.error('Failed to check migration status:', error);
    throw error;
  }
}
