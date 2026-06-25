# ThiraiPedia (CineVistaa)

Premium movie review and film critique platform for Indian cinema, with a focus on Tamil and Malayalam films.

## Features

- **Movie Discovery** - Browse, search, and filter movies by genre, language, rating, and OTT platform
- **Detailed Reviews** - Read and write movie reviews with ratings out of 10
- **Community** - Forum-style discussions, user lists, and critic leaderboards
- **Watchlist** - Save movies to watch later (persisted in localStorage)
- **OTT Calendar** - Track upcoming streaming releases with notification alerts
- **Games** - Movie Quiz, Card Flix, Blind Frame, Mood Matcher
- **Cine Pulse** - TikTok-style swipeable feed of movie news and trivia
- **Admin Panel** - Full CRUD for movies, users, and site content
- **Share** - Share movie reviews as downloadable image cards

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + Vite 8 |
| Routing | react-router-dom 7 |
| Backend | Node.js + Express 4 |
| Database | MongoDB (Mongoose 8) / JSON file fallback |
| Auth | Custom JWT (PBKDF2) |
| APIs | TMDB, OpenAI (GPT-4o-mini), Google News RSS |
| Deployment | Netlify (frontend), Render (backend) |

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB (optional - JSON fallback works out of the box)

### Setup

```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install

# Configure environment
cp .env.example .env
# Edit .env with your API keys (TMDB, OpenAI, MongoDB)
```

### Run Locally

```bash
# Start server (terminal 1)
cd server
npm start

# Start client (terminal 2)
cd client
npm run dev
```

The client runs on `http://localhost:5173` and the server on `http://localhost:5000`.

### Using JSON Fallback (No MongoDB)

The server automatically falls back to `server/db.json` when MongoDB is unavailable. The file includes seed data for testing all features.

## Project Structure

```
volt_mate/
├── client/                # React SPA
│   ├── src/
│   │   ├── App.jsx        # Main app with all routing and views
│   │   ├── api.js         # API client functions
│   │   ├── main.jsx       # Entry point
│   │   ├── index.css      # Global styles
│   │   ├── context/       # React contexts
│   │   ├── utils/         # Utility functions
│   │   └── components/    # Reusable components
│   └── dist/              # Production build
├── server/                # Express backend
│   ├── server.js          # All API routes
│   ├── db.js              # Database layer (MongoDB + JSON)
│   ├── db.json            # JSON database fallback
│   ├── generateTrivia.js  # TMDB trivia generation
│   ├── openai.js          # OpenAI integration
│   └── newsRss.js         # Google News RSS fetcher
├── netlify/               # Netlify serverless functions
└── flutter_app/           # Mobile app (Flutter)
```

## API Keys

This project uses:
- **TMDB API** - Movie metadata, images, watch providers
- **OpenAI API** - Synopsis and rating generation
- **Resend** (optional) - Email notifications

Copy `server/.env.example` to `server/.env` and add your keys.

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.
