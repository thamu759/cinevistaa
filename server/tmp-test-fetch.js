const fetch = globalThis.fetch;
(async () => {
  try {
    const response = await fetch('http://localhost:5000/api/movies');
    console.log('status', response.status);
    const json = await response.json();
    console.log('movies count', Array.isArray(json) ? json.length : typeof json);
  } catch (err) {
    console.error('fetch error', err);
  }
})();
