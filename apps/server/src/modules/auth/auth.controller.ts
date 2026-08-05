import type { Request, Response, NextFunction } from 'express';
import * as authService from './auth.service.js';
import { REFRESH_COOKIE_NAME, refreshCookieOptions } from './token.service.js';
import type {
  LoginInput,
  RegisterInstitutionInput,
  RegisterStudentInput,
} from './auth.validation.js';
import type { AuthenticatedRequest } from '../../middleware/auth.js';

function setRefreshCookie(res: Response, refreshToken: string): void {
  res.cookie(REFRESH_COOKIE_NAME, refreshToken, refreshCookieOptions());
}

function clearRefreshCookie(res: Response): void {
  res.clearCookie(REFRESH_COOKIE_NAME, {
    ...refreshCookieOptions(),
    maxAge: 0,
  });
}

function authResponse(
  res: Response,
  status: number,
  payload: {
    user: unknown;
    accessToken: string;
    expiresIn: number;
    refreshToken: string;
  },
): void {
  setRefreshCookie(res, payload.refreshToken);
  res.status(status).json({
    success: true,
    data: {
      user: payload.user,
      accessToken: payload.accessToken,
      expiresIn: payload.expiresIn,
    },
  });
}

export async function registerStudent(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await authService.registerStudent(req.body as RegisterStudentInput);
    authResponse(res, 201, result);
  } catch (error) {
    next(error);
  }
}

export async function registerInstitution(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await authService.registerInstitution(req.body as RegisterInstitutionInput);
    authResponse(res, 201, result);
  } catch (error) {
    next(error);
  }
}

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await authService.login(req.body as LoginInput);
    authResponse(res, 200, result);
  } catch (error) {
    next(error);
  }
}

export async function refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const raw = req.cookies?.[REFRESH_COOKIE_NAME] as string | undefined;
    const result = await authService.refresh(raw);
    authResponse(res, 200, result);
  } catch (error) {
    clearRefreshCookie(res);
    next(error);
  }
}

export async function logout(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const raw = req.cookies?.[REFRESH_COOKIE_NAME] as string | undefined;
    await authService.logout(raw);
    clearRefreshCookie(res);
    res.status(200).json({ success: true, data: { loggedOut: true } });
  } catch (error) {
    next(error);
  }
}

export async function googleAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { idToken } = req.body as { idToken: string };
    const result = await authService.googleAuth(idToken);
    authResponse(res, 200, result);
  } catch (error) {
    next(error);
  }
}

export async function me(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const authReq = req as AuthenticatedRequest;
    const user = await authService.getProfile(authReq.user.id);
    res.status(200).json({
      success: true,
      data: { user },
    });
  } catch (error) {
    next(error);
  }
}

export async function publicProfile(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const user = await authService.getPublicProfile(String(req.params.id));
    res.status(200).json({
      success: true,
      data: { user },
    });
  } catch (error) {
    next(error);
  }
}

export async function updateMe(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const authReq = req as AuthenticatedRequest;
    const user = await authService.updateProfile(authReq.user.id, req.body);
    res.status(200).json({
      success: true,
      data: { user },
    });
  } catch (error) {
    next(error);
  }
}
