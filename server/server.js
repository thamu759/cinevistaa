import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
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
  seedBotReviewsForMovie
} from './db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Database (MongoDB or fallback db.json)
await initDB();

// --- API Endpoints ---

// Auth Endpoints
app.post('/api/auth/register', async (req, res) => {
  try {
    const user = await registerUser(req.body);
    res.status(201).json(user);
  } catch (error) {
    console.error("Registration error:", error);
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await loginUser(username, password);
    res.json(user);
  } catch (error) {
    console.error("Login error:", error);
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

    const { title, description, genre, releaseYear, runtime, director, writer, studio, releaseDate, language, posterUrl, isHero, isStaffPick, staffPickType, isUpcoming, trailerUrl, trailerChannelName, ott, cast, criticScore, audienceScore, rating } = req.body;
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

    const updatedMovie = await addReview(req.params.id, {
      user,
      role: role || "Cinema Enthusiast",
      rating: parseFloat(rating), // Rating should be out of 10
      text,
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

// TMDB Image proxy endpoint
app.get('/api/tmdb/image', async (req, res) => {
  try {
    const imgPath = req.query.path;
    const size = req.query.size || 'original';
    if (!imgPath) return res.status(400).json({ error: 'Missing image path query param `path`' });

    const sanitizedPath = imgPath.startsWith('/') ? imgPath : '/' + imgPath;
    const imageUrl = `${process.env.TMDB_IMAGE_BASE_URL || 'https://image.tmdb.org/t/p'}/${size}${sanitizedPath}`;

    const response = await fetch(imageUrl);
    if (!response.ok) {
      return res.status(response.status).send();
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400'); // cache for 1 day

    const arrayBuffer = await response.arrayBuffer();
    res.send(Buffer.from(arrayBuffer));
  } catch (error) {
    console.error('TMDB image proxy error:', error);
    res.status(500).json({ error: 'Failed to fetch TMDB image' });
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

app.listen(PORT, () => {
  console.log(`thiraipedia Server running on port ${PORT}`);
});
