import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import crypto from 'crypto';

import { generateSynopsisWithAI, generateRatingWithAI } from './openai.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '.env') });

const DB_FILE = path.resolve(__dirname, 'db.json');
let useMongoDB = false;
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';

const getTmdbHeaders = () => {
  if (process.env.TMDB_ACCESS_TOKEN) {
    return { Authorization: `Bearer ${process.env.TMDB_ACCESS_TOKEN}` };
  }
  return {};
};

const buildTmdbUrl = (path, params = {}) => {
  const url = new URL(`https://api.themoviedb.org/3/${path}`);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, value);
    }
  });
  if (!process.env.TMDB_ACCESS_TOKEN && process.env.TMDB_API_KEY) {
    url.searchParams.set('api_key', process.env.TMDB_API_KEY);
  }
  return url;
};

const hasTmdbCredentials = () => Boolean(process.env.TMDB_ACCESS_TOKEN || process.env.TMDB_API_KEY);

const upgradeTamilMdbImageUrl = (url, targetSize) => {
  if (!url || !url.includes('media.tamilmdb.com')) return url;
  return url.replace(/\/175x245\//, `/${targetSize}/`);
};

const applyLocalHdImageFallback = (movie) => ({
  ...movie,
  posterUrl: upgradeTamilMdbImageUrl(movie.posterUrl, '600x840'),
  backdropUrl: upgradeTamilMdbImageUrl(movie.backdropUrl, '1024xa')
});

const needsTmdbImageRefresh = (movie) => {
  if (!movie) return false;

  const hasPlaceholderCast = Array.isArray(movie.cast) && movie.cast.some(member => {
    const avatar = member.avatarUrl || '';
    return !avatar || avatar.includes('unsplash.com') || avatar.includes('placeholder');
  });

  const hasEmptyCast = movie.tmdbId && (!Array.isArray(movie.cast) || movie.cast.length === 0);

  return (
    !movie.tmdbId ||
    !movie.posterUrl ||
    !movie.backdropUrl ||
    movie.posterUrl.includes('media.tamilmdb.com') ||
    movie.backdropUrl.includes('media.tamilmdb.com') ||
    hasPlaceholderCast ||
    hasEmptyCast
  );
};

const fetchTmdbMovieDetails = async (tmdbId) => {
  if (!hasTmdbCredentials() || !tmdbId) return null;

  try {
    const response = await fetch(buildTmdbUrl(`movie/${tmdbId}`), { headers: getTmdbHeaders() });
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.warn(`TMDB movie lookup failed for ID "${tmdbId}":`, error.message);
    return null;
  }
};

const pickTmdbImages = (movie) => {
  if (!movie) return null;
  return {
    posterUrl: movie.poster_path ? `${TMDB_IMAGE_BASE_URL}/w780${movie.poster_path}` : null,
    backdropUrl: movie.backdrop_path ? `${TMDB_IMAGE_BASE_URL}/original${movie.backdrop_path}` : null,
    tmdbId: movie.id
  };
};

const pickTmdbCredits = (credits) => {
  if (!credits || !Array.isArray(credits.cast)) return null;
  return credits.cast
    .slice(0, 8)
    .map(member => ({
      name: member.name,
      role: member.character || '',
      avatarUrl: member.profile_path ? `${TMDB_IMAGE_BASE_URL}/w185${member.profile_path}` : ''
    }));
};

export const searchTmdbMovies = async (query) => {
  if (!hasTmdbCredentials() || !query) return [];

  try {
    const url = buildTmdbUrl('search/movie', {
      query,
      include_adult: 'false',
      language: 'en-US',
      page: 1
    });

    const response = await fetch(url, { headers: getTmdbHeaders() });
    if (!response.ok) return [];

    const payload = await response.json();
    const results = payload.results || [];

    return results.slice(0, 10).map(movie => ({
      tmdbId: movie.id,
      title: movie.title,
      originalTitle: movie.original_title,
      description: movie.overview,
      releaseYear: movie.release_date ? movie.release_date.split('-')[0] : '',
      releaseDate: movie.release_date || '',
      posterUrl: movie.poster_path ? `${TMDB_IMAGE_BASE_URL}/w342${movie.poster_path}` : '',
      backdropUrl: movie.backdrop_path ? `${TMDB_IMAGE_BASE_URL}/original${movie.backdrop_path}` : '',
      genre: movie.genre_ids ? movie.genre_ids.join(',') : '',
      rating: movie.vote_average || 0,
      language: movie.original_language || ''
    }));
  } catch (error) {
    console.warn(`TMDB search failed for "${query}":`, error.message);
    return [];
  }
};

export const fetchTmdbMovieCredits = async (tmdbId) => {
  if (!hasTmdbCredentials() || !tmdbId) return null;

  try {
    const response = await fetch(buildTmdbUrl(`movie/${tmdbId}/credits`), { headers: getTmdbHeaders() });
    if (!response.ok) return null;
    const json = await response.json();
    return pickTmdbCredits(json);
  } catch (error) {
    console.warn(`TMDB credits lookup failed for ID "${tmdbId}":`, error.message);
    return null;
  }
};

export const fetchTmdbMovieDetailsFull = async (tmdbId) => {
  if (!hasTmdbCredentials() || !tmdbId) return null;

  try {
    const [details, credits, videos] = await Promise.all([
      fetch(buildTmdbUrl(`movie/${tmdbId}`), { headers: getTmdbHeaders() }).then(r => r.ok ? r.json() : null),
      fetch(buildTmdbUrl(`movie/${tmdbId}/credits`), { headers: getTmdbHeaders() }).then(r => r.ok ? r.json() : null),
      fetch(buildTmdbUrl(`movie/${tmdbId}/videos`), { headers: getTmdbHeaders() }).then(r => r.ok ? r.json() : null)
    ]);

    if (!details) return null;

    const crew = credits?.crew || [];
    const director = crew.find(c => c.job === 'Director')?.name || '';
    const writer = crew.find(c => c.department === 'Writing')?.name || '';
    const studio = details.production_companies?.[0]?.name || '';
    const genres = (details.genres || []).map(g => g.name).join(' / ');
    const runtime = details.runtime ? `${Math.floor(details.runtime / 60)}h ${details.runtime % 60}m` : '';

    let trailerUrl = '', trailerChannelName = '';
    const trailer = (videos?.results || []).find(v => v.site === 'YouTube' && v.type === 'Trailer')
      || (videos?.results || []).find(v => v.site === 'YouTube' && v.type === 'Teaser');
    if (trailer) {
      trailerUrl = `https://www.youtube.com/watch?v=${trailer.key}`;
      trailerChannelName = trailer.name || '';
    }

    return {
      director,
      writer,
      studio,
      genre: genres,
      runtime,
      releaseYear: details.release_date ? details.release_date.split('-')[0] : '',
      releaseDate: details.release_date || '',
      trailerUrl,
      trailerChannelName
    };
  } catch (error) {
    console.warn(`TMDB full details lookup failed for ID "${tmdbId}":`, error.message);
    return null;
  }
};

export const fetchTmdbWatchProviders = async (tmdbId) => {
  if (!hasTmdbCredentials() || !tmdbId) return [];

  try {
    const url = buildTmdbUrl(`movie/${tmdbId}/watch/providers`);
    const response = await fetch(url, { headers: getTmdbHeaders() });
    if (!response.ok) return [];
    const json = await response.json();
    const results = json.results || {};
    const inData = results.IN || results.US || null;
    if (!inData) return [];
    const providers = [
      ...(inData.flatrate || []),
      ...(inData.rent || []),
      ...(inData.buy || [])
    ];
    const seen = new Set();
    return providers.filter(p => {
      if (seen.has(p.provider_id)) return false;
      seen.add(p.provider_id);
      return true;
    }).map(p => ({
      id: p.provider_id,
      name: p.provider_name,
      logo: p.logo_path ? `${TMDB_IMAGE_BASE_URL}/w92${p.logo_path}` : null,
      type: inData.flatrate?.some(fp => fp.provider_id === p.provider_id) ? 'flatrate' : 'other'
    }));
  } catch (error) {
    console.warn(`TMDB watch providers lookup failed for ID "${tmdbId}":`, error.message);
    return [];
  }
};

export const fetchTmdbMovieLogo = async (tmdbId) => {
  if (!hasTmdbCredentials() || !tmdbId) return null;

  try {
    const url = buildTmdbUrl(`movie/${tmdbId}/images`, { include_image_language: 'en,null' });
    const response = await fetch(url, { headers: getTmdbHeaders() });
    if (!response.ok) return null;
    const json = await response.json();
    const logos = json.logos || [];
    const preferred = logos.find(l => l.iso_639_1 === 'en') || logos[0];
    if (!preferred) return null;
    return `https://image.tmdb.org/t/p/w500${preferred.file_path}`;
  } catch (error) {
    console.warn(`TMDB logo lookup failed for ID "${tmdbId}":`, error.message);
    return null;
  }
};

const applyTmdbCastAvatars = (currentCast, tmdbCast) => {
  if (!Array.isArray(tmdbCast) || tmdbCast.length === 0) {
    return currentCast;
  }

  if (!Array.isArray(currentCast) || currentCast.length === 0) {
    return tmdbCast;
  }

  const normalizedTmdb = tmdbCast.map(member => ({
    ...member,
    nameKey: member.name.toLowerCase().trim(),
    roleKey: member.role.toLowerCase().trim()
  }));

  return currentCast.map(member => {
    const currentName = member.name?.toLowerCase().trim();
    const currentRole = member.role?.toLowerCase().trim();
    const exactMatch = normalizedTmdb.find(tc => tc.nameKey === currentName);
    const roleMatch = normalizedTmdb.find(tc => currentRole && tc.roleKey.includes(currentRole.split('/')[0].trim()));
    const fallbackMatch = normalizedTmdb[0];
    const match = exactMatch || roleMatch || fallbackMatch;

    if (!match) return member;
    if (member.avatarUrl && !member.avatarUrl.includes('unsplash.com') && !member.avatarUrl.includes('placeholder')) {
      return member;
    }

    return {
      ...member,
      avatarUrl: match.avatarUrl
    };
  });
};

const fetchTmdbMovieImages = async ({ title, releaseYear, language = 'ta', tmdbId }) => {
  if (!hasTmdbCredentials() || (!title && !tmdbId)) return null;

  const details = await fetchTmdbMovieDetails(tmdbId);
  if (details) return pickTmdbImages(details);

  try {
    const url = buildTmdbUrl('search/movie', {
      query: title,
      year: releaseYear,
      include_adult: 'false',
      language: 'en-US',
      region: 'IN'
    });

    const response = await fetch(url, { headers: getTmdbHeaders() });
    if (!response.ok) return null;

    const payload = await response.json();
    const results = payload.results || [];
    const lowerTitle = title.toLowerCase();
    const bestMatch =
      results.find(movie => movie.original_language === language && movie.title?.toLowerCase() === lowerTitle) ||
      results.find(movie => movie.original_language === language) ||
      results.find(movie => movie.title?.toLowerCase() === lowerTitle) ||
      results[0];

    if (!bestMatch) return null;
    return pickTmdbImages(bestMatch);
  } catch (error) {
    console.warn(`TMDB image lookup failed for "${title}":`, error.message);
    return null;
  }
};

const fetchTmdbMovieTrailer = async (tmdbId) => {
  if (!hasTmdbCredentials() || !tmdbId) return { trailerUrl: '', trailerChannelName: '' };
  try {
    const url = buildTmdbUrl(`movie/${tmdbId}/videos`);
    const response = await fetch(url, { headers: getTmdbHeaders() });
    if (!response.ok) return { trailerUrl: '', trailerChannelName: '' };
    const data = await response.json();
    const trailer = (data.results || []).find(v => v.site === 'YouTube' && v.type === 'Trailer')
      || (data.results || []).find(v => v.site === 'YouTube' && v.type === 'Teaser');
    if (trailer) {
      return {
        trailerUrl: `https://www.youtube.com/watch?v=${trailer.key}`,
        trailerChannelName: trailer.name || ''
      };
    }
    return { trailerUrl: '', trailerChannelName: '' };
  } catch (error) {
    console.warn(`TMDB trailer lookup failed for ID "${tmdbId}":`, error.message);
    return { trailerUrl: '', trailerChannelName: '' };
  }
};

const enrichMovieWithTmdbImages = async (movie) => {
  const localFallbackMovie = applyLocalHdImageFallback(movie);
  const images = await fetchTmdbMovieImages(movie);
  const tmdbId = images?.tmdbId || movie.tmdbId;
  const credits = await fetchTmdbMovieCredits(tmdbId);
  const castWithAvatars = applyTmdbCastAvatars(localFallbackMovie.cast || [], credits);
  const trailer = tmdbId ? await fetchTmdbMovieTrailer(tmdbId) : null;

  const tmdbTrailerUrl = trailer?.trailerUrl || '';
  const tmdbChannelName = trailer?.trailerChannelName || '';

  return {
    ...localFallbackMovie,
    posterUrl: images?.posterUrl || localFallbackMovie.posterUrl,
    backdropUrl: images?.backdropUrl || localFallbackMovie.backdropUrl,
    tmdbId: tmdbId,
    cast: castWithAvatars,
    trailerUrl: tmdbTrailerUrl || localFallbackMovie.trailerUrl || '',
    trailerChannelName: tmdbChannelName || localFallbackMovie.trailerChannelName || '',
  };
};

const enrichMoviesWithTmdbImages = async (movies) => {
  if (!hasTmdbCredentials()) return movies.map(applyLocalHdImageFallback);
  return Promise.all(movies.map(movie => enrichMovieWithTmdbImages(movie)));
};

const refreshMoviesIfNeeded = async (movies) => {
  if (!movies?.length) return [];
  if (!hasTmdbCredentials()) return movies.map(applyLocalHdImageFallback);
  if (!movies.some(needsTmdbImageRefresh)) return movies;
  return cachedEnrichMoviesWithTmdbImages(movies);
};

// Default initial seed data (Real movie hits matching design categories)
const initialMovies = [
  {
    id: "blade-runner-2049",
    title: "Blade Runner 2049",
    description: "A new blade runner, LAPD Officer K, unearths a long-buried secret that has the potential to plunge what's left of society into chaos. K's discovery leads him on a quest to find Rick Deckard, a former LAPD blade runner who has been missing for thirty years.",
    rating: 8.0,
    criticScore: 9.4,
    audienceScore: 95,
    genre: "Sci-Fi / Noir",
    releaseYear: 2017,
    runtime: "2h 44m",
    director: "Denis Villeneuve",
    writer: "Hampton Fancher",
    studio: "Warner Bros. Pictures",
    releaseDate: "Oct 6, 2017",
    language: "English (Atmos)",
    posterUrl: "https://image.tmdb.org/t/p/w500/gajva2L0rPYkEWjzgFlBXCAVBE5.jpg",
    backdropUrl: "https://image.tmdb.org/t/p/original/sAtoMqDVhNDQBc3QJL3RF6hlhGq.jpg",
    isHero: true,
    isStaffPick: false,
    staffPickType: "",
    cast: [
      { name: "Ryan Gosling", role: "Officer K", avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200&auto=format&fit=crop" },
      { name: "Harrison Ford", role: "Rick Deckard", avatarUrl: "https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=200&auto=format&fit=crop" },
      { name: "Ana de Armas", role: "Joi", avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&auto=format&fit=crop" },
      { name: "Denis Villeneuve", role: "Director", avatarUrl: "https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=200&auto=format&fit=crop" }
    ],
    reviews: [
      {
        id: "rev-neon-1",
        user: "Alexander Thorne",
        avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=150&auto=format&fit=crop",
        role: "Top Critic",
        rating: 10,
        text: "A visual masterpiece that redefines the sci-fi genre. The lighting and sound design are worth the price of admission alone. Truly atmospheric and hypnotic.",
        timestamp: "2h ago",
        likes: 1240,
        comments: 42,
        replies: [
          { id: 'rev-reply-n1', author: 'Priya Karthik', body: 'Totally agree about the sound design. That bass in the opening scene was unreal.', timestamp: '1h ago' },
          { id: 'rev-reply-n2', author: 'Rajesh Menon', body: 'I felt the pacing was a bit slow though. But visually stunning for sure.', timestamp: '45m ago' }
        ]
      },
      {
        id: "rev-neon-2",
        user: "Elena Vane",
        avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=150&auto=format&fit=crop",
        role: "Reviewer",
        rating: 8,
        text: "The pacing is slow and deliberate, but the performance by Gosling is breathtaking. Roger Deakins' cinematography is nothing short of legendary.",
        timestamp: "5h ago",        likes: 420,
        comments: 12
      }
    ]
  },
  {
    id: "dune-part-two",
    title: "Dune: Part Two",
    description: "Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family. Facing a choice between the love of his life and the fate of the universe, he endeavors to prevent a terrible future only he can foresee.",
    rating: 8.4,
    criticScore: 9.0,
    audienceScore: 95,
    genre: "Sci-Fi Thriller",
    releaseYear: 2024,
    runtime: "2h 46m",
    director: "Denis Villeneuve",
    writer: "Jon Spaihts",
    studio: "Legendary Pictures",
    releaseDate: "March 1, 2024",
    language: "English (Atmos)",
    posterUrl: "https://image.tmdb.org/t/p/w500/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg",
    backdropUrl: "https://image.tmdb.org/t/p/original/xOMo8BRK7PfcJv9JCnx7s5hj0PX.jpg",
    isHero: false,
    isStaffPick: false,
    staffPickType: "",
    cast: [
      { name: "Timothée Chalamet", role: "Paul Atreides", avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200&auto=format&fit=crop" },
      { name: "Zendaya", role: "Chani", avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop" },
      { name: "Austin Butler", role: "Feyd-Rautha Harkonnen", avatarUrl: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=200&auto=format&fit=crop" },
      { name: "Denis Villeneuve", role: "Director", avatarUrl: "https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=200&auto=format&fit=crop" }
    ],
    reviews: [
      {
        id: "rev-ge-1",
        user: "James Dalton",
        avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=150&auto=format&fit=crop",
        role: "Verified Critic",
        rating: 9,
        text: "An absolute masterclass in blockbuster filmmaking. The sound design is massive, the spectacle is unmatched, and Timothee Chalamet delivers his finest performance yet. Immersive, loud, and incredibly beautiful.",
        timestamp: "1d ago",
        likes: 1200,
        comments: 42
      },
      {
        id: "rev-ge-2",
        user: "Maya Kovic",
        avatarUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=150&auto=format&fit=crop",
        role: "Cinema Enthusiast",
        rating: 8,
        text: "Visually stunning, though the middle act drags a bit as they traverse the desert. Austin Butler makes an unforgettable, menacing villain. Hans Zimmer's score is pulse-pounding.",
        timestamp: "3d ago",
        likes: 850,
        comments: 16
      }
    ]
  },
  {
    id: "interstellar",
    title: "Interstellar",
    description: "In Earth's future, a global crop blight and second Dust Bowl are slowly rendering the planet uninhabitable. Professor Brand, a brilliant NASA physicist, is working on plans to save mankind by transporting Earth's population to a new home via a wormhole.",
    rating: 8.7,
    criticScore: 8.7,
    audienceScore: 86,
    genre: "Sci-Fi / Space",
    releaseYear: 2014,
    runtime: "2h 49m",
    director: "Christopher Nolan",
    writer: "Jonathan Nolan",
    studio: "Paramount Pictures",
    releaseDate: "Nov 7, 2014",
    language: "English",
    posterUrl: "https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg",
    backdropUrl: "https://image.tmdb.org/t/p/original/pbrkL804c8yAv3zBZR4QPEafpAR.jpg",
    isHero: false,
    isStaffPick: false,
    staffPickType: "",
    cast: [
      { name: "Matthew McConaughey", role: "Cooper", avatarUrl: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=200&auto=format&fit=crop" },
      { name: "Anne Hathaway", role: "Brand", avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop" }
    ],
    reviews: [
      {
        id: "rev-cr-1",
        user: "Julian Vane",
        avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=150&auto=format&fit=crop",
        role: "Gold Critic",
        rating: 8,
        text: "Nolan weaves a brilliant narrative that balances hard space science with profound human emotion. The visual effects remain awe-inspiring a decade later.",
        timestamp: "3h ago",
        likes: 248,
        comments: 42
      }
    ]
  },
  {
    id: "the-batman",
    title: "The Batman",
    description: "In his second year of fighting crime, Batman uncovers corruption in Gotham City that connects to his own family while facing a serial killer known as the Riddler.",
    rating: 7.7,
    criticScore: 9.1,
    audienceScore: 89,
    genre: "Thriller / Noir",
    releaseYear: 2022,
    runtime: "2h 56m",
    director: "Matt Reeves",
    writer: "Matt Reeves",
    studio: "Warner Bros. Pictures",
    releaseDate: "March 4, 2022",
    language: "English",
    posterUrl: "https://image.tmdb.org/t/p/w500/74xTEgt7R36Fpooo50r9T25onhq.jpg",
    backdropUrl: "https://image.tmdb.org/t/p/original/b0PlSFdDwbyK0cf5RxwDpaOJQvQ.jpg",
    isHero: false,
    isStaffPick: false,
    staffPickType: "",
    cast: [
      { name: "Robert Pattinson", role: "Bruce Wayne / Batman", avatarUrl: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=200&auto=format&fit=crop" },
      { name: "Zoë Kravitz", role: "Selina Kyle / Catwoman", avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop" }
    ],
    reviews: []
  },
  {
    id: "oppenheimer",
    title: "Oppenheimer",
    description: "The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb during World War II, leading to the dawn of the nuclear age.",
    rating: 8.3,
    criticScore: 8.0,
    audienceScore: 78,
    genre: "History / Indie",
    releaseYear: 2023,
    runtime: "3h 00m",
    director: "Christopher Nolan",
    writer: "Christopher Nolan",
    studio: "Universal Pictures",
    releaseDate: "July 21, 2023",
    language: "English",
    posterUrl: "https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg",
    backdropUrl: "https://image.tmdb.org/t/p/original/fm6KqXpk3M2HVveHwCrBSSBaO0V.jpg",
    isHero: false,
    isStaffPick: false,
    staffPickType: "",
    cast: [
      { name: "Cillian Murphy", role: "J. Robert Oppenheimer", avatarUrl: "https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=200&auto=format&fit=crop" }
    ],
    reviews: [
      {
        id: "rev-pr-1",
        user: "Julian Vane",
        avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=150&auto=format&fit=crop",
        role: "Gold Critic",
        rating: 8,
        text: "A towering achievement in filmmaking. The combination of intense character study, historical weight, and explosive sound design makes this a modern classic.",
        timestamp: "Oct 28, 2023",
        likes: 248,
        comments: 42
      }
    ]
  },
  {
    id: "mad-max-fury-road",
    title: "Mad Max: Fury Road",
    description: "In a post-apocalyptic wasteland, a woman rebels against a tyrannical ruler in search of her homeland with the aid of a group of female prisoners, a psychotic worshiper, and a drifter named Max.",
    rating: 8.1,
    criticScore: 8.2,
    audienceScore: 88,
    genre: "Action / Retro",
    releaseYear: 2015,
    runtime: "2h 00m",
    director: "George Miller",
    writer: "George Miller",
    studio: "Warner Bros. Pictures",
    releaseDate: "May 15, 2015",
    language: "English",
    posterUrl: "https://image.tmdb.org/t/p/w500/hA2ple9q4qnwxp3hKVNhroipsir.jpg",
    backdropUrl: "https://image.tmdb.org/t/p/original/phszHPFVhPHhMZgo0fWTKBDQsJA.jpg",
    isHero: false,
    isStaffPick: false,
    staffPickType: "",
    cast: [
      { name: "Charlize Theron", role: "Imperator Furiosa", avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop" },
      { name: "Tom Hardy", role: "Max Rockatansky", avatarUrl: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=200&auto=format&fit=crop" }
    ],
    reviews: []
  },
  {
    id: "la-la-land",
    title: "La La Land",
    description: "While navigating their careers in Los Angeles, a pianist and an actress fall in love while attempting to reconcile their aspirations for the future.",
    rating: 8.0,
    criticScore: 8.9,
    audienceScore: 85,
    genre: "History / Drama",
    releaseYear: 2016,
    runtime: "2h 08m",
    director: "Damien Chazelle",
    writer: "Damien Chazelle",
    studio: "Summit Entertainment",
    releaseDate: "Dec 9, 2016",
    language: "English",
    posterUrl: "https://image.tmdb.org/t/p/w500/uDO8zWDhfWwoFdKS4fzkUJt0Rf0.jpg",
    backdropUrl: "https://image.tmdb.org/t/p/original/nlPCdZlHtRNcF6C9hzUH4ebmV1w.jpg",
    isHero: false,
    isStaffPick: true,
    staffPickType: "featured",
    cast: [
      { name: "Ryan Gosling", role: "Sebastian", avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200&auto=format&fit=crop" },
      { name: "Emma Stone", role: "Mia", avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop" }
    ],
    reviews: []
  },
  {
    id: "inception",
    title: "Inception",
    description: "A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O., but his tragic past may doom the project.",
    rating: 8.8,
    criticScore: 7.5,
    audienceScore: 70,
    genre: "Sci-Fi / Action",
    releaseYear: 2010,
    runtime: "2h 28m",
    director: "Christopher Nolan",
    writer: "Christopher Nolan",
    studio: "Warner Bros. Pictures",
    releaseDate: "July 16, 2010",
    language: "English",
    posterUrl: "https://image.tmdb.org/t/p/w500/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg",
    backdropUrl: "https://image.tmdb.org/t/p/original/s3TBrRGB1iav7gFOCNx3H31MoES.jpg",
    isHero: false,
    isStaffPick: true,
    staffPickType: "grid",
    cast: [
      { name: "Leonardo DiCaprio", role: "Cobb", avatarUrl: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=200&auto=format&fit=crop" }
    ],
    reviews: []
  },
  {
    id: "whiplash",
    title: "Whiplash",
    description: "A promising young drummer enrolls at a cut-throat music conservatory where his dreams of greatness are mentored by an instructor who will stop at nothing to realize a student's potential.",
    rating: 8.5,
    criticScore: 8.5,
    audienceScore: 81,
    genre: "Drama / Music",
    releaseYear: 2014,
    runtime: "1h 46m",
    director: "Damien Chazelle",
    writer: "Damien Chazelle",
    studio: "Sony Pictures Classics",
    releaseDate: "Oct 10, 2014",
    language: "English",
    posterUrl: "https://image.tmdb.org/t/p/w500/7fn624j5lj3xTme2SgiLCeuedmO.jpg",
    backdropUrl: "https://image.tmdb.org/t/p/original/zYdS48h5B44B7y8Kin9yJBr6N3o.jpg",
    isHero: false,
    isStaffPick: true,
    staffPickType: "grid",
    cast: [
      { name: "Miles Teller", role: "Andrew Neiman", avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200&auto=format&fit=crop" },
      { name: "J.K. Simmons", role: "Terence Fletcher", avatarUrl: "https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=200&auto=format&fit=crop" }
    ],
    reviews: []
  },
  {
    id: "the-grand-budapest-hotel",
    title: "The Grand Budapest Hotel",
    description: "A writer relates his adventures at a renowned European resort hotel between the first and second World Wars with a concierge who is wrongly framed for murder.",
    rating: 8.1,
    criticScore: 7.9,
    audienceScore: 74,
    genre: "Comedy / Drama",
    releaseYear: 2014,
    runtime: "1h 39m",
    director: "Wes Anderson",
    writer: "Wes Anderson",
    studio: "Searchlight Pictures",
    releaseDate: "March 28, 2014",
    language: "English",
    posterUrl: "https://image.tmdb.org/t/p/w500/eWdyYQreja6JGCzqHWXpWHDrrPo.jpg",
    backdropUrl: "https://image.tmdb.org/t/p/original/6JwO4V4W9dLAC6wGf9CEZQVwQbO.jpg",
    isHero: false,
    isStaffPick: true,
    staffPickType: "grid",
    cast: [
      { name: "Ralph Fiennes", role: "Monsieur Gustave H.", avatarUrl: "https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=200&auto=format&fit=crop" }
    ],
    reviews: []
  }
];

const tamilPriorityMovies = [
  {
    id: "vikram-2022",
    title: "Vikram",
    description: "A black-ops squad investigates a string of masked killings and uncovers a narcotics network tied to a feared underground kingpin. Lokesh Kanagaraj builds a hard-edged action thriller around Kamal Haasan's comeback performance.",
    rating: 8.4,
    criticScore: 8.4,
    audienceScore: 92,
    genre: "Tamil / Action / Crime / Thriller",
    releaseYear: 2022,
    runtime: "2h 55m",
    director: "Lokesh Kanagaraj",
    writer: "Lokesh Kanagaraj",
    studio: "Raaj Kamal Films International",
    releaseDate: "June 3, 2022",
    language: "Tamil",
    posterUrl: "https://media.tamilmdb.com/i/movie/87/47/6679/175x245/62902a383c9ad.jpeg",
    backdropUrl: "https://media.tamilmdb.com/i/gallery/d1/c3/225/1024xa/6548fb6dab80b.jpg",
    isHero: true,
    isStaffPick: false,
    staffPickType: "",
    cast: [
      { name: "Kamal Haasan", role: "Karnan / Vikram", avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200&auto=format&fit=crop" },
      { name: "Vijay Sethupathi", role: "Sandhanam", avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop" },
      { name: "Fahadh Faasil", role: "Amar", avatarUrl: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=200&auto=format&fit=crop" }
    ],
    reviews: [
      {
        id: "rev-vikram-1",
        user: "Arun Prakash",
        avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=150&auto=format&fit=crop",
        role: "Tamil Cinema Critic",
        rating: 9,
        text: "A thunderous theatrical experience with razor-sharp staging, a roaring Anirudh score, and a superb Kamal Haasan presence.",
        timestamp: "2h ago",
        likes: 1420,
        comments: 68
      }
    ]
  },
  {
    id: "jai-bhim",
    title: "Jai Bhim",
    description: "A crusading lawyer fights for an Irular tribal woman after her husband disappears from police custody. The film blends legal drama with a forceful indictment of caste violence and institutional abuse.",
    rating: 8.7,
    criticScore: 9.1,
    audienceScore: 94,
    genre: "Tamil / Crime / Drama / Legal",
    releaseYear: 2021,
    runtime: "2h 44m",
    director: "T. J. Gnanavel",
    writer: "T. J. Gnanavel",
    studio: "2D Entertainment",
    releaseDate: "November 2, 2021",
    language: "Tamil",
    posterUrl: "https://media.tamilmdb.com/i/movie/dd/d9/6738/175x245/60fae94a9bb18.jpeg",
    backdropUrl: "https://media.tamilmdb.com/i/movie/dd/d9/6738/175x245/60fae94a9bb18.jpeg",
    isHero: true,
    isStaffPick: false,
    staffPickType: "",
    cast: [
      { name: "Suriya", role: "Advocate Chandru", avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=200&auto=format&fit=crop" },
      { name: "Lijomol Jose", role: "Sengeni", avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&auto=format&fit=crop" },
      { name: "Manikandan", role: "Rajakannu", avatarUrl: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?q=80&w=200&auto=format&fit=crop" }
    ],
    reviews: []
  },
  {
    id: "kaithi",
    title: "Kaithi",
    description: "An ex-prisoner on his way to meet his daughter is pulled into a desperate overnight mission to save poisoned police officers from a ruthless drug syndicate.",
    rating: 8.4,
    criticScore: 8.5,
    audienceScore: 90,
    genre: "Tamil / Action / Crime / Thriller",
    releaseYear: 2019,
    runtime: "2h 25m",
    director: "Lokesh Kanagaraj",
    writer: "Lokesh Kanagaraj",
    studio: "Dream Warrior Pictures",
    releaseDate: "October 25, 2019",
    language: "Tamil",
    posterUrl: "https://media.tamilmdb.com/i/movie/1b/89/6568/175x245/5da691f6d3eb0.jpg",
    backdropUrl: "https://media.tamilmdb.com/i/movie/1b/89/6568/175x245/5da691f6d3eb0.jpg",
    isHero: true,
    isStaffPick: false,
    staffPickType: "",
    cast: [
      { name: "Karthi", role: "Dilli", avatarUrl: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=200&auto=format&fit=crop" },
      { name: "Narain", role: "Bejoy", avatarUrl: "https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=200&auto=format&fit=crop" },
      { name: "Arjun Das", role: "Anbu", avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200&auto=format&fit=crop" }
    ],
    reviews: []
  },
  {
    id: "super-deluxe",
    title: "Super Deluxe",
    description: "Interlocking stories of desire, shame, faith, and absurd fate collide across one wild day in Chennai. Thiagarajan Kumararaja's film is playful, strange, and deeply humane.",
    rating: 8.2,
    criticScore: 8.8,
    audienceScore: 86,
    genre: "Tamil / Comedy / Crime / Drama",
    releaseYear: 2019,
    runtime: "2h 56m",
    director: "Thiagarajan Kumararaja",
    writer: "Thiagarajan Kumararaja",
    studio: "Tyler Durden and Kino Fist",
    releaseDate: "March 29, 2019",
    language: "Tamil",
    posterUrl: "https://media.tamilmdb.com/i/movie/45/59/6483/175x245/5c6fe5c42228d.jpg",
    backdropUrl: "https://media.tamilmdb.com/i/movie/45/59/6483/175x245/5c6fe5c42228d.jpg",
    isHero: false,
    isStaffPick: true,
    staffPickType: "featured",
    cast: [
      { name: "Vijay Sethupathi", role: "Shilpa", avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop" },
      { name: "Fahadh Faasil", role: "Mugil", avatarUrl: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=200&auto=format&fit=crop" },
      { name: "Samantha", role: "Vaembu", avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&auto=format&fit=crop" }
    ],
    reviews: []
  },
  {
    id: "asuran",
    title: "Asuran",
    description: "A farmer from an oppressed community goes on the run with his son after a violent land dispute explodes. Vetrimaaran turns Poomani's Vekkai into a searing revenge drama.",
    rating: 8.4,
    criticScore: 8.7,
    audienceScore: 89,
    genre: "Tamil / Action / Drama",
    releaseYear: 2019,
    runtime: "2h 21m",
    director: "Vetrimaaran",
    writer: "Vetrimaaran",
    studio: "V Creations",
    releaseDate: "October 4, 2019",
    language: "Tamil",
    posterUrl: "https://media.tamilmdb.com/i/movie/ee/6e/6564/175x245/5d9724f18d41e.jpg",
    backdropUrl: "https://media.tamilmdb.com/i/movie/ee/6e/6564/175x245/5d9724f18d41e.jpg",
    isHero: false,
    isStaffPick: true,
    staffPickType: "grid",
    cast: [
      { name: "Dhanush", role: "Sivasaami", avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200&auto=format&fit=crop" },
      { name: "Manju Warrier", role: "Pachaiyamma", avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop" }
    ],
    reviews: []
  },
  {
    id: "karnan",
    title: "Karnan",
    description: "A fiery young man from a neglected village rises against systems that deny his people dignity, mobility, and justice. Mari Selvaraj crafts a mythic rural protest drama.",
    rating: 8.0,
    criticScore: 8.3,
    audienceScore: 84,
    genre: "Tamil / Action / Drama",
    releaseYear: 2021,
    runtime: "2h 38m",
    director: "Mari Selvaraj",
    writer: "Mari Selvaraj",
    studio: "V Creations",
    releaseDate: "April 9, 2021",
    language: "Tamil",
    posterUrl: "https://media.tamilmdb.com/i/movie/e9/87/6701/175x245/6028f0c4b4803.jpg",
    backdropUrl: "https://media.tamilmdb.com/i/movie/e9/87/6701/175x245/6028f0c4b4803.jpg",
    isHero: false,
    isStaffPick: true,
    staffPickType: "grid",
    cast: [
      { name: "Dhanush", role: "Karnan", avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200&auto=format&fit=crop" },
      { name: "Lal", role: "Yeman", avatarUrl: "https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=200&auto=format&fit=crop" }
    ],
    reviews: []
  },
  {
    id: "leo-2023",
    title: "Leo",
    description: "A mild-mannered cafe owner is dragged into a violent past when gangsters insist he is a missing crime heir. Vijay anchors Lokesh Kanagaraj's icy action drama.",
    rating: 7.2,
    criticScore: 7.1,
    audienceScore: 82,
    genre: "Tamil / Action / Crime / Drama",
    releaseYear: 2023,
    runtime: "2h 44m",
    director: "Lokesh Kanagaraj",
    writer: "Lokesh Kanagaraj",
    studio: "Seven Screen Studio",
    releaseDate: "October 19, 2023",
    language: "Tamil",
    tmdbId: 949229,
    posterUrl: "https://media.tamilmdb.com/i/movie/6f/d8/6957/175x245/650b046dcfaef.jpg",
    backdropUrl: "https://media.tamilmdb.com/i/movie/6f/d8/6957/175x245/650b046dcfaef.jpg",
    isHero: false,
    isStaffPick: false,
    staffPickType: "",
    cast: [
      { name: "Vijay", role: "Parthiban / Leo", avatarUrl: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=200&auto=format&fit=crop" },
      { name: "Trisha", role: "Sathya", avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&auto=format&fit=crop" }
    ],
    reviews: []
  },
  {
    id: "master",
    title: "Master",
    description: "A troubled college professor is sent to a juvenile home where he clashes with a ruthless gangster who uses children for crime.",
    rating: 7.4,
    criticScore: 7.2,
    audienceScore: 83,
    genre: "Tamil / Action / Crime / Drama",
    releaseYear: 2021,
    runtime: "2h 58m",
    director: "Lokesh Kanagaraj",
    writer: "Lokesh Kanagaraj",
    studio: "XB Film Creators",
    releaseDate: "January 13, 2021",
    language: "Tamil",
    tmdbId: 626392,
    posterUrl: "https://media.tamilmdb.com/i/movie/48/8e/6629/175x245/5f37f98ee514e.jpg",
    backdropUrl: "https://media.tamilmdb.com/i/movie/48/8e/6629/175x245/5f37f98ee514e.jpg",
    isHero: false,
    isStaffPick: false,
    staffPickType: "",
    cast: [
      { name: "Vijay", role: "JD", avatarUrl: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=200&auto=format&fit=crop" },
      { name: "Vijay Sethupathi", role: "Bhavani", avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop" }
    ],
    reviews: []
  },
  {
    id: "96-2018",
    title: "96",
    description: "A school reunion brings two former classmates face to face with an unfinished love story. C. Prem Kumar's romance is gentle, restrained, and quietly devastating.",
    rating: 8.5,
    criticScore: 8.6,
    audienceScore: 88,
    genre: "Tamil / Drama / Romance",
    releaseYear: 2018,
    runtime: "2h 38m",
    director: "C. Prem Kumar",
    writer: "C. Prem Kumar",
    studio: "Madras Enterprises",
    releaseDate: "October 4, 2018",
    language: "Tamil",
    posterUrl: "https://media.tamilmdb.com/i/movie/a2/f0/6463/175x245/5bb836f0b5788.jpg",
    backdropUrl: "https://media.tamilmdb.com/i/movie/a2/f0/6463/175x245/5bb836f0b5788.jpg",
    isHero: false,
    isStaffPick: true,
    staffPickType: "grid",
    cast: [
      { name: "Vijay Sethupathi", role: "Ram", avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop" },
      { name: "Trisha", role: "Jaanu", avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&auto=format&fit=crop" }
    ],
    reviews: []
  },
  {
    id: "ponniyin-selvan-1",
    title: "Ponniyin Selvan 1",
    description: "Vandiyadevan travels across the Chola kingdom carrying secret messages as a royal succession conspiracy threatens the empire. Mani Ratnam adapts Kalki's epic with a sprawling ensemble.",
    rating: 7.6,
    criticScore: 8.0,
    audienceScore: 78,
    genre: "Tamil / Action / Adventure / Drama",
    releaseYear: 2022,
    runtime: "2h 47m",
    director: "Mani Ratnam",
    writer: "Mani Ratnam",
    studio: "Madras Talkies",
    releaseDate: "September 30, 2022",
    language: "Tamil",
    tmdbId: 660046,
    posterUrl: "https://media.tamilmdb.com/i/movie/8a/b7/6761/175x245/62c2b2afa87ed.jpeg",
    backdropUrl: "https://media.tamilmdb.com/i/gallery/d1/c3/221/1024xa/6333c4dc52582.jpg",
    isHero: false,
    isStaffPick: false,
    staffPickType: "",
    cast: [
      { name: "Vikram", role: "Aditha Karikalan", avatarUrl: "https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=200&auto=format&fit=crop" },
      { name: "Karthi", role: "Vandiyadevan", avatarUrl: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=200&auto=format&fit=crop" },
      { name: "Trisha", role: "Kundavai", avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&auto=format&fit=crop" }
    ],
    reviews: []
  }
];

const writeJsonDb = (data) => {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
};

const initialCommunityThreads = [
  {
    id: 'thread-dune-soundscape',
    title: 'Dune: Part Two sound design still feels unreal',
    body: 'That first thumper sequence is the kind of theater moment people remember for years. Curious how everyone ranks it against Blade Runner 2049.',
    tag: 'Sound Design',
    author: 'Elena Vane',
    role: 'Reviewer',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=150&auto=format&fit=crop',
    timestamp: '2h ago',
    likes: 34,
    replies: [
      {
        id: 'reply-dune-1',
        author: 'Julian Vane',
        body: 'The mix has that rare pressure without becoming muddy. IMAX carried it beautifully.',
        timestamp: '1h ago'
      }
    ]
  },
  {
    id: 'thread-modern-noir',
    title: 'Best modern noir entries after The Batman?',
    body: 'Looking for slow-burn detective films with strong visual language. Bonus points for rain, neon, and morally exhausted leads.',
    tag: 'Recommendations',
    author: 'Marcus Vale',
    role: 'Cinema Enthusiast',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=150&auto=format&fit=crop',
    timestamp: '5h ago',
    likes: 21,
    replies: []
  }
];

const readJsonDb = () => {
  if (!fs.existsSync(DB_FILE)) {
    writeJsonDb({ movies: tamilPriorityMovies, users: [], communityThreads: initialCommunityThreads });
  }
  try {
    const fileContent = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(fileContent);
    if (!parsed.users) parsed.users = [];
    if (!parsed.communityThreads) {
      parsed.communityThreads = initialCommunityThreads;
      writeJsonDb(parsed);
    }
    return parsed;
  } catch (err) {
    console.error("Error reading JSON database, resetting...", err);
    writeJsonDb({ movies: tamilPriorityMovies, users: [], communityThreads: initialCommunityThreads });
    return { movies: tamilPriorityMovies, users: [], communityThreads: initialCommunityThreads };
  }
};

let MovieModel;
try {
  const movieSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    description: { type: String },
    rating: { type: Number, default: 0 },
    criticScore: { type: Number, default: 0 },
    audienceScore: { type: Number, default: 0 },
    genre: { type: String },
    releaseYear: { type: Number },
    runtime: { type: String },
    director: { type: String },
    writer: { type: String },
    studio: { type: String },
    releaseDate: { type: String },
    language: { type: String },
    posterUrl: { type: String },
    backdropUrl: { type: String },
    tmdbId: { type: Number },
    isHero: { type: Boolean, default: false },
    isStaffPick: { type: Boolean, default: false },
    staffPickType: { type: String, default: "" },
    isUpcoming: { type: Boolean, default: false },
    createdAt: { type: String, default: () => new Date().toISOString() },
    trailerUrl: { type: String },
    trailerChannelName: { type: String },
    ott: {
      platform: { type: String },
      releaseDate: { type: String },
      url: { type: String }
    },
    cast: [{ name: String, role: String, avatarUrl: String }],
    reviews: [{
      id: String,
      user: String,
      avatarUrl: String,
      role: String,
      rating: Number,
      text: String,
      timestamp: String,
      likes: { type: Number, default: 0 },
      likedBy: { type: [String], default: [] },
      comments: { type: Number, default: 0 },
      replies: [{
        id: String,
        author: String,
        body: String,
        timestamp: String
      }]
    }]
  });
  MovieModel = mongoose.model('Movie', movieSchema);
} catch (e) {
  // Model creation safety
}

let UserModel;
try {
  const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true },
    passwordHash: { type: String, required: true },
    salt: { type: String, required: true },
    role: { type: String, default: "Cinema Enthusiast" },
    avatarUrl: { type: String },
    bio: { type: String, default: '' },
    followers: [{ type: String }],
    following: [{ type: String }],
    token: { type: String },
    emailVerified: { type: Boolean, default: false },
    otp: { type: String },
    otpExpiry: { type: Date }
  });
  UserModel = mongoose.model('User', userSchema);
} catch (e) {
  // Model creation safety
}

let CommunityThreadModel;
try {
  const communityThreadSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    body: { type: String, required: true },
    tag: { type: String, default: "General" },
    author: { type: String, required: true },
    role: { type: String, default: "Cinema Enthusiast" },
    avatarUrl: { type: String },
    timestamp: { type: String, default: "Just now" },
    likes: { type: Number, default: 0 },
    replies: [{
      id: String,
      author: String,
      body: String,
      timestamp: String
    }]
  });
  CommunityThreadModel = mongoose.model('CommunityThread', communityThreadSchema);
} catch (e) {
  // Model creation safety
}

// Password hashing helpers
const hashPassword = (password, salt) => {
  return crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
};

const generateSalt = () => {
  return crypto.randomBytes(16).toString('hex');
};

const CACHE_DIR = path.resolve(__dirname, '.tmdb_cache');

const ensureCacheDir = () => {
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }
};

const readTmdbCache = () => {
  const cacheFile = path.join(CACHE_DIR, 'movie_data.json');
  if (fs.existsSync(cacheFile)) {
    try {
      return JSON.parse(fs.readFileSync(cacheFile, 'utf-8'));
    } catch (e) {}
  }
  return {};
};

const writeTmdbCache = (cache) => {
  ensureCacheDir();
  const cacheFile = path.join(CACHE_DIR, 'movie_data.json');
  fs.writeFileSync(cacheFile, JSON.stringify(cache, null, 2), 'utf-8');
};

const cachedEnrichMovieWithTmdbImages = async (movie) => {
  const cache = readTmdbCache();
  const cacheKey = `${movie.id || movie.title}_${movie.releaseYear || 'unknown'}`;
  const cached = cache[cacheKey];
  if (cached && !needsTmdbImageRefresh(cached)) {
    return cached;
  }
  const enriched = await enrichMovieWithTmdbImages(movie);
  cache[cacheKey] = enriched;
  writeTmdbCache(cache);
  return enriched;
};

const cachedEnrichMoviesWithTmdbImages = async (movies) => {
  if (!hasTmdbCredentials()) return movies.map(applyLocalHdImageFallback);
  return Promise.all(movies.map(m => cachedEnrichMovieWithTmdbImages(m)));
};

export const initDB = async () => {
  const mongoUri = process.env.MONGO_URI;
  const ensureCreatedAt = (movie) => {
    if (!movie.createdAt) movie.createdAt = new Date().toISOString();
    return movie;
  };

  const writeJsonAfterMigration = (data) => {
    const needsMigration = (data.movies || []).some(m => !m.createdAt);
    if (needsMigration) {
      data.movies = (data.movies || []).map(ensureCreatedAt);
      writeJsonDb(data);
      console.log("Added createdAt to existing movies.");
    }
  };

  if (mongoUri) {
    try {
      await mongoose.connect(mongoUri);
      console.log("Connected to MongoDB successfully.");
      useMongoDB = true;
      const count = await MovieModel.countDocuments();
      if (count === 0) {
        const seededMovies = await cachedEnrichMoviesWithTmdbImages(tamilPriorityMovies);
        await MovieModel.insertMany(seededMovies.map(ensureCreatedAt));
        console.log("MongoDB seeded with Tamil priority movies.");
      }
      if (CommunityThreadModel && await CommunityThreadModel.countDocuments() === 0) {
        await CommunityThreadModel.insertMany(initialCommunityThreads);
      }
    } catch (err) {
      console.warn("Failed to connect to MongoDB. Falling back to local JSON file db.json. Error:", err.message);
      useMongoDB = false;
      const data = readJsonDb();
      const moviesToRefresh = (data.movies || []).filter(needsTmdbImageRefresh);
      if (moviesToRefresh.length > 0) {
        const refreshedMovies = await cachedEnrichMoviesWithTmdbImages(data.movies);
        data.movies = refreshedMovies;
        writeJsonDb(data);
      }
      writeJsonAfterMigration(data);
    }
  } else {
    console.log("No MONGO_URI specified. Using local JSON database (db.json).");
    useMongoDB = false;
    const data = readJsonDb();
    const moviesToRefresh = (data.movies || []).filter(needsTmdbImageRefresh);
    if (moviesToRefresh.length > 0) {
      const refreshedMovies = await cachedEnrichMoviesWithTmdbImages(data.movies);
      data.movies = refreshedMovies;
      writeJsonDb(data);
    }
    writeJsonAfterMigration(data);
  }
};

export const getMovies = async (query = {}) => {
  const { search, genre, sort, ottPlatform } = query;

  if (useMongoDB) {
    let mongoQuery = {};
    if (search) {
      mongoQuery.title = { $regex: search, $options: 'i' };
    }
    if (genre) {
      mongoQuery.genre = { $regex: genre, $options: 'i' };
    }
    if (ottPlatform) {
      mongoQuery['ott.platform'] = ottPlatform;
    }

    let sortOption = {};
    if (sort === 'rating') {
      sortOption = { rating: -1 };
    } else if (sort === 'latest') {
      sortOption = { releaseYear: -1 };
    } else if (sort === 'popular') {
      sortOption = { audienceScore: -1 };
    } else if (sort === 'newest') {
      sortOption = { createdAt: -1 };
    } else if (sort === 'release-asc') {
      sortOption = { releaseDate: 1 };
    } else if (sort === 'release-desc') {
      sortOption = { releaseDate: -1 };
    }

    const movies = await MovieModel.find(mongoQuery).sort(sortOption);
    return movies.map(movie => applyLocalHdImageFallback(movie.toObject()));
  } else {
    let { movies } = readJsonDb();
    
    if (search) {
      const searchLower = search.toLowerCase();
      movies = movies.filter(m => m.title.toLowerCase().includes(searchLower) || m.description.toLowerCase().includes(searchLower));
    }

    if (genre) {
      const genreLower = genre.toLowerCase();
      movies = movies.filter(m => m.genre.toLowerCase().includes(genreLower));
    }

    if (ottPlatform) {
      movies = movies.filter(m => m.ott?.platform === ottPlatform);
    }

    if (sort === 'rating') {
      movies.sort((a, b) => b.rating - a.rating);
    } else if (sort === 'latest') {
      movies.sort((a, b) => b.releaseYear - a.releaseYear);
    } else if (sort === 'popular') {
      movies.sort((a, b) => b.audienceScore - a.audienceScore);
    } else if (sort === 'newest') {
      movies.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    } else if (sort === 'release-asc') {
      movies.sort((a, b) => new Date(a.releaseDate || 0) - new Date(b.releaseDate || 0));
    } else if (sort === 'release-desc') {
      movies.sort((a, b) => new Date(b.releaseDate || 0) - new Date(a.releaseDate || 0));
    }

    return movies.map(applyLocalHdImageFallback);
  }
};

export const refreshMovieImages = async () => {
  if (useMongoDB) {
    const movies = await MovieModel.find({});
    const enrichedMovies = await cachedEnrichMoviesWithTmdbImages(movies.map(movie => movie.toObject()));
    await Promise.all(enrichedMovies.map(movie => {
      const { _id, __v, ...update } = movie;
      return MovieModel.updateOne({ id: movie.id }, { $set: update });
    }));
    return enrichedMovies;
  }

  const data = readJsonDb();
  data.movies = await cachedEnrichMoviesWithTmdbImages(data.movies);
  writeJsonDb(data);
  return data.movies;
};

export const getMovieById = async (id) => {
  if (useMongoDB) {
    const movie = await MovieModel.findOne({ id });
    if (!movie) return null;
    const plain = movie.toObject();
    if (needsTmdbImageRefresh(plain) && plain.tmdbId) {
      const enriched = await cachedEnrichMovieWithTmdbImages(plain);
      const { _id, __v, ...update } = enriched;
      await MovieModel.updateOne({ id: plain.id }, { $set: update });
      return applyLocalHdImageFallback(enriched);
    }
    return applyLocalHdImageFallback(plain);
  } else {
    const data = readJsonDb();
    const index = data.movies.findIndex(m => m.id === id);
    if (index === -1) return null;
    const movie = data.movies[index];
    if (needsTmdbImageRefresh(movie) && movie.tmdbId) {
      const enriched = await cachedEnrichMovieWithTmdbImages(movie);
      data.movies[index] = enriched;
      writeJsonDb(data);
      return applyLocalHdImageFallback(enriched);
    }
    return applyLocalHdImageFallback(movie);
  }
};

// ─── SYNOPSIS GENERATOR ───

const SYNOPSIS_TEMPLATES = [
  (title, genre, year, director) =>
    `${title} is a compelling ${genre || 'cinematic'} experience that follows a protagonist's journey through extraordinary circumstances. Directed by ${director || 'a visionary filmmaker'}, this ${year || ''} release delivers a powerful narrative filled with unexpected twists and emotional depth.`,
  (title, genre, year, director) =>
    `Set against a vividly realized backdrop, ${title} weaves a masterful tale of ambition, conflict, and redemption. ${director ? `Director ${director} ` : ''}crafts a ${genre || 'gripping'} story that resonates long after the credits roll.`,
  (title, genre) =>
    `A ${genre || 'thrilling'} cinematic journey, ${title} explores the complexities of human nature through its richly drawn characters and stunning visual storytelling. A must-watch for fans of thought-provoking cinema.`,
  (title, genre, year, director) =>
    `${title} brings together an exceptional cast in a ${genre || 'dramatic'} tale of courage and determination. ${director ? `${director}'s ` : ''}visionary direction and a haunting score make this ${year || ''} release an unforgettable experience.`,
  (title, genre) =>
    `In ${title}, nothing is as it seems. This ${genre || 'captivating'} film blends suspense, emotion, and breathtaking visuals into a seamless narrative that keeps audiences on the edge of their seats from the first frame to the last.`,
  (title, genre, year, director) =>
    `${title} is a ${genre || 'powerful'} film that pushes the boundaries of storytelling. ${director ? `Under ${director}'s expert direction, ` : ''}it delivers a deeply moving exploration of love, loss, and the human spirit. A ${year || 'modern'} classic in the making.`,
  (title, genre) =>
    `With ${title}, audiences are treated to a ${genre || 'remarkable'} film that combines sharp writing, outstanding performances, and stunning production design. An immersive experience that demands to be seen on the big screen.`,
  (title, genre, year, director) =>
    `${title} stands as a testament to the power of cinema. ${director ? `${director} ` : ''}delivers a ${genre || 'spellbinding'} ${year || ''} narrative that challenges conventions and leaves a lasting impression on all who witness it.`,
];

const generateSynopsis = async (movieData) => {
  if (movieData.description && movieData.description.length > 30) return movieData.description;
  const title = movieData.title || 'This film';
  const genre = movieData.genre || '';
  const year = movieData.releaseYear || movieData.releaseDate?.split('-')[0] || '';
  const director = movieData.director || '';
  const aiSynopsis = await generateSynopsisWithAI(title, genre, year, director);
  if (aiSynopsis) return aiSynopsis;
  const template = SYNOPSIS_TEMPLATES[Math.floor(Math.random() * SYNOPSIS_TEMPLATES.length)];
  return template(title, genre, year, director);
};

// ─── BOT REVIEW SEEDING ───

const USERS = [
  { name: 'Arun Prakash',  role: 'Top Critic',       avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=150&auto=format&fit=crop' },
  { name: 'Priya Karthik', role: 'Gold Reviewer',    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=150&auto=format&fit=crop' },
  { name: 'Rajesh Menon',  role: 'Cinema Enthusiast',avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=150&auto=format&fit=crop' },
  { name: 'Divya Nair',    role: 'Verified Critic',  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150&auto=format&fit=crop' },
  { name: 'Vikram Rajan',  role: 'Staff Reviewer',   avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=150&auto=format&fit=crop' },
  { name: 'Meera Suresh',  role: 'Top Critic',       avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=150&auto=format&fit=crop' },
  { name: 'Karthik Sethu', role: 'Film Buff',        avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=150&auto=format&fit=crop' },
  { name: 'Ananya Rangan', role: 'Reviewer',         avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=150&auto=format&fit=crop' },
  { name: 'Deepak Chitra', role: 'Cinema Enthusiast',avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=150&auto=format&fit=crop' },
  { name: 'Lavanya Krishna',role: 'Verified Critic', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150&auto=format&fit=crop' },
  { name: 'Siddharth Iyer',role: 'Staff Reviewer',  avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=150&auto=format&fit=crop' },
  { name: 'Nandini Ravi',  role: 'Gold Critic',      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=150&auto=format&fit=crop' },
  { name: 'Ajay Bhaskar',  role: 'Top Critic',       avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=150&auto=format&fit=crop' },
  { name: 'Shreya Mohan',  role: 'Film Analyst',     avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=150&auto=format&fit=crop' },
  { name: 'Ganesh Swamy',  role: 'Cinema Enthusiast',avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=150&auto=format&fit=crop' },
];

const REVIEW_TEXTS = [
  '"Absolutely brilliant film. The director knows exactly how to keep you on the edge of your seat from start to finish."',
  '"The performances in this movie are outstanding. Every actor brought their A-game and it shows in every frame."',
  '"A visual treat! The cinematography alone makes this worth watching on the biggest screen possible."',
  '"The screenplay is tight and the dialogues are sharp. Not a single dull moment throughout the runtime."',
  '"I went in with low expectations but came out thoroughly impressed. This is storytelling at its finest."',
  '"The background score elevates every scene to another level. Music director deserves all the applause."',
  '"One of those rare films that gets better with every rewatch. So many layers to unpack."',
  '"Powerful performances and an emotional rollercoaster. Had me laughing and crying in the same scene."',
  '"A masterclass in filmmaking. The way the narrative unfolds is simply brilliant and keeps you guessing."',
  '"The action sequences are choreographed to perfection. Raw, intense, and utterly gripping."',
  '"What a comeback! This film proves that good content will always find its audience. Bravo to the entire team."',
  '"The first half sets up the world beautifully and the second half delivers on every promise. Perfect pacing."',
  '"An emotional gutpunch of a film. The climax will stay with you long after you leave the theatre."',
  '"Technically brilliant with top-notch VFX work that blends seamlessly with the practical sets."',
  '"The chemistry between the lead pair is electric. Their scenes together are the highlight of the film."',
  '"A dark and gritty take that respects the source material while bringing something fresh to the table."',
  '"The supporting cast is phenomenal. Even the smallest roles leave a lasting impression."',
  '"This film raises the bar for Indian cinema. World-class execution with a distinctly local flavor."',
  '"Beautifully shot and superbly acted. The director extracts career-best performances from the entire cast."',
  '"Edge-of-the-seat thriller that keeps you hooked till the very last frame. Must watch for genre fans."',
  '"The way the story weaves multiple narratives together is sheer genius. Everything connects perfectly."',
  '"A soul-stirring experience. The music and visuals combine to create something truly magical on screen."',
  '"Raw and unfiltered portrayal that doesn\'t shy away from uncomfortable truths. Brave filmmaking."',
  '"The comedic timing in this film is impeccable. Had the entire theatre roaring with laughter."',
  '"Stunning debut from the director. Shows tremendous command over the medium and a unique voice."',
  '"Every frame is like a painting. The art direction and production design deserve special mention."',
  '"A slow-burn that rewards patient viewers with an incredibly satisfying payoff in the final act."',
  '"The antagonist is one of the best-written villains in recent memory. Menacing and layered."',
  '"A feel-good entertainer that doesnt rely on cliches. Refreshingly original and heartfelt."',
  '"The twist in the second half completely caught me off guard. Brilliant writing at work here."',
];

const generateTimestamp = (releaseDate) => {
  const now = Date.now();
  let earliest = now - 2 * 24 * 60 * 60 * 1000; // 2 days ago default

  if (releaseDate) {
    // Try multiple date formats
    let parsed = new Date(releaseDate);
    if (isNaN(parsed.getTime())) {
      // Try "March 1, 2024" format
      parsed = new Date(releaseDate.replace(/(\w+) (\d+), (\d+)/, '$1 $2 $3'));
    }
    if (!isNaN(parsed.getTime())) {
      earliest = parsed.getTime() + 24 * 60 * 60 * 1000; // day after release
    }
  }

  const range = now - earliest;
  if (range <= 0) return 'Just now';

  const offset = Math.floor(Math.random() * range);
  const date = new Date(earliest + offset);
  const diffMs = now - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);

  // Mix relative and absolute dates like existing seed data
  const useAbsolute = Math.random() < 0.4;
  if (useAbsolute || diffMonths > 2) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
  }

  if (diffMins < 60) return `${Math.max(1, diffMins)}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffWeeks < 5) return `${diffWeeks}w ago`;
  return `${diffMonths}mo ago`;
};

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

const pickN = (arr, min, max) => {
  const count = min + Math.floor(Math.random() * (max - min + 1));
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
};

const generateRating = () => {
  // Natural distribution out of 5 → scaled to 10 for storage
  const steps = [1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0];
  const weights = [0.02, 0.03, 0.05, 0.10, 0.15, 0.20, 0.22, 0.15, 0.08];
  const r = Math.random();
  let cum = 0;
  for (let i = 0; i < steps.length; i++) {
    cum += weights[i];
    if (r <= cum) return Math.round(steps[i] * 20) / 10; // scale 1-5 → 2-10
  }
  return 10;
};

const recalcScores = (movie) => {
  if (!movie.reviews || movie.reviews.length === 0) return;
  const total = movie.reviews.reduce((s, r) => s + (r.rating || 0), 0);
  const avg = total / movie.reviews.length;
  movie.criticScore = parseFloat(avg.toFixed(1));
  movie.rating = parseFloat((avg / 2).toFixed(1));
  movie.audienceScore = Math.min(99, Math.max(40, Math.round(avg * 9.5)));
};

export const seedBotReviewsForMovie = async (movieId, releaseDate) => {
  const count = 2 + Math.floor(Math.random() * 3); // 2-4 reviews
  const chosenUsers = pickN(USERS, count, count);
  const chosenTexts = pickN(REVIEW_TEXTS, count, count);
  const ratings = Array.from({ length: count }, generateRating);

  const reviews = chosenUsers.map((user, i) => ({
    id: 'rev-bot-' + Date.now() + '-' + i,
    user: user.name,
    avatarUrl: user.avatar,
    role: user.role,
    rating: ratings[i],
    text: chosenTexts[i],
    timestamp: generateTimestamp(releaseDate),
    likes: Math.floor(Math.random() * 500) + 10,
    likedBy: [],
    comments: Math.floor(Math.random() * 30) + 2,
    replies: [],
  }));

  if (useMongoDB) {
    const movie = await MovieModel.findOne({ id: movieId });
    if (!movie) return null;
    movie.reviews.push(...reviews);
    recalcScores(movie);
    return await movie.save();
  } else {
    const data = readJsonDb();
    const idx = data.movies.findIndex(m => m.id === movieId);
    if (idx === -1) return null;
    data.movies[idx].reviews.push(...reviews);
    recalcScores(data.movies[idx]);
    writeJsonDb(data);
    return data.movies[idx];
  }
};

export const createMovie = async (movieData) => {
  const now = new Date().toISOString();
  const id = movieData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const description = await generateSynopsis(movieData);
  const rating = movieData.rating != null ? movieData.rating : 5.0;
  const criticScore = movieData.criticScore != null ? movieData.criticScore : 5.0;
  const audienceScore = movieData.audienceScore != null ? movieData.audienceScore : 50;

  const cleanData = await cachedEnrichMovieWithTmdbImages({
    ...movieData,
    id,
    description,
    rating,
    criticScore,
    audienceScore,
    reviews: movieData.reviews || [],
    isHero: movieData.isHero || false,
    isStaffPick: movieData.isStaffPick || false,
    staffPickType: movieData.staffPickType || "",
    createdAt: now
  });

  let movie;
  if (useMongoDB) {
    movie = new MovieModel(cleanData);
    movie = await movie.save();
  } else {
    const data = readJsonDb();
    data.movies.push(cleanData);
    writeJsonDb(data);
    movie = cleanData;
  }

  // Auto-seed bot reviews to make movies feel alive
  try {
    await seedBotReviewsForMovie(movie.id || id, cleanData.releaseDate);
  } catch (e) {
    console.warn('Bot review seeding skipped:', e.message);
  }

  // Re-fetch so we return the version with seeded reviews
  if (useMongoDB) {
    return await MovieModel.findOne({ id: movie.id || id });
  } else {
    const data = readJsonDb();
    return data.movies.find(m => m.id === (movie.id || id));
  }
};

export const deleteMovie = async (movieId) => {
  if (useMongoDB) {
    const result = await MovieModel.deleteOne({ id: movieId });
    return result.deletedCount > 0;
  } else {
    const data = readJsonDb();
    const movieIndex = data.movies.findIndex(m => m.id === movieId);
    if (movieIndex === -1) return false;
    data.movies.splice(movieIndex, 1);
    writeJsonDb(data);
    return true;
  }
};


export const curateMovie = async (movieId, curationData) => {
  const { isHero, isStaffPick, staffPickType } = curationData;

  if (useMongoDB) {
    const movie = await MovieModel.findOne({ id: movieId });
    if (!movie) return null;

    if (isHero !== undefined) movie.isHero = isHero;
    if (isStaffPick !== undefined) movie.isStaffPick = isStaffPick;
    if (staffPickType !== undefined) movie.staffPickType = staffPickType;

    await movie.save();
    return movie;
  } else {
    const data = readJsonDb();
    const movieIndex = data.movies.findIndex(m => m.id === movieId);
    if (movieIndex === -1) return null;

    const movie = data.movies[movieIndex];
    if (isHero !== undefined) movie.isHero = isHero;
    if (isStaffPick !== undefined) movie.isStaffPick = isStaffPick;
    if (staffPickType !== undefined) movie.staffPickType = staffPickType;

    writeJsonDb(data);
    return movie;
  }
};


export const addReview = async (movieId, reviewData) => {
  const review = {
    id: 'rev-' + Date.now(),
    user: reviewData.user || "Anonymous",
    avatarUrl: reviewData.avatarUrl || "",
    role: reviewData.role || "Cinema Enthusiast",
    rating: Number(reviewData.rating),
    text: reviewData.text,
    timestamp: "Just now",
    likes: 0,
    likedBy: [],
    comments: 0
  };

  if (useMongoDB) {
    const movie = await MovieModel.findOne({ id: movieId });
    if (!movie) return null;
    movie.reviews.push(review);
    
    const totalRating = movie.reviews.reduce((sum, r) => sum + r.rating, 0);
    const avg = totalRating / movie.reviews.length;
    movie.criticScore = parseFloat(avg.toFixed(1));
    movie.rating = parseFloat((avg / 2).toFixed(1));
    
    await movie.save();
    return movie;
  } else {
    const data = readJsonDb();
    const movieIndex = data.movies.findIndex(m => m.id === movieId);
    if (movieIndex === -1) return null;
    
    const movie = data.movies[movieIndex];
    movie.reviews.push(review);
    
    const totalRating = movie.reviews.reduce((sum, r) => sum + r.rating, 0);
    const avg = totalRating / movie.reviews.length;
    movie.criticScore = parseFloat(avg.toFixed(1));
    movie.rating = parseFloat((avg / 2).toFixed(1));
    
    writeJsonDb(data);
    return movie;
  }
};

export const deleteReview = async (movieId, reviewId, username) => {
  if (useMongoDB) {
    const movie = await MovieModel.findOne({ id: movieId });
    if (!movie) return null;
    const review = movie.reviews.id(reviewId);
    if (!review) return null;
    if (review.user !== username) return { error: "Unauthorized" };
    movie.reviews.pull({ _id: reviewId });
    const totalRating = movie.reviews.reduce((sum, r) => sum + r.rating, 0);
    const avg = movie.reviews.length > 0 ? totalRating / movie.reviews.length : 0;
    movie.criticScore = parseFloat(avg.toFixed(1));
    movie.rating = parseFloat((avg / 2).toFixed(1));
    await movie.save();
    return movie;
  } else {
    const data = readJsonDb();
    const movieIndex = data.movies.findIndex(m => m.id === movieId);
    if (movieIndex === -1) return null;
    const movie = data.movies[movieIndex];
    const reviewIndex = movie.reviews.findIndex(r => r.id === reviewId);
    if (reviewIndex === -1) return null;
    if (movie.reviews[reviewIndex].user !== username) return { error: "Unauthorized" };
    movie.reviews.splice(reviewIndex, 1);
    const totalRating = movie.reviews.reduce((sum, r) => sum + r.rating, 0);
    const avg = movie.reviews.length > 0 ? totalRating / movie.reviews.length : 0;
    movie.criticScore = parseFloat(avg.toFixed(1));
    movie.rating = parseFloat((avg / 2).toFixed(1));
    writeJsonDb(data);
    return movie;
  }
};

export const toggleReviewLike = async (movieId, reviewId, username) => {
  if (useMongoDB) {
    const movie = await MovieModel.findOne({ id: movieId });
    if (!movie) return null;
    const review = movie.reviews.id(reviewId);
    if (!review) return null;
    const idx = review.likedBy.indexOf(username);
    if (idx > -1) {
      review.likedBy.splice(idx, 1);
      review.likes = Math.max(0, review.likes - 1);
    } else {
      review.likedBy.push(username);
      review.likes = (review.likes || 0) + 1;
    }
    await movie.save();
    return { likes: review.likes, likedBy: review.likedBy, reviewId };
  } else {
    const data = readJsonDb();
    const movieIndex = data.movies.findIndex(m => m.id === movieId);
    if (movieIndex === -1) return null;
    const movie = data.movies[movieIndex];
    const review = movie.reviews.find(r => r.id === reviewId);
    if (!review) return null;
    const idx = review.likedBy.indexOf(username);
    if (idx > -1) {
      review.likedBy.splice(idx, 1);
      review.likes = Math.max(0, review.likes - 1);
    } else {
      review.likedBy.push(username);
      review.likes = (review.likes || 0) + 1;
    }
    writeJsonDb(data);
    return { likes: review.likes, likedBy: review.likedBy, reviewId };
  }
};

export const registerUser = async (userData) => {
  const { username, email, password } = userData;
  if (!username || !email || !password) {
    throw new Error("All fields are required");
  }

  if (useMongoDB) {
    const existing = await UserModel.findOne({ username });
    if (existing) throw new Error("Username already taken");
  } else {
    const { users } = readJsonDb();
    const existing = users.find(u => u.username.toLowerCase() === username.toLowerCase());
    if (existing) throw new Error("Username already taken");
  }

  const salt = generateSalt();
  const passwordHash = hashPassword(password, salt);
  const token = crypto.randomBytes(32).toString('hex');
  const avatarUrl = '';
  
  const role = username.toLowerCase() === 'admin' ? 'admin' : 'Cinema Enthusiast';
  const newUser = {
    username,
    email,
    passwordHash,
    salt,
    role,
    avatarUrl,
    token,
    emailVerified: false,
    otp: null,
    otpExpiry: null
  };

  if (useMongoDB) {
    const user = new UserModel(newUser);
    await user.save();
    return { username, email, role: user.role, avatarUrl, token };
  } else {
    const data = readJsonDb();
    data.users.push(newUser);
    writeJsonDb(data);
    return { username, email, role: newUser.role, avatarUrl, token };
  }
};

export const loginUser = async (username, password) => {
  if (!username || !password) {
    throw new Error("Username and password are required");
  }

  let user;
  if (useMongoDB) {
    user = await UserModel.findOne({ username });
  } else {
    const { users } = readJsonDb();
    user = users.find(u => u.username.toLowerCase() === username.toLowerCase());
  }

  if (!user) {
    throw new Error("Invalid username or password");
  }

  const hash = hashPassword(password, user.salt);
  if (hash !== user.passwordHash) {
    throw new Error("Invalid username or password");
  }

  const token = crypto.randomBytes(32).toString('hex');
  
  if (useMongoDB) {
    user.token = token;
    await user.save();
    return { username: user.username, email: user.email, role: user.role, avatarUrl: user.avatarUrl, bio: user.bio, token };
  } else {
    const data = readJsonDb();
    const idx = data.users.findIndex(u => u.username.toLowerCase() === username.toLowerCase());
    data.users[idx].token = token;
    writeJsonDb(data);
    return { username: user.username, email: user.email, role: user.role, avatarUrl: user.avatarUrl, bio: user.bio, token };
  }
};

export const verifyToken = async (token) => {
  if (!token) return null;
  
  if (useMongoDB) {
    const user = await UserModel.findOne({ token });
    if (!user) return null;
    return { username: user.username, email: user.email, role: user.role, avatarUrl: user.avatarUrl, bio: user.bio };
  } else {
    const { users } = readJsonDb();
    const user = users.find(u => u.token === token);
    if (!user) return null;
    return { username: user.username, email: user.email, role: user.role, avatarUrl: user.avatarUrl, bio: user.bio };
  }
};

// Resend HTTP email client (lightweight, works on Render free tier)
const sendEmailViaResend = async (to, otp) => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return false;
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM || 'ThiraiPedia <onboarding@resend.dev>',
      to,
      subject: 'Your ThiraiPedia OTP Code',
      text: `Your OTP code is: ${otp}\n\nThis code expires in 5 minutes.\n\nIf you did not request this, please ignore this email.`,
      html: `<div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2>ThiraiPedia Email Verification</h2>
        <p>Your OTP code is:</p>
        <h1 style="letter-spacing: 8px; font-size: 32px; background: #f0f0f0; padding: 12px 24px; text-align: center; border-radius: 8px;">${otp}</h1>
        <p>This code expires in <strong>5 minutes</strong>.</p>
        <hr>
        <p style="color: #666; font-size: 12px;">If you did not request this, please ignore this email.</p>
      </div>`
    })
  });
  return res.ok;
};

const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const sendOtp = async (email) => {
  if (!email) throw new Error("Email is required");

  let user;
  if (useMongoDB) {
    user = await UserModel.findOne({ email });
  } else {
    const { users } = readJsonDb();
    user = users.find(u => u.email === email);
  }

  if (!user) throw new Error("No account found with this email");

  const otp = generateOtp();
  const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

  if (useMongoDB) {
    user.otp = otp;
    user.otpExpiry = otpExpiry;
    await user.save();
  } else {
    const data = readJsonDb();
    const idx = data.users.findIndex(u => u.email === email);
    data.users[idx].otp = otp;
    data.users[idx].otpExpiry = otpExpiry.toISOString();
    writeJsonDb(data);
  }

  // Send email via Resend if configured, otherwise log to console
  const emailSent = await sendEmailViaResend(email, otp);

  if (!emailSent) {
    console.log(`\n[OTP] Email to ${email}: Your OTP code is ${otp} (expires in 5 minutes)\n`);
    throw new Error("Failed to send OTP email. Check server SMTP configuration.");
  }

  return { message: "OTP sent successfully" };
};

export const verifyOtp = async (email, otp) => {
  if (!email || !otp) throw new Error("Email and OTP are required");

  let user;
  if (useMongoDB) {
    user = await UserModel.findOne({ email });
  } else {
    const { users } = readJsonDb();
    user = users.find(u => u.email === email);
  }

  if (!user) throw new Error("No account found with this email");

  const storedOtp = useMongoDB ? user.otp : user.otp;
  const storedExpiry = useMongoDB ? user.otpExpiry : (user.otpExpiry ? new Date(user.otpExpiry) : null);

  if (!storedOtp || !storedExpiry) {
    throw new Error("No OTP requested. Please request a new OTP.");
  }

  if (new Date() > storedExpiry) {
    throw new Error("OTP has expired. Please request a new one.");
  }

  if (storedOtp !== otp) {
    throw new Error("Invalid OTP. Please try again.");
  }

  if (useMongoDB) {
    user.emailVerified = true;
    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save();
    return { username: user.username, email: user.email, role: user.role, avatarUrl: user.avatarUrl, bio: user.bio, token: user.token };
  } else {
    const data = readJsonDb();
    const idx = data.users.findIndex(u => u.email === email);
    data.users[idx].emailVerified = true;
    delete data.users[idx].otp;
    delete data.users[idx].otpExpiry;
    writeJsonDb(data);
    return { username: user.username, email: user.email, role: user.role, avatarUrl: user.avatarUrl, bio: user.bio, token: user.token };
  }
};

export const getCommunityThreads = async () => {
  if (useMongoDB) {
    return await CommunityThreadModel.find({}).sort({ _id: -1 });
  }
  const { communityThreads } = readJsonDb();
  return [...communityThreads].sort((a, b) => (b.likes + b.replies.length) - (a.likes + a.replies.length));
};

export const createCommunityThread = async (threadData, user) => {
  const cleanTitle = (threadData.title || '').trim();
  const cleanBody = (threadData.body || '').trim();
  if (!cleanTitle || !cleanBody) {
    throw new Error("Title and discussion text are required");
  }

  const thread = {
    id: 'thread-' + Date.now(),
    title: cleanTitle,
    body: cleanBody,
    tag: threadData.tag || "General",
    author: user?.username || "Anonymous Critic",
    role: user?.role || "Cinema Enthusiast",
    avatarUrl: user?.avatarUrl || '',
    timestamp: "Just now",
    likes: 0,
    replies: []
  };

  if (useMongoDB) {
    const created = new CommunityThreadModel(thread);
    return await created.save();
  }

  const data = readJsonDb();
  data.communityThreads.unshift(thread);
  writeJsonDb(data);
  return thread;
};

export const getUsers = async () => {
  if (useMongoDB) {
    const users = await UserModel.find({});
    return users.map(u => ({ username: u.username, email: u.email, role: u.role, avatarUrl: u.avatarUrl, bio: u.bio, followers: u.followers }));
  }
  const { users } = readJsonDb();
  return users.map(u => ({ username: u.username, email: u.email, role: u.role, avatarUrl: u.avatarUrl, bio: u.bio, followers: u.followers || [] }));
};

export const deleteUser = async (username) => {
  if (useMongoDB) {
    const result = await UserModel.deleteOne({ username });
    return result.deletedCount > 0;
  }
  const data = readJsonDb();
  const idx = data.users.findIndex(u => u.username === username);
  if (idx === -1) return false;
  data.users.splice(idx, 1);
  writeJsonDb(data);
  return true;
};

export const updateUserRole = async (username, newRole) => {
  if (useMongoDB) {
    const user = await UserModel.findOne({ username });
    if (!user) return null;
    user.role = newRole;
    await user.save();
    return { username: user.username, email: user.email, role: user.role, avatarUrl: user.avatarUrl };
  }
  const data = readJsonDb();
  const idx = data.users.findIndex(u => u.username === username);
  if (idx === -1) return null;
  data.users[idx].role = newRole;
  writeJsonDb(data);
  const u = data.users[idx];
  return { username: u.username, email: u.email, role: u.role, avatarUrl: u.avatarUrl };
};

export const deleteCommunityThread = async (threadId) => {
  if (useMongoDB) {
    const result = await CommunityThreadModel.deleteOne({ id: threadId });
    return result.deletedCount > 0;
  }
  const data = readJsonDb();
  const idx = data.communityThreads.findIndex(t => t.id === threadId);
  if (idx === -1) return false;
  data.communityThreads.splice(idx, 1);
  writeJsonDb(data);
  return true;
};

export const updateMovie = async (movieId, updateData) => {
  if (useMongoDB) {
    const movie = await MovieModel.findOne({ id: movieId });
    if (!movie) return null;
    Object.keys(updateData).forEach(key => {
      if (key !== 'id' && key !== '_id' && key !== '__v') {
        movie[key] = updateData[key];
      }
    });
    await movie.save();
    return movie.toObject();
  }
  const data = readJsonDb();
  const idx = data.movies.findIndex(m => m.id === movieId);
  if (idx === -1) return null;
  Object.keys(updateData).forEach(key => {
    if (key !== 'id') {
      data.movies[idx][key] = updateData[key];
    }
  });
  writeJsonDb(data);
  return data.movies[idx];
};

export const addReviewReply = async (movieId, reviewId, replyData) => {
  if (useMongoDB) {
    const movie = await MovieModel.findOne({ id: movieId });
    if (!movie) throw new Error('Movie not found');
    const review = movie.reviews.id(reviewId);
    if (!review) throw new Error('Review not found');
    review.replies.push(replyData);
    review.comments = (review.comments || 0) + 1;
    await movie.save();
    return { replies: review.replies, comments: review.comments };
  }
  const data = readJsonDb();
  const movie = data.movies.find(m => m.id === movieId);
  if (!movie) throw new Error('Movie not found');
  const review = movie.reviews.find(r => r.id === reviewId);
  if (!review) throw new Error('Review not found');
  if (!review.replies) review.replies = [];
  review.replies.push(replyData);
  review.comments = (review.comments || 0) + 1;
  writeJsonDb(data);
  return { replies: review.replies, comments: review.comments };
};

export const addCommunityReply = async (threadId, replyData, user) => {
  if (useMongoDB) {
    const thread = await CommunityThreadModel.findOne({ id: threadId });
    if (!thread) throw new Error('Thread not found');
    thread.replies.push(replyData);
    await thread.save();
    return thread;
  }
  const data = readJsonDb();
  const thread = data.communityThreads.find(t => t.id === threadId);
  if (!thread) throw new Error('Thread not found');
  thread.replies.push(replyData);
  writeJsonDb(data);
  return thread;
};

export const getUserByUsername = async (username) => {
  if (useMongoDB) {
    const user = await UserModel.findOne({ username });
    if (!user) return null;
    return { username: user.username, email: user.email, role: user.role, avatarUrl: user.avatarUrl, bio: user.bio, followers: user.followers, following: user.following };
  }
  const { users } = readJsonDb();
  const user = users.find(u => u.username === username);
  if (!user) return null;
  return { username: user.username, email: user.email, role: user.role, avatarUrl: user.avatarUrl, bio: user.bio, followers: user.followers || [], following: user.following || [] };
};

export const updateUserProfile = async (username, profileData) => {
  if (useMongoDB) {
    const user = await UserModel.findOne({ username });
    if (!user) return null;
    if (profileData.bio !== undefined) user.bio = profileData.bio;
    if (profileData.avatarUrl !== undefined) user.avatarUrl = profileData.avatarUrl;
    if (profileData.email !== undefined) user.email = profileData.email;
    await user.save();
    return { username: user.username, email: user.email, role: user.role, avatarUrl: user.avatarUrl, bio: user.bio, followers: user.followers, following: user.following };
  }
  const data = readJsonDb();
  const idx = data.users.findIndex(u => u.username === username);
  if (idx === -1) return null;
  if (profileData.bio !== undefined) data.users[idx].bio = profileData.bio;
  if (profileData.avatarUrl !== undefined) data.users[idx].avatarUrl = profileData.avatarUrl;
  if (profileData.email !== undefined) data.users[idx].email = profileData.email;
  writeJsonDb(data);
  const u = data.users[idx];
  return { username: u.username, email: u.email, role: u.role, avatarUrl: u.avatarUrl, bio: u.bio, followers: u.followers || [], following: u.following || [] };
};

export const followUser = async (currentUsername, targetUsername) => {
  if (currentUsername === targetUsername) throw new Error("Cannot follow yourself");
  if (useMongoDB) {
    const target = await UserModel.findOne({ username: targetUsername });
    if (!target) throw new Error("User not found");
    if (target.followers.includes(currentUsername)) throw new Error("Already following");
    target.followers.push(currentUsername);
    await target.save();
    const current = await UserModel.findOne({ username: currentUsername });
    if (current) {
      current.following.push(targetUsername);
      await current.save();
    }
    return { followers: target.followers };
  }
  const data = readJsonDb();
  const tIdx = data.users.findIndex(u => u.username === targetUsername);
  if (tIdx === -1) throw new Error("User not found");
  if (!data.users[tIdx].followers) data.users[tIdx].followers = [];
  if (data.users[tIdx].followers.includes(currentUsername)) throw new Error("Already following");
  data.users[tIdx].followers.push(currentUsername);
  const cIdx = data.users.findIndex(u => u.username === currentUsername);
  if (cIdx !== -1) {
    if (!data.users[cIdx].following) data.users[cIdx].following = [];
    data.users[cIdx].following.push(targetUsername);
  }
  writeJsonDb(data);
  return { followers: data.users[tIdx].followers };
};

export const unfollowUser = async (currentUsername, targetUsername) => {
  if (useMongoDB) {
    const target = await UserModel.findOne({ username: targetUsername });
    if (!target) throw new Error("User not found");
    target.followers = target.followers.filter(f => f !== currentUsername);
    await target.save();
    const current = await UserModel.findOne({ username: currentUsername });
    if (current) {
      current.following = current.following.filter(f => f !== targetUsername);
      await current.save();
    }
    return { followers: target.followers };
  }
  const data = readJsonDb();
  const tIdx = data.users.findIndex(u => u.username === targetUsername);
  if (tIdx === -1) throw new Error("User not found");
  if (!data.users[tIdx].followers) data.users[tIdx].followers = [];
  data.users[tIdx].followers = data.users[tIdx].followers.filter(f => f !== currentUsername);
  const cIdx = data.users.findIndex(u => u.username === currentUsername);
  if (cIdx !== -1) {
    if (!data.users[cIdx].following) data.users[cIdx].following = [];
    data.users[cIdx].following = data.users[cIdx].following.filter(f => f !== targetUsername);
  }
  writeJsonDb(data);
  return { followers: data.users[tIdx].followers };
};

// ─── USER LISTS ───

let UserListModel;
try {
  const userListSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    description: { type: String, default: '' },
    createdBy: { type: String, required: true },
    movieIds: [{ type: String }],
    createdAt: { type: String, default: () => new Date().toISOString() }
  });
  UserListModel = mongoose.model('UserList', userListSchema);
} catch (e) {}

const generateListId = () => 'list_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);

export const createList = async (listData, username) => {
  const list = {
    id: generateListId(),
    name: listData.name,
    description: listData.description || '',
    createdBy: username,
    movieIds: listData.movieIds || [],
    createdAt: new Date().toISOString()
  };
  if (useMongoDB) {
    const doc = new UserListModel(list);
    await doc.save();
    return list;
  }
  const data = readJsonDb();
  if (!data.userLists) data.userLists = [];
  data.userLists.push(list);
  writeJsonDb(data);
  return list;
};

export const getUserLists = async (username) => {
  if (useMongoDB) {
    return await UserListModel.find({ createdBy: username }).sort({ createdAt: -1 });
  }
  const data = readJsonDb();
  return (data.userLists || []).filter(l => l.createdBy === username).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
};

export const getAllLists = async () => {
  if (useMongoDB) {
    return await UserListModel.find({}).sort({ createdAt: -1 });
  }
  const data = readJsonDb();
  return (data.userLists || []).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
};

export const getList = async (listId) => {
  if (useMongoDB) {
    return await UserListModel.findOne({ id: listId });
  }
  const data = readJsonDb();
  return (data.userLists || []).find(l => l.id === listId) || null;
};

export const addMovieToList = async (listId, movieId) => {
  if (useMongoDB) {
    const list = await UserListModel.findOne({ id: listId });
    if (!list) throw new Error("List not found");
    if (!list.movieIds.includes(movieId)) list.movieIds.push(movieId);
    await list.save();
    return list;
  }
  const data = readJsonDb();
  const list = (data.userLists || []).find(l => l.id === listId);
  if (!list) throw new Error("List not found");
  if (!list.movieIds.includes(movieId)) list.movieIds.push(movieId);
  writeJsonDb(data);
  return list;
};

export const removeMovieFromList = async (listId, movieId) => {
  if (useMongoDB) {
    const list = await UserListModel.findOne({ id: listId });
    if (!list) throw new Error("List not found");
    list.movieIds = list.movieIds.filter(id => id !== movieId);
    await list.save();
    return list;
  }
  const data = readJsonDb();
  const list = (data.userLists || []).find(l => l.id === listId);
  if (!list) throw new Error("List not found");
  list.movieIds = list.movieIds.filter(id => id !== movieId);
  writeJsonDb(data);
  return list;
};

export const deleteList = async (listId, username) => {
  if (useMongoDB) {
    const list = await UserListModel.findOne({ id: listId });
    if (!list) throw new Error("List not found");
    if (list.createdBy !== username) throw new Error("Not authorized");
    await UserListModel.deleteOne({ id: listId });
    return true;
  }
  const data = readJsonDb();
  const idx = (data.userLists || []).findIndex(l => l.id === listId);
  if (idx === -1) throw new Error("List not found");
  if (data.userLists[idx].createdBy !== username) throw new Error("Not authorized");
  data.userLists.splice(idx, 1);
  writeJsonDb(data);
  return true;
};

// ─── LEADERBOARD ───

export const getLeaderboard = async () => {
  const users = await getUsers();
  const movies = await getMovies();
  const reviewCounts = {};
  const totalRatings = {};

  for (const movie of movies) {
    if (movie.reviews) {
      for (const review of movie.reviews) {
        const u = review.user;
        if (u) {
          reviewCounts[u] = (reviewCounts[u] || 0) + 1;
          totalRatings[u] = (totalRatings[u] || 0) + review.rating;
        }
      }
    }
  }

  return users
    .filter(u => u.username !== 'admin')
    .map(u => ({
      username: u.username,
      role: u.role,
      avatarUrl: u.avatarUrl,
      reviewCount: reviewCounts[u.username] || 0,
      avgRating: reviewCounts[u.username] ? (totalRatings[u.username] / reviewCounts[u.username]).toFixed(1) : 0,
      followerCount: (u.followers || []).length
    }))
    .sort((a, b) => b.reviewCount - a.reviewCount || b.followerCount - a.followerCount);
};
