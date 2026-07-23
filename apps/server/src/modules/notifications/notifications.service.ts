import { Notification } from '../../models/Notification.js';
import { DeviceToken } from '../../models/DeviceToken.js';
import { paginatedResult, parsePagination } from '../../utils/helpers.js';
import { AppError } from '../../utils/AppError.js';
import { env } from '../../config/env.js';

export async function listNotifications(
  userId: string,
  query: { page?: number; limit?: number; unreadOnly?: boolean },
) {
  const { page, limit, skip } = parsePagination(query);
  const filter: Record<string, unknown> = { userId };
  if (query.unreadOnly) filter.isRead = false;

  const [items, total] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Notification.countDocuments(filter),
  ]);

  return paginatedResult(
    items.map((n) => ({
      id: String(n._id),
      type: n.type,
      title: n.title,
      body: n.body,
      isRead: n.isRead,
      relatedEntityId: n.relatedEntityId ? String(n.relatedEntityId) : undefined,
      createdAt: (n as typeof n & { createdAt: Date }).createdAt.toISOString(),
    })),
    total,
    page,
    limit,
  );
}

export async function markNotificationRead(userId: string, notificationId: string) {
  const notification = await Notification.findOneAndUpdate(
    { _id: notificationId, userId },
    { $set: { isRead: true } },
    { new: true },
  );
  if (!notification) {
    throw new AppError('Notification not found', 404, 'NOT_FOUND');
  }
  return { id: String(notification._id), isRead: true };
}

export async function registerDeviceToken(
  userId: string,
  token: string,
  platform: 'web' | 'android' | 'ios' = 'web',
) {
  await DeviceToken.findOneAndUpdate(
    { userId, token },
    { $set: { platform, isActive: true } },
    { upsert: true, new: true },
  );

  // Phase 3: FCM send is stubbed until Firebase credentials are configured.
  if (env.NODE_ENV !== 'test') {
    console.info('[push:register]', { userId, platform, tokenPreview: token.slice(0, 12) });
  }

  return { registered: true };
}

export async function sendPushStub(userId: string, title: string, body: string): Promise<void> {
  const tokens = await DeviceToken.find({ userId, isActive: true }).lean();
  if (env.NODE_ENV !== 'test' && tokens.length > 0) {
    console.info('[push:send-stub]', {
      userId,
      title,
      body,
      recipients: tokens.length,
    });
  }
}
