import express from 'express';
import cors from 'cors';
import compression from 'compression';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import {
  initDB,
  getMovies,
  getMovieById,
  createMovie,
  deleteMovie,
  curateMovie,
  updateMovie,
  addReview,
  deleteReview,
  toggleReviewLike,
  addReviewReply,
  registerUser,
  loginUser,
  verifyToken,
  sendOtp,
  verifyOtp,
  getCommunityThreads,
  createCommunityThread,
  addCommunityReply,
  deleteCommunityThread,
  refreshMovieImages,
  getUsers,
  deleteUser,
  updateUserRole,
  getUserByUsername,
  updateUserProfile,
  followUser,
  unfollowUser,
  searchTmdbMovies,
  fetchTmdbMovieCredits,
  fetchTmdbMovieDetailsFull,
  fetchTmdbMovieLogo,
  fetchTmdbWatchProviders,
  createList,
  getUserLists,
  getAllLists,
  getList,
  addMovieToList,
  removeMovieFromList,
  deleteList,
  getLeaderboard,
  seedBotReviewsForMovie,
  getCineUpdates,
  createCineUpdate,
  updateCineUpdate,
  deleteCineUpdate,
  deleteAllCineUpdates,
  pruneOldCineUpdates,
  toggleCineUpdateLike,
  addOttAlert,
  removeOttAlert,
  getUserOttAlerts,
  checkOttAlerts,
  sendEmailViaResend,
  getUserWatchlist,
  setUserWatchlist,
  addToWatchlist,
  removeFromWatchlist,
  mergeWatchlist,
  loginWithGoogle,
  getAnalytics
} from './db.js';
import { seedTriviaUpdates, seedNewsUpdates } from './generateTrivia.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(compression());
app.use(cors());
app.use(express.json());

// Serve static files (generated promo images, etc.)
app.use('/static', express.static(path.resolve(__dirname, 'public')));

// Cache control for API responses
app.use('/api', (req, res, next) => {
  if (req.method === 'GET') {
    res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=120');
  }
  next();
});

// Initialize Database (MongoDB or fallback db.json)
await initDB();

// --- API Endpoints ---

// Auth Endpoints
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !username.trim()) {
      return res.status(400).json({ error: 'Username is required.' });
    }
    if (username.trim().length < 3) {
      return res.status(400).json({ error: 'Username must be at least 3 characters.' });
    }
    if (username.trim().length > 30) {
      return res.status(400).json({ error: 'Username must be under 30 characters.' });
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username.trim())) {
      return res.status(400).json({ error: 'Username can only contain letters, numbers, and underscores.' });
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Please provide a valid email address.' });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }
    if (password.length > 128) {
      return res.status(400).json({ error: 'Password must be under 128 characters.' });
    }
    const user = await registerUser({ username: username.trim(), email: email.trim(), password });
    res.status(201).json(user);
  } catch (error) {
    console.error("Registration error:", error);
    res.status(400).json({ error: error.message });
  }
});

// Simple in-memory rate limiter for auth endpoints
const _authRateLimit = {};
const _rateLimitCheck = (key, maxAttempts = 5, windowMs = 300000) => {
  const now = Date.now();
  if (!_authRateLimit[key]) _authRateLimit[key] = [];
  _authRateLimit[key] = _authRateLimit[key].filter(t => now - t < windowMs);
  if (_authRateLimit[key].length >= maxAttempts) return false;
  _authRateLimit[key].push(now);
  return true;
};

app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required.' });
    }
    const rateKey = `login:${(username || '').toLowerCase().trim()}`;
    if (!_rateLimitCheck(rateKey)) {
      return res.status(429).json({ error: 'Too many login attempts. Please wait a few minutes.' });
    }
    const user = await loginUser(username, password);
    res.json(user);
  } catch (error) {
    console.error("Login error:", error);
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/auth/send-otp', async (req, res) => {
  try {
    const { email } = req.body;
    const result = await sendOtp(email);
    res.json(result);
  } catch (error) {
    console.error("Send OTP error:", error);
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/auth/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    const result = await verifyOtp(email, otp);
    res.json(result);
  } catch (error) {
    console.error("Verify OTP error:", error);
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/auth/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: "No authentication token provided" });
    }
    const token = authHeader.split(' ')[1];
    const user = await verifyToken(token);
    if (!user) {
      return res.status(401).json({ error: "Session expired or invalid token" });
    }
    res.json(user);
  } catch (error) {
    console.error("Auth verify error:", error);
    res.status(500).json({ error: "Server authentication error" });
  }
});

