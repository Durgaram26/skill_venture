import { describe, it, expect, beforeAll } from '@jest/globals';
import request from 'supertest';
import bcrypt from 'bcrypt';
import './setup.js';
import { app, clearDatabase } from './setup.js';
import { User } from '../src/models/User.js';
import { env } from '../src/config/env.js';

function authHeader(token: string) {
  return { Authorization: `Bearer ${token}` };
}

describe('Phase 3 — Bookmarks, compare, SEO, push', () => {
  let institutionToken: string;
  let studentToken: string;
  let adminToken: string;
  let listingId: string;
  let listingSlug: string;
  let listingId2: string;

  beforeAll(async () => {
    await clearDatabase();

    const inst = await request(app).post('/api/v1/auth/register/institution').send({
      name: 'Org',
      email: 'phase3-org@example.com',
      phone: '9876543211',
      password: 'SecurePass1',
      institutionName: 'Phase3 Academy',
      institutionType: 'bootcamp-provider',
      city: 'Pune',
      state: 'MH',
    });
    institutionToken = inst.body.data.accessToken;

    const student = await request(app).post('/api/v1/auth/register/student').send({
      name: 'Student',
      email: 'phase3-student@example.com',
      phone: '9876543210',
      password: 'SecurePass1',
    });
    studentToken = student.body.data.accessToken;

    await User.create({
      role: 'admin',
      name: 'Admin',
      email: 'phase3-admin@skillventures.local',
      passwordHash: await bcrypt.hash('AdminPass123', env.BCRYPT_COST),
      authProvider: 'local',
      isVerified: true,
    });
    const adminLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'phase3-admin@skillventures.local', password: 'AdminPass123' });
    adminToken = adminLogin.body.data.accessToken;

    const created = await request(app)
      .post('/api/v1/institutions/me/listings')
      .set(authHeader(institutionToken))
      .send({
        type: 'bootcamp',
        title: 'React Native Bootcamp',
        description:
          'A hands-on bootcamp covering React Native, mobile UX, and shipping to app stores.',
        category: 'Mobile',
        fee: { amount: 39999, currency: 'INR', isFree: false },
        duration: { value: 12, unit: 'weeks' },
        mode: 'online',
        bootcamp: {
          startDate: '2026-09-01',
          endDate: '2026-11-30',
          sessionMode: 'weekday evenings',
          seatsAvailable: 40,
        },
        submitForReview: true,
      });
    listingId = created.body.data.listing.id;
    listingSlug = created.body.data.listing.slug;

    const created2 = await request(app)
      .post('/api/v1/institutions/me/listings')
      .set(authHeader(institutionToken))
      .send({
        type: 'hackathon',
        title: 'AI Builders Hackathon',
        description:
          'A 48-hour hackathon for AI builders with mentorship, prizes, and sponsor challenges.',
        category: 'AI',
        fee: { amount: 0, currency: 'INR', isFree: true },
        duration: { value: 48, unit: 'hours' },
        mode: 'hybrid',
        location: { city: 'Pune', state: 'MH' },
        hackathon: {
          startDate: '2026-10-10',
          endDate: '2026-10-12',
          prizePool: 250000,
          teamSizeMax: 4,
          sponsors: ['CloudCo', 'ChipLabs'],
        },
        submitForReview: true,
      });
    listingId2 = created2.body.data.listing.id;

    await request(app)
      .patch(`/api/v1/admin/listings/${listingId}/moderate`)
      .set(authHeader(adminToken))
      .send({ status: 'published' });
    await request(app)
      .patch(`/api/v1/admin/listings/${listingId2}/moderate`)
      .set(authHeader(adminToken))
      .send({ status: 'published' });
  });

  it('returns bootcamp fields on public detail', async () => {
    const res = await request(app).get(`/api/v1/listings/${listingSlug}`);
    expect(res.status).toBe(200);
    expect(res.body.data.listing.bootcamp.seatsAvailable).toBe(40);
  });

  it('bookmarks and lists saved listings', async () => {
    const add = await request(app)
      .post(`/api/v1/bookmarks/${listingId}`)
      .set(authHeader(studentToken));
    expect(add.status).toBe(201);

    const list = await request(app)
      .get('/api/v1/students/me/bookmarks')
      .set(authHeader(studentToken));
    expect(list.status).toBe(200);
    expect(list.body.data.items).toHaveLength(1);

    const remove = await request(app)
      .delete(`/api/v1/bookmarks/${listingId}`)
      .set(authHeader(studentToken));
    expect(remove.status).toBe(200);
  });

  it('compares 2–3 listings', async () => {
    const res = await request(app).get(`/api/v1/listings/compare?ids=${listingId},${listingId2}`);
    expect(res.status).toBe(200);
    expect(res.body.data.items).toHaveLength(2);

    const tooFew = await request(app).get(`/api/v1/listings/compare?ids=${listingId}`);
    expect(tooFew.status).toBe(400);
  });

  it('serves sitemap and SSR listing HTML with JSON-LD', async () => {
    const sitemap = await request(app).get('/sitemap.xml');
    expect(sitemap.status).toBe(200);
    expect(sitemap.text).toContain(listingSlug);

    const ssr = await request(app).get(`/ssr/listings/${listingSlug}`);
    expect(ssr.status).toBe(200);
    expect(ssr.text).toContain('application/ld+json');
    expect(ssr.text).toContain('React Native Bootcamp');
  });

  it('registers push token and lists notifications after enquiry', async () => {
    const push = await request(app)
      .post('/api/v1/notifications/push/register')
      .set(authHeader(institutionToken))
      .send({ token: 'fake-fcm-token-1234567890', platform: 'web' });
    expect(push.status).toBe(201);

    await request(app).post('/api/v1/enquiries').set(authHeader(studentToken)).send({
      listingId,
      message: 'I want to join the React Native bootcamp starting in September.',
    });

    const notes = await request(app).get('/api/v1/notifications').set(authHeader(institutionToken));
    expect(notes.status).toBe(200);
    expect(notes.body.data.items.length).toBeGreaterThan(0);
  });
});
