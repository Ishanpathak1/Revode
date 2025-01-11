# Revode - Problem Practice Platform

Revode is a web-based platform designed to help users practice coding problems and track their progress. The platform features a comprehensive dashboard, streak tracking, and a global ranking system.

## Features

- **User Authentication**
  - Email and Google Sign-in options
  - Secure email verification system
  - Password validation and security measures

- **Dashboard**
  - View available coding problems
  - Filter problems by difficulty
  - Search functionality
  - Problem completion tracking

- **Streak System**
  - Daily problem-solving streak tracking
  - Visual streak calendar
  - Activity heatmap
  - Progress statistics

- **Ranking System**
  - Global leaderboard
  - User ranking based on problem-solving performance
  - Total score tracking
  - Achievement badges

## Tech Stack

- **Frontend**
  - React.js
  - React Router for navigation
  - CSS for styling

- **Backend**
  - Firebase Authentication
  - Firebase Firestore
  - Firebase Analytics

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Firebase account

### Installation

1. Clone the repository
```bash
git clone https://github.com/your-username/revode.git
cd revode
```

2. Install dependencies
```bash
npm install
```

3. Create a `.env` file in the root directory and add your Firebase configuration
```env
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_auth_domain
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_storage_bucket
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
REACT_APP_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

4. Start the development server
```bash
npm start
```

## Project Structure

```
src/
├── components/
│   ├── Dashboard.jsx
│   ├── Login.jsx
│   ├── SignUp.jsx
│   ├── StreakPage.jsx
│   ├── RankingPage.jsx
│   └── VerifyEmail.jsx
├── firebaseConfig.js
└── App.js
```

## Features in Detail

### Authentication System
- Email/Password registration with verification
- Google OAuth integration
- Password strength requirements
- Email verification workflow

### Dashboard
- Problem filtering by difficulty level
- Search functionality
- Progress tracking
- Quiz system for problem verification

### Streak System
- Daily progress tracking
- Visual calendar representation
- Activity heatmap
- Streak maintenance rules

### Ranking System
- Global leaderboard
- Score calculation
- Achievement system
- Performance metrics

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request


## Acknowledgments

- Firebase for backend services
- React community for tools and libraries

## Contact

Your Name - [your-email@example.com](mailto:ishan.pathak2711@gmail.com)
Project Link: [https://github.com/your-username/revode](https://revode.vercel.app)