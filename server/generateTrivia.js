import { buildTmdbUrl, getTmdbHeaders } from './db.js';
import { createCineUpdate } from './db.js';

const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';

const TRIVIA_TEMPLATES = [
  {
    category: 'Box Office',
    condition: (m) => m.budget > 0 && m.revenue > 0,
    generate: (m) => {
      const budgetCr = (m.budget / 1e7).toFixed(1);
      const revenueCr = (m.revenue / 1e7).toFixed(1);
      const multiple = (m.revenue / m.budget).toFixed(1);
      return {
        title: `${m.title} earned ${multiple}x its budget at the box office`,
        body: `Made on a budget of $${budgetCr} Cr, ${m.title} went on to gross $${revenueCr} Cr worldwide, becoming a massive commercial success.`,
      };
    },
  },
  {
    category: 'Box Office',
    condition: (m) => m.budget > 1e8,
    generate: (m) => {
      const budgetCr = (m.budget / 1e7).toFixed(1);
      return {
        title: `${m.title} — one of the most expensive films ever made`,
        body: `With a staggering budget of $${budgetCr} Cr, ${m.title} ranks among the most ambitious and costly productions in cinema history.`,
      };
    },
  },
  {
    category: 'Box Office',
    condition: (m) => m.revenue > 1e9,
    generate: (m) => {
      const revenueCr = (m.revenue / 1e7).toFixed(1);
      return {
        title: `${m.title} joins the billion-dollar club!`,
        body: `${m.title} grossed over $${revenueCr} Cr worldwide, cementing its place among the highest-grossing films of all time.`,
      };
    },
  },
  {
    category: 'Review',
    condition: (m) => m.vote_average >= 7,
    generate: (m) => ({
      title: `${m.title} scores ${m.vote_average}/10 on TMDB`,
      body: `Audiences and critics alike have praised ${m.title}, which holds an impressive ${m.vote_average} rating on TMDB based on ${m.vote_count?.toLocaleString() || 'many'} votes.`,
    }),
  },
  {
    category: 'Review',
    condition: (m) => m.vote_average >= 8.5,
    generate: (m) => ({
      title: `${m.title} is certified fresh at ${m.vote_average}/10!`,
      body: `Near-perfect score of ${m.vote_average}/10 on TMDB makes ${m.title} one of the highest-rated films among audiences worldwide.`,
    }),
  },
  {
    category: 'News',
    condition: (m) => {
      if (!m.release_date) return false;
      const years = (Date.now() - new Date(m.release_date).getTime()) / 3.154e10;
      return years >= 5 && years <= 30;
    },
    generate: (m) => {
      const years = Math.floor((Date.now() - new Date(m.release_date).getTime()) / 3.154e10);
      return {
        title: `It's been ${years} years since ${m.title} released!`,
        body: `Released in ${m.release_date?.split('-')[0] || 'N/A'}, ${m.title} continues to be celebrated by fans ${years} years on.`,
      };
    },
  },
  {
    category: 'News',
    condition: (m) => {
      if (!m.release_date) return false;
      const years = (Date.now() - new Date(m.release_date).getTime()) / 3.154e10;
      return years < 1;
    },
    generate: (m) => ({
      title: `${m.title} released less than a year ago — already a fan favorite!`,
      body: `Since its release in ${m.release_date?.split('-')[0] || 'N/A'}, ${m.title} has been making waves and building a loyal fanbase.`,
    }),
  },
  {
    category: 'Rumor',
    condition: (m) => m.runtime > 150,
    generate: (m) => ({
      title: `${m.title} runs for ${Math.floor(m.runtime / 60)}h ${m.runtime % 60}m — worth every minute!`,
      body: `With a runtime of ${m.runtime} minutes, ${m.title} is an epic that demands your full attention. Fans say it flies by!`,
    }),
  },
  {
    category: 'Rumor',
    condition: (m) => m.runtime > 0 && m.runtime <= 100,
    generate: (m) => ({
      title: `${m.title} is a crisp ${m.runtime}-minute watch`,
      body: `At just ${m.runtime} minutes, ${m.title} delivers a tight, no-fat storytelling experience perfect for a quick movie night.`,
    }),
  },
  {
    category: 'Update',
    condition: (m) => m.original_language && m.original_language !== 'en',
    generate: (m) => ({
      title: `${m.title} — a gem from ${m.original_language.toUpperCase()} cinema`,
      body: `Originally in ${m.original_language.toUpperCase()}, ${m.title} showcases the rich storytelling and cultural depth of ${m.original_language === 'ta' ? 'Tamil' : m.original_language === 'te' ? 'Telugu' : m.original_language === 'hi' ? 'Hindi' : m.original_language === 'ml' ? 'Malayalam' : m.original_language === 'kn' ? 'Kannada' : m.original_language === 'bn' ? 'Bengali' : m.original_language === 'mr' ? 'Marathi' : m.original_language === 'pa' ? 'Punjabi' : m.original_language === 'gu' ? 'Gujarati' : 'regional'} cinema.`,
    }),
  },
  {
    category: 'Box Office',
    condition: (m) => m.budget > 0,
    generate: (m) => {
      const budgetCr = (m.budget / 1e7).toFixed(1);
      return {
        title: `Did you know? ${m.title} was made on a budget of $${budgetCr} Cr`,
        body: `The production of ${m.title} cost approximately $${budgetCr} Cr, making it a ${m.budget > 1e8 ? 'big-budget blockbuster' : 'mid-range production'} by industry standards.`,
      };
    },
  },
  {
    category: 'Interview',
    condition: (m) => m.production_companies?.length > 0,
    generate: (m) => ({
      title: `${m.title} was produced by ${m.production_companies[0]?.name || 'a major studio'}`,
      body: `Backed by ${m.production_companies[0]?.name || 'a major production house'}, ${m.title} brought together creative talent to deliver this cinematic experience.`,
    }),
  },
];

