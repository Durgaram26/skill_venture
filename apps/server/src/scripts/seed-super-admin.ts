/**
 * Seed super admin for local/staging.
 * Usage: npm run seed:super-admin -w @skillventures/server
 */
import bcrypt from 'bcrypt';
import { connectDatabase, disconnectDatabase } from '../config/db.js';
import { User } from '../models/User.js';
import { env } from '../config/env.js';

async function main() {
  await connectDatabase();
  const email = process.env.SUPER_ADMIN_EMAIL ?? 'superadmin@skillventures.local';
  const password = process.env.SUPER_ADMIN_PASSWORD ?? 'SuperAdminPass123';
  const name = process.env.SUPER_ADMIN_NAME ?? 'Super Admin';

  const existing = await User.findOne({ email });
  if (existing) {
    existing.role = 'super_admin';
    existing.isVerified = true;
    existing.passwordHash = await bcrypt.hash(password, env.BCRYPT_COST);
    await existing.save();
    console.info(`[seed] updated super admin ${email}`);
  } else {
    await User.create({
      role: 'super_admin',
      name,
      email,
      passwordHash: await bcrypt.hash(password, env.BCRYPT_COST),
      authProvider: 'local',
      isVerified: true,
    });
    console.info(`[seed] created super admin ${email}`);
  }

  console.info(`[seed] password: ${password}`);
  await disconnectDatabase();
}

main().catch(async (err) => {
  console.error(err);
  await disconnectDatabase();
  process.exit(1);
});
