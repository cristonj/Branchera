# Firebase Setup for Branchera

## Overview
This project is configured to use Firebase for:
- **Authentication** - User sign-in/sign-up
- **Firestore** - NoSQL database
- **Storage** - File storage
- **Analytics** - User behavior tracking

## Project Structure

```
branchera/
├── lib/
│   ├── firebase.js         # Firebase initialization
│   └── firebase-config.js  # Firebase configuration
├── hooks/
│   ├── useAuth.js          # Authentication hook
│   └── useFirestore.js     # Firestore database hook
└── components/
    └── FirebaseProvider.js  # Firebase context provider
```

## Features Included

### Authentication (`useAuth` hook)
- Email/Password authentication
- Google Sign-In
- User state management
- Sign up, sign in, and logout functions

### Firestore Database (`useFirestore` hook)
- Add documents
- Update documents
- Delete documents
- Get single or multiple documents
- Real-time subscriptions
- Query helpers (where, orderBy, limit)

### Analytics
- Automatically initialized in the browser
- Tracks user interactions and page views

## Usage Examples

### Authentication
```javascript
import { useAuth } from '@/hooks/useAuth';

function LoginComponent() {
  const { user, loading, signIn, signInWithGoogle, logout } = useAuth();

  if (loading) return <div>Loading...</div>;
  
  if (user) {
    return (
      <div>
        Welcome {user.email}!
        <button onClick={logout}>Logout</button>
      </div>
    );
  }

  return (
    <div>
      <button onClick={() => signIn('email@example.com', 'password')}>
        Sign In
      </button>
      <button onClick={signInWithGoogle}>
        Sign In with Google
      </button>
    </div>
  );
}
```

### Firestore Database
```javascript
import { useFirestore } from '@/hooks/useFirestore';

function PostsComponent() {
  const { addDocument, getDocuments, where, orderBy } = useFirestore();

  // Add a new post
  const createPost = async () => {
    const postId = await addDocument('posts', {
      title: 'My Post',
      content: 'Post content',
      authorId: 'user123'
    });
    console.log('Created post:', postId);
  };

  // Get all posts by a user
  const getUserPosts = async (userId) => {
    const posts = await getDocuments('posts', [
      where('authorId', '==', userId),
      orderBy('createdAt', 'desc')
    ]);
    return posts;
  };
}
```

## Security Notes

1. **Firebase Config**: Currently hardcoded in `firebase-config.js`. For production, consider using environment variables.

2. **Security Rules**: Remember to set up proper Firebase Security Rules in the Firebase Console:
   - Firestore Security Rules
   - Storage Security Rules
   - Authentication settings

3. **API Key**: The Firebase API key is safe to expose in client-side code as security is enforced through Firebase Security Rules.

## Next Steps

1. **Enable Authentication Methods** in Firebase Console:
   - Go to Authentication > Sign-in method
   - Enable Email/Password and Google

2. **Set up Firestore**:
   - Go to Firestore Database
   - Create database in production or test mode
   - Set up security rules

3. **Configure Analytics**:
   - Analytics is auto-configured
   - View reports in Firebase Console

## Useful Links
- [Firebase Console](https://console.firebase.google.com/)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Next.js with Firebase](https://firebase.google.com/docs/web/setup)
