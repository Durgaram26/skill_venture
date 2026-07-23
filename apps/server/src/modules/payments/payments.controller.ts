import type { Request, Response, NextFunction } from 'express';
import type { AuthenticatedRequest } from '../../middleware/auth.js';
import * as paymentsService from './payments.service.js';
import { verifyWebhookSignature } from './razorpay.js';
import { AppError } from '../../utils/AppError.js';
import type {
  CreateEnrollmentOrderInput,
  CreateOrderInput,
} from './payments.validation.js';
import { env } from '../../config/env.js';

export async function createOrder(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const authReq = req as AuthenticatedRequest;
    const data = await paymentsService.createOrder(
      authReq.user.id,
      req.body as CreateOrderInput,
    );
    res.status(201).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function createEnrollmentOrder(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const authReq = req as AuthenticatedRequest;
    const data = await paymentsService.createEnrollmentOrder(
      authReq.user.id,
      req.body as CreateEnrollmentOrderInput,
    );
    res.status(201).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function getSubscription(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const authReq = req as AuthenticatedRequest;
    const data = await paymentsService.getMySubscription(authReq.user.id);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function getAnalytics(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const authReq = req as AuthenticatedRequest;
    await paymentsService.expireFeaturedListings();
    const data = await paymentsService.getInstitutionAnalytics(authReq.user.id);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function listStudentPayments(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const authReq = req as AuthenticatedRequest;
    const data = await paymentsService.listStudentPayments(authReq.user.id);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function listInstitutionEarnings(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const authReq = req as AuthenticatedRequest;
    const data = await paymentsService.listInstitutionEarnings(authReq.user.id);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

/**
 * Razorpay webhook — signature verified before any credit (§11).
 * Expects raw body captured on req (see app.ts verify hook).
 */
export async function webhook(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const signature = req.headers['x-razorpay-signature'] as string | undefined;
    const rawBody =
      (req as Request & { rawBody?: Buffer | string }).rawBody?.toString() ??
      JSON.stringify(req.body);

    if (!verifyWebhookSignature(rawBody, signature)) {
      throw new AppError('Invalid webhook signature', 400, 'INVALID_SIGNATURE');
    }

    const payload = typeof req.body === 'object' ? req.body : JSON.parse(rawBody);
    const event = payload as {
      event?: string;
      payload?: {
        payment?: { entity?: { order_id?: string; id?: string; status?: string } };
        order?: { entity?: { id?: string } };
      };
    };

    const paymentEntity = event.payload?.payment?.entity;
    const orderId =
      paymentEntity?.order_id ?? event.payload?.order?.entity?.id ?? undefined;

    if (
      orderId &&
      (event.event === 'payment.captured' ||
        event.event === 'order.paid' ||
        paymentEntity?.status === 'captured')
    ) {
      await paymentsService.fulfillPaidOrder({
        razorpayOrderId: orderId,
        razorpayPaymentId: paymentEntity?.id,
      });
    }

    res.status(200).json({ success: true, data: { received: true } });
  } catch (error) {
    next(error);
  }
}

/** Dev/test helper: confirm a mock order without Razorpay (disabled in production). */
export async function confirmMockPayment(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (env.NODE_ENV === 'production') {
      throw new AppError('Not available', 404, 'NOT_FOUND');
    }
    const authReq = req as AuthenticatedRequest;
    const { orderId } = req.body as { orderId: string };
    const result = await paymentsService.confirmMockPaymentForUser(authReq.user.id, orderId);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}
