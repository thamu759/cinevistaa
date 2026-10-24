module.exports = ({ env }) => {
  const client = env('DATABASE_CLIENT', 'sqlite');

  const config = {
    client,
    connection: {},
    useNullAsDefault: true,
  };

  if (client === 'postgres') {
    config.connection = {
      connectionString: env('DATABASE_URL'),
      ssl: env.bool('DATABASE_SSL', true) ? { rejectUnauthorized: false } : false,
    };
  } else {
    config.connection = {
      filename: env('DATABASE_FILENAME', '.tmp/data.db'),
    };
    config.useNullAsDefault = true;
  }

  return { connection: config };
};
