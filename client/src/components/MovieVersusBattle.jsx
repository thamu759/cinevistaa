import { useState, useCallback, memo } from 'react';
import { Swords, Flame, Trophy, ChevronRight, Check } from 'lucide-react';
import { playDuelFanfare, playPopcornPop } from '../utils/cinemaAudio';

const VERSUS_MATCHUPS = [
  {
    id: 'baasha_vs_padayappa',
    category: 'SUPERSTAR LEGACY DUEL',
    filmA: {
      title: 'Baasha',
      year: '1995',
      director: 'Suresh Krissna',
      actor: 'Rajinikanth',
      character: 'Manick Baasha',
      poster: 'https://image.tmdb.org/t/p/w500/uLr5K6tM8RlhU90bM38eE87YQfK.jpg',
      initialVotes: 1420,
    },
    filmB: {
      title: 'Padayappa',
      year: '1999',
      director: 'K. S. Ravikumar',
      actor: 'Rajinikanth',
      character: 'Aarupadayappa',
      poster: 'https://image.tmdb.org/t/p/w500/kZp7x0j3cE0vR7p09k9F0j6z2cM.jpg',
      initialVotes: 1290,
    },
  },
  {
    id: 'vikram_vs_leo',
    category: 'LCU UNIVERSE CLASH',
    filmA: {
      title: 'Vikram',
      year: '2022',
      director: 'Lokesh Kanagaraj',
      actor: 'Kamal Haasan',
      character: 'Agent Vikram',
      poster: 'https://image.tmdb.org/t/p/w500/bKxiKNQZZ7U1wNuY7p823c9E32J.jpg',
      initialVotes: 2150,
    },
    filmB: {
      title: 'Leo',
      year: '2023',
      director: 'Lokesh Kanagaraj',
      actor: 'Thalapathy Vijay',
      character: 'Parthiban / Leo Das',
      poster: 'https://image.tmdb.org/t/p/w500/mxl5H3a9jG6Xp09w5H4Z1v8E2dM.jpg',
      initialVotes: 2430,
    },
  },
  {
    id: 'thuppakki_vs_mankatha',
    category: 'MODERN COMMERCIAL PEAKS',
    filmA: {
      title: 'Thuppakki',
      year: '2012',
      director: 'AR Murugadoss',
      actor: 'Thalapathy Vijay',
      character: 'Captain Jagadish',
      poster: 'https://image.tmdb.org/t/p/w500/18Lhkc3nf92bY1cacQomXIqihhN.jpg',
      initialVotes: 1890,
    },
    filmB: {
      title: 'Mankatha',
      year: '2011',
      director: 'Venkat Prabhu',
      actor: 'Ajith Kumar',
      character: 'Vinayak Mahadev',
      poster: 'https://image.tmdb.org/t/p/w500/5U8MWIk9XZ60NALyOTpyX7vXIR7.jpg',
      initialVotes: 1940,
    },
  },
  {
    id: 'ghilli_vs_pokkiri',
    category: 'MASS CINEMA MILESTONES',
    filmA: {
      title: 'Ghilli',
      year: '2004',
      director: 'Dharani',
      actor: 'Thalapathy Vijay',
      character: 'Velu',
      poster: 'https://image.tmdb.org/t/p/w500/AjaNAeMXOrK9n0YqGqX0Lz5qxYu.jpg',
      initialVotes: 2280,
    },
    filmB: {
      title: 'Pokkiri',
      year: '2007',
      director: 'Prabhu Deva',
      actor: 'Thalapathy Vijay',
      character: 'Thamizh',
      poster: 'https://image.tmdb.org/t/p/w500/7aqx7T9FNu1HPCyb0CBjJtjshoU.jpg',
      initialVotes: 1760,
    },
  },
];

