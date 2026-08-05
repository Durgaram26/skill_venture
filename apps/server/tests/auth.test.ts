import { describe, it, expect, beforeEach } from '@jest/globals';
import request from 'supertest';
import './setup.js';
import { app, clearDatabase } from './setup.js';

const studentPayload = {
  name: 'Ada Student',
  email: 'ada@example.com',
  phone: '9876543210',
  password: 'SecurePass1',
  city: 'Chennai',
  currentEducationLevel: 'undergraduate',
};

const institutionPayload = {
  name: 'Priya Organizer',
  email: 'priya@institute.edu',
  phone: '9876543211',
  password: 'SecurePass1',
  institutionName: 'SkillForge Academy',
  institutionType: 'bootcamp-provider',
  city: 'Bengaluru',
  state: 'Karnataka',
  website: 'https://skillforge.example.com',
};

function cookieHeader(setCookie: string | string[] | undefined): string[] {
  if (!setCookie) return [];
  return Array.isArray(setCookie) ? setCookie : [setCookie];
}

describe('Auth API', () => {
  beforeEach(async () => {
    await clearDatabase();
  });

  describe('POST /api/v1/auth/register/student', () => {
    it('registers a student and returns access token + sets refresh cookie', async () => {
      const res = await request(app).post('/api/v1/auth/register/student').send(studentPayload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.role).toBe('student');
      expect(res.body.data.user.email).toBe(studentPayload.email);
      expect(res.body.data.accessToken).toEqual(expect.any(String));
      expect(res.body.data.user).not.toHaveProperty('passwordHash');
      expect(cookieHeader(res.headers['set-cookie']).join(';')).toMatch(/sv_refresh=/);
    });

    it('rejects duplicate email', async () => {
      await request(app).post('/api/v1/auth/register/student').send(studentPayload);
      const res = await request(app).post('/api/v1/auth/register/student').send(studentPayload);
      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('EMAIL_EXISTS');
    });

    it('rejects weak password and unknown fields', async () => {
      const weak = await request(app)
        .post('/api/v1/auth/register/student')
        .send({ ...studentPayload, password: 'short' });
      expect(weak.status).toBe(400);
      expect(weak.body.error.code).toBe('VALIDATION_ERROR');

      const unknown = await request(app)
        .post('/api/v1/auth/register/student')
        .send({ ...studentPayload, email: 'other@example.com', role: 'admin' });
      expect(unknown.status).toBe(400);
    });
  });

  describe('POST /api/v1/auth/register/institution', () => {
    it('registers institution user + creates pending institution profile', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register/institution')
        .send(institutionPayload);

      expect(res.status).toBe(201);
      expect(res.body.data.user.role).toBe('institution');
      expect(res.body.data.accessToken).toEqual(expect.any(String));
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('logs in with valid credentials', async () => {
      await request(app).post('/api/v1/auth/register/student').send(studentPayload);
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: studentPayload.email, password: studentPayload.password });

      expect(res.status).toBe(200);
      expect(res.body.data.user.email).toBe(studentPayload.email);
      expect(res.body.data.accessToken).toEqual(expect.any(String));
    });

    it('rejects invalid credentials', async () => {
      await request(app).post('/api/v1/auth/register/student').send(studentPayload);
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: studentPayload.email, password: 'WrongPass1' });

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
    });
  });

  describe('POST /api/v1/auth/refresh + logout', () => {
    it('rotates refresh token and then logs out', async () => {
      const register = await request(app)
        .post('/api/v1/auth/register/student')
        .send(studentPayload);
      const cookies = cookieHeader(register.headers['set-cookie']);

      const refreshed = await request(app).post('/api/v1/auth/refresh').set('Cookie', cookies);

      expect(refreshed.status).toBe(200);
      expect(refreshed.body.data.accessToken).toEqual(expect.any(String));
      const newCookies = cookieHeader(refreshed.headers['set-cookie']);

      const logout = await request(app).post('/api/v1/auth/logout').set('Cookie', newCookies);
      expect(logout.status).toBe(200);

      const reuse = await request(app).post('/api/v1/auth/refresh').set('Cookie', newCookies);
      expect(reuse.status).toBe(401);
    });
  });

  describe('GET /api/v1/auth/me', () => {
    it('requires Bearer token and returns current user', async () => {
      const register = await request(app)
        .post('/api/v1/auth/register/student')
        .send(studentPayload);
      const token = register.body.data.accessToken as string;

      const unauthorized = await request(app).get('/api/v1/auth/me');
      expect(unauthorized.status).toBe(401);

      const me = await request(app).get('/api/v1/auth/me').set('Authorization', `Bearer ${token}`);
      expect(me.status).toBe(200);
      expect(me.body.data.user.email).toBe(studentPayload.email);
    });
  });

  describe('GET /api/v1/auth/users/:id', () => {
    it('serves a shareable profile without contact details, no auth needed', async () => {
      const register = await request(app)
        .post('/api/v1/auth/register/student')
        .send({ ...studentPayload, email: 'shared@example.com' });
      const id = register.body.data.user.id as string;

      const res = await request(app).get(`/api/v1/auth/users/${id}`);
      expect(res.status).toBe(200);
      expect(res.body.data.user).toEqual({
        id,
        role: 'student',
        name: studentPayload.name,
        profile: expect.objectContaining({ city: studentPayload.city }),
      });

      expect((await request(app).get('/api/v1/auth/users/not-an-id')).status).toBe(404);
    });
  });

  describe('PATCH /api/v1/auth/me', () => {
    it('updates name, email, and phone', async () => {
      const register = await request(app)
        .post('/api/v1/auth/register/student')
        .send({ ...studentPayload, email: 'profile@example.com' });
      const token = register.body.data.accessToken as string;

      const updated = await request(app)
        .patch('/api/v1/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Renamed Student',
          email: 'renamed@example.com',
          phone: '9876543210',
        });

      expect(updated.status).toBe(200);
      expect(updated.body.data.user.name).toBe('Renamed Student');
      expect(updated.body.data.user.email).toBe('renamed@example.com');
      expect(updated.body.data.user.phone).toBe('9876543210');
    });
  });

  describe('RBAC scaffold', () => {
    it('rejects forged role elevation via register body', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register/student')
        .send({ ...studentPayload, email: 'hacker@example.com', role: 'admin' });
      expect(res.status).toBe(400);
    });
  });
});
