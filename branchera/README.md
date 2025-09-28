# Branchera Development Setup

This is the main application directory for Branchera, built with [Next.js](https://nextjs.org) and powered by Firebase and Google Gemini AI.

## 🚀 Quick Setup

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Firebase account
- Google Cloud account (for Gemini AI)

### Installation

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure Firebase**
   - Follow the detailed setup in [`FIREBASE_SETUP.md`](./FIREBASE_SETUP.md)
   - Set up Authentication, Firestore, and Functions

3. **Configure AI Services**
   - Follow the setup in [`GEMINI_SETUP.md`](./GEMINI_SETUP.md) 
   - Configure Gemini AI integration

4. **Set up Firestore Rules**
   - Follow [`FIREBASE_RULES.md`](./FIREBASE_RULES.md) for security setup

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🛠️ Development Scripts

```bash
# Start development server with Turbopack
npm run dev

# Build for production with Turbopack
npm run build

# Start production server
npm start

# Run linting
npm run lint
```

## 📁 Application Structure

```
app/
├── dashboard/          # Main user dashboard
├── feed/              # Discussion feed
├── login/             # Authentication pages
├── points/            # Points/rewards system
├── about/             # About page
├── privacy/           # Privacy policy
├── terms/             # Terms of service
└── api/
    └── web-search/    # Web search API endpoint

components/
├── DiscussionFeed.js     # Main discussion interface
├── DiscussionItem.js     # Individual discussion posts
├── FactCheckResults.js   # AI fact-checking display
├── PointsAnimation.js    # Gamification animations
├── ReplyTree.js          # Nested reply system
├── SearchFilterSort.js   # Search and filtering
├── TextDiscussionForm.js # Discussion creation
├── TopNav.js             # Navigation component
└── ToastNotification.js  # User notifications

contexts/
├── AuthContext.js      # User authentication state
└── ToastContext.js     # Toast notification system

hooks/
├── useAuth.js          # Authentication logic
├── useDatabase.js      # Database operations
├── useFirestore.js     # Firestore integration
├── usePolling.js       # Real-time updates
└── useUrlState.js      # URL state management

lib/
├── aiService.js        # AI/Gemini integration
├── firebase.js         # Firebase configuration
├── newsService.js      # News API integration
└── realtimeConfig.js   # Real-time features

functions/
├── index.js            # Firebase Functions
└── package.json        # Functions dependencies
```

## 🔧 Key Features Implementation

### AI-Powered Discussions
- **Point Extraction**: AI automatically identifies key discussion points
- **Fact Checking**: Real-time verification with source citations
- **Smart Replies**: AI-guided response categorization

### Real-time Features
- **Live Updates**: Discussions update in real-time
- **Polling System**: Efficient data synchronization
- **Notifications**: Toast-based user feedback

### Gamification
- **Points System**: Rewards for quality contributions
- **Visual Feedback**: Animations for user actions
- **Progress Tracking**: User engagement metrics

## 🔒 Security & Rules

**CRITICAL**: Before deploying, ensure you've set up:
1. **Firestore Security Rules** - See `firestore.rules`
2. **Authentication Rules** - Configured in Firebase Console
3. **API Key Security** - Environment variables for production

## 🎨 Styling & UI

- **Framework**: Tailwind CSS 4
- **Design System**: Custom components with consistent styling
- **Responsive**: Mobile-first design approach
- **Accessibility**: WCAG compliant components

## 🚀 Deployment

### Netlify (Current)
- Configured via `netlify.toml`
- Automatic deploys from main branch
- Environment variables set in Netlify dashboard

### Alternative Deployments
- **Vercel**: Next.js optimized hosting
- **Firebase Hosting**: Integrated with Firebase services

## 🧪 Testing & Development

```bash
# Run development server
npm run dev

# Build and test locally
npm run build && npm start

# Check for linting issues
npm run lint
```

## 📚 Documentation

- [`FIREBASE_SETUP.md`](./FIREBASE_SETUP.md) - Complete Firebase configuration
- [`GEMINI_SETUP.md`](./GEMINI_SETUP.md) - AI services setup  
- [`FIREBASE_RULES.md`](./FIREBASE_RULES.md) - Security rules documentation

## 🤝 Contributing

1. **Follow the coding standards** - ESLint configuration provided
2. **Test your changes** - Ensure all features work locally
3. **Update documentation** - Keep setup guides current
4. **Security first** - Never commit API keys or credentials

## 🔗 Useful Links

- [Next.js Documentation](https://nextjs.org/docs)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Google Gemini AI](https://ai.google.dev/)

---

*Building social media that respects your intelligence* 🧠✨
