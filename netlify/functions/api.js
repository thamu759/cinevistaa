import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const readDb = () => {
  try {
    return JSON.parse(readFileSync(resolve(__dirname, '../../db.json'), 'utf-8'));
  } catch {
    return { movies: [], users: [], communityThreads: [] };
  }
};

const TMDB_ACCESS_TOKEN = process.env.TMDB_ACCESS_TOKEN;
const TMDB_API_KEY = process.env.TMDB_API_KEY;

const tmdbUrl = (path, params = {}) => {
  const url = new URL(`https://api.themoviedb.org/3/${path}`);
  Object.entries(params).forEach(([k, v]) => { if (v) url.searchParams.set(k, v); });
  if (!TMDB_ACCESS_TOKEN && TMDB_API_KEY) url.searchParams.set('api_key', TMDB_API_KEY);
  return url;
};

const tmdbHeaders = () => TMDB_ACCESS_TOKEN ? { Authorization: `Bearer ${TMDB_ACCESS_TOKEN}` } : {};

const hash = (password, salt) => crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
const genSalt = () => crypto.randomBytes(16).toString('hex');

const verifyToken = (token) => {
  if (!token) return null;
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return null;
    const user = readDb().users.find(u => u.username === parts[0]);
    if (!user) return null;
    const expected = hash(parts[0] + user.password + (user.salt || ''), parts[0].slice(0, 8));
    if (expected === parts[1]) return user;
    return null;
  } catch { return null; }
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
  'Content-Type': 'application/json',
};

const json = (body, status = 200) => ({ statusCode: status, headers: corsHeaders, body: JSON.stringify(body) });

