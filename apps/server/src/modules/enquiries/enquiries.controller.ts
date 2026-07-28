import type { Request, Response, NextFunction } from 'express';
import type { AuthenticatedRequest } from '../../middleware/auth.js';
import type { EnquiryStatus } from '@skillventures/shared-types';
import * as enquiriesService from './enquiries.service.js';
import type { CreateEnquiryInput, EnquiryListQuery } from './enquiries.validation.js';

export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const authReq = req as Request & { user?: AuthenticatedRequest['user'] };
    const enquiry = await enquiriesService.createEnquiry(
      authReq.user?.id ?? null,
      req.body as CreateEnquiryInput,
    );
    res.status(201).json({ success: true, data: { enquiry } });
  } catch (error) {
    next(error);
  }
}

export async function listMineStudent(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const authReq = req as AuthenticatedRequest;
    const query = (req as Request & { validatedQuery: EnquiryListQuery }).validatedQuery ?? {};
    const result = await enquiriesService.listStudentEnquiries(authReq.user.id, query);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function listMineInstitution(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const authReq = req as AuthenticatedRequest;
    const query = (req as Request & { validatedQuery: EnquiryListQuery }).validatedQuery ?? {};
    const result = await enquiriesService.listInstitutionEnquiries(authReq.user.id, query);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const authReq = req as AuthenticatedRequest;
    const enquiry = await enquiriesService.updateEnquiryStatus(
      authReq.user.id,
      req.params.id as string,
      (req.body as { status: EnquiryStatus }).status,
    );
    res.status(200).json({ success: true, data: { enquiry } });
  } catch (error) {
    next(error);
  }
}
