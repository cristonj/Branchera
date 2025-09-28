# Branches
**Grows With You • Not Owned by a Billionaire**

[![Netlify Status](https://api.netlify.com/api/v1/badges/eee5ae77-ff80-46b7-8a37-b38af43fde8e/deploy-status)](https://app.netlify.com/projects/branches/deploys)

> *"What if social media was about maximizing constructive dialogue instead of engagement?"*

Branches is an open-source social platform designed for thoughtful discourse, not endless scrolling. Built with transparency, powered by AI, and committed to being forever free and ad-free. Not owned by a billionaire.

## ✨ Core Features

### 🔍 **AI-Powered Fact Checking**
- Real-time fact verification using Gemini AI
- Transparent web search with source citations
- See exactly how claims are verified

### 🎯 **Smart Point Extraction**
- AI automatically identifies key discussion points
- Navigate complex conversations with ease
- Respond to specific arguments, not entire posts

### 🌟 **Quality Over Quantity**
- Text-based discussions reward depth over viral content
- No likes, no vanity metrics, no engagement algorithms
- Focus on substance, not popularity

### 🔓 **100% Open Source**
- Every line of code is public and auditable
- No black boxes, no secret algorithms
- Community-driven development

### 🚫 **Forever Free & Independent**
- No ads, no premium tiers, no paywalls
- Built as a public good, not a profit center  
- Not owned by a billionaire
- Funded by community support, not data harvesting

## 🛠️ Technology Stack

- **Frontend**: Next.js 15.5.4 with React 19
- **Styling**: Tailwind CSS 4
- **Backend**: Firebase (Authentication, Firestore, Functions)
- **AI**: Google Gemini AI via Firebase AI
- **Deployment**: Netlify
- **Language**: JavaScript/Node.js

## 🚀 Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/branches.git
   cd branches
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Firebase**
   - Follow the setup guide in `branches/FIREBASE_SETUP.md`
   - Configure authentication and Firestore

4. **Set up AI services**
   - Follow the setup guide in `branches/GEMINI_SETUP.md`
   - Configure Gemini AI integration

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
branches/
├── app/                    # Next.js app directory
│   ├── dashboard/          # Main dashboard
│   ├── feed/              # Discussion feed
│   ├── login/             # Authentication
│   └── api/               # API routes
├── components/            # React components
│   ├── DiscussionFeed.js  # Main discussion interface
│   ├── FactCheckResults.js # AI fact-checking display
│   └── TopNav.js          # Navigation
├── contexts/              # React contexts
│   ├── AuthContext.js     # User authentication
│   └── ToastContext.js    # Notifications
├── hooks/                 # Custom React hooks
│   ├── useAuth.js         # Authentication logic
│   ├── useFirestore.js    # Database operations
│   └── usePolling.js      # Real-time updates
├── lib/                   # Utility libraries
│   ├── aiService.js       # AI integration
│   ├── firebase.js        # Firebase config
│   └── newsService.js     # News API integration
└── functions/             # Firebase Functions
    └── index.js           # Server-side AI processing
```

## 🎯 Core Philosophy

### **"Attack Arguments, Not People"**
The golden rule of constructive discourse. Branches is built around this principle, encouraging users to engage with ideas rather than attacking individuals.

### **Transparency First**
- Open source codebase
- Transparent AI fact-checking with source citations
- Clear community guidelines and moderation policies

### **Respect for Intelligence**
- No algorithmic manipulation
- No dark patterns or engagement hacking
- Clean, distraction-free interface

### **Community-Driven**
- Built by the community, for the community
- Not owned by a billionaire
- Feature requests and roadmap decided collectively
- Sustainable through community support

## 🔮 Coming Soon

- **📱 Native Mobile Apps** - iOS and Android with offline reading
- **🤝 Live Collaboration** - Real-time collaborative editing
- **🛡️ Smart Moderation** - AI-assisted community moderation
- **🌍 Global Discussions** - Multi-language support with AI translation

## 🤝 Contributing

We welcome contributions! Whether you're fixing bugs, adding features, or improving documentation, every contribution helps make Branches better.

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Commit your changes** (`git commit -m 'Add some amazing feature'`)
4. **Push to the branch** (`git push origin feature/amazing-feature`)
5. **Open a Pull Request**

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🌟 Community

- **Website**: [branches.app](https://branches.app)
- **GitHub**: [github.com/yourusername/branches](https://github.com/yourusername/branches)
- **Discussions**: Join our community discussions on the platform itself!

## 💡 Vision

Branches represents a different vision for social media - one where:
- Quality trumps quantity
- Transparency beats black boxes
- Community needs come before corporate profits
- Constructive dialogue is prioritized over viral content

Join us in building social media that respects your intelligence and values your time.

---

*Built with ❤️ by the open source community*
