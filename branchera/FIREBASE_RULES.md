# Firebase Security Rules Setup

## Firestore Rules

Add these rules to your Firestore Database in the Firebase Console:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // System collection for initialization
    match /system/{document} {
      allow read, write: if request.auth != null;
    }
    
    // Allow users to read all discussions
    match /discussions/{discussionId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && request.auth.uid == resource.data.authorId;
      allow update: if request.auth != null;
      allow delete: if request.auth != null && request.auth.uid == resource.data.authorId;
    }
  }
}
```

## Firebase Storage Rules

Add these rules to your Firebase Storage in the Firebase Console:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Allow users to upload audio files to their own directory
    match /discussions/{userId}/{filename} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Allow users to upload reply audio files to their own directory
    match /replies/{userId}/{filename} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## How to Apply Rules

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. For Firestore:
   - Go to "Firestore Database" → "Rules"
   - Replace the existing rules with the Firestore rules above
   - Click "Publish"
4. For Storage:
   - Go to "Storage" → "Rules"
   - Replace the existing rules with the Storage rules above
   - Click "Publish"

## What These Rules Do

### Firestore Rules:
- **Read**: Any authenticated user can read all discussions
- **Create**: Only authenticated users can create discussions, and only with their own user ID as authorId
- **Update**: Any authenticated user can update discussions (for likes/plays)

### Storage Rules:
- **Read**: Any authenticated user can read audio files
- **Write**: Users can only upload files to their own directory (`discussions/{userId}/` and `replies/{userId}/`)

These rules ensure security while allowing the app to function properly.

## Firestore Indexes

The app will automatically create the necessary indexes when you first use the ordering features. However, you can manually create them in the Firebase Console:

### Required Indexes for Discussions Collection:

1. **For ordering by creation date:**
   - Collection: `discussions`
   - Fields: `createdAt` (Descending)
   - Query scope: Collection

2. **For ordering by popularity (likes):**
   - Collection: `discussions`
   - Fields: `likes` (Descending), `createdAt` (Descending)
   - Query scope: Collection

3. **For ordering by activity (plays):**
   - Collection: `discussions`
   - Fields: `plays` (Descending), `createdAt` (Descending)
   - Query scope: Collection

### How to Create Indexes:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to "Firestore Database" → "Indexes"
4. Click "Create Index"
5. Add the fields and directions as specified above

**Note:** The app includes fallback logic that will work even without indexes, but performance will be better with proper indexing.

## Database Initialization

The app automatically:
- Creates necessary collections on first use
- Sets up proper document structure
- Validates data before saving
- Provides fallback mechanisms for reliability

No manual database setup is required - everything is handled automatically when users first interact with the app.
