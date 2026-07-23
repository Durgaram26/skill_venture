/**
 * Seed demo institutions + published listings with cover images.
 * Run after: npm run fetch:mock-images -w @skillventures/server
 *
 * Usage: npm run seed:mock -w @skillventures/server
 */
import bcrypt from 'bcrypt';
import { connectDatabase, disconnectDatabase } from '../config/db.js';
import { User } from '../models/User.js';
import { Institution } from '../models/Institution.js';
import { Listing } from '../models/Listing.js';
import { SupportTicket } from '../models/SupportTicket.js';
import { env } from '../config/env.js';
import { MOCK_IMAGES } from './fetch-mock-images.js';

const PASSWORD = 'DemoPass123';

const PROGRAMS: {
  title: string;
  type: 'course' | 'bootcamp' | 'hackathon';
  category: string;
  description: string;
  fee: number;
  isFree?: boolean;
  mode: 'online' | 'offline' | 'hybrid';
  city: string;
  featured?: boolean;
  imageIndex: number;
  duration: { value: number; unit: 'weeks' | 'months' | 'days' | 'hours' };
}[] = [
  {
    title: 'Full-Stack Web Development with React',
    type: 'course',
    category: 'Web Development',
    description:
      'Build production React apps with Node APIs. Includes projects, code reviews, and placement support for career switchers.',
    fee: 24999,
    mode: 'hybrid',
    city: 'Bengaluru',
    featured: true,
    imageIndex: 0,
    duration: { value: 16, unit: 'weeks' },
  },
  {
    title: 'Data Science Intensive Bootcamp',
    type: 'bootcamp',
    category: 'Data Science',
    description:
      'Python, SQL, ML pipelines, and portfolio projects. Mentored sprints with hiring-partner interviews at the end.',
    fee: 49999,
    mode: 'online',
    city: 'Hyderabad',
    featured: true,
    imageIndex: 1,
    duration: { value: 12, unit: 'weeks' },
  },
  {
    title: 'AI Engineering Foundations',
    type: 'course',
    category: 'AI',
    description:
      'LLMs, embeddings, RAG, and evaluation. Ship a retrieval chatbot as your capstone.',
    fee: 34999,
    mode: 'online',
    city: 'Pune',
    imageIndex: 2,
    duration: { value: 10, unit: 'weeks' },
  },
  {
    title: 'Mobile App Development with Flutter',
    type: 'course',
    category: 'Mobile',
    description:
      'Cross-platform Flutter from widgets to Play Store publishing. Offline-first patterns included.',
    fee: 19999,
    mode: 'offline',
    city: 'Chennai',
    imageIndex: 3,
    duration: { value: 8, unit: 'weeks' },
  },
  {
    title: 'Product Design Studio',
    type: 'bootcamp',
    category: 'Design',
    description:
      'UX research, Figma systems, and prototype critiques. Build a case study employers can trust.',
    fee: 29999,
    mode: 'hybrid',
    city: 'Mumbai',
    imageIndex: 4,
    duration: { value: 9, unit: 'weeks' },
  },
  {
    title: 'Cloud & DevOps Accelerator',
    type: 'course',
    category: 'Cloud',
    description:
      'AWS fundamentals, containers, CI/CD, and observability. Lab-heavy with real infra budgets.',
    fee: 27999,
    mode: 'online',
    city: 'Bengaluru',
    imageIndex: 5,
    duration: { value: 8, unit: 'weeks' },
  },
  {
    title: 'Weekend Hackathon: Climate Tech',
    type: 'hackathon',
    category: 'AI',
    description:
      '48-hour climate-tech hackathon with mentor pods and a ₹2L prize pool. Open to student teams.',
    fee: 0,
    isFree: true,
    mode: 'offline',
    city: 'Delhi',
    featured: true,
    imageIndex: 8,
    duration: { value: 2, unit: 'days' },
  },
  {
    title: 'Business Analytics for Founders',
    type: 'course',
    category: 'Business',
    description:
      'Metrics that matter, cohort analysis, and dashboard storytelling for early-stage teams.',
    fee: 14999,
    mode: 'online',
    city: 'Remote',
    imageIndex: 9,
    duration: { value: 6, unit: 'weeks' },
  },
  {
    title: 'Java Backend Career Track',
    type: 'bootcamp',
    category: 'Web Development',
    description:
      'Spring Boot, SQL design, system design interviews. Mock interviews every fortnight.',
    fee: 39999,
    mode: 'hybrid',
    city: 'Bengaluru',
    imageIndex: 10,
    duration: { value: 14, unit: 'weeks' },
  },
  {
    title: 'Open Source Sprint Weekend',
    type: 'hackathon',
    category: 'Web Development',
    description:
      'Ship PRs to real OSS repos with maintainer mentors. Certificate + swag for merged PRs.',
    fee: 499,
    mode: 'online',
    city: 'Remote',
    imageIndex: 11,
    duration: { value: 3, unit: 'days' },
  },
];

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

