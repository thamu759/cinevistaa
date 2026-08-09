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

export const getTmdbHeaders = () => {
  if (process.env.TMDB_ACCESS_TOKEN) {
    return { Authorization: `Bearer ${process.env.TMDB_ACCESS_TOKEN}` };
  }
  return {};
};

export const buildTmdbUrl = (path, params = {}) => {
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
  },
  {
    id: "the-dark-knight",
    title: "The Dark Knight",
    description: "When the menace of the Joker plunges Gotham City into chaos, Batman must confront one of the greatest psychological tests of his ability to fight injustice. Christopher Nolan's superhero epic redefined the genre.",
    rating: 9.0,
    criticScore: 9.3,
    audienceScore: 94,
    genre: "Action / Crime / Drama",
    releaseYear: 2008,
    runtime: "2h 32m",
    director: "Christopher Nolan",
    writer: "Jonathan Nolan",
    studio: "Warner Bros. Pictures",
    releaseDate: "July 18, 2008",
    language: "English",
    posterUrl: "https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911BytUrT3EIXEh.jpg",
    backdropUrl: "https://image.tmdb.org/t/p/original/nMKdUUepR0i5zn0y1T4CsSB5ez.jpg",
    isHero: false,
    isStaffPick: false,
    staffPickType: "",
    cast: [
      { name: "Christian Bale", role: "Bruce Wayne / Batman", avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200&auto=format&fit=crop" },
      { name: "Heath Ledger", role: "Joker", avatarUrl: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=200&auto=format&fit=crop" }
    ],
    reviews: []
  },
  {
    id: "the-matrix",
    title: "The Matrix",
    description: "A computer programmer discovers that reality as he knows it is a simulation created by intelligent machines, and he is the prophesied One who can break the system. The Wachowskis' sci-fi masterpiece changed cinema forever.",
    rating: 8.7,
    criticScore: 8.5,
    audienceScore: 91,
    genre: "Sci-Fi / Action",
    releaseYear: 1999,
    runtime: "2h 16m",
    director: "Lana & Lilly Wachowski",
    writer: "The Wachowskis",
    studio: "Warner Bros. Pictures",
    releaseDate: "March 31, 1999",
    language: "English",
    posterUrl: "https://image.tmdb.org/t/p/w500/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg",
    backdropUrl: "https://image.tmdb.org/t/p/original/7u3pxZgH7DkQ1sZDuh6kT0hvsON.jpg",
    isHero: false,
    isStaffPick: false,
    staffPickType: "",
    cast: [
      { name: "Keanu Reeves", role: "Neo", avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200&auto=format&fit=crop" },
      { name: "Laurence Fishburne", role: "Morpheus", avatarUrl: "https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=200&auto=format&fit=crop" }
    ],
    reviews: []
  },
  {
    id: "shawshank-redemption",
    title: "The Shawshank Redemption",
    description: "A banker convicted of murdering his wife and her lover befriends a fellow prisoner and finds purpose behind bars. Frank Darabont's timeless drama about hope, friendship, and resilience is one of the most beloved films ever made.",
    rating: 9.3,
    criticScore: 9.0,
    audienceScore: 97,
    genre: "Drama",
    releaseYear: 1994,
    runtime: "2h 22m",
    director: "Frank Darabont",
    writer: "Frank Darabont",
    studio: "Castle Rock Entertainment",
    releaseDate: "October 14, 1994",
    language: "English",
    posterUrl: "https://image.tmdb.org/t/p/w500/9cjIGRQL1m4E87FkTJ6dTTKXKdQ.jpg",
    backdropUrl: "https://image.tmdb.org/t/p/original/9Xp3gwRqwBqoE7dCbcn8K5fBdHG.jpg",
    isHero: false,
    isStaffPick: true,
    staffPickType: "featured",
    cast: [
      { name: "Tim Robbins", role: "Andy Dufresne", avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200&auto=format&fit=crop" },
      { name: "Morgan Freeman", role: "Ellis Boyd 'Red' Redding", avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=200&auto=format&fit=crop" }
    ],
    reviews: []
  },
  {
    id: "parasite",
    title: "Parasite",
    description: "A poor family schemes their way into the lives of a wealthy household, leading to an explosive collision of class, greed, and survival. Bong Joon-ho's Palme d'Or winner is a genre-defying masterpiece of social commentary.",
    rating: 8.5,
    criticScore: 9.5,
    audienceScore: 90,
    genre: "Thriller / Drama / Comedy",
    releaseYear: 2019,
    runtime: "2h 12m",
    director: "Bong Joon-ho",
    writer: "Bong Joon-ho",
    studio: "CJ Entertainment",
    releaseDate: "May 30, 2019",
    language: "Korean",
    posterUrl: "https://image.tmdb.org/t/p/w500/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg",
    backdropUrl: "https://image.tmdb.org/t/p/original/API0XhG7pDbT7pBv46gnsAFRkM.jpg",
    isHero: false,
    isStaffPick: false,
    staffPickType: "",
    cast: [
      { name: "Song Kang-ho", role: "Kim Ki-taek", avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop" },
      { name: "Cho Yeo-jeong", role: "Yeon-gyo", avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&auto=format&fit=crop" }
    ],
    reviews: []
  },
  {
    id: "everything-everywhere",
    title: "Everything Everywhere All at Once",
    description: "A Chinese-American laundromat owner discovers she can access parallel universes and must save all of reality from a mysterious threat. Daniels' multiverse epic is a wildly imaginative, emotionally devastating triumph.",
    rating: 8.3,
    criticScore: 9.6,
    audienceScore: 91,
    genre: "Sci-Fi / Action / Comedy / Drama",
    releaseYear: 2022,
    runtime: "2h 19m",
    director: "Daniel Kwan & Daniel Scheinert",
    writer: "Daniel Kwan & Daniel Scheinert",
    studio: "A24",
    releaseDate: "March 25, 2022",
    language: "English",
    posterUrl: "https://image.tmdb.org/t/p/w500/w3LxiVYdWWRvEVdn5RYq6jIqkb1.jpg",
    backdropUrl: "https://image.tmdb.org/t/p/original/iJ1F32asZnaPpGxpY1hCrEmE0vx.jpg",
    isHero: false,
    isStaffPick: false,
    staffPickType: "",
    cast: [
      { name: "Michelle Yeoh", role: "Evelyn Quan Wang", avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&auto=format&fit=crop" },
      { name: "Ke Huy Quan", role: "Waymond Wang", avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200&auto=format&fit=crop" }
    ],
    reviews: []
  },
  {
    id: "the-social-network",
    title: "The Social Network",
    description: "Harvard student Mark Zuckerberg creates Facebook, transforming human connection forever while facing lawsuits from his former friends. David Fincher's razor-sharp drama is a modern tragedy of ambition and betrayal.",
    rating: 8.0,
    criticScore: 9.1,
    audienceScore: 83,
    genre: "Drama / Biography",
    releaseYear: 2010,
    runtime: "2h 00m",
    director: "David Fincher",
    writer: "Aaron Sorkin",
    studio: "Columbia Pictures",
    releaseDate: "October 1, 2010",
    language: "English",
    posterUrl: "https://image.tmdb.org/t/p/w500/n0ybibh1t5Ybh0C4GfFjF0XxIkG.jpg",
    backdropUrl: "https://image.tmdb.org/t/p/original/7cXgOo2aHXy8QfFCHdK4Hxh6cOb.jpg",
    isHero: false,
    isStaffPick: false,
    staffPickType: "",
    cast: [
      { name: "Jesse Eisenberg", role: "Mark Zuckerberg", avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200&auto=format&fit=crop" },
      { name: "Andrew Garfield", role: "Eduardo Saverin", avatarUrl: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=200&auto=format&fit=crop" }
    ],
    reviews: []
  },
  {
    id: "joker-2019",
    title: "Joker",
    description: "A failed stand-up comedian is slowly driven to insanity and becomes a notorious criminal mastermind in Gotham City. Todd Phillips' dark character study earned Joaquin Phoenix an Oscar for his haunting transformation.",
    rating: 8.1,
    criticScore: 7.5,
    audienceScore: 88,
    genre: "Crime / Drama / Psychological",
    releaseYear: 2019,
    runtime: "2h 02m",
    director: "Todd Phillips",
    writer: "Todd Phillips",
    studio: "Warner Bros. Pictures",
    releaseDate: "October 4, 2019",
    language: "English",
    posterUrl: "https://image.tmdb.org/t/p/w500/udD2RSM4ii9VfApjCJs3vGXkWsY.jpg",
    backdropUrl: "https://image.tmdb.org/t/p/original/f5F4cRhQdUbyVbB5lT5J6C5OqVH.jpg",
    isHero: false,
    isStaffPick: false,
    staffPickType: "",
    cast: [
      { name: "Joaquin Phoenix", role: "Arthur Fleck / Joker", avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop" },
      { name: "Robert De Niro", role: "Murray Franklin", avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=200&auto=format&fit=crop" }
    ],
    reviews: []
  },
  {
    id: "lotr-fellowship",
    title: "The Lord of the Rings: The Fellowship of the Ring",
    description: "A young hobbit named Frodo inherits a ring that holds the fate of Middle-earth and must destroy it in the fires of Mount Doom. Peter Jackson's epic fantasy masterpiece launched one of cinema's greatest trilogies.",
    rating: 8.8,
    criticScore: 9.2,
    audienceScore: 95,
    genre: "Fantasy / Adventure / Action",
    releaseYear: 2001,
    runtime: "2h 58m",
    director: "Peter Jackson",
    writer: "Fran Walsh & Philippa Boyens",
    studio: "New Line Cinema",
    releaseDate: "December 19, 2001",
    language: "English",
    posterUrl: "https://image.tmdb.org/t/p/w500/6oom5QYQ2yQTM1q2mGc4sQfJX8h.jpg",
    backdropUrl: "https://image.tmdb.org/t/p/original/vRQnzOn4HjIMX4LBq9TRHk1Yw7.jpg",
    isHero: false,
    isStaffPick: false,
    staffPickType: "",
    cast: [
      { name: "Elijah Wood", role: "Frodo Baggins", avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200&auto=format&fit=crop" },
      { name: "Ian McKellen", role: "Gandalf", avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=200&auto=format&fit=crop" },
      { name: "Viggo Mortensen", role: "Aragorn", avatarUrl: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=200&auto=format&fit=crop" }
    ],
    reviews: []
  },
  {
    id: "gladiator",
    title: "Gladiator",
    description: "A betrayed Roman general returns to Rome as a gladiator to seek vengeance against the corrupt emperor who murdered his family. Ridley Scott's epic historical drama won the Oscar for Best Picture.",
    rating: 8.5,
    criticScore: 8.0,
    audienceScore: 90,
    genre: "Action / Drama / History",
    releaseYear: 2000,
    runtime: "2h 35m",
    director: "Ridley Scott",
    writer: "David Franzoni",
    studio: "DreamWorks Pictures",
    releaseDate: "May 5, 2000",
    language: "English",
    posterUrl: "https://image.tmdb.org/t/p/w500/ty8TGRuvJLPUmAR1H1nRIsgCLYn.jpg",
    backdropUrl: "https://image.tmdb.org/t/p/original/a4P7QjvGkRiZxhUTZnHjQDAfWfu.jpg",
    isHero: false,
    isStaffPick: false,
    staffPickType: "",
    cast: [
      { name: "Russell Crowe", role: "Maximus Decimus Meridius", avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200&auto=format&fit=crop" },
      { name: "Joaquin Phoenix", role: "Emperor Commodus", avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop" }
    ],
    reviews: []
  },
  {
    id: "silence-of-the-lambs",
    title: "The Silence of the Lambs",
    description: "An FBI trainee seeks the help of a brilliant but psychopathic cannibal to catch another serial killer who skins his victims. Jonathan Demme's psychological horror-thriller swept the five major Oscars.",
    rating: 8.6,
    criticScore: 9.2,
    audienceScore: 91,
    genre: "Thriller / Crime / Horror",
    releaseYear: 1991,
    runtime: "1h 58m",
    director: "Jonathan Demme",
    writer: "Ted Tally",
    studio: "Orion Pictures",
    releaseDate: "February 14, 1991",
    language: "English",
    posterUrl: "https://image.tmdb.org/t/p/w500/uS9m8OBk1RVFfMn7TZ5Cz27Sxpm.jpg",
    backdropUrl: "https://image.tmdb.org/t/p/original/v4jcHrGiQ3GZgBn7cJFfHknSMhs.jpg",
    isHero: false,
    isStaffPick: false,
    staffPickType: "",
    cast: [
      { name: "Jodie Foster", role: "Clarice Starling", avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&auto=format&fit=crop" },
      { name: "Anthony Hopkins", role: "Dr. Hannibal Lecter", avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=200&auto=format&fit=crop" }
    ],
    reviews: []
  },
  {
    id: "schindlers-list",
    title: "Schindler's List",
    description: "A German businessman saves the lives of over a thousand Polish Jews during the Holocaust by employing them in his factories. Steven Spielberg's devastating masterpiece is one of the most important films ever made.",
    rating: 9.0,
    criticScore: 9.7,
    audienceScore: 96,
    genre: "Drama / History / War",
    releaseYear: 1993,
    runtime: "3h 15m",
    director: "Steven Spielberg",
    writer: "Steven Zaillian",
    studio: "Universal Pictures",
    releaseDate: "February 4, 1993",
    language: "English",
    posterUrl: "https://image.tmdb.org/t/p/w500/z6ZP3I1SX2Tv8i0R5UlxE5Gk1a4.jpg",
    backdropUrl: "https://image.tmdb.org/t/p/original/5PMb8Q3mdRvbSVxXP5OItLsgmIS.jpg",
    isHero: false,
    isStaffPick: false,
    staffPickType: "",
    cast: [
      { name: "Liam Neeson", role: "Oskar Schindler", avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200&auto=format&fit=crop" },
      { name: "Ralph Fiennes", role: "Amon Goeth", avatarUrl: "https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=200&auto=format&fit=crop" }
    ],
    reviews: []
  },
  {
    id: "pulp-fiction",
    title: "Pulp Fiction",
    description: "The lives of two hitmen, a boxer, a gangster's wife, and a pair of diner bandits intertwine in a series of interconnected stories. Quentin Tarantino's iconic crime epic reshaped modern cinema with its razor-sharp dialogue.",
    rating: 8.9,
    criticScore: 9.4,
    audienceScore: 93,
    genre: "Crime / Drama",
    releaseYear: 1994,
    runtime: "2h 34m",
    director: "Quentin Tarantino",
    writer: "Quentin Tarantino",
    studio: "Miramax",
    releaseDate: "October 14, 1994",
    language: "English",
    posterUrl: "https://image.tmdb.org/t/p/w500/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg",
    backdropUrl: "https://image.tmdb.org/t/p/original/suaEOtk1N1sgg2MTM7oZd2cfVp3.jpg",
    isHero: false,
    isStaffPick: false,
    staffPickType: "",
    cast: [
      { name: "John Travolta", role: "Vincent Vega", avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200&auto=format&fit=crop" },
      { name: "Samuel L. Jackson", role: "Jules Winnfield", avatarUrl: "https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=200&auto=format&fit=crop" },
      { name: "Uma Thurman", role: "Mia Wallace", avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&auto=format&fit=crop" }
    ],
    reviews: []
  },
  {
    id: "goodfellas",
    title: "Goodfellas",
    description: "A young man grows up in the mob and works his way up through the ranks to become a respected gangster, only to face the consequences of his choices. Martin Scorsese's crime masterpiece is the gold standard of the genre.",
    rating: 8.7,
    criticScore: 9.5,
    audienceScore: 92,
    genre: "Crime / Drama",
    releaseYear: 1990,
    runtime: "2h 26m",
    director: "Martin Scorsese",
    writer: "Martin Scorsese",
    studio: "Warner Bros. Pictures",
    releaseDate: "September 21, 1990",
    language: "English",
    posterUrl: "https://image.tmdb.org/t/p/w500/aKuFiU82s5ISJDx4zLmB1WZelVh.jpg",
    backdropUrl: "https://image.tmdb.org/t/p/original/7qtYJmGS0dLiiLdLk5gYOpOoIkS.jpg",
    isHero: false,
    isStaffPick: false,
    staffPickType: "",
    cast: [
      { name: "Robert De Niro", role: "James Conway", avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=200&auto=format&fit=crop" },
      { name: "Ray Liotta", role: "Henry Hill", avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200&auto=format&fit=crop" },
      { name: "Joe Pesci", role: "Tommy DeVito", avatarUrl: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=200&auto=format&fit=crop" }
    ],
    reviews: []
  },
  {
    id: "no-country-for-old-men",
    title: "No Country for Old Men",
    description: "A hunter stumbles upon a drug deal gone wrong and a suitcase full of cash, setting off a chain of violence across the Texas borderlands. The Coen Brothers' Oscar-winning thriller is a masterclass in tension.",
    rating: 8.3,
    criticScore: 9.7,
    audienceScore: 85,
    genre: "Crime / Thriller",
    releaseYear: 2007,
    runtime: "2h 02m",
    director: "Joel & Ethan Coen",
    writer: "Joel & Ethan Coen",
    studio: "Miramax",
    releaseDate: "November 21, 2007",
    language: "English",
    posterUrl: "https://image.tmdb.org/t/p/w500/bmNbxD1wryx5AYcFDMWxNpD5N7w.jpg",
    backdropUrl: "https://image.tmdb.org/t/p/original/jkAZ0pO7PqAMd6kX0JFZmz3YVjB.jpg",
    isHero: false,
    isStaffPick: false,
    staffPickType: "",
    cast: [
      { name: "Javier Bardem", role: "Anton Chigurh", avatarUrl: "https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=200&auto=format&fit=crop" },
      { name: "Tommy Lee Jones", role: "Sheriff Ed Tom Bell", avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=200&auto=format&fit=crop" }
    ],
    reviews: []
  },
  {
    id: "django-unchained",
    title: "Django Unchained",
    description: "A freed slave teams up with a German bounty hunter to rescue his wife from a sadistic plantation owner in the pre-Civil War South. Quentin Tarantino's audacious spaghetti western tackles America's original sin head-on.",
    rating: 8.4,
    criticScore: 8.4,
    audienceScore: 90,
    genre: "Western / Drama / Action",
    releaseYear: 2012,
    runtime: "2h 45m",
    director: "Quentin Tarantino",
    writer: "Quentin Tarantino",
    studio: "The Weinstein Company",
    releaseDate: "December 25, 2012",
    language: "English",
    posterUrl: "https://image.tmdb.org/t/p/w500/7oWY8VDWW7thTzWh3OKYRkWUlD5.jpg",
    backdropUrl: "https://image.tmdb.org/t/p/original/6KdsYpOj4VhVSkZzCpTktbTRaf1.jpg",
    isHero: false,
    isStaffPick: false,
    staffPickType: "",
    cast: [
      { name: "Jamie Foxx", role: "Django", avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200&auto=format&fit=crop" },
      { name: "Christoph Waltz", role: "Dr. King Schultz", avatarUrl: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=200&auto=format&fit=crop" }
    ],
    reviews: []
  },
  {
    id: "saving-private-ryan",
    title: "Saving Private Ryan",
    description: "During World War II, a group of soldiers is sent behind enemy lines to find and bring home a paratrooper whose three brothers have been killed in action. Steven Spielberg's war epic redefined cinematic realism.",
    rating: 8.6,
    criticScore: 8.8,
    audienceScore: 89,
    genre: "War / Drama / History",
    releaseYear: 1998,
    runtime: "2h 48m",
    director: "Steven Spielberg",
    writer: "Robert Rodat",
    studio: "DreamWorks Pictures",
    releaseDate: "July 24, 1998",
    language: "English",
    posterUrl: "https://image.tmdb.org/t/p/w500/uqx37cS8cpHg8U35f9G5G0i1sG6.jpg",
    backdropUrl: "https://image.tmdb.org/t/p/original/g2TJHoI6h7b7o2lTjZxyKNNbgn4.jpg",
    isHero: false,
    isStaffPick: false,
    staffPickType: "",
    cast: [
      { name: "Tom Hanks", role: "Captain John Miller", avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200&auto=format&fit=crop" },
      { name: "Matt Damon", role: "Private James Ryan", avatarUrl: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=200&auto=format&fit=crop" }
    ],
    reviews: []
  },
  {
    id: "tenet",
    title: "Tenet",
    description: "A secret agent is recruited to prevent World War III using a technology that allows objects to move backwards through time. Christopher Nolan's time-bending spy thriller pushes the boundaries of cinematic storytelling.",
    rating: 7.5,
    criticScore: 6.9,
    audienceScore: 78,
    genre: "Sci-Fi / Action / Thriller",
    releaseYear: 2020,
    runtime: "2h 30m",
    director: "Christopher Nolan",
    writer: "Christopher Nolan",
    studio: "Warner Bros. Pictures",
    releaseDate: "September 3, 2020",
    language: "English",
    posterUrl: "https://image.tmdb.org/t/p/w500/aCIFMriQh8rvhsMp5T5W2GBRgJb.jpg",
    backdropUrl: "https://image.tmdb.org/t/p/original/yY76zq9XQJq4O20CqH3S1i84GQc.jpg",
    isHero: false,
    isStaffPick: false,
    staffPickType: "",
    cast: [
      { name: "John David Washington", role: "The Protagonist", avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200&auto=format&fit=crop" },
      { name: "Robert Pattinson", role: "Neil", avatarUrl: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=200&auto=format&fit=crop" }
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
  },
  {
    id: "sarpatta-paramparai",
    title: "Sarpatta Parambarai",
    description: "Set in the 1970s, a young man from a Dalit boxing clan in North Chennai rises against caste politics and rival factions to become a champion. Pa. Ranjith's sports epic pulses with raw energy and social commentary.",
    rating: 8.6,
    criticScore: 8.5,
    audienceScore: 91,
    genre: "Tamil / Sports / Drama",
    releaseYear: 2021,
    runtime: "2h 53m",
    director: "Pa. Ranjith",
    writer: "Pa. Ranjith",
    studio: "Neelam Productions",
    releaseDate: "July 22, 2021",
    language: "Tamil",
    tmdbId: 754934,
    posterUrl: "https://media.tamilmdb.com/i/movie/0a/7b/6804/175x245/60f8cf73712cd.jpeg",
    backdropUrl: "https://media.tamilmdb.com/i/movie/0a/7b/6804/175x245/60f8cf73712cd.jpeg",
    isHero: false,
    isStaffPick: true,
    staffPickType: "grid",
    cast: [
      { name: "Arya", role: "Kabilan", avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200&auto=format&fit=crop" },
      { name: "Pasupathy", role: "Rangan Vaathiyar", avatarUrl: "https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=200&auto=format&fit=crop" }
    ],
    reviews: []
  },
  {
    id: "soorarai-pottru",
    title: "Soorarai Pottru",
    description: "A man from a marginalized community dreams of making air travel affordable for the common man, battling a corrupt aviation system. Sudha Kongara's inspiring biopic of Captain G. R. Gopinath soars on Suriya's powerful performance.",
    rating: 8.5,
    criticScore: 8.7,
    audienceScore: 90,
    genre: "Tamil / Drama / Biography",
    releaseYear: 2020,
    runtime: "2h 33m",
    director: "Sudha Kongara",
    writer: "Sudha Kongara",
    studio: "2D Entertainment",
    releaseDate: "November 12, 2020",
    language: "Tamil",
    tmdbId: 665022,
    posterUrl: "https://media.tamilmdb.com/i/movie/a0/03/6818/175x245/5f696985c03c2.jpeg",
    backdropUrl: "https://media.tamilmdb.com/i/movie/a0/03/6818/175x245/5f696985c03c2.jpeg",
    isHero: false,
    isStaffPick: false,
    staffPickType: "",
    cast: [
      { name: "Suriya", role: "Nedumaaran Rajangam", avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=200&auto=format&fit=crop" },
      { name: "Aparna Balamurali", role: "Sundari", avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&auto=format&fit=crop" }
    ],
    reviews: []
  },
  {
    id: "pariyerum-perumal",
    title: "Pariyerum Perumal",
    description: "A law student from a Dalit background faces brutal caste discrimination when he falls in love with an upper-caste girl. Mari Selvaraj's debut is a ferocious, unflinching look at caste violence in modern Tamil Nadu.",
    rating: 8.3,
    criticScore: 8.6,
    audienceScore: 87,
    genre: "Tamil / Drama / Social",
    releaseYear: 2018,
    runtime: "2h 34m",
    director: "Mari Selvaraj",
    writer: "Mari Selvaraj",
    studio: "Neelam Productions",
    releaseDate: "September 28, 2018",
    language: "Tamil",
    tmdbId: 531454,
    posterUrl: "https://media.tamilmdb.com/i/movie/74/16/6198/175x245/5bafe2087a6c7.jpg",
    backdropUrl: "https://media.tamilmdb.com/i/movie/74/16/6198/175x245/5bafe2087a6c7.jpg",
    isHero: false,
    isStaffPick: false,
    staffPickType: "",
    cast: [
      { name: "Kathir", role: "Pariyerum Perumal", avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200&auto=format&fit=crop" },
      { name: "Anandhi", role: "Jo", avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&auto=format&fit=crop" }
    ],
    reviews: []
  },
  {
    id: "vada-chennai",
    title: "Vada Chennai",
    description: "A young carrom player from North Chennai gets entangled in the violent turf war between two gangsters spanning decades. Vetrimaaran's epic crime saga is a masterful portrait of survival, loyalty, and ambition.",
    rating: 8.3,
    criticScore: 8.4,
    audienceScore: 88,
    genre: "Tamil / Crime / Drama",
    releaseYear: 2018,
    runtime: "2h 44m",
    director: "Vetrimaaran",
    writer: "Vetrimaaran",
    studio: "Grass Root Film Company",
    releaseDate: "October 17, 2018",
    language: "Tamil",
    tmdbId: 485962,
    posterUrl: "https://media.tamilmdb.com/i/movie/62/8a/6461/175x245/5bc52c4b2b774.jpg",
    backdropUrl: "https://media.tamilmdb.com/i/movie/62/8a/6461/175x245/5bc52c4b2b774.jpg",
    isHero: false,
    isStaffPick: false,
    staffPickType: "",
    cast: [
      { name: "Dhanush", role: "Anbu", avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200&auto=format&fit=crop" },
      { name: "Andrea Jeremiah", role: "Padma", avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&auto=format&fit=crop" },
      { name: "Ameer", role: "Rajan", avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop" }
    ],
    reviews: []
  },
  {
    id: "jigarthanda-double-x",
    title: "Jigarthanda Double X",
    description: "A struggling filmmaker approaches a notorious gangster to make a western movie, leading to an unlikely friendship. Karthik Subbaraj's meta-cinematic marvel blends wild comedy with heartfelt drama.",
    rating: 8.2,
    criticScore: 8.3,
    audienceScore: 86,
    genre: "Tamil / Action / Comedy / Drama",
    releaseYear: 2023,
    runtime: "2h 50m",
    director: "Karthik Subbaraj",
    writer: "Karthik Subbaraj",
    studio: "Stone Bench Films",
    releaseDate: "November 10, 2023",
    language: "Tamil",
    tmdbId: 1094532,
    posterUrl: "https://media.tamilmdb.com/i/movie/32/0a/7373/175x245/65573f7ecee0d.jpg",
    backdropUrl: "https://media.tamilmdb.com/i/movie/32/0a/7373/175x245/65573f7ecee0d.jpg",
    isHero: false,
    isStaffPick: false,
    staffPickType: "",
    cast: [
      { name: "Raghava Lawrence", role: "Allius Caesar / Sathyadev", avatarUrl: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=200&auto=format&fit=crop" },
      { name: "S. J. Suryah", role: "Sathya / Allius Caesar", avatarUrl: "https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=200&auto=format&fit=crop" }
    ],
    reviews: []
  },
  {
    id: "maanaadu",
    title: "Maanaadu",
    description: "A Muslim man gets stuck in a time loop on the day of a high-profile political conference where an assassination is planned. Venkat Prabhu delivers a slick, intelligent action thriller with a sharp political edge.",
    rating: 8.0,
    criticScore: 7.9,
    audienceScore: 85,
    genre: "Tamil / Action / Thriller / Sci-Fi",
    releaseYear: 2021,
    runtime: "2h 28m",
    director: "Venkat Prabhu",
    writer: "Venkat Prabhu",
    studio: "AGS Entertainment",
    releaseDate: "November 25, 2021",
    language: "Tamil",
    tmdbId: 871043,
    posterUrl: "https://media.tamilmdb.com/i/movie/de/f1/6814/175x245/618f7aef6b1a0.jpeg",
    backdropUrl: "https://media.tamilmdb.com/i/movie/de/f1/6814/175x245/618f7aef6b1a0.jpeg",
    isHero: false,
    isStaffPick: false,
    staffPickType: "",
    cast: [
      { name: "Silambarasan", role: "Abdul Khaaliq", avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200&auto=format&fit=crop" },
      { name: "S. J. Suryah", role: "Dhanushkodi", avatarUrl: "https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=200&auto=format&fit=crop" }
    ],
    reviews: []
  },
  {
    id: "jailer",
    title: "Jailer",
    description: "A retired jailer is forced to confront his past when his son gets entangled with a dangerous idol smuggling ring. Rajinikanth anchors Nelson Dilipkumar's darkly comic action entertainer.",
    rating: 7.5,
    criticScore: 7.2,
    audienceScore: 83,
    genre: "Tamil / Action / Comedy / Drama",
    releaseYear: 2023,
    runtime: "2h 48m",
    director: "Nelson Dilipkumar",
    writer: "Nelson Dilipkumar",
    studio: "Sun Pictures",
    releaseDate: "August 10, 2023",
    language: "Tamil",
    tmdbId: 1084450,
    posterUrl: "https://media.tamilmdb.com/i/movie/cc/fc/7347/175x245/64d3e7a592ea1.jpg",
    backdropUrl: "https://media.tamilmdb.com/i/movie/cc/fc/7347/175x245/64d3e7a592ea1.jpg",
    isHero: false,
    isStaffPick: false,
    staffPickType: "",
    cast: [
      { name: "Rajinikanth", role: "Tiger Muthuvel Pandian", avatarUrl: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=200&auto=format&fit=crop" },
      { name: "Mohanlal", role: "Mathew", avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=200&auto=format&fit=crop" }
    ],
    reviews: []
  },
  {
    id: "vikram-vedha",
    title: "Vikram Vedha",
    description: "A ruthless police officer hunts a notorious gangster who challenges his moral compass through a series of stories blending fact and fiction. Pushkar-Gayathri's neo-noir crime thriller redefined Tamil cinema's storytelling.",
    rating: 8.3,
    criticScore: 8.2,
    audienceScore: 89,
    genre: "Tamil / Action / Crime / Thriller",
    releaseYear: 2017,
    runtime: "2h 27m",
    director: "Pushkar-Gayathri",
    writer: "Pushkar-Gayathri",
    studio: "YNOT Studios",
    releaseDate: "July 21, 2017",
    language: "Tamil",
    tmdbId: 435395,
    posterUrl: "https://media.tamilmdb.com/i/movie/07/f8/6156/175x245/596fe6c822dab.jpg",
    backdropUrl: "https://media.tamilmdb.com/i/movie/07/f8/6156/175x245/596fe6c822dab.jpg",
    isHero: false,
    isStaffPick: false,
    staffPickType: "",
    cast: [
      { name: "R. Madhavan", role: "Vikram", avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200&auto=format&fit=crop" },
      { name: "Vijay Sethupathi", role: "Vedha", avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop" }
    ],
    reviews: []
  },
  {
    id: "ratchasan",
    title: "Ratchasan",
    description: "A brilliant police officer investigates a series of gruesome murders committed by a psychopath who targets schoolgirls. Ram Kumar's chilling thriller is one of Tamil cinema's most taut and terrifying crime films.",
    rating: 8.2,
    criticScore: 8.1,
    audienceScore: 87,
    genre: "Tamil / Crime / Thriller",
    releaseYear: 2018,
    runtime: "2h 10m",
    director: "Ram Kumar",
    writer: "Ram Kumar",
    studio: "Gopuram Films",
    releaseDate: "October 5, 2018",
    language: "Tamil",
    tmdbId: 547016,
    posterUrl: "https://media.tamilmdb.com/i/movie/42/5f/6464/175x245/5bb7b3b2965d0.jpg",
    backdropUrl: "https://media.tamilmdb.com/i/movie/42/5f/6464/175x245/5bb7b3b2965d0.jpg",
    isHero: false,
    isStaffPick: false,
    staffPickType: "",
    cast: [
      { name: "Sibiraj", role: "Arun Kumar", avatarUrl: "https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=200&auto=format&fit=crop" },
      { name: "Vinay", role: "Psycho", avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop" }
    ],
    reviews: []
  },
  {
    id: "dhuruvangal-pathinaaru",
    title: "Dhuruvangal Pathinaaru",
    description: "A retired police officer recounts the case that cost him his career — a single night of violence that changed everything. Karthick Naren's debut is a brilliantly crafted minimalist thriller that keeps you guessing until the end.",
    rating: 8.1,
    criticScore: 8.0,
    audienceScore: 84,
    genre: "Tamil / Crime / Thriller / Mystery",
    releaseYear: 2016,
    runtime: "1h 45m",
    director: "Karthick Naren",
    writer: "Karthick Naren",
    studio: "Humble Motion Pictures",
    releaseDate: "December 22, 2016",
    language: "Tamil",
    tmdbId: 430543,
    posterUrl: "https://media.tamilmdb.com/i/movie/31/18/6077/175x245/585b2277af7d8.jpg",
    backdropUrl: "https://media.tamilmdb.com/i/movie/31/18/6077/175x245/585b2277af7d8.jpg",
    isHero: false,
    isStaffPick: false,
    staffPickType: "",
    cast: [
      { name: "Rahman", role: "Deepak", avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop" }
    ],
    reviews: []
  },
  {
    id: "thani-oruvan",
    title: "Thani Oruvan",
    description: "An IPS officer takes on a brilliant scientist who uses his genius to build a vast criminal empire. Mohan Raja's gripping cat-and-mouse thriller set new standards for commercial Tamil cinema.",
    rating: 8.1,
    criticScore: 7.9,
    audienceScore: 86,
    genre: "Tamil / Action / Crime / Thriller",
    releaseYear: 2015,
    runtime: "2h 36m",
    director: "Mohan Raja",
    writer: "Mohan Raja",
    studio: "AGS Entertainment",
    releaseDate: "August 28, 2015",
    language: "Tamil",
    tmdbId: 353569,
    posterUrl: "https://media.tamilmdb.com/i/movie/72/80/22193/175x245/55df61bcf18ec.jpg",
    backdropUrl: "https://media.tamilmdb.com/i/movie/72/80/22193/175x245/55df61bcf18ec.jpg",
    isHero: false,
    isStaffPick: false,
    staffPickType: "",
    cast: [
      { name: "Jayam Ravi", role: "DCP Vijay Kumar", avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200&auto=format&fit=crop" },
      { name: "Arvind Swamy", role: "Siddharth Abhimanyu", avatarUrl: "https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=200&auto=format&fit=crop" }
    ],
    reviews: []
  },
  {
    id: "viswasam",
    title: "Viswasam",
    description: "A powerful village chieftain goes to the city to reconnect with his estranged wife and daughter, unaware that a past enemy is plotting revenge. Siva's mass entertainer showcases Thala Ajith in full form.",
    rating: 7.3,
    criticScore: 6.9,
    audienceScore: 82,
    genre: "Tamil / Action / Drama",
    releaseYear: 2019,
    runtime: "2h 36m",
    director: "Siva",
    writer: "Siva",
    studio: "Sathya Jyothi Films",
    releaseDate: "January 10, 2019",
    language: "Tamil",
    tmdbId: 529995,
    posterUrl: "https://media.tamilmdb.com/i/movie/db/7f/6516/175x245/5c370fbcd55d6.jpg",
    backdropUrl: "https://media.tamilmdb.com/i/movie/db/7f/6516/175x245/5c370fbcd55d6.jpg",
    isHero: false,
    isStaffPick: false,
    staffPickType: "",
    cast: [
      { name: "Ajith Kumar", role: "Thookku Durai", avatarUrl: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=200&auto=format&fit=crop" },
      { name: "Nayanthara", role: "Niranjana", avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&auto=format&fit=crop" }
    ],
    reviews: []
  }
];

const malayalamMovies = [
  {
    id: "premam",
    title: "Premam",
    description: "A young man navigates through three phases of love — from teenage infatuation to mature romance — each shaping him into the person he becomes. Alphonse Puthren's coming-of-age classic redefined Malayalam cinema's portrayal of love.",
    rating: 8.4,
    criticScore: 8.2,
    audienceScore: 90,
    genre: "Malayalam / Romance / Comedy / Drama",
    releaseYear: 2015,
    runtime: "2h 36m",
    director: "Alphonse Puthren",
    writer: "Alphonse Puthren",
    studio: "Anwar Rasheed Entertainment",
    releaseDate: "May 29, 2015",
    language: "Malayalam",
    tmdbId: 337167,
    posterUrl: "https://image.tmdb.org/t/p/w500/iM6QHpWNp8X5WN1gyRqxkxKgaNj.jpg",
    backdropUrl: "https://image.tmdb.org/t/p/original/lLTTVzhTdbusN56FzQ17OoX5QjQ.jpg",
    isHero: false,
    isStaffPick: true,
    staffPickType: "grid",
    cast: [
      { name: "Nivin Pauly", role: "George", avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200&auto=format&fit=crop" },
      { name: "Sai Pallavi", role: "Malar", avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&auto=format&fit=crop" }
    ],
    reviews: []
  },
  {
    id: "bangalore-days",
    title: "Bangalore Days",
    description: "Three cousins move to Bangalore and navigate love, career, and self-discovery in the bustling city. Anjali Menon's warm-hearted ensemble drama captures the spirit of youth and friendship.",
    rating: 8.2,
    criticScore: 8.0,
    audienceScore: 87,
    genre: "Malayalam / Drama / Romance / Comedy",
    releaseYear: 2014,
    runtime: "2h 51m",
    director: "Anjali Menon",
    writer: "Anjali Menon",
    studio: "Anwar Rasheed Entertainment",
    releaseDate: "May 30, 2014",
    language: "Malayalam",
    tmdbId: 262304,
    posterUrl: "https://image.tmdb.org/t/p/w500/4u3WvI5QPTG0sFOs3NBy9O6fSVw.jpg",
    backdropUrl: "https://image.tmdb.org/t/p/original/12pDFEWLpFOU4ICkYa8b5Y9vFjD.jpg",
    isHero: false,
    isStaffPick: false,
    staffPickType: "",
    cast: [
      { name: "Nivin Pauly", role: "Kuttan", avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200&auto=format&fit=crop" },
      { name: "Dulquer Salmaan", role: "Arjun", avatarUrl: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=200&auto=format&fit=crop" },
      { name: "Fahadh Faasil", role: "Shiva", avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop" }
    ],
    reviews: []
  },
  {
    id: "kumbalangi-nights",
    title: "Kumbalangi Nights",
    description: "Four brothers in a coastal village navigate family bonds, love, and toxic masculinity. Madhu C. Narayanan's debut is a tender, deeply humane portrait of fractured relationships and healing.",
    rating: 8.3,
    criticScore: 8.5,
    audienceScore: 89,
    genre: "Malayalam / Drama / Family",
    releaseYear: 2019,
    runtime: "2h 15m",
    director: "Madhu C. Narayanan",
    writer: "Syam Pushkaran",
    studio: "Fahadh Faasil and Friends",
    releaseDate: "February 7, 2019",
    language: "Malayalam",
    tmdbId: 571369,
    posterUrl: "https://image.tmdb.org/t/p/w500/qrYAAjG0FLjQ3HT2ASjPq7RLlPM.jpg",
    backdropUrl: "https://image.tmdb.org/t/p/original/pCmCF2bZhLGqiH6W1a7KGHFBBTp.jpg",
    isHero: false,
    isStaffPick: false,
    staffPickType: "",
    cast: [
      { name: "Soubin Shahir", role: "Saji", avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200&auto=format&fit=crop" },
      { name: "Fahadh Faasil", role: "Shammi", avatarUrl: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=200&auto=format&fit=crop" }
    ],
    reviews: []
  },
  {
    id: "drishyam",
    title: "Drishyam",
    description: "A cable TV operator uses his obsession with movies to cover up an accidental crime committed by his family, leading to a tense cat-and-mouse game with the police. Jeethu Joseph's gripping thriller became a pan-Indian phenomenon.",
    rating: 8.5,
    criticScore: 8.4,
    audienceScore: 92,
    genre: "Malayalam / Crime / Thriller / Drama",
    releaseYear: 2013,
    runtime: "2h 40m",
    director: "Jeethu Joseph",
    writer: "Jeethu Joseph",
    studio: "Anwar Rasheed Entertainment",
    releaseDate: "December 19, 2013",
    language: "Malayalam",
    tmdbId: 240027,
    posterUrl: "https://image.tmdb.org/t/p/w500/nx1RjlQAVM8hVw6yuHUydX4YqBq.jpg",
    backdropUrl: "https://image.tmdb.org/t/p/original/keCJxNJQLe5BwDYqy9HLAnpFVpP.jpg",
    isHero: false,
    isStaffPick: true,
    staffPickType: "grid",
    cast: [
      { name: "Mohanlal", role: "Georgekutty", avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=200&auto=format&fit=crop" },
      { name: "Meena", role: "Rani", avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&auto=format&fit=crop" }
    ],
    reviews: []
  },
  {
    id: "lucifer",
    title: "Lucifer",
    description: "After the death of a veteran political leader, his adopted son rises to claim power, facing off against rivals and family members. Prithviraj's directorial debut is a stylish political action thriller with Mohanlal in top form.",
    rating: 7.8,
    criticScore: 7.5,
    audienceScore: 84,
    genre: "Malayalam / Action / Political / Thriller",
    releaseYear: 2019,
    runtime: "2h 55m",
    director: "Prithviraj Sukumaran",
    writer: "Murali Gopy",
    studio: "Aashirvad Cinemas",
    releaseDate: "March 28, 2019",
    language: "Malayalam",
    tmdbId: 522136,
    posterUrl: "https://image.tmdb.org/t/p/w500/tRLvj2FwsF5GgbYHE8KATLYNW2X.jpg",
    backdropUrl: "https://image.tmdb.org/t/p/original/2zKuv8Bg2JNpfYmNwp5NChFvPfZ.jpg",
    isHero: false,
    isStaffPick: false,
    staffPickType: "",
    cast: [
      { name: "Mohanlal", role: "Stephen Nedumpally", avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=200&auto=format&fit=crop" },
      { name: "Prithviraj Sukumaran", role: "Khureshi Ab'raam", avatarUrl: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=200&auto=format&fit=crop" }
    ],
    reviews: []
  },
  {
    id: "ustad-hotel",
    title: "Ustaad Hotel",
    description: "A young man from a wealthy family defies his father to pursue his passion for cooking, finding purpose and community in a small restaurant. Anwar Rasheed's heartwarming drama celebrates food, dreams, and family.",
    rating: 8.0,
    criticScore: 7.9,
    audienceScore: 86,
    genre: "Malayalam / Drama / Family",
    releaseYear: 2012,
    runtime: "2h 33m",
    director: "Anwar Rasheed",
    writer: "Anjali Menon",
    studio: "Anwar Rasheed Entertainment",
    releaseDate: "June 29, 2012",
    language: "Malayalam",
    tmdbId: 128696,
    posterUrl: "https://image.tmdb.org/t/p/w500/tGAPQ3QnYg9PNQ7uxFqR8xUMcFN.jpg",
    backdropUrl: "https://image.tmdb.org/t/p/original/vA618mQEehBqWiJG6pE5TVEHOYW.jpg",
    isHero: false,
    isStaffPick: false,
    staffPickType: "",
    cast: [
      { name: "Dulquer Salmaan", role: "Faizi", avatarUrl: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=200&auto=format&fit=crop" },
      { name: "Thilakan", role: "Kunhukadu", avatarUrl: "https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=200&auto=format&fit=crop" }
    ],
    reviews: []
  },
  {
    id: "maheshinte-prathikaram",
    title: "Maheshinte Prathikaram",
    description: "A photographer seeks revenge after being humiliated in a fight, only to discover that life has bigger plans for him. Dileesh Pothan's slice-of-life drama is a gently humorous tale of small-town pride and love.",
    rating: 8.1,
    criticScore: 8.0,
    audienceScore: 85,
    genre: "Malayalam / Comedy / Drama",
    releaseYear: 2016,
    runtime: "2h 00m",
    director: "Dileesh Pothan",
    writer: "Syam Pushkaran",
    studio: "Anwar Rasheed Entertainment",
    releaseDate: "February 5, 2016",
    language: "Malayalam",
    tmdbId: 385159,
    posterUrl: "https://image.tmdb.org/t/p/w500/6D3Ax6MYKFhvlYqKyIN4McY7TFI.jpg",
    backdropUrl: "https://image.tmdb.org/t/p/original/85vdsZEWJgGGy11dIVODQ5jnwBM.jpg",
    isHero: false,
    isStaffPick: false,
    staffPickType: "",
    cast: [
      { name: "Fahadh Faasil", role: "Mahesh Bhavana", avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop" },
      { name: "Anusree", role: "Jimcy", avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&auto=format&fit=crop" }
    ],
    reviews: []
  },
  {
    id: "kireedam",
    title: "Kireedam",
    description: "A young man forced to follow his father's path of violence grapples with a destiny he never chose. Sibi Malayil's tragic masterpiece features Mohanlal in one of the most powerful performances in Indian cinema.",
    rating: 8.6,
    criticScore: 8.7,
    audienceScore: 91,
    genre: "Malayalam / Drama / Action / Family",
    releaseYear: 1989,
    runtime: "2h 04m",
    director: "Sibi Malayil",
    writer: "A. K. Lohithadas",
    studio: "Kino Arts",
    releaseDate: "July 7, 1989",
    language: "Malayalam",
    tmdbId: 200014,
    posterUrl: "https://image.tmdb.org/t/p/w500/v9Ggk2eqCNfUFV06NkpqO5NkZRG.jpg",
    backdropUrl: "https://image.tmdb.org/t/p/original/fisxWnoQLsNnD6IuH01XePC6Gty.jpg",
    isHero: false,
    isStaffPick: false,
    staffPickType: "",
    cast: [
      { name: "Mohanlal", role: "Sethumadhavan", avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=200&auto=format&fit=crop" },
      { name: "Thilakan", role: "Achuthan Nair", avatarUrl: "https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=200&auto=format&fit=crop" }
    ],
    reviews: []
  },
  {
    id: "chithram",
    title: "Chithram",
    description: "A simpleton pretends to be his friend's wife's father, triggering a chain of hilarious and dramatic events. Priyadarshan's timeless comedy-drama remains one of Malayalam cinema's most beloved films.",
    rating: 8.3,
    criticScore: 8.1,
    audienceScore: 88,
    genre: "Malayalam / Comedy / Drama",
    releaseYear: 1988,
    runtime: "2h 30m",
    director: "Priyadarshan",
    writer: "Priyadarshan",
    studio: "Surya Cine Arts",
    releaseDate: "November 10, 1988",
    language: "Malayalam",
    tmdbId: 302285,
    posterUrl: "https://image.tmdb.org/t/p/w500/X0qlGqyImUDubFpVdohVP86eF1.jpg",
    backdropUrl: "https://image.tmdb.org/t/p/original/dqVYykot9NEOmjy2nWFqVq6Qb5n.jpg",
    isHero: false,
    isStaffPick: false,
    staffPickType: "",
    cast: [
      { name: "Mohanlal", role: "Pillai / Viswanathan", avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=200&auto=format&fit=crop" },
      { name: "Nadhiya", role: "Kalyani", avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&auto=format&fit=crop" }
    ],
    reviews: []
  },
  {
    id: "godfather",
    title: "Godfather",
    description: "Two brothers are mistaken for powerful gangsters when they arrive in a village to sell a property, leading to a comedic clash with real underworld figures. Priyadarshan's comedy classic featuring an ensemble cast at their peak.",
    rating: 8.1,
    criticScore: 7.9,
    audienceScore: 86,
    genre: "Malayalam / Comedy / Drama",
    releaseYear: 1991,
    runtime: "2h 27m",
    director: "Siddique-Lal",
    writer: "Siddique-Lal",
    studio: "Dreamland Productions",
    releaseDate: "April 14, 1991",
    language: "Malayalam",
    tmdbId: 302286,
    posterUrl: "https://image.tmdb.org/t/p/w500/vsJeqrQWYFcG4ldXCAqI5hr7EuN.jpg",
    backdropUrl: "https://image.tmdb.org/t/p/original/pRMxrftjT0o7ljD4JbBq3vBZMrW.jpg",
    isHero: false,
    isStaffPick: false,
    staffPickType: "",
    cast: [
      { name: "Mukesh", role: "Anjooran", avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200&auto=format&fit=crop" },
      { name: "Mohanlal", role: "Karikkamuri Shanmugham", avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=200&auto=format&fit=crop" }
    ],
    reviews: []
  },
  {
    id: "spadikam",
    title: "Spadikam",
    description: "A rebellious son clashes with his authoritarian father who wanted him to be a professor, leading to a life of crime. Bhadran's action drama features Mohanlal in a career-defining role as the fiery Thomas Chacko.",
    rating: 8.0,
    criticScore: 7.8,
    audienceScore: 85,
    genre: "Malayalam / Action / Drama",
    releaseYear: 1995,
    runtime: "2h 38m",
    director: "Bhadran",
    writer: "Bhadran",
    studio: "Murali Krishna Films",
    releaseDate: "May 5, 1995",
    language: "Malayalam",
    tmdbId: 302293,
    posterUrl: "https://image.tmdb.org/t/p/w500/x94p4tYqE7hM3nNW8qQ2sSEChYH.jpg",
    backdropUrl: "https://image.tmdb.org/t/p/original/1mylOYZuxElxYRWCgng84SgdVKd.jpg",
    isHero: false,
    isStaffPick: false,
    staffPickType: "",
    cast: [
      { name: "Mohanlal", role: "Thomas Chacko / Aadu Thoma", avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=200&auto=format&fit=crop" },
      { name: "Urvashi", role: "Meenakshi", avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&auto=format&fit=crop" }
    ],
    reviews: []
  },
  {
    id: "thondimuthalum-driksakshiyum",
    title: "Thondimuthalum Driksakshiyum",
    description: "A newlywed couple and a thief are brought together at a police station after a stolen chain incident, unfolding a tense yet darkly humorous night. Dileesh Pothan's minimalist gem is a masterclass in storytelling.",
    rating: 8.0,
    criticScore: 8.1,
    audienceScore: 84,
    genre: "Malayalam / Crime / Drama / Comedy",
    releaseYear: 2017,
    runtime: "2h 07m",
    director: "Dileesh Pothan",
    writer: "Syam Pushkaran",
    studio: "Urvashi Theaters",
    releaseDate: "June 30, 2017",
    language: "Malayalam",
    tmdbId: 447674,
    posterUrl: "https://image.tmdb.org/t/p/w500/dT4JvA0t7VFAfdMxAiu8hCmgUW1.jpg",
    backdropUrl: "https://image.tmdb.org/t/p/original/pOWGt0e3VnQOZEjPbAXvjVhqNJC.jpg",
    isHero: false,
    isStaffPick: false,
    staffPickType: "",
    cast: [
      { name: "Fahadh Faasil", role: "Prasad", avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop" },
      { name: "Suraj Venjaramoodu", role: "Bharghavan", avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200&auto=format&fix=crop" }
    ],
    reviews: []
  },
  {
    id: "manichitrathazhu",
    title: "Manichitrathazhu",
    description: "A young couple moves into a creaky ancestral mansion where a vengeful spirit is rumored to haunt its halls. Fazil's psychological horror-thriller blends folklore, drama, and edge-of-the-seat suspense in an unforgettable experience.",
    rating: 8.5,
    criticScore: 8.6,
    audienceScore: 92,
    genre: "Malayalam / Horror / Thriller / Psychological",
    releaseYear: 1993,
    runtime: "2h 49m",
    director: "Fazil",
    writer: "Madhu Muttam",
    studio: "Swargachitra",
    releaseDate: "December 25, 1993",
    language: "Malayalam",
    tmdbId: 50637,
    posterUrl: "https://image.tmdb.org/t/p/w500/pOcWZg3E7OSYYRqQaSR40PnPYvz.jpg",
    backdropUrl: "https://image.tmdb.org/t/p/original/nB5xfZP73AsflbAZBgsLQxlnSYE.jpg",
    isHero: false,
    isStaffPick: false,
    staffPickType: "",
    cast: [
      { name: "Mohanlal", role: "Dr. Sunny Joseph", avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=200&auto=format&fit=crop" },
      { name: "Shobana", role: "Ganga / Nagavalli", avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&auto=format&fit=crop" },
      { name: "Suresh Gopi", role: "Nakulan", avatarUrl: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=200&auto=format&fit=crop" }
    ],
    reviews: []
  },
  {
    id: "angamaly-diaries",
    title: "Angamaly Diaries",
    description: "A raw, kinetic gangster saga set in the town of Angamaly, following a young man's rise through the local crime hierarchy. Lijo Jose Pellissery's electrifying debut is a stylistic tour de force of Malayalam cinema.",
    rating: 8.0,
    criticScore: 8.2,
    audienceScore: 83,
    genre: "Malayalam / Crime / Action / Drama",
    releaseYear: 2017,
    runtime: "2h 24m",
    director: "Lijo Jose Pellissery",
    writer: "Chemban Vinod Jose",
    studio: "Friday Film House",
    releaseDate: "March 3, 2017",
    language: "Malayalam",
    tmdbId: 440202,
    posterUrl: "https://image.tmdb.org/t/p/w500/pP2Vk3rDwe5BcH8B4K7xQA5cFnB.jpg",
    backdropUrl: "https://image.tmdb.org/t/p/original/ak2G3SlqWGhN68xMr12vEMd6P4M.jpg",
    isHero: false,
    isStaffPick: false,
    staffPickType: "",
    cast: [
      { name: "Antony Varghese", role: "Vincent", avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200&auto=format&fit=crop" },
      { name: "Chemban Vinod Jose", role: "Appootty", avatarUrl: "https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=200&auto=format&fit=crop" }
    ],
    reviews: []
  },
  {
    id: "kmk",
    title: "Kammatipaadam",
    description: "A man returns to his hometown and recounts the violent history of land mafia, caste oppression, and friendship spanning decades. Rajeev Ravi's gritty crime epic is an unflinching look at Kerala's urban underbelly.",
    rating: 8.0,
    criticScore: 7.9,
    audienceScore: 82,
    genre: "Malayalam / Crime / Drama",
    releaseYear: 2016,
    runtime: "2h 30m",
    director: "Rajeev Ravi",
    writer: "Rajeev Ravi",
    studio: "Carnival Cinemas",
    releaseDate: "May 27, 2016",
    language: "Malayalam",
    tmdbId: 393432,
    posterUrl: "https://image.tmdb.org/t/p/w500/6VH1MZnTixx2msM9Bf3bOAjOwdh.jpg",
    backdropUrl: "https://image.tmdb.org/t/p/original/qA9lFmBMBKKsrloYFv7ZzElgAef.jpg",
    isHero: false,
    isStaffPick: false,
    staffPickType: "",
    cast: [
      { name: "Dulquer Salmaan", role: "Krishnan", avatarUrl: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=200&auto=format&fit=crop" },
      { name: "Vinayakan", role: "Gangadharan", avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop" }
    ],
    reviews: []
  }
];

const writeJsonDb = (data) => {
  const tmpFile = DB_FILE + '.tmp';
  fs.writeFileSync(tmpFile, JSON.stringify(data, null, 2), 'utf-8');
  fs.renameSync(tmpFile, DB_FILE);
  _jsonDbCache = null;
};

let _jsonDbCache = null;

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
  const allSeedMovies = [...tamilPriorityMovies, ...malayalamMovies, ...initialMovies];
  if (_jsonDbCache) return _jsonDbCache;
  if (!fs.existsSync(DB_FILE)) {
    writeJsonDb({ movies: allSeedMovies, users: [], communityThreads: initialCommunityThreads });
  }
  try {
    const fileContent = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(fileContent);
    if (!parsed.users) parsed.users = [];
    if (!parsed.communityThreads) {
      parsed.communityThreads = initialCommunityThreads;
      writeJsonDb(parsed);
    }
    _jsonDbCache = parsed;
    return parsed;
  } catch (err) {
    console.error("Error reading JSON database, backing up and using fresh seed...", err);
    try {
      fs.renameSync(DB_FILE, DB_FILE + '.backup-' + Date.now());
    } catch (_) {}
    writeJsonDb({ movies: allSeedMovies, users: [], communityThreads: initialCommunityThreads });
    _jsonDbCache = { movies: allSeedMovies, users: [], communityThreads: initialCommunityThreads };
    return _jsonDbCache;
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
    titleLogoUrl: { type: String },
    tmdbId: { type: Number },
    isHero: { type: Boolean, default: false },
    isStaffPick: { type: Boolean, default: false },
    staffPickType: { type: String, default: "" },
    isUpcoming: { type: Boolean, default: false },
    createdAt: { type: String, default: () => new Date().toISOString() },
    views: { type: Number, default: 0 },
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
    otpExpiry: { type: Date },
    ottAlerts: [{ type: Object }],
    watchlist: [{ type: String }]
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
  const tmpFile = cacheFile + '.tmp';
  fs.writeFileSync(tmpFile, JSON.stringify(cache, null, 2), 'utf-8');
  fs.renameSync(tmpFile, cacheFile);
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
  const results = await Promise.allSettled(movies.map(m => cachedEnrichMovieWithTmdbImages(m)));
  return results.map((r, i) => r.status === 'fulfilled' ? r.value : applyLocalHdImageFallback(movies[i]));
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
    let connected = false;
    const MAX_ATTEMPTS = 3;
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      try {
        await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 15000 });
        connected = true;
        break;
      } catch (err) {
        console.warn(`MongoDB connection attempt ${attempt}/${MAX_ATTEMPTS} failed: ${err.message}`);
        if (attempt < MAX_ATTEMPTS) await new Promise(res => setTimeout(res, 2500 * attempt));
      }
    }

    if (connected) {
      console.log("Connected to MongoDB successfully.");
      useMongoDB = true;
      const count = await MovieModel.countDocuments();
      if (count === 0) {
        const jsonData = readJsonDb();
        const allSeedMovies = (jsonData.movies && jsonData.movies.length > 0)
          ? jsonData.movies
          : [...tamilPriorityMovies, ...malayalamMovies, ...initialMovies];
        const seededMovies = await cachedEnrichMoviesWithTmdbImages(allSeedMovies);
        await MovieModel.insertMany(seededMovies.map(ensureCreatedAt));
        console.log(`MongoDB seeded with ${seededMovies.length} movies from db.json.`);
      }
      if (CommunityThreadModel && await CommunityThreadModel.countDocuments() === 0) {
        await CommunityThreadModel.insertMany(readJsonDb().communityThreads || initialCommunityThreads);
      }
    } else {
      console.warn("WARNING: Failed to connect to MongoDB after all attempts. Falling back to local JSON file db.json. Movies added on this instance will NOT survive restarts/deploys. Set MONGO_URI to persist data.");
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

// A movie stays "upcoming" only until its release date arrives. Once the
// release date has passed (or is today), it is automatically treated as
// released so it moves out of Coming Soon and into New Releases.
const releaseHasPassed = (movie) => {
  if (!movie || !movie.releaseDate) return false;
  const release = new Date(movie.releaseDate);
  return !isNaN(release) && release <= new Date();
};

const markReleasedUpcoming = (movie) => {
  if (movie.isUpcoming && releaseHasPassed(movie)) movie.isUpcoming = false;
  return movie;
};

export const getMovies = async (query = {}) => {
  const { search, genre, sort, ottPlatform, language, yearFrom, yearTo, ratingMin, ratingMax } = query;

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
    if (language) {
      mongoQuery.language = { $regex: language, $options: 'i' };
    }
    if (yearFrom || yearTo) {
      mongoQuery.releaseYear = {};
      if (yearFrom) mongoQuery.releaseYear.$gte = parseInt(yearFrom);
      if (yearTo) mongoQuery.releaseYear.$lte = parseInt(yearTo);
    }
    if (ratingMin || ratingMax) {
      mongoQuery.rating = {};
      if (ratingMin) mongoQuery.rating.$gte = parseFloat(ratingMin);
      if (ratingMax) mongoQuery.rating.$lte = parseFloat(ratingMax);
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
    const plainMovies = movies.map(movie => movie.toObject());
    const toRelease = plainMovies.filter(m => m.isUpcoming && releaseHasPassed(m));
    if (toRelease.length > 0) {
      await MovieModel.updateMany(
        { id: { $in: toRelease.map(m => m.id) } },
        { $set: { isUpcoming: false } }
      ).catch(() => {});
    }
    return plainMovies.map(m => markReleasedUpcoming(applyLocalHdImageFallback(m)));
  } else {
    const data = readJsonDb();
    let movies = data.movies;
    
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

    if (language) {
      const langLower = language.toLowerCase();
      movies = movies.filter(m => m.language?.toLowerCase().includes(langLower));
    }

    if (yearFrom || yearTo) {
      movies = movies.filter(m => {
        const year = m.releaseYear || parseInt(m.releaseDate?.split('-')[0]);
        if (!year) return false;
        if (yearFrom && year < parseInt(yearFrom)) return false;
        if (yearTo && year > parseInt(yearTo)) return false;
        return true;
      });
    }

    if (ratingMin || ratingMax) {
      movies = movies.filter(m => {
        const r = m.rating || 0;
        if (ratingMin && r < parseFloat(ratingMin)) return false;
        if (ratingMax && r > parseFloat(ratingMax)) return false;
        return true;
      });
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

    let changed = false;
    movies.forEach(m => {
      if (m.isUpcoming && releaseHasPassed(m)) {
        m.isUpcoming = false;
        changed = true;
      }
    });
    if (changed) writeJsonDb(data);

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
    movie.views = (movie.views || 0) + 1;
    await movie.save().catch(() => {});
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
    data.movies[index].views = (data.movies[index].views || 0) + 1;
    const movie = data.movies[index];
    if (needsTmdbImageRefresh(movie) && movie.tmdbId) {
      const enriched = await cachedEnrichMovieWithTmdbImages(movie);
      data.movies[index] = enriched;
      writeJsonDb(data);
      return applyLocalHdImageFallback(enriched);
    }
    writeJsonDb(data);
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
  movie.rating = parseFloat(avg.toFixed(1));
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
    movie.rating = parseFloat(avg.toFixed(1));
    
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
    movie.rating = parseFloat(avg.toFixed(1));
    
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
    movie.rating = parseFloat(avg.toFixed(1));
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
    movie.rating = parseFloat(avg.toFixed(1));
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
    otpExpiry: null,
    ottAlerts: []
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
export const sendEmailViaResend = async (to, otp, type) => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return false;

  let subject, text, html;

  if (type === 'release') {
    subject = '📺 OTT Release Alert — ThiraiPedia';
    text = `A movie you subscribed to is now streaming! Check it out on ThiraiPedia.`;
    html = `<div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
      <h2 style="color: #fbbf24;">🎬 OTT Release Alert</h2>
      <p>A movie on your watchlist is now streaming!</p>
      <p style="background: #f0f0f0; padding: 12px 24px; text-align: center; border-radius: 8px;">
        Visit <a href="https://thiraipedia.com" style="color: #fbbf24; font-weight: bold;">ThiraiPedia</a> to check it out.
      </p>
      <hr>
      <p style="color: #666; font-size: 12px;">You received this because you subscribed to an OTT release alert.</p>
    </div>`;
  } else {
    subject = 'Your ThiraiPedia OTP Code';
    text = `Your OTP code is: ${otp}\n\nThis code expires in 5 minutes.\n\nIf you did not request this, please ignore this email.`;
    html = `<div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
      <h2>ThiraiPedia Email Verification</h2>
      <p>Your OTP code is:</p>
      <h1 style="letter-spacing: 8px; font-size: 32px; background: #f0f0f0; padding: 12px 24px; text-align: center; border-radius: 8px;">${otp}</h1>
      <p>This code expires in <strong>5 minutes</strong>.</p>
      <hr>
      <p style="color: #666; font-size: 12px;">If you did not request this, please ignore this email.</p>
    </div>`;
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: process.env.EMAIL_FROM || 'ThiraiPedia <onboarding@resend.dev>', to, subject, text, html })
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

// ─── OTT ALERTS ───

export const addOttAlert = async (username, alertData) => {
  const { movieId, movieTitle, platform, releaseDate } = alertData;
  if (!movieId || !platform || !releaseDate) {
    throw new Error("Movie ID, platform, and release date are required");
  }

  const alert = { movieId, movieTitle, platform, releaseDate, createdAt: new Date().toISOString() };

  if (useMongoDB) {
    const user = await UserModel.findOne({ username });
    if (!user) throw new Error("User not found");
    const existing = (user.ottAlerts || []).find(a => a.movieId === movieId);
    if (existing) throw new Error("Alert already exists for this movie");
    user.ottAlerts = [...(user.ottAlerts || []), alert];
    await user.save();
    return { message: "Alert created", ottAlerts: user.ottAlerts };
  }

  const data = readJsonDb();
  const idx = data.users.findIndex(u => u.username === username);
  if (idx === -1) throw new Error("User not found");
  if (!data.users[idx].ottAlerts) data.users[idx].ottAlerts = [];
  const existing = data.users[idx].ottAlerts.find(a => a.movieId === movieId);
  if (existing) throw new Error("Alert already exists for this movie");
  data.users[idx].ottAlerts.push(alert);
  writeJsonDb(data);
  return { message: "Alert created", ottAlerts: data.users[idx].ottAlerts };
};

export const removeOttAlert = async (username, movieId) => {
  if (useMongoDB) {
    const user = await UserModel.findOne({ username });
    if (!user) throw new Error("User not found");
    user.ottAlerts = (user.ottAlerts || []).filter(a => a.movieId !== movieId);
    await user.save();
    return { message: "Alert removed", ottAlerts: user.ottAlerts };
  }

  const data = readJsonDb();
  const idx = data.users.findIndex(u => u.username === username);
  if (idx === -1) throw new Error("User not found");
  data.users[idx].ottAlerts = (data.users[idx].ottAlerts || []).filter(a => a.movieId !== movieId);
  writeJsonDb(data);
  return { message: "Alert removed", ottAlerts: data.users[idx].ottAlerts };
};

export const getUserOttAlerts = async (username) => {
  if (useMongoDB) {
    const user = await UserModel.findOne({ username });
    if (!user) return [];
    return user.ottAlerts || [];
  }

  const data = readJsonDb();
  const user = data.users.find(u => u.username === username);
  return user?.ottAlerts || [];
};

// ─── WATCHLIST (server-synced) ───

const findUserByUsername = async (username) => {
  if (useMongoDB) {
    return await UserModel.findOne({ username });
  }
  const { users } = readJsonDb();
  return users.find(u => u.username === username);
};

const saveUser = async (user) => {
  if (useMongoDB) {
    await user.save();
    return;
  }
  const data = readJsonDb();
  const idx = data.users.findIndex(u => u.username === user.username);
  if (idx !== -1) data.users[idx] = user;
  writeJsonDb(data);
};

export const getUserWatchlist = async (username) => {
  const user = await findUserByUsername(username);
  if (!user) throw new Error("User not found");
  return Array.isArray(user.watchlist) ? user.watchlist : [];
};

export const setUserWatchlist = async (username, movieIds) => {
  const user = await findUserByUsername(username);
  if (!user) throw new Error("User not found");
  const clean = Array.isArray(movieIds) ? [...new Set(movieIds.filter(Boolean))] : [];
  if (useMongoDB) {
    user.watchlist = clean;
    await user.save();
  } else {
    user.watchlist = clean;
    await saveUser(user);
  }
  return { watchlist: clean };
};

export const addToWatchlist = async (username, movieId) => {
  if (!movieId) throw new Error("Movie ID is required");
  const user = await findUserByUsername(username);
  if (!user) throw new Error("User not found");
  const current = Array.isArray(user.watchlist) ? user.watchlist : [];
  if (!current.includes(movieId)) current.push(movieId);
  if (useMongoDB) {
    user.watchlist = current;
    await user.save();
  } else {
    user.watchlist = current;
    await saveUser(user);
  }
  return { watchlist: current };
};

export const removeFromWatchlist = async (username, movieId) => {
  const user = await findUserByUsername(username);
  if (!user) throw new Error("User not found");
  const current = (Array.isArray(user.watchlist) ? user.watchlist : []).filter(id => id !== movieId);
  if (useMongoDB) {
    user.watchlist = current;
    await user.save();
  } else {
    user.watchlist = current;
    await saveUser(user);
  }
  return { watchlist: current };
};

export const mergeWatchlist = async (username, movieIds) => {
  const user = await findUserByUsername(username);
  if (!user) throw new Error("User not found");
  const current = new Set(Array.isArray(user.watchlist) ? user.watchlist : []);
  (Array.isArray(movieIds) ? movieIds : []).forEach(id => id && current.add(id));
  const merged = [...current];
  if (useMongoDB) {
    user.watchlist = merged;
    await user.save();
  } else {
    user.watchlist = merged;
    await saveUser(user);
  }
  return { watchlist: merged };
};

// ─── GOOGLE LOGIN ───

export const loginWithGoogle = async (profile) => {
  const { email, name, picture } = profile;
  if (!email) throw new Error("Google account email is required");

  if (useMongoDB) {
    let user = await UserModel.findOne({ email });
    if (!user) {
      const username = await generateUniqueUsername(name || email.split('@')[0]);
      const salt = generateSalt();
      const passwordHash = crypto.randomBytes(32).toString('hex');
      const token = crypto.randomBytes(32).toString('hex');
      user = new UserModel({
        username,
        email,
        passwordHash,
        salt,
        role: 'Cinema Enthusiast',
        avatarUrl: picture || '',
        token,
        emailVerified: true,
        ottAlerts: [],
        watchlist: []
      });
      await user.save();
      return { username: user.username, email: user.email, role: user.role, avatarUrl: user.avatarUrl, bio: user.bio, token, isNew: true };
    }
    const token = crypto.randomBytes(32).toString('hex');
    user.token = token;
    if (picture && !user.avatarUrl) user.avatarUrl = picture;
    await user.save();
    return { username: user.username, email: user.email, role: user.role, avatarUrl: user.avatarUrl, bio: user.bio, token, isNew: false };
  }

  const data = readJsonDb();
  let user = data.users.find(u => u.email === email);
  if (!user) {
    const username = await generateUniqueUsername(name || email.split('@')[0]);
    const salt = generateSalt();
    const newUser = {
      username,
      email,
      passwordHash: crypto.randomBytes(32).toString('hex'),
      salt,
      role: 'Cinema Enthusiast',
      avatarUrl: picture || '',
      token: crypto.randomBytes(32).toString('hex'),
      emailVerified: true,
      ottAlerts: [],
      watchlist: []
    };
    data.users.push(newUser);
    writeJsonDb(data);
    return { username: newUser.username, email: newUser.email, role: newUser.role, avatarUrl: newUser.avatarUrl, bio: newUser.bio, token: newUser.token, isNew: true };
  }
  const token = crypto.randomBytes(32).toString('hex');
  user.token = token;
  if (picture && !user.avatarUrl) user.avatarUrl = picture;
  writeJsonDb(data);
  return { username: user.username, email: user.email, role: user.role, avatarUrl: user.avatarUrl, bio: user.bio, token, isNew: false };
};

const generateUniqueUsername = async (base) => {
  const slug = (base || 'user').toLowerCase().replace(/[^a-z0-9_]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '').slice(0, 20) || 'user';
  let candidate = slug;
  let counter = 1;
  while (await usernameExists(candidate)) {
    const suffix = counter.toString();
    candidate = slug.slice(0, 20 - suffix.length) + suffix;
    counter++;
  }
  return candidate;
};

const usernameExists = async (username) => {
  if (useMongoDB) {
    return Boolean(await UserModel.findOne({ username }));
  }
  const { users } = readJsonDb();
  return users.some(u => u.username.toLowerCase() === username.toLowerCase());
};

// Check all user alerts for movies releasing today and return list of users to notify
export const checkOttAlerts = async () => {
  const today = new Date().toISOString().split('T')[0];
  const notifications = [];

  if (useMongoDB) {
    const users = await UserModel.find({});
    for (const user of users) {
      const alerts = user.ottAlerts || [];
      const matched = alerts.filter(a => a.releaseDate === today);
      if (matched.length > 0) {
        notifications.push({ username: user.username, email: user.email, movies: matched });
      }
    }
    return notifications;
  }

  const { users } = readJsonDb();
  for (const user of users) {
    const alerts = user.ottAlerts || [];
    const matched = alerts.filter(a => a.releaseDate === today);
    if (matched.length > 0) {
      notifications.push({ username: user.username, email: user.email, movies: matched });
    }
  }
  return notifications;
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

// ─── CINE UPDATES (Reels) ───

let CineUpdateModel;
try {
  const cineUpdateSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    body: { type: String, required: true },
    category: { type: String, default: 'News' },
    movieName: { type: String, default: '' },
    imageUrl: { type: String, default: '' },
    videoUrl: { type: String, default: '' },
    timestamp: { type: String, default: 'Just now' },
    createdAt: { type: String, default: '' },
    likes: { type: Number, default: 0 },
    likedBy: [{ type: String }]
  });
  CineUpdateModel = mongoose.model('CineUpdate', cineUpdateSchema);
} catch (e) {}

const displayIso = (timestamp, now = Date.now()) => {
  const str = String(timestamp || '');
  let m;
  if (/just now/i.test(str)) return new Date(now - 5 * 60e3).toISOString();
  if ((m = str.match(/^(\d+)\s*m(?:in)?\s*ago$/i))) return new Date(now - parseInt(m[1], 10) * 60e3).toISOString();
  if ((m = str.match(/^(\d+)\s*h(?:rs?)?\s*ago$/i))) return new Date(now - parseInt(m[1], 10) * 36e5).toISOString();
  if ((m = str.match(/^(\d+)\s*d(?:ays?)?\s*ago$/i))) return new Date(now - parseInt(m[1], 10) * 864e5).toISOString();
  const d = new Date(str);
  if (!isNaN(d.getTime())) return d.toISOString();
  return new Date(now - 8 * 864e5).toISOString();
};

const withCreatedAt = (u, now = Date.now()) => {
  if (u.createdAt && !isNaN(new Date(u.createdAt).getTime())) return u;
  return { ...u, createdAt: displayIso(u.timestamp, now) };
};

const cineUpdateAge = (u, now = Date.now()) => {
  const iso = u.createdAt && !isNaN(new Date(u.createdAt).getTime()) ? u.createdAt : displayIso(u.timestamp, now);
  return Math.max(0, now - new Date(iso).getTime());
};

export const getCineUpdates = async () => {
  const now = Date.now();
  let updates;
  if (useMongoDB && CineUpdateModel) {
    const docs = await CineUpdateModel.find({});
    updates = docs.map(d => (typeof d.toObject === 'function' ? d.toObject() : d));
  } else {
    const data = readJsonDb();
    updates = data.cineUpdates || [];
    const enriched = updates.map(u => withCreatedAt(u, now));
    if (enriched.some((u, i) => u.createdAt !== updates[i].createdAt)) {
      data.cineUpdates = enriched;
      writeJsonDb(data);
    }
    updates = enriched;
  }
  return [...updates]
    .sort((a, b) => new Date(withCreatedAt(b, now).createdAt).getTime() - new Date(withCreatedAt(a, now).createdAt).getTime());
};

export const pruneOldCineUpdates = async (maxAgeDays = 7, maxCount = 40) => {
  const now = Date.now();
  const maxAgeMs = maxAgeDays * 864e5;
  let removed = 0;

  const removeOne = async (id) => {
    if (useMongoDB && CineUpdateModel) {
      const result = await CineUpdateModel.deleteOne({ id });
      removed += result.deletedCount || 0;
    } else {
      const data = readJsonDb();
      const idx = (data.cineUpdates || []).findIndex(u => u.id === id);
      if (idx > -1) { data.cineUpdates.splice(idx, 1); removed++; writeJsonDb(data); }
    }
  };

  const current = await getCineUpdates();
  for (const u of current.filter(x => cineUpdateAge(x, now) > maxAgeMs)) {
    await removeOne(u.id);
  }

  const fresh = await getCineUpdates();
  if (fresh.length > maxCount) {
    for (const u of fresh.slice(maxCount)) await removeOne(u.id);
  }
  return removed;
};

export const createCineUpdate = async (updateData, user) => {
  const cleanTitle = (updateData.title || '').trim();
  const cleanBody = (updateData.body || '').trim();
  if (!cleanTitle || !cleanBody) {
    throw new Error("Title and body are required");
  }

  const update = {
    id: 'cu-' + Date.now(),
    title: cleanTitle,
    body: cleanBody,
    category: updateData.category || 'News',
    movieName: updateData.movieName || '',
    imageUrl: updateData.imageUrl || '',
    videoUrl: updateData.videoUrl || '',
    timestamp: updateData.timestamp || 'Just now',
    createdAt: updateData.createdAt || new Date().toISOString(),
    likes: 0,
    likedBy: []
  };

  if (useMongoDB && CineUpdateModel) {
    const created = new CineUpdateModel(update);
    return await created.save();
  }
  const data = readJsonDb();
  if (!data.cineUpdates) data.cineUpdates = [];
  data.cineUpdates.unshift(update);
  writeJsonDb(data);
  return update;
};

export const updateCineUpdate = async (updateId, updateData) => {
  const cleanTitle = (updateData.title || '').trim();
  const cleanBody = (updateData.body || '').trim();
  if (!cleanTitle || !cleanBody) {
    throw new Error("Title and body are required");
  }

  if (useMongoDB && CineUpdateModel) {
    const result = await CineUpdateModel.findOneAndUpdate(
      { id: updateId },
      { $set: { title: cleanTitle, body: cleanBody, category: updateData.category || 'News', movieName: updateData.movieName || '', imageUrl: updateData.imageUrl || '', videoUrl: updateData.videoUrl || '' } },
      { new: true }
    );
    if (!result) throw new Error("Cine update not found");
    return result;
  }
  const data = readJsonDb();
  const idx = (data.cineUpdates || []).findIndex(u => u.id === updateId);
  if (idx === -1) throw new Error("Cine update not found");
  data.cineUpdates[idx] = { ...data.cineUpdates[idx], title: cleanTitle, body: cleanBody, category: updateData.category || 'News', movieName: updateData.movieName || '', imageUrl: updateData.imageUrl || '', videoUrl: updateData.videoUrl || '' };
  writeJsonDb(data);
  return data.cineUpdates[idx];
};

export const deleteCineUpdate = async (updateId) => {
  if (useMongoDB && CineUpdateModel) {
    const result = await CineUpdateModel.deleteOne({ id: updateId });
    return result.deletedCount > 0;
  }
  const data = readJsonDb();
  const idx = (data.cineUpdates || []).findIndex(u => u.id === updateId);
  if (idx === -1) return false;
  data.cineUpdates.splice(idx, 1);
  writeJsonDb(data);
  return true;
};

export const deleteAllCineUpdates = async () => {
  if (useMongoDB && CineUpdateModel) {
    const result = await CineUpdateModel.deleteMany({});
    return result.deletedCount;
  }
  const data = readJsonDb();
  const count = (data.cineUpdates || []).length;
  data.cineUpdates = [];
  writeJsonDb(data);
  return count;
};

export const toggleCineUpdateLike = async (updateId, username) => {
  if (useMongoDB && CineUpdateModel) {
    const update = await CineUpdateModel.findOne({ id: updateId });
    if (!update) return null;
    const idx = update.likedBy.indexOf(username);
    if (idx > -1) {
      update.likedBy.splice(idx, 1);
      update.likes = Math.max(0, update.likes - 1);
    } else {
      update.likedBy.push(username);
      update.likes = (update.likes || 0) + 1;
    }
    await update.save();
    return { likes: update.likes, likedBy: update.likedBy };
  }
  const data = readJsonDb();
  const update = (data.cineUpdates || []).find(u => u.id === updateId);
  if (!update) return null;
  const idx = update.likedBy.indexOf(username);
  if (idx > -1) {
    update.likedBy.splice(idx, 1);
    update.likes = Math.max(0, update.likes - 1);
  } else {
    update.likedBy.push(username);
    update.likes = (update.likes || 0) + 1;
  }
  writeJsonDb(data);
  return { likes: update.likes, likedBy: update.likedBy };
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

// ─── ANALYTICS (Admin) ───

export const getAnalytics = async () => {
  const movies = await getMovies();
  const users = await getUsers();
  const threads = await getCommunityThreads();

  const reviewCounts = {};
  const reviewLikes = {};
  let recentReviews = [];

  for (const movie of movies) {
    if (!movie.reviews) continue;
    for (const review of movie.reviews) {
      const u = review.user;
      if (u) {
        reviewCounts[u] = (reviewCounts[u] || 0) + 1;
        reviewLikes[u] = (reviewLikes[u] || 0) + (review.likes || 0);
      }
      recentReviews.push({ ...review, movieTitle: movie.title, movieId: movie.id, moviePoster: movie.posterUrl });
    }
  }

  recentReviews = recentReviews.sort((a, b) => {
    const ta = a.timestamp ? new Date(a.timestamp).getTime() : 0;
    const tb = b.timestamp ? new Date(b.timestamp).getTime() : 0;
    return tb - ta;
  }).slice(0, 10);

  const totalViews = movies.reduce((s, m) => s + (m.views || 0), 0);
  const totalLikes = movies.reduce((s, m) => s + (m.reviews || []).reduce((x, r) => x + (r.likes || 0), 0), 0);

  const topMoviesByViews = [...movies].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 8).map(m => ({
    id: m.id, title: m.title, posterUrl: m.posterUrl, releaseYear: m.releaseYear, views: m.views || 0, rating: m.rating || 0
  }));

  const topMoviesByReviews = [...movies].sort((a, b) => (b.reviews?.length || 0) - (a.reviews?.length || 0)).slice(0, 8).map(m => ({
    id: m.id, title: m.title, posterUrl: m.posterUrl, releaseYear: m.releaseYear, reviewCount: m.reviews?.length || 0, rating: m.rating || 0
  }));

  const topCritics = Object.keys(reviewCounts).map(username => {
    const u = users.find(x => x.username === username);
    return {
      username,
      role: u?.role || 'Reviewer',
      avatarUrl: u?.avatarUrl || '',
      reviewCount: reviewCounts[username],
      totalLikes: reviewLikes[username] || 0
    };
  }).sort((a, b) => b.reviewCount - a.reviewCount || b.totalLikes - a.totalLikes).slice(0, 8);

  return {
    totals: {
      movies: movies.length,
      users: users.length,
      reviews: Object.values(reviewCounts).reduce((s, n) => s + n, 0),
      likes: totalLikes,
      views: totalViews,
      threads: threads.length
    },
    topMoviesByViews,
    topMoviesByReviews,
    topCritics,
    recentReviews
  };
};
