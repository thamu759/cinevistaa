import { useState, useEffect, useRef, useCallback, useMemo, lazy, Suspense } from 'react';
import { useNavigate, useLocation, Link, ScrollRestoration } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { 
  Play, Pause, Plus, Search, Star, User, Film,
  ThumbsUp, MessageSquare, X, ChevronLeft, ChevronRight, ChevronDown, Compass, Bookmark, Calendar, Award, Gamepad2, Layers,
  Edit3, Check, Info, Lock, Mail, Eye, EyeOff,
  Users, Send, Volume2, Maximize, List,
  AlertTriangle, RefreshCw, Bell, BellOff,
  Tv, Zap, Newspaper, ShieldCheck, LogOut, LogIn, Sparkles,
  ExternalLink, Flame
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
  deleteList,
  fetchLeaderboard,
  curateMovie,
  fetchWatchProviders,
  deleteReview,
  toggleReviewLike,
  addReviewReply,
  fetchCineUpdates,
  toggleCineUpdateLike,
  addOttAlert,
  removeOttAlert,
  fetchUserOttAlerts,
  loginWithGoogle,
  fetchWatchlist,
  addMovieToWatchlist,
  removeMovieFromWatchlist,
  mergeWatchlist,
  fetchSiteSettings,
  fetchCmsPages
} from './api';
import AdminPanel from './components/AdminPanel';
import DynamicCmsPage from './components/DynamicCmsPage';
import Modal from './components/Modal';
import Footer from './components/Footer';
import MovieDetailsView from './components/MovieDetailsView';
import MovieCard from './components/MovieCard';
import MovieGrid, { LoadingGrid } from './components/MovieGrid';
import MovieSection from './components/MovieSection';
import MovieLogo from './components/MovieLogo';
import WelcomePopup from './components/WelcomePopup';
import ProfileView from './components/ProfileView';
import EditProfileModal from './components/EditProfileModal';
import CineShowcasePromo from './components/CineShowcasePromo';
import AuthModal from './components/AuthModal';
import brandLogo from './assets/Thiraipedia White Logo with Yellow.png';

