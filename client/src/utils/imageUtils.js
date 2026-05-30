// Utility functions for optimized image loading

// Common image sizes for responsive srcset
const IMAGE_SIZES = [
  { width: 92,  suffix: 'w92'   },   // Avatars, small thumbnails
  { width: 185, suffix: 'w185'  },   // Medium posters
  { width: 300, suffix: 'w300'  },   // Standard movie cards
  { width: 500, suffix: 'w500'  },   // Large cards, grid items
  { width: 780, suffix: 'w780'  },   // Featured images
  { width: 1280,suffix: 'w1280' }    // Full-width displays
];

/**
 * Generate a responsive image URL for TMDB-like paths
 * @param {string} posterPath - The TMDB poster path (e.g., "/abc123.jpg")
 * @param {string} baseUrl - Base URL for images (defaults to TMDB)
 * @returns {string} Srcset string for responsive images
 */
export const generateResponsiveImageUrl = (posterPath, baseUrl = 'https://image.tmdb.org/t/p') => {
  if (!posterPath || typeof posterPath !== 'string') return '';
  
  // Ensure posterPath starts with /
  const normalizedPath = posterPath.startsWith('/') ? posterPath : `/${posterPath}`;
  
  // Generate srcset with multiple sizes
  return IMAGE_SIZES.map(size => 
    `${baseUrl}/${size.suffix}${normalizedPath} ${size.width}w`
  ).join(', ');
};

/**
 * Get image URL for a specific size (wrapper around existing proxyImageUrl)
 * @param {string} originalUrl - Original image URL
 * @param {string} size - Size identifier (w92, w185, w300, etc.)
 * @returns {string} Proxy URL for the image
 */
export const getSizedImageUrl = (originalUrl, size) => {
  // Import here to avoid circular dependencies
  // In practice, you'd pass proxyImageUrl as a parameter or use context
  return originalUrl; // Placeholder - actual implementation would use proxy
};

/**
 * Determine if an image should be lazy loaded based on its position
 * This is a simplified version - in practice you'd use Intersection Observer
 * @param {string} position - 'above-fold' or 'below-fold'
 * @returns {boolean} Whether to use lazy loading
 */
export const shouldLazyLoad = (position) => {
  return position === 'below-fold';
};
