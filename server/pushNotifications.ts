/**
 * Push Notification Service
 * Handles sending push notifications to users
 */

import webpush from 'web-push';
import { PushSubscription as PushSubscriptionModel } from './database.js';

// VAPID keys - should be in environment variables
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || 'BEl62iUYgUivxIkv69yViEuiBIa40HIvF8vVvJ2Nlsd6OLry5jvwkuER2UP0YbQN0y20Y0ZUN0e5QYRYFbxFww';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || '';
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:support@royalchat.com';

// Configure web-push
if (webpush && VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  try {
    webpush.setVapidDetails(
      VAPID_SUBJECT,
      VAPID_PUBLIC_KEY,
      VAPID_PRIVATE_KEY
    );
    console.log('✅ Web Push configured with VAPID keys');
  } catch (error) {
    console.warn('⚠️ Error configuring web-push:', error);
  }
} else {
  console.warn('⚠️ VAPID keys not configured or web-push not available. Push notifications will not work.');
}

export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: {
    conversationId?: string;
    senderName?: string;
    timestamp?: number;
    url?: string;
    [key: string]: any;
  };
  dir?: 'rtl' | 'ltr';
  lang?: string;
  vibrate?: number[];
  silent?: boolean;
  requireInteraction?: boolean;
}

/**
 * Send push notification to a user
 */
export async function sendPushNotification(
  userId: string,
  payload: NotificationPayload
): Promise<{ success: boolean; sent: number; failed: number }> {
  try {
    // Get all active subscriptions for the user
    const subscriptions = await PushSubscriptionModel.find({
      userId,
      isActive: true
    });

    if (subscriptions.length === 0) {
      console.log(`No active subscriptions found for user ${userId}`);
      return { success: true, sent: 0, failed: 0 };
    }

    let sent = 0;
    let failed = 0;

    // Send notification to all user's devices
    const promises = subscriptions.map(async (subscription) => {
      try {
        const pushSubscription = {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.keys.p256dh,
            auth: subscription.keys.auth
          }
        };

        if (!webpush) {
          throw new Error('web-push not available');
        }
        
        await webpush.sendNotification(
          pushSubscription,
          JSON.stringify(payload)
        );

        // Update last used timestamp
        subscription.lastUsed = new Date();
        await subscription.save();

        sent++;
        console.log(`✅ Push notification sent to user ${userId} on device ${subscription.endpoint.substring(0, 50)}...`);
      } catch (error: any) {
        failed++;
        console.error(`❌ Failed to send push notification to user ${userId}:`, error);

        // If subscription is invalid (410 Gone), mark it as inactive
        if (error.statusCode === 410) {
          subscription.isActive = false;
          await subscription.save();
          console.log(`   Subscription marked as inactive: ${subscription.endpoint}`);
        }
      }
    });

    await Promise.allSettled(promises);

    return { success: true, sent, failed };
  } catch (error: any) {
    console.error(`Error sending push notification to user ${userId}:`, error);
    return { success: false, sent: 0, failed: 0 };
  }
}

/**
 * Send push notification for a new message
 */
export async function sendMessageNotification(
  userId: string,
  senderName: string,
  messageContent: string,
  conversationId: string,
  senderAvatar?: string,
  dir: 'rtl' | 'ltr' = 'rtl'
): Promise<void> {
  // Truncate message content
  const truncatedContent = messageContent.length > 100
    ? messageContent.substring(0, 100) + '...'
    : messageContent;

  const title = dir === 'rtl' ? `رسالة جديدة من ${senderName}` : `New message from ${senderName}`;

  const payload: NotificationPayload = {
    title,
    body: truncatedContent,
    icon: senderAvatar || '/icon-192x192.png',
    badge: '/icon-192x192.png',
    tag: conversationId,
    data: {
      conversationId,
      senderName,
      timestamp: Date.now(),
      url: `/app?conversation=${conversationId}`
    },
    dir,
    lang: dir === 'rtl' ? 'ar' : 'en',
    vibrate: [200, 100, 200],
    silent: false,
    requireInteraction: false
  };

  await sendPushNotification(userId, payload);
}

/**
 * Send push notification to multiple users
 */
export async function sendPushNotificationToUsers(
  userIds: string[],
  payload: NotificationPayload
): Promise<{ success: boolean; sent: number; failed: number }> {
  let totalSent = 0;
  let totalFailed = 0;

  for (const userId of userIds) {
    const result = await sendPushNotification(userId, payload);
    totalSent += result.sent;
    totalFailed += result.failed;
  }

  return { success: true, sent: totalSent, failed: totalFailed };
}

/**
 * Get VAPID public key (for client-side subscription)
 */
export function getVAPIDPublicKey(): string {
  return VAPID_PUBLIC_KEY;
}

