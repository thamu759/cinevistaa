import OpenAI from 'openai';
import dotenv from 'dotenv';
dotenv.config();

const apiKey = process.env.OPENAI_API_KEY;
let openai = null;

if (apiKey && apiKey !== '') {
  openai = new OpenAI({ apiKey });
  console.log('[OpenAI] API key found, AI generation enabled');
} else {
  console.log('[OpenAI] No API key (set OPENAI_API_KEY in .env), AI generation disabled');
}

const AI_GENRE_MAP = {
  Action: 'action', Comedy: 'comedy', Drama: 'drama', Horror: 'horror',
  Thriller: 'thriller', Romance: 'romance', SciFi: 'science fiction',
  Fantasy: 'fantasy', Animation: 'animated', Documentary: 'documentary',
  Crime: 'crime', Mystery: 'mystery', Adventure: 'adventure',
  Musical: 'musical', Biography: 'biographical', History: 'historical',
  War: 'war', Western: 'western', Family: 'family',
};

const mapGenre = (genre) => {
  if (!genre) return 'cinematic';
  return AI_GENRE_MAP[genre] || genre.toLowerCase();
};

const generateSynopsisWithAI = async (title, genre, year, director) => {
  if (!openai) return null;
  const g = mapGenre(genre);
  const prompt = `Write a 2-3 sentence synopsis for a ${g} movie titled "${title}"${year ? ` (${year})` : ''}${director ? ` directed by ${director}` : ''}. Make it engaging and cinematic, suitable for a movie review website. Do not include any meta commentary. Just write the synopsis directly.`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 200,
      temperature: 0.7,
    });
    const text = response.choices[0]?.message?.content?.trim();
    if (text) return text;
  } catch (err) {
    console.warn('[OpenAI] Synopsis generation failed:', err.message);
  }
  return null;
};

const generateRatingWithAI = async (title, genre, description) => {
  if (!openai) return null;
  const g = mapGenre(genre);
  const prompt = `You are a movie critic. For the ${g} movie titled "${title}", rate it on three metrics:
1. criticScore (0-10, one decimal)
2. audienceScore (0-100, integer)
3. rating (0-10, one decimal)

Base your rating on the following synopsis: "${description}"

Respond with ONLY valid JSON in this exact format:
{"criticScore": 7.5, "audienceScore": 75, "rating": 7.2}`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 100,
      temperature: 0.7,
    });
    const text = response.choices[0]?.message?.content?.trim();
    if (!text) return null;

    const jsonMatch = text.match(/\{[^}]+\}/);
    if (!jsonMatch) return null;

    const parsed = JSON.parse(jsonMatch[0]);
    return {
      criticScore: Math.min(10, Math.max(0, parsed.criticScore ?? 7.0)),
      audienceScore: Math.min(100, Math.max(0, Math.round(parsed.audienceScore ?? 70))),
      rating: Math.min(10, Math.max(0, parsed.rating ?? 7.0)),
    };
  } catch (err) {
    console.warn('[OpenAI] Rating generation failed:', err.message);
  }
  return null;
};

export { generateSynopsisWithAI, generateRatingWithAI };
