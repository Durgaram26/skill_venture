import type { RequestHandler } from 'express';
import * as service from './jobs.service.js';

export const createJob: RequestHandler = async (req, res, next) => {
  try {
    const job = await service.createJob(req.user!.id, req.body as service.CreateJobInput);
    res.status(201).json({ success: true, data: { job } });
  } catch (err) { next(err); }
};

export const listMyJobs: RequestHandler = async (req, res, next) => {
  try {
    const result = await service.listMyJobs(req.user!.id, req.query as { page?: number; limit?: number; status?: string });
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
};

export const updateJob: RequestHandler = async (req, res, next) => {
  try {
    const job = await service.updateJob(req.user!.id, req.params.id, req.body as service.UpdateJobInput);
    res.json({ success: true, data: { job } });
  } catch (err) { next(err); }
};

export const deleteJob: RequestHandler = async (req, res, next) => {
  try {
    const result = await service.deleteJob(req.user!.id, req.params.id);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
};

export const studentFeed: RequestHandler = async (req, res, next) => {
  try {
    const result = await service.getStudentJobFeed(req.user!.id, req.query as { page?: number; limit?: number });
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
};

export const institutionPublicJobs: RequestHandler = async (req, res, next) => {
  try {
    const result = await service.getInstitutionPublicJobs(req.params.id, req.query as { page?: number; limit?: number });
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
};
