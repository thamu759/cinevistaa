const STRAPI_URL = (import.meta.env.VITE_STRAPI_URL || '').replace(/\/$/, '');

export function isStrapiConfigured() {
  return Boolean(STRAPI_URL);
}

async function strapiFetch(path, options = {}) {
  if (!STRAPI_URL) throw new Error('VITE_STRAPI_URL not configured');
  const url = `${STRAPI_URL}/api${path}`;
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    ...options
  });
  if (!res.ok) {
    throw new Error(`Strapi request failed: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

function normalize(article) {
  if (!article) return null;
  const attrs = article.attributes || article;
  const id = attrs.slug || article.slug || attrs.id || article.id;
  return {
    id,
    title: attrs.title || '',
    excerpt: attrs.excerpt || '',
    content: attrs.content || '',
    author: attrs.author || 'thiraipedia Editorial',
    date: attrs.date || (attrs.publishedAt ? new Date(attrs.publishedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : ''),
    readTime: attrs.readTime || '',
    category: attrs.category || ''
  };
}

function normalizeList(payload) {
  const data = payload?.data || payload || [];
  if (Array.isArray(data)) {
    return data.map(normalize).filter(Boolean);
  }
  return [];
}

export async function fetchStrapiArticles() {
  const json = await strapiFetch('/articles?populate=*&sort=publishedAt:desc');
  return normalizeList(json);
}

export async function fetchStrapiArticleBySlug(slug) {
  const json = await strapiFetch(`/articles?filters[slug][$eq]=${encodeURIComponent(slug)}&populate=*`);
  const list = normalizeList(json);
  return list[0] || null;
}