// Google Sign-In (verify ID token via Google, then find-or-create user)
app.post('/api/auth/google', async (req, res) => {
  try {
    const { idToken } = req.body;
    if (!idToken) {
      return res.status(400).json({ error: "Google ID token is required." });
    }
    if (req.headers.authorization && !req.headers.authorization.startsWith('Bearer ')) {
      return res.status(400).json({ error: "Invalid authorization header." });
    }

    const verifyRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`);
    if (!verifyRes.ok) {
      const errBody = await verifyRes.text().catch(() => '');
      return res.status(401).json({ error: "Google token verification failed." });
    }
    const payload = await verifyRes.json();
    if (!payload.email) {
      return res.status(401).json({ error: "Google account has no verified email." });
    }

    const user = await loginWithGoogle({
      email: payload.email,
      name: payload.name || payload.email.split('@')[0],
      picture: payload.picture || ''
    });
    res.json(user);
  } catch (error) {
    console.error("Google login error:", error);
    res.status(400).json({ error: error.message });
  }
});

// ─── Watchlist (requires auth) ───

const requireAuthUser = async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: "No authentication token provided" });
    return null;
  }
  const token = authHeader.split(' ')[1];
  const user = await verifyToken(token);
  if (!user) {
    res.status(401).json({ error: "Session expired or invalid token" });
    return null;
  }
  return user;
};

app.get('/api/watchlist', async (req, res) => {
  try {
    const user = await requireAuthUser(req, res);
    if (!user) return;
    const watchlist = await getUserWatchlist(user.username);
    res.json({ watchlist });
  } catch (error) {
    console.error("Error fetching watchlist:", error);
    res.status(500).json({ error: "Server error fetching watchlist" });
  }
});

app.post('/api/watchlist', async (req, res) => {
  try {
    const user = await requireAuthUser(req, res);
    if (!user) return;
    const { movieId } = req.body;
    if (!movieId) return res.status(400).json({ error: "Movie ID is required" });
    const result = await addToWatchlist(user.username, movieId);
    res.json(result);
  } catch (error) {
    console.error("Error adding to watchlist:", error);
    res.status(400).json({ error: error.message });
  }
});

app.delete('/api/watchlist/:movieId', async (req, res) => {
  try {
    const user = await requireAuthUser(req, res);
    if (!user) return;
    const result = await removeFromWatchlist(user.username, req.params.movieId);
    res.json(result);
  } catch (error) {
    console.error("Error removing from watchlist:", error);
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/watchlist/merge', async (req, res) => {
  try {
    const user = await requireAuthUser(req, res);
    if (!user) return;
    const { watchlist } = req.body;
    const result = await mergeWatchlist(user.username, Array.isArray(watchlist) ? watchlist : []);
    res.json(result);
  } catch (error) {
    console.error("Error merging watchlist:", error);
    res.status(400).json({ error: error.message });
  }
});

// Admin analytics
app.get('/api/admin/analytics', async (req, res) => {
  try {
    const user = await requireAuthUser(req, res);
    if (!user) return;
    if (user.role !== 'admin') {
      return res.status(403).json({ error: "Access denied. Admin privileges required." });
    }
    const analytics = await getAnalytics();
    res.json(analytics);
  } catch (error) {
    console.error("Error fetching analytics:", error);
    res.status(500).json({ error: "Server error fetching analytics" });
  }
});

// Get all movies (supports search, genre filter, and sorting)
app.get('/api/movies', async (req, res) => {
  try {
    const filters = {
      search: req.query.search,
      genre: req.query.genre,
      sort: req.query.sort,
      ottPlatform: req.query.ottPlatform
    };
    const movies = await getMovies(filters);
    res.json(movies);
  } catch (error) {
    console.error("Error fetching movies:", error);
    res.status(500).json({ error: "Server error fetching movies" });
  }
});

// Get single movie by ID
app.get('/api/movies/:id', async (req, res) => {
  try {
    const movie = await getMovieById(req.params.id);
    if (!movie) {
      return res.status(404).json({ error: "Movie not found" });
    }
    res.json(movie);
  } catch (error) {
    console.error("Error fetching movie details:", error);
    res.status(500).json({ error: "Server error fetching movie details" });
  }
});

// Create a new movie (Admin Only)
app.post('/api/movies', async (req, res) => {
  try {
    // Admin validation
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: "Access denied. No authentication token provided." });
    }
    const token = authHeader.split(' ')[1];
    const verified = await verifyToken(token);
    if (!verified || verified.role !== 'admin') {
      return res.status(403).json({ error: "Access denied. Admin privileges required." });
    }

    const { title, description, genre, releaseYear, runtime, director, writer, studio, releaseDate, language, posterUrl, titleLogoUrl, isHero, isStaffPick, staffPickType, isUpcoming, trailerUrl, trailerChannelName, ott, cast, criticScore, audienceScore, rating } = req.body;
    if (!title || !description) {
      return res.status(400).json({ error: "Title and description are required" });
    }

    const existing = await getMovieById(title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
    if (existing) {
      return res.status(409).json({ error: `"${title}" already exists!` });
    }

    const newMovie = await createMovie({
      title,
      description,
      genre: genre || "Drama",
      releaseYear: parseInt(releaseYear) || new Date().getFullYear(),
      runtime: runtime || "2h",
      director: director || "Unknown Director",
      writer: writer || "Unknown Writer",
      studio: studio || "Indie",
      releaseDate: releaseDate || "TBD",
      language: language || "English",
      posterUrl: posterUrl || "/assets/placeholder.jpg",
      backdropUrl: posterUrl || "/assets/placeholder.jpg",
      titleLogoUrl: titleLogoUrl || '',
      isHero: isHero || false,
      isStaffPick: isStaffPick || false,
      staffPickType: staffPickType || '',
      isUpcoming: isUpcoming || false,
      trailerUrl: trailerUrl || '',
      trailerChannelName: trailerChannelName || '',
      ott: ott ? { platform: ott.platform || '', releaseDate: ott.releaseDate || '', url: ott.url || '' } : undefined,
      cast: cast || [],
      criticScore: criticScore != null ? criticScore : 5.0,
      audienceScore: audienceScore != null ? audienceScore : 50,
      rating: rating != null ? rating : 5.0
    });

    res.status(201).json(newMovie);
  } catch (error) {
    console.error("Error creating movie:", error);
    res.status(500).json({ error: "Server error creating movie" });
  }
});

// Bulk delete movies (Admin Only)
app.delete('/api/movies/bulk', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: "Access denied. No authentication token provided." });
    }
    const token = authHeader.split(' ')[1];
    const verified = await verifyToken(token);
    if (!verified || verified.role !== 'admin') {
      return res.status(403).json({ error: "Access denied. Admin privileges required." });
    }

    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: "ids array is required" });
    }

    let deletedCount = 0;
    for (const id of ids) {
      const deleted = await deleteMovie(id);
      if (deleted) deletedCount++;
    }

    res.json({ success: true, message: `${deletedCount} movies deleted successfully`, count: deletedCount });
  } catch (error) {
    console.error("Error bulk deleting movies:", error);
    res.status(500).json({ error: "Server error bulk deleting movies" });
  }
});

// Delete a movie (Admin Only)
app.delete('/api/movies/:id', async (req, res) => {
  try {
    // Admin validation
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: "Access denied. No authentication token provided." });
    }
    const token = authHeader.split(' ')[1];
    const verified = await verifyToken(token);
    if (!verified || verified.role !== 'admin') {
      return res.status(403).json({ error: "Access denied. Admin privileges required." });
    }

    const deleted = await deleteMovie(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: "Movie not found or failed to delete" });
    }

    res.json({ success: true, message: "Movie deleted successfully" });
  } catch (error) {
    console.error("Error deleting movie:", error);
    res.status(500).json({ error: "Server error deleting movie" });
  }
});

// Refresh HD posters/backdrops from TMDB (Admin Only)
app.post('/api/admin/refresh-posters', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: "Access denied. No authentication token provided." });
    }
    const token = authHeader.split(' ')[1];
    const verified = await verifyToken(token);
    if (!verified || verified.role !== 'admin') {
      return res.status(403).json({ error: "Access denied. Admin privileges required." });
    }

    const movies = await refreshMovieImages();
    res.json({ success: true, updated: movies.length, movies });
  } catch (error) {
    console.error("Error refreshing TMDB posters:", error);
    res.status(400).json({ error: error.message || "Server error refreshing posters" });
  }
});

// Seed bot reviews for a movie (Admin Only)
app.post('/api/admin/seed-reviews/:id', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: "Access denied. No authentication token provided." });
    }
    const token = authHeader.split(' ')[1];
    const verified = await verifyToken(token);
    if (!verified || verified.role !== 'admin') {
      return res.status(403).json({ error: "Access denied. Admin privileges required." });
    }

    const movie = await seedBotReviewsForMovie(req.params.id, req.body.releaseDate);
    if (!movie) return res.status(404).json({ error: "Movie not found" });
    res.json({ success: true, movie });
  } catch (error) {
    console.error("Error seeding bot reviews:", error);
    res.status(500).json({ error: error.message || "Server error seeding reviews" });
  }
});

// Update a movie (Admin Only)
app.put('/api/movies/:id', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: "Access denied. No authentication token provided." });
    }
    const token = authHeader.split(' ')[1];
    const verified = await verifyToken(token);
    if (!verified || verified.role !== 'admin') {
      return res.status(403).json({ error: "Access denied. Admin privileges required." });
    }

    const updated = await updateMovie(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ error: "Movie not found" });
    }

    res.json(updated);
  } catch (error) {
    console.error("Error updating movie:", error);
    res.status(500).json({ error: "Server error updating movie" });
  }
});

// Get all users (Admin Only)
app.get('/api/admin/users', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: "Access denied. No authentication token provided." });
    }
    const token = authHeader.split(' ')[1];
    const verified = await verifyToken(token);
    if (!verified || verified.role !== 'admin') {
      return res.status(403).json({ error: "Access denied. Admin privileges required." });
    }

    const users = await getUsers();
    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Server error fetching users" });
  }
});

// Bulk delete users (Admin Only)
app.delete('/api/admin/users/bulk', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: "Access denied. No authentication token provided." });
    }
    const token = authHeader.split(' ')[1];
    const verified = await verifyToken(token);
    if (!verified || verified.role !== 'admin') {
      return res.status(403).json({ error: "Access denied. Admin privileges required." });
    }

    const { usernames } = req.body;
    if (!Array.isArray(usernames) || usernames.length === 0) {
      return res.status(400).json({ error: "usernames array is required" });
    }

    let deletedCount = 0;
    for (const username of usernames) {
      if (username === verified.username) continue;
      const deleted = await deleteUser(username);
      if (deleted) deletedCount++;
    }

    res.json({ success: true, message: `${deletedCount} users deleted successfully`, count: deletedCount });
  } catch (error) {
    console.error("Error bulk deleting users:", error);
    res.status(500).json({ error: "Server error bulk deleting users" });
  }
});

// Delete a user (Admin Only)
app.delete('/api/admin/users/:username', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: "Access denied. No authentication token provided." });
    }
    const token = authHeader.split(' ')[1];
    const verified = await verifyToken(token);
    if (!verified || verified.role !== 'admin') {
      return res.status(403).json({ error: "Access denied. Admin privileges required." });
    }

    const deleted = await deleteUser(req.params.username);
    if (!deleted) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ error: "Server error deleting user" });
  }
});

// Update user role (Admin Only)
app.patch('/api/admin/users/:username/role', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: "Access denied. No authentication token provided." });
    }
    const token = authHeader.split(' ')[1];
    const verified = await verifyToken(token);
    if (!verified || verified.role !== 'admin') {
      return res.status(403).json({ error: "Access denied. Admin privileges required." });
    }

    const { role } = req.body;
    if (!role) {
      return res.status(400).json({ error: "Role is required" });
    }

    const updated = await updateUserRole(req.params.username, role);
    if (!updated) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(updated);
  } catch (error) {
    console.error("Error updating user role:", error);
    res.status(500).json({ error: "Server error updating user role" });
  }
});

// Delete a community thread (Admin Only)
app.delete('/api/admin/threads/:id', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: "Access denied. No authentication token provided." });
    }
    const token = authHeader.split(' ')[1];
    const verified = await verifyToken(token);
    if (!verified || verified.role !== 'admin') {
      return res.status(403).json({ error: "Access denied. Admin privileges required." });
    }

    const deleted = await deleteCommunityThread(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: "Community thread not found" });
    }

    res.json({ success: true, message: "Thread deleted successfully" });
  } catch (error) {
    console.error("Error deleting thread:", error);
    res.status(500).json({ error: "Server error deleting thread" });
  }
});

// Curate a movie (toggle Hero / Staff Pick flags) (Admin Only)
app.patch('/api/movies/:id/curate', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: "Access denied. No authentication token provided." });
    }
    const token = authHeader.split(' ')[1];
    const verified = await verifyToken(token);
    if (!verified || verified.role !== 'admin') {
      return res.status(403).json({ error: "Access denied. Admin privileges required." });
    }

    const updated = await curateMovie(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ error: "Movie not found" });
    }

    res.json(updated);
  } catch (error) {
    console.error("Curation update error:", error);
    res.status(500).json({ error: "Server error updating curation status" });
  }
});

// Post a review for a movie
app.post('/api/movies/:id/reviews', async (req, res) => {
  try {
    let { user, role, rating, text, avatarUrl } = req.body;

    // Securely override user details if a valid Bearer token is provided
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const verified = await verifyToken(token);
      if (verified) {
        user = verified.username;
        role = verified.role;
        avatarUrl = verified.avatarUrl;
      } else {
        return res.status(401).json({ error: "Session expired, please log in again to review" });
      }
    }

    if (!user || !rating || !text) {
      return res.status(400).json({ error: "User, rating, and review text are required" });
    }
    const trimmedText = text.trim();
    if (trimmedText.length < 10) {
      return res.status(400).json({ error: "Review must be at least 10 characters." });
    }
    if (trimmedText.length > 2000) {
      return res.status(400).json({ error: "Review must be under 2000 characters." });
    }
    const parsedRating = Math.min(10, Math.max(1, parseFloat(rating) || 5));

    const updatedMovie = await addReview(req.params.id, {
      user,
      role: role || "Cinema Enthusiast",
      rating: parsedRating,
      text: trimmedText,
      avatarUrl
    });

    if (!updatedMovie) {
      return res.status(404).json({ error: "Movie not found" });
    }

    res.status(201).json(updatedMovie);
  } catch (error) {
    console.error("Error posting review:", error);
    res.status(500).json({ error: "Server error posting review" });
  }
});

// Delete a review
app.delete('/api/movies/:id/reviews/:reviewId', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) return res.status(401).json({ error: "No authentication token provided" });
    const user = await verifyToken(authHeader.split(' ')[1]);
    if (!user) return res.status(401).json({ error: "Session expired or invalid token" });

    const result = await deleteReview(req.params.id, req.params.reviewId, user.username);
    if (!result) return res.status(404).json({ error: "Movie or review not found" });
    if (result.error) return res.status(403).json({ error: result.error });
    res.json(result);
  } catch (error) {
    console.error("Error deleting review:", error);
    res.status(500).json({ error: "Server error deleting review" });
  }
});

// Toggle like on a review
app.post('/api/movies/:id/reviews/:reviewId/like', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) return res.status(401).json({ error: "No authentication token provided" });
    const user = await verifyToken(authHeader.split(' ')[1]);
    if (!user) return res.status(401).json({ error: "Session expired or invalid token" });

    const result = await toggleReviewLike(req.params.id, req.params.reviewId, user.username);
    if (!result) return res.status(404).json({ error: "Movie or review not found" });
    res.json(result);
  } catch (error) {
    console.error("Error toggling review like:", error);
    res.status(500).json({ error: "Server error toggling review like" });
  }
});

// Add reply to a review
app.post('/api/movies/:id/reviews/:reviewId/replies', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) return res.status(401).json({ error: "Authentication required to reply" });
    const user = await verifyToken(authHeader.split(' ')[1]);
    if (!user) return res.status(401).json({ error: "Session expired or invalid token" });

    const { body } = req.body;
    if (!body || !body.trim()) return res.status(400).json({ error: "Reply body is required" });

    const replyData = {
      id: 'reply-' + Date.now(),
      author: user.username,
      avatarUrl: user.avatarUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=150",
      body: body.trim(),
      timestamp: "Just now"
    };

    const result = await addReviewReply(req.params.id, req.params.reviewId, replyData);
    res.status(201).json(result);
  } catch (error) {
    console.error("Error adding review reply:", error);
    res.status(400).json({ error: error.message || "Server error adding review reply" });
  }
});

// Community forum threads
app.get('/api/community/threads', async (req, res) => {
  try {
    const threads = await getCommunityThreads();
    res.json(threads);
  } catch (error) {
    console.error("Error fetching community threads:", error);
    res.status(500).json({ error: "Server error fetching community threads" });
  }
});

app.post('/api/community/threads', async (req, res) => {
  try {
    let user = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      user = await verifyToken(authHeader.split(' ')[1]);
    }

    const thread = await createCommunityThread(req.body, user);
    res.status(201).json(thread);
  } catch (error) {
    console.error("Error creating community thread:", error);
    res.status(400).json({ error: error.message || "Server error creating community thread" });
  }
});

app.post('/api/community/threads/:id/replies', async (req, res) => {
  try {
    let user = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      user = await verifyToken(authHeader.split(' ')[1]);
    }

    const thread = await addCommunityReply(req.params.id, req.body, user);
    if (!thread) {
      return res.status(404).json({ error: "Community thread not found" });
    }
    res.status(201).json(thread);
  } catch (error) {
    console.error("Error adding community reply:", error);
    res.status(400).json({ error: error.message || "Server error adding community reply" });
  }
});

// ─── USER PROFILE & FOLLOW ROUTES ───

app.get('/api/users', async (req, res) => {
  try {
    const users = await getUsers();
    res.json(users.map(u => ({ username: u.username, role: u.role, avatarUrl: u.avatarUrl, bio: u.bio, followers: u.followers || [] })));
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Server error fetching users" });
  }
});

app.get('/api/users/:username', async (req, res) => {
  try {
    const user = await getUserByUsername(req.params.username);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ error: "Server error fetching user" });
  }
});

app.put('/api/users/profile', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: "Access denied. No token provided." });
    }
    const token = authHeader.split(' ')[1];
    const verified = await verifyToken(token);
    if (!verified) {
      return res.status(403).json({ error: "Invalid token" });
    }
    const updated = await updateUserProfile(verified.username, req.body);
    if (!updated) return res.status(404).json({ error: "User not found" });
    res.json(updated);
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ error: "Server error updating profile" });
  }
});

app.post('/api/users/:username/follow', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: "Access denied. No token provided." });
    }
    const token = authHeader.split(' ')[1];
    const verified = await verifyToken(token);
    if (!verified) {
      return res.status(403).json({ error: "Invalid token" });
    }
    const result = await followUser(verified.username, req.params.username);
    res.json(result);
  } catch (error) {
    console.error("Error following user:", error);
    res.status(400).json({ error: error.message || "Server error following user" });
  }
});

app.delete('/api/users/:username/follow', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: "Access denied. No token provided." });
    }
    const token = authHeader.split(' ')[1];
    const verified = await verifyToken(token);
    if (!verified) {
      return res.status(403).json({ error: "Invalid token" });
    }
    const result = await unfollowUser(verified.username, req.params.username);
    res.json(result);
  } catch (error) {
    console.error("Error unfollowing user:", error);
    res.status(400).json({ error: error.message || "Server error unfollowing user" });
  }
});

// ─── USER LISTS ROUTES ───

app.post('/api/lists', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) return res.status(401).json({ error: "No token" });
    const verified = await verifyToken(authHeader.split(' ')[1]);
    if (!verified) return res.status(403).json({ error: "Invalid token" });
    const list = await createList(req.body, verified.username);
    res.status(201).json(list);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/lists', async (req, res) => {
  try {
    const { username } = req.query;
    const lists = username ? await getUserLists(username) : await getAllLists();
    res.json(lists);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/lists/:id', async (req, res) => {
  try {
    const list = await getList(req.params.id);
    if (!list) return res.status(404).json({ error: "List not found" });
    res.json(list);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/lists/:id/movies', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) return res.status(401).json({ error: "No token" });
    const verified = await verifyToken(authHeader.split(' ')[1]);
    if (!verified) return res.status(403).json({ error: "Invalid token" });
    const list = await addMovieToList(req.params.id, req.body.movieId);
    res.json(list);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.delete('/api/lists/:id/movies/:movieId', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) return res.status(401).json({ error: "No token" });
    const verified = await verifyToken(authHeader.split(' ')[1]);
    if (!verified) return res.status(403).json({ error: "Invalid token" });
    const list = await removeMovieFromList(req.params.id, req.params.movieId);
    res.json(list);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.delete('/api/lists/:id', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) return res.status(401).json({ error: "No token" });
    const verified = await verifyToken(authHeader.split(' ')[1]);
    if (!verified) return res.status(403).json({ error: "Invalid token" });
    await deleteList(req.params.id, verified.username);
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ─── LEADERBOARD ROUTE ───

app.get('/api/leaderboard', async (req, res) => {
  try {
    const board = await getLeaderboard();
    res.json(board);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// TMDB search endpoint (admin uses to find movies by title)
app.get('/api/tmdb/search', async (req, res) => {
  try {
    const query = req.query.query;
    if (!query) return res.status(400).json({ error: 'Missing search query param `query`' });

    const results = await searchTmdbMovies(query);
    res.json(results);
  } catch (error) {
    console.error("TMDB search error:", error);
    res.status(500).json({ error: "Server error searching TMDB" });
  }
});

// TMDB full details endpoint (director, writer, studio, genre, runtime)
app.get('/api/tmdb/details/:tmdbId', async (req, res) => {
  try {
    const details = await fetchTmdbMovieDetailsFull(req.params.tmdbId);
    if (!details) return res.json({});
    res.json(details);
  } catch (error) {
    console.error("TMDB details error:", error);
    res.status(500).json({ error: "Server error fetching TMDB details" });
  }
});

// TMDB logo endpoint (fetches movie title logo)
app.get('/api/tmdb/logo/:tmdbId', async (req, res) => {
  try {
    const logoUrl = await fetchTmdbMovieLogo(req.params.tmdbId);
    if (!logoUrl) return res.json({ logoUrl: null });
    res.json({ logoUrl });
  } catch (error) {
    console.error("TMDB logo error:", error);
    res.status(500).json({ error: "Server error fetching TMDB logo" });
  }
});

// TMDB credits endpoint (admin uses to fetch cast/crew)
app.get('/api/tmdb/credits/:tmdbId', async (req, res) => {
  try {
    const { tmdbId } = req.params;
    const credits = await fetchTmdbMovieCredits(tmdbId);
    res.json(credits || []);
  } catch (error) {
    console.error("TMDB credits error:", error);
    res.status(500).json({ error: "Server error fetching TMDB credits" });
  }
});

// TMDB watch providers endpoint
app.get('/api/tmdb/providers/:tmdbId', async (req, res) => {
  try {
    const providers = await fetchTmdbWatchProviders(req.params.tmdbId);
    res.json(providers);
  } catch (error) {
    console.error("TMDB providers error:", error);
    res.status(500).json({ error: "Server error fetching watch providers" });
  }
});

// TMDB Image proxy endpoint with file-system caching
const IMAGE_CACHE_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '.img_cache');

const getCachedImage = (cacheKey) => {
  const cacheFile = path.join(IMAGE_CACHE_DIR, cacheKey);
  if (fs.existsSync(cacheFile)) {
    const stat = fs.statSync(cacheFile);
    if (Date.now() - stat.mtimeMs < 7 * 24 * 60 * 60 * 1000) { // 7 day TTL
      return fs.readFileSync(cacheFile);
    }
  }
  return null;
};

const setCachedImage = (cacheKey, data) => {
  try {
    if (!fs.existsSync(IMAGE_CACHE_DIR)) {
      fs.mkdirSync(IMAGE_CACHE_DIR, { recursive: true });
    }
    fs.writeFileSync(path.join(IMAGE_CACHE_DIR, cacheKey), data);
  } catch (e) {}
};

app.get('/api/tmdb/image', async (req, res) => {
  try {
    const imgPath = req.query.path;
    const size = req.query.size || 'original';
    if (!imgPath) return res.status(400).json({ error: 'Missing image path query param `path`' });

    const sanitizedPath = imgPath.startsWith('/') ? imgPath : '/' + imgPath;
    const cacheKey = `${size}${sanitizedPath.replace(/\//g, '_')}`;

    const cached = getCachedImage(cacheKey);
    if (cached) {
      const ext = path.extname(sanitizedPath) || '.jpg';
      const mime = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg';
      res.setHeader('Content-Type', mime);
      res.setHeader('Cache-Control', 'public, max-age=86400');
      return res.send(cached);
    }

    const imageUrl = `${process.env.TMDB_IMAGE_BASE_URL || 'https://image.tmdb.org/t/p'}/${size}${sanitizedPath}`;

    const response = await fetch(imageUrl);
    if (!response.ok) {
      return res.status(response.status).send();
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    setCachedImage(cacheKey, buffer);

    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.send(buffer);
  } catch (error) {
    console.error('TMDB image proxy error:', error);
    res.status(500).json({ error: 'Failed to fetch TMDB image' });
  }
});

// ─── CINE UPDATES (Reels) ───

app.get('/api/cine-updates', async (req, res) => {
  try {
    const updates = await getCineUpdates();
    res.json(updates);
  } catch (error) {
    console.error("Error fetching cine updates:", error);
    res.status(500).json({ error: "Server error fetching cine updates" });
  }
});

app.post('/api/cine-updates', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: "Access denied. No authentication token provided." });
    }
    const token = authHeader.split(' ')[1];
    const verified = await verifyToken(token);
    if (!verified || verified.role !== 'admin') {
      return res.status(403).json({ error: "Access denied. Admin privileges required." });
    }

    const update = await createCineUpdate(req.body, verified);
    res.status(201).json(update);
  } catch (error) {
    console.error("Error creating cine update:", error);
    res.status(400).json({ error: error.message || "Server error creating cine update" });
  }
});

