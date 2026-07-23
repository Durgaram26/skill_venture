import type { Request, Response, NextFunction } from 'express';
import type { AuthenticatedRequest } from '../../middleware/auth.js';
import * as bookmarksService from './bookmarks.service.js';

export async function add(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const authReq = req as AuthenticatedRequest;
    const data = await bookmarksService.addBookmark(
      authReq.user.id,
      req.params.listingId as string,
    );
    res.status(201).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const authReq = req as AuthenticatedRequest;
    const data = await bookmarksService.removeBookmark(
      authReq.user.id,
      req.params.listingId as string,
    );
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function listMine(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const authReq = req as AuthenticatedRequest;
    const items = await bookmarksService.listBookmarks(authReq.user.id);
    res.status(200).json({ success: true, data: { items } });
  } catch (error) {
    next(error);
  }
}
