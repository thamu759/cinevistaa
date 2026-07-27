const isProduction = typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
const API_BASE_URL = import.meta.env.VITE_API_URL || (isProduction ? '/api' : 'http://localhost:5000/api');
const IS_SERVER_DEPLOYED = API_BASE_URL !== '/api' && !API_BASE_URL.includes('localhost');

const extractTmdbPath = (url) => {
  const idx = url.indexOf('/t/p/');
  if (idx === -1) return null;
  const after = url.substring(idx + '/t/p/'.length);
  const parts = after.split('/');
  if (parts.length > 1) parts.shift();
  return '/' + parts.join('/');
};

export const proxyImageUrl = (originalUrl, size = 'original') => {
  if (!originalUrl || typeof originalUrl !== 'string') return originalUrl;
  try {
    const path = extractTmdbPath(originalUrl);
    if (!path) return originalUrl;
    if (IS_SERVER_DEPLOYED) {
      const serverBase = API_BASE_URL.replace(/\/api\/?$/, '');
      return `${serverBase}/api/tmdb/image?path=${encodeURIComponent(path)}&size=${encodeURIComponent(size)}`;
    }
    if (isProduction) {
      return `https://image.tmdb.org/t/p/${size}${path}`;
    }
    const serverBase = API_BASE_URL.replace(/\/api\/?$/, '');
    return `${serverBase}/api/tmdb/image?path=${encodeURIComponent(path)}&size=${encodeURIComponent(size)}`;
  } catch (e) {
    return originalUrl;
  }
};

export const fetchMovies = async (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.search) params.append('search', filters.search);
  if (filters.genre) params.append('genre', filters.genre);
  if (filters.sort) params.append('sort', filters.sort);
  if (filters.ottPlatform) params.append('ottPlatform', filters.ottPlatform);
  if (filters.language) params.append('language', filters.language);
  if (filters.yearFrom) params.append('yearFrom', filters.yearFrom);
  if (filters.yearTo) params.append('yearTo', filters.yearTo);
  if (filters.ratingMin) params.append('ratingMin', filters.ratingMin);
  if (filters.ratingMax) params.append('ratingMax', filters.ratingMax);

  const url = `${API_BASE_URL}/movies?${params.toString()}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch movies');
  }
  return response.json();
};

export const fetchMovieById = async (id) => {
  const response = await fetch(`${API_BASE_URL}/movies/${id}`);
  if (!response.ok) {
    throw new Error('Failed to fetch movie details');
  }
  return response.json();
};

export const addMovie = async (movieData) => {
  const token = localStorage.getItem('mc_token');
  const headers = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}/movies`, {
    method: 'POST',
    headers,
    body: JSON.stringify(movieData),
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || 'Failed to add movie');
  }
  return response.json();
};

export const deleteMovie = async (id) => {
  const token = localStorage.getItem('mc_token');
  const headers = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}/movies/${id}`, {
    method: 'DELETE',
    headers,
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || 'Failed to toggle like');
  }
  return response.json();
};

export const bulkDeleteMovies = async (ids) => {
  const token = localStorage.getItem('mc_token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const response = await fetch(`${API_BASE_URL}/movies/bulk`, {
    method: 'DELETE',
    headers,
    body: JSON.stringify({ ids }),
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || 'Failed to bulk delete movies');
  }
  return response.json();
};

// ─── TRIVIA SEEDER ───
export const seedTriviaUpdates = async (count = 15) => {
  const response = await fetch(`${API_BASE_URL}/seeds/trivia`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
    body: JSON.stringify({ count }),
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || 'Failed to seed trivia');
  }
  return response.json();
};


export const addMovieReview = async (movieId, reviewData) => {
  const token = localStorage.getItem('mc_token');
  const headers = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}/movies/${movieId}/reviews`, {
    method: 'POST',
    headers,
    body: JSON.stringify(reviewData),
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || 'Failed to submit review');
  }
  return response.json();
};

export const deleteReview = async (movieId, reviewId) => {
  const token = localStorage.getItem('mc_token');
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const response = await fetch(`${API_BASE_URL}/movies/${movieId}/reviews/${reviewId}`, {
    method: 'DELETE',
    headers,
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || 'Failed to delete review');
  }
  return response.json();
};

