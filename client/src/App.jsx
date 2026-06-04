import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate, useLocation, Link, ScrollRestoration } from 'react-router-dom';
import { 
  Play, Pause, Plus, Search, Star, User, Film,
  ThumbsUp, MessageSquare, X, ChevronLeft, ChevronRight,
  Edit3, Check, Info, Lock, Mail, Eye, EyeOff,
  Users, Send, Volume2, Maximize, List, Trash2,
  AlertTriangle, RefreshCw, Heart
} from 'lucide-react';
import { useToast } from './context/ToastContext.jsx'
import {
  fetchMovies,
  fetchMovieById,
  addMovieReview,
  registerUser,
  loginUser,
  fetchCurrentUser,
  fetchCommunityThreads,
  createCommunityThread,
  createCommunityReply,
  proxyImageUrl,
  fetchUserProfile,
  updateUserProfile,
  fetchPublicUsers,
  followUser,
  unfollowUser,
  getLists,
  createList,
  addMovieToList,
  removeMovieFromList,
  deleteList,
  fetchLeaderboard,
  curateMovie,
  fetchWatchProviders,
  deleteReview,
  toggleReviewLike,
  addReviewReply,
  fetchCineUpdates,
  toggleCineUpdateLike
} from './api';
import AdminPanel from './components/AdminPanel';
import Modal from './components/Modal';
import Footer from './components/Footer';
import MovieDetailsView from './components/MovieDetailsView';
import LegalPage from './components/LegalPage';
import ContactPage from './components/ContactPage';
import AboutPage from './components/AboutPage';
import ArticlesPage from './components/ArticlesPage';
import ArticleDetail from './components/ArticleDetail';
import AdsterraAd from './components/AdsterraAd';
import MovieLogo from './components/MovieLogo';
import ShareButton from './components/ShareButton';
import SpinWheel from './components/SpinWheel';
import QuizGame from './components/QuizGame';
import BlindFrame from './components/BlindFrame';
import MoodMatcher from './components/MoodMatcher';
import CineUpdates from './components/CineUpdates';
import WelcomePopup from './components/WelcomePopup';

const LANG_MAP = {
  'TA': 'TAMIL', 'TAMIL': 'TAMIL',
  'ML': 'MALAYALAM', 'MALAYALAM': 'MALAYALAM',
  'TE': 'TELUGU', 'TELUGU': 'TELUGU',
  'HI': 'HINDI', 'HINDI': 'HINDI',
  'KN': 'KANNADA', 'KANNADA': 'KANNADA',
  'EN': 'ENGLISH', 'ENGLISH': 'ENGLISH',
  'MR': 'MARATHI', 'MARATHI': 'MARATHI',
  'BN': 'BENGALI', 'BENGALI': 'BENGALI',
  'GU': 'GUJARATI', 'GUJARATI': 'GUJARATI',
};
const normalizeLang = (lang) => LANG_MAP[lang?.toUpperCase()] || lang?.toUpperCase();

const DEFAULT_AVATAR = 'data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 100 100%27%3E%3Crect width=%27100%27 height=%27100%27 rx=%2750%27 fill=%27%23e2e8f0%27/%3E%3Ccircle cx=%2750%27 cy=%2738%27 r=%2716%27 fill=%27%2394a3b8%27/%3E%3Cellipse cx=%2750%27 cy=%2780%27 rx=%2728%27 ry=%2722%27 fill=%27%2394a3b8%27/%3E%3C/svg%3E';
const PRE_ROLL_VIDEO_SRC = 'https://player.vimeo.com/video/1197439817?h=1ea764d599&autoplay=1&controls=0&title=0&byline=0&portrait=0&autopause=0'; // Pre-roll video/embed URL

