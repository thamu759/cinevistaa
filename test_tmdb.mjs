const TMDB_API_BASE_URL = 'https://api.themoviedb.org';
const TMDB_ACCESS_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJjZGVmMWU4NzA5M2I5MmRhM2RjZjhlNzAzMmRhZjYxYyIsIm5iZiI6MTczODczMzA1NC41ODUsInN1YiI6IjY3YTJmNWZlYmViMTdjODc2YTlmZDA3NiIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.Jg9n03AKYUJwAxNLPoWazyJf_QHXiEBNmtY6idwMWC8';

const headers = {
  'Authorization': `Bearer ${TMDB_ACCESS_TOKEN}`,
  'accept': 'application/json'
};

const buildUrl = (path) => `${TMDB_API_BASE_URL}/3/${path}`;

async function test() {
  // Test search
  const searchRes = await fetch(buildUrl('search/movie?query=Inception&page=1'), { headers });
  const searchData = await searchRes.json();
  const tmdbId = searchData.results[0].id;
  console.log('Search result tmdbId:', tmdbId);

  // Test credits
  const creditsRes = await fetch(buildUrl(`movie/${tmdbId}/credits`), { headers });
  const creditsData = await creditsRes.json();
  console.log('Cast count:', creditsData.cast?.length);
  const top8 = creditsData.cast.slice(0, 8).map(m => ({ name: m.name, hasProfile: !!m.profile_path }));
  console.log('Top 8 cast:', JSON.stringify(top8, null, 2));
  const director = creditsData.crew?.find(c => c.job === 'Director')?.name || '';
  console.log('Director:', director);
  const writer = creditsData.crew?.find(c => c.department === 'Writing')?.name || '';
  console.log('Writer:', writer);

  // Test details
  const detailsRes = await fetch(buildUrl(`movie/${tmdbId}`), { headers });
  const detailsData = await detailsRes.json();
  console.log('Genres:', detailsData.genres?.map(g => g.name));
  console.log('Runtime:', detailsData.runtime);
  const studio = detailsData.production_companies?.[0]?.name || '';
  console.log('Studio:', studio);

  // Test our pickTmdbCredits logic
  const pick = (credits) => {
    if (!credits || !Array.isArray(credits.cast)) return null;
    return credits.cast
      .slice(0, 8)
      .map(member => ({
        name: member.name,
        role: member.character || '',
        avatarUrl: member.profile_path ? `https://image.tmdb.org/t/p/w185${member.profile_path}` : ''
      }));
  };
  const picked = pick(creditsData);
  console.log('Picked cast count:', picked?.length);
  console.log('First 3 picked:', JSON.stringify(picked?.slice(0, 3), null, 2));
}

test().catch(console.error);
