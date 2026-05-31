import { useState, useEffect } from 'react';
import { fetchTmdbLogo } from '../api';

export default function MovieLogo({ movie }) {
  const [logoUrl, setLogoUrl] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const { tmdbId, title } = movie;

  useEffect(() => {
    if (!tmdbId) { setLoaded(true); return; }
    setLogoUrl(null);
    setLoaded(false);
    fetchTmdbLogo(tmdbId).then(url => { setLogoUrl(url); setLoaded(true); });
  }, [tmdbId]);

  if (!loaded) return <h1 className="hero-title">{title}</h1>;
  if (logoUrl) return <img src={logoUrl} alt={title} className="hero-logo" />;
  return <h1 className="hero-title">{title}</h1>;
}
