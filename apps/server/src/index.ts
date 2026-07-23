import { createApp } from './app.js';
import { connectDatabase } from './config/db.js';
import { connectRedis } from './config/redis.js';
import { env } from './config/env.js';
import { startFeaturedExpiryJob } from './jobs/featuredExpiry.js';

async function bootstrap(): Promise<void> {
  await connectDatabase();
  await connectRedis();

  startFeaturedExpiryJob();

  const app = createApp();
  app.listen(env.PORT, () => {
    console.log(`[server] listening on :${env.PORT} (${env.NODE_ENV})`);
  });
}

bootstrap().catch((error: unknown) => {
  console.error('[server] failed to start', error);
  process.exit(1);
});