async function upsertInstitution(input: {
  email: string;
  name: string;
  institutionName: string;
  city: string;
  state: string;
  type: string;
}) {
  const passwordHash = await bcrypt.hash(PASSWORD, env.BCRYPT_COST);
  let user = await User.findOne({ email: input.email });
  if (!user) {
    user = await User.create({
      role: 'institution',
      name: input.name,
      email: input.email,
      passwordHash,
      authProvider: 'local',
      isVerified: true,
    });
  } else {
    user.passwordHash = passwordHash;
    user.isVerified = true;
    user.role = 'institution';
    await user.save();
  }

  let institution = await Institution.findOne({ userId: user._id });
  if (!institution) {
    institution = await Institution.create({
      userId: user._id,
      name: input.institutionName,
      type: input.type,
      verificationStatus: 'verified',
      location: { city: input.city, state: input.state },
      subscriptionPlan: 'standard',
    });
  } else {
    institution.verificationStatus = 'verified';
    institution.subscriptionPlan = 'standard';
    await institution.save();
  }

  return institution;
}

async function main() {
  await connectDatabase();

  const instA = await upsertInstitution({
    email: 'demo.institute@skillventures.local',
    name: 'Priya Sharma',
    institutionName: 'Nimbus Skill Labs',
    city: 'Bengaluru',
    state: 'Karnataka',
    type: 'bootcamp-provider',
  });
  const instB = await upsertInstitution({
    email: 'demo.campus@skillventures.local',
    name: 'Arjun Mehta',
    institutionName: 'Horizon Campus Academy',
    city: 'Hyderabad',
    state: 'Telangana',
    type: 'training-institute',
  });

  const institutions = [instA, instB];

  for (let i = 0; i < PROGRAMS.length; i++) {
    const p = PROGRAMS[i]!;
    const institution = institutions[i % institutions.length]!;
    const slug = slugify(p.title);
    const imageFile = MOCK_IMAGES[p.imageIndex % MOCK_IMAGES.length]!.file;
    const imagePath = `/images/listings/${imageFile}`;

    const payload = {
      institutionId: institution._id,
      type: p.type,
      title: p.title,
      slug,
      description: p.description,
      category: p.category,
      fee: {
        amount: p.fee,
        currency: 'INR',
        isFree: Boolean(p.isFree || p.fee === 0),
      },
      duration: p.duration,
      mode: p.mode,
      location: { city: p.city, state: institution.location.state },
      placementSupport: p.type !== 'hackathon',
      certificateProvided: true,
      status: 'published' as const,
      isFeatured: Boolean(p.featured),
      images: [imagePath],
      rating: { avg: 4.2 + (i % 6) * 0.1, count: 8 + i * 3 },
      stats: { views: 120 + i * 40, enquiries: 5 + i },
      ...(p.type === 'bootcamp'
        ? {
            bootcamp: {
              startDate: new Date(Date.now() + 14 * 86400000),
              endDate: new Date(Date.now() + 100 * 86400000),
              sessionMode: 'weekday-evenings',
              seatsAvailable: 28,
            },
          }
        : {}),
      ...(p.type === 'hackathon'
        ? {
            hackathon: {
              startDate: new Date(Date.now() + 21 * 86400000),
              endDate: new Date(Date.now() + 23 * 86400000),
              prizePool: p.title.includes('Climate') ? 200000 : 50000,
              teamSizeMax: 4,
              sponsors: ['SkillVentures', 'Local Tech Hub'],
            },
          }
        : {}),
    };

    await Listing.findOneAndUpdate({ slug }, { $set: payload }, { upsert: true, new: true });
    console.info(`[seed] listing ${slug}`);
  }

  console.info(`[seed] demo institution logins:`);
  console.info(`  demo.institute@skillventures.local / ${PASSWORD}`);
  console.info(`  demo.campus@skillventures.local / ${PASSWORD}`);

  const sampleTickets = [
    {
      reporterEmail: 'student@example.com',
      reporterName: 'Priya Sharma',
      subject: 'Refund request for cancelled bootcamp',
      body: 'I enrolled in the Data Science bootcamp but the batch was cancelled. Please process a refund.',
      category: 'billing' as const,
      status: 'open' as const,
    },
    {
      reporterEmail: 'demo.institute@skillventures.local',
      reporterName: 'Demo Institute',
      subject: 'Listing stuck in pending review',
      body: 'Our new Full-Stack course has been pending for 5 days. Can you expedite verification?',
      category: 'listing' as const,
      status: 'in_progress' as const,
    },
    {
      reporterEmail: 'learner@example.com',
      reporterName: 'Arjun K',
      subject: 'Cannot reset password',
      body: 'Password reset email never arrives. Tried twice with correct email.',
      category: 'account' as const,
      status: 'resolved' as const,
      resolvedAt: new Date(),
    },
  ];

  for (const ticket of sampleTickets) {
    const existing = await SupportTicket.findOne({ subject: ticket.subject });
    if (!existing) {
      await SupportTicket.create(ticket);
      console.info(`[seed] support ticket: ${ticket.subject}`);
    }
  }

  await disconnectDatabase();
}

main().catch(async (err) => {
  console.error(err);
  await disconnectDatabase();
  process.exit(1);
});
