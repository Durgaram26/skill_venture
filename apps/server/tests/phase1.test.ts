import { describe, it, expect, beforeAll } from '@jest/globals';
import request from 'supertest';
import bcrypt from 'bcrypt';
import './setup.js';
import { app, clearDatabase } from './setup.js';
import { User } from '../src/models/User.js';
import { env } from '../src/config/env.js';

const institutionPayload = {
  name: 'Priya Organizer',
  email: 'listings-org@institute.edu',
  phone: '9876543211',
  password: 'SecurePass1',
  institutionName: 'SkillForge Academy',
  institutionType: 'bootcamp-provider' as const,
  city: 'Bengaluru',
  state: 'Karnataka',
};

const studentPayload = {
  name: 'Ada Student',
  email: 'listings-student@example.com',
  phone: '9876543210',
  password: 'SecurePass1',
  city: 'Chennai',
};

const listingBody = {
  type: 'course',
  title: 'Full Stack Web Development',
  description:
    'A comprehensive course covering React, Node.js, MongoDB and deployment practices for beginners.',
  category: 'Web Development',
  fee: { amount: 24999, currency: 'INR', isFree: false },
  duration: { value: 16, unit: 'weeks' },
  mode: 'hybrid',
  location: { city: 'Bengaluru', state: 'Karnataka' },
  placementSupport: true,
  certificateProvided: true,
  submitForReview: true,
};

function authHeader(token: string) {
  return { Authorization: `Bearer ${token}` };
}

describe('Phase 1 — Listings, Enquiries, Admin', () => {
  let institutionToken: string;
  let studentToken: string;
  let adminToken: string;
  let listingId: string;
  let listingSlug: string;

  beforeAll(async () => {
    await clearDatabase();

    const inst = await request(app)
      .post('/api/v1/auth/register/institution')
      .send(institutionPayload);
    institutionToken = inst.body.data.accessToken;

    const student = await request(app).post('/api/v1/auth/register/student').send(studentPayload);
    studentToken = student.body.data.accessToken;

    const passwordHash = await bcrypt.hash('AdminPass123', env.BCRYPT_COST);
    await User.create({
      role: 'admin',
      name: 'Admin',
      email: 'admin-phase1@skillventures.local',
      passwordHash,
      authProvider: 'local',
      isVerified: true,
    });
    const adminLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin-phase1@skillventures.local', password: 'AdminPass123' });
    adminToken = adminLogin.body.data.accessToken;
  });

  it('institution creates listing pending review', async () => {
    const res = await request(app)
      .post('/api/v1/institutions/me/listings')
      .set(authHeader(institutionToken))
      .send(listingBody);

    expect(res.status).toBe(201);
    expect(res.body.data.listing.status).toBe('pending_review');
    listingId = res.body.data.listing.id;
    listingSlug = res.body.data.listing.slug;
  });

  it('public list hides unpublished listings', async () => {
    const res = await request(app).get('/api/v1/listings');
    expect(res.status).toBe(200);
    expect(res.body.data.items.every((i: { status: string }) => i.status === 'published')).toBe(
      true,
    );
    expect(res.body.data.items.find((i: { id: string }) => i.id === listingId)).toBeUndefined();
  });

  it('admin publishes listing and verifies institution', async () => {
    const pending = await request(app)
      .get('/api/v1/admin/listings?status=pending_review')
      .set(authHeader(adminToken));
    expect(pending.status).toBe(200);
    expect(pending.body.data.items.length).toBeGreaterThan(0);

    const moderate = await request(app)
      .patch(`/api/v1/admin/listings/${listingId}/moderate`)
      .set(authHeader(adminToken))
      .send({ status: 'published' });
    expect(moderate.status).toBe(200);
    expect(moderate.body.data.listing.status).toBe('published');

    const institutions = await request(app)
      .get('/api/v1/admin/institutions?status=pending')
      .set(authHeader(adminToken));
    expect(institutions.status).toBe(200);
    const instId = institutions.body.data.items[0]?.id as string;
    expect(instId).toBeTruthy();

    const verify = await request(app)
      .patch(`/api/v1/admin/institutions/${instId}/verify`)
      .set(authHeader(adminToken))
      .send({ verificationStatus: 'verified' });
    expect(verify.status).toBe(200);
    expect(verify.body.data.institution.verificationStatus).toBe('verified');
  });

  it('public can fetch listing by slug and search', async () => {
    const detail = await request(app).get(`/api/v1/listings/${listingSlug}`);
    expect(detail.status).toBe(200);
    expect(detail.body.data.listing.title).toMatch(/Full Stack/);

    const search = await request(app).get('/api/v1/listings/search?q=Full%20Stack');
    expect(search.status).toBe(200);
    expect(search.body.data.items.length).toBeGreaterThan(0);
  });

  it('student creates enquiry; institution updates status', async () => {
    const create = await request(app).post('/api/v1/enquiries').set(authHeader(studentToken)).send({
      listingId,
      message: 'I am interested in joining the next cohort. Please share start dates.',
    });
    expect(create.status).toBe(201);
    const enquiryId = create.body.data.enquiry.id as string;

    const studentList = await request(app)
      .get('/api/v1/students/me/enquiries')
      .set(authHeader(studentToken));
    expect(studentList.status).toBe(200);
    expect(studentList.body.data.items.length).toBe(1);

    const instList = await request(app)
      .get('/api/v1/institutions/me/enquiries')
      .set(authHeader(institutionToken));
    expect(instList.status).toBe(200);
    expect(instList.body.data.items.length).toBe(1);

    const patch = await request(app)
      .patch(`/api/v1/institutions/me/enquiries/${enquiryId}`)
      .set(authHeader(institutionToken))
      .send({ status: 'contacted' });
    expect(patch.status).toBe(200);
    expect(patch.body.data.enquiry.status).toBe('contacted');
  });

  it('rejects student creating listing and guest enquiry', async () => {
    const forbidden = await request(app)
      .post('/api/v1/institutions/me/listings')
      .set(authHeader(studentToken))
      .send(listingBody);
    expect(forbidden.status).toBe(403);

    const guest = await request(app).post('/api/v1/enquiries').send({
      listingId,
      message: 'Guest enquiry should fail without auth token present here.',
    });
    expect(guest.status).toBe(401);
  });

  it('admin analytics returns counts', async () => {
    const res = await request(app).get('/api/v1/admin/analytics').set(authHeader(adminToken));
    expect(res.status).toBe(200);
    expect(res.body.data.publishedListings).toBeGreaterThanOrEqual(1);
    expect(res.body.data.enquiries).toBeGreaterThanOrEqual(1);
  });
});
