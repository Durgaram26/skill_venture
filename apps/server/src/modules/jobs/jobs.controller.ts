import type { Request, RequestHandler } from 'express';
import type { AuthenticatedRequest } from '../../middleware/auth.js';
import * as service from './jobs.service.js';

type AuthRequest = Request & Pick<AuthenticatedRequest, 'user'>;
type IdRequest = AuthRequest & { params: { id: string } };

export const createJob: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthRequest;
    const job = await service.createJob(authReq.user.id, req.body as service.CreateJobInput);
    res.status(201).json({ success: true, data: { job } });
  } catch (err) { next(err); }
};

export const listMyJobs: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthRequest;
    const result = await service.listMyJobs(authReq.user.id, req.query as { page?: number; limit?: number; status?: string });
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
};

export const updateJob: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as IdRequest;
    const job = await service.updateJob(authReq.user.id, authReq.params.id, req.body as service.UpdateJobInput);
    res.json({ success: true, data: { job } });
  } catch (err) { next(err); }
};

export const deleteJob: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as IdRequest;
    const result = await service.deleteJob(authReq.user.id, authReq.params.id);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
};

export const studentFeed: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthRequest;
    const result = await service.getStudentJobFeed(authReq.user.id, req.query as { page?: number; limit?: number });
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
};

export const institutionPublicJobs: RequestHandler = async (req, res, next) => {
  try {
    const result = await service.getInstitutionPublicJobs(String(req.params.id), req.query as { page?: number; limit?: number });
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
};
