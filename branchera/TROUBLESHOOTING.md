# AI News Bot Troubleshooting Guide

## Issue: AI News Bot Not Making Posts

### Root Cause Identified ❌
The AI news bot is not working because **Firebase environment variables are missing**. 

### Diagnosis Results
- ❌ Firebase API Key: MISSING
- ❌ Firebase Project ID: MISSING  
- ❌ Firebase Auth Domain: MISSING
- ❌ All other Firebase configuration: MISSING

### Impact
Without Firebase configuration:
1. Firebase app initialization fails
2. Firebase AI (Gemini) cannot be accessed
3. NewsService cannot fetch news stories
4. No AI-generated discussion posts are created
5. The 15-minute timer check runs but fails silently

### Solution Steps

#### 1. Create Firebase Environment Configuration
Create a `.env.local` file in the project root with your Firebase project settings:

```bash
# Copy the example file
cp .env.local.example .env.local
```

Then edit `.env.local` with your actual Firebase project values:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_actual_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_actual_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abcdef123456
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
```

#### 2. Get Firebase Configuration Values
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (or create one if needed)
3. Go to Project Settings (gear icon)
4. Scroll down to "Your apps" section
5. Click on the web app or create one
6. Copy the configuration values

#### 3. Enable Required Firebase Services
Make sure these services are enabled in your Firebase project:
- **Authentication**: Enable Email/Password and Google sign-in
- **Firestore Database**: Create database in production mode
- **Firebase AI**: Should be automatically available with Gemini

#### 4. Test the Fix
After creating `.env.local`, test the configuration:

```bash
node test-firebase-config.js
```

You should see:
```
✅ Firebase configuration looks good!
```

#### 5. Restart the Development Server
```bash
npm run dev
```

### Verification
Once fixed, the AI news bot should:
1. ✅ Check every 15 minutes for new posts
2. ✅ Generate AI news discussions using Gemini
3. ✅ Create posts with proper fact-checking
4. ✅ Show "AI-Generated Discussion" indicators

### Additional Debugging
If issues persist after configuration:
1. Check browser console for Firebase errors
2. Verify Firestore security rules allow writes
3. Confirm Firebase AI/Gemini is enabled for your project
4. Check network connectivity to Firebase services

### Files Modified
- ✅ Created `.env.local.example` - Template for environment variables
- ✅ Created `test-firebase-config.js` - Configuration testing script
- ✅ Created `TROUBLESHOOTING.md` - This troubleshooting guide

### Related Files
- `lib/firebase.js` - Firebase initialization (checks for env vars)
- `lib/newsService.js` - AI news generation service
- `components/DiscussionFeed.js` - Triggers news bot every 15 minutes