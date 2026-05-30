const fetch = globalThis.fetch;
(async () => {
  try {
    const res = await fetch('http://localhost:5000/api/movies');
    const json = await res.json();
    json.slice(0,5).forEach(m => {
      console.log('---');
      console.log(m.id);
      console.log(m.posterUrl);
      console.log(m.backdropUrl);
    });
  } catch (err) {
    console.error(err);
  }
})();