const parsePath = (event) => {
  const base = event.path.replace('/.netlify/functions/api', '').replace(/\/api/, '') || '/';
  const parts = base.split('/').filter(Boolean);
  return parts;
};

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: corsHeaders, body: '' };

  try {
    const parts = parsePath(event);
    const method = event.httpMethod;
    const q = event.queryStringParameters || {};

    // GET /movies
    if (parts[0] === 'movies' && !parts[1] && method === 'GET') {
      let { movies } = readDb();
      const search = q.search?.toLowerCase();
      const genre = q.genre?.toLowerCase();
      if (search) movies = movies.filter(m => m.title?.toLowerCase().includes(search) || m.description?.toLowerCase().includes(search));
      if (genre) movies = movies.filter(m => m.genre?.toLowerCase().includes(genre));
      if (q.sort === 'rating') movies.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      else if (q.sort === 'latest') movies.sort((a, b) => (b.releaseYear || 0) - (a.releaseYear || 0));
      else if (q.sort === 'popular') movies.sort((a, b) => (b.audienceScore || 0) - (a.audienceScore || 0));
      return json(movies);
    }

    // GET /movies/:id
    if (parts[0] === 'movies' && parts[1] && !parts[2] && method === 'GET') {
      const { movies } = readDb();
      const movie = movies.find(m => m.id === parts[1]);
      if (!movie) return json({ error: 'Movie not found' }, 404);
      return json(movie);
    }

    // POST /movies/:id/reviews
    if (parts[0] === 'movies' && parts[1] && parts[2] === 'reviews' && method === 'POST') {
      const body = JSON.parse(event.body || '{}');
      const user = verifyToken(event.headers.authorization?.replace('Bearer ', ''));
      if (!user) return json({ error: 'Authentication required' }, 401);
      const db = readDb();
      const movie = db.movies.find(m => m.id === parts[1]);
      if (!movie) return json({ error: 'Movie not found' }, 404);
      const review = {
        id: Date.now().toString(36),
        user: user.username,
        avatarUrl: user.avatarUrl || '',
        role: user.role || '',
        rating: body.rating || 0,
        text: body.text || '',
        timestamp: new Date().toISOString(),
        likes: 0,
        comments: 0,
      };
      if (!movie.reviews) movie.reviews = [];
      movie.reviews.push(review);
      // Write back (best effort in serverless)
      try { writeFileSync(resolve(__dirname, '../../db.json'), JSON.stringify(db, null, 2)); } catch {}
      return json(review, 201);
    }

    // PATCH /movies/:id/curate
    if (parts[0] === 'movies' && parts[1] && parts[2] === 'curate' && method === 'PATCH') {
      const user = verifyToken(event.headers.authorization?.replace('Bearer ', ''));
      if (!user || user.role !== 'admin') return json({ error: 'Admin required' }, 403);
      const db = readDb();
      const idx = db.movies.findIndex(m => m.id === parts[1]);
      if (idx === -1) return json({ error: 'Not found' }, 404);
      const updates = JSON.parse(event.body || '{}');
      Object.assign(db.movies[idx], updates);
      try { writeFileSync(resolve(__dirname, '../../db.json'), JSON.stringify(db, null, 2)); } catch {}
      return json(db.movies[idx]);
    }

    // POST /auth/register
    if (parts[0] === 'auth' && parts[1] === 'register' && method === 'POST') {
      const { username, email, password } = JSON.parse(event.body || '{}');
      if (!username || !password) return json({ error: 'Username and password required' }, 400);
      const db = readDb();
      if (db.users.find(u => u.username === username)) return json({ error: 'Username taken' }, 409);
      const salt = genSalt();
      const user = {
        username,
        email: email || '',
        password: hash(password, salt),
        salt,
        role: db.users.length === 0 ? 'admin' : 'user',
        avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${username}`,
        createdAt: new Date().toISOString(),
      };
      db.users.push(user);
      try { writeFileSync(resolve(__dirname, '../../db.json'), JSON.stringify(db, null, 2)); } catch {}
      const token = user.username + '.' + hash(user.username + user.password + salt, user.username.slice(0, 8));
      return json({ user: { username: user.username, role: user.role, avatarUrl: user.avatarUrl, email: user.email }, token }, 201);
    }

    // POST /auth/login
    if (parts[0] === 'auth' && parts[1] === 'login' && method === 'POST') {
      const { username, password } = JSON.parse(event.body || '{}');
      const db = readDb();
      const user = db.users.find(u => u.username === username);
      if (!user || user.password !== hash(password, user.salt || '')) return json({ error: 'Invalid credentials' }, 401);
      const token = user.username + '.' + hash(user.username + user.password + (user.salt || ''), user.username.slice(0, 8));
      return json({ user: { username: user.username, role: user.role, avatarUrl: user.avatarUrl, email: user.email }, token });
    }

    // GET /auth/me
    if (parts[0] === 'auth' && parts[1] === 'me' && method === 'GET') {
      const user = verifyToken(event.headers.authorization?.replace('Bearer ', ''));
      if (!user) return json({ error: 'Invalid token' }, 401);
      return json({ username: user.username, role: user.role, avatarUrl: user.avatarUrl, email: user.email });
    }

    // GET /tmdb/search
    if (parts[0] === 'tmdb' && parts[1] === 'search' && method === 'GET') {
      const query = q.query;
      if (!query) return json([]);
      const res = await fetch(tmdbUrl('search/movie', { query, include_adult: 'false', language: 'en-US' }), { headers: tmdbHeaders() });
      const payload = await res.json();
      const results = (payload.results || []).slice(0, 10).map(m => ({
        tmdbId: m.id,
        title: m.title,
        description: m.overview,
        releaseYear: m.release_date?.split('-')[0] || '',
        releaseDate: m.release_date || '',
        posterUrl: m.poster_path ? `https://image.tmdb.org/t/p/w342${m.poster_path}` : '',
        backdropUrl: m.backdrop_path ? `https://image.tmdb.org/t/p/original${m.backdrop_path}` : '',
        language: m.original_language || '',
        rating: m.vote_average || 0,
      }));
      return json(results);
    }

    // GET /tmdb/credits/:tmdbId
    if (parts[0] === 'tmdb' && parts[1] === 'credits' && parts[2] && method === 'GET') {
      const res = await fetch(tmdbUrl(`movie/${parts[2]}/credits`), { headers: tmdbHeaders() });
      if (!res.ok) return json([]);
      const data = await res.json();
      const credits = (data.cast || []).filter(m => m.profile_path).slice(0, 8).map(m => ({
        name: m.name,
        role: m.character || '',
        avatarUrl: `https://image.tmdb.org/t/p/w185${m.profile_path}`,
      }));
      return json(credits);
    }

    // GET /tmdb/image (proxy - fallback, direct CDN preferred)
    if (parts[0] === 'tmdb' && parts[1] === 'image' && method === 'GET') {
      const imgPath = q.path;
      const size = q.size || 'original';
      if (!imgPath) return json({ error: 'Missing path' }, 400);
      const sanitized = imgPath.startsWith('/') ? imgPath : '/' + imgPath;
      const imageUrl = `https://image.tmdb.org/t/p/${size}${sanitized}`;
      try {
        const resp = await fetch(imageUrl);
        const buffer = await resp.arrayBuffer();
        return {
          statusCode: resp.status,
          headers: { ...corsHeaders, 'Content-Type': resp.headers.get('content-type') || 'image/jpeg', 'Cache-Control': 'public, max-age=86400' },
          body: Buffer.from(buffer).toString('base64'),
          isBase64Encoded: true,
        };
      } catch {
        return json({ error: 'Image fetch failed' }, 502);
      }
    }

    // GET /users (public list)
    if (parts[0] === 'users' && !parts[1] && method === 'GET') {
      const { users } = readDb();
      return json(users.map(u => ({ username: u.username, avatarUrl: u.avatarUrl, role: u.role })));
    }

    // GET /users/:username
    if (parts[0] === 'users' && parts[1] && method === 'GET') {
      const { users, movies } = readDb();
      const user = users.find(u => u.username === parts[1]);
      if (!user) return json({ error: 'User not found' }, 404);
      const reviews = movies.flatMap(m => (m.reviews || []).filter(r => r.user === parts[1]).map(r => ({ ...r, movieTitle: m.title, movieId: m.id })));
      return json({ username: user.username, avatarUrl: user.avatarUrl, role: user.role, email: user.email, createdAt: user.createdAt, reviews });
    }

    // GET /leaderboard
    if (parts[0] === 'leaderboard' && method === 'GET') {
      const { movies, users } = readDb();
      const userStats = {};
      movies.forEach(m => (m.reviews || []).forEach(r => {
        if (!userStats[r.user]) userStats[r.user] = { username: r.user, avatarUrl: r.avatarUrl || '', totalReviews: 0, totalLikes: 0, moviesReviewed: new Set() };
        userStats[r.user].totalReviews++;
        userStats[r.user].totalLikes += r.likes || 0;
        userStats[r.user].moviesReviewed.add(m.title);
      }));
      return json(Object.values(userStats).map(u => ({ ...u, moviesReviewed: u.moviesReviewed.size })).sort((a, b) => b.totalReviews - a.totalReviews));
    }

    // GET /community/threads
    if (parts[0] === 'community' && parts[1] === 'threads' && method === 'GET') {
      const { communityThreads } = readDb();
      return json(communityThreads || []);
    }

    // GET /lists
    if (parts[0] === 'lists' && !parts[1] && method === 'GET') {
      const db = readDb();
      const lists = db.lists || [];
      if (q.username) return json(lists.filter(l => l.createdBy === q.username));
      return json(lists);
    }

    // GET /lists/:id
    if (parts[0] === 'lists' && parts[1] && !parts[2] && method === 'GET') {
      const db = readDb();
      const list = (db.lists || []).find(l => l.id === parts[1]);
      if (!list) return json({ error: 'List not found' }, 404);
      return json(list);
    }

    return json({ error: 'Not found' }, 404);
  } catch (err) {
    return json({ error: err.message }, 500);
  }
};
