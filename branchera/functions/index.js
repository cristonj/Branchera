// Firebase Functions for AI-Anchored Replies
// This file sets up server-side AI point generation triggers using Firebase AI

const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
admin.initializeApp();

// Firestore trigger to generate AI points when a new discussion is created
exports.generateAIPointsOnCreate = functions.firestore
  .document('discussions/{discussionId}')
  .onCreate(async (snap, context) => {
    const discussionData = snap.data();
    const discussionId = context.params.discussionId;

    try {

      // Skip if AI points already exist
      if (discussionData.aiPointsGenerated || (discussionData.aiPoints && discussionData.aiPoints.length > 0)) {
        return null;
      }

      // Generate AI points using Firebase AI
      const aiPoints = await generateAIPointsWithFirebaseAI(discussionData.content, discussionData.title);

      // Update the discussion with generated points
      await snap.ref.update({
        aiPoints: aiPoints,
        aiPointsGenerated: true,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      return null;

    } catch (error) {
      // Don't throw error to prevent function retry loops
      return null;
    }
  });

// Firebase AI point generation using Gemini
async function generateAIPointsWithFirebaseAI(content, title = '') {
  // Note: For Firebase Functions, you might need to use the Admin SDK approach
  // This is a placeholder for the server-side Firebase AI integration
  // The exact implementation may vary based on Firebase AI availability in Functions
  
  
  // Fallback to a simple point extraction for server-side
  return generateSimplePoints(content, title);
}

// Simple server-side point extraction as fallback
function generateSimplePoints(content, title = '') {
  const points = [];
  let pointId = 1;

  // Extract key sentences
  const sentences = content.split(/[.!?]+/).filter(sentence => sentence.trim().length > 20);
  
  for (let i = 0; i < Math.min(sentences.length, 3); i++) {
    const sentence = sentences[i].trim();
    if (sentence.length > 20) {
      let pointType = 'claim';
      let pointText = sentence.charAt(0).toUpperCase() + sentence.slice(1);

      // Simple categorization
      if (sentence.includes('because') || sentence.includes('evidence') || sentence.includes('data')) {
        pointType = 'evidence';
      } else if (sentence.includes('should') || sentence.includes('recommend') || sentence.includes('suggest')) {
        pointType = 'recommendation';
      } else if (sentence.includes('?') || sentence.includes('what') || sentence.includes('how')) {
        pointType = 'question';
      }

      points.push({
        id: `p${pointId}`,
        text: pointText.length > 80 ? pointText.substring(0, 77) + '...' : pointText,
        type: pointType,
        originalSentence: sentence
      });
      pointId++;
    }
  }

  // Ensure at least one point
  if (points.length === 0) {
    points.push({
      id: 'p1',
      text: title || 'Main discussion topic',
      type: 'topic',
      originalSentence: title || content.substring(0, 50) + '...'
    });
  }

  return points;
}

// Export for testing
module.exports = { generateAIPointsWithFirebaseAI, generateSimplePoints };
