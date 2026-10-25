const STRAPI_URL = import.meta.env.VITE_STRAPI_URL ? import.meta.env.VITE_STRAPI_URL.replace(/\/$/, '') : '';

export function isStrapiConfigured() {
  return Boolean(STRAPI_URL);
}

async function strapiFetch(endpoint) {
  if (!STRAPI_URL) {
    throw new Error('Strapi URL not configured');
  }

  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${STRAPI_URL}/api${path}`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Strapi request failed: ${res.status}`);
  }

  return res.json();
}

function normalizeArticle(item) {
  const attrs = item.attributes || item;
  return {
    id: attrs.slug || item.id,
    title: attrs.title || '',
    excerpt: attrs.excerpt || '',
    content: attrs.content || '',
    author: attrs.author || 'thiraipedia Editorial',
    date: attrs.date || (attrs.publishedAt ? attrs.publishedAt.slice(0, 10) : ''),
    readTime: attrs.readTime || '4 min read',
    category: attrs.category || 'General',
    slug: attrs.slug || ''
  };
}

export async function fetchStrapiArticles() {
  const json = await strapiFetch('/articles?populate=*');
  const list = Array.isArray(json?.data) ? json.data : [];
  return list.map(normalizeArticle);
}

export async function fetchStrapiArticleBySlug(slug) {
  const json = await strapiFetch(`/articles?filters[slug][$eq]=${encodeURIComponent(slug)}&populate=*`);
  const list = Array.isArray(json?.data) ? json.data : [];
  if (list.length === 0) return null;
  return normalizeArticle(list[0]);
}
