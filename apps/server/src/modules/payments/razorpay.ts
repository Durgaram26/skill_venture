import crypto from 'node:crypto';
import { env } from '../../config/env.js';
import { AppError } from '../../utils/AppError.js';

export function isRazorpayConfigured(): boolean {
  return Boolean(env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET);
}

export async function createRazorpayOrder(params: {
  amountPaise: number;
  currency?: string;
  receipt: string;
  notes?: Record<string, string>;
}): Promise<{ id: string; amount: number; currency: string }> {
  if (!isRazorpayConfigured()) {
    // Local/test stub — never used in production without keys
    return {
      id: `order_test_${crypto.randomBytes(8).toString('hex')}`,
      amount: params.amountPaise,
      currency: params.currency ?? 'INR',
    };
  }

  const auth = Buffer.from(`${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`).toString(
    'base64',
  );
  const response = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount: params.amountPaise,
      currency: params.currency ?? 'INR',
      receipt: params.receipt,
      notes: params.notes,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new AppError(`Razorpay order failed: ${text}`, 502, 'RAZORPAY_ERROR');
  }

  const data = (await response.json()) as { id: string; amount: number; currency: string };
  return data;
}

export function verifyWebhookSignature(rawBody: string, signature: string | undefined): boolean {
  const secret = env.RAZORPAY_WEBHOOK_SECRET ?? env.RAZORPAY_KEY_SECRET;
  if (!secret) {
    // In test/dev without secrets, allow only when NODE_ENV is test and signature is "test"
    if (env.NODE_ENV === 'test' && signature === 'test') return true;
    return false;
  }
  if (!signature) return false;

  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}

export function signTestWebhook(rawBody: string): string {
  const secret = env.RAZORPAY_WEBHOOK_SECRET ?? env.RAZORPAY_KEY_SECRET ?? 'test_webhook_secret';
  return crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
}
