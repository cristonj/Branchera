# URGENT: Fix Firebase Permission Error

## The Problem
You're getting a "permission denied" error because your Firestore Security Rules are not set up correctly.

## Quick Fix Steps

### 1. Go to Firebase Console
1. Open [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **branchera-29fa6**

### 2. Set Up Firestore Rules
1. Click on **"Firestore Database"** in the left sidebar
2. Click on the **"Rules"** tab
3. Replace the existing rules with this code:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow authenticated users to read and write discussions
    match /discussions/{discussionId} {
      allow read, write: if request.auth != null;
    }
    
    // Allow authenticated users to read and write system documents
    match /system/{document} {
      allow read, write: if request.auth != null;
    }
  }
}
```

4. Click **"Publish"**

### 3. Alternative: Test Mode (Temporary)
If you want to test quickly, you can temporarily use test mode rules (⚠️ **NOT for production**):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.time < timestamp.date(2025, 2, 1);
    }
  }
}
```

### 4. Verify Your Authentication
Make sure you're logged in to the app. The rules require `request.auth != null`.

## After Setting Rules
1. Refresh your app
2. Try recording and posting a discussion again
3. The permission error should be resolved

## Production Rules (Use Later)
For production, use more restrictive rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /discussions/{discussionId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && request.auth.uid == resource.data.authorId;
      allow update: if request.auth != null;
      allow delete: if request.auth != null && request.auth.uid == resource.data.authorId;
    }
  }
}
```

## Storage Rules
Also check your Storage rules at **Storage → Rules**:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /discussions/{userId}/{filename} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    match /replies/{userId}/{filename} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

This should fix the permission error immediately!