export const toggleReviewLike = async (movieId, reviewId) => {
  const token = localStorage.getItem('mc_token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const response = await fetch(`${API_BASE_URL}/movies/${movieId}/reviews/${reviewId}/like`, {
    method: 'POST',
    headers,
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || 'Failed to toggle like');
  }
  return response.json();
};

export const addReviewReply = async (movieId, reviewId, body) => {
  const token = localStorage.getItem('mc_token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const response = await fetch(`${API_BASE_URL}/movies/${movieId}/reviews/${reviewId}/replies`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ body }),
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || 'Failed to add reply');
  }
  return response.json();
};

export const registerUser = async (username, email, password) => {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, email, password }),
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || 'Registration failed');
  }
  return response.json();
};

export const loginUser = async (username, password) => {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, password }),
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || 'Login failed');
  }
  return response.json();
};

export const fetchCurrentUser = async (token) => {
  const response = await fetch(`${API_BASE_URL}/auth/me`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    throw new Error('Verification failed');
  }
  return response.json();
};

const authHeaders = () => {
  const token = localStorage.getItem('mc_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const fetchCommunityThreads = async () => {
  const response = await fetch(`${API_BASE_URL}/community/threads`);
  if (!response.ok) {
    throw new Error('Failed to fetch community threads');
  }
  return response.json();
};

export const createCommunityThread = async (threadData) => {
  const response = await fetch(`${API_BASE_URL}/community/threads`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
    body: JSON.stringify(threadData),
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || 'Failed to create community thread');
  }
  return response.json();
};

export const createCommunityReply = async (threadId, replyData) => {
  const response = await fetch(`${API_BASE_URL}/community/threads/${threadId}/replies`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
    body: JSON.stringify(replyData),
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || 'Failed to post reply');
  }
  return response.json();
};

export const refreshMoviePosters = async () => {
  const response = await fetch(`${API_BASE_URL}/admin/refresh-posters`, {
    method: 'POST',
    headers: authHeaders(),
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || 'Failed to refresh movie posters');
  }
  return response.json();
};

export const updateMovie = async (movieId, movieData) => {
  const token = localStorage.getItem('mc_token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const response = await fetch(`${API_BASE_URL}/movies/${movieId}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(movieData),
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || 'Failed to update movie');
  }
  return response.json();
};

export const fetchUsers = async () => {
  const response = await fetch(`${API_BASE_URL}/admin/users`, {
    headers: authHeaders(),
  });
  if (!response.ok) {
    throw new Error('Failed to fetch users');
  }
  return response.json();
};

export const fetchPublicUsers = async () => {
  const response = await fetch(`${API_BASE_URL}/users`);
  if (!response.ok) throw new Error('Failed to fetch users');
  return response.json();
};

export const fetchUserProfile = async (username) => {
  const response = await fetch(`${API_BASE_URL}/users/${encodeURIComponent(username)}`);
  if (!response.ok) throw new Error('Failed to fetch user profile');
  return response.json();
};

export const updateUserProfile = async (profileData) => {
  const response = await fetch(`${API_BASE_URL}/users/profile`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(profileData),
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || 'Failed to update profile');
  }
  return response.json();
};

export const followUser = async (username) => {
  const response = await fetch(`${API_BASE_URL}/users/${encodeURIComponent(username)}/follow`, {
    method: 'POST',
    headers: authHeaders(),
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || 'Failed to follow user');
  }
  return response.json();
};

export const unfollowUser = async (username) => {
  const response = await fetch(`${API_BASE_URL}/users/${encodeURIComponent(username)}/follow`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || 'Failed to unfollow user');
  }
  return response.json();
};