app.delete('/api/cine-updates', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: "Access denied. No authentication token provided." });
    }
    const token = authHeader.split(' ')[1];
    const verified = await verifyToken(token);
    if (!verified || verified.role !== 'admin') {
      return res.status(403).json({ error: "Access denied. Admin privileges required." });
    }

    const count = await deleteAllCineUpdates();
    res.json({ success: true, message: `${count} cine updates deleted successfully`, count });
  } catch (error) {
    console.error("Error deleting all cine updates:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Bulk delete cine updates (Admin Only)
app.delete('/api/cine-updates/bulk', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: "Access denied. No authentication token provided." });
    }
    const token = authHeader.split(' ')[1];
    const verified = await verifyToken(token);
    if (!verified || verified.role !== 'admin') {
      return res.status(403).json({ error: "Access denied. Admin privileges required." });
    }

    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: "ids array is required" });
    }

    let deletedCount = 0;
    for (const id of ids) {
      const deleted = await deleteCineUpdate(id);
      if (deleted) deletedCount++;
    }

    res.json({ success: true, message: `${deletedCount} cine updates deleted successfully`, count: deletedCount });
  } catch (error) {
    console.error("Error bulk deleting cine updates:", error);
    res.status(500).json({ error: "Server error bulk deleting cine updates" });
  }
});

