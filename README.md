<div align="center">
  <h1>💡 IdeaVault</h1>
  <p><strong>An AI-powered marketplace where innovative project ideas meet exclusive community discovery</strong></p>
  
  [![Live Demo](https://img.shields.io/website?down_color=red&down_message=offline&label=Live&up_color=brightgreen&up_message=online&url=https%3A%2F%2Fideavault-10023367050.asia-south1.run.app)](https://ideavault-10023367050.asia-south1.run.app/)
  [![Built with React](https://img.shields.io/badge/React-19-61dafb?style=flat-square&logo=react)](https://react.dev)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178c6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
  [![Firebase](https://img.shields.io/badge/Firebase-Realtime-ffca28?style=flat-square&logo=firebase)](https://firebase.google.com)
  [![AI Powered](https://img.shields.io/badge/AI%20Powered-Google%20Gemini-f57c00?style=flat-square)](https://ai.google.dev)
</div>

---

## 🎯 Overview

IdeaVault is a full-stack web application that combines **AI-powered idea generation** with a **community-driven marketplace**. Users can discover, vote on, purchase, and sell innovative project concepts with detailed tech stacks, complexity ratings, and implementation roadmaps.

Perfect for developers looking to start their next project or entrepreneurs seeking fresh ideas to build.

---

## ✨ Key Features

- 🤖 **AI-Powered Idea Generation** – Generate unique project ideas using Google Gemini
- 🏪 **Idea Marketplace** – Buy and sell innovative project concepts with transparent pricing
- 🗳️ **Community Voting System** – Upvote/downvote ideas and discover trending concepts
- 🔐 **Secure Authentication** – Google Sign-in with Firebase Authentication
- 💳 **Payment Integration** – Razorpay integration for seamless transactions
- 🎨 **Responsive Design** – Beautiful UI with Tailwind CSS and smooth animations
- 📊 **User Dashboard** – Manage your profile, purchased ideas, and created concepts
- 🎯 **Detailed Metadata** – Each idea includes tech stack, features, complexity, and estimated duration
- 🌐 **Real-time Sync** – Firestore real-time updates for live marketplace data

---

## 🛠️ Tech Stack

### Frontend
- **React 19** – Modern UI framework with hooks
- **TypeScript** – Type-safe development
- **Tailwind CSS 4** – Utility-first styling with Vite
- **Motion** – Smooth animations and transitions
- **Vite** – Lightning-fast build tool

### Backend
- **Express.js** – RESTful API server
- **Node.js** – JavaScript runtime
- **Firebase Admin SDK** – Secure backend operations

### Database & Services
- **Firebase Firestore** – Real-time NoSQL database
- **Firebase Authentication** – OAuth & email authentication
- **Google Generative AI** – AI idea generation
- **Razorpay** – Payment processing

### Deployment
- **Google Cloud Run** – Containerized deployment

---

## 🚀 Live Demo

**[👉 Visit IdeaVault →](https://ideavault-10023367050.asia-south1.run.app/)**

Experience the marketplace live and explore innovative project ideas!

---

## 📋 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Firebase project setup
- Google Generative AI API key
- Razorpay account (for payment features)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/OmShrivastava19/IdeaVault.git
   cd IdeaVault
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   
   Create a `.env.local` file in the root directory:
   ```env
   VITE_FIREBASE_API_KEY=your_firebase_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
   VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   
   GEMINI_API_KEY=your_gemini_api_key
   RAZORPAY_KEY_SECRET=your_razorpay_secret
   VITE_RAZORPAY_KEY_ID=your_razorpay_public_key
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

   The app will be available at `http://localhost:5173`

5. **Build for production**
   ```bash
   npm run build
   npm run start
   ```

---

## 📂 Project Structure

```
src/
├── components/          # React components
│   ├── Navbar.tsx      # Navigation bar
│   ├── IdeaCard.tsx    # Idea card display
│   ├── IdeaDetail.tsx  # Detailed idea view
│   ├── LoginPage.tsx   # Authentication UI
│   ├── ProfileView.tsx # User profile dashboard
│   └── Footer.tsx      # Footer component
├── lib/
│   ├── firebase.ts     # Firebase configuration
│   ├── firestoreUtils.ts # Database utilities
│   ├── gemini.ts       # AI service integration
│   └── utils.ts        # Helper functions
├── App.tsx             # Main application
├── types.ts            # TypeScript interfaces
└── index.css           # Global styles

server.ts              # Express backend server
```

---

## 🎨 Key Components & Features

### IdeaCard Component
Displays ideas in a masonry grid layout with:
- Vote count and trending indicators
- Estimated complexity and duration
- Tech stack badges
- Real-time price display

### IdeaDetail Component
Shows comprehensive idea information:
- Full description and roadmap
- Feature breakdown
- Technology stack details
- User reviews and community votes

### AI Idea Generation
Leverages Google Gemini to create unique ideas with:
- Intelligent project suggestions
- Auto-generated tech stacks
- Complexity estimation
- Implementation roadmaps

---

## 🔒 Security Features

- Firebase Security Rules for Firestore access control
- Server-side authentication verification
- Secure payment processing with Razorpay
- Protected API endpoints
- Environment variable management

---

## 📊 Performance Highlights

- Real-time data synchronization with Firestore
- Optimized component rendering with React 19
- Responsive masonry grid layout
- Smooth animations with Motion library
- Fast builds with Vite

---

## 🤝 Contributing

Contributions are welcome! Feel free to:
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📝 License

This project is open source and available under the MIT License.

---

## 👨‍💻 About

IdeaVault demonstrates expertise in:
- **Full-stack development** with React and Node.js
- **Real-time database design** using Firebase/Firestore
- **AI integration** with Google Generative AI
- **Payment processing** and e-commerce workflows
- **Cloud deployment** on Google Cloud Run
- **Modern UI/UX** with responsive design principles

---

<div align="center">
  
  **[🌍 Visit Live App](https://ideavault-10023367050.asia-south1.run.app/)** • **[📧 Contact](mailto:omshrivastava01927@gmail.com)**
  
  Made with ❤️ by Om Shrivastava
  
</div>
