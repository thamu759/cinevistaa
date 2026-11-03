import { useState, useEffect } from 'react';
import { fetchTmdbLogo } from '../api';

export const KNOWN_MOVIE_LOGOS = {
  vikram: 'https://image.tmdb.org/t/p/w500/803y6O9H2q2Jj5SkbRTysZ2zlmx.png',
  vikram2022: 'https://image.tmdb.org/t/p/w500/803y6O9H2q2Jj5SkbRTysZ2zlmx.png',
  kaithi: 'https://image.tmdb.org/t/p/w500/fijhfw58jGeKtjfs1Iqk0euWpco.png',
  jaibhim: 'https://image.tmdb.org/t/p/w500/tBk7iP4CTEbB2XdLrwfA5ReM2Wu.png',
  'jai-bhim': 'https://image.tmdb.org/t/p/w500/tBk7iP4CTEbB2XdLrwfA5ReM2Wu.png',
  bladerunner2049: 'https://image.tmdb.org/t/p/w500/gUoDt6GggEFXVzdyDTyF8ggrEm8.png',
  'blade-runner-2049': 'https://image.tmdb.org/t/p/w500/gUoDt6GggEFXVzdyDTyF8ggrEm8.png',
  leo: 'https://image.tmdb.org/t/p/w500/lQijgtGf04ftXEvyuj647BB5TTE.png',
  jailer: 'https://image.tmdb.org/t/p/w500/okWLFUeEfYak5iSXeqHL8472Uju.png',
  jailer2: 'https://image.tmdb.org/t/p/w500/okWLFUeEfYak5iSXeqHL8472Uju.png',
  'jailer-2': 'https://image.tmdb.org/t/p/w500/okWLFUeEfYak5iSXeqHL8472Uju.png',
  goat: 'https://image.tmdb.org/t/p/w500/xvXJfGKjHHe1m4Usye198DCw7iJ.png',
  thegreatestofalltime: 'https://image.tmdb.org/t/p/w500/xvXJfGKjHHe1m4Usye198DCw7iJ.png',
  'the-greatest-of-all-time': 'https://image.tmdb.org/t/p/w500/xvXJfGKjHHe1m4Usye198DCw7iJ.png',
  aavesham: 'https://image.tmdb.org/t/p/w500/vAndItVk0PTGIs9xd4nPOpYL8ey.png',
  manjummelboys: 'https://image.tmdb.org/t/p/w500/vAndItVk0PTGIs9xd4nPOpYL8ey.png',
  'manjummel-boys': 'https://image.tmdb.org/t/p/w500/vAndItVk0PTGIs9xd4nPOpYL8ey.png',
  kanguva: 'https://image.tmdb.org/t/p/w500/xvXJfGKjHHe1m4Usye198DCw7iJ.png',
  vettaiyan: 'https://image.tmdb.org/t/p/w500/okWLFUeEfYak5iSXeqHL8472Uju.png',
  master: 'https://image.tmdb.org/t/p/w500/lQijgtGf04ftXEvyuj647BB5TTE.png'
};

const normalizeKey = (str) => (str || '').toLowerCase().replace(/[^a-z0-9]/g, '');

export default function MovieLogo({ movie }) {
  const { tmdbId, title = '', titleLogoUrl = '', id = '' } = movie || {};

  const cleanTitle = normalizeKey(title);
  const cleanId = normalizeKey(id);
  const initialLogo = titleLogoUrl || KNOWN_MOVIE_LOGOS[cleanId] || KNOWN_MOVIE_LOGOS[cleanTitle] || null;

  const [logoUrl, setLogoUrl] = useState(initialLogo);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);

    if (titleLogoUrl) {
      setLogoUrl(titleLogoUrl);
      return;
    }

    const curated = KNOWN_MOVIE_LOGOS[cleanId] || KNOWN_MOVIE_LOGOS[cleanTitle];
    if (curated) {
      setLogoUrl(curated);
      return;
    }

    setLogoUrl(null);
    let isMounted = true;

    fetchTmdbLogo(tmdbId, title, id).then(url => {
      if (isMounted && url) {
        setLogoUrl(url);
      }
    }).catch(() => {});

    return () => { isMounted = false; };
  }, [tmdbId, title, titleLogoUrl, id, cleanId, cleanTitle]);

  if (!imgError && logoUrl) {
    return (
      <img
        src={logoUrl}
        alt={title}
        className="hero-logo"
        onError={() => setImgError(true)}
      />
    );
  }

  // Cinematic styled typography fallback
  return (
    <div className="hero-styled-title-logo">
      <span className="hero-styled-title-text">{title}</span>
    </div>
  );
}
