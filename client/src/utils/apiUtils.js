/**
 * Utility functions for enhanced API error handling with retry mechanisms
 */

/**
 * Retry an async function with exponential backoff
 * @param {Function} fn - The async function to retry
 * @param {Object} options - Retry options
 * @param {number} options.maxRetries - Maximum number of retry attempts (default: 3)
 * @param {number} options.baseDelay - Base delay in ms for exponential backoff (default: 1000)
 * @param {number} options.maxDelay - Maximum delay in ms (default: 10000)
 * @returns {Promise} - Resolves with the function result or throws the last error
 */
export const retryAsync = async (fn, options = {}) => {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 10000
  } = options;

  let lastError;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // If this was the last attempt, don't retry
      if (attempt === maxRetries) {
        break;
      }
      
      // Calculate delay with exponential backoff and jitter
      const delay = Math.min(
        baseDelay * Math.pow(2, attempt) + Math.random() * 100,
        maxDelay
      );
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
};

/**
 * Enhanced fetch with automatic retry and better error handling
 * @param {string} url - The URL to fetch
 * @param {Object} options - Fetch options
 * @param {Object} retryOptions - Retry options (passed to retryAsync)
 * @returns {Promise<Response>} - The fetch response
 */
export const fetchWithRetry = async (url, options = {}, retryOptions = {}) => {
  return retryAsync(() => fetch(url, options), retryOptions);
};

/**
 * Generate user-friendly error messages based on error type and status
 * @param {Error|Object} error - The error object
 * @param {string} defaultMessage - Default message to use if error is not recognized
 * @returns {Object} - Object with message and recovery suggestions
 */
export const generateErrorMessage = (error, defaultMessage = 'An error occurred') => {
  // Network errors
  if (error.name === 'TypeError' && error.message.includes('fetch')) {
    return {
      message: 'Unable to connect to the server',
      suggestions: [
        'Check your internet connection',
        'Make sure the backend server is running',
        'Try again in a few moments'
      ],
      retryable: true
    };
  }
  
  // HTTP errors (we'll need to enhance the API functions to pass status info)
  if (error.status !== undefined) {
    switch (error.status) {
      case 400:
        return {
          message: 'Bad request - invalid data sent',
          suggestions: [
            'Please check your input and try again',
            'If the problem persists, contact support'
          ],
          retryable: false
        };
      case 401:
        return {
          message: 'Authentication required',
          suggestions: [
            'Please log in to continue',
            'If you believe this is an error, try logging out and back in'
          ],
          retryable: false
        };
      case 403:
        return {
          message: 'Access denied',
          suggestions: [
            'You do not have permission to perform this action',
            'Contact an administrator if you believe this is incorrect'
          ],
          retryable: false
        };
      case 404:
        return {
          message: 'Resource not found',
          suggestions: [
            'The requested item may have been removed',
            'Try searching for something else or browse the catalog'
          ],
          retryable: false
        };
      case 429:
        return {
          message: 'Too many requests - rate limited',
          suggestions: [
            'Please wait a moment before trying again',
            'We limit requests to prevent abuse'
          ],
          retryable: true,
          retryAfter: true
        };
      case 500:
        return {
          message: 'Internal server error',
          suggestions: [
            'Something went wrong on our end',
            'Please try again later',
            'If the problem persists, contact support'
          ],
          retryable: true
        };
      case 502:
      case 503:
      case 504:
        return {
          message: 'Service temporarily unavailable',
          suggestions: [
            'The server is currently undergoing maintenance',
            'Please try again in a few minutes'
          ],
          retryable: true
        };
      default:
        return {
          message: `Server error (${error.status})`,
          suggestions: [
            'Please try again later',
            'If the problem persists, contact support'
          ],
          retryable: error.status >= 500
        };
    }
  }
  
  // Generic fallback
  return {
    message: defaultMessage,
    suggestions: ['Please try again later'],
    retryable: true
  };
};