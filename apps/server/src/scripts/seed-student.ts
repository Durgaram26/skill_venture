/**
 * Seed a demo student for local testing (enquire, pay, bookmarks).
 * Usage: npm run seed:student -w @skillventures/server
 */
import bcrypt from 'bcrypt';
import { connectDatabase, disconnectDatabase } from '../config/db.js';
import { User } from '../models/User.js';
import { env } from '../config/env.js';

async function main() {
  await connectDatabase();
  const email = process.env.STUDENT_EMAIL ?? 'demo.student@skillventures.local';
  const password = process.env.STUDENT_PASSWORD ?? 'DemoPass123';
  const name = process.env.STUDENT_NAME ?? 'Priya Sharma';
  const phone = process.env.STUDENT_PHONE ?? '9876543210';

  const existing = await User.findOne({ email });
  if (existing) {
    existing.role = 'student';
    existing.name = name;
    existing.phone = phone;
    existing.isVerified = true;
    existing.isBanned = false;
    existing.passwordHash = await bcrypt.hash(password, env.BCRYPT_COST);
    existing.profile = {
      ...(existing.profile ?? {}),
      city: existing.profile?.city || 'Bengaluru',
      currentEducationLevel: existing.profile?.currentEducationLevel || 'Graduate',
    };
    await existing.save();
    console.info(`[seed] updated student ${email}`);
  } else {
    await User.create({
      role: 'student',
      name,
      email,
      phone,
      passwordHash: await bcrypt.hash(password, env.BCRYPT_COST),
      authProvider: 'local',
      isVerified: true,
      profile: {
        city: 'Bengaluru',
        currentEducationLevel: 'Graduate',
      },
    });
    console.info(`[seed] created student ${email}`);
  }

  console.info(`[seed] password: ${password}`);
  await disconnectDatabase();
}

main().catch(async (err) => {
  console.error(err);
  await disconnectDatabase();
  process.exit(1);
});