app.delete('/api/cine-updates/:id', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: "Access denied. No authentication token provided." });
    }
    const token = authHeader.split(' ')[1];
    const verified = await verifyToken(token);
    if (!verified || verified.role !== 'admin') {
      return res.status(403).json({ error: "Access denied. Admin privileges required." });
    }

    const deleted = await deleteCineUpdate(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Cine update not found" });
    res.json({ success: true, message: "Cine update deleted successfully" });
  } catch (error) {
    console.error("Error liking cine update:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// ─── TRIVIA SEEDER (admin only) ───
app.post('/api/seeds/trivia', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: "Access denied. No token provided." });
    }
    const token = authHeader.split(' ')[1];
    const verified = await verifyToken(token);
    if (!verified || verified.role !== 'admin') {
      return res.status(403).json({ error: "Access denied. Admin only." });
    }

    const count = Math.min(req.body.count || 15, 30);
    const created = await seedTriviaUpdates(count, verified);
    res.json({ success: true, count: created.length, updates: created });
  } catch (error) {
    console.error("Error seeding trivia:", error);
    res.status(500).json({ error: error.message || "Server error seeding trivia" });
  }
});

// ─── NEWS SEEDER (admin only) ───
app.post('/api/seeds/news', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: "Access denied. No token provided." });
    }
    const token = authHeader.split(' ')[1];
    const verified = await verifyToken(token);
    if (!verified || verified.role !== 'admin') {
      return res.status(403).json({ error: "Access denied. Admin only." });
    }

    const count = Math.min(req.body.count || 20, 30);
    const created = await seedNewsUpdates(count, verified);
    res.json({ success: true, count: created.length, updates: created });
  } catch (error) {
    console.error("Error seeding news:", error);
    res.status(500).json({ error: error.message || "Server error seeding news" });
  }
});

