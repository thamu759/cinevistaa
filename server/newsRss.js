import { XMLParser } from 'fast-xml-parser';
import { getCineUpdates } from './db.js';

const NEWS_SOURCES = [
  { query: 'Kollywood+Tamil+cinema+movie', lang: 'en', region: 'IN', category: 'Kollywood' },
  { query: 'Mollywood+Malayalam+cinema+movie', lang: 'en', region: 'IN', category: 'Mollywood' },
  { query: 'Tamil+film+box+office+release', lang: 'en', region: 'IN', category: 'Box Office' },
  { query: 'Malayalam+film+box+office+release', lang: 'en', region: 'IN', category: 'Box Office' },
];

const MAX_NEWS_AGE_MS = 7 * 864e5;

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
});

function relativeTime(date, now = Date.now()) {
  const diff = Math.max(0, now - date.getTime());
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return date.toISOString().split('T')[0];
}

function extractImageFromDescription(description) {
  const imgMatch = description.match(/<img[^>]+src="([^">]+)"/);
  return imgMatch ? imgMatch[1] : '';
}

function cleanDescription(description) {
  return description
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

function guessMovieName(title) {
  const moviePatterns = [
    /[""]([^""]+)[""]/,
    /'([^']+)'/,
    /([A-Z][A-Za-z]+(?:\s[A-Z][A-Za-z]+)*(?:\s\d+)?)\s+(?:movie|film|review|trailer|release)/,
    /['"]([A-Za-z][A-Za-z\s]+?)['"]\s+(?:review|trailer|teaser|release)/i,
    /(?:movie|film|of)\s+[""]?([A-Za-z][A-Za-z\s]+(?:Part\s+\d+)?)[""]?/i,
  ];
  for (const pattern of moviePatterns) {
    const match = title.match(pattern);
    if (match && match[1].length > 2) {
      const name = match[1].trim();
      if (name.length < 40) return name;
    }
  }
  return '';
}

export async function fetchNewsUpdates(count = 20) {
  const updates = [];
  const seenUrls = new Set();

  let existingTitles = new Set();
  try {
    existingTitles = new Set((await getCineUpdates()).map(u => (u.title || '').toLowerCase()));
  } catch (e) {
    console.warn('News RSS: could not load existing update titles:', e.message);
  }

  for (const source of NEWS_SOURCES) {
    if (updates.length >= count) break;

    const url = `https://news.google.com/rss/search?q=${source.query}&hl=${source.lang}&gl=${source.region}`;

    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      });
      if (!res.ok) { console.warn(`News RSS fetch failed for ${source.query}:`, res.status); continue; }

      const xml = await res.text();
      const parsed = parser.parse(xml);
      const items = parsed?.rss?.channel?.item || [];

      for (const item of items.slice(0, 12)) {
        if (updates.length >= count) break;
        const link = item.link || '';
        if (!link || seenUrls.has(link)) continue;
        seenUrls.add(link);

        const title = item.title || '';
        if (!title) continue;
        const titleKey = title.toLowerCase();
        if (existingTitles.has(titleKey)) continue;

        const description = item.description || '';
        const imageUrl = extractImageFromDescription(description);
        const body = cleanDescription(description).slice(0, 300) || title;
        const movieName = guessMovieName(title);

        const pubDateStr = item.pubDate || item.publishedAt || '';
        const pubDate = pubDateStr ? new Date(pubDateStr) : null;
        const validPub = pubDate && !isNaN(pubDate.getTime());
        if (validPub && Date.now() - pubDate.getTime() > MAX_NEWS_AGE_MS) continue;

        existingTitles.add(titleKey);
        updates.push({
          title,
          body,
          category: source.category,
          movieName,
          imageUrl,
          timestamp: validPub ? relativeTime(pubDate) : 'Just now',
          createdAt: validPub ? pubDate.toISOString() : new Date().toISOString(),
          likes: Math.floor(Math.random() * 200) + 10,
          likedBy: [],
        });
      }
    } catch (err) {
      console.warn(`News RSS error for ${source.query}:`, err.message);
    }
  }

  return updates.slice(0, count);
}
