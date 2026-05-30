const fetch = globalThis.fetch;
(async () => {
  try {
    const key = 'cdef1e87093b92da3dcf8e7032daf61c';
    const resp = await fetch(`https://api.themoviedb.org/3/movie/660046?api_key=${key}`);
    console.log('status', resp.status);
    const json = await resp.json();
    console.log('title', json.title);
  } catch (err) {
    console.error('fetch error', err);
  }
})();