function MovieVersusBattle() {
  const [matchupIndex, setMatchupIndex] = useState(0);
  const currentMatch = VERSUS_MATCHUPS[matchupIndex];

  const [userVotes, setUserVotes] = useState(() => {
    if (typeof window === 'undefined') return {};
    try {
      return JSON.parse(localStorage.getItem('tp_versus_votes') || '{}');
    } catch {
      return {};
    }
  });

  const [tallies, setTallies] = useState(() => {
    const initial = {};
    VERSUS_MATCHUPS.forEach(m => {
      initial[m.id] = { a: m.filmA.initialVotes, b: m.filmB.initialVotes };
    });
    return initial;
  });

  const [animatingWinner, setAnimatingWinner] = useState(null);

  const currentTally = tallies[currentMatch.id] || { a: currentMatch.filmA.initialVotes, b: currentMatch.filmB.initialVotes };
  const userChoice = userVotes[currentMatch.id];

  const totalVotes = currentTally.a + currentTally.b;
  const percentA = Math.round((currentTally.a / totalVotes) * 100);
  const percentB = 100 - percentA;

  const handleVote = useCallback((choice) => {
    if (userChoice === choice) return;

    playDuelFanfare();
    setAnimatingWinner(choice);
    setTimeout(() => setAnimatingWinner(null), 800);

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
    <div className="luxury-versus-section">
      <div className="luxury-versus-container">
        {/* Top Header */}
        <div className="luxury-versus-header">
          <div className="luxury-versus-badge">
            <Swords size={15} />
            <span>CINEMA DUEL • LEGACY FACE-OFF</span>
          </div>
          <button className="luxury-versus-next" onClick={handleNextMatch}>
            <span>Matchup {matchupIndex + 1} of {VERSUS_MATCHUPS.length}</span>
            <ChevronRight size={15} />
          </button>
        </div>

        <div className="luxury-versus-tagline">
          <Flame size={13} />
          <span>{currentMatch.category}</span>
        </div>

        {/* Duel Grid */}
        <div className="luxury-versus-arena">
          {/* Film A */}
          <div className={`luxury-combatant combatant--a ${userChoice === 'a' ? 'combatant--active' : ''} ${animatingWinner === 'a' ? 'combatant--flash' : ''}`}>
            <div className="luxury-poster-box">
              <img
                src={currentMatch.filmA.poster}
                alt={currentMatch.filmA.title}
                className="luxury-poster-img"
                loading="lazy"
              />
              <div className="luxury-poster-sheen" />
              <div className="luxury-corner-label">CONTENDER A</div>
            </div>
            <div className="luxury-combatant-info">
              <h3 className="luxury-film-name">{currentMatch.filmA.title}</h3>
              <p className="luxury-film-credits">{currentMatch.filmA.year} • Dir. {currentMatch.filmA.director}</p>
              <div className="luxury-character-badge">{currentMatch.filmA.character}</div>
            </div>
            <button
              className={`luxury-vote-btn ${userChoice === 'a' ? 'luxury-vote-btn--selected' : ''}`}
              onClick={() => handleVote('a')}
            >
              {userChoice === 'a' ? <Check size={15} /> : <Trophy size={15} />}
              <span>{userChoice === 'a' ? 'SELECTED' : `VOTE ${currentMatch.filmA.title.toUpperCase()}`}</span>
            </button>
          </div>

          {/* Center VS Divider */}
          <div className="luxury-versus-center">
            <div className="luxury-vs-ring">
              <span className="vs-symbol">VS</span>
            </div>
            <span className="luxury-votes-counter">{totalVotes.toLocaleString()} CRITIC VOTES</span>
          </div>

          {/* Film B */}
          <div className={`luxury-combatant combatant--b ${userChoice === 'b' ? 'combatant--active' : ''} ${animatingWinner === 'b' ? 'combatant--flash' : ''}`}>
            <div className="luxury-poster-box">
              <img
                src={currentMatch.filmB.poster}
                alt={currentMatch.filmB.title}
                className="luxury-poster-img"
                loading="lazy"
              />
              <div className="luxury-poster-sheen" />
              <div className="luxury-corner-label label--b">CONTENDER B</div>
            </div>
            <div className="luxury-combatant-info">
              <h3 className="luxury-film-name">{currentMatch.filmB.title}</h3>
              <p className="luxury-film-credits">{currentMatch.filmB.year} • Dir. {currentMatch.filmB.director}</p>
              <div className="luxury-character-badge badge--b">{currentMatch.filmB.character}</div>
            </div>
            <button
              className={`luxury-vote-btn ${userChoice === 'b' ? 'luxury-vote-btn--selected' : ''}`}
              onClick={() => handleVote('b')}
            >
              {userChoice === 'b' ? <Check size={15} /> : <Trophy size={15} />}
              <span>{userChoice === 'b' ? 'SELECTED' : `VOTE ${currentMatch.filmB.title.toUpperCase()}`}</span>
            </button>
          </div>
        </div>

        {/* Tug of War Gauge */}
        <div className="luxury-gauge-strip">
          <div className="gauge-titles">
            <span className="gauge-name-a">{currentMatch.filmA.title} ({percentA}%)</span>
            <span className="gauge-name-b">({percentB}%) {currentMatch.filmB.title}</span>
          </div>
          <div className="gauge-track">
            <div className="gauge-fill-a" style={{ width: `${percentA}%` }} />
            <div className="gauge-fill-b" style={{ width: `${percentB}%` }} />
            <div className="gauge-spark" style={{ left: `${percentA}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default memo(MovieVersusBattle);
