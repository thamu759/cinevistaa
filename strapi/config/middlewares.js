module.exports = ({ env }) => ({
  settings: {
    cors: {
      enabled: true,
      headers: '*',
      origin: env.array('CORS_ORIGIN', ['http://localhost:5173', 'http://localhost:3000', 'https://cinevistaa.netlify.app']),
    },
  },
});
