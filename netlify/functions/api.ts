/**
 * Netlify serverless function — wraps the Express app so both
 * frontend (Netlify static) and backend (Netlify Function) live
 * on the same domain with no need for a separate Railway/Render deployment.
 *
 * Requests to /api/* are rewritten to /.netlify/functions/api by
 * the redirect rule in netlify.toml, then handled here.
 *
 * This file is bundled by esbuild (see build command in netlify.toml)
 * into netlify/functions/api.cjs — a single self-contained CJS bundle.
 */
import serverless from 'serverless-http';
import { createApp } from '../../apps/server/src/app.js';
import { connectDatabase } from '../../apps/server/src/config/db.js';
import { connectRedis } from '../../apps/server/src/config/redis.js';

// Re-use DB + Redis connections across warm Lambda invocations.
let isConnected = false;

async function ensureConnections() {
  if (!isConnected) {
    await connectDatabase();
    await connectRedis(); // no-op if REDIS_URL not set
    isConnected = true;
  }
}

const app = createApp();
const handler = serverless(app);

export { handler };

// Netlify Functions cold-start: connect before first request
export const netlifyHandler = async (event: object, context: object) => {
  await ensureConnections();
  return handler(event, context);
};