app.put('/api/cine-updates/:id', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: "Access denied. No authentication token provided." });
    }
    const token = authHeader.split(' ')[1];
    const verified = await verifyToken(token);
    if (!verified || verified.role !== 'admin') {
      return res.status(403).json({ error: "Access denied. Admin privileges required." });
    }

    const updated = await updateCineUpdate(req.params.id, req.body);
    res.json(updated);
  } catch (error) {
    console.error("Error updating cine update:", error);
    res.status(400).json({ error: error.message || "Server error updating cine update" });
  }
});

app.post('/api/cine-updates/:id/like', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) return res.status(401).json({ error: "No authentication token provided" });
    const user = await verifyToken(authHeader.split(' ')[1]);
    if (!user) return res.status(401).json({ error: "Session expired or invalid token" });

    const result = await toggleCineUpdateLike(req.params.id, user.username);
    if (!result) return res.status(404).json({ error: "Cine update not found" });
    res.json(result);
  } catch (error) {
    console.error("Error toggling cine update like:", error);
    res.status(500).json({ error: "Server error toggling like" });
  }
});

// Static page content API
const pagesContent = {
  privacy: {
    title: 'Privacy Policy',
    updated: 'May 2026',
    sections: [
      { heading: 'Information We Collect', text: 'When you create an account on ThiraiPedia, we collect your username, email address, and a hashed password. You may optionally provide an avatar URL and bio.' },
      { heading: 'How We Use Your Data', text: 'Your information is used to identify you as a critic, display your reviews and profile publicly, and allow other users to engage with your content. We do not sell or share your personal data with third parties.' },
      { heading: 'Reviews & Ratings', text: 'Reviews, ratings, and lists you create are visible to all users. You may delete your own reviews at any time.' },
      { heading: 'Cookies', text: 'We use localStorage to store your login token, watchlist, and autoplay preference. No cookies are served from third-party domains.' },
      { heading: 'Data Retention', text: 'Your data is retained until you request account deletion. Contact us at support@thiraipedia.com to delete your account.' },
      { heading: 'TMDB Attribution', text: 'Movie poster and backdrop images are sourced from TMDB. TMDB does not endorse this application.' },
    ]
  },
  terms: {
    title: 'Terms of Service',
    updated: 'May 2026',
    sections: [
      { heading: 'Acceptance', text: 'By using ThiraiPedia, you agree to these terms. If you do not agree, do not use the service.' },
      { heading: 'User Accounts', text: 'You are responsible for maintaining the confidentiality of your login credentials. You must be at least 13 years old to create an account.' },
      { heading: 'Content Guidelines', text: 'Reviews and forum posts must not contain hate speech, harassment, or illegal content. We reserve the right to remove content and ban users who violate this policy.' },
      { heading: 'Intellectual Property', text: 'Movie data and images are provided by TMDB under their terms. User-generated content remains the property of its author.' },
      { heading: 'Service Availability', text: 'We strive to keep the service running but do not guarantee uninterrupted availability. We may modify or discontinue features at any time.' },
      { heading: 'Limitation of Liability', text: 'ThiraiPedia is provided "as is" without warranties. We are not liable for damages arising from use of the service.' },
    ]
  },
  about: {
    title: 'About ThiraiPedia',
    updated: null,
    sections: [
      { heading: 'Our Mission', text: 'ThiraiPedia is built for movie enthusiasts who believe cinema is more than entertainment — it is an art form. We provide a platform for honest, curated reviews and thoughtful critique.' },
      { heading: 'What We Offer', text: 'From the latest blockbusters to regional cinema in Tamil and Malayalam, our community rates and reviews films across languages and genres. Track your watchlist, follow critics, and discover your next favourite film.' },
      { heading: 'Our Community', text: 'We believe the best film criticism comes from passionate audiences. Whether you are a casual viewer or a dedicated cinephile, your voice matters here. Join thousands of critics who share their perspectives every day.' },
      { heading: 'Powered by TMDB', text: 'Movie data and images on ThiraiPedia are provided by The Movie Database (TMDB). This product uses the TMDB API but is not endorsed or certified by TMDB.' },
    ]
  },
  contact: {
    title: 'Contact Support',
    updated: null,
    sections: [
      { heading: 'Email', text: 'Reach us at support@thiraipedia.com. We typically reply within 24 hours.' },
      { heading: 'Community', text: 'Post in our Community Forum for discussions, suggestions, and help from other critics.' },
      { heading: 'Social', text: 'Follow us on Facebook and Instagram for updates.' },
    ]
  }
};

