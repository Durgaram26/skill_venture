/**
 * Seed an admin user for local Phase 1 moderation.
 * Usage: npx tsx src/scripts/seed-admin.ts
 */
import bcrypt from 'bcrypt';
import { connectDatabase, disconnectDatabase } from '../config/db.js';
import { User } from '../models/User.js';
import { env } from '../config/env.js';

async function main() {
  await connectDatabase();
  const email = process.env.ADMIN_EMAIL ?? 'admin@skillventures.local';
  const password = process.env.ADMIN_PASSWORD ?? 'AdminPass123';
  const name = process.env.ADMIN_NAME ?? 'Admin User';

  const existing = await User.findOne({ email });
  if (existing) {
    existing.role = 'admin';
    existing.isVerified = true;
    existing.passwordHash = await bcrypt.hash(password, env.BCRYPT_COST);
    await existing.save();
    console.info(`[seed] updated admin ${email}`);
  } else {
    await User.create({
      role: 'admin',
      name,
      email,
      passwordHash: await bcrypt.hash(password, env.BCRYPT_COST),
      authProvider: 'local',
      isVerified: true,
    });
    console.info(`[seed] created admin ${email}`);
  }

  console.info(`[seed] password: ${password}`);
  await disconnectDatabase();
}

main().catch(async (err) => {
  console.error(err);
  await disconnectDatabase();
  process.exit(1);
});
