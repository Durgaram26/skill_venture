import type { Request, Response, NextFunction } from 'express';
import type { AuthenticatedRequest } from '../../middleware/auth.js';
import { invalidateListingCaches } from '../../middleware/cache.js';
import * as listingsService from './listings.service.js';
import type {
  CreateListingInput,
  ListingListQuery,
  UpdateListingInput,
} from './listings.validation.js';

export async function createMine(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const authReq = req as AuthenticatedRequest;
    const listing = await listingsService.createListing(
      authReq.user.id,
      req.body as CreateListingInput,
    );
    await invalidateListingCaches();
    res.status(201).json({ success: true, data: { listing } });
  } catch (error) {
    next(error);
  }
}

export async function updateMine(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const authReq = req as AuthenticatedRequest;
    const listing = await listingsService.updateListing(
      authReq.user.id,
      req.params.id as string,
      req.body as UpdateListingInput,
    );
    await invalidateListingCaches();
    res.status(200).json({ success: true, data: { listing } });
  } catch (error) {
    next(error);
  }
}

export async function deleteMine(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const authReq = req as AuthenticatedRequest;
    const result = await listingsService.deleteListing(authReq.user.id, req.params.id as string);
    await invalidateListingCaches();
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function listMine(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const authReq = req as AuthenticatedRequest;
    const query = (req as Request & { validatedQuery: ListingListQuery }).validatedQuery ?? {};
    const result = await listingsService.listMyListings(authReq.user.id, query);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function getMine(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const authReq = req as AuthenticatedRequest;
    const listing = await listingsService.getMyListing(authReq.user.id, req.params.id as string);
    res.status(200).json({ success: true, data: { listing } });
  } catch (error) {
    next(error);
  }
}

export async function listPublic(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const query = (req as Request & { validatedQuery: ListingListQuery }).validatedQuery ?? {};
    const result = await listingsService.listPublicListings(query);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function suggest(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const query = (
      req as Request & { validatedQuery: { q: string; limit?: number } }
    ).validatedQuery;
    const result = await listingsService.searchSuggest(query.q, query.limit ?? 4);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function search(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const query = (
      req as Request & { validatedQuery: { q: string; page?: number; limit?: number } }
    ).validatedQuery;
    const result = await listingsService.searchListings(query.q, query.page, query.limit);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function getBySlug(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await listingsService.getListingBySlug(req.params.slug as string);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function getInstitution(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const institution = await listingsService.getInstitutionPublic(req.params.id as string);
    res.status(200).json({ success: true, data: { institution } });
  } catch (error) {
    next(error);
  }
}

export async function listInstitutionListings(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const query = (req as Request & { validatedQuery: ListingListQuery }).validatedQuery ?? {};
    const result = await listingsService.listInstitutionPublicListings(
      req.params.id as string,
      query,
    );
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function compare(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const query = (req as Request & { validatedQuery: { ids: string } }).validatedQuery;
    const ids = query.ids
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean);
    const result = await listingsService.compareListings(ids);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}
