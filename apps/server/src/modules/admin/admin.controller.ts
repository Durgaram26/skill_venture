import type { Request, Response, NextFunction } from 'express';
import type { AuthenticatedRequest } from '../../middleware/auth.js';
import { invalidateListingCaches } from '../../middleware/cache.js';
import * as adminService from './admin.service.js';

export async function listInstitutions(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const query = (
      req as Request & { validatedQuery: { status?: string; page?: number; limit?: number } }
    ).validatedQuery;
    const result = await adminService.listInstitutionsForAdmin(query ?? {});
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function verifyInstitution(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const authReq = req as AuthenticatedRequest;
    const body = req.body as {
      verificationStatus: 'verified' | 'rejected';
      reason?: string;
    };
    const institution = await adminService.verifyInstitution(
      authReq.user.id,
      req.params.id as string,
      body.verificationStatus,
      body.reason,
    );
    res.status(200).json({ success: true, data: { institution } });
  } catch (error) {
    next(error);
  }
}

export async function listListings(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const query = (
      req as Request & { validatedQuery: { status?: string; page?: number; limit?: number } }
    ).validatedQuery;
    const result = await adminService.listListingsForAdmin(query ?? {});
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function moderateListing(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const authReq = req as AuthenticatedRequest;
    const body = req.body as {
      status: 'published' | 'rejected' | 'paused';
      reason?: string;
    };
    const listing = await adminService.moderateListing(
      authReq.user.id,
      req.params.id as string,
      body.status,
      body.reason,
    );
    await invalidateListingCaches();
    res.status(200).json({ success: true, data: { listing } });
  } catch (error) {
    next(error);
  }
}

export async function listReviews(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const query = (
      req as Request & { validatedQuery: { status?: string; page?: number; limit?: number } }
    ).validatedQuery;
    const result = await adminService.listReviewsForAdmin(query ?? {});
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function moderateReview(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const authReq = req as AuthenticatedRequest;
    const body = req.body as {
      moderationStatus: 'visible' | 'removed';
      reason?: string;
    };
    const review = await adminService.moderateReview(
      authReq.user.id,
      req.params.id as string,
      body.moderationStatus,
      body.reason,
    );
    res.status(200).json({ success: true, data: { review } });
  } catch (error) {
    next(error);
  }
}

export async function listUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const query = (
      req as Request & {
        validatedQuery: { role?: string; banned?: string; page?: number; limit?: number };
      }
    ).validatedQuery;
    const result = await adminService.listUsersForAdmin(query ?? {});
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function banUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const authReq = req as AuthenticatedRequest;
    const body = req.body as { isBanned: boolean };
    const user = await adminService.setUserBanned(
      authReq.user.id,
      req.params.id as string,
      body.isBanned,
    );
    res.status(200).json({ success: true, data: { user } });
  } catch (error) {
    next(error);
  }
}

export async function analytics(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await adminService.getAnalytics();
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function getSettings(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const settings = await adminService.getPlatformSettings();
    res.status(200).json({ success: true, data: { settings } });
  } catch (error) {
    next(error);
  }
}

export async function updateSettings(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const authReq = req as AuthenticatedRequest;
    const settings = await adminService.updatePlatformSettings(authReq.user.id, req.body);
    res.status(200).json({ success: true, data: { settings } });
  } catch (error) {
    next(error);
  }
}

export async function listAuditLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const query = (
      req as Request & { validatedQuery: { page?: number; limit?: number } }
    ).validatedQuery;
    const result = await adminService.listAuditLogs(query ?? {});
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function listAdmins(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const items = await adminService.listAdminUsers();
    res.status(200).json({ success: true, data: { items } });
  } catch (error) {
    next(error);
  }
}

export async function setUserRole(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const authReq = req as AuthenticatedRequest;
    const body = req.body as { role: 'student' | 'admin' | 'super_admin' };
    const user = await adminService.setUserRole(
      authReq.user.id,
      req.params.id as string,
      body.role,
    );
    res.status(200).json({ success: true, data: { user } });
  } catch (error) {
    next(error);
  }
}

export async function financialReport(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const data = await adminService.getFinancialReport();
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function listSupportTickets(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const query = (
      req as Request & { validatedQuery: { status?: string; page?: number; limit?: number } }
    ).validatedQuery;
    const result = await adminService.listSupportTickets(query ?? {});
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function updateSupportTicket(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const authReq = req as AuthenticatedRequest;
    const body = req.body as { status?: string; adminNotes?: string };
    const ticket = await adminService.updateSupportTicket(
      authReq.user.id,
      req.params.id as string,
      body,
    );
    res.status(200).json({ success: true, data: { ticket } });
  } catch (error) {
    next(error);
  }
}