export const deleteUser = async (username) => {
  const response = await fetch(`${API_BASE_URL}/admin/users/${encodeURIComponent(username)}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || 'Failed to delete user');
  }
  return response.json();
};

export const bulkDeleteUsers = async (usernames) => {
  const response = await fetch(`${API_BASE_URL}/admin/users/bulk`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ usernames }),
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || 'Failed to bulk delete users');
  }
  return response.json();
};

export const fetchTmdbCredits = async (tmdbId) => {
  const response = await fetch(`${API_BASE_URL}/tmdb/credits/${tmdbId}`);
  if (!response.ok) return [];
  return response.json();
};

export const fetchWatchProviders = async (tmdbId) => {
  if (!tmdbId) return [];
  try {
    const response = await fetch(`${API_BASE_URL}/tmdb/providers/${tmdbId}`);
    if (!response.ok) return [];
    return response.json();
  } catch {
    return [];
  }
};

export const fetchTmdbLogo = async (tmdbId) => {
  const response = await fetch(`${API_BASE_URL}/tmdb/logo/${tmdbId}`);
  if (!response.ok) return null;
  const data = await response.json();
  return data.logoUrl || null;
};

export const fetchTmdbMovieDetails = async (tmdbId) => {
  const response = await fetch(`${API_BASE_URL}/tmdb/details/${tmdbId}`);
  if (!response.ok) return null;
  return response.json();
};

export const updateUserRole = async (username, role) => {
  const response = await fetch(`${API_BASE_URL}/admin/users/${encodeURIComponent(username)}/role`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ role }),
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || 'Failed to update user role');
  }
  return response.json();
};

export const deleteCommunityThread = async (threadId) => {
  const response = await fetch(`${API_BASE_URL}/admin/threads/${threadId}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || 'Failed to delete thread');
  }
  return response.json();
};

export const bulkAddMovies = async (titles, onProgress, existingTitles = []) => {
  const results = [];
  const existingLower = existingTitles.map(t => t.toLowerCase());
  for (let i = 0; i < titles.length; i++) {
    const title = titles[i].trim();
    if (!title) continue;
    if (existingLower.includes(title.toLowerCase())) {
      results.push({ title, status: 'skipped', error: 'Already exists' });
      if (onProgress) onProgress(i + 1, titles.length, title, 'skipped');
      continue;
    }
    try {
      if (onProgress) onProgress(i, titles.length, title, 'searching');
      const searchResults = await searchTmdbMovies(title);
      let movieData;
      if (Array.isArray(searchResults) && searchResults.length > 0) {
        const best = searchResults[0];
        movieData = {
          title: best.title || title,
          description: best.description || '',
          posterUrl: best.posterUrl || '',
          releaseDate: best.releaseDate || '',
          language: (best.language || '').toUpperCase(),
          genre: '',
          runtime: '',
          criticScore: 5.0,
          audienceScore: 50,
          rating: 5.0,
          cast: [],
        };
        if (best.tmdbId) {
          try {
            const credits = await fetchTmdbCredits(best.tmdbId);
            const details = await fetchTmdbMovieDetails(best.tmdbId);
            if (Array.isArray(credits)) movieData.cast = credits;
            if (details) {
              movieData.director = details.director || '';
              movieData.writer = details.writer || '';
              movieData.studio = details.studio || '';
              movieData.genre = details.genre || '';
              movieData.runtime = details.runtime || '';
            }
          } catch (e) {}
        }
      } else {
        movieData = {
          title,
          description: '',
          posterUrl: '',
          releaseDate: '',
          language: '',
          genre: '',
          runtime: '',
          cast: [],
        };
      }
      movieData.isHero = false;
      movieData.isStaffPick = false;
      movieData.staffPickType = '';
      movieData.isUpcoming = false;
      if (onProgress) onProgress(i, titles.length, title, 'adding');
      const created = await addMovie(movieData);
      results.push({ title, status: 'added', movie: created });
      if (onProgress) onProgress(i + 1, titles.length, title, 'done');
    } catch (err) {
      results.push({ title, status: 'error', error: err.message });
      if (onProgress) onProgress(i + 1, titles.length, title, 'error');
    }
  }
  return results;
};

export const searchTmdbMovies = async (query) => {
  const response = await fetch(`${API_BASE_URL}/tmdb/search?query=${encodeURIComponent(query)}`);
  if (!response.ok) {
    throw new Error('Failed to search TMDB');
  }
  return response.json();
};

