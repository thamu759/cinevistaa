import crypto from 'crypto';
import dbData from './db.json';

const getDb = () => dbData;

const TMDB_TOKEN = process.env.TMDB_ACCESS_TOKEN;
const TMDB_KEY = process.env.TMDB_API_KEY;

const tUrl = (path, p = {}) => {
  const u = new URL(`https://api.themoviedb.org/3/${path}`);
  Object.entries(p).forEach(([k, v]) => v && u.searchParams.set(k, v));
  if (!TMDB_TOKEN && TMDB_KEY) u.searchParams.set('api_key', TMDB_KEY);
  return u;
};
const tHdrs = () => TMDB_TOKEN ? { Authorization: `Bearer ${TMDB_TOKEN}` } : {};

const hdrs = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
};

const r = (b, s = 200) => ({
  statusCode: s,
  headers: { ...hdrs, 'Content-Type': 'application/json' },
  body: JSON.stringify(b),
});

const pth = (e) => {
  const x = e.path.replace('/.netlify/functions/api', '').replace(/\/api/, '') || '/';
  return x.split('/').filter(Boolean);
};

const hashPwd = (password, salt) =>
  crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');

const makeToken = (user) => {
  const h = crypto.pbkdf2Sync(user.username + user.passwordHash + (user.salt || ''), user.username, 1000, 32, 'sha512').toString('hex');
  return Buffer.from(user.username).toString('base64') + '.' + h;
};

const verifyToken = (token) => {
  if (!token) return null;
  const { users } = getDb();
  try {
    const [b64, hash] = token.split('.');
    if (b64 && hash) {
      const uname = Buffer.from(b64, 'base64').toString();
      const u = users.find(x => x.username === uname);
      if (u) {
        const expected = crypto.pbkdf2Sync(u.username + u.passwordHash + (u.salt || ''), u.username, 1000, 32, 'sha512').toString('hex');
        if (hash === expected) return u;
      }
    }
  } catch {}
  const u = users.find(x => x.token === token);
  return u || null;
};

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: hdrs, body: '' };
  try {
    const parts = pth(event), m = event.httpMethod, q = event.queryStringParameters || {};

    if (parts[0] === 'movies' && !parts[1] && m === 'GET') {
      let { movies } = getDb();
      const s = q.search?.toLowerCase(), g = q.genre?.toLowerCase();
      if (s) movies = movies.filter(x => x.title?.toLowerCase().includes(s) || x.description?.toLowerCase().includes(s));
      if (g) movies = movies.filter(x => x.genre?.toLowerCase().includes(g));
      if (q.sort === 'rating') movies.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      else if (q.sort === 'latest') movies.sort((a, b) => (b.releaseYear || 0) - (a.releaseYear || 0));
      else if (q.sort === 'popular') movies.sort((a, b) => (b.audienceScore || 0) - (a.audienceScore || 0));
      return r(movies);
    }

    if (parts[0] === 'movies' && parts[1] && !parts[2] && m === 'GET') {
      const x = getDb().movies.find(m => m.id === parts[1]);
      return x ? r(x) : r({ error: 'Not found' }, 404);
    }

    if (parts[0] === 'tmdb' && parts[1] === 'search' && m === 'GET') {
      if (!q.query) return r([]);
      const res = await fetch(tUrl('search/movie', { query: q.query, include_adult: 'false', language: 'en-US' }), { headers: tHdrs() });
      const p = await res.json();
      return r((p.results || []).slice(0, 10).map(x => ({
        tmdbId: x.id, title: x.title, description: x.overview,
        releaseDate: x.release_date || '', releaseYear: x.release_date?.split('-')[0] || '',
        posterUrl: x.poster_path ? `https://image.tmdb.org/t/p/w500${x.poster_path}` : '',
        backdropUrl: x.backdrop_path ? `https://image.tmdb.org/t/p/original${x.backdrop_path}` : '',
        language: x.original_language || '', rating: x.vote_average || 0,
      })));
    }

    if (parts[0] === 'tmdb' && parts[1] === 'credits' && parts[2] && m === 'GET') {
      const res = await fetch(tUrl(`movie/${parts[2]}/credits`), { headers: tHdrs() });
      const d = res.ok ? await res.json() : { cast: [] };
      return r((d.cast || []).filter(c => c.profile_path).slice(0, 8).map(c => ({
        name: c.name, role: c.character || '',
        avatarUrl: `https://image.tmdb.org/t/p/w185${c.profile_path}`,
      })));
    }

    if (parts[0] === 'auth' && parts[1] === 'login' && m === 'POST') {
      const { username, password } = JSON.parse(event.body || '{}');
      if (!username || !password) return r({ error: 'Username and password required' }, 400);
      const { users } = getDb();
      const user = users.find(u => u.username.toLowerCase() === username.toLowerCase());
      if (!user || user.passwordHash !== hashPwd(password, user.salt || '')) return r({ error: 'Invalid credentials' }, 401);
      return r({
        user: { username: user.username, email: user.email, role: user.role, avatarUrl: user.avatarUrl, bio: user.bio },
        token: makeToken(user),
      });
    }

    if (parts[0] === 'auth' && parts[1] === 'register' && m === 'POST') {
      return r({ error: 'Registration not available on this site. Use local server.' }, 400);
    }

    if (parts[0] === 'auth' && parts[1] === 'me' && m === 'GET') {
      const token = event.headers.authorization?.replace('Bearer ', '');
      const user = verifyToken(token);
      if (!user) return r({ error: 'Invalid token' }, 401);
      return r({ username: user.username, email: user.email, role: user.role, avatarUrl: user.avatarUrl, bio: user.bio });
    }

    if (parts[0] === 'users' && m === 'GET') {
      const { users, movies } = getDb();
      if (!parts[1]) return r(users.map(u => ({ username: u.username, avatarUrl: u.avatarUrl, role: u.role })));
      const u = users.find(x => x.username === parts[1]);
      if (!u) return r({ error: 'Not found' }, 404);
      const revs = movies.flatMap(m => (m.reviews || []).filter(r => r.user === parts[1]).map(r => ({ ...r, movieTitle: m.title, movieId: m.id })));
      return r({ username: u.username, avatarUrl: u.avatarUrl, role: u.role, email: u.email, createdAt: u.createdAt, reviews: revs });
    }

    if (parts[0] === 'leaderboard' && m === 'GET') {
      const { movies } = getDb();
      const s = {};
      movies.forEach(m => (m.reviews || []).forEach(r => {
        if (!s[r.user]) s[r.user] = { username: r.user, avatarUrl: r.avatarUrl || '', totalReviews: 0, totalLikes: 0, movies: new Set() };
        s[r.user].totalReviews++; s[r.user].totalLikes += r.likes || 0; s[r.user].movies.add(m.title);
      }));
      return r(Object.values(s).map(x => ({ ...x, moviesReviewed: x.movies.size })).sort((a, b) => b.totalReviews - a.totalReviews));
    }

    if (parts[0] === 'community' && parts[1] === 'threads' && m === 'GET') {
      return r(getDb().communityThreads || []);
    }

    if (parts[0] === 'lists' && m === 'GET') {
      const { lists } = getDb();
      if (!parts[1]) return r(q.username ? (lists || []).filter(l => l.createdBy === q.username) : (lists || []));
      const l = (lists || []).find(x => x.id === parts[1]);
      return l ? r(l) : r({ error: 'Not found' }, 404);
    }

    return r({ error: 'Not found' }, 404);
  } catch (err) {
    return r({ error: err.message }, 500);
  }
};
