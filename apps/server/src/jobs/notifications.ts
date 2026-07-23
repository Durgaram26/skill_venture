import { env } from '../config/env.js';
import { Notification } from '../models/Notification.js';
import type { Types } from 'mongoose';
import { sendPushStub } from '../modules/notifications/notifications.service.js';

export async function notifyNewEnquiry(params: {
  institutionUserId: Types.ObjectId | string;
  studentName: string;
  listingTitle: string;
  enquiryId: Types.ObjectId | string;
}): Promise<void> {
  const title = 'New enquiry received';
  const body = `${params.studentName} enquired about “${params.listingTitle}”.`;

  await Notification.create({
    userId: params.institutionUserId,
    type: 'enquiry.new',
    title,
    body,
    relatedEntityId: params.enquiryId,
    isRead: false,
  });

  await sendPushStub(String(params.institutionUserId), title, body);

  if (env.NODE_ENV !== 'test') {
    console.info('[email:enquiry]', {
      toUserId: String(params.institutionUserId),
      subject: title,
      body,
    });
  }
}
