import { useState, useCallback, memo } from 'react';
import { Swords, Flame, Sparkles, Trophy, ChevronRight, Check } from 'lucide-react';
import { playDuelFanfare, playPopcornPop } from '../utils/cinemaAudio';

const VERSUS_MATCHUPS = [
  {
    id: 'baasha_vs_padayappa',
    tagline: 'ULTIMATE RAJINI CLASH',
    filmA: {
      title: 'Baasha',
      year: '1995',
      director: 'Suresh Krissna',
      actor: 'Superstar Rajinikanth',
      character: 'Manick Baasha',
      poster: 'https://image.tmdb.org/t/p/w500/uLr5K6tM8RlhU90bM38eE87YQfK.jpg',
      initialVotes: 1420,
      color: '#3b82f6',
    },
    filmB: {
      title: 'Padayappa',
      year: '1999',
      director: 'K. S. Ravikumar',
      actor: 'Superstar Rajinikanth',
      character: 'Aarupadayappa',
      poster: 'https://image.tmdb.org/t/p/w500/kZp7x0j3cE0vR7p09k9F0j6z2cM.jpg',
      initialVotes: 1290,
      color: '#ef4444',
    },
  },
  {
    id: 'vikram_vs_leo',
    tagline: 'THE LCU SHOWDOWN',
    filmA: {
      title: 'Vikram',
      year: '2022',
      director: 'Lokesh Kanagaraj',
      actor: 'Kamal Haasan',
      character: 'Agent Vikram',
      poster: 'https://image.tmdb.org/t/p/w500/bKxiKNQZZ7U1wNuY7p823c9E32J.jpg',
      initialVotes: 2150,
      color: '#3b82f6',
    },
    filmB: {
      title: 'Leo',
      year: '2023',
      director: 'Lokesh Kanagaraj',
      actor: 'Thalapathy Vijay',
      character: 'Parthiban / Leo Das',
      poster: 'https://image.tmdb.org/t/p/w500/mxl5H3a9jG6Xp09w5H4Z1v8E2dM.jpg',
      initialVotes: 2430,
      color: '#ef4444',
    },
  },
  {
    id: 'thuppakki_vs_mankatha',
    tagline: 'PEAK COMMERCIAL THRILLERS',
    filmA: {
      title: 'Thuppakki',
      year: '2012',
      director: 'AR Murugadoss',
      actor: 'Thalapathy Vijay',
      character: 'Jagadish Dhanapal',
      poster: 'https://image.tmdb.org/t/p/w500/18Lhkc3nf92bY1cacQomXIqihhN.jpg',
      initialVotes: 1890,
      color: '#3b82f6',
    },
    filmB: {
      title: 'Mankatha',
      year: '2011',
      director: 'Venkat Prabhu',
      actor: 'Ajith Kumar',
      character: 'Vinayak Mahadev',
      poster: 'https://image.tmdb.org/t/p/w500/5U8MWIk9XZ60NALyOTpyX7vXIR7.jpg',
      initialVotes: 1940,
      color: '#ef4444',
    },
  },
  {
    id: 'ghilli_vs_pokkiri',
    tagline: 'MASS ENTERTAINMENT CLASSICS',
    filmA: {
      title: 'Ghilli',
      year: '2004',
      director: 'Dharani',
      actor: 'Thalapathy Vijay',
      character: 'Velu',
      poster: 'https://image.tmdb.org/t/p/w500/AjaNAeMXOrK9n0YqGqX0Lz5qxYu.jpg',
      initialVotes: 2280,
      color: '#3b82f6',
    },
    filmB: {
      title: 'Pokkiri',
      year: '2007',
      director: 'Prabhu Deva',
      actor: 'Thalapathy Vijay',
      character: 'Thamizh',
      poster: 'https://image.tmdb.org/t/p/w500/7aqx7T9FNu1HPCyb0CBjJtjshoU.jpg',
      initialVotes: 1760,
      color: '#ef4444',
    },
  },
];

