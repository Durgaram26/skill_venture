/**
 * Netlify serverless function — wraps the Express app so both
 * frontend (Netlify static) and backend (Netlify Function) live
 * on the same domain with no need for a separate server host.
 *
 * Requests to /api/* are rewritten to /.netlify/functions/api
 * by the redirect rule in netlify.toml.
 */
import serverless from 'serverless-http';
import { createApp } from '../../apps/server/src/app.js';
import { connectDatabase } from '../../apps/server/src/config/db.js';
import { connectRedis } from '../../apps/server/src/config/redis.js';

// Re-use connections across warm Lambda invocations.
let ready = false;

async function ensureConnections() {
  if (!ready) {
    await connectDatabase();
    await connectRedis(); // no-op if REDIS_URL is not set
    ready = true;
  }
}

const app = createApp();
const serverlessHandler = serverless(app);

export const handler = async (event: object, context: object) => {
  await ensureConnections();
  return serverlessHandler(event, context);
};