export const curateMovie = async (movieId, curationData) => {
  const response = await fetch(`${API_BASE_URL}/movies/${movieId}/curate`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
    body: JSON.stringify(curationData),
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || 'Failed to update curation settings');
  }
  return response.json();
};

// ─── LISTS ───

export const createList = async (listData) => {
  const response = await fetch(`${API_BASE_URL}/lists`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(listData),
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || 'Failed to create list');
  }
  return response.json();
};

export const getLists = async (username) => {
  const params = username ? `?username=${encodeURIComponent(username)}` : '';
  const response = await fetch(`${API_BASE_URL}/lists${params}`);
  if (!response.ok) throw new Error('Failed to fetch lists');
  return response.json();
};

export const getList = async (listId) => {
  const response = await fetch(`${API_BASE_URL}/lists/${listId}`);
  if (!response.ok) throw new Error('Failed to fetch list');
  return response.json();
};

export const addMovieToList = async (listId, movieId) => {
  const response = await fetch(`${API_BASE_URL}/lists/${listId}/movies`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ movieId }),
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || 'Failed to add movie');
  }
  return response.json();
};

export const removeMovieFromList = async (listId, movieId) => {
  const response = await fetch(`${API_BASE_URL}/lists/${listId}/movies/${movieId}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || 'Failed to remove movie');
  }
  return response.json();
};

export const deleteList = async (listId) => {
  const response = await fetch(`${API_BASE_URL}/lists/${listId}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || 'Failed to delete list');
  }
  return response.json();
};

// ─── LEADERBOARD ───

export const fetchLeaderboard = async () => {
  const response = await fetch(`${API_BASE_URL}/leaderboard`);
  if (!response.ok) throw new Error('Failed to fetch leaderboard');
  return response.json();
};

// ─── CINE UPDATES ───

export const fetchCineUpdates = async () => {
  const response = await fetch(`${API_BASE_URL}/cine-updates`);
  if (!response.ok) throw new Error('Failed to fetch cine updates');
  return response.json();
};

export const createCineUpdate = async (updateData) => {
  const response = await fetch(`${API_BASE_URL}/cine-updates`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
    body: JSON.stringify(updateData),
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || 'Failed to create cine update');
  }
  return response.json();
};

export const updateCineUpdate = async (updateId, updateData) => {
  const response = await fetch(`${API_BASE_URL}/cine-updates/${updateId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
    body: JSON.stringify(updateData),
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || 'Failed to update cine update');
  }
  return response.json();
};

export const deleteCineUpdate = async (updateId) => {
  const response = await fetch(`${API_BASE_URL}/cine-updates/${updateId}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || 'Failed to delete cine update');
  }
  return response.json();
};

export const bulkDeleteCineUpdates = async (ids) => {
  const response = await fetch(`${API_BASE_URL}/cine-updates/bulk`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ ids }),
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || 'Failed to bulk delete cine updates');
  }
  return response.json();
};

export const deleteAllCineUpdates = async () => {
  const response = await fetch(`${API_BASE_URL}/cine-updates`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || 'Failed to delete all cine updates');
  }
  return response.json();
};

// ─── OTT ALERTS ───

export const addOttAlert = async (alertData) => {
  const response = await fetch(`${API_BASE_URL}/ott-alerts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(alertData),
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || 'Failed to create alert');
  }
  return response.json();
};

export const removeOttAlert = async (movieId) => {
  const response = await fetch(`${API_BASE_URL}/ott-alerts/${encodeURIComponent(movieId)}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || 'Failed to remove alert');
  }
  return response.json();
};

export const fetchUserOttAlerts = async () => {
  const response = await fetch(`${API_BASE_URL}/ott-alerts`, {
    headers: authHeaders(),
  });
  if (!response.ok) throw new Error('Failed to fetch alerts');
  return response.json();
};

export const toggleCineUpdateLike = async (updateId) => {
  const response = await fetch(`${API_BASE_URL}/cine-updates/${updateId}/like`, {
    method: 'POST',
    headers: authHeaders(),
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || 'Failed to toggle like');
  }
  return response.json();
};
