import { createApp } from './app.js';
import { connectDatabase, disconnectDatabase } from './config/db.js';
import { env } from './config/env.js';

async function main() {
  await connectDatabase(env.mongoUri);
  const app = createApp();
  const server = app.listen(env.port, () => {
    console.log(`[server] Streakly API running on http://localhost:${env.port}`);
    if (env.isProduction) {
      console.log('[server] Serving the built client from client/dist when available.');
    }
  });

  const shutdown = async (signal) => {
    console.log(`\n[server] ${signal} received. Closing gracefully...`);
    server.close(async () => {
      await disconnectDatabase();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 8000).unref();
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

main().catch((error) => {
  console.error('[server] Failed to start:', error.message);
  process.exit(1);
});