app.get('/api/pages/:page', (req, res) => {
  const { page } = req.params;
  const content = pagesContent[page];
  if (!content) return res.status(404).json({ error: 'Page not found' });
  res.json(content);
});

// ─── OTT ALERT ENDPOINTS ───

// Subscribe to OTT release alert
app.post('/api/ott-alerts', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: "Authentication required" });
    }
    const token = authHeader.split(' ')[1];
    const verified = await verifyToken(token);
    if (!verified) return res.status(401).json({ error: "Invalid token" });

    const result = await addOttAlert(verified.username, req.body);
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ error: error.message || "Failed to create alert" });
  }
});

// Unsubscribe from OTT release alert
app.delete('/api/ott-alerts/:movieId', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: "Authentication required" });
    }
    const token = authHeader.split(' ')[1];
    const verified = await verifyToken(token);
    if (!verified) return res.status(401).json({ error: "Invalid token" });

    const result = await removeOttAlert(verified.username, req.params.movieId);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message || "Failed to remove alert" });
  }
});

// Get user's OTT alerts
app.get('/api/ott-alerts', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: "Authentication required" });
    }
    const token = authHeader.split(' ')[1];
    const verified = await verifyToken(token);
    if (!verified) return res.status(401).json({ error: "Invalid token" });

    const alerts = await getUserOttAlerts(verified.username);
    res.json(alerts);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch alerts" });
  }
});

