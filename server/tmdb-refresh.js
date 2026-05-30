const fetch = globalThis.fetch;
(async () => {
  const base = 'http://localhost:5000/api';
  try {
    let token;
    const login = await fetch(`${base}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'password' })
    });
    if (login.ok) {
      const data = await login.json();
      token = data.token;
      console.log('Logged in admin');
    } else {
      const reg = await fetch(`${base}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'admin', email: 'admin@example.com', password: 'password' })
      });
      const regJson = await reg.json();
      if (!reg.ok) {
        console.error('Register failed', reg.status, regJson);
        process.exit(1);
      }
      token = regJson.token;
      console.log('Registered admin');
    }
    const refresh = await fetch(`${base}/admin/refresh-posters`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    });
    const json = await refresh.json();
    console.log('Refresh', refresh.status, JSON.stringify(json, null, 2));
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
})();
