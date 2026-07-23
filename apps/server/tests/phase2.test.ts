import { describe, it, expect, beforeAll } from '@jest/globals';
import request from 'supertest';
import bcrypt from 'bcrypt';
import './setup.js';
import { app, clearDatabase } from './setup.js';
import { User } from '../src/models/User.js';
import { env } from '../src/config/env.js';
import { signTestWebhook } from '../src/modules/payments/razorpay.js';

function auth(token: string) {
  return { Authorization: `Bearer ${token}` };
}

describe('Phase 2 — Reviews, payments, featured, analytics', () => {
  let institutionToken: string;
  let studentToken: string;
  let adminToken: string;
  let listingId: string;
  let listingSlug: string;

  beforeAll(async () => {
    await clearDatabase();

    const inst = await request(app)
      .post('/api/v1/auth/register/institution')
      .send({
        name: 'Billing Org',
        email: 'phase2-org@example.com',
        phone: '9876543211',
        password: 'SecurePass1',
        institutionName: 'Phase2 Institute',
        institutionType: 'edtech',
        city: 'Mumbai',
        state: 'MH',
      });
    institutionToken = inst.body.data.accessToken;

    const student = await request(app)
      .post('/api/v1/auth/register/student')
      .send({
        name: 'Reviewer',
        email: 'phase2-student@example.com',
        phone: '9876543210',
        password: 'SecurePass1',
      });
    studentToken = student.body.data.accessToken;

    await User.create({
      role: 'admin',
      name: 'Admin',
      email: 'phase2-admin@skillventures.local',
      passwordHash: await bcrypt.hash('AdminPass123', env.BCRYPT_COST),
      authProvider: 'local',
      isVerified: true,
    });
    const adminLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'phase2-admin@skillventures.local', password: 'AdminPass123' });
    adminToken = adminLogin.body.data.accessToken;

    const listing = await request(app)
      .post('/api/v1/institutions/me/listings')
      .set(auth(institutionToken))
      .send({
        type: 'course',
        title: 'Data Science Professional',
        description:
          'Learn data science with Python, SQL, and real industry projects from scratch to hire.',
        category: 'Data Science',
        fee: { amount: 45000, currency: 'INR', isFree: false },
        duration: { value: 6, unit: 'months' },
        mode: 'online',
        submitForReview: true,
      });
    listingId = listing.body.data.listing.id;
    listingSlug = listing.body.data.listing.slug;

    await request(app)
      .patch(`/api/v1/admin/listings/${listingId}/moderate`)
      .set(auth(adminToken))
      .send({ status: 'published' });
  });

  it('blocks reviews without converted enquiry', async () => {
    const res = await request(app)
      .post('/api/v1/reviews')
      .set(auth(studentToken))
      .send({
        listingId,
        rating: 5,
        comment: 'Great course overall with strong mentors and projects.',
      });
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('NOT_VERIFIED_APPLICANT');
  });

  it('allows verified review after conversion and institution reply', async () => {
    const enquiry = await request(app)
      .post('/api/v1/enquiries')
      .set(auth(studentToken))
      .send({
        listingId,
        message: 'Interested in the data science program starting next month please.',
      });
    const enquiryId = enquiry.body.data.enquiry.id as string;

    await request(app)
      .patch(`/api/v1/institutions/me/enquiries/${enquiryId}`)
      .set(auth(institutionToken))
      .send({ status: 'converted' });

    const review = await request(app)
      .post('/api/v1/reviews')
      .set(auth(studentToken))
      .send({
        listingId,
        rating: 5,
        comment: 'Excellent mentors and career support throughout the cohort.',
      });
    expect(review.status).toBe(201);
    expect(review.body.data.review.isVerifiedApplicant).toBe(true);
    const reviewId = review.body.data.review.id as string;

    const list = await request(app).get(`/api/v1/listings/${listingId}/reviews`);
    expect(list.status).toBe(200);
    expect(list.body.data.items.length).toBe(1);

    const reply = await request(app)
      .post(`/api/v1/reviews/${reviewId}/reply`)
      .set(auth(institutionToken))
      .send({ text: 'Thank you for learning with us!' });
    expect(reply.status).toBe(200);
    expect(reply.body.data.review.institutionReply.text).toMatch(/Thank you/);
  });

  it('creates subscription order and fulfills via signed webhook', async () => {
    const order = await request(app)
      .post('/api/v1/subscriptions/create-order')
      .set(auth(institutionToken))
      .send({ type: 'subscription', plan: 'standard' });
    expect(order.status).toBe(201);
    expect(order.body.data.orderId).toMatch(/^order_test_/);
    expect(order.body.data.mock).toBe(true);

    const body = {
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: 'pay_test_sub_1',
            order_id: order.body.data.orderId,
            status: 'captured',
          },
        },
      },
    };
    const raw = JSON.stringify(body);
    const signature = signTestWebhook(raw);

    const bad = await request(app)
      .post('/api/v1/subscriptions/webhook')
      .set('Content-Type', 'application/json')
      .set('x-razorpay-signature', 'bad-signature')
      .send(body);
    expect(bad.status).toBe(400);

    const ok = await request(app)
      .post('/api/v1/subscriptions/webhook')
      .set('Content-Type', 'application/json')
      .set('x-razorpay-signature', signature)
      .send(body);
    expect(ok.status).toBe(200);

    const sub = await request(app)
      .get('/api/v1/institutions/me/subscription')
      .set(auth(institutionToken));
    expect(sub.status).toBe(200);
    expect(sub.body.data.plan).toBe('standard');
  });

  it('features a listing via mock confirm and returns analytics', async () => {
    const order = await request(app)
      .post('/api/v1/subscriptions/create-order')
      .set(auth(institutionToken))
      .send({ type: 'featured', listingId, days: 7 });
    expect(order.status).toBe(201);

    const confirm = await request(app)
      .post('/api/v1/subscriptions/confirm-mock')
      .set(auth(institutionToken))
      .send({ orderId: order.body.data.orderId });
    expect(confirm.status).toBe(200);

    const detail = await request(app).get(`/api/v1/listings/${listingSlug}`);
    expect(detail.body.data.listing.isFeatured).toBe(true);

    const analytics = await request(app)
      .get('/api/v1/institutions/me/analytics')
      .set(auth(institutionToken));
    expect(analytics.status).toBe(200);
    expect(analytics.body.data.summary.listings).toBeGreaterThanOrEqual(1);
    expect(analytics.body.data.summary.conversionRate).toBeGreaterThanOrEqual(0);
  });
});