export default function App() {
  // App Navigation & Router State
  const [activeView, setActiveView] = useState('home'); // 'home', 'movie-details', 'profile'
  const [selectedMovieId, setSelectedMovieId] = useState(null);
  
   // API Data State
   const [movies, setMovies] = useState([]);
   const [newReleases, setNewReleases] = useState([]);
   const [newReleasesPage, setNewReleasesPage] = useState([]);
   const [newReleasesPageLoading, setNewReleasesPageLoading] = useState(false);
   const [topRatedPage, setTopRatedPage] = useState([]);
   const [topRatedPageLoading, setTopRatedPageLoading] = useState(false);
   const [selectedMovie, setSelectedMovie] = useState(null);
   const [watchProviders, setWatchProviders] = useState([]);
   const [isLoading, setIsLoading] = useState(false);
   const [error, setError] = useState(null);
   const [lastError, setLastError] = useState(null);

  // Filter State (for the movie grid only)
  const [selectedGenre, setSelectedGenre] = useState('');
  const [sortOption, setSortOption] = useState('rating');
  const [selectedOttPlatform, setSelectedOttPlatform] = useState('');
  const [currentHeroIndex, setCurrentHeroIndex] = useState(0);
  const [showWelcome, setShowWelcome] = useState(false);
  const [releaseFilterMonth, setReleaseFilterMonth] = useState('');
  const [releaseFilterYear, setReleaseFilterYear] = useState('');

  // Real User Auth State
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authTab, setAuthTab] = useState('login'); // 'login' or 'register'
  const [authFormData, setAuthFormData] = useState({ username: '', email: '', password: '' });
  const [authError, setAuthError] = useState('');
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSessionVerified, setIsSessionVerified] = useState(false);

  const [selectedArticleId, setSelectedArticleId] = useState(null);

  // Mobile Menu State
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  const SectionLoader = ({ rows = 4, type = 'grid' }) => (
    <div className="fade-in">
      {type === 'grid' ? (
        <div className="skeleton-grid">
          {Array.from({ length: rows * 3 }).map((_, i) => (
            <div key={i} className="skeleton-card">
              <div className="skeleton skeleton-poster" />
              <div className="skeleton skeleton-text medium" />
              <div className="skeleton skeleton-text short" />
            </div>
          ))}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} style={{ display: 'flex', gap: '1rem', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px' }}>
              <div className="skeleton" style={{ width: '60px', height: '60px', borderRadius: '50%', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div className="skeleton skeleton-text medium" />
                <div className="skeleton skeleton-text short" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const pageMeta = {
    home: { title: 'thiraipedia | Premium Film Critique & Reviews', desc: 'Discover in-depth movie reviews, ratings, and film critiques at thiraipedia. Track your watchlist, explore OTT releases, and join a community of cinema lovers.' },
    'new-releases': { title: 'New Releases — thiraipedia', desc: 'Browse the latest movie releases on thiraipedia. Filter by month and year to find newly released films with ratings and reviews.' },
    'tamil-cinema': { title: 'Tamil Cinema — thiraipedia', desc: 'Explore Tamil movie reviews, ratings, and recommendations on thiraipedia. Discover the best of Tamil cinema.' },
    'malayalam-cinema': { title: 'Malayalam Cinema — thiraipedia', desc: 'Explore Malayalam movie reviews, ratings, and recommendations on thiraipedia. Discover the best of Malayalam cinema.' },
    'top-rated': { title: 'Top Rated — thiraipedia', desc: 'View the highest-rated movies on thiraipedia. Every film rated 7 and above, ranked by critic score.' },
    watchlist: { title: 'My Watchlist — thiraipedia', desc: 'Manage your personal movie watchlist on thiraipedia. Save films to watch later and track your queue.' },
    'coming-soon': { title: 'Coming Soon — thiraipedia', desc: 'Discover upcoming movie releases and anticipated films on thiraipedia. Stay ahead of new cinema.' },
    actor: { title: 'Actor — thiraipedia', desc: 'Explore filmography and movies featuring your favourite actors on thiraipedia.' },
    profile: { title: 'My Profile — thiraipedia', desc: 'View your thiraipedia profile, reviews, watchlist, and critic stats. Manage your account and followers.' },
    leaderboard: { title: 'Top Critics — thiraipedia', desc: 'See the most active film critics and top reviewers on thiraipedia. Ranked by reviews and ratings.' },
    lists: { title: 'Lists — thiraipedia', desc: 'Browse curated movie lists created by the thiraipedia community. Discover themed film collections.' },
    'list-detail': { title: 'List — thiraipedia', desc: 'View a curated movie collection on thiraipedia. Explore films handpicked by critics and community members.' },
    'ott-calendar': { title: 'OTT Calendar — thiraipedia', desc: 'Track upcoming OTT releases and streaming premieres on thiraipedia. Never miss a digital release.' },
    community: { title: 'Community Forum — thiraipedia', desc: 'Join film discussions, share recommendations, and connect with fellow cinema enthusiasts on thiraipedia.' },
    admin: { title: 'Admin Panel — thiraipedia', desc: 'Manage movies, reviews, and site content on the thiraipedia admin control panel.' },
    'movie-details': { title: 'Movie Details — thiraipedia', desc: 'Read in-depth movie reviews, watch trailers, and see ratings on thiraipedia. Detailed film critique and analysis.' },
    privacy: { title: 'Privacy Policy — thiraipedia', desc: 'Read the thiraipedia privacy policy. Learn how we handle your data and protect your privacy.' },
    terms: { title: 'Terms of Service — thiraipedia', desc: 'Read the thiraipedia terms of service. Guidelines for using our film critique platform.' },
    contact: { title: 'Contact Us — thiraipedia', desc: 'Get in touch with the thiraipedia team. Send us your feedback, suggestions, or inquiries.' },
    about: { title: 'About Us — thiraipedia', desc: 'Learn about thiraipedia — a premium movie review and film critique platform for passionate cinema lovers.' },
    articles: { title: 'Articles & Critique — thiraipedia', desc: 'Read original film criticism articles, cinema trends, and review guides from the thiraipedia editorial team.' },
    'article-detail': { title: 'Article — thiraipedia', desc: 'Read in-depth film analysis and critique articles on thiraipedia.' },
    quiz: { title: 'Movie Quiz — thiraipedia', desc: 'Test your Tamil cinema knowledge with fun movie trivia quizzes on thiraipedia.' },
    wheel: { title: 'Card Flix — thiraipedia', desc: 'Flip cards to discover your next movie to watch with Card Flix.' },
    'blind-frame': { title: 'Blind Frame — thiraipedia', desc: 'Guess the movie from a blurry poster in Blind Frame on thiraipedia.' },
    'mood-matcher': { title: 'Mood Matcher — thiraipedia', desc: 'Pick your mood and get the perfect movie match on thiraipedia.' },
    'cine-updates': { title: 'Cine Updates — thiraipedia', desc: 'Latest movie news, rumors, and updates in a pulse-style feed on thiraipedia.' },
  };

  const updateMeta = (meta) => {
    const desc = meta?.desc || 'Discover in-depth movie reviews, ratings, and film critiques at thiraipedia. Track your watchlist, explore OTT releases, and join a community of cinema lovers.';
    let el = document.querySelector('meta[name="description"]');
    if (el) el.setAttribute('content', desc);
    el = document.querySelector('meta[property="og:description"]');
    if (el) el.setAttribute('content', desc);
    el = document.querySelector('meta[name="twitter:description"]');
    if (el) el.setAttribute('content', desc);
    const ogUrl = document.querySelector('meta[property="og:url"]');
    if (ogUrl) ogUrl.setAttribute('content', window.location.href);
  };

  useEffect(() => {
    const meta = pageMeta[activeView] || pageMeta.home;
    document.title = meta.title;
    updateMeta(meta);
  }, [activeView]);

  useEffect(() => {
    if (activeView === 'movie-details' && selectedMovie) {
      const title = `${selectedMovie.title} — Movie Review & Rating | thiraipedia`;
      const desc = selectedMovie.description
        ? selectedMovie.description.slice(0, 160)
        : `Read reviews, watch the trailer, and see ratings for ${selectedMovie.title} on thiraipedia.`;
      document.title = title;
      updateMeta({ desc });
    }
  }, [activeView, selectedMovie]);

  // Welcome popup on first visit
  useEffect(() => {
    if (!localStorage.getItem('welcomeSeen')) {
      setShowWelcome(true);
    }
  }, []);

  // Search Overlay State (IMDb-style, decoupled from grid)
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchInputRef = useRef(null);
  const searchOverlayRef = useRef(null);

  // Phase 8 Community Forum State
  const [communityThreads, setCommunityThreads] = useState([]);
  const [isCommunityLoading, setIsCommunityLoading] = useState(false);
  const [communityError, setCommunityError] = useState('');
  const [newThreadData, setNewThreadData] = useState({
    title: '',
    body: '',
    tag: 'General'
  });
  const [replyDrafts, setReplyDrafts] = useState({});

    const showToast = useToast().showToast;
    const LOAD_STEP = 20;
    const [visibleCount, setVisibleCount] = useState(LOAD_STEP);

    // Modals Toggles
    const [isWriteReviewOpen, setIsWriteReviewOpen] = useState(false);
     const [showTrailer, setShowTrailer] = useState(false);
     const [showCurateModal, setShowCurateModal] = useState(false);
     const [curationMovies, setCurationMovies] = useState([]);
    const [trailerPreRoll, setTrailerPreRoll] = useState(false);
    const [trailerPlayer, setTrailerPlayer] = useState({ playing: false, currentTime: 0, duration: 0, volume: 100 });
   const [trailerAutoplayPreference, setTrailerAutoplayPreference] = useState(() => {
     // Load from localStorage or default to true (autoplay on)
     const saved = localStorage.getItem('mc_trailer_autoplay');
     return saved !== null ? saved === 'true' : true;
   });
   
   // Save preference to localStorage whenever it changes
   useEffect(() => {
     localStorage.setItem('mc_trailer_autoplay', trailerAutoplayPreference);
   }, [trailerAutoplayPreference]);
    const playerRef = useRef(null);
const playerContainerRef = useRef(null);
const progressIntervalRef = useRef(null);
const preRollVideoRef = useRef(null);
const preRollTimerRef = useRef(null);
    const heroRef = useRef(null);
    const isHoveringRef = useRef(false);
    const touchStartX = useRef(0);
    const newReleasesScrollRef = useRef(null);
    const tamilScrollRef = useRef(null);
    const malayalamScrollRef = useRef(null);
    const topRatedScrollRef = useRef(null);
    const cineReelsScrollRef = useRef(null);


  const getYoutubeVideoId = (url) => {
    if (!url) return null;
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
      /^([a-zA-Z0-9_-]{11})$/
    ];
    for (const p of patterns) {
      const m = url.match(p);
      if (m) return m[1];
    }
    return null;
  };

  const formatTime = (s) => {
    if (!s || isNaN(s)) return '0:00';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  // Initialize YouTube player when modal opens and pre-roll is done
  useEffect(() => {
    if (!showTrailer || trailerPreRoll || !selectedMovie?.trailerUrl) return;
    const videoId = getYoutubeVideoId(selectedMovie.trailerUrl);
    if (!videoId) return;

    let player = playerRef.current;
    if (player && typeof player.destroy === 'function') {
      player.destroy();
      playerRef.current = null;
    }

    const initPlayer = () => {
      if (!window.YT || !window.YT.Player) {
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        const first = document.getElementsByTagName('script')[0];
        first.parentNode.insertBefore(tag, first);
        window.onYouTubeIframeAPIReady = () => {
          createPlayer();
        };
      } else {
        createPlayer();
      }
    };

    const createPlayer = () => {
      const container = playerContainerRef.current;
      if (!container) return;
      container.innerHTML = '<div id="yt-player" style="position:absolute;top:0;left:0;width:100%;height:100%"></div>';
       playerRef.current = new window.YT.Player('yt-player', {
         videoId,
         playerVars: {
           controls: 0,
           modestbranding: 1,
           rel: 0,
           showinfo: 0,
           iv_load_policy: 3,
           autoplay: trailerAutoplayPreference ? 1 : 0,
           playsinline: 1
         },
        events: {
          onReady: (e) => {
            setTrailerPlayer(prev => ({ ...prev, duration: e.target.getDuration(), playing: true }));
            e.target.playVideo();
            if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
            progressIntervalRef.current = setInterval(() => {
              if (e.target && e.target.getCurrentTime) {
                setTrailerPlayer(prev => ({ ...prev, currentTime: e.target.getCurrentTime() }));
              }
            }, 250);
          },
          onStateChange: (e) => {
            setTrailerPlayer(prev => ({ ...prev, playing: e.data === window.YT.PlayerState.PLAYING, currentTime: e.target.getCurrentTime() }));
            if (e.data === window.YT.PlayerState.ENDED) {
              if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
            }
          }
        }
      });
    };

    initPlayer();

    return () => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      if (playerRef.current && typeof playerRef.current.destroy === 'function') {
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
  }, [showTrailer, trailerPreRoll, selectedMovie?.trailerUrl]);

  // Detect Vimeo pre-roll video ended via Vimeo Player API
  useEffect(() => {
    if (!showTrailer || !trailerPreRoll || !PRE_ROLL_VIDEO_SRC?.includes('player.vimeo.com')) return;
    let vimeoPlayer = null;
    const script = document.createElement('script');
    script.src = 'https://player.vimeo.com/api/player.js';
    script.onload = () => {
      const iframe = document.querySelector('.preroll-overlay iframe');
      if (iframe && window.Vimeo) {
        vimeoPlayer = new window.Vimeo.Player(iframe);
        vimeoPlayer.on('ended', () => setTrailerPreRoll(false));
      }
    };
    document.body.appendChild(script);
    return () => {
      if (vimeoPlayer) vimeoPlayer.off('ended');
      if (script.parentNode) script.parentNode.removeChild(script);
    };
  }, [showTrailer, trailerPreRoll]);

  const togglePlay = () => {
    const p = playerRef.current;
    if (!p || !p.getPlayerState) return;
    if (p.getPlayerState() === window.YT.PlayerState.PLAYING) {
      p.pauseVideo();
    } else {
      p.playVideo();
    }
  };

  const seekTo = (e) => {
    const p = playerRef.current;
    if (!p || !p.seekTo) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = x / rect.width;
    p.seekTo(pct * trailerPlayer.duration);
  };

  const setVolume = (e) => {
    const p = playerRef.current;
    if (!p || !p.setVolume) return;
    const v = parseInt(e.target.value);
    p.setVolume(v);
    setTrailerPlayer(prev => ({ ...prev, volume: v }));
  };

  const toggleFullscreen = () => {
    const el = playerContainerRef.current;
    if (!el) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      el.requestFullscreen();
    }
  };

  // Local Watchlist State (Persisted in LocalStorage)
  const [watchlist, setWatchlist] = useState(() => {
    const saved = localStorage.getItem('mc_watchlist');
    return saved ? JSON.parse(saved) : ['dune-part-two', 'the-batman'];
  });

  // User Profile Custom Info (Simulated Login)
  const [userProfile] = useState({
    name: "Julian Vane",
    role: "Gold Critic",
    avatarUrl: DEFAULT_AVATAR,
    bio: "Searching for the perfect frame in a world of digital noise.",
    followers: "3.8k",
    accuracy: "92%",
    listsCount: 12
  });

  const [profileData, setProfileData] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [editingProfile, setEditingProfile] = useState(false);
  const [editBio, setEditBio] = useState('');
  const [editAvatar, setEditAvatar] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [profileLoadError, setProfileLoadError] = useState('');

  // Actor view state
  const [selectedActor, setSelectedActor] = useState(null);

  // User Lists state
  const [userLists, setUserLists] = useState([]);
  const [allLists, setAllLists] = useState([]);
  const [showCreateList, setShowCreateList] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [newListDesc, setNewListDesc] = useState('');
  const [selectedList, setSelectedList] = useState(null);
  const [showListMenu, setShowListMenu] = useState(false);

  // Leaderboard state
  const [leaderboard, setLeaderboard] = useState([]);
  const [cineUpdates, setCineUpdates] = useState([]);
  const [cineUpdatesLoading, setCineUpdatesLoading] = useState(false);
  const [showCineReels, setShowCineReels] = useState(false);
  const CATEGORY_COLORS = {
    'Breaking': '#ef4444',
    'Rumor': '#f59e0b',
    'News': '#3b82f6',
    'Update': '#10b981',
    'Box Office': '#8b5cf6',
    'Interview': '#ec4899',
    'Review': '#14b8a6',
  };
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [listsLoading, setListsLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [selectedListDetail, setSelectedListDetail] = useState(null);

  // Form State - Write Review
  const [newReviewData, setNewReviewData] = useState({
    user: userProfile.name,
    role: userProfile.role,
    rating: 8, // out of 10
    text: ''
  });

  // Sync Watchlist to LocalStorage
  useEffect(() => {
    localStorage.setItem('mc_watchlist', JSON.stringify(watchlist));
  }, [watchlist]);

  // Fetch profile data and all users when showing profile
  useEffect(() => {
    if (activeView !== 'profile') return;
    if (currentUser) {
      fetchUserProfile(currentUser.username)
        .then(data => setProfileData(data))
        .catch(() => setProfileLoadError('Failed to load profile'));
    }
    fetchPublicUsers()
      .then(data => setAllUsers(data))
      .catch(() => {});
  }, [activeView, currentUser]);

  const handleSaveProfile = async () => {
    try {
      const updated = await updateUserProfile({ bio: editBio, avatarUrl: editAvatar, email: editEmail });
      setProfileData(updated);
      setCurrentUser(prev => prev ? { ...prev, avatarUrl: updated.avatarUrl, email: updated.email } : prev);
      setEditingProfile(false);
    } catch (err) {
      setProfileLoadError(err.message);
    }
  };

  const handleFollow = async (username) => {
    try {
      await followUser(username);
      setAllUsers(prev => prev.map(u => u.username === username ? { ...u, followers: [...(u.followers || []), currentUser?.username] } : u));
      if (profileData) setProfileData(prev => ({ ...prev, following: [...(prev.following || []), username] }));
    } catch (err) {}
  };

  const handleUnfollow = async (username) => {
    try {
      await unfollowUser(username);
      setAllUsers(prev => prev.map(u => u.username === username ? { ...u, followers: (u.followers || []).filter(f => f !== currentUser?.username) } : u));
      if (profileData) setProfileData(prev => ({ ...prev, following: (prev.following || []).filter(f => f !== username) }));
    } catch (err) {}
  };

  // ─── ACTOR ───
  const handleViewActor = (actorName) => {
    setSelectedActor(actorName);
    navigateTo('actor');
  };

  // ─── LISTS ───
  const loadUserLists = async () => {
    try {
      const data = await getLists(currentUser?.username);
      setUserLists(data);
    } catch (e) {}
  };
  const loadAllLists = async () => {
    setListsLoading(true);
    try {
      const data = await getLists();
      setAllLists(data);
    } catch (e) {}
    setListsLoading(false);
  };
  const handleDeleteList = async (listId) => {
    if (!window.confirm('Delete this list?')) return;
    try {
      await deleteList(listId);
      loadUserLists();
      loadAllLists();
    } catch (e) { showToast(e.message, 'error'); }
  };
  const handleViewList = (list) => {
    setSelectedList(list);
    navigateTo('list-detail');
  };
  const handleCreateList = async () => {
    if (!newListName.trim() || !currentUser) return;
    try {
      await createList({ name: newListName.trim(), description: newListDesc.trim() });
      setNewListName('');
      setNewListDesc('');
      setShowCreateList(false);
      loadUserLists();
      loadAllLists();
    } catch (e) {}
  };

  // ─── CURATION ───
  const handleCurate = async (movieId, data) => {
    try {
      const updated = await curateMovie(movieId, data);
      setMovies(prev => prev.map(m => m.id === movieId ? { ...m, ...updated } : m));
    } catch (e) {}
  };

  // ─── LEADERBOARD ───
  const loadCineUpdates = async () => {
    setCineUpdatesLoading(true);
    try {
      const data = await fetchCineUpdates();
      setCineUpdates(data);
    } catch (e) {
      console.error('Failed to load cine updates:', e);
    }
    setCineUpdatesLoading(false);
  };

  const handleCineUpdateLike = async (updateId) => {
    if (!currentUser) { setAuthTab('login'); setIsAuthModalOpen(true); return; }
    try {
      const result = await toggleCineUpdateLike(updateId);
      setCineUpdates(prev => prev.map(u => u.id === updateId ? { ...u, likes: result.likes, likedBy: result.likedBy } : u));
    } catch (e) {
      console.error('Failed to toggle like:', e);
    }
  };

  const handleCineUpdateShare = (item) => {
    if (navigator.share) {
      navigator.share({ title: item.title, text: item.body, url: window.location.href });
    } else {
      navigator.clipboard?.writeText(`${item.title} — ${item.body}`).then(() => showToast('Copied to clipboard!')).catch(() => {});
    }
  };

  const loadLeaderboard = async () => {
    setLeaderboardLoading(true);
    try {
      const data = await fetchLeaderboard();
      setLeaderboard(data);
    } catch (e) {}
    setLeaderboardLoading(false);
  };

  // Debounce + live search for overlay results
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    setIsSearching(true);
    const timer = setTimeout(async () => {
      try {
        const data = await fetchMovies({ search: searchQuery.trim() });
        setSearchResults(data);
      } catch (err) {
        console.error('Search failed:', err);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Close search overlay on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        searchOverlayRef.current &&
        !searchOverlayRef.current.contains(e.target) &&
        !e.target.closest('.search-trigger')
      ) {
        setIsSearchOpen(false);
      }
    };
    if (isSearchOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isSearchOpen]);

  // Focus search input when overlay opens
  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  // Handle search result click
  const handleSearchResultClick = (movieId) => {
    setIsSearchOpen(false);
    setSearchQuery('');
    setSearchResults([]);
    handleViewMovie(movieId);
  };

  // Toggle search overlay
  const toggleSearch = () => {
    setIsSearchOpen(prev => !prev);
    if (isSearchOpen) {
      setSearchQuery('');
      setSearchResults([]);
    }
  };

   // Fetch Movies on genre/sort changes (search is decoupled)
   const loadMoviesList = async () => {
     setIsLoading(true);
     try {
       const data = await fetchMovies({
         genre: selectedGenre,
         sort: sortOption,
         ottPlatform: selectedOttPlatform
       });
       setMovies(data);
       setError(null);
     } catch (err) {
       console.error('Error loading movies:', err);
       setError(err.message || 'Failed to load movies');
     } finally {
       setIsLoading(false);
     }
   };

  useEffect(() => {
    loadMoviesList();
  }, [selectedGenre, sortOption, selectedOttPlatform]);

  // Fetch new releases separately (most recent release dates first)
  const loadNewReleases = async () => {
    try {
      const data = await fetchMovies({ sort: 'release-desc' });
      setNewReleases(data.filter(m => !m.isUpcoming).slice(0, 15));
    } catch (err) {
      console.error('Failed to load new releases:', err);
    }
  };

  useEffect(() => {
    loadNewReleases();
  }, []);

  const loadCommunityThreads = useCallback(async () => {
    setIsCommunityLoading(true);
    setCommunityError('');
    try {
      const threads = await fetchCommunityThreads();
      setCommunityThreads(threads);
    } catch (err) {
      console.error(err);
      setCommunityError('Failed to load community discussions. Make sure backend is running!');
    } finally {
      setIsCommunityLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCommunityThreads();
  }, [loadCommunityThreads]);

  // Derive heroMovies — only explicitly marked as hero
  const heroMovies = movies.filter(m => m.isHero);

  const streamingMovies = movies.filter(m => m.ott?.platform);
  const tamilMovies = movies.filter(m => normalizeLang(m.language) === 'TAMIL');
  const malayalamMovies = movies.filter(m => normalizeLang(m.language) === 'MALAYALAM');
  const topRatedMovies = [...movies].filter(m => m.rating >= 7).sort((a, b) => b.rating - a.rating);
  const upcomingOttMovies = movies
    .filter(m => m.ott?.platform && m.ott?.releaseDate && new Date(m.ott.releaseDate) > new Date())
    .sort((a, b) => new Date(a.ott.releaseDate) - new Date(b.ott.releaseDate));

  // Reset index if out of range when list changes
  const heroTotalSlides = heroMovies.length + 1;
  useEffect(() => {
    if (currentHeroIndex >= heroTotalSlides && heroMovies.length > 0) {
      setCurrentHeroIndex(0);
    }
  }, [heroMovies.length, currentHeroIndex, heroTotalSlides]);

  // Hero touch swipe handlers
  const handleHeroTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleHeroTouchEnd = (e) => {
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      setCurrentHeroIndex(prev => diff > 0
        ? (prev + 1) % heroTotalSlides
        : (prev - 1 + heroTotalSlides) % heroTotalSlides
      );
    }
  };

  // Auto-play the hero carousel (rotate slides every 6.5 seconds)
  // Pauses when mouse hovers over the hero
  useEffect(() => {
    if (heroMovies.length <= 1) return;
    const interval = setInterval(() => {
      if (!isHoveringRef.current) {
        setCurrentHeroIndex(prev => (prev + 1) % heroTotalSlides);
      }
    }, 6500);
    return () => clearInterval(interval);
  }, [heroMovies.length, heroTotalSlides]);

  // Fetch detailed movie info when selected
  useEffect(() => {
    if (selectedMovieId) {
      setSelectedMovie(null);
      const loadMovieDetails = async () => {
        try {
          const data = await fetchMovieById(selectedMovieId);
          setSelectedMovie(data);
        } catch (err) {
          console.error(err);
        }
      };
      loadMovieDetails();
    } else {
      setSelectedMovie(null);
    }
  }, [selectedMovieId]);

  // Fetch watch providers when selectedMovie changes
  useEffect(() => {
    if (selectedMovie?.tmdbId) {
      fetchWatchProviders(selectedMovie.tmdbId).then(providers => {
        setWatchProviders(providers);
      });
    } else {
      setWatchProviders([]);
    }
  }, [selectedMovie?.tmdbId]);

  // Fetch full new-releases list sorted descending by release date (latest first)
  useEffect(() => {
    if (activeView === 'new-releases') {
      const load = async () => {
        setNewReleasesPageLoading(true);
        try {
          const data = await fetchMovies({ sort: 'release-desc' });
          setNewReleasesPage(data.filter(m => !m.isUpcoming));
        } catch (err) {
          console.error('Failed to load new releases page:', err);
        } finally {
          setNewReleasesPageLoading(false);
        }
      };
      load();
    }
  }, [activeView]);

  // Fetch full top-rated list sorted by rating descending
  useEffect(() => {
    if (activeView === 'top-rated') {
      const load = async () => {
        setTopRatedPageLoading(true);
        try {
          const data = await fetchMovies({ sort: 'rating' });
          setTopRatedPage(data.filter(m => m.rating >= 7));
        } catch (err) {
          console.error('Failed to load top-rated page:', err);
        } finally {
          setTopRatedPageLoading(false);
        }
      };
      load();
    }
  }, [activeView]);

  // Verify auth session token on mount
  useEffect(() => {
    const token = localStorage.getItem('mc_token');
    if (token) {
      const verifySession = async () => {
        setIsSessionVerified(false);
        try {
          const user = await fetchCurrentUser(token);
          setCurrentUser(user);
        } catch (err) {
          console.warn("Session token expired, clearing...", err);
          localStorage.removeItem('mc_token');
        } finally {
          setIsSessionVerified(true);
        }
      };
      verifySession();
    } else {
      setIsSessionVerified(true);
    }
  }, []);

  const getRouteFromPath = (pathname) => {
    const path = pathname.replace(/\/+$/, '') || '/';
    if (path === '/') return { view: 'home' };
    if (path === '/admin') return { view: 'admin' };
    if (path === '/profile') return { view: 'profile' };
    if (path === '/community') return { view: 'community' };
    if (path === '/new-releases') return { view: 'new-releases' };
    if (path === '/tamil-cinema') return { view: 'tamil-cinema' };
    if (path === '/malayalam-cinema') return { view: 'malayalam-cinema' };
    if (path === '/top-rated') return { view: 'top-rated' };
    if (path === '/watchlist') return { view: 'watchlist' };
    if (path === '/coming-soon') return { view: 'coming-soon' };
    if (path === '/leaderboard') return { view: 'leaderboard' };
    if (path === '/lists') return { view: 'lists' };
    if (path === '/ott-calendar') return { view: 'ott-calendar' };
    if (path === '/privacy') return { view: 'privacy' };
    if (path === '/terms') return { view: 'terms' };
    if (path === '/contact') return { view: 'contact' };
    if (path === '/about') return { view: 'about' };
    if (path === '/articles') return { view: 'articles' };
    if (path === '/quiz') return { view: 'quiz' };
    if (path === '/wheel') return { view: 'wheel' };
    if (path === '/blind-frame') return { view: 'blind-frame' };
    if (path === '/mood-matcher') return { view: 'mood-matcher' };
    if (path === '/cine-updates') return { view: 'cine-updates' };
    if (path === '/actor') return { view: 'actor' };
    if (path === '/list-detail') return { view: 'list-detail' };
    const movieMatch = path.match(/^\/movie\/(.+)$/);
    if (movieMatch) return { view: 'movie-details', movieId: movieMatch[1] };
    const articleMatch = path.match(/^\/article\/(.+)$/);
    if (articleMatch) return { view: 'article-detail', movieId: articleMatch[1] };
    return { view: 'home' };
  };

  const pathForView = (view, movieId) => {
    if (view === 'admin') return '/admin';
    if (view === 'profile') return '/profile';
    if (view === 'community') return '/community';
    if (view === 'new-releases') return '/new-releases';
    if (view === 'tamil-cinema') return '/tamil-cinema';
    if (view === 'malayalam-cinema') return '/malayalam-cinema';
    if (view === 'top-rated') return '/top-rated';
    if (view === 'watchlist') return '/watchlist';
    if (view === 'coming-soon') return '/coming-soon';
    if (view === 'leaderboard') return '/leaderboard';
    if (view === 'lists') return '/lists';
    if (view === 'ott-calendar') return '/ott-calendar';
    if (view === 'privacy') return '/privacy';
    if (view === 'terms') return '/terms';
    if (view === 'contact') return '/contact';
    if (view === 'about') return '/about';
    if (view === 'articles') return '/articles';
    if (view === 'quiz') return '/quiz';
    if (view === 'wheel') return '/wheel';
    if (view === 'blind-frame') return '/blind-frame';
    if (view === 'mood-matcher') return '/mood-matcher';
    if (view === 'cine-updates') return '/cine-updates';
    if (view === 'actor') return '/actor';
    if (view === 'list-detail') return '/list-detail';
    if (view === 'article-detail' && movieId) return `/article/${movieId}`;
    if (view === 'movie-details' && movieId) return `/movie/${movieId}`;
    return '/';
  };

  const navigateTo = (view, options = {}) => {
    setVisibleCount(LOAD_STEP);
    const { movieId, articleId, replace = false } = options;
    const nextPath = pathForView(view, movieId || articleId);
    navigate(nextPath, { replace });
    window.scrollTo({ top: 0, behavior: 'instant' });
    setActiveView(view);
    if (view === 'movie-details') {
      setSelectedMovieId(movieId);
    } else if (view === 'article-detail') {
      setSelectedArticleId(articleId);
    } else {
      setSelectedMovieId(null);
      setSelectedArticleId(null);
    }
  };

  useEffect(() => {
    const path = location.pathname.replace(/\/+$/, '') || '/';
    const { view, movieId, articleId } = getRouteFromPath(path);
    setActiveView(view);
    if (view === 'cine-updates') {
      setShowCineReels(true);
      loadCineUpdates();
    } else {
      setShowCineReels(false);
    }
    if (view === 'home' && cineUpdates.length === 0) {
      loadCineUpdates();
    }
    if (view === 'movie-details') {
      setSelectedMovieId(movieId);
    } else if (view === 'article-detail') {
      setSelectedArticleId(articleId);
    } else {
      setSelectedMovieId(null);
      setSelectedArticleId(null);
    }
  }, [location.pathname]);

   // Keyboard shortcuts
   useEffect(() => {
     const handleKeyDown = (e) => {
       // Prevent shortcuts when typing in inputs/textareas
       const target = e.target;
       if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
         return;
       }

       // Focus search with /
       if (e.key === '/' && !e.shiftKey) {
         e.preventDefault();
         if (!isSearchOpen) {
           setIsSearchOpen(true);
           // Focus search input after a brief delay to ensure it's rendered
           setTimeout(() => {
             searchInputRef.current?.focus();
           }, 100);
         }
       }

        // Close mobile menu with Escape
        if (e.key === 'Escape' && isMobileMenuOpen) {
          setIsMobileMenuOpen(false);
        }

        // Close modals with Escape
        if (e.key === 'Escape') {
          if (isSearchOpen) {
           setIsSearchOpen(false);
           setSearchQuery('');
           setSearchResults([]);
         }
         if (isWriteReviewOpen) {
           setIsWriteReviewOpen(false);
         }
         if (showTrailer) {
           setShowTrailer(false);
         }
         if (showCurateModal) {
           setShowCurateModal(false);
         }
         if (isAuthModalOpen) {
           setIsAuthModalOpen(false);
         }
         if (editingProfile) {
           setEditingProfile(false);
         }
       }

       // Hero carousel navigation with arrow keys (only on home view)
       if (activeView === 'home' && heroMovies.length > 1) {
          if (e.key === 'ArrowLeft') {
            e.preventDefault();
            setCurrentHeroIndex(prev => (prev - 1 + heroTotalSlides) % heroTotalSlides);
          }
          if (e.key === 'ArrowRight') {
            e.preventDefault();
            setCurrentHeroIndex(prev => (prev + 1) % heroTotalSlides);
          }
        }
     };

     window.addEventListener('keydown', handleKeyDown);
     return () => window.removeEventListener('keydown', handleKeyDown);
   }, [isSearchOpen, isWriteReviewOpen, showTrailer, showCurateModal, isAuthModalOpen, editingProfile, activeView, heroMovies.length, heroTotalSlides, searchInputRef]);

   useEffect(() => {
     if (!isSessionVerified || activeView !== 'admin') return;
     if (!currentUser || currentUser.role !== 'admin') {
      navigateTo('home', { replace: true });
    }
  }, [activeView, currentUser, isSessionVerified]);

  // Scoped helper to switch auth tab and clear form inputs
  const setTabAndClearForm = (tab) => {
    setAuthTab(tab);
    setAuthError('');
    setIsAuthLoading(false);
    setShowPassword(false);
    setAuthFormData({ username: '', email: '', password: '' });
  };

  // Handle watch trailer with pre-roll ad/video
  const handleWatchTrailer = useCallback(() => {
    setShowTrailer(true);
    setTrailerPreRoll(true);
    const isEmbed = PRE_ROLL_VIDEO_SRC?.includes('player.vimeo.com');
    if (!isEmbed && preRollVideoRef.current && PRE_ROLL_VIDEO_SRC) {
      preRollVideoRef.current.currentTime = 0;
      preRollVideoRef.current.play().catch(() => {});
    }
    setTimeout(() => {
      if (preRollVideoRef.current && typeof preRollVideoRef.current.pause === 'function') {
        preRollVideoRef.current.pause();
        preRollVideoRef.current.currentTime = 0;
      }
      setTrailerPreRoll(false);
    }, 10000);
  }, []);

  // Handle Login and Register Submit
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    setIsAuthLoading(true);
    try {
      if (authTab === 'login') {
        const user = await loginUser(authFormData.username, authFormData.password);
        localStorage.setItem('mc_token', user.token);
        setCurrentUser(user);
        setIsAuthModalOpen(false);
        setAuthFormData({ username: '', email: '', password: '' });
        showToast('Login successful!');
      } else {
        const user = await registerUser(
          authFormData.username,
          authFormData.email,
          authFormData.password
        );
        localStorage.setItem('mc_token', user.token);
        setCurrentUser(user);
        setIsAuthModalOpen(false);
        setAuthFormData({ username: '', email: '', password: '' });
        showToast('Account created successfully!');
      }
    } catch (err) {
      setAuthError(err.message || 'Authentication failed. Please check credentials.');
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('mc_token');
    setCurrentUser(null);
    navigateTo('home');
  };

  // Toggle watchlist item
  const handleViewMovie = useCallback((movieId) => {
    navigateTo('movie-details', { movieId });
  }, [navigateTo]);

  const handleToggleWatchlist = useCallback((movieId, e) => {
    if (e) e.stopPropagation();
    setWatchlist(prev => 
      prev.includes(movieId) ? prev.filter(id => id !== movieId) : [...prev, movieId]
    );
  }, []);

  // Submit review form
  const handleCreateReviewSubmit = async (e) => {
    e.preventDefault();
    if (!newReviewData.text) return;

    const reviewPayload = {
      ...newReviewData,
      user: currentUser ? currentUser.username : "Anonymous",
      role: currentUser ? currentUser.role : "Cinema Enthusiast",
      avatarUrl: currentUser ? currentUser.avatarUrl : ""
    };

    try {
      const updatedMovie = await addMovieReview(selectedMovie.id, reviewPayload);
      setSelectedMovie(updatedMovie);
      setIsWriteReviewOpen(false);
      // Reset review form
      setNewReviewData({
        user: currentUser ? currentUser.username : "Anonymous",
        role: currentUser ? currentUser.role : "Cinema Enthusiast",
        rating: 8,
        text: ''
      });
      // Refresh global movie list to sync ratings
      loadMoviesList();
    } catch (err) {
      showToast(err.message || "Failed to post review", 'error');
    }
  };

// Upvote review comment with API persistence
const handleUpvoteReview = useCallback(async (reviewId) => {
  if (!currentUser) { setAuthTab('login'); setIsAuthModalOpen(true); return; }
  if (!selectedMovie) return;
  try {
    const result = await toggleReviewLike(selectedMovie.id, reviewId);
    setSelectedMovie({
      ...selectedMovie,
      reviews: selectedMovie.reviews.map(rev =>
        rev.id === reviewId ? { ...rev, likes: result.likes, likedBy: result.likedBy } : rev
      )
    });
  } catch (err) {
    console.error("Failed to toggle like:", err);
  }
}, [currentUser, selectedMovie]);

// Add reply to a review
const handleAddReviewReply = useCallback(async (reviewId, body) => {
  if (!currentUser) { setAuthTab('login'); setIsAuthModalOpen(true); return; }
  if (!selectedMovie) return;
  try {
    const result = await addReviewReply(selectedMovie.id, reviewId, body);
    setSelectedMovie({
      ...selectedMovie,
      reviews: selectedMovie.reviews.map(rev =>
        rev.id === reviewId ? { ...rev, replies: result.replies, comments: result.comments } : rev
      )
    });
  } catch (err) {
    console.error("Failed to add reply:", err);
  }
}, [currentUser, selectedMovie]);

// Delete review
const handleDeleteReview = useCallback(async (reviewId) => {
  if (!selectedMovie) return;
  if (!window.confirm("Delete this review?")) return;
  try {
    const updatedMovie = await deleteReview(selectedMovie.id, reviewId);
    setSelectedMovie(updatedMovie);
    loadMoviesList();
  } catch (err) {
    showToast(err.message || "Failed to delete review", 'error');
  }
}, [selectedMovie]);

  const handleCreateThreadSubmit = async (e) => {
    e.preventDefault();
    if (!newThreadData.title.trim() || !newThreadData.body.trim()) return;

    try {
      const createdThread = await createCommunityThread(newThreadData);
      setCommunityThreads(prev => [createdThread, ...prev]);
      setNewThreadData({ title: '', body: '', tag: 'General' });
    } catch (err) {
      showToast(err.message || "Failed to start discussion", 'error');
    }
  };

  const handleCreateReplySubmit = async (threadId, e) => {
    e.preventDefault();
    const body = replyDrafts[threadId]?.trim();
    if (!body) return;

    try {
      const updatedThread = await createCommunityReply(threadId, { body });
      setCommunityThreads(prev => prev.map(thread => thread.id === threadId ? updatedThread : thread));
      setReplyDrafts(prev => ({ ...prev, [threadId]: '' }));
    } catch (err) {
      showToast(err.message || "Failed to post reply", 'error');
    }
  };

  // Staff Picks categories
  const featuredStaffPick = movies.find(m => m.isStaffPick && m.staffPickType === 'featured') || movies.find(m => m.isStaffPick);
  const gridStaffPicks = movies.filter(m => m.isStaffPick && m.staffPickType === 'grid').slice(0, 3);

  // Profile recent reviews count helper
  const profileReviews = movies.flatMap(m => 
    m.reviews
      .filter(r => r.user === userProfile.name)
      .map(r => ({ ...r, movieTitle: m.title, moviePoster: m.posterUrl, movieId: m.id }))
  );

  // Filtered new releases by month/year
  const filteredReleases = useMemo(() => {
    if (!releaseFilterMonth && !releaseFilterYear) return newReleasesPage;
    return newReleasesPage.filter(m => {
      const parts = m.releaseDate?.split('-');
      if (releaseFilterYear && parts?.[0] !== releaseFilterYear) return false;
      if (releaseFilterMonth && parts?.[1] !== String(releaseFilterMonth).padStart(2, '0')) return false;
      return true;
    });
  }, [releaseFilterMonth, releaseFilterYear, newReleasesPage]);

  return (
    <div className="app-container">
      <ScrollRestoration />
      {/* NAVIGATION HEADER */}
      <div className="navbar-container">
        <nav className="navbar">
          <div className="logo" onClick={() => { navigateTo('home'); }}>
            Thirai<span>Pedia</span>
          </div>
          <div className={`nav-links ${isMobileMenuOpen ? 'nav-links--open' : ''}`}>
            <Link 
              className={`nav-link ${activeView === 'home' ? 'active' : ''}`}
              to="/"
              onClick={() => { setSelectedGenre(''); setSortOption('popular'); setIsMobileMenuOpen(false); }}
            >
              Movies
            </Link>

            <Link 
              className={`nav-link ${activeView === 'watchlist' ? 'active' : ''}`}
              to="/watchlist"
              onClick={() => { setIsMobileMenuOpen(false); }}
            >
              Watchlist
            </Link>

            <Link 
              className={`nav-link ${activeView === 'coming-soon' ? 'active' : ''}`}
              to="/coming-soon"
              onClick={() => { setIsMobileMenuOpen(false); }}
            >
              Coming Soon
            </Link>

            <Link 
              className={`nav-link ${activeView === 'leaderboard' ? 'active' : ''}`}
              to="/leaderboard"
              onClick={() => { loadLeaderboard(); setIsMobileMenuOpen(false); }}
            >
              Top Critics
            </Link>

            <Link
              className={`nav-link ${activeView === 'lists' ? 'active' : ''}`}
              to="/lists"
              onClick={() => { loadAllLists(); setIsMobileMenuOpen(false); }}
            >
              Lists
            </Link>

            <Link
              className={`nav-link ${activeView === 'ott-calendar' ? 'active' : ''}`}
              to="/ott-calendar"
              onClick={() => { setIsMobileMenuOpen(false); }}
            >
              OTT Calendar
            </Link>

            <Link
              className={`nav-link ${activeView === 'community' ? 'active' : ''}`}
              to="/community"
              onClick={() => { setIsMobileMenuOpen(false); }}
            >
              Community
            </Link>

            <button
              className={`nav-link cine-updates-link ${activeView === 'cine-updates' || showCineReels ? 'active' : ''}`}
              onClick={() => { loadCineUpdates(); setShowCineReels(true); setIsMobileMenuOpen(false); }}
              style={{ color: 'var(--color-accent-gold)', fontWeight: 600, cursor: 'pointer', background: 'none', border: 'none', font: 'inherit' }}
            >
              <span className="nav-pulse-dot" /> Cine Pulse
            </button>

            {currentUser && currentUser.role === 'admin' && (
              <Link 
                className={`nav-link ${activeView === 'admin' ? 'active' : ''}`}
                to="/admin"
                onClick={() => { setIsMobileMenuOpen(false); }}
                style={{ color: 'var(--color-accent-gold)', fontWeight: '600' }}
              >
                Admin Control
              </Link>
            )}
          </div>
          <div className="nav-actions">
            <button className="hamburger-btn" onClick={() => setIsMobileMenuOpen(prev => !prev)} aria-label="Menu">
              <List size={22} />
            </button>
            <button className="search-trigger" onClick={toggleSearch} aria-label="Search">
              <Search size={20} />
            </button>
            <button className="profile-avatar-btn" onClick={() => { if (!currentUser) { setAuthTab('login'); setIsAuthModalOpen(true); } else { navigateTo(activeView === 'profile' ? 'home' : 'profile'); setIsMobileMenuOpen(false); } }}>
              <img src={currentUser ? currentUser.avatarUrl : userProfile.avatarUrl} alt="Avatar" className="profile-avatar-circle" />
              {currentUser && <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginLeft: '0.5rem', fontWeight: 500 }} className="profile-nav-name">{currentUser.username}</span>}
            </button>
          </div>
        </nav>

        {/* IMDb-Style Expandable Search Overlay */}
        <div className={`search-overlay ${isSearchOpen ? 'search-overlay--open' : ''}`} ref={searchOverlayRef}>
          <div className="search-overlay-inner">
            <div className="search-overlay-input-wrapper">
              <Search size={18} className="search-overlay-icon" />
              <input
                ref={searchInputRef}
                type="text"
                className="search-overlay-input"
                placeholder="Search movies, directors, genres..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setIsSearchOpen(false);
                    setSearchQuery('');
                    setSearchResults([]);
                  }
                }}
              />
              {searchQuery && (
                <button className="search-overlay-clear" onClick={() => { setSearchQuery(''); searchInputRef.current?.focus(); }}>
                  <X size={16} />
                </button>
              )}
              <button className="search-overlay-close" onClick={() => { setIsSearchOpen(false); setSearchQuery(''); setSearchResults([]); }}>
                <X size={18} />
              </button>
            </div>

            {/* Live Search Results Dropdown */}
            {searchQuery.trim() && (
              <div className="search-results-dropdown">
                {isSearching ? (
                  <div className="search-results-list">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="search-result-item" style={{ cursor: 'default', pointerEvents: 'none' }}>
                        <div className="skeleton" style={{ width: '48px', height: '72px', borderRadius: '6px', flexShrink: 0 }} />
                        <div className="search-result-info">
                          <div className="skeleton skeleton-text medium" />
                          <div className="skeleton skeleton-text short" style={{ marginTop: '0.4rem' }} />
                        </div>
                      </div>
                    ))}
                  </div>
                 ) : searchResults.length === 0 ? (
                   <div className="search-results-empty">
                     <Film size={48} style={{ marginBottom: '1.5rem', opacity: 0.5 }} />
                     <p style={{ marginBottom: '0.75rem', fontSize: '1.1rem', fontWeight: 600 }}>
                       No results found for "{searchQuery}"
                     </p>
                     <p style={{ marginBottom: '1.5rem', fontSize: '0.95rem', lineHeight: '1.6', maxWidth: '400px' }}>
                       Try different keywords, check spelling, or browse by genre to discover movies.
                     </p>
                     <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                       <button onClick={() => { setSearchQuery(''); setSearchResults([]); }}
                         className="btn-outline" style={{ padding: '0.6rem 1.2rem', border: '1px solid var(--color-border)' }}>
                         Clear Search
                       </button>
                       <button onClick={() => { setSearchQuery(''); setSearchResults([]); navigateTo('home'); }}
                         className="btn-secondary" style={{ padding: '0.6rem 1.2rem' }}>
                         Browse All Movies
                       </button>
                     </div>
                   </div>
                 ) : (
                  <>
                    <div className="search-results-header">
                      <span>{searchResults.length} result{searchResults.length !== 1 ? 's' : ''} found</span>
                    </div>
                    <div className="search-results-list">
                      {searchResults.slice(0, 8).map(movie => (
                        <div
                          key={movie.id}
                          className="search-result-item"
                          onClick={() => handleSearchResultClick(movie.id)}
                        >
                           <img src={proxyImageUrl(movie.posterUrl, 'w300')} alt={movie.title} className="search-result-poster" loading="lazy" />
                          <div className="search-result-info">
                            <h4 className="search-result-title">{movie.title}</h4>
                            <div className="search-result-meta">
                              <span className="search-result-year">{movie.releaseYear}</span>
                              <span className="search-result-genre">{movie.genre}</span>
                            </div>
                            <div className="search-result-rating">
                              <Star size={12} fill="var(--color-accent-gold)" color="var(--color-accent-gold)" />
                              <span>{movie.rating.toFixed(1)}</span>
                            </div>
                          </div>
                          <ChevronRight size={16} className="search-result-arrow" />
                        </div>
                      ))}
                    </div>
                    {searchResults.length > 8 && (
                      <div className="search-results-footer">
                        <span>Showing 8 of {searchResults.length} results</span>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* RENDER ACTIVE VIEW */}
      <div className="fade-in" key={activeView + (selectedMovieId || selectedArticleId || '')}>
        {activeView === 'home' && (
          <div className="main-content">
            {/* HERO CAROUSEL */}
            {heroMovies.length > 0 && (
              <header className="hero"
                ref={heroRef}
                onMouseEnter={() => { isHoveringRef.current = true; }}
                onMouseLeave={() => { isHoveringRef.current = false; }}
                onTouchStart={handleHeroTouchStart}
                onTouchEnd={handleHeroTouchEnd}
              >
                {/* CINE PULSE PROMO SLIDE — always first */}
                <div
                  key="cine-reels-promo"
                  className={`hero-slide ${currentHeroIndex === 0 ? 'hero-slide--active' : ''}`}
                >
                  <div
                    className="hero-backdrop"
                    style={{
                      backgroundImage: cineUpdates[0]?.imageUrl
                        ? `url(${proxyImageUrl(cineUpdates[0].imageUrl, 'original')})`
                        : 'none',
                      filter: 'brightness(0.4) saturate(1.3)',
                    }}
                  />
                  <div className="hero-backdrop" style={{
                    background: 'linear-gradient(135deg, #0a0a1a 0%, #1a0a2e 50%, #0f0f23 100%)',
                    opacity: 0.7,
                  }} />
                  <div className="reels-promo-glow" />
                  <div className="hero-content">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
                      <span className="cine-reels-live-dot" />
                      <span style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--color-accent-gold)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        Cine Pulse
                      </span>
                    </div>
                    <h2 style={{
                      fontSize: 'clamp(1.5rem, 3.5vw, 2.4rem)', fontWeight: 800,
                      color: '#fff', margin: '0 0 0.5rem', lineHeight: 1.15,
                      maxWidth: '600px', fontFamily: 'var(--font-sans)'
                    }}>
                      Pulse<br />Movie Updates
                    </h2>
                    <p style={{
                      fontSize: 'clamp(0.85rem, 1.2vw, 1rem)', color: 'rgba(255,255,255,0.7)',
                      margin: '0 0 0.75rem', lineHeight: 1.6, maxWidth: '450px'
                    }}>
                      Swipe through the latest cinema news, rumors, and breaking updates — pulse style!
                    </p>
                    <div className="hero-actions">
                      <button className="btn-primary" onClick={() => { loadCineUpdates(); setShowCineReels(true); }}>
                        <Play size={16} fill="black" /> Watch Pulse
                      </button>
                    </div>
                  </div>
                </div>

                {heroMovies.map((movie, index) => {
                  const isActive = index + 1 === currentHeroIndex;
                  return (
                    <div 
                      key={movie.id} 
                      className={`hero-slide ${isActive ? 'hero-slide--active' : ''}`}
                    >
                      <div 
                        className="hero-backdrop" 
                        style={{ backgroundImage: isActive ? `url(${proxyImageUrl(movie.backdropUrl, 'original')})` : 'none' }}
                      />
                      <div className="hero-content">
                          <MovieLogo movie={movie} />
                          <div className="hero-rating-badge">
                            <span className="hero-tag-fav">FEATURED</span>
                            <Star size={12} fill="var(--color-accent-gold)" color="var(--color-accent-gold)" />
                            <span className="hero-rating-val">{movie.rating.toFixed(1)}</span>
                          </div>
                          <p className="hero-description">{movie.description}</p>
                          <div className="hero-actions">
                            <button className="btn-primary" onClick={() => handleViewMovie(movie.id)}>
                              <Play size={16} fill="black" /> Watch Trailer
                            </button>
                            <button 
                              className="btn-secondary" 
                              onClick={(e) => handleToggleWatchlist(movie.id, e)}
                            >
                              {watchlist.includes(movie.id) ? <Check size={16} /> : <Plus size={16} />}
                              {watchlist.includes(movie.id) ? 'My Watchlist' : 'My List'}
                            </button>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Left Arrow */}
                {heroMovies.length >= 1 && currentHeroIndex > 0 && (
                  <button 
                    className="hero-nav-btn hero-nav-btn--left"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentHeroIndex(prev => (prev - 1 + heroMovies.length + 1) % (heroMovies.length + 1));
                    }}
                    aria-label="Previous slide"
                  >
                    <ChevronLeft size={24} />
                  </button>
                )}

                {/* Right Arrow */}
                {heroMovies.length >= 1 && currentHeroIndex < heroMovies.length && (
                  <button 
                    className="hero-nav-btn hero-nav-btn--right"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentHeroIndex(prev => (prev + 1) % (heroMovies.length + 1));
                    }}
                    aria-label="Next slide"
                  >
                    <ChevronRight size={24} />
                  </button>
                )}

                {/* Indicator Dots */}
                {heroMovies.length >= 1 && (
                  <div className="hero-indicators">
                    {/* Cine Pulse promo dot — always first */}
                    <button
                      className={`hero-indicator-dot ${currentHeroIndex === 0 ? 'hero-indicator-dot--active' : ''}`}
                      style={{ background: currentHeroIndex === 0 ? 'var(--color-accent-gold)' : undefined }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentHeroIndex(0);
                      }}
                      aria-label="Go to Cine Pulse"
                    />
                    {heroMovies.map((_, index) => (
                      <button
                        key={index}
                        className={`hero-indicator-dot ${index + 1 === currentHeroIndex ? 'hero-indicator-dot--active' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setCurrentHeroIndex(index + 1);
                        }}
                        aria-label={`Go to slide ${index + 2}`}
                      />
                    ))}
                  </div>
                )}
              </header>
            )}

            {/* AD BANNER — below hero */}
            <section className="ad-section" style={{ marginTop: '2rem' }}>
              <div className="ad-container ad-banner">
                <span className="ad-label">Advertisement</span>
                <div className="ad-responsive-wrap">
                  <AdsterraAd zoneKey="a8788b6a4ad2d42dfd9ae792efaef14e" width={728} height={90} />
                </div>
              </div>
            </section>

            {/* NEW RELEASES — horizontal slider of recently added movies */}
            <section className="movies-section" style={{ marginTop: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1rem' }}>
                <div>
                  <p className="section-meta" style={{ marginBottom: '0.25rem' }}>Now Playing</p>
                  <h2 className="section-title" style={{ marginBottom: 0 }}>New Releases</h2>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <button className="hero-nav-btn" style={{ position: 'static', width: '32px', height: '32px', opacity: 1, transform: 'none' }}
                    onClick={() => newReleasesScrollRef.current?.scrollBy({ left: -400, behavior: 'smooth' })}
                    aria-label="Scroll left">
                    <ChevronLeft size={18} />
                  </button>
                  <button className="hero-nav-btn" style={{ position: 'static', width: '32px', height: '32px', opacity: 1, transform: 'none' }}
                    onClick={() => newReleasesScrollRef.current?.scrollBy({ left: 400, behavior: 'smooth' })}
                    aria-label="Scroll right">
                    <ChevronRight size={18} />
                  </button>
                  <button className="btn-secondary" style={{ fontSize: '0.8rem', padding: '0.4rem 1rem' }} onClick={() => { navigateTo('new-releases'); }}>
                    View All
                  </button>
                </div>
              </div>
              {newReleases.length === 0 ? (
                <div className="skeleton-horizontal">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="skeleton-card" style={{ flex: '0 0 160px' }}>
                      <div className="skeleton skeleton-poster" />
                      <div className="skeleton skeleton-text medium" />
                      <div className="skeleton skeleton-text short" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="movie-grid-horizontal" ref={newReleasesScrollRef}>
                  {newReleases.flatMap((movie, idx) => {
                    const items = [];
                    if (idx > 0 && idx % 6 === 0) {
                      items.push(
                        <div key={`ad-nr-${idx}`} className="ad-card-hscroll">
                          <span className="ad-label-sm">Ad</span>
                          <AdsterraAd zoneKey="6722103adf045d07f8b2009ba2196e96" width={300} height={250} />
                        </div>
                      );
                    }
                    items.push(
                      <div key={movie.id} className="movie-card-horizontal" onClick={() => handleViewMovie(movie.id)}>
                       <div className="movie-card-poster-wrapper">
                        <img src={proxyImageUrl(movie.posterUrl, 'w300')} alt={movie.title} className="movie-card-poster" loading="lazy" />
                         <div className="movie-card-rating">
                           <Star size={12} fill="var(--color-accent-gold)" color="var(--color-accent-gold)" />
                           <span>{movie.rating.toFixed(1)}</span>
                         </div>
                       </div>
                       <div className="movie-card-info">
                         <h3 className="movie-card-title">{movie.title}</h3>
                         <div className="movie-card-genre-tags">
                           {movie.genre && movie.genre.split('/').slice(0, 2).map(tag => (
                             <span key={tag} className="genre-tag">{tag.trim()}</span>
                           ))}
                         </div>
                       </div>
                     </div>
                    );
                    return items;
                  })}
                </div>
              )}
            </section>

            {/* TAMIL CINEMA SECTION */}
            {tamilMovies.length > 0 && (
              <section className="movies-section" style={{ marginTop: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1rem' }}>
                  <div>
                    <p className="section-meta" style={{ marginBottom: '0.25rem' }}>தமிழ் சினிமா</p>
                    <h2 className="section-title" style={{ marginBottom: 0 }}>Tamil Cinema</h2>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="hero-nav-btn" style={{ position: 'static', width: '32px', height: '32px', opacity: 1, transform: 'none' }}
                      onClick={() => tamilScrollRef.current?.scrollBy({ left: -400, behavior: 'smooth' })}
                      aria-label="Scroll left">
                      <ChevronLeft size={18} />
                    </button>
                    <button className="hero-nav-btn" style={{ position: 'static', width: '32px', height: '32px', opacity: 1, transform: 'none' }}
                      onClick={() => tamilScrollRef.current?.scrollBy({ left: 400, behavior: 'smooth' })}
                      aria-label="Scroll right">
                      <ChevronRight size={18} />
                    </button>
                    <button className="btn-secondary" onClick={() => navigateTo('tamil-cinema')}
                      style={{ fontSize: '0.7rem', padding: '0.25rem 0.65rem', display: 'inline-flex', alignItems: 'center', gap: '0.2rem', flexShrink: 0 }}>
                      View All <ChevronRight size={12} />
                    </button>
                  </div>
                </div>
                <div className="movie-grid-horizontal" ref={tamilScrollRef}>
                  {tamilMovies.flatMap((movie, idx) => {
                    const items = [];
                    if (idx > 0 && idx % 6 === 0) {
                      items.push(
                        <div key={`ad-ta-${idx}`} className="ad-card-hscroll">
                          <span className="ad-label-sm">Ad</span>
                          <AdsterraAd zoneKey="6722103adf045d07f8b2009ba2196e96" width={300} height={250} />
                        </div>
                      );
                    }
                    items.push(
                      <div key={movie.id} className="movie-card-horizontal" onClick={() => handleViewMovie(movie.id)}>
                        <div className="movie-card-poster-wrapper">
                          <img src={proxyImageUrl(movie.posterUrl, 'w300')} alt={movie.title} className="movie-card-poster" loading="lazy" />
                          <div className="movie-card-rating">
                            <Star size={12} fill="var(--color-accent-gold)" color="var(--color-accent-gold)" />
                            <span>{movie.rating.toFixed(1)}</span>
                          </div>
                        </div>
                        <div className="movie-card-info">
                          <h3 className="movie-card-title">{movie.title}</h3>
                          <div className="movie-card-genre-tags">
                            {movie.genre && movie.genre.split('/').slice(0, 2).map(tag => (
                              <span key={tag} className="genre-tag">{tag.trim()}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                    return items;
                  })}
                </div>
              </section>
            )}

            {/* MALAYALAM CINEMA SECTION */}
            {malayalamMovies.length > 0 && (
              <section className="movies-section" style={{ marginTop: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1rem' }}>
                  <div>
                    <p className="section-meta" style={{ marginBottom: '0.25rem' }}>മലയാള സിനിമ</p>
                    <h2 className="section-title" style={{ marginBottom: 0 }}>Malayalam Cinema</h2>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="hero-nav-btn" style={{ position: 'static', width: '32px', height: '32px', opacity: 1, transform: 'none' }}
                      onClick={() => malayalamScrollRef.current?.scrollBy({ left: -400, behavior: 'smooth' })}
                      aria-label="Scroll left">
                      <ChevronLeft size={18} />
                    </button>
                    <button className="hero-nav-btn" style={{ position: 'static', width: '32px', height: '32px', opacity: 1, transform: 'none' }}
                      onClick={() => malayalamScrollRef.current?.scrollBy({ left: 400, behavior: 'smooth' })}
                      aria-label="Scroll right">
                      <ChevronRight size={18} />
                    </button>
                    <button className="btn-secondary" onClick={() => navigateTo('malayalam-cinema')}
                      style={{ fontSize: '0.7rem', padding: '0.25rem 0.65rem', display: 'inline-flex', alignItems: 'center', gap: '0.2rem', flexShrink: 0 }}>
                      View All <ChevronRight size={12} />
                    </button>
                  </div>
                </div>
                <div className="movie-grid-horizontal" ref={malayalamScrollRef}>
                  {malayalamMovies.flatMap((movie, idx) => {
                    const items = [];
                    if (idx > 0 && idx % 6 === 0) {
                      items.push(
                        <div key={`ad-ml-${idx}`} className="ad-card-hscroll">
                          <span className="ad-label-sm">Ad</span>
                          <AdsterraAd zoneKey="6722103adf045d07f8b2009ba2196e96" width={300} height={250} />
                        </div>
                      );
                    }
                    items.push(
                      <div key={movie.id} className="movie-card-horizontal" onClick={() => handleViewMovie(movie.id)}>
                        <div className="movie-card-poster-wrapper">
                          <img src={proxyImageUrl(movie.posterUrl, 'w300')} alt={movie.title} className="movie-card-poster" loading="lazy" />
                          <div className="movie-card-rating">
                            <Star size={12} fill="var(--color-accent-gold)" color="var(--color-accent-gold)" />
                            <span>{movie.rating.toFixed(1)}</span>
                          </div>
                        </div>
                        <div className="movie-card-info">
                          <h3 className="movie-card-title">{movie.title}</h3>
                          <div className="movie-card-genre-tags">
                            {movie.genre && movie.genre.split('/').slice(0, 2).map(tag => (
                              <span key={tag} className="genre-tag">{tag.trim()}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                    return items;
                  })}
                </div>
              </section>
            )}


            {/* TOP RATED ON THIRAIPEDIA — horizontal slider */}
            {topRatedMovies.length > 0 && (
              <section className="movies-section" style={{ marginTop: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1rem' }}>
                  <div>
                    <p className="section-meta" style={{ marginBottom: '0.25rem' }}>Weekly Charts</p>
                    <h2 className="section-title" style={{ marginBottom: 0 }}>Top Rated on thiraipedia</h2>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <button className="hero-nav-btn" style={{ position: 'static', width: '32px', height: '32px', opacity: 1, transform: 'none' }}
                      onClick={() => topRatedScrollRef.current?.scrollBy({ left: -400, behavior: 'smooth' })}
                      aria-label="Scroll left">
                      <ChevronLeft size={18} />
                    </button>
                    <button className="hero-nav-btn" style={{ position: 'static', width: '32px', height: '32px', opacity: 1, transform: 'none' }}
                      onClick={() => topRatedScrollRef.current?.scrollBy({ left: 400, behavior: 'smooth' })}
                      aria-label="Scroll right">
                      <ChevronRight size={18} />
                    </button>
                    <button className="btn-secondary" style={{ fontSize: '0.8rem', padding: '0.4rem 1rem' }} onClick={() => { navigateTo('top-rated'); }}>
                      View All
                    </button>
                  </div>
                </div>
                <div className="movie-grid-horizontal" ref={topRatedScrollRef}>
                  {topRatedMovies.map(movie => (
                    <div key={movie.id} className="movie-card-horizontal" onClick={() => handleViewMovie(movie.id)}>
                      <div className="movie-card-poster-wrapper">
                        <img src={proxyImageUrl(movie.posterUrl, 'w300')} alt={movie.title} className="movie-card-poster" loading="lazy" />
                        <div className="movie-card-rating">
                          <Star size={12} fill="var(--color-accent-gold)" color="var(--color-accent-gold)" />
                          <span>{movie.rating.toFixed(1)}</span>
                        </div>
                      </div>
                      <div className="movie-card-info">
                        <h3 className="movie-card-title">{movie.title}</h3>
                        <div className="movie-card-genre-tags">
                          {movie.genre && movie.genre.split('/').slice(0, 2).map(tag => (
                            <span key={tag} className="genre-tag">{tag.trim()}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* APP PROMO — Download section with animated cartoon */}
            <section className="app-promo-section">
              <div className="app-promo-card">
                <div className="app-promo-illustration">
                  <div className="app-promo-char">
                    <div className="char-body">
                      <div className="char-eye char-eye-left" />
                      <div className="char-eye char-eye-right" />
                      <div className="char-mouth" />
                    </div>
                    <div className="char-popcorn">
                      <div className="popcorn-piece" />
                      <div className="popcorn-piece" />
                      <div className="popcorn-piece" />
                    </div>
                  </div>
                  <div className="app-promo-char char-2">
                    <div className="char-body">
                      <div className="char-eye char-eye-left" />
                      <div className="char-eye char-eye-right" />
                      <div className="char-mouth char-mouth-smile" />
                    </div>
                    <div className="char-clapboard">
                      <div className="clap-line" />
                      <div className="clap-line" />
                      <div className="clap-line" />
                    </div>
                  </div>
                </div>
                <div className="app-promo-content">
                  <span className="app-promo-badge">Mobile App</span>
                  <h2 className="app-promo-title">Take ThiraiPedia Everywhere</h2>
                  <p className="app-promo-desc">Rate movies, write reviews, and discover new films on the go.</p>
                  <div className="app-promo-stats">
                    <div className="app-promo-stat">
                      <span className="app-promo-stat-num">10K+</span>
                      <span className="app-promo-stat-lbl">Downloads</span>
                    </div>
                    <div className="app-promo-stat">
                      <span className="app-promo-stat-num">4.8</span>
                      <span className="app-promo-stat-lbl">App Rating</span>
                    </div>
                    <div className="app-promo-stat">
                      <span className="app-promo-stat-num">500+</span>
                      <span className="app-promo-stat-lbl">Daily Critics</span>
                    </div>
                  </div>
                  <div className="app-promo-buttons">
                    <button className="app-store-btn" onClick={() => showToast('Available on the App Store soon!')}>
                      <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>
                      App Store
                    </button>
                    <button className="app-store-btn" onClick={() => showToast('Available on Google Play soon!')}>
                      <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M3 20.5v-17a.5.5 0 0 1 .74-.44l15.53 8.5a.5.5 0 0 1 0 .88l-15.53 8.5A.5.5 0 0 1 3 20.5z"/></svg>
                      Google Play
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* CURATED SELECTION (Staff Picks) */}
            {featuredStaffPick && (
              <section className="staff-picks-section">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                  <div>
                    <p className="section-meta">Curated Selection</p>
                    <h2 className="section-title">Staff Picks</h2>
                  </div>
            {currentUser && currentUser.role === 'admin' && (
                    <button className="btn-secondary" style={{ fontSize: '0.75rem', padding: '0.35rem 0.85rem' }} onClick={() => setShowCurateModal(true)}>
                      <Edit3 size={13} /> Curate
                    </button>
                  )}
                </div>
                <div className="staff-picks-layout">
                  {/* Left Side: Featured Large Pick */}
                  <div 
                    className="featured-pick-card"
                    onClick={() => handleViewMovie(featuredStaffPick.id)}
                  >
                    <div 
                      className="featured-pick-backdrop"
                      style={{ backgroundImage: `url(${proxyImageUrl(featuredStaffPick.backdropUrl, 'original')})` }}
                    />
                    <div className="featured-pick-content">
                      <span className="featured-pick-meta">- Home Discovery -</span>
                      <h3 className="featured-pick-title">{featuredStaffPick.title}</h3>
                      <p className="featured-pick-desc">{featuredStaffPick.description}</p>
                    </div>
                  </div>

                  {/* Right Side: Grid of 3 smaller cards */}
                  <div className="picks-grid-layout">
                    {gridStaffPicks.length > 0 ? (
                      gridStaffPicks.map(pick => (
                        <div 
                          key={pick.id} 
                          className="picks-grid-card"
                          onClick={() => handleViewMovie(pick.id)}
                          style={{ height: '160px' }}
                        >
                          <div 
                            className="picks-grid-backdrop"
                            style={{ backgroundImage: `url(${proxyImageUrl(pick.posterUrl, 'w500')})` }}
                          />
                          <div className="picks-grid-content">
                            <span className="picks-grid-meta">{pick.genre}</span>
                            <h4 className="picks-grid-title">{pick.title}</h4>
                          </div>
                        </div>
                      ))
                    ) : (
                      // Fallback if no specific picks grid are seeded
                      movies.slice(2, 5).map(pick => (
                        <div 
                          key={pick.id} 
                          className="picks-grid-card"
                          onClick={() => handleViewMovie(pick.id)}
                          style={{ height: '160px' }}
                        >
                          <div 
                            className="picks-grid-backdrop"
                            style={{ backgroundImage: `url(${proxyImageUrl(pick.posterUrl, 'w500')})` }}
                          />
                          <div className="picks-grid-content">
                            <span className="picks-grid-meta">{pick.genre}</span>
                            <h4 className="picks-grid-title">{pick.title}</h4>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </section>
            )}

            {/* FUN SECTION: Quiz & Spin Wheel Promo */}
            <section className="fun-promo-section">
              <div className="fun-promo-header">
                <p className="section-meta">Play & Explore</p>
                <h2 className="section-title">Fun Activities</h2>
              </div>
              <div className="fun-promo-grid">
                <div className="fun-promo-card quiz-promo" onClick={() => navigateTo('quiz')}>
                  <div className="fun-promo-bg">
                    <svg viewBox="0 0 400 300" className="fun-promo-svg" preserveAspectRatio="xMidYMid slice">
                      <defs>
                        <radialGradient id="qBg" cx="50%" cy="50%" r="60%">
                          <stop offset="0%" stopColor="rgba(99,102,241,0.2)"/>
                          <stop offset="100%" stopColor="rgba(30,27,75,0.4)"/>
                        </radialGradient>
                      </defs>
                      <rect width="400" height="300" fill="url(#qBg)"/>
                      <circle cx="110" cy="190" r="30" fill="rgba(251,191,36,0.08)"/>
                      <circle cx="110" cy="190" r="22" fill="rgba(251,191,36,0.06)"/>
                      <circle cx="110" cy="190" r="4" fill="rgba(251,191,36,0.12)"/>
                      <circle cx="102" cy="184" r="5" fill="rgba(251,191,36,0.08)"/>
                      <circle cx="118" cy="184" r="5" fill="rgba(251,191,36,0.08)"/>
                      <path d="M102 198 Q110 208 118 198" fill="none" stroke="rgba(251,191,36,0.12)" strokeWidth="2" strokeLinecap="round"/>
                      <ellipse cx="200" cy="120" rx="55" ry="60" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.06)" strokeWidth="1"/>
                      <ellipse cx="185" cy="105" rx="18" ry="22" fill="rgba(255,255,255,0.04)"/>
                      <circle cx="185" cy="95" r="2.5" fill="rgba(255,255,255,0.08)"/>
                      <circle cx="195" cy="100" r="2" fill="rgba(255,255,255,0.06)"/>
                      <path d="M178 115 Q185 125 192 115" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1.5" strokeLinecap="round"/>
                      <text x="210" y="90" fontSize="28" fill="rgba(251,191,36,0.15)" fontFamily="serif" fontWeight="bold">?</text>
                      <text x="160" y="75" fontSize="18" fill="rgba(99,102,241,0.12)" fontFamily="serif" fontWeight="bold">?</text>
                      <text x="225" y="65" fontSize="14" fill="rgba(139,92,246,0.1)" fontFamily="serif" fontWeight="bold">?</text>
                      <rect x="50" y="50" width="30" height="40" rx="4" fill="none" stroke="rgba(99,102,241,0.08)" strokeWidth="1.5" transform="rotate(-12 65 70)"/>
                      <rect x="310" y="60" width="30" height="40" rx="4" fill="none" stroke="rgba(139,92,246,0.08)" strokeWidth="1.5" transform="rotate(8 325 80)"/>
                      <circle cx="90" cy="130" r="3" fill="rgba(251,191,36,0.1)"/>
                      <circle cx="320" cy="160" r="4" fill="rgba(99,102,241,0.08)"/>
                      <circle cx="280" cy="80" r="2" fill="rgba(251,191,36,0.08)"/>
                    </svg>
                  </div>
                  <div className="fun-promo-content">
                    <h3 className="fun-promo-title">Movie Quiz</h3>
                    <p className="fun-promo-desc">Test your cinema knowledge! Guess ratings, years & directors.</p>
                    <span className="fun-promo-cta">Play Now →</span>
                  </div>
                </div>
                <div className="fun-promo-card wheel-promo" onClick={() => navigateTo('wheel')}>
                  <div className="fun-promo-bg">
                    <svg viewBox="0 0 400 300" className="fun-promo-svg" preserveAspectRatio="xMidYMid slice">
                      <defs>
                        <radialGradient id="wBg" cx="50%" cy="50%" r="60%">
                          <stop offset="0%" stopColor="rgba(251,191,36,0.2)"/>
                          <stop offset="100%" stopColor="rgba(30,27,75,0.4)"/>
                        </radialGradient>
                      </defs>
                      <rect width="400" height="300" fill="url(#wBg)"/>
                      <circle cx="190" cy="160" r="65" fill="none" stroke="rgba(251,191,36,0.08)" strokeWidth="2"/>
                      <circle cx="190" cy="160" r="50" fill="none" stroke="rgba(245,158,11,0.06)" strokeWidth="1.5"/>
                      <circle cx="190" cy="160" r="35" fill="none" stroke="rgba(251,191,36,0.05)" strokeWidth="1"/>
                      <line x1="190" y1="95" x2="190" y2="160" stroke="rgba(251,191,36,0.06)" strokeWidth="2"/>
                      <line x1="190" y1="160" x2="240" y2="160" stroke="rgba(245,158,11,0.06)" strokeWidth="2"/>
                      <line x1="190" y1="160" x2="150" y2="200" stroke="rgba(251,191,36,0.05)" strokeWidth="1.5"/>
                      <line x1="190" y1="160" x2="230" y2="200" stroke="rgba(245,158,11,0.05)" strokeWidth="1.5"/>
                      <circle cx="190" cy="160" r="8" fill="rgba(251,191,36,0.08)"/>
                      <circle cx="190" cy="160" r="3" fill="rgba(251,191,36,0.15)"/>
                      <polygon points="190,78 185,95 195,95" fill="rgba(251,191,36,0.1)"/>
                      <polygon points="190,78 185,95 195,95" fill="none" stroke="rgba(251,191,36,0.15)" strokeWidth="1"/>
                      <circle cx="290" cy="80" r="3" fill="rgba(251,191,36,0.1)"/>
                      <circle cx="100" cy="80" r="2.5" fill="rgba(245,158,11,0.08)"/>
                      <circle cx="310" cy="210" r="2" fill="rgba(251,191,36,0.08)"/>
                      <circle cx="80" cy="200" r="3.5" fill="rgba(245,158,11,0.06)"/>
                      <rect x="100" y="100" width="22" height="32" rx="3" fill="none" stroke="rgba(251,191,36,0.06)" strokeWidth="1.5" transform="rotate(-15 111 116)"/>
                      <rect x="265" y="120" width="22" height="32" rx="3" fill="none" stroke="rgba(245,158,11,0.06)" strokeWidth="1.5" transform="rotate(12 276 136)"/>
                    </svg>
                  </div>
                  <div className="fun-promo-content">
                    <h3 className="fun-promo-title">Card Flix</h3>
                    <p className="fun-promo-desc">Feeling lucky? Flip cards to discover your next movie!</p>
                    <span className="fun-promo-cta">Flip Now →</span>
                  </div>
                </div>
                <div className="fun-promo-card blind-promo" onClick={() => navigateTo('blind-frame')}>
                  <div className="fun-promo-bg">
                    <svg viewBox="0 0 400 300" className="fun-promo-svg" preserveAspectRatio="xMidYMid slice">
                      <defs>
                        <radialGradient id="bBg" cx="50%" cy="50%" r="60%">
                          <stop offset="0%" stopColor="rgba(168,85,247,0.2)"/>
                          <stop offset="100%" stopColor="rgba(30,27,75,0.4)"/>
                        </radialGradient>
                      </defs>
                      <rect width="400" height="300" fill="url(#bBg)"/>
                      <ellipse cx="110" cy="160" rx="28" ry="32" fill="rgba(255,255,255,0.03)" stroke="rgba(168,85,247,0.1)" strokeWidth="1.5"/>
                      <circle cx="110" cy="160" r="8" fill="rgba(168,85,247,0.06)"/>
                      <circle cx="110" cy="160" r="3" fill="rgba(168,85,247,0.1)"/>
                      <rect x="170" y="120" width="40" height="50" rx="3" fill="rgba(255,255,255,0.02)" stroke="rgba(251,191,36,0.08)" strokeWidth="1" transform="rotate(-8 190 145)"/>
                      <rect x="180" y="125" width="20" height="40" rx="2" fill="rgba(251,191,36,0.04)" stroke="rgba(251,191,36,0.06)" strokeWidth="1" transform="rotate(-8 190 145)"/>
                      <rect x="250" y="90" width="35" height="50" rx="3" fill="rgba(255,255,255,0.02)" stroke="rgba(168,85,247,0.08)" strokeWidth="1" transform="rotate(6 267 115)"/>
                      <rect x="258" y="95" width="18" height="40" rx="2" fill="rgba(168,85,247,0.04)" stroke="rgba(168,85,247,0.06)" strokeWidth="1" transform="rotate(6 267 115)"/>
                      <text x="290" y="180" fontSize="36" fill="rgba(168,85,247,0.12)" fontFamily="serif" fontWeight="bold">?</text>
                      <text x="240" y="190" fontSize="22" fill="rgba(251,191,36,0.1)" fontFamily="serif" fontWeight="bold">?</text>
                      <text x="320" y="160" fontSize="16" fill="rgba(168,85,247,0.08)" fontFamily="serif" fontWeight="bold">?</text>
                      <circle cx="70" cy="100" r="3" fill="rgba(168,85,247,0.08)"/>
                      <circle cx="310" cy="230" r="2.5" fill="rgba(251,191,36,0.08)"/>
                      <circle cx="150" cy="210" r="2" fill="rgba(168,85,247,0.06)"/>
                      <circle cx="260" cy="240" r="3.5" fill="rgba(251,191,36,0.06)"/>
                      <circle cx="50" cy="200" r="2" fill="rgba(168,85,247,0.05)"/>
                    </svg>
                  </div>
                  <div className="fun-promo-content">
                    <h3 className="fun-promo-title">Blind Frame</h3>
                    <p className="fun-promo-desc">Guess the movie from a blurry poster as it clears!</p>
                    <span className="fun-promo-cta">Play Now →</span>
                  </div>
                </div>
                <div className="fun-promo-card mood-promo" onClick={() => navigateTo('mood-matcher')}>
                  <div className="fun-promo-bg">
                    <svg viewBox="0 0 400 300" className="fun-promo-svg" preserveAspectRatio="xMidYMid slice">
                      <defs>
                        <radialGradient id="mBg" cx="50%" cy="50%" r="60%">
                          <stop offset="0%" stopColor="rgba(52,211,153,0.2)"/>
                          <stop offset="100%" stopColor="rgba(30,27,75,0.4)"/>
                        </radialGradient>
                      </defs>
                      <rect width="400" height="300" fill="url(#mBg)"/>
                      <circle cx="100" cy="140" r="28" fill="rgba(255,255,255,0.03)" stroke="rgba(251,191,36,0.08)" strokeWidth="1.5"/>
                      <circle cx="90" cy="133" r="4" fill="rgba(251,191,36,0.08)"/>
                      <circle cx="110" cy="133" r="4" fill="rgba(251,191,36,0.08)"/>
                      <path d="M88 150 Q100 162 112 150" fill="none" stroke="rgba(251,191,36,0.12)" strokeWidth="2" strokeLinecap="round"/>
                      <circle cx="190" cy="110" r="24" fill="rgba(255,255,255,0.03)" stroke="rgba(52,211,153,0.08)" strokeWidth="1.5"/>
                      <circle cx="182" cy="104" r="3.5" fill="rgba(52,211,153,0.08)"/>
                      <circle cx="198" cy="104" r="3.5" fill="rgba(52,211,153,0.08)"/>
                      <path d="M182 118 Q190 126 198 118" fill="none" stroke="rgba(52,211,153,0.1)" strokeWidth="2" strokeLinecap="round"/>
                      <circle cx="290" cy="150" r="24" fill="rgba(255,255,255,0.03)" stroke="rgba(251,191,36,0.08)" strokeWidth="1.5"/>
                      <circle cx="290" cy="143" r="3.5" fill="rgba(251,191,36,0.08)"/>
                      <circle cx="290" cy="143" r="3.5" fill="rgba(251,191,36,0.08)"/>
                      <path d="M282 158 Q290 164 298 158" fill="none" stroke="rgba(251,191,36,0.1)" strokeWidth="2" strokeLinecap="round"/>
                      <circle cx="280" cy="180" r="2" fill="rgba(252,211,77,0.08)"/>
                      <circle cx="300" cy="180" r="2" fill="rgba(251,191,36,0.08)"/>
                      <circle cx="290" cy="172" r="2" fill="rgba(251,191,36,0.06)"/>
                      <circle cx="140" cy="200" r="2.5" fill="rgba(52,211,153,0.08)"/>
                      <circle cx="220" cy="200" r="2" fill="rgba(251,191,36,0.06)"/>
                      <circle cx="70" cy="200" r="2" fill="rgba(52,211,153,0.06)"/>
                      <text x="330" y="90" fontSize="20" fill="rgba(251,191,36,0.1)" fontFamily="serif">♥</text>
                      <text x="60" y="80" fontSize="16" fill="rgba(52,211,153,0.1)" fontFamily="serif">★</text>
                      <text x="220" y="80" fontSize="14" fill="rgba(251,191,36,0.08)" fontFamily="serif">✦</text>
                    </svg>
                  </div>
                  <div className="fun-promo-content">
                    <h3 className="fun-promo-title">Mood Matcher</h3>
                    <p className="fun-promo-desc">Tell us your mood and we'll pick the perfect movie!</p>
                    <span className="fun-promo-cta">Match Me →</span>
                  </div>
                </div>
              </div>
            </section>

            {/* CINE REELS STRIP */}
            {cineUpdates.length > 0 && (
              <section className="movies-section" style={{ marginTop: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1rem' }}>
                  <div>
                    <p className="section-meta" style={{ marginBottom: '0.25rem' }}>Latest Updates</p>
                    <h2 className="section-title" style={{ marginBottom: 0 }}>Cine Pulse</h2>
                  </div>
                  <button className="btn-secondary" style={{ fontSize: '0.8rem', padding: '0.4rem 1rem' }}
                    onClick={() => { loadCineUpdates(); setShowCineReels(true); }}>
                    View All
                  </button>
                </div>
                <div className="movie-grid-horizontal" ref={cineReelsScrollRef}>
                  {cineUpdates.map((update) => (
                    <div
                      key={update.id}
                      className="movie-card-horizontal"
                      onClick={() => { loadCineUpdates(); setShowCineReels(true); }}
                      style={{ flex: '0 0 200px' }}
                    >
                      <div className="movie-card-poster-wrapper" style={{ height: '200px' }}>
                        <div style={{
                          width: '100%', height: '100%', borderRadius: '8px',
                          background: `linear-gradient(145deg, var(--color-surface-elevated) 0%, #14142a 100%)`,
                          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                          padding: '1.25rem 1rem', gap: '0.6rem', border: '1px solid rgba(255,255,255,0.06)'
                        }}>
                          <span style={{
                            background: CATEGORY_COLORS[update.category] || '#6366f1',
                            color: '#fff', padding: '0.2rem 0.7rem', borderRadius: '4px',
                            fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em'
                          }}>
                            {update.category || 'News'}
                          </span>
                          <span style={{
                            color: '#fff', fontSize: '0.85rem', fontWeight: 600,
                            textAlign: 'center', lineHeight: 1.35,
                            display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden'
                          }}>
                            {update.title}
                          </span>
                        </div>
                      </div>
                      <div className="movie-card-info" style={{ padding: '0.5rem 0.25rem' }}>
                        <h3 className="movie-card-title" style={{ fontSize: '0.8rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {update.title}
                        </h3>
                        <div className="movie-card-genre-tags">
                          <span className="genre-tag">{update.likes || 0} Likes</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

          </div>
        )}

        {/* NEW RELEASES VIEW */}
        {activeView === 'new-releases' && (
          <div className="main-content">
            <div className="page-header">
              <p className="section-meta">Latest First</p>
              <h2 className="section-title" style={{ marginBottom: '0.25rem' }}>New Releases</h2>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '2rem' }}>All movies sorted by release date, from earliest to latest.</p>
            </div>
            {(movies.length > 0) && (
              <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <select value={releaseFilterMonth} onChange={e => setReleaseFilterMonth(e.target.value)}
                  style={{ fontSize: '0.8rem', padding: '0.35rem 0.7rem', borderRadius: '6px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', color: '#94a3b8', fontFamily: 'var(--font-sans)' }}>
                  <option value="">All Months</option>
                  {['January','February','March','April','May','June','July','August','September','October','November','December'].map((m, i) => (
                    <option key={i} value={i + 1}>{m}</option>
                  ))}
                </select>
                <select value={releaseFilterYear} onChange={e => setReleaseFilterYear(e.target.value)}
                  style={{ fontSize: '0.8rem', padding: '0.35rem 0.7rem', borderRadius: '6px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', color: '#94a3b8', fontFamily: 'var(--font-sans)' }}>
                  <option value="">All Years</option>
                  {[...new Set(newReleasesPage.map(m => m.releaseDate?.split('-')[0]).filter(Boolean))].sort().reverse().map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            )}
             {newReleasesPageLoading ? (
               <div className="skeleton-grid">
                 {Array.from({ length: 8 }).map((_, i) => (
                   <div key={i} className="skeleton-card">
                     <div className="skeleton skeleton-poster" />
                     <div className="skeleton skeleton-text medium" />
                     <div className="skeleton skeleton-text short" />
                   </div>
                 ))}
               </div>
              ) : filteredReleases.length === 0 ? (
               <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--color-text-muted)' }}>
                 <Film size={48} style={{ marginBottom: '1.5rem', opacity: 0.5 }} />
                 <p style={{ marginBottom: '0.75rem', fontSize: '1.1rem', fontWeight: 600 }}>
                   No new releases found
                 </p>
                 <p style={{ marginBottom: '1.5rem', fontSize: '0.95rem', lineHeight: '1.6' }}>
                   Check back soon for the latest hit movies, or explore our full catalog using the 
                   genre and sort filters above.
                 </p>
                 <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                   <button onClick={() => { setSelectedGenre(''); setSortOption('popular'); navigateTo('home'); }}
                     className="btn-outline" style={{ padding: '0.6rem 1.2rem', border: '1px solid var(--color-border)' }}>
                     Browse All Movies
                   </button>
                    <button onClick={() => navigateTo('coming-soon')}
                      className="btn-secondary" style={{ padding: '0.6rem 1.2rem' }}>
                      See Coming Soon
                    </button>
                 </div>
               </div>
              ) : (
               <div className="movie-grid">
                  {filteredReleases.slice(0, visibleCount).map(movie => (
                   <div key={movie.id} className="movie-card" onClick={() => handleViewMovie(movie.id)}>
                        <div className="movie-card-poster-wrapper">
                          <img src={proxyImageUrl(movie.posterUrl, 'w300')} alt={movie.title} className="movie-card-poster" loading="lazy" />
                       <div className="movie-card-rating">
                         <Star size={12} fill="var(--color-accent-gold)" color="var(--color-accent-gold)" />
                         <span>{(movie.rating || 0).toFixed(1)}</span>
                       </div>
                     </div>
                     <div className="movie-card-info">
                       <h3 className="movie-card-title">{movie.title}</h3>
                       <div className="movie-card-genre-tags">
                         {movie.genre && movie.genre.split('/').map(tag => (
                           <span key={tag} className="genre-tag">{tag.trim()}</span>
                         ))}
                       </div>
                     </div>
                   </div>
                 ))}
               </div>
             )}
             {filteredReleases.length > visibleCount && (
               <div className="load-more-btn-container">
                 <button className="btn-outline load-more-btn" onClick={() => setVisibleCount(prev => prev + LOAD_STEP)}>
                   Load More ({filteredReleases.length - visibleCount} remaining)
                 </button>
               </div>
             )}
          </div>
        )}

        {/* TAMIL CINEMA FULL PAGE */}
        {activeView === 'tamil-cinema' && (
          <div className="main-content">
            <div className="page-header">
              <p className="section-meta">தமிழ் சினிமா</p>
              <h2 className="section-title" style={{ marginBottom: '0.25rem' }}>Tamil Cinema</h2>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '2rem' }}>All Tamil language movies in the library.</p>
            </div>
            {tamilMovies.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--color-text-muted)' }}>
                <p>No Tamil movies found.</p>
              </div>
            ) : (
              <div className="movie-grid">
                {tamilMovies.slice(0, visibleCount).map(movie => (
                  <div key={movie.id} className="movie-card" onClick={() => handleViewMovie(movie.id)}>
                    <div className="movie-card-poster-wrapper">
                      <img src={proxyImageUrl(movie.posterUrl, 'w300')} alt={movie.title} className="movie-card-poster" loading="lazy" />
                      <div className="movie-card-rating">
                        <Star size={12} fill="var(--color-accent-gold)" color="var(--color-accent-gold)" />
                        <span>{(movie.rating || 0).toFixed(1)}</span>
                      </div>
                    </div>
                    <div className="movie-card-info">
                      <h3 className="movie-card-title">{movie.title}</h3>
                      <div className="movie-card-genre-tags">
                        {movie.genre && movie.genre.split('/').map(tag => (
                          <span key={tag} className="genre-tag">{tag.trim()}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {tamilMovies.length > visibleCount && (
              <div className="load-more-btn-container">
                <button className="btn-outline load-more-btn" onClick={() => setVisibleCount(prev => prev + LOAD_STEP)}>
                  Load More ({tamilMovies.length - visibleCount} remaining)
                </button>
              </div>
            )}
          </div>
        )}

        {/* MALAYALAM CINEMA FULL PAGE */}
        {activeView === 'malayalam-cinema' && (
          <div className="main-content">
            <div className="page-header">
              <p className="section-meta">മലയാള സിനിമ</p>
              <h2 className="section-title" style={{ marginBottom: '0.25rem' }}>Malayalam Cinema</h2>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '2rem' }}>All Malayalam language movies in the library.</p>
            </div>
            {malayalamMovies.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--color-text-muted)' }}>
                <p>No Malayalam movies found.</p>
              </div>
            ) : (
              <div className="movie-grid">
                {malayalamMovies.slice(0, visibleCount).map(movie => (
                  <div key={movie.id} className="movie-card" onClick={() => handleViewMovie(movie.id)}>
                    <div className="movie-card-poster-wrapper">
                      <img src={proxyImageUrl(movie.posterUrl, 'w300')} alt={movie.title} className="movie-card-poster" loading="lazy" />
                      <div className="movie-card-rating">
                        <Star size={12} fill="var(--color-accent-gold)" color="var(--color-accent-gold)" />
                        <span>{(movie.rating || 0).toFixed(1)}</span>
                      </div>
                    </div>
                    <div className="movie-card-info">
                      <h3 className="movie-card-title">{movie.title}</h3>
                      <div className="movie-card-genre-tags">
                        {movie.genre && movie.genre.split('/').map(tag => (
                          <span key={tag} className="genre-tag">{tag.trim()}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {malayalamMovies.length > visibleCount && (
              <div className="load-more-btn-container">
                <button className="btn-outline load-more-btn" onClick={() => setVisibleCount(prev => prev + LOAD_STEP)}>
                  Load More ({malayalamMovies.length - visibleCount} remaining)
                </button>
              </div>
            )}
          </div>
        )}

        {/* TOP RATED VIEW */}
        {activeView === 'top-rated' && (
          <div className="main-content">
            <div className="page-header">
              <p className="section-meta">Highest Rated</p>
              <h2 className="section-title" style={{ marginBottom: '0.25rem' }}>Top Rated</h2>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '2rem' }}>Every movie rated 7 and above, ranked by score.</p>
            </div>
            {topRatedPageLoading ? (
              <div className="skeleton-grid">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="skeleton-card">
                    <div className="skeleton skeleton-poster" />
                    <div className="skeleton skeleton-text medium" />
                    <div className="skeleton skeleton-text short" />
                  </div>
                ))}
              </div>
            ) : topRatedPage.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--color-text-muted)' }}>
                <Film size={48} style={{ marginBottom: '1.5rem', opacity: 0.5 }} />
                <p style={{ marginBottom: '0.75rem', fontSize: '1.1rem', fontWeight: 600 }}>
                  No top rated movies yet
                </p>
                <p style={{ marginBottom: '1.5rem', fontSize: '0.95rem', lineHeight: '1.6' }}>
                  Movies with a rating of 7 or higher will appear here.
                </p>
                <button onClick={() => navigateTo('home')}
                  className="btn-outline" style={{ padding: '0.6rem 1.2rem', border: '1px solid var(--color-border)' }}>
                  Browse All Movies
                </button>
              </div>
            ) : (
              <div className="movie-grid">
                {topRatedPage.slice(0, visibleCount).map(movie => (
                  <div key={movie.id} className="movie-card" onClick={() => handleViewMovie(movie.id)}>
                    <div className="movie-card-poster-wrapper">
                      <img src={proxyImageUrl(movie.posterUrl, 'w300')} alt={movie.title} className="movie-card-poster" loading="lazy" />
                      <div className="movie-card-rating">
                        <Star size={12} fill="var(--color-accent-gold)" color="var(--color-accent-gold)" />
                        <span>{(movie.rating || 0).toFixed(1)}</span>
                      </div>
                    </div>
                    <div className="movie-card-info">
                      <h3 className="movie-card-title">{movie.title}</h3>
                      <div className="movie-card-genre-tags">
                        {movie.genre && movie.genre.split('/').map(tag => (
                          <span key={tag} className="genre-tag">{tag.trim()}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {topRatedPage.length > visibleCount && (
              <div className="load-more-btn-container">
                <button className="btn-outline load-more-btn" onClick={() => setVisibleCount(prev => prev + LOAD_STEP)}>
                  Load More ({topRatedPage.length - visibleCount} remaining)
                </button>
              </div>
            )}
          </div>
        )}

        {/* WATCHLIST VIEW */}
        {activeView === 'watchlist' && (
          <div className="main-content">
            <div className="page-header">
              <p className="section-meta">Your Collection</p>
              <h2 className="section-title" style={{ marginBottom: '0.25rem' }}>Watchlist</h2>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '2rem' }}>Movies you've saved to watch later.</p>
            </div>
             {(() => {
               const watchlistMovies = movies.filter(m => watchlist.includes(m.id));
               return watchlistMovies.length === 0 ? (
                 <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--color-text-muted)' }}>
                   <Film size={48} style={{ marginBottom: '1.5rem', opacity: 0.5 }} />
                   <p style={{ marginBottom: '0.75rem', fontSize: '1.1rem', fontWeight: 600 }}>
                     Your watchlist is empty
                   </p>
                   <p style={{ marginBottom: '1.5rem', fontSize: '0.95rem', lineHeight: '1.6' }}>
                     Start building your personal collection by browsing movies and clicking the 
                     '+ Add to Watchlist' button on any movie card.
                   </p>
                   <button onClick={() => { setSelectedGenre(''); setSortOption('popular'); navigateTo('home'); }}
                     className="btn-primary" style={{ padding: '0.75rem 1.5rem', fontSize: '0.9rem' }}>
                     <Plus size={16} /> Explore Movies
                   </button>
                 </div>
               ) : (
                 <div className="movie-grid">

                  {watchlistMovies.map(movie => (
                    <div key={movie.id} className="movie-card" onClick={() => handleViewMovie(movie.id)}>
                      <div className="movie-card-poster-wrapper">
                        <img src={proxyImageUrl(movie.posterUrl, 'w300')} alt={movie.title} className="movie-card-poster" loading="lazy" />
                        <div className="movie-card-rating">
                          <Star size={12} fill="var(--color-accent-gold)" color="var(--color-accent-gold)" />
                          <span>{(movie.rating || 0).toFixed(1)}</span>
                        </div>
                      </div>
                      <div className="movie-card-info">
                        <h3 className="movie-card-title">{movie.title}</h3>
                        <div className="movie-card-genre-tags">
                          {movie.genre && movie.genre.split('/').map(tag => (
                            <span key={tag} className="genre-tag">{tag.trim()}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        )}

        {/* COMING SOON VIEW */}
        {activeView === 'coming-soon' && (
          <div className="main-content">
            <div className="page-header">
              <p className="section-meta">Upcoming Releases</p>
              <h2 className="section-title" style={{ marginBottom: '0.25rem' }}>Coming Soon</h2>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '2rem' }}>Anticipated films marked as upcoming releases.</p>
            </div>
            {(() => {
              const upcoming = movies.filter(m => m.isUpcoming);
              return upcoming.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--color-text-muted)' }}>
                  <p style={{ marginBottom: '0.5rem' }}>No upcoming releases scheduled.</p>
                  <p style={{ fontSize: '0.85rem' }}>Check back later for new additions.</p>
                </div>
              ) : (
                <div className="movie-grid">
                  {upcoming.map(movie => (
                    <div key={movie.id} className="movie-card" onClick={() => handleViewMovie(movie.id)}>
                      <div className="movie-card-poster-wrapper">
                        <img src={proxyImageUrl(movie.posterUrl, 'w300')} alt={movie.title} className="movie-card-poster" loading="lazy" />
                        <div className="movie-card-rating">
                          <Star size={12} fill="var(--color-accent-gold)" color="var(--color-accent-gold)" />
                          <span>{(movie.rating || 0).toFixed(1)}</span>
                        </div>
                      </div>
                      <div className="movie-card-info">
                        <h3 className="movie-card-title">{movie.title}</h3>
                        <div className="movie-card-genre-tags">
                          <span className="genre-tag" style={{ color: 'var(--color-accent-gold)', borderColor: 'rgba(251,191,36,0.2)' }}>{movie.releaseYear}</span>
                          {movie.genre && movie.genre.split('/').map(tag => (
                            <span key={tag} className="genre-tag">{tag.trim()}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        )}

        {/* ACTOR VIEW */}
        {activeView === 'actor' && selectedActor && (
          <div className="main-content">
            <div className="page-header">
              <button className="btn-secondary" onClick={() => { setSelectedActor(null); navigateTo('home'); }} style={{ marginBottom: '1rem' }}>
                <ChevronLeft size={16} /> Back to Movies
              </button>
              <p className="section-meta">Filmography</p>
              <h2 className="section-title">{selectedActor}</h2>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '2rem' }}>
                Movies featuring this person
              </p>
            </div>
            {(() => {
              const actorMovies = movies.filter(m =>
                (m.cast && m.cast.some(c => c.name === selectedActor)) ||
                m.director === selectedActor ||
                m.writer === selectedActor
              );
              return actorMovies.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--color-text-muted)' }}>
                  <p>No movies found for this actor.</p>
                </div>
              ) : (
                <div className="movie-grid">
                  {actorMovies.map(movie => (
                    <div key={movie.id} className="movie-card" onClick={() => handleViewMovie(movie.id)}>
                      <div className="movie-card-poster-wrapper">
                        <img src={proxyImageUrl(movie.posterUrl, 'w300')} alt={movie.title} className="movie-card-poster" />
                        <div className="movie-card-rating">
                          <Star size={12} fill="var(--color-accent-gold)" color="var(--color-accent-gold)" />
                          <span>{(movie.rating || 0).toFixed(1)}</span>
                        </div>
                      </div>
                      <div className="movie-card-info">
                        <h3 className="movie-card-title">{movie.title}</h3>
                        <div className="movie-card-genre-tags">
                          <span className="genre-tag" style={{ color: 'var(--color-accent-gold)', borderColor: 'rgba(251,191,36,0.2)' }}>{movie.releaseYear}</span>
                          {movie.genre && movie.genre.split('/').map(tag => (
                            <span key={tag} className="genre-tag">{tag.trim()}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        )}

        {/* MOVIE DETAILS VIEW */}
        <MovieDetailsView
          selectedMovie={selectedMovie}
          activeView={activeView}
          watchlist={watchlist}
          currentUser={currentUser}
          watchProviders={watchProviders}
          userLists={userLists}
          showListMenu={showListMenu}
          movies={movies}
          proxyImageUrl={proxyImageUrl}
          onViewMovie={handleViewMovie}
          onToggleWatchlist={handleToggleWatchlist}
          onViewActor={handleViewActor}
          onUpvoteReview={handleUpvoteReview}
          onDeleteReview={handleDeleteReview}
          onAddReviewReply={handleAddReviewReply}
          onWatchTrailer={handleWatchTrailer}
          setIsWriteReviewOpen={setIsWriteReviewOpen}
          setShowListMenu={setShowListMenu}
          loadUserLists={loadUserLists}
          navigateTo={navigateTo}
          addMovieToList={addMovieToList}
          setAuthTab={setAuthTab}
          setIsAuthModalOpen={setIsAuthModalOpen}
        />

        {/* PROFILE VIEW */}
        {activeView === 'profile' && (
          <div className="main-content profile-view slide-up">
            
            {/* Header info box */}
            <div className="profile-card glass-panel">
              <div className="profile-main-row">
                <img src={currentUser ? currentUser.avatarUrl : userProfile.avatarUrl} alt="Avatar" className="profile-info-avatar" />
                <div className="profile-bio-box">
                  <span className="profile-badge-gold">{currentUser ? currentUser.role : userProfile.role}</span>
                  <h1 className="profile-name">{currentUser ? currentUser.username : userProfile.name}</h1>
                  <p className="profile-quote">"{currentUser ? (profileData?.bio || 'thiraipedia Film Critic') : userProfile.bio}"</p>
                  {currentUser && profileData && (
                    <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}><strong style={{ color: 'var(--color-text-main)' }}>{(profileData.followers || []).length}</strong> followers</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}><strong style={{ color: 'var(--color-text-main)' }}>{(profileData.following || []).length}</strong> following</span>
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  {currentUser && (
                    <button className="btn-primary" style={{ fontSize: '0.75rem', padding: '0.35rem 0.7rem' }} onClick={() => { setEditingProfile(true); setEditBio(profileData?.bio || ''); setEditAvatar(currentUser.avatarUrl || ''); setEditEmail(profileData?.email || ''); }}>
                      EDIT PROFILE
                    </button>
                  )}
                  {currentUser ? (
                    <button className="btn-secondary" style={{ borderColor: '#ef4444', color: '#ef4444' }} onClick={handleLogout}>
                      LOGOUT
                    </button>
                  ) : (
                    <button className="btn-secondary" onClick={() => { setAuthTab('login'); setIsAuthModalOpen(true); }}>
                      LOG IN / REGISTER
                    </button>
                  )}
                </div>
              </div>

              {/* Stats values */}
              <div className="profile-stats-grid">
                <div className="stat-box glass-panel">
                  <span className="stat-val">{profileReviews.length + 1}</span>
                  <span className="stat-lbl">Reviews Written</span>
                </div>
                <div className="stat-box glass-panel">
                  <span className="stat-val">{profileData ? (profileData.followers || []).length : userProfile.followers}</span>
                  <span className="stat-lbl">Followers</span>
                </div>
                <div className="stat-box glass-panel">
                  <span className="stat-val">{userProfile.accuracy}</span>
                  <span className="stat-lbl">Critique Accuracy</span>
                </div>
                <div className="stat-box glass-panel">
                  <span className="stat-val">{userProfile.listsCount}</span>
                  <span className="stat-lbl">Lists Curated</span>
                </div>
              </div>
            </div>

            {/* All Users / Follow */}
            {currentUser && allUsers.length > 0 && (
              <section style={{ marginTop: '2rem' }}>
                <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Critics to Follow</h2>
                <div className="profile-stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px,1fr))' }}>
                  {allUsers.filter(u => u.username !== currentUser.username).map(u => (
                    <div key={u.username} className="stat-box glass-panel" style={{ padding: '0.85rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', minWidth: 0 }}>
                        <img src={u.avatarUrl || DEFAULT_AVATAR} alt={u.username} style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                        <div style={{ minWidth: 0 }}>
                          <p style={{ fontSize: '0.82rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.username}</p>
                          <p style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>{(u.followers || []).length} followers</p>
                        </div>
                      </div>
                      {(profileData?.following || []).includes(u.username) ? (
                        <button className="btn-secondary" style={{ fontSize: '0.65rem', padding: '0.15rem 0.5rem' }} onClick={() => handleUnfollow(u.username)}>Following</button>
                      ) : (
                        <button className="btn-primary" style={{ fontSize: '0.65rem', padding: '0.15rem 0.5rem' }} onClick={() => handleFollow(u.username)}>Follow</button>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Watchlist */}
            <section className="movies-section" style={{ marginTop: '2.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.5rem' }}>My Watchlist</h2>
                <span className="critique-movie-link" onClick={() => showToast("Already viewing all records")}>View All <ChevronRight size={12} /></span>
              </div>

              {watchlist.length === 0 ? (
                <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }} className="glass-panel">
                  Your Watchlist is empty. Browse movies and click '+ Add to Watchlist' to save entries.
                </div>
              ) : (
                <div className="movie-grid">
                  {movies.filter(m => watchlist.includes(m.id)).map(movie => (
                    <div 
                      key={movie.id} 
                      className="movie-card"
                      onClick={() => handleViewMovie(movie.id)}
                    >
                      <div className="movie-card-poster-wrapper">
                        <img src={proxyImageUrl(movie.posterUrl, 'w300')} alt={movie.title} className="movie-card-poster" />
                        <div className="movie-card-rating">
                          <Star size={12} fill="var(--color-accent-gold)" color="var(--color-accent-gold)" />
                          <span>{movie.rating.toFixed(1)}</span>
                        </div>
                      </div>
                      <div className="movie-card-info">
                        <h3 className="movie-card-title">{movie.title}</h3>
                        <div className="movie-card-genre-tags">
                          {movie.genre.split('/').map(tag => (
                            <span key={tag} className="genre-tag">{tag.trim()}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Recent reviews written by this user */}
            <section style={{ marginTop: '3.5rem' }}>
              <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Recent Reviews</h2>
              
              <div className="user-reviews-list">
                {/* Default pre-seeded review of this user */}
                <div className="user-review-card glass-panel" style={{ display: 'flex', gap: '1.5rem' }}>
                  <img src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=150" alt="movie" style={{ width: '80px', height: '110px', objectFit: 'cover', borderRadius: '6px' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <h3 style={{ fontSize: '1.1rem', cursor: 'pointer' }} onClick={() => handleViewMovie('interstellar')}>Interstellar</h3>
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Written on: Oct 28, 2023</span>
                      </div>
                      <span className="review-score-badge">★ 8.0/10</span>
                    </div>
                    <p style={{ marginTop: '0.75rem', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                      "Nolan weaves a brilliant narrative that balances hard space science with profound human emotion. The visual effects remain awe-inspiring a decade later."
                    </p>
                  </div>
                </div>

                {/* Dynamically entered user reviews */}
                {profileReviews.map((rev, idx) => (
                  <div key={idx} className="user-review-card glass-panel" style={{ display: 'flex', gap: '1.5rem' }}>
                    <img src={rev.moviePoster} alt="movie" style={{ width: '80px', height: '110px', objectFit: 'cover', borderRadius: '6px' }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <h3 style={{ fontSize: '1.1rem', cursor: 'pointer' }} onClick={() => handleViewMovie(rev.movieId)}>{rev.movieTitle}</h3>
                          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Written: Just now</span>
                        </div>
                        <span className="review-score-badge">★ {rev.rating.toFixed(1)}/10</span>
                      </div>
                      <p style={{ marginTop: '0.75rem', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                        "{rev.text}"
                      </p>
                    </div>
                  </div>
                ))}
              </div>

            </section>
          </div>
        )}

        {/* LEADERBOARD VIEW */}
        {activeView === 'leaderboard' && (
          <div className="main-content">
            <div className="page-header">
              <p className="section-meta">Top Critics</p>
              <h2 className="section-title" style={{ marginBottom: '0.25rem' }}>Critic Leaderboard</h2>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '2rem' }}>
                Most active reviewers ranked by reviews and ratings
              </p>
            </div>
            {leaderboardLoading ? (
              <SectionLoader rows={5} type="list" />
            ) : leaderboard.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--color-text-muted)' }}>
                <p style={{ marginBottom: '0.5rem' }}>No critics found yet.</p>
                <p style={{ fontSize: '0.85rem' }}>Reviews need to be submitted first.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {leaderboard.map((critic, index) => (
                  <div key={critic.username} className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.25rem' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: index < 3 ? 'var(--color-accent-gold)' : 'var(--color-text-muted)', minWidth: '2rem', textAlign: 'center' }}>
                      #{index + 1}
                    </div>
                    <img
                      src={critic.avatarUrl || DEFAULT_AVATAR}
                      alt={critic.username}
                      style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover' }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>{critic.username}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                        {critic.bio || 'thiraipedia Film Critic'}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--color-accent-gold)' }}>{(critic.avgRating || 0).toFixed(1)}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{critic.reviewCount} reviews</div>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textAlign: 'right', minWidth: '4rem' }}>
                      <Users size={14} style={{ verticalAlign: 'middle', marginRight: '0.25rem' }} />
                      {critic.followerCount || 0}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* LISTS VIEW */}
        {activeView === 'lists' && (
          <div className="main-content">
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <p className="section-meta">Curated Collections</p>
                <h2 className="section-title" style={{ marginBottom: '0.25rem' }}>User Lists</h2>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '2rem' }}>
                  Movie lists created by the community
                </p>
              </div>
              {currentUser && (
                <button className="btn-primary" onClick={() => setShowCreateList(true)}>
                  <Plus size={16} /> New List
                </button>
              )}
            </div>

            {showCreateList && (
              <div className="glass-panel" style={{ marginBottom: '2rem', padding: '1.5rem' }}>
                <h3 style={{ marginBottom: '1rem' }}>Create New List</h3>
                <input
                  type="text"
                  placeholder="List name"
                  value={newListName}
                  onChange={e => setNewListName(e.target.value)}
                  style={{ width: '100%', marginBottom: '0.75rem' }}
                  className="auth-input"
                />
                <input
                  type="text"
                  placeholder="Description (optional)"
                  value={newListDesc}
                  onChange={e => setNewListDesc(e.target.value)}
                  style={{ width: '100%', marginBottom: '1rem' }}
                  className="auth-input"
                />
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className="btn-primary" onClick={handleCreateList}>Create</button>
                  <button className="btn-secondary" onClick={() => { setShowCreateList(false); setNewListName(''); setNewListDesc(''); }}>Cancel</button>
                </div>
              </div>
            )}

            {listsLoading ? (
              <SectionLoader rows={3} type="grid" />
            ) : allLists.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--color-text-muted)' }}>
                <p>No lists created yet.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '1rem' }}>
                {allLists.map(list => {
                  const listMovies = movies.filter(m => list.movieIds.includes(m.id));
                  return (
                    <div key={list.id} className="glass-panel" style={{ padding: '1rem 1.25rem', cursor: 'pointer' }} onClick={() => handleViewList(list)}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <h3 style={{ fontSize: '1.1rem', marginBottom: '0.25rem', color: 'var(--color-accent-gold)' }}>{list.name}</h3>
                          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>
                            by <strong>{list.createdBy}</strong> &middot; {list.movieIds.length} movies
                          </p>
                          {list.description && (
                            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '0.75rem' }}>{list.description}</p>
                          )}
                        </div>
                        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                          <button className="btn-primary" style={{ fontSize: '0.7rem', padding: '0.25rem 0.6rem' }} onClick={(e) => { e.stopPropagation(); handleViewList(list); }}>
                            View
                          </button>
                          {currentUser && list.createdBy === currentUser.username && (
                            <button className="btn-secondary" style={{ fontSize: '0.75rem', padding: '0.25rem 0.75rem' }} onClick={(e) => { e.stopPropagation(); handleDeleteList(list.id); }}>
                              <X size={14} /> Delete
                            </button>
                          )}
                        </div>
                      </div>
                      {listMovies.length > 0 && (
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.75rem' }}>
                          {listMovies.slice(0, 5).map(m => (
                            <div key={m.id} style={{ width: '80px', cursor: 'pointer' }} onClick={() => handleViewMovie(m.id)}>
                              <img src={proxyImageUrl(m.posterUrl, 'w185')} alt={m.title} style={{ width: '100%', borderRadius: '4px' }} />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* LIST DETAIL VIEW */}
        {activeView === 'list-detail' && selectedList && (
          <div className="main-content">
            <div className="page-header">
              <button className="btn-secondary" onClick={() => { setSelectedList(null); navigateTo('lists'); }} style={{ marginBottom: '1rem' }}>
                <ChevronLeft size={16} /> Back to Lists
              </button>
              <p className="section-meta">Curated Collection</p>
              <h2 className="section-title">{selectedList.name}</h2>
              {selectedList.description && (
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>{selectedList.description}</p>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', margin: 0 }}>
                  by <strong>{selectedList.createdBy}</strong> &middot; {selectedList.movieIds.length} movies
                </p>
                <ShareButton
                  title={selectedList.name}
                  text={`Check out "${selectedList.name}" — a curated movie list on thiraipedia`}
                  variant="icon"
                />
              </div>
            </div>
            {(() => {
              const listMovies = movies.filter(m => selectedList.movieIds.includes(m.id));
              return listMovies.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--color-text-muted)' }}>
                  <p>No movies in this list yet.</p>
                </div>
              ) : (
                <div className="movie-grid">
                  {listMovies.map(movie => (
                    <div key={movie.id} className="movie-card" onClick={() => handleViewMovie(movie.id)}>
                      <div className="movie-card-poster-wrapper">
                        <img src={proxyImageUrl(movie.posterUrl, 'w300')} alt={movie.title} className="movie-card-poster" />
                        <div className="movie-card-rating">
                          <Star size={12} fill="var(--color-accent-gold)" color="var(--color-accent-gold)" />
                          <span>{(movie.rating || 0).toFixed(1)}</span>
                        </div>
                      </div>
                      <div className="movie-card-info">
                        <h3 className="movie-card-title">{movie.title}</h3>
                        <div className="movie-card-genre-tags">
                          <span className="genre-tag" style={{ color: 'var(--color-accent-gold)', borderColor: 'rgba(251,191,36,0.2)' }}>{movie.releaseYear}</span>
                          {movie.genre && movie.genre.split('/').map(tag => (
                            <span key={tag} className="genre-tag">{tag.trim()}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        )}

        {/* OTT RELEASE CALENDAR */}
        {activeView === 'ott-calendar' && (
          <div className="main-content">
            <div className="page-header">
              <p className="section-meta">Upcoming OTT Releases</p>
              <h2 className="section-title">OTT Release Calendar</h2>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '2rem' }}>
                Movies coming soon to streaming platforms
              </p>
            </div>
            {upcomingOttMovies.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--color-text-muted)' }}>
                <p>No upcoming OTT releases scheduled yet.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {upcomingOttMovies.map(movie => (
                  <div key={movie.id} className="glass-panel" style={{ padding: '1rem', display: 'flex', gap: '1rem', alignItems: 'center', cursor: 'pointer' }}
                    onClick={() => handleViewMovie(movie.id)}>
                    <img src={proxyImageUrl(movie.posterUrl, 'w185')} alt={movie.title}
                      style={{ width: '60px', borderRadius: '6px', flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <h3 style={{ fontSize: '1rem', marginBottom: '0.2rem' }}>{movie.title}</h3>
                      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-accent-gold)', fontWeight: 700 }}>
                          {movie.ott.platform}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                          {new Date(movie.ott.releaseDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                        {movie.genre && (
                          <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
                            {movie.genre}
                          </span>
                        )}
                      </div>
                    </div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', flexShrink: 0 }}>
                      {Math.ceil((new Date(movie.ott.releaseDate) - new Date()) / (1000 * 60 * 60 * 24))} days
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* COMMUNITY FORUM VIEW */}
        {activeView === 'community' && (
          <div className="main-content community-view slide-up">
            <section className="community-hero-band">
              <div>
                <p className="section-meta">Phase 8 Community</p>
                <h1 className="community-title">thiraipedia Forum</h1>
                <p className="community-subtitle">
                  Open film discussions, recommendations, and critic notes from the thiraipedia room.
                </p>
              </div>
              <div className="community-hero-stats">
                <div>
                  <span>{communityThreads.length}</span>
                  <small>Threads</small>
                </div>
                <div>
                  <span>{communityThreads.reduce((sum, thread) => sum + thread.replies.length, 0)}</span>
                  <small>Replies</small>
                </div>
              </div>
            </section>

            <section className="community-layout">
              <form className="community-compose glass-panel" onSubmit={handleCreateThreadSubmit}>
                <div className="community-compose-header">
                  <div>
                    <p className="section-meta">Start a Thread</p>
                    <h2>New Discussion</h2>
                  </div>
                  <Users size={20} />
                </div>

                <div className="form-group">
                  <label className="form-label">Thread Title</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="What should the room talk about?"
                    value={newThreadData.title}
                    onChange={(e) => setNewThreadData({ ...newThreadData, title: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select
                    className="filter-select community-select"
                    value={newThreadData.tag}
                    onChange={(e) => setNewThreadData({ ...newThreadData, tag: e.target.value })}
                  >
                    <option value="General">General</option>
                    <option value="Recommendations">Recommendations</option>
                    <option value="Reviews">Reviews</option>
                    <option value="Sound Design">Sound Design</option>
                    <option value="Cinematography">Cinematography</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Discussion Text</label>
                  <textarea
                    className="form-textarea"
                    placeholder="Share a take, ask for recommendations, or open a debate..."
                    value={newThreadData.body}
                    onChange={(e) => setNewThreadData({ ...newThreadData, body: e.target.value })}
                    required
                  />
                </div>

                <button type="submit" className="btn-primary community-submit">
                  <Send size={16} />
                  Publish Thread
                </button>
              </form>

              <div className="community-thread-list">
                {isCommunityLoading ? (
                  <SectionLoader rows={4} type="list" />
                 ) : communityError ? (
                   <div className="community-empty glass-panel" style={{ textAlign: 'center', padding: '2rem' }}>
                     <AlertTriangle size={24} style={{ marginBottom: '1rem', color: 'var(--color-accent-red)' }} />
                     <p style={{ marginBottom: '0.75rem', fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-accent-red)' }}>
                       Unable to load discussions
                     </p>
                     <p style={{ marginBottom: '1.5rem', fontSize: '0.95rem', lineHeight: '1.6', maxWidth: '400px' }}>
                       We're having trouble loading community discussions. Please check your connection and try again.
                     </p>
                     <button onClick={loadCommunityThreads}
                       className="btn-outline" style={{ padding: '0.6rem 1.2rem', border: '1px solid var(--color-border)' }}>
                       <RefreshCw size={16} /> Try Again
                     </button>
                   </div>
                 ) : communityThreads.length === 0 ? (
                   <div className="community-empty glass-panel" style={{ textAlign: 'center', padding: '3rem' }}>
                     <Users size={48} style={{ marginBottom: '1.5rem', opacity: 0.5 }} />
                     <p style={{ marginBottom: '0.75rem', fontSize: '1.1rem', fontWeight: 600 }}>
                       No discussions yet
                     </p>
                     <p style={{ marginBottom: '2rem', fontSize: '0.95rem', lineHeight: '1.6', maxWidth: '500px' }}>
                       Be the first to start a conversation! Share your thoughts on movies, ask questions, or connect 
                       with other film enthusiasts in our community.
                     </p>
                     <button onClick={() => { setIsAuthModalOpen(true); setAuthTab('login'); }}
                       className="btn-primary" style={{ padding: '0.75rem 1.5rem', fontSize: '0.9rem' }}>
                       <Users size={16} /> Sign In to Start
                     </button>
                   </div>
                ) : (
                  communityThreads.map(thread => (
                    <article key={thread.id} className="community-thread glass-panel">
                      <div className="community-thread-header">
                        <img src={thread.avatarUrl || DEFAULT_AVATAR} alt={thread.author} className="reviewer-avatar" />
                        <div>
                          <div className="community-thread-meta">
                            <span>{thread.author}</span>
                            <small>{thread.role} • {thread.timestamp}</small>
                          </div>
                          <h2>{thread.title}</h2>
                        </div>
                        <span className="community-tag">{thread.tag}</span>
                      </div>

                      <p className="community-thread-body">{thread.body}</p>

                      <div className="community-thread-actions">
                        <span><ThumbsUp size={14} /> {thread.likes || 0}</span>
                        <span><MessageSquare size={14} /> {thread.replies.length}</span>
                      </div>

                      {thread.replies.length > 0 && (
                        <div className="community-replies">
                          {thread.replies.slice(-3).map(reply => (
                            <div key={reply.id} className="community-reply">
                              <strong>{reply.author}</strong>
                              <span>{reply.body}</span>
                              <small>{reply.timestamp}</small>
                            </div>
                          ))}
                        </div>
                      )}

                      <form className="community-reply-form" onSubmit={(e) => handleCreateReplySubmit(thread.id, e)}>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="Write a reply..."
                          value={replyDrafts[thread.id] || ''}
                          onChange={(e) => setReplyDrafts(prev => ({ ...prev, [thread.id]: e.target.value }))}
                        />
                        <button type="submit" className="btn-secondary">
                          <Send size={14} />
                        </button>
                      </form>
                    </article>
                  ))
                )}
              </div>
            </section>
          </div>
        )}

        {/* QUIZ VIEW */}
        {activeView === 'quiz' && (
          <div className="main-content" style={{ padding: '2rem 1.5rem', maxWidth: '800px', margin: '0 auto' }}>
            <QuizGame movies={movies} onViewMovie={handleViewMovie} />
          </div>
        )}

        {/* SPIN WHEEL VIEW */}
        {activeView === 'wheel' && (
          <div className="main-content" style={{ padding: '2rem 1.5rem', maxWidth: '900px', margin: '0 auto' }}>
            <SpinWheel movies={movies} onViewMovie={handleViewMovie} />
          </div>
        )}

        {/* BLIND FRAME VIEW */}
        {activeView === 'blind-frame' && (
          <div className="main-content" style={{ padding: '2rem 1.5rem', maxWidth: '800px', margin: '0 auto' }}>
            <BlindFrame movies={movies} onViewMovie={handleViewMovie} />
          </div>
        )}

        {/* MOOD MATCHER VIEW */}
        {activeView === 'mood-matcher' && (
          <div className="main-content" style={{ padding: '2rem 1.5rem', maxWidth: '800px', margin: '0 auto' }}>
            <MoodMatcher movies={movies} onViewMovie={handleViewMovie} />
          </div>
        )}

        {/* CINE UPDATES REELS OVERLAY */}
        {showCineReels && (
          <CineUpdates
            updates={cineUpdates}
            onLike={handleCineUpdateLike}
            onShare={handleCineUpdateShare}
            currentUser={currentUser}
            onBack={() => setShowCineReels(false)}
            onNavigate={navigateTo}
          />
        )}

        {/* WELCOME ONBOARDING POPUP */}
        {showWelcome && (
          <WelcomePopup onClose={() => {
            localStorage.setItem('welcomeSeen', '1');
            setShowWelcome(false);
          }} />
        )}

        {/* ADMIN CONTROL PANEL VIEW */}
        {activeView === 'admin' && currentUser && currentUser.role === 'admin' && (
          <AdminPanel currentUser={currentUser} />
        )}

        {/* LEGAL PAGES */}
        {activeView === 'privacy' && <LegalPage page="privacy" onNavigate={navigateTo} />}
        {activeView === 'terms' && <LegalPage page="terms" onNavigate={navigateTo} />}
        {activeView === 'contact' && <ContactPage onNavigate={navigateTo} />}
        {activeView === 'about' && <AboutPage onNavigate={navigateTo} />}
        {activeView === 'articles' && <ArticlesPage onNavigate={navigateTo} />}
        {activeView === 'article-detail' && selectedArticleId && <ArticleDetail articleId={selectedArticleId} onNavigate={navigateTo} />}
      </div>

      {/* FOOTER SECTION */}
      <Footer
        onNavigate={navigateTo}
        onLoadLeaderboard={loadLeaderboard}
        onLoadLists={loadAllLists}
      />

      {/* MODAL - WRITE REVIEW */}
      <Modal isOpen={isWriteReviewOpen && !!selectedMovie} onClose={() => setIsWriteReviewOpen(false)} width="520px">
        <div style={{ padding: '0.25rem 0' }}>
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(251, 191, 36, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem' }}>
              <Edit3 size={22} style={{ color: 'var(--color-accent-gold)' }} />
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>Write a Review</h3>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', marginTop: '0.25rem' }}>for <strong>{selectedMovie?.title}</strong></p>
          </div>

          <form onSubmit={handleCreateReviewSubmit}>
            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label" style={{ textAlign: 'center', display: 'block', marginBottom: '0.75rem', fontSize: '0.85rem' }}>
                Your Rating: <strong style={{ color: 'var(--color-accent-gold)', fontSize: '1.1rem' }}>{newReviewData.rating}</strong>/10
              </label>
              <div className="star-rating-input-row" style={{ justifyContent: 'center', gap: '0.35rem' }}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((starNum) => (
                  <button
                    key={starNum} type="button"
                    className={`star-input-btn ${newReviewData.rating >= starNum ? 'active' : ''}`}
                    onClick={() => setNewReviewData({ ...newReviewData, rating: starNum })}>
                    <Star size={22} fill={newReviewData.rating >= starNum ? 'var(--color-accent-gold)' : 'none'} />
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label">Your Review</label>
              <textarea className="form-textarea" placeholder="Share your critical perspective on this film..."
                value={newReviewData.text} onChange={(e) => setNewReviewData({ ...newReviewData, text: e.target.value })}
                required style={{ minHeight: '120px', borderRadius: '12px' }} />
            </div>

            <div className="form-actions-row" style={{ gap: '0.75rem', marginTop: '0.5rem' }}>
              <button type="button" className="btn-secondary" onClick={() => setIsWriteReviewOpen(false)}
                style={{ padding: '0.7rem 1.25rem', fontSize: '0.85rem', fontWeight: 600 }}>
                Cancel
              </button>
              <button type="submit" className="btn-primary"
                style={{ padding: '0.7rem 1.5rem', fontSize: '0.85rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                <Send size={14} /> Submit Review
              </button>
            </div>
          </form>
        </div>
      </Modal>



      {/* TRAILER MODAL POPUP */}
      <Modal isOpen={showTrailer} onClose={() => setShowTrailer(false)} width="800px">
        <div style={{ padding: '0.25rem 0' }}>
           <div className="trailer-header-info" style={{ padding: '0 0.25rem 0.75rem' }}>
             <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>{selectedMovie?.title}</h2>
             <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.2rem' }}>
               <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>{selectedMovie?.trailerChannelName || 'YouTube'}</span>
               <span style={{ fontSize: '0.6rem', color: 'rgba(148,163,184,0.4)' }}>·</span>
               <span style={{ fontSize: '0.68rem', color: 'var(--color-accent-gold)', fontWeight: 600 }}>Official Trailer</span>
             </div>
             <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
               <label style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.85rem', color: 'var(--color-text-muted)', cursor: 'pointer' }}>
                 <input
                   type="checkbox"
                   checked={trailerAutoplayPreference}
                   onChange={(e) => {
                     setTrailerAutoplayPreference(e.target.checked);
                     localStorage.setItem('mc_trailer_autoplay', e.target.checked);
                   }}
                 />
                 <span>Autoplay trailer</span>
               </label>
             </div>
            </div>
           {selectedMovie?.trailerUrl ? (
             <div style={{ position: 'relative' }}>
               {/* Pre-roll ad overlay */}
               {trailerPreRoll && (
                 <div className="preroll-overlay">
                    {PRE_ROLL_VIDEO_SRC ? (
                      <>
                        {PRE_ROLL_VIDEO_SRC.includes('player.vimeo.com') ? (
                          <iframe
                            title="pre-roll"
                            src={PRE_ROLL_VIDEO_SRC}
                            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }}
                            referrerPolicy="strict-origin-when-cross-origin"
                            allow="autoplay; fullscreen; picture-in-picture"
                            allowFullScreen
                          />
                        ) : (
                          <video
                            ref={preRollVideoRef}
                            src={PRE_ROLL_VIDEO_SRC}
                            muted
                            playsInline
                            autoPlay
                            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                            onEnded={() => {
                              if (preRollTimerRef.current) clearInterval(preRollTimerRef.current);
                              setTrailerPreRoll(false);
                            }}
                          />
                        )}
                        <div className="preroll-content" style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', padding: 0, gap: 0 }}>
                          <button className="preroll-skip-btn" onClick={() => {
                            if (preRollVideoRef.current && typeof preRollVideoRef.current.pause === 'function') {
                              preRollVideoRef.current.pause();
                              preRollVideoRef.current.currentTime = 0;
                            }
                            if (preRollTimerRef.current) clearInterval(preRollTimerRef.current);
                            setTrailerPreRoll(false);
                          }}>
                            Skip Ad
                          </button>
                        </div>
                      </>
                    ) : (
                     <>
                       <div className="preroll-content">
                         <div className="preroll-badge">Ad</div>
                         <div className="preroll-icon">🎬</div>
                         <p className="preroll-text">Sponsored Content</p>
                         <p className="preroll-sub">This ad will end in 5 seconds</p>
                         <button className="preroll-skip-btn" onClick={() => setTrailerPreRoll(false)}>
                           Skip Ad
                         </button>
                       </div>
                       <div className="preroll-timer">
                         <div className="preroll-timer-bar" />
                       </div>
                     </>
                   )}
                 </div>
               )}
             <div
              ref={playerContainerRef}
              className="trailer-player-wrapper"
              style={{ position: 'relative', paddingBottom: '56.25%', borderRadius: '12px', overflow: 'hidden', background: '#000', cursor: 'pointer' }}
            >
              {/* progress bar (top edge) */}
              <div
                onClick={seekTo}
                style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'rgba(255,255,255,0.1)', zIndex: 10, cursor: 'pointer' }}
              >
                <div style={{ width: `${trailerPlayer.duration ? (trailerPlayer.currentTime / trailerPlayer.duration) * 100 : 0}%`, height: '100%', background: 'var(--color-accent-gold)', transition: 'width 0.1s linear' }} />
              </div>
              {/* custom controls overlay */}
              <div className="trailer-controls-overlay" style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '0.6rem 0.75rem', background: 'linear-gradient(transparent, rgba(0,0,0,0.7))', zIndex: 10, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <button onClick={togglePlay} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: '0.2rem', display: 'flex' }}>
                  {trailerPlayer.playing ? <Pause size={18} fill="#fff" /> : <Play size={18} fill="#fff" />}
                </button>
                {/* progress bar */}
                <div
                  onClick={seekTo}
                  style={{ flex: 1, height: '4px', background: 'rgba(255,255,255,0.15)', borderRadius: '2px', cursor: 'pointer', position: 'relative' }}
                >
                  <div style={{ width: `${trailerPlayer.duration ? (trailerPlayer.currentTime / trailerPlayer.duration) * 100 : 0}%`, height: '100%', background: '#fff', borderRadius: '2px', transition: 'width 0.1s linear' }} />
                </div>
                <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.7)', fontVariantNumeric: 'tabular-nums', minWidth: '55px' }}>
                  {formatTime(trailerPlayer.currentTime)} / {formatTime(trailerPlayer.duration)}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Volume2 size={14} color="rgba(255,255,255,0.7)" />
                  <input type="range" min="0" max="100" value={trailerPlayer.volume}
                    onChange={setVolume}
                    style={{ width: '50px', height: '3px', accentColor: '#fff', cursor: 'pointer' }}
                  />
                </div>
                <button onClick={toggleFullscreen} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: '0.2rem', display: 'flex' }}>
                  <Maximize size={14} />
                </button>
              </div>
            </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
              <p style={{ marginBottom: '0.5rem' }}>No trailer available for this film.</p>
              <p style={{ fontSize: '0.85rem' }}>Add a YouTube link in the admin panel.</p>
            </div>
          )}
        </div>
      </Modal>

      {/* CURATE STAFF PICKS MODAL */}
      <Modal isOpen={showCurateModal} onClose={() => setShowCurateModal(false)} title="Curate Staff Picks" width="640px">
        <div>
          <div style={{ marginBottom: '1rem' }}>
            <input
              className="admin-input"
              placeholder="Search movies..."
              onChange={e => {
                const q = e.target.value.toLowerCase();
                setCurationMovies(q ? movies.filter(m => m.title.toLowerCase().includes(q)) : []);
              }}
              style={{ width: '100%' }}
            />
          </div>
          <div style={{ maxHeight: '400px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {(curationMovies.length > 0 ? curationMovies : movies).slice(0, 30).map(movie => (
              <div key={movie.id} className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0.75rem' }}>
                <img src={proxyImageUrl(movie.posterUrl, 'w92')} alt={movie.title} style={{ width: '36px', height: '54px', borderRadius: '4px', objectFit: 'cover' }} />
                <div style={{ flex: 1, fontSize: '0.85rem', fontWeight: 600 }}>{movie.title}</div>
                <span
                  onClick={() => handleCurate(movie.id, { isStaffPick: !movie.isStaffPick, staffPickType: movie.isStaffPick ? '' : 'grid' })}
                  style={{ fontSize: '0.7rem', cursor: 'pointer', padding: '0.2rem 0.5rem', borderRadius: '4px', background: movie.isStaffPick ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.03)', border: movie.isStaffPick ? '1px solid rgba(99,102,241,0.3)' : '1px solid rgba(255,255,255,0.06)', color: movie.isStaffPick ? '#a5b4fc' : 'var(--color-text-muted)' }}>
                  {movie.isStaffPick ? 'Staff Pick ✓' : 'Add Pick'}
                </span>
                {movie.isStaffPick && (
                  <select value={movie.staffPickType || 'grid'} onChange={e => handleCurate(movie.id, { staffPickType: e.target.value })}
                    style={{ fontSize: '0.65rem', padding: '0.15rem 0.3rem', borderRadius: '4px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', color: '#94a3b8' }}
                    onClick={e => e.stopPropagation()}>
                    <option value="grid">Grid</option>
                    <option value="featured">Featured</option>
                  </select>
                )}
              </div>
            ))}
          </div>
        </div>
      </Modal>

      {/* PROFILE EDIT MODAL */}
      <Modal isOpen={editingProfile} onClose={() => setEditingProfile(false)} width="480px">
        <div style={{ padding: '0.5rem 0' }}>
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Edit Profile</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label className="admin-label">Bio</label>
              <textarea className="admin-textarea" rows={3} value={editBio} onChange={e => setEditBio(e.target.value)} placeholder="Tell other critics about yourself..." />
            </div>
            <div>
              <label className="admin-label">Avatar URL</label>
              <input className="admin-input" value={editAvatar} onChange={e => setEditAvatar(e.target.value)} placeholder="https://..." />
            </div>
            <div>
              <label className="admin-label">Email</label>
              <input className="admin-input" value={editEmail} onChange={e => setEditEmail(e.target.value)} placeholder="email@example.com" />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
            <button className="btn-secondary" style={{ fontSize: '0.8rem', padding: '0.4rem 0.85rem' }} onClick={() => setEditingProfile(false)}>Cancel</button>
            <button className="btn-primary" style={{ fontSize: '0.8rem', padding: '0.4rem 0.85rem' }} onClick={handleSaveProfile}>Save Changes</button>
          </div>
        </div>
      </Modal>

      {/* MODAL - LOGIN / REGISTER */}
      {isAuthModalOpen && (
        <div className="modal-overlay" onClick={() => { if (!isAuthLoading) { setIsAuthModalOpen(false); setAuthError(''); } }}>
          <div className="modal-content-panel auth-card-premium" style={{ maxWidth: '400px', padding: '1.75rem' }} onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', zIndex: 10 }} onClick={() => { setIsAuthModalOpen(false); setAuthError(''); }} disabled={isAuthLoading}>
              <X size={18} />
            </button>

            {/* Header */}
            <div className="auth-header-ticket">
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginTop: '0.25rem', letterSpacing: '-0.02em' }}>
                {authTab === 'login' ? 'Login' : 'Sign Up'}
              </h2>
            </div>

            {/* Tabs */}
            <div className="auth-capsule-tabs">
              <button 
                type="button" 
                className={`auth-capsule-tab ${authTab === 'login' ? 'auth-capsule-tab--active' : ''}`}
                onClick={() => { if (!isAuthLoading) setTabAndClearForm('login'); }}
                disabled={isAuthLoading}
              >
                Login
              </button>
              <button 
                type="button" 
                className={`auth-capsule-tab ${authTab === 'register' ? 'auth-capsule-tab--active' : ''}`}
                onClick={() => { if (!isAuthLoading) setTabAndClearForm('register'); }}
                disabled={isAuthLoading}
              >
                Sign Up
              </button>
            </div>

            <form onSubmit={handleAuthSubmit}>
              <div className="modal-body" style={{ padding: '0 0.25rem' }}>
                {authError && (
                  <div className="auth-error-box" style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    background: 'rgba(239, 68, 68, 0.08)',
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                    color: '#f87171',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '8px',
                    fontSize: '0.8rem',
                    marginBottom: '1rem',
                    lineHeight: 1.4
                  }}>
                    <Info size={14} style={{ flexShrink: 0 }} />
                    <span>{authError}</span>
                  </div>
                )}

                <div className="auth-field-wrapper">
                  <User size={16} className="auth-field-icon" />
                  <input 
                    type="text" 
                    className="auth-field-input" 
                    placeholder="Username"
                    value={authFormData.username}
                    onChange={(e) => setAuthFormData({ ...authFormData, username: e.target.value })}
                    required 
                    disabled={isAuthLoading}
                  />
                </div>

                {authTab === 'register' && (
                  <div className="auth-field-wrapper">
                    <Mail size={16} className="auth-field-icon" />
                    <input 
                      type="email" 
                      className="auth-field-input" 
                      placeholder="Email"
                      value={authFormData.email || ''}
                      onChange={(e) => setAuthFormData({ ...authFormData, email: e.target.value })}
                      required={authTab === 'register'} 
                      disabled={isAuthLoading}
                    />
                  </div>
                )}

                <div className="auth-field-wrapper" style={{ position: 'relative' }}>
                  <Lock size={16} className="auth-field-icon" />
                  <input 
                    type={showPassword ? 'text' : 'password'} 
                    className="auth-field-input" 
                    placeholder="Password"
                    value={authFormData.password}
                    onChange={(e) => setAuthFormData({ ...authFormData, password: e.target.value })}
                    required 
                    disabled={isAuthLoading}
                  />
                  <button
                    type="button"
                    style={{
                      position: 'absolute',
                      right: '1rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--color-text-muted)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: 0,
                      zIndex: 10
                    }}
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isAuthLoading}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                {authTab === 'register' && (
                  <div className="auth-password-strength" style={{
                    fontSize: '0.75rem',
                    color: authFormData.password.length >= 6 ? 'var(--color-accent-gold)' : 'var(--color-text-muted)',
                    marginTop: '-0.75rem',
                    marginBottom: '1.25rem',
                    paddingLeft: '0.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    transition: 'color 0.3s ease'
                  }}>
                    <div style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: authFormData.password.length >= 6 ? 'var(--color-accent-gold)' : '#475569',
                      boxShadow: authFormData.password.length >= 6 ? '0 0 8px var(--color-accent-gold)' : 'none',
                      transition: 'all 0.3s ease'
                    }} />
                    <span>{authFormData.password.length >= 6 ? 'Password okay' : 'Min 6 characters'}</span>
                  </div>
                )}

                <button 
                  type="submit" 
                  className="btn-primary btn-auth-submit"
                  disabled={isAuthLoading}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    opacity: isAuthLoading ? 0.8 : 1
                  }}
                >
                  {isAuthLoading ? (
                    <>
                      <span className="auth-spinner" />
                      <span>Loading...</span>
                    </>
                  ) : (
                    <span>{authTab === 'login' ? 'Login' : 'Sign Up'}</span>
                  )}
                </button>

                <p className="auth-footer-toggle">
                  {authTab === 'login' ? "Don't have an account?" : "Already have an account?"}
                  <span 
                    onClick={() => { if (!isAuthLoading) setTabAndClearForm(authTab === 'login' ? 'register' : 'login'); }}
                  >
                    {authTab === 'login' ? 'Sign Up' : 'Login'}
                  </span>
                </p>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