function getRandomTemplate(movie) {
  const candidates = TRIVIA_TEMPLATES.filter(t => t.condition(movie));
  if (candidates.length === 0) return null;
  return candidates[Math.floor(Math.random() * candidates.length)];
}

function formatTimestamp() {
  const hrs = Math.floor(Math.random() * 12) + 1;
  const unit = Math.random() > 0.5 ? 'h' : 'd';
  return `${hrs}${unit} ago`;
}

function movieToUpdate(movie, trivia) {
  const poster = movie.poster_path
    ? `${TMDB_IMAGE_BASE_URL}/w500${movie.poster_path}`
    : '';
  return {
    title: trivia.title,
    body: trivia.body,
    category: trivia.category,
    movieName: movie.title,
    imageUrl: poster,
    timestamp: formatTimestamp(),
    likes: Math.floor(Math.random() * 500) + 50,
    likedBy: [],
  };
}

export async function fetchTrendingMovies(page = 1) {
  const url = buildTmdbUrl('trending/movie/week', { page });
  const res = await fetch(url, { headers: getTmdbHeaders() });
  if (!res.ok) {
    console.warn('TMDB trending fetch failed:', res.status);
    return [];
  }
  const data = await res.json();
  return data.results || [];
}

export async function fetchPopularMovies(page = 1) {
  const url = buildTmdbUrl('movie/popular', { page, region: 'IN', language: 'en-US' });
  const res = await fetch(url, { headers: getTmdbHeaders() });
  if (!res.ok) {
    console.warn('TMDB popular fetch failed:', res.status);
    return [];
  }
  const data = await res.json();
  return data.results || [];
}

export async function fetchMovieDetails(tmdbId) {
  const url = buildTmdbUrl(`movie/${tmdbId}`);
  const res = await fetch(url, { headers: getTmdbHeaders() });
  if (!res.ok) return null;
  return res.json();
}

export async function generateTriviaUpdates(count = 20) {
  const movies = [];

  const [trending, popular] = await Promise.all([
    fetchTrendingMovies(1),
    fetchPopularMovies(1),
  ]);

  const seen = new Set();
  for (const m of [...trending, ...popular]) {
    if (!seen.has(m.id)) {
      seen.add(m.id);
      movies.push(m);
    }
  }

  const updates = [];

  for (const movie of movies) {
    if (updates.length >= count) break;

    const details = await fetchMovieDetails(movie.id);
    if (!details) continue;

    const template = getRandomTemplate(details);
    if (!template) continue;

    const trivia = template.generate(details);
    updates.push(movieToUpdate(details, trivia));
  }

  const shuffled = updates.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export async function seedTriviaUpdates(count = 15, adminUser = null) {
  const updates = await generateTriviaUpdates(count);
  const created = [];
  for (const u of updates) {
    try {
      const result = await createCineUpdate(u, adminUser);
      created.push(result);
    } catch (e) {
      console.warn('Failed to create trivia update:', e.message);
    }
  }
  return created;
}
