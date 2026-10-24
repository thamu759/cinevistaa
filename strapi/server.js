const strapi = require('@strapi/strapi');

const app = strapi({
  dir: __dirname,
  autoReload: false,
  serveAdminPanel: true,
});

app.start().catch((err) => {
  console.error(err);
  process.exit(1);
});
