import { expireFeaturedListings } from '../modules/payments/payments.service.js';
import { env } from '../config/env.js';

const INTERVAL_MS = 15 * 60 * 1000;

/** Expire featured listings on a timer (Phase 4 cron substitute). */
export function startFeaturedExpiryJob(): void {
  if (env.NODE_ENV === 'test') return;

  const run = () => {
    void expireFeaturedListings()
      .then((n) => {
        if (n > 0) console.log(`[jobs] expired ${n} featured listing(s)`);
      })
      .catch((err: unknown) => {
        console.error('[jobs] featured expiry failed', err);
      });
  };

  run();
  setInterval(run, INTERVAL_MS);
}