function MovieVersusBattle() {
  const [matchupIndex, setMatchupIndex] = useState(0);
  const currentMatch = VERSUS_MATCHUPS[matchupIndex];

  // Store user votes per matchup
  const [userVotes, setUserVotes] = useState(() => {
    if (typeof window === 'undefined') return {};
    try {
      return JSON.parse(localStorage.getItem('tp_versus_votes') || '{}');
    } catch {
      return {};
    }
  });

  // Tally state
  const [tallies, setTallies] = useState(() => {
    const initial = {};
    VERSUS_MATCHUPS.forEach(m => {
      initial[m.id] = { a: m.filmA.initialVotes, b: m.filmB.initialVotes };
    });
    return initial;
  });

  const [animatingWinner, setAnimatingWinner] = useState(null);

  const currentTally = tallies[currentMatch.id] || { a: currentMatch.filmA.initialVotes, b: currentMatch.filmB.initialVotes };
  const userChoice = userVotes[currentMatch.id]; // 'a' or 'b'

  const totalVotes = currentTally.a + currentTally.b;
  const percentA = Math.round((currentTally.a / totalVotes) * 100);
  const percentB = 100 - percentA;

  const handleVote = useCallback((choice) => {
    if (userChoice === choice) return;

    playDuelFanfare();
    setAnimatingWinner(choice);
    setTimeout(() => setAnimatingWinner(null), 1000);

    setTallies(prev => {
      const prevMatch = prev[currentMatch.id] || { a: currentMatch.filmA.initialVotes, b: currentMatch.filmB.initialVotes };
      let deltaA = 0;
      let deltaB = 0;

      if (!userChoice) {
        if (choice === 'a') deltaA = 1;
        else deltaB = 1;
      } else if (userChoice === 'a' && choice === 'b') {
        deltaA = -1;
        deltaB = 1;
      } else if (userChoice === 'b' && choice === 'a') {
        deltaA = 1;
        deltaB = -1;
      }

      return {
        ...prev,
        [currentMatch.id]: {
          a: Math.max(0, prevMatch.a + deltaA),
          b: Math.max(0, prevMatch.b + deltaB),
        },
      };
    });

    setUserVotes(prev => {
      const updated = { ...prev, [currentMatch.id]: choice };
      if (typeof window !== 'undefined') {
        localStorage.setItem('tp_versus_votes', JSON.stringify(updated));
      }
      return updated;
    });
  }, [currentMatch, userChoice]);

  const handleNextMatch = () => {
    playPopcornPop();
    setMatchupIndex((prev) => (prev + 1) % VERSUS_MATCHUPS.length);
  };

  return (
    <div className="versus-section-wrapper">
      <div className="versus-battle-container">
        {/* Top Header Badge */}
        <div className="versus-header-bar">
          <div className="versus-title-badge">
            <Swords size={18} className="versus-icon-spin" />
            <span>CLASH OF TITANS • MOVIE DUEL</span>
          </div>
          <button className="versus-next-btn" onClick={handleNextMatch}>
            <span>Next Matchup ({matchupIndex + 1}/{VERSUS_MATCHUPS.length})</span>
            <ChevronRight size={16} />
          </button>
        </div>

        <div className="versus-tagline-strip">
          <Flame size={14} color="#f59e0b" />
          <span>{currentMatch.tagline}</span>
        </div>

        {/* Duel Grid */}
        <div className="versus-arena">
          {/* Film A */}
          <div className={`versus-combatant combatant-a ${userChoice === 'a' ? 'combatant-selected' : ''} ${animatingWinner === 'a' ? 'combatant-pulse' : ''}`}>
            <div className="versus-poster-wrap">
              <img
                src={currentMatch.filmA.poster}
                alt={currentMatch.filmA.title}
                className="versus-poster-img"
                loading="lazy"
              />
              <div className="versus-poster-overlay" />
              <div className="versus-film-badge">CORNER A</div>
            </div>
            <div className="versus-meta">
              <h3 className="versus-film-title">{currentMatch.filmA.title}</h3>
              <p className="versus-film-sub">{currentMatch.filmA.year} • {currentMatch.filmA.director}</p>
              <div className="versus-character-tag">{currentMatch.filmA.character}</div>
            </div>
            <button
              className={`versus-vote-btn vote-btn-a ${userChoice === 'a' ? 'voted' : ''}`}
              onClick={() => handleVote('a')}
            >
              {userChoice === 'a' ? <Check size={16} /> : <Trophy size={16} />}
              <span>{userChoice === 'a' ? 'YOUR PICK!' : `VOTE ${currentMatch.filmA.title.toUpperCase()}`}</span>
            </button>
          </div>

          {/* Center VS Clash Badge */}
          <div className="versus-center-divider">
            <div className="versus-vs-circle">
              <span className="vs-text">VS</span>
              <div className="vs-glow-ring" />
            </div>
            <div className="versus-live-tally">
              <span className="tally-count">{totalVotes.toLocaleString()} VOTES</span>
            </div>
          </div>

          {/* Film B */}
          <div className={`versus-combatant combatant-b ${userChoice === 'b' ? 'combatant-selected' : ''} ${animatingWinner === 'b' ? 'combatant-pulse' : ''}`}>
            <div className="versus-poster-wrap">
              <img
                src={currentMatch.filmB.poster}
                alt={currentMatch.filmB.title}
                className="versus-poster-img"
                loading="lazy"
              />
              <div className="versus-poster-overlay" />
              <div className="versus-film-badge badge-b">CORNER B</div>
            </div>
            <div className="versus-meta">
              <h3 className="versus-film-title">{currentMatch.filmB.title}</h3>
              <p className="versus-film-sub">{currentMatch.filmB.year} • {currentMatch.filmB.director}</p>
              <div className="versus-character-tag tag-b">{currentMatch.filmB.character}</div>
            </div>
            <button
              className={`versus-vote-btn vote-btn-b ${userChoice === 'b' ? 'voted' : ''}`}
              onClick={() => handleVote('b')}
            >
              {userChoice === 'b' ? <Check size={16} /> : <Trophy size={16} />}
              <span>{userChoice === 'b' ? 'YOUR PICK!' : `VOTE ${currentMatch.filmB.title.toUpperCase()}`}</span>
            </button>
          </div>
        </div>

        {/* Tug of War Percentage Bar */}
        <div className="versus-tug-of-war">
          <div className="tug-labels">
            <span className="tug-label-a">{currentMatch.filmA.title}: {percentA}%</span>
            <span className="tug-label-b">{percentB}% :{currentMatch.filmB.title}</span>
          </div>
          <div className="tug-bar-track">
            <div
              className="tug-bar-fill-a"
              style={{ width: `${percentA}%` }}
            />
            <div
              className="tug-bar-fill-b"
              style={{ width: `${percentB}%` }}
            />
            <div
              className="tug-bar-clash-spark"
              style={{ left: `${percentA}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default memo(MovieVersusBattle);