const LegalPage = lazy(() => import('./components/LegalPage'));
const ContactPage = lazy(() => import('./components/ContactPage'));
const AboutPage = lazy(() => import('./components/AboutPage'));
const ArticlesPage = lazy(() => import('./components/ArticlesPage'));
const ArticleDetail = lazy(() => import('./components/ArticleDetail'));
const ShareButton = lazy(() => import('./components/ShareButton'));
const SpinWheel = lazy(() => import('./components/SpinWheel'));
const QuizGame = lazy(() => import('./components/QuizGame'));
const BlindFrame = lazy(() => import('./components/BlindFrame'));
const MoodMatcher = lazy(() => import('./components/MoodMatcher'));
const CineUpdates = lazy(() => import('./components/CineUpdates'));
const ReviewSharePopup = lazy(() => import('./components/ReviewSharePopup'));

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
  const [currentHeroIndex, setCurrentHeroIndex] = useState(0);
  const [siteSettings, setSiteSettings] = useState(null);
  const [cmsPages, setCmsPages] = useState([]);
  const [selectedPageSlug, setSelectedPageSlug] = useState('');
  const [isAnnouncementDismissed, setIsAnnouncementDismissed] = useState(false);
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
  const [showReviewShare, setShowReviewShare] = useState(false);
  const [lastReviewShare, setLastReviewShare] = useState(null);

  // Mobile Menu State
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const moreMenuRef = useRef(null);

  const navigate = useNavigate();
  const location = useLocation();

  // Close mobile drawer on route transition
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Lock background body scroll when mobile drawer is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  const SectionLoader = ({ rows = 4, type = 'grid' }) => (
    <div className="fade-in">
      {type === 'grid' ? (
        <LoadingGrid count={rows * 3} />
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

      const posterUrl = selectedMovie.posterUrl
        ? proxyImageUrl(selectedMovie.posterUrl, 'w500')
        : '';
      let el = document.querySelector('meta[property="og:image"]');
      if (el) el.setAttribute('content', posterUrl);
      el = document.querySelector('meta[name="twitter:image"]');
      if (el) el.setAttribute('content', posterUrl);
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

  // Sticky Navbar Scrolled State with Hysteresis & rAF throttling (Zero glitch/chatter)
  const [isScrolled, setIsScrolled] = useState(false);
  const isScrolledRef = useRef(false);

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrollPos = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || window.scrollY || 0;

          const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;
          // Adaptive hysteresis thresholds:
          // Mobile: scroll down past 40px to compact, scroll up past 15px to expand
          // Desktop: scroll down past 60px to compact, scroll up past 20px to expand
          const downThreshold = isMobile ? 40 : 60;
          const upThreshold = isMobile ? 15 : 20;

          if (!isScrolledRef.current && scrollPos > downThreshold) {
            isScrolledRef.current = true;
            setIsScrolled(true);
          } else if (isScrolledRef.current && scrollPos < upThreshold) {
            isScrolledRef.current = false;
            setIsScrolled(false);
          }

          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    document.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('scroll', handleScroll);
    };
  }, []);

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
    const teluguScrollRef = useRef(null);
    const kannadaScrollRef = useRef(null);
    const hindiScrollRef = useRef(null);
    const englishScrollRef = useRef(null);
    const topRatedScrollRef = useRef(null);
    const trendingScrollRef = useRef(null);
    const recommendedScrollRef = useRef(null);


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
           controls: 1,
           modestbranding: 1,
           rel: 0,
           showinfo: 0,
           iv_load_policy: 3,
           autoplay: trailerAutoplayPreference ? 1 : 0,
           playsinline: 1,
           origin: typeof window !== 'undefined' ? window.location.origin : undefined
         },
        events: {
          onReady: (e) => {
            setTrailerPlayer(prev => ({ ...prev, duration: e.target.getDuration(), playing: true }));
            if (trailerAutoplayPreference) {
              e.target.playVideo();
            }
          },
          onStateChange: (e) => {
            setTrailerPlayer(prev => ({ ...prev, playing: e.data === window.YT.PlayerState.PLAYING }));
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

  // User Profile Custom Info
  const [userProfile] = useState({
    name: "Guest",
    role: "Cinema Enthusiast",
    avatarUrl: DEFAULT_AVATAR,
    bio: "Film lover exploring cinema on thiraipedia.",
    followers: "0",
    accuracy: "0%",
    listsCount: 0
  });

  const [profileData, setProfileData] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [editingProfile, setEditingProfile] = useState(false);
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
  const [userOttAlerts, setUserOttAlerts] = useState([]);
  const [cineUpdates, setCineUpdates] = useState([]);
  const [cineUpdatesLoading, setCineUpdatesLoading] = useState(false);
  const [showCineReels, setShowCineReels] = useState(false);
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

  // Merge localStorage watchlist with the logged-in user's server watchlist
  const syncWatchlistFromServer = useCallback(async () => {
    try {
      const { watchlist: serverList } = await fetchWatchlist();
      const saved = localStorage.getItem('mc_watchlist');
      const local = saved ? JSON.parse(saved) : [];
      const merged = [...new Set([...(serverList || []), ...(Array.isArray(local) ? local : [])])];
      setWatchlist(merged);
      localStorage.setItem('mc_watchlist', JSON.stringify(merged));
      try {
        await mergeWatchlist(merged);
      } catch (syncErr) {
        console.warn('Watchlist merge to server failed:', syncErr);
      }
    } catch (err) {
      console.warn('Watchlist fetch failed:', err);
    }
  }, []);

  // ─── Google Sign-In ───
  const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
  const googleBtnRef = useRef(null);
  const handleGoogleCredentialResponse = async (response) => {
    if (!response?.credential) return;
    setIsAuthLoading(true);
    setAuthError('');
    try {
      const user = await loginWithGoogle(response.credential);
      localStorage.setItem('mc_token', user.token);
      setCurrentUser(user);
      setIsAuthModalOpen(false);
      setAuthFormData({ username: '', email: '', password: '' });
      showToast(user.isNew ? `Welcome to ThiraiPedia, ${user.username || 'critic'}!` : `Welcome back, ${user.username || 'critic'}!`);
      syncWatchlistFromServer();
    } catch (err) {
      setAuthError(err.message || 'Google login failed.');
    } finally {
      setIsAuthLoading(false);
    }
  };
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || !isAuthModalOpen) return;
    let cancelled = false;
    const initGoogle = () => {
      if (cancelled || !googleBtnRef.current || !window.google?.accounts?.id) return;
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleCredentialResponse,
      });
      if (googleBtnRef.current.firstChild) googleBtnRef.current.innerHTML = '';
      window.google.accounts.id.renderButton(googleBtnRef.current, {
        theme: 'outline',
        size: 'large',
        width: 300,
        text: 'continue_with',
        shape: 'pill',
      });
    };
    if (window.google?.accounts?.id) {
      initGoogle();
    } else {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = initGoogle;
      document.body.appendChild(script);
    }
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [GOOGLE_CLIENT_ID, isAuthModalOpen]);

  // Fetch OTT alerts when user changes
  useEffect(() => {
    if (currentUser) {
      fetchUserOttAlerts()
        .then(data => setUserOttAlerts(data))
        .catch(() => {});
    } else {
      setUserOttAlerts([]);
    }
  }, [currentUser]);

  // Fetch profile data and all users when showing profile
  useEffect(() => {
    if (activeView !== 'profile') return;
    if (currentUser) {
      fetchUserProfile(currentUser.username)
        .then(data => setProfileData(data))
        .catch(() => setProfileLoadError('Failed to load profile'));
      loadUserLists();
    }
    fetchPublicUsers()
      .then(data => setAllUsers(data))
      .catch(() => {});
  }, [activeView, currentUser]);

  const handleSaveProfile = async ({ bio, avatarUrl, email }) => {
    try {
      const updated = await updateUserProfile({ bio, avatarUrl, email });
      setProfileData(updated);
      setCurrentUser(prev => prev ? { ...prev, avatarUrl: updated.avatarUrl, email: updated.email } : prev);
      setEditingProfile(false);
      showToast('Profile updated successfully', 'success');
    } catch (err) {
      setProfileLoadError(err.message);
      showToast(err.message || 'Failed to update profile', 'error');
      throw err;
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

  // ─── OTT ALERTS ───
  const handleToggleOttAlert = async (movie, e) => {
    if (e) e.stopPropagation();
    if (!currentUser) { setAuthTab('login'); setIsAuthModalOpen(true); return; }
    const isAlerted = userOttAlerts.some(a => a.movieId === movie.id);
    try {
      if (isAlerted) {
        await removeOttAlert(movie.id);
        setUserOttAlerts(prev => prev.filter(a => a.movieId !== movie.id));
        showToast('Alert removed');
      } else {
        const result = await addOttAlert({
          movieId: movie.id,
          movieTitle: movie.title,
          platform: movie.ott?.platform,
          releaseDate: movie.ott?.releaseDate
        });
        setUserOttAlerts(result.ottAlerts);
        showToast('We\'ll notify you on release day!');
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
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
  }, [selectedGenre, sortOption]);

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
    loadCineUpdates();
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
  const teluguMovies = movies.filter(m => normalizeLang(m.language) === 'TELUGU');
  const kannadaMovies = movies.filter(m => normalizeLang(m.language) === 'KANNADA');
  const hindiMovies = movies.filter(m => normalizeLang(m.language) === 'HINDI');
  const englishMovies = movies.filter(m => normalizeLang(m.language) === 'ENGLISH');
  const topRatedMovies = [...movies].filter(m => m.rating >= 7).sort((a, b) => b.rating - a.rating);
  const upcomingOttMovies = movies
    .filter(m => m.ott?.platform && m.ott?.releaseDate && new Date(m.ott.releaseDate) > new Date())
    .sort((a, b) => new Date(a.ott.releaseDate) - new Date(b.ott.releaseDate));

  // Trending Now: recently added movies sorted by review count then rating
  const trendingMovies = useMemo(() => {
    const recent = [...movies]
      .filter(m => !m.isUpcoming)
      .sort((a, b) => {
        const aCount = a.reviews?.length || 0;
        const bCount = b.reviews?.length || 0;
        if (bCount !== aCount) return bCount - aCount;
        return b.rating - a.rating;
      });
    return recent.slice(0, 12);
  }, [movies]);

  // Recommendations: genres from watchlist movies, find similar not-yet-in-watchlist
  const recommendedMovies = useMemo(() => {
    if (!watchlist.length) return [];
    const watchlistMovies = movies.filter(m => watchlist.includes(m.id));
    const preferredGenres = new Set();
    watchlistMovies.forEach(m => {
      (m.genre || '').split(',').map(g => g.trim()).forEach(g => preferredGenres.add(g));
    });
    const preferredLangs = new Set();
    watchlistMovies.forEach(m => { if (m.language) preferredLangs.add(m.language.toLowerCase()); });
    const wlIds = new Set(watchlist);
    const scored = movies
      .filter(m => !wlIds.has(m.id) && !m.isUpcoming)
      .map(m => {
        let score = 0;
        (m.genre || '').split(',').map(g => g.trim()).forEach(g => { if (preferredGenres.has(g)) score += 2; });
        if (preferredLangs.has((m.language || '').toLowerCase())) score += 1;
        score += m.rating / 5;
        return { ...m, _recScore: score };
      })
      .filter(m => m._recScore > 0)
      .sort((a, b) => b._recScore - a._recScore);
    return scored.slice(0, 12);
  }, [movies, watchlist]);

  // Reset index if out of range when list changes
  const hasCinePulse = Boolean(cineUpdates && cineUpdates.length > 0);
  const heroTotalSlides = (hasCinePulse ? 1 : 0) + heroMovies.length;
  useEffect(() => {
    if (currentHeroIndex >= heroTotalSlides && heroTotalSlides > 0) {
      setCurrentHeroIndex(0);
    }
  }, [heroTotalSlides, currentHeroIndex]);

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
    if (heroTotalSlides <= 1) return;
    const interval = setInterval(() => {
      if (!isHoveringRef.current) {
        setCurrentHeroIndex(prev => (prev + 1) % heroTotalSlides);
      }
    }, 6500);
    return () => clearInterval(interval);
  }, [heroTotalSlides]);

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
          syncWatchlistFromServer();
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
  }, [syncWatchlistFromServer]);

  const getRouteFromPath = (pathname) => {
    const path = pathname.replace(/\/+$/, '') || '/';
    if (path === '/') return { view: 'home' };
    if (path === '/login') return { view: 'home', openAuth: 'login' };
    if (path === '/signup' || path === '/register') return { view: 'home', openAuth: 'register' };
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
    if (path === '/newsletter') return { view: 'newsletter' };
    if (path === '/critic-guidelines' || path === '/guidelines') return { view: 'cms-page', pageSlug: 'critic-guidelines' };
    if (path === '/faq') return { view: 'cms-page', pageSlug: 'faq' };
    if (path === '/articles' || path === '/blog') return { view: 'articles' };
    if (path === '/quiz') return { view: 'quiz' };
    if (path === '/wheel') return { view: 'wheel' };
    if (path === '/blind-frame') return { view: 'blind-frame' };
    if (path === '/mood-matcher') return { view: 'mood-matcher' };
    if (path === '/cine-updates') return { view: 'cine-updates' };
    if (path === '/actor') return { view: 'actor' };
    if (path === '/list-detail') return { view: 'list-detail' };
    const cmsPageMatch = path.match(/^\/page\/(.+)$/);
    if (cmsPageMatch) return { view: 'cms-page', pageSlug: cmsPageMatch[1] };
    const movieMatch = path.match(/^\/movie\/(.+)$/);
    if (movieMatch) return { view: 'movie-details', movieId: movieMatch[1] };
    const articleMatch = path.match(/^\/(?:article|blog)\/(.+)$/);
    if (articleMatch) return { view: 'article-detail', articleId: articleMatch[1], movieId: articleMatch[1] };
    return { view: 'home' };
  };

  const pathForView = (view, movieId) => {
    if (view === 'login') return '/login';
    if (view === 'signup' || view === 'register') return '/signup';
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
    if (view === 'newsletter') return '/newsletter';
    if (view === 'articles') return '/articles';
    if (view === 'quiz') return '/quiz';
    if (view === 'wheel') return '/wheel';
    if (view === 'blind-frame') return '/blind-frame';
    if (view === 'mood-matcher') return '/mood-matcher';
    if (view === 'cine-updates') return '/cine-updates';
    if (view === 'actor') return '/actor';
    if (view === 'list-detail') return '/list-detail';
    if (view === 'cms-page' && movieId) return `/page/${movieId}`;
    if (view === 'cms-page' && movieId) return `/page/${movieId}`;
    if ((view === 'article-detail' || view === 'article') && movieId) return `/article/${movieId}`;
    if (view === 'movie-details' && movieId) return `/movie/${movieId}`;
    return '/';
  };

  const navigateTo = (view, options = {}) => {
    setVisibleCount(LOAD_STEP);
    const { movieId, articleId, pageSlug, replace = false } = options;
    const nextPath = pathForView(view, movieId || articleId || pageSlug);
    navigate(nextPath, { replace });
    window.scrollTo({ top: 0, behavior: 'instant' });
    setActiveView(view);
    if (view === 'movie-details') {
      setSelectedMovieId(movieId);
      setSelectedPageSlug('');
    } else if (view === 'article-detail' || view === 'article') {
      setSelectedArticleId(articleId || movieId);
      setActiveView('article-detail');
    } else if (view === 'cms-page') {
      setSelectedPageSlug(pageSlug || movieId || '');
    } else {
      setSelectedMovieId(null);
      setSelectedArticleId(null);
    }
  };

  useEffect(() => {
    const path = location.pathname.replace(/\/+$/, '') || '/';
    const { view, movieId, articleId, pageSlug, openAuth } = getRouteFromPath(path);
    if (pageSlug) setSelectedPageSlug(pageSlug);
    if (openAuth) {
      setAuthTab(openAuth);
      setIsAuthModalOpen(true);
    }
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
    const username = authFormData.username.trim();
    const email = authFormData.email.trim();
    const password = authFormData.password;
    if (!username) {
      setAuthError('Username is required.');
      return;
    }
    if (username.length < 3) {
      setAuthError('Username must be at least 3 characters.');
      return;
    }
    if (authTab === 'register') {
      if (!email) {
        setAuthError('Email is required.');
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setAuthError('Please enter a valid email address.');
        return;
      }
    }
    if (password.length < 6) {
      setAuthError('Password must be at least 6 characters.');
      return;
    }
    setIsAuthLoading(true);
    try {
      if (authTab === 'login') {
        const user = await loginUser(username, password);
        localStorage.setItem('mc_token', user.token);
        setCurrentUser(user);
        setIsAuthModalOpen(false);
        setAuthFormData({ username: '', email: '', password: '' });
        showToast(`Welcome back, ${user.username || 'critic'}!`);
        syncWatchlistFromServer();
      } else {
        const user = await registerUser(username, email, password);
        localStorage.setItem('mc_token', user.token);
        setCurrentUser(user);
        setIsAuthModalOpen(false);
        setAuthFormData({ username: '', email: '', password: '' });
        showToast(`Welcome to ThiraiPedia, ${user.username || 'critic'}!`);
        syncWatchlistFromServer();
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
    showToast('Signed out of your session.');
    navigateTo('home');
  };

  // Toggle watchlist item
  const handleViewMovie = useCallback((movieId) => {
    navigateTo('movie-details', { movieId });
  }, [navigateTo]);

  const handleToggleWatchlist = useCallback((movieId, e) => {
    if (e) e.stopPropagation();
    const isAdding = !watchlist.includes(movieId);
    setWatchlist(prev => isAdding ? [...prev, movieId] : prev.filter(id => id !== movieId));
    if (currentUser) {
      const op = isAdding ? addMovieToWatchlist(movieId) : removeMovieFromWatchlist(movieId);
      op.catch(() => {
        setWatchlist(prev => isAdding ? prev.filter(id => id !== movieId) : [...prev, movieId]);
        showToast('Watchlist sync failed. Please try again.', 'error');
      });
    }
  }, [watchlist, currentUser, showToast]);

  // Submit review form
  const handleCreateReviewSubmit = async (e) => {
    e.preventDefault();
    const text = (newReviewData.text || '').trim();
    if (!text) {
      showToast('Please write a review before submitting.', 'error');
      return;
    }
    if (text.length < 10) {
      showToast('Review must be at least 10 characters.', 'error');
      return;
    }
    if (text.length > 2000) {
      showToast('Review must be under 2000 characters.', 'error');
      return;
    }
    const rating = Math.min(10, Math.max(1, Number(newReviewData.rating) || 5));

    const reviewPayload = {
      ...newReviewData,
      text,
      rating,
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
      // Show share popup
      setLastReviewShare({ movie: selectedMovie, review: newReviewData });
      setShowReviewShare(true);
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

      {/* CMS TOP ANNOUNCEMENT BAR */}
      {siteSettings?.announcement?.enabled && !isAnnouncementDismissed && (
        <div className="announcement-bar">
          <div className="announcement-content">
            <span className="announcement-badge">{siteSettings.announcement.badge || 'TRENDING'}</span>
            <span className="announcement-text">{siteSettings.announcement.text}</span>
            {siteSettings.announcement.link && (
              <a
                href={siteSettings.announcement.link}
                className="announcement-link"
                onClick={(e) => {
                  if (siteSettings.announcement.link.startsWith('/')) {
                    e.preventDefault();
                    navigateTo(siteSettings.announcement.link.replace(/^\//, ''));
                  }
                }}
              >
                Check it out →
              </a>
            )}
          </div>
          <button className="announcement-dismiss" onClick={() => setIsAnnouncementDismissed(true)} aria-label="Dismiss announcement">
            <X size={14} />
          </button>
        </div>
      )}

      {/* NAVIGATION HEADER */}
      {!showCineReels && activeView !== 'cine-updates' && (
        <div className={`navbar-container ${isScrolled ? 'navbar-scrolled' : ''}`}>
        <nav className="navbar">
          <div className="logo brand-logo-wrap" onClick={() => { navigateTo('home'); }}>
            <img src={brandLogo} alt="ThiraiPedia" className="brand-logo-img" />
          </div>
          <div className="nav-links desktop-only-nav">
            {/* Core 1: Movies */}
            <Link 
              className={`nav-link ${activeView === 'home' ? 'active' : ''}`}
              to="/"
              onClick={() => { setSelectedGenre(''); setSortOption('popular'); }}
            >
              Movies
            </Link>

            {/* Core 2: Cine Pulse */}
            <button
              type="button"
              className={`nav-link cine-updates-link ${activeView === 'cine-updates' || showCineReels ? 'active' : ''}`}
              onClick={() => { loadCineUpdates(); setShowCineReels(true); navigateTo('cine-updates'); }}
              style={{ color: 'var(--color-accent-gold)', fontWeight: 600, cursor: 'pointer', background: 'none', border: 'none', font: 'inherit' }}
            >
              <span className="nav-pulse-dot" /> Cine Pulse
            </button>

            {/* Core 3: Community */}
            <Link 
              className={`nav-link ${activeView === 'community' ? 'active' : ''}`}
              to="/community"
            >
              Community
            </Link>

            {/* Core 4: Articles */}
            <Link
              className={`nav-link ${activeView === 'articles' || activeView === 'article-detail' ? 'active' : ''}`}
              to="/articles"
            >
              Articles
            </Link>

            {/* Desktop Explore Luxury Dropdown */}
            <div className="nav-dropdown-wrapper desktop-only-dropdown" ref={moreMenuRef}>
              <button
                type="button"
                className={`nav-link nav-more-trigger ${isMoreMenuOpen || ['coming-soon', 'ott-calendar', 'leaderboard', 'lists', 'watchlist', 'quiz', 'wheel', 'blind-frame', 'mood-matcher'].includes(activeView) ? 'active' : ''}`}
                onClick={() => setIsMoreMenuOpen(prev => !prev)}
                aria-expanded={isMoreMenuOpen}
              >
                <span>Explore</span>
                <ChevronDown size={14} className={`dropdown-chevron ${isMoreMenuOpen ? 'open' : ''}`} />
              </button>

              {isMoreMenuOpen && (
                <div className="luxury-nav-dropdown">
                  <div className="luxury-dropdown-grid">
                    {/* Col 1: Releases & Cinema */}
                    <div className="luxury-dropdown-col">
                      <span className="luxury-dropdown-col-title">Cinema & Releases</span>
                      <Link to="/coming-soon" className="luxury-dropdown-item" onClick={() => setIsMoreMenuOpen(false)}>
                        <Calendar size={16} className="luxury-dropdown-icon" />
                        <div>
                          <strong>Coming Soon</strong>
                          <small>Upcoming theatrical debuts</small>
                        </div>
                      </Link>
                      <Link to="/ott-calendar" className="luxury-dropdown-item" onClick={() => setIsMoreMenuOpen(false)}>
                        <Film size={16} className="luxury-dropdown-icon" />
                        <div>
                          <strong>OTT Calendar</strong>
                          <small>Digital streaming premieres</small>
                        </div>
                      </Link>
                      <Link to="/lists" className="luxury-dropdown-item" onClick={() => { loadAllLists(); setIsMoreMenuOpen(false); }}>
                        <Layers size={16} className="luxury-dropdown-icon" />
                        <div>
                          <strong>Curated Lists</strong>
                          <small>Thematic film collections</small>
                        </div>
                      </Link>
                    </div>

                    {/* Col 2: Critics & Watchlist */}
                    <div className="luxury-dropdown-col">
                      <span className="luxury-dropdown-col-title">Critics & Library</span>
                      <Link to="/leaderboard" className="luxury-dropdown-item" onClick={() => { loadLeaderboard(); setIsMoreMenuOpen(false); }}>
                        <Award size={16} className="luxury-dropdown-icon" />
                        <div>
                          <strong>Top Critics</strong>
                          <small>Rankings & top reviewers</small>
                        </div>
                      </Link>
                      <Link to="/watchlist" className="luxury-dropdown-item" onClick={() => setIsMoreMenuOpen(false)}>
                        <Bookmark size={16} className="luxury-dropdown-icon" />
                        <div>
                          <strong>Watchlist</strong>
                          <small>Saved movies to stream</small>
                        </div>
                      </Link>
                      {cmsPages.filter(p => p.showInNavbar && p.isPublished !== false).map(p => (
                        <Link
                          key={p.slug}
                          className="luxury-dropdown-item"
                          to={`/page/${p.slug}`}
                          onClick={() => { setSelectedPageSlug(p.slug); setActiveView('cms-page'); setIsMoreMenuOpen(false); }}
                        >
                          <Compass size={16} className="luxury-dropdown-icon" />
                          <div>
                            <strong>{p.title}</strong>
                            <small>Special editorial section</small>
                          </div>
                        </Link>
                      ))}
                    </div>

                    {/* Col 3: Interactive Cine Hub */}
                    <div className="luxury-dropdown-col">
                      <span className="luxury-dropdown-col-title">Cine Hub & Games</span>
                      <Link to="/quiz" className="luxury-dropdown-item" onClick={() => setIsMoreMenuOpen(false)}>
                        <Gamepad2 size={16} className="luxury-dropdown-icon" />
                        <div>
                          <strong>Movie Quiz</strong>
                          <small>Test your cinema knowledge</small>
                        </div>
                      </Link>
                      <Link to="/wheel" className="luxury-dropdown-item" onClick={() => setIsMoreMenuOpen(false)}>
                        <Play size={16} className="luxury-dropdown-icon" />
                        <div>
                          <strong>Card Flix</strong>
                          <small>Flip cards to pick your film</small>
                        </div>
                      </Link>
                      <Link to="/blind-frame" className="luxury-dropdown-item" onClick={() => setIsMoreMenuOpen(false)}>
                        <Eye size={16} className="luxury-dropdown-icon" />
                        <div>
                          <strong>Blind Frame</strong>
                          <small>Guess blurred cinema shots</small>
                        </div>
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Admin Control Link */}
            {currentUser && currentUser.role === 'admin' && (
              <Link 
                className={`nav-link ${activeView === 'admin' ? 'active' : ''}`}
                to="/admin"
                style={{ color: 'var(--color-accent-gold)', fontWeight: '600' }}
              >
                Admin Control
              </Link>
            )}
          </div>
          <div className="nav-actions">
            <button 
              type="button"
              className={`hamburger-btn ${isMobileMenuOpen ? 'active' : ''}`} 
              onClick={() => setIsMobileMenuOpen(prev => !prev)} 
              aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? <X size={22} /> : <List size={22} />}
            </button>
            <button className="search-trigger" onClick={toggleSearch} aria-label="Search">
              <Search size={20} />
            </button>
            <button 
              className="profile-avatar-btn" 
              onClick={() => { 
                if (!currentUser) { 
                  setAuthTab('login'); 
                  setIsAuthModalOpen(true); 
                } else { 
                  navigateTo(activeView === 'profile' ? 'home' : 'profile'); 
                  setIsMobileMenuOpen(false); 
                } 
              }}
              aria-label={currentUser ? `Profile: ${currentUser.username}` : "Sign In"}
            >
              {currentUser?.avatarUrl && currentUser.avatarUrl.trim() && currentUser.avatarUrl !== DEFAULT_AVATAR ? (
                <img 
                  src={currentUser.avatarUrl} 
                  alt={currentUser.username || 'Avatar'} 
                  className="profile-avatar-circle"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    if (e.currentTarget.nextElementSibling) {
                      e.currentTarget.nextElementSibling.style.display = 'flex';
                    }
                  }}
                />
              ) : (
                <div className="profile-avatar-placeholder" aria-hidden="true">
                  <User size={18} />
                </div>
              )}
              {currentUser && <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginLeft: '0.5rem', fontWeight: 500 }} className="profile-nav-name">{currentUser.username}</span>}
            </button>
          </div>
        </nav>

        {/* MODERN MOBILE NAVIGATION DRAWER (MOUNTED TO BODY VIA PORTAL) */}
        {isMobileMenuOpen && typeof document !== 'undefined' && createPortal(
          <div className="mobile-drawer-portal open">
            <div 
              className="mobile-drawer-backdrop" 
              onClick={() => setIsMobileMenuOpen(false)}
              aria-label="Close menu backdrop"
            />
            <aside className="mobile-drawer-panel" aria-label="Mobile Navigation Sidebar">
              {/* Drawer Header (Fixed at top) */}
              <div className="mobile-drawer-header">
                <div className="mobile-drawer-brand brand-logo-wrap" onClick={() => { navigateTo('home'); setIsMobileMenuOpen(false); }}>
                  <img src={brandLogo} alt="ThiraiPedia" className="brand-logo-img brand-logo-img--drawer" />
                </div>
                <button 
                  type="button" 
                  className="mobile-drawer-close-btn" 
                  onClick={() => setIsMobileMenuOpen(false)}
                  aria-label="Close navigation menu"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Single Unified Scrollable Body */}
              <div className="mobile-drawer-scroll-body">
                {/* User Profile / Guest Sign-In Card */}
                {currentUser ? (
                  <div className="mobile-drawer-user-card">
                    <div className="mobile-drawer-user-info" onClick={() => { navigateTo('profile'); setIsMobileMenuOpen(false); }}>
                      {currentUser.avatarUrl && currentUser.avatarUrl.trim() && currentUser.avatarUrl !== DEFAULT_AVATAR ? (
                        <img 
                          src={currentUser.avatarUrl} 
                          alt="Avatar" 
                          className="mobile-drawer-avatar"
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                      ) : (
                        <div className="mobile-drawer-avatar profile-avatar-placeholder">
                          <User size={18} />
                        </div>
                      )}
                      <div className="mobile-drawer-user-details">
                        <span className="mobile-drawer-username">{currentUser.username}</span>
                        <span className="mobile-drawer-user-role">{currentUser.role === 'admin' ? 'Administrator' : 'Cinema Critic'}</span>
                      </div>
                    </div>
                    <div className="mobile-drawer-user-actions">
                      <button 
                        type="button" 
                        className="mobile-drawer-action-btn"
                        onClick={() => { navigateTo('profile'); setIsMobileMenuOpen(false); }}
                      >
                        <User size={13} /> Profile
                      </button>
                      <button 
                        type="button" 
                        className="mobile-drawer-action-btn logout"
                        onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }}
                      >
                        <LogOut size={13} /> Logout
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mobile-drawer-guest-card">
                    <div className="mobile-drawer-guest-text">
                      <strong>ThiraiPedia Cinema</strong>
                      <p>Sign in to curate your watchlist, rate films & join community debates.</p>
                    </div>
                    <button 
                      type="button"
                      className="mobile-drawer-login-btn"
                      onClick={() => { setAuthTab('login'); setIsAuthModalOpen(true); setIsMobileMenuOpen(false); }}
                    >
                      <LogIn size={15} /> Sign In or Register
                    </button>
                  </div>
                )}

                {/* Quick Search Bar */}
                <div className="mobile-drawer-search-wrapper">
                  <button 
                    type="button" 
                    className="mobile-drawer-search-bar" 
                    onClick={() => { setIsMobileMenuOpen(false); setIsSearchOpen(true); }}
                  >
                    <Search size={15} />
                    <span>Search films, artists, critics...</span>
                  </button>
                </div>

                {/* Group 1: Cinema & Discover */}
                <div className="mobile-drawer-group">
                  <div className="mobile-drawer-group-title">DISCOVER</div>
                  <Link 
                    className={`mobile-drawer-link ${activeView === 'home' ? 'active' : ''}`}
                    to="/"
                    onClick={() => { setSelectedGenre(''); setSortOption('popular'); setIsMobileMenuOpen(false); }}
                  >
                    <Film size={17} className="mobile-drawer-link-icon" />
                    <span className="mobile-drawer-link-text">Movies</span>
                  </Link>

                  <Link 
                    className={`mobile-drawer-link ${activeView === 'coming-soon' ? 'active' : ''}`}
                    to="/coming-soon"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Calendar size={17} className="mobile-drawer-link-icon" />
                    <span className="mobile-drawer-link-text">Coming Soon</span>
                  </Link>

                  <Link 
                    className={`mobile-drawer-link ${activeView === 'ott-calendar' ? 'active' : ''}`}
                    to="/ott-calendar"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Tv size={17} className="mobile-drawer-link-icon" />
                    <span className="mobile-drawer-link-text">OTT Releases</span>
                  </Link>

                  <button
                    type="button"
                    className={`mobile-drawer-link cine-pulse-mobile ${activeView === 'cine-updates' || showCineReels ? 'active' : ''}`}
                    onClick={() => { loadCineUpdates(); setShowCineReels(true); navigateTo('cine-updates'); setIsMobileMenuOpen(false); }}
                  >
                    <Zap size={17} className="mobile-drawer-link-icon" />
                    <span className="mobile-drawer-link-text">Cine Pulse</span>
                    <span className="mobile-drawer-live-chip">Live</span>
                  </button>
                </div>

                {/* Group 2: Library & Watchlist */}
                <div className="mobile-drawer-group">
                  <div className="mobile-drawer-group-title">MY CINEMA</div>
                  <Link 
                    className={`mobile-drawer-link ${activeView === 'watchlist' ? 'active' : ''}`}
                    to="/watchlist"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Bookmark size={17} className="mobile-drawer-link-icon" />
                    <span className="mobile-drawer-link-text">Watchlist</span>
                    {watchlist && watchlist.length > 0 && (
                      <span className="mobile-drawer-count-badge">{watchlist.length}</span>
                    )}
                  </Link>

                  <Link 
                    className={`mobile-drawer-link ${activeView === 'lists' ? 'active' : ''}`}
                    to="/lists"
                    onClick={() => { loadAllLists(); setIsMobileMenuOpen(false); }}
                  >
                    <Layers size={17} className="mobile-drawer-link-icon" />
                    <span className="mobile-drawer-link-text">Curated Lists</span>
                  </Link>
                </div>

                {/* Group 3: Community & Editorial */}
                <div className="mobile-drawer-group">
                  <div className="mobile-drawer-group-title">COMMUNITY & EDITORIAL</div>
                  <Link 
                    className={`mobile-drawer-link ${activeView === 'community' ? 'active' : ''}`}
                    to="/community"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Users size={17} className="mobile-drawer-link-icon" />
                    <span className="mobile-drawer-link-text">Community Discussions</span>
                  </Link>

                  <Link 
                    className={`mobile-drawer-link ${activeView === 'leaderboard' ? 'active' : ''}`}
                    to="/leaderboard"
                    onClick={() => { loadLeaderboard(); setIsMobileMenuOpen(false); }}
                  >
                    <Award size={17} className="mobile-drawer-link-icon" />
                    <span className="mobile-drawer-link-text">Top Critics</span>
                  </Link>

                  <Link
                    className={`mobile-drawer-link ${activeView === 'articles' || activeView === 'article-detail' ? 'active' : ''}`}
                    to="/articles"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Newspaper size={17} className="mobile-drawer-link-icon" />
                    <span className="mobile-drawer-link-text">Articles & Analysis</span>
                  </Link>

                  {cmsPages.filter(p => p.showInNavbar && p.isPublished !== false).map(p => (
                    <Link
                      key={p.slug}
                      className={`mobile-drawer-link ${activeView === 'cms-page' && selectedPageSlug === p.slug ? 'active' : ''}`}
                      to={`/page/${p.slug}`}
                      onClick={() => { setSelectedPageSlug(p.slug); setActiveView('cms-page'); setIsMobileMenuOpen(false); }}
                    >
                      <Compass size={17} className="mobile-drawer-link-icon" />
                      <span className="mobile-drawer-link-text">{p.title}</span>
                    </Link>
                  ))}
                </div>

                {/* Group 4: Interactive Hub */}
                <div className="mobile-drawer-group">
                  <div className="mobile-drawer-group-title">INTERACTIVE HUB</div>
                  <Link 
                    className={`mobile-drawer-link ${activeView === 'quiz' ? 'active' : ''}`}
                    to="/quiz"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Gamepad2 size={17} className="mobile-drawer-link-icon" />
                    <span className="mobile-drawer-link-text">Movie Quiz</span>
                  </Link>

                  <Link 
                    className={`mobile-drawer-link ${activeView === 'wheel' ? 'active' : ''}`}
                    to="/wheel"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Sparkles size={17} className="mobile-drawer-link-icon" />
                    <span className="mobile-drawer-link-text">Card Flix</span>
                  </Link>

                  <Link 
                    className={`mobile-drawer-link ${activeView === 'blind-frame' ? 'active' : ''}`}
                    to="/blind-frame"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Eye size={17} className="mobile-drawer-link-icon" />
                    <span className="mobile-drawer-link-text">Blind Frame</span>
                  </Link>
                </div>

                {/* Group 5: Admin Panel (if admin) */}
                {currentUser && (currentUser.role === 'admin' || currentUser.username === 'admin') && (
                  <div className="mobile-drawer-group admin-group">
                    <div className="mobile-drawer-group-title">ADMINISTRATION</div>
                    <Link 
                      className={`mobile-drawer-link admin-link ${activeView === 'admin' ? 'active' : ''}`}
                      to="/admin"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <ShieldCheck size={17} className="mobile-drawer-link-icon" />
                      <span className="mobile-drawer-link-text">Admin Control</span>
                    </Link>
                  </div>
                )}

                {/* Drawer Footer */}
                <div className="mobile-drawer-footer">
                  <div className="mobile-drawer-footer-links">
                    <Link to="/page/about" onClick={() => { setSelectedPageSlug('about'); setActiveView('cms-page'); setIsMobileMenuOpen(false); }}>About</Link>
                    <span>&bull;</span>
                    <Link to="/contact" onClick={() => { navigateTo('contact'); setIsMobileMenuOpen(false); }}>Contact</Link>
                    <span>&bull;</span>
                    <Link to="/page/privacy" onClick={() => { setSelectedPageSlug('privacy'); setActiveView('cms-page'); setIsMobileMenuOpen(false); }}>Privacy</Link>
                    <span>&bull;</span>
                    <Link to="/page/terms" onClick={() => { setSelectedPageSlug('terms'); setActiveView('cms-page'); setIsMobileMenuOpen(false); }}>Terms</Link>
                  </div>
                  <div className="mobile-drawer-tagline">ThiraiPedia &copy; 2026 &bull; Crafted for Cinema Lovers</div>
                </div>
              </div>
            </aside>
          </div>,
          document.body
        )}

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
                   <div className="cine-empty-state" style={{ margin: '2rem auto' }}>
                     <div className="cine-empty-state-icon">
                       <Search size={24} />
                     </div>
                     <h3 className="cine-empty-state-title">No matching films found</h3>
                     <p className="cine-empty-state-desc">
                       We couldn't locate films matching "{searchQuery}". Try alternate titles, directors, or actors.
                     </p>
                     <div className="cine-empty-state-action" style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                       <button onClick={() => { setSearchQuery(''); setSearchResults([]); }}
                         className="btn-outline" style={{ padding: '0.5rem 1rem' }}>
                         Clear Search
                       </button>
                       <button onClick={() => { setSearchQuery(''); setSearchResults([]); navigateTo('home'); }}
                         className="btn-secondary" style={{ padding: '0.5rem 1rem' }}>
                         Browse All Films
                       </button>
                     </div>
                   </div>
                 ) : (
                  <>
                    <div className="search-results-header">
                      <span>{searchResults.length} result{searchResults.length !== 1 ? 's' : ''} found</span>
                    </div>
                    <div className="search-results-list">
                       {searchResults.slice(0, 12).map(movie => (
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
                    {searchResults.length > 12 && (
                      <div className="search-results-footer">
                        <span>Showing 12 of {searchResults.length} results</span>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      )}

      {/* RENDER ACTIVE VIEW */}
      <div className="fade-in" key={activeView + (selectedMovieId || selectedArticleId || '')}>
        {activeView === 'home' && (
          <div className="main-content">
            {/* HERO CAROUSEL (APPLE TV+ / PRIME VIDEO CINEMATIC STANDARD) */}
            {heroTotalSlides > 0 && (
              <header className="hero"
                ref={heroRef}
                onMouseEnter={() => { isHoveringRef.current = true; }}
                onMouseLeave={() => { isHoveringRef.current = false; }}
                onTouchStart={handleHeroTouchStart}
                onTouchEnd={handleHeroTouchEnd}
              >
                <div
                  className="hero-track"
                  style={{ '--track-offset': `${-(currentHeroIndex * 100)}%` }}
                >
                  {/* ─── 1. CINE PULSE DISPATCH FEATURE SLIDE (FIRST SLIDE) ─── */}
                  {hasCinePulse && (
                    <div
                      key="cine-pulse-dispatch"
                      className={`hero-slide ${currentHeroIndex === 0 ? 'hero-slide--active' : ''}`}
                    >
                      <div
                        className="hero-backdrop"
                        style={{
                          backgroundImage: cineUpdates[0]?.imageUrl
                            ? `url(${proxyImageUrl(cineUpdates[0].imageUrl, 'original')})`
                            : 'radial-gradient(ellipse 70% 50% at 50% 20%, rgba(251, 191, 36, 0.08) 0%, #07080b 80%)',
                        }}
                      />
                      <div className="hero-content">
                        <div 
                          className="hero-styled-title-logo" 
                          onClick={() => { loadCineUpdates(); setShowCineReels(true); navigateTo('cine-updates'); }}
                          style={{ cursor: 'pointer' }}
                        >
                          <span className="hero-styled-title-text">CINE PULSE</span>
                        </div>

                        <div className="hero-meta-row">
                          <span className="hero-meta-badge" style={{ borderColor: 'rgba(251, 191, 36, 0.35)', color: 'var(--color-accent-gold)' }}>
                            DISPATCH
                          </span>
                          <span className="hero-meta-item">Real-Time Kollywood Buzz</span>
                          <span className="hero-meta-dot">&bull;</span>
                          <span className="hero-meta-item">{cineUpdates.length} Updates</span>
                        </div>

                        <p className="hero-description">
                          {cineUpdates[0]?.title || 'Swipe through the latest Kollywood cinema news, rumors, and breaking production updates.'}
                        </p>

                        <div className="hero-actions">
                          <button 
                            className="btn-hero-primary" 
                            onClick={() => { loadCineUpdates(); setShowCineReels(true); navigateTo('cine-updates'); }}
                          >
                            <Play size={16} fill="currentColor" /> Watch Pulse
                          </button>
                          <button 
                            className="btn-hero-secondary" 
                            onClick={() => { loadCineUpdates(); setShowCineReels(true); navigateTo('cine-updates'); }}
                          >
                            All Updates
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ─── 2. BLOCKBUSTER HERO FILMS ─── */}
                  {heroMovies.map((movie, index) => {
                    const slideIndex = hasCinePulse ? index + 1 : index;
                    const isActive = slideIndex === currentHeroIndex;
                    const displayGenres = movie.genre
                      ? movie.genre.split('/').map(g => g.trim()).filter(g => g.toLowerCase() !== 'tamil').slice(0, 2).join(' / ') || movie.genre
                      : '';

                    return (
                      <div 
                        key={movie.id} 
                        className={`hero-slide ${isActive ? 'hero-slide--active' : ''}`}
                      >
                        <div 
                          className="hero-backdrop" 
                          style={{ backgroundImage: `url(${proxyImageUrl(movie.backdropUrl, 'original')})` }}
                        />
                        <div className="hero-content">
                          <MovieLogo movie={movie} />
                          <div className="hero-meta-row">
                            <span className="hero-meta-badge">FEATURED</span>
                            {movie.releaseYear && <span className="hero-meta-item">{movie.releaseYear}</span>}
                            {movie.runtime && (
                              <>
                                <span className="hero-meta-dot">&bull;</span>
                                <span className="hero-meta-item">{movie.runtime}</span>
                              </>
                            )}
                            {displayGenres && (
                              <>
                                <span className="hero-meta-dot">&bull;</span>
                                <span className="hero-meta-item">{displayGenres}</span>
                              </>
                            )}
                            {movie.rating > 0 && (
                              <>
                                <span className="hero-meta-dot">&bull;</span>
                                <span className="hero-meta-rating">
                                  <Star size={13} fill="currentColor" /> {movie.rating.toFixed(1)}
                                </span>
                              </>
                            )}
                          </div>
                          <p className="hero-description">{movie.description}</p>
                          <div className="hero-actions">
                            <button className="btn-hero-primary" onClick={() => handleViewMovie(movie.id)}>
                              <Play size={16} fill="currentColor" /> Watch Trailer
                            </button>
                            <button 
                              className="btn-hero-secondary" 
                              onClick={(e) => handleToggleWatchlist(movie.id, e)}
                              aria-label="Toggle watchlist"
                            >
                              {watchlist.includes(movie.id) ? <Check size={16} /> : <Plus size={16} />}
                              {watchlist.includes(movie.id) ? 'In Watchlist' : 'Add to List'}
                            </button>
                            <button 
                              className="btn-hero-ghost" 
                              onClick={() => handleViewMovie(movie.id)}
                            >
                              Details
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Left Arrow */}
                {heroTotalSlides > 1 && (
                  <button 
                    className="hero-nav-btn hero-nav-btn--left"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentHeroIndex(prev => (prev - 1 + heroTotalSlides) % heroTotalSlides);
                    }}
                    aria-label="Previous slide"
                  >
                    <ChevronLeft size={22} />
                  </button>
                )}

                {/* Right Arrow */}
                {heroTotalSlides > 1 && (
                  <button 
                    className="hero-nav-btn hero-nav-btn--right"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentHeroIndex(prev => (prev + 1) % heroTotalSlides);
                    }}
                    aria-label="Next slide"
                  >
                    <ChevronRight size={22} />
                  </button>
                )}

                {/* Segmented Progress Indicators */}
                {heroTotalSlides > 1 && (
                  <div className="hero-indicators">
                    {hasCinePulse && (
                      <button
                        key="cine-pulse-indicator"
                        className={`hero-indicator-bar ${0 === currentHeroIndex ? 'hero-indicator-bar--active' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setCurrentHeroIndex(0);
                        }}
                        aria-label="Go to Cine Pulse"
                      />
                    )}
                    {heroMovies.map((movie, index) => {
                      const slideIndex = hasCinePulse ? index + 1 : index;
                      return (
                        <button
                          key={movie.id}
                          className={`hero-indicator-bar ${slideIndex === currentHeroIndex ? 'hero-indicator-bar--active' : ''}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setCurrentHeroIndex(slideIndex);
                          }}
                          aria-label={`Go to slide ${slideIndex + 1}`}
                        />
                      );
                    })}
                  </div>
                )}
              </header>
            )}

            <MovieSection
              subtitle="Now Playing"
              title="New Releases"
              movies={newReleases}
              onMovieClick={handleViewMovie}
              scrollRef={newReleasesScrollRef}
              onViewAll={() => navigateTo('new-releases')}
            />

            {tamilMovies.length > 0 && (
              <MovieSection
                subtitle="தமிழ் சினிமா"
                title="Tamil Cinema"
                movies={tamilMovies}
                onMovieClick={handleViewMovie}
                scrollRef={tamilScrollRef}
                onViewAll={() => navigateTo('tamil-cinema')}
              />
            )}

            {malayalamMovies.length > 0 && (
              <MovieSection
                subtitle="മലയാള സിനിമ"
                title="Malayalam Cinema"
                movies={malayalamMovies}
                onMovieClick={handleViewMovie}
                scrollRef={malayalamScrollRef}
                onViewAll={() => navigateTo('malayalam-cinema')}
              />
            )}

            {teluguMovies.length > 0 && (
              <MovieSection
                subtitle="తెలుగు సినిమా"
                title="Telugu Cinema"
                movies={teluguMovies}
                onMovieClick={handleViewMovie}
                scrollRef={teluguScrollRef}
              />
            )}

            {kannadaMovies.length > 0 && (
              <MovieSection
                subtitle="ಕನ್ನಡ ಸಿನಿಮಾ"
                title="Kannada Cinema"
                movies={kannadaMovies}
                onMovieClick={handleViewMovie}
                scrollRef={kannadaScrollRef}
              />
            )}

            {hindiMovies.length > 0 && (
              <MovieSection
                subtitle="हिंदी सिनेमा"
                title="Hindi Cinema"
                movies={hindiMovies}
                onMovieClick={handleViewMovie}
                scrollRef={hindiScrollRef}
              />
            )}

            {englishMovies.length > 0 && (
              <MovieSection
                subtitle="English Movies"
                title="English Cinema"
                movies={englishMovies}
                onMovieClick={handleViewMovie}
                scrollRef={englishScrollRef}
              />
            )}


            {topRatedMovies.length > 0 && (
              <MovieSection
                subtitle="Weekly Charts"
                title="Top Rated on thiraipedia"
                movies={topRatedMovies}
                onMovieClick={handleViewMovie}
                scrollRef={topRatedScrollRef}
                onViewAll={() => navigateTo('top-rated')}
              />
            )}

            {/* CINEPHILE SHOWCASE PROMO — Real data community spotlight */}
            <CineShowcasePromo
              movies={movies}
              allUsers={allUsers}
              currentUser={currentUser}
              onMovieClick={handleViewMovie}
              onJoinClick={() => {
                setAuthTab('register');
                setIsAuthModalOpen(true);
              }}
              onExploreClick={() => navigateTo('top-rated')}
              onDiaryClick={() => navigateTo('profile')}
              onListsClick={() => navigateTo('lists')}
            />

            {/* CURATED SELECTION (Staff Picks) */}
            {featuredStaffPick && siteSettings?.sections?.showStaffPicks !== false && (
              <section className="staff-picks-section">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                  <div>
                    <p className="section-meta">Curated Selection</p>
                    <h2 className="section-title">{siteSettings?.sections?.staffPicksTitle || "Staff Picks"}</h2>
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

            {/* TRENDING NOW */}
            {trendingMovies.length > 0 && siteSettings?.sections?.showTrending !== false && (
              <MovieSection
                subtitle="Trending"
                title={siteSettings?.sections?.trendingTitle || "Trending Now"}
                movies={trendingMovies}
                onMovieClick={handleViewMovie}
                scrollRef={trendingScrollRef}
              />
            )}

            {/* RECOMMENDED FOR YOU */}
            {recommendedMovies.length > 0 && siteSettings?.sections?.showRecommended !== false && (
              <MovieSection
                subtitle="For You"
                title={siteSettings?.sections?.recommendedTitle || "Recommended For You"}
                movies={recommendedMovies}
                onMovieClick={handleViewMovie}
                scrollRef={recommendedScrollRef}
              />
            )}

            {/* FUN SECTION: Quiz & Spin Wheel Promo */}
            {siteSettings?.sections?.showGames !== false && (
            <section className="fun-promo-section">
              <div className="fun-promo-header">
                <p className="section-meta">Play & Explore</p>
                <h2 className="section-title">{siteSettings?.sections?.gamesTitle || "Fun Activities"}</h2>
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
               <LoadingGrid count={8} />
             ) : (
               <MovieGrid
                 movies={filteredReleases}
                 onMovieClick={handleViewMovie}
                 emptyTitle="No releases match your filters"
                 emptyMessage="Try adjusting the selected year or month filters above to find films."
                 emptyAction={
                   <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                     <button
                       onClick={() => { setReleaseFilterMonth(''); setReleaseFilterYear(''); }}
                       className="btn-outline"
                       style={{ padding: '0.5rem 1rem' }}
                     >
                       Reset Filters
                     </button>
                     <button
                       onClick={() => navigateTo('coming-soon')}
                       className="btn-secondary"
                       style={{ padding: '0.5rem 1rem' }}
                     >
                       Upcoming Releases
                     </button>
                   </div>
                 }
                 visibleCount={visibleCount}
                 totalCount={filteredReleases.length}
                 onLoadMore={() => setVisibleCount(prev => prev + LOAD_STEP)}
               />
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
            <MovieGrid
              movies={tamilMovies}
              onMovieClick={handleViewMovie}
              emptyTitle="No Tamil films in this collection"
              emptyMessage="We are continuously cataloging Tamil releases. Check back soon for new additions."
              emptyAction={
                <button className="btn-secondary" onClick={() => navigateTo('home')} style={{ padding: '0.5rem 1rem' }}>
                  Explore All Cinema
                </button>
              }
              visibleCount={visibleCount}
              totalCount={tamilMovies.length}
              onLoadMore={() => setVisibleCount(prev => prev + LOAD_STEP)}
            />
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
            <MovieGrid
              movies={malayalamMovies}
              onMovieClick={handleViewMovie}
              emptyTitle="No Malayalam films in this collection"
              emptyMessage="Malayalam cinema catalog is expanding with critically acclaimed masterworks and festival favorites."
              emptyAction={
                <button className="btn-secondary" onClick={() => navigateTo('home')} style={{ padding: '0.5rem 1rem' }}>
                  Explore All Cinema
                </button>
              }
              visibleCount={visibleCount}
              totalCount={malayalamMovies.length}
              onLoadMore={() => setVisibleCount(prev => prev + LOAD_STEP)}
            />
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
            <MovieGrid
              movies={topRatedPage}
              onMovieClick={handleViewMovie}
              loading={topRatedPageLoading}
              emptyTitle="No top rated films yet"
              emptyMessage="Films with community scores of 7.0 or higher will appear in this prestige tier."
              emptyAction={
                <button className="btn-secondary" onClick={() => navigateTo('home')} style={{ padding: '0.5rem 1rem' }}>
                  Browse All Films
                </button>
              }
              visibleCount={visibleCount}
              totalCount={topRatedPage.length}
              onLoadMore={() => setVisibleCount(prev => prev + LOAD_STEP)}
            />
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
             <MovieGrid
              movies={movies.filter(m => watchlist.includes(m.id))}
              onMovieClick={handleViewMovie}
              emptyTitle="Your watchlist is empty"
              emptyMessage="Curate your personal cinema queue. Bookmark must-watch films by clicking the + button on any movie card."
              emptyAction={
                <button className="btn-secondary" onClick={() => navigateTo('top-rated')} style={{ padding: '0.5rem 1rem' }}>
                  Explore Top Rated
                </button>
              }
            />
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
            <MovieGrid
              movies={movies.filter(m => m.isUpcoming)}
              onMovieClick={handleViewMovie}
              emptyTitle="No upcoming releases scheduled"
              emptyMessage="Our release calendar is currently being synchronized. Check back for fresh theatrical and digital dates."
              emptyAction={
                <button className="btn-secondary" onClick={() => navigateTo('home')} style={{ padding: '0.5rem 1rem' }}>
                  Back to Cinema Home
                </button>
              }
            />
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
              return (
                <MovieGrid
                  movies={actorMovies}
                  onMovieClick={handleViewMovie}
                  emptyTitle={`No films indexed for ${selectedActor}`}
                  emptyMessage="We haven't indexed credits for this artist yet. Explore other filmographies in the library."
                  emptyAction={
                    <button className="btn-secondary" onClick={() => { setSelectedActor(null); navigateTo('home'); }} style={{ padding: '0.5rem 1rem' }}>
                      Browse All Films
                    </button>
                  }
                />
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
          userOttAlerts={userOttAlerts}
          onToggleOttAlert={handleToggleOttAlert}
        />

        {/* PROFILE VIEW */}
        {activeView === 'profile' && (
          <ProfileView
            currentUser={currentUser}
            userProfile={userProfile}
            profileData={profileData}
            movies={movies}
            watchlist={watchlist}
            userLists={userLists}
            allUsers={allUsers}
            onViewMovie={handleViewMovie}
            onEditProfile={() => setEditingProfile(true)}
            onLogout={handleLogout}
            onOpenAuth={() => {
              setAuthTab('login');
              setIsAuthModalOpen(true);
            }}
            onFollow={handleFollow}
            onUnfollow={handleUnfollow}
            onViewList={handleViewList}
            loadUserLists={loadUserLists}
            onNavigate={navigateTo}
            proxyImageUrl={proxyImageUrl}
            showToast={showToast}
          />
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
            <MovieGrid
              movies={movies.filter(m => selectedList.movieIds.includes(m.id))}
              onMovieClick={handleViewMovie}
              emptyTitle="No films in this collection"
              emptyMessage="This curated selection does not have any active entries yet."
              emptyAction={
                <button className="btn-secondary" onClick={() => navigateTo('home')} style={{ padding: '0.5rem 1rem' }}>
                  Discover Films
                </button>
              }
            />
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
                {upcomingOttMovies.map(movie => {
                  const isAlerted = userOttAlerts.some(a => a.movieId === movie.id);
                  return (
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
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                        <button
                          onClick={(e) => handleToggleOttAlert(movie, e)}
                          style={{
                            background: isAlerted ? 'rgba(251, 191, 36, 0.15)' : 'rgba(255,255,255,0.05)',
                            border: `1px solid ${isAlerted ? 'rgba(251, 191, 36, 0.3)' : 'rgba(255,255,255,0.1)'}`,
                            borderRadius: '8px',
                            padding: '0.4rem 0.6rem',
                            cursor: 'pointer',
                            color: isAlerted ? 'var(--color-accent-gold)' : 'var(--color-text-muted)',
                            fontSize: '0.7rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            transition: 'all 0.2s',
                            whiteSpace: 'nowrap'
                          }}
                          title={isAlerted ? 'Remove alert' : 'Notify me on release'}
                        >
                          {isAlerted ? <BellOff size={14} /> : <Bell size={14} />}
                          {isAlerted ? 'Alert Set' : 'Notify Me'}
                        </button>
                        <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
                          {Math.ceil((new Date(movie.ott.releaseDate) - new Date()) / (1000 * 60 * 60 * 24))} days
                        </span>
                      </div>
                    </div>
                  );
                })}
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
          <div className="main-content game-view">
            <Suspense fallback={<div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>Loading...</div>}>
              <QuizGame movies={movies} onViewMovie={handleViewMovie} />
            </Suspense>
          </div>
        )}

        {/* SPIN WHEEL VIEW */}
        {activeView === 'wheel' && (
          <div className="main-content game-view">
            <Suspense fallback={<div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>Loading...</div>}>
              <SpinWheel movies={movies} onViewMovie={handleViewMovie} />
            </Suspense>
          </div>
        )}

        {/* BLIND FRAME VIEW */}
        {activeView === 'blind-frame' && (
          <div className="main-content game-view">
            <Suspense fallback={<div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>Loading...</div>}>
              <BlindFrame movies={movies} onViewMovie={handleViewMovie} />
            </Suspense>
          </div>
        )}

        {/* MOOD MATCHER VIEW */}
        {activeView === 'mood-matcher' && (
          <div className="main-content game-view">
            <Suspense fallback={<div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>Loading...</div>}>
              <MoodMatcher movies={movies} onViewMovie={handleViewMovie} />
            </Suspense>
          </div>
        )}

        {/* CINE UPDATES REELS OVERLAY */}
        {(showCineReels || activeView === 'cine-updates') && (
          <Suspense fallback={<div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>Loading...</div>}>
            <CineUpdates
              updates={cineUpdates}
              onLike={handleCineUpdateLike}
              onShare={handleCineUpdateShare}
              currentUser={currentUser}
              onBack={() => {
                setShowCineReels(false);
                navigateTo('home');
              }}
              onNavigate={navigateTo}
            />
          </Suspense>
        )}

        {/* WELCOME ONBOARDING POPUP */}
        {showWelcome && (
          <WelcomePopup onClose={() => {
            localStorage.setItem('welcomeSeen', '1');
            setShowWelcome(false);
          }} />
        )}

        {/* REVIEW SHARE POPUP */}
        {showReviewShare && lastReviewShare && (
          <Suspense fallback={null}>
            <ReviewSharePopup
              movie={lastReviewShare.movie}
              reviewData={lastReviewShare.review}
              onClose={() => setShowReviewShare(false)}
            />
          </Suspense>
        )}

        {/* ADMIN CONTROL PANEL VIEW */}
        {activeView === 'admin' && currentUser && currentUser.role === 'admin' && (
          <AdminPanel currentUser={currentUser} />
        )}

        {/* LEGAL PAGES */}
        <Suspense fallback={<div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>Loading...</div>}>
          {activeView === 'privacy' && <DynamicCmsPage slug="privacy" onNavigate={navigateTo} />}
          {activeView === 'terms' && <DynamicCmsPage slug="terms" onNavigate={navigateTo} />}
          {activeView === 'contact' && <ContactPage onNavigate={navigateTo} />}
          {activeView === 'about' && <DynamicCmsPage slug="about" onNavigate={navigateTo} />}
          {activeView === 'newsletter' && <DynamicCmsPage slug="newsletter" onNavigate={navigateTo} />}
          {activeView === 'cms-page' && <DynamicCmsPage slug={selectedPageSlug || 'about'} onNavigate={navigateTo} />}
          {activeView === 'articles' && <ArticlesPage onNavigate={navigateTo} />}
          {activeView === 'article-detail' && selectedArticleId && <ArticleDetail articleId={selectedArticleId} onNavigate={navigateTo} />}
        </Suspense>
      </div>

      {/* FOOTER SECTION */}
      {!showCineReels && activeView !== 'cine-updates' && (
        <Footer
          onNavigate={navigateTo}
          onLoadLeaderboard={loadLeaderboard}
          onLoadLists={loadAllLists}
          siteSettings={siteSettings}
          cmsPages={cmsPages}
        />
      )}

      {/* STAGING ENVIRONMENT WATERMARK BADGE */}
      {!showCineReels && activeView !== 'cine-updates' && (import.meta.env.VITE_APP_ENV === 'staging' || (typeof window !== 'undefined' && (window.location.port === '5174' || window.location.hostname.includes('staging')))) && (
        <div className="staging-env-pill" title="You are viewing the Staging Environment">
          <span className="staging-pulse-dot" />
          <span>STAGING ENVIRONMENT</span>
        </div>
      )}

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
      <Modal isOpen={showTrailer} onClose={() => setShowTrailer(false)} className="trailer-modal-dialog" width="960px">
        <div className="trailer-cinema-root">
          <div className="trailer-cinema-header">
            <div className="trailer-header-meta">
              <div className="trailer-title-row">
                <h2 className="trailer-film-title">{selectedMovie?.title}</h2>
                <span className="trailer-badge-pill">Official Trailer</span>
              </div>
              <div className="trailer-sub-row">
                {(selectedMovie?.releaseYear || (selectedMovie?.releaseDate ? new Date(selectedMovie.releaseDate).getFullYear() : null)) && (
                  <span className="trailer-meta-item">
                    {selectedMovie?.releaseYear || new Date(selectedMovie.releaseDate).getFullYear()}
                  </span>
                )}
                {selectedMovie?.language && (
                  <>
                    <span className="trailer-meta-dot">•</span>
                    <span className="trailer-meta-item">{selectedMovie.language.toUpperCase()}</span>
                  </>
                )}
                {selectedMovie?.trailerChannelName && (
                  <>
                    <span className="trailer-meta-dot">•</span>
                    <span className="trailer-channel-tag">
                      <Tv size={12} /> {selectedMovie.trailerChannelName}
                    </span>
                  </>
                )}
              </div>
            </div>

            <div className="trailer-header-actions">
              <button
                type="button"
                className={`trailer-autoplay-toggle ${trailerAutoplayPreference ? 'active' : ''}`}
                onClick={() => {
                  const next = !trailerAutoplayPreference;
                  setTrailerAutoplayPreference(next);
                  localStorage.setItem('mc_trailer_autoplay', next);
                }}
                title={trailerAutoplayPreference ? "Autoplay is ON" : "Autoplay is OFF"}
                aria-label="Toggle autoplay trailer"
              >
                <span className="trailer-autoplay-label">Autoplay</span>
                <span className="trailer-toggle-switch">
                  <span className="trailer-toggle-knob" />
                </span>
              </button>
            </div>
          </div>

          {selectedMovie?.trailerUrl ? (
            <div className="trailer-stage">
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
                      <div className="preroll-content" style={{ position: 'absolute', top: '0.75rem', right: '0.75rem', padding: 0, gap: 0, zIndex: 10 }}>
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
                        <div className="preroll-icon"><Film size={26} /></div>
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
              />
            </div>
          ) : (
            <div className="trailer-empty-state">
              <div className="trailer-empty-icon">
                <Film size={22} />
              </div>
              <h3 className="trailer-empty-title">No Official Trailer Available</h3>
              <p className="trailer-empty-desc">We couldn't locate an official trailer stream for this title yet.</p>
            </div>
          )}

          {selectedMovie?.trailerUrl && (
            <div className="trailer-cinema-footer">
              <div className="trailer-footer-credits">
                {selectedMovie?.director && (
                  <span className="trailer-director-credit">
                    Directed by <strong>{selectedMovie.director}</strong>
                  </span>
                )}
                {selectedMovie?.genre && (
                  <div className="trailer-genres-list">
                    {selectedMovie.genre.split('/').slice(0, 3).map((g, idx) => (
                      <span key={idx} className="trailer-genre-chip">{g.trim()}</span>
                    ))}
                  </div>
                )}
              </div>
              <a
                href={selectedMovie.trailerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="trailer-yt-button"
              >
                <span>Watch on YouTube</span>
                <ExternalLink size={13} />
              </a>
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
      <EditProfileModal
        isOpen={editingProfile}
        onClose={() => setEditingProfile(false)}
        currentUser={currentUser}
        profileData={profileData}
        onSave={handleSaveProfile}
      />

      {/* MODAL - AUTHENTICATION (SIGN IN / SIGN UP) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => {
          setIsAuthModalOpen(false);
          setAuthError('');
        }}
        authTab={authTab}
        onTabChange={(tab) => setTabAndClearForm(tab)}
        formData={authFormData}
        onFormChange={(field, val) => setAuthFormData(prev => ({ ...prev, [field]: val }))}
        error={authError}
        isLoading={isAuthLoading}
        showPassword={showPassword}
        onToggleShowPassword={() => setShowPassword(prev => !prev)}
        onSubmit={handleAuthSubmit}
        googleClientId={GOOGLE_CLIENT_ID}
        googleBtnRef={googleBtnRef}
      />
    </div>
  );
}