// Check alerts for today's releases (admin only)
app.get('/api/ott-alerts/check', async (req, res) => {
  try {
    const notifications = await checkOttAlerts();
    const sent = [];
    for (const n of notifications) {
      if (n.email && process.env.RESEND_API_KEY) {
        for (const movie of n.movies) {
          const sentEmail = await sendEmailViaResend(n.email, null, 'release');
          if (sentEmail) sent.push({ username: n.username, movie: movie.movieTitle, platform: movie.platform });
        }
      }
    }
    res.json({ notifications, emailsSent: sent.length, sent });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── CRAWLER DETECTION & SPA STATIC SERVING ───

const clientDist = path.resolve(__dirname, '..', 'client', 'dist');
const indexHtmlPath = path.join(clientDist, 'index.html');

const crawlerPattern = /bot|facebook|whatsapp|twitterbot|slack|googlebot|telegram|discord|slack|linkedin|pinterest|slurp|bingbot|duckduckbot|applebot|embedly|baiduspider|yandex|semrush/i;

// Check for crawlers on movie pages and serve custom OG tags
app.get('/movie/:id', async (req, res) => {
  const ua = req.headers['user-agent'] || '';
  if (!crawlerPattern.test(ua)) {
    // Not a crawler — serve the SPA normally
    return res.sendFile(indexHtmlPath);
  }

  try {
    const movie = await getMovieById(req.params.id);
    const posterUrl = movie?.posterUrl
      ? `${process.env.TMDB_IMAGE_BASE_URL || 'https://image.tmdb.org/t/p'}/w500${movie.posterUrl.includes('/t/p/') ? '/' + movie.posterUrl.split('/t/p/')[1].split('/').slice(1).join('/') : movie.posterUrl.includes('http') ? movie.posterUrl : '/original' + movie.posterUrl}`
      : 'https://www.cinevistaa.in/og-image.svg';

    const title = movie?.title || 'Movie';
    const rating = movie?.criticScore?.toFixed(1) || movie?.rating?.toFixed(1) || '';
    const desc = movie?.description?.slice(0, 200)
      ? `${movie.description.slice(0, 200)}...${rating ? ` Rated ${rating}/10.` : ''}`
      : `Read reviews, watch the trailer, and see ratings for ${title} on thiraipedia.`;
    const genre = movie?.genre || '';

    const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title} — Review & Rating | thiraipedia</title>
  <meta name="description" content="${desc}" />
  <meta property="og:type" content="article" />
  <meta property="og:url" content="https://www.cinevistaa.in/movie/${req.params.id}" />
  <meta property="og:title" content="${title}${rating ? ` — ${rating}/10` : ''} | thiraipedia" />
  <meta property="og:description" content="${desc}" />
  <meta property="og:image" content="${posterUrl}" />
  <meta property="og:image:width" content="500" />
  <meta property="og:image:height" content="750" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${title} | thiraipedia" />
  <meta name="twitter:description" content="${desc}" />
  <meta name="twitter:image" content="${posterUrl}" />
  <link rel="canonical" href="https://www.cinevistaa.in/movie/${req.params.id}" />
  <script type="application/ld+json">${JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Movie",
    "name": title,
    "description": movie?.description || '',
    "image": posterUrl,
    "genre": genre ? genre.split(',').map(g => g.trim()) : [],
    "datePublished": movie?.releaseDate || undefined,
    "aggregateRating": rating ? { "@type": "AggregateRating", "ratingValue": movie?.rating, "bestRating": 10, "ratingCount": movie?.reviews?.length || 1 } : undefined,
    "review": (movie?.reviews || []).slice(0, 5).map(r => ({
      "@type": "Review",
      "author": { "@type": "Person", "name": r.user },
      "reviewRating": { "@type": "Rating", "ratingValue": r.rating, "bestRating": 10 },
      "reviewBody": r.text
    }))
  })}</script>
</head>
<body>
  <p>${title} on thiraipedia — ${rating ? `Rated ${rating}/10.` : ''} ${genre}</p>
</body>
</html>`;
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=7200');
    res.send(html);
  } catch {
    res.sendFile(indexHtmlPath);
  }
});

// robots.txt
app.get('/robots.txt', (req, res) => {
  res.type('text/plain');
  res.send(`User-agent: *
Allow: /
Disallow: /api/
Disallow: /admin
Sitemap: https://www.cinevistaa.in/sitemap.xml`);
});

// sitemap.xml
app.get('/sitemap.xml', async (req, res) => {
  try {
    const movies = await getMovies();
    const now = new Date().toISOString().split('T')[0];
    const urls = [
      `  <url><loc>https://www.cinevistaa.in/</loc><changefreq>daily</changefreq><priority>1.0</priority></url>`,
      `  <url><loc>https://www.cinevistaa.in/about</loc><changefreq>monthly</changefreq><priority>0.5</priority></url>`,
      `  <url><loc>https://www.cinevistaa.in/contact</loc><changefreq>monthly</changefreq><priority>0.4</priority></url>`,
      `  <url><loc>https://www.cinevistaa.in/privacy</loc><changefreq>yearly</changefreq><priority>0.3</priority></url>`,
      `  <url><loc>https://www.cinevistaa.in/terms</loc><changefreq>yearly</changefreq><priority>0.3</priority></url>`,
      ...movies.map(m => `  <url><loc>https://www.cinevistaa.in/movie/${m.id}</loc><lastmod>${m.updatedAt ? new Date(m.updatedAt).toISOString().split('T')[0] : now}</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>`)
    ];
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;
    res.type('application/xml');
    res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400');
    res.send(xml);
  } catch {
    res.status(500).send('<?xml version="1.0"?><urlset/>');
  }
});

// Serve SPA static files
app.use(express.static(clientDist));

// SPA fallback — all other routes serve index.html
app.get('*', (req, res) => {
  res.sendFile(indexHtmlPath);
});

// Global error handler
app.use((err, req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error. Please try again later.' });
});

app.listen(PORT, () => {
  console.log(`thiraipedia Server running on port ${PORT}`);
});

// ─── CINE PULSE AUTO-REFRESH ───
// Prunes stale updates and seeds fresh news/trivia so the feed never goes stale.
const CINE_REFRESH_INTERVAL_MS = 6 * 60 * 60 * 1000;
let cineRefreshRunning = false;

const autoRefreshCineUpdates = async () => {
  if (cineRefreshRunning) return;
  cineRefreshRunning = true;
  try {
    const pruned = await pruneOldCineUpdates(7, 40);
    const news = await seedNewsUpdates(12, null);
    const trivia = await seedTriviaUpdates(8, null);
    console.log(`[Cine Pulse] auto-refresh done — pruned ${pruned}, added ${news.length} news + ${trivia.length} trivia.`);
  } catch (err) {
    console.warn('[Cine Pulse] auto-refresh failed:', err.message);
  }
  cineRefreshRunning = false;
};

setTimeout(() => { autoRefreshCineUpdates(); }, 15 * 1000);
setInterval(autoRefreshCineUpdates, CINE_REFRESH_INTERVAL_MS);
