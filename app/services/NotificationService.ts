'use client';

/**
 * Notification Service - Handles browser notifications and push notifications for messages
 * Similar to WhatsApp notifications with real push support
 */

interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export class NotificationService {
  private static permission: NotificationPermission = 'default';
  private static soundEnabled: boolean = true;
  private static notificationEnabled: boolean = true;
  private static serviceWorkerRegistration: ServiceWorkerRegistration | null = null;
  private static pushSubscription: PushSubscription | null = null;
  private static userId: string | null = null;

  /**
   * Initialize Service Worker and Push Notifications
   */
  static async initialize(userId?: string): Promise<boolean> {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      console.warn('Service Worker not supported');
      return false;
    }

    this.userId = userId || null;

    try {
      // Register Service Worker
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });
      
      this.serviceWorkerRegistration = registration;
      console.log('Service Worker registered:', registration);

      // Wait for service worker to be ready
      await navigator.serviceWorker.ready;
      console.log('Service Worker ready');

      // Request notification permission
      const permission = await this.requestPermission();
      if (permission !== 'granted') {
        console.warn('Notification permission not granted');
        return false;
      }

      // Subscribe to push notifications
      await this.subscribeToPush();

      return true;
    } catch (error) {
      console.error('Error initializing Service Worker:', error);
      return false;
    }
  }

  /**
   * Request notification permission from user
   */
  static async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return 'denied';
    }

    if (Notification.permission === 'default') {
      try {
        const permission = await Notification.requestPermission();
        this.permission = permission;
        return permission;
      } catch (error) {
        console.error('Error requesting notification permission:', error);
        return 'denied';
      }
    }

    this.permission = Notification.permission;
    return Notification.permission;
  }

  /**
   * Subscribe to push notifications
   */
  static async subscribeToPush(): Promise<PushSubscription | null> {
    if (!this.serviceWorkerRegistration) {
      console.warn('Service Worker not registered');
      return null;
    }

    try {
      // Check if already subscribed
      const existingSubscription = await this.serviceWorkerRegistration.pushManager.getSubscription();
      if (existingSubscription) {
        this.pushSubscription = existingSubscription;
        // Update subscription on server
        await this.updateSubscriptionOnServer(existingSubscription);
        return existingSubscription;
      }

      // Get VAPID public key from server
      let vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      
      if (!vapidPublicKey) {
        try {
          const response = await fetch('/api/notifications/vapid-key');
          const data = await response.json();
          if (data.success && data.publicKey) {
            vapidPublicKey = data.publicKey;
          }
        } catch (error) {
          console.error('Error fetching VAPID key:', error);
        }
      }

      // Fallback to default key if still not available
      if (!vapidPublicKey) {
        vapidPublicKey = 'BEl62iUYgUivxIkv69yViEuiBIa40HIvF8vVvJ2Nlsd6OLry5jvwkuER2UP0YbQN0y20Y0ZUN0e5QYRYFbxFww';
      }

      // Create new subscription
      const subscription = await this.serviceWorkerRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(vapidPublicKey)
      });

      this.pushSubscription = subscription;
      console.log('Push subscription created:', subscription);

      // Send subscription to server
      await this.updateSubscriptionOnServer(subscription);

      return subscription;
    } catch (error) {
      console.error('Error subscribing to push:', error);
      return null;
    }
  }

  /**
   * Unsubscribe from push notifications
   */
  static async unsubscribeFromPush(): Promise<boolean> {
    if (!this.pushSubscription) {
      return true;
    }

    try {
      const unsubscribed = await this.pushSubscription.unsubscribe();
      if (unsubscribed) {
        // Remove subscription from server
        await this.removeSubscriptionFromServer(this.pushSubscription.endpoint);
        this.pushSubscription = null;
      }
      return unsubscribed;
    } catch (error) {
      console.error('Error unsubscribing from push:', error);
      return false;
    }
  }

  /**
   * Update subscription on server
   */
  private static async updateSubscriptionOnServer(subscription: PushSubscription): Promise<void> {
    if (!this.userId) {
      console.warn('User ID not set, cannot update subscription');
      return;
    }

    try {
      const subscriptionData: PushSubscriptionData = {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: this.arrayBufferToBase64(subscription.getKey('p256dh')!),
          auth: this.arrayBufferToBase64(subscription.getKey('auth')!)
        }
      };

      const response = await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: this.userId,
          subscription: subscriptionData,
          userAgent: navigator.userAgent,
          deviceInfo: this.getDeviceInfo()
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update subscription on server');
      }

      console.log('Subscription updated on server');
    } catch (error) {
      console.error('Error updating subscription on server:', error);
    }
  }

  /**
   * Remove subscription from server
   */
  private static async removeSubscriptionFromServer(endpoint: string): Promise<void> {
    if (!this.userId) {
      return;
    }

    try {
      const response = await fetch('/api/notifications/unsubscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: this.userId,
          endpoint: endpoint
        })
      });

      if (!response.ok) {
        throw new Error('Failed to remove subscription from server');
      }

      console.log('Subscription removed from server');
    } catch (error) {
      console.error('Error removing subscription from server:', error);
    }
  }

  /**
   * Convert VAPID key from URL-safe base64 to Uint8Array
   */
  private static urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  /**
   * Convert ArrayBuffer to base64
   */
  private static arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }

  /**
   * Get device information
   */
  private static getDeviceInfo(): { type: string; os: string; browser: string } {
    const ua = navigator.userAgent;
    let type = 'desktop';
    let os = 'unknown';
    let browser = 'unknown';

    // Detect device type
    if (/mobile|android|iphone|ipad/i.test(ua)) {
      type = 'mobile';
    } else if (/tablet|ipad/i.test(ua)) {
      type = 'tablet';
    }

    // Detect OS
    if (/android/i.test(ua)) os = 'android';
    else if (/iphone|ipad|ipod/i.test(ua)) os = 'ios';
    else if (/windows/i.test(ua)) os = 'windows';
    else if (/mac/i.test(ua)) os = 'macos';
    else if (/linux/i.test(ua)) os = 'linux';

    // Detect browser
    if (/chrome/i.test(ua) && !/edg/i.test(ua)) browser = 'chrome';
    else if (/firefox/i.test(ua)) browser = 'firefox';
    else if (/safari/i.test(ua) && !/chrome/i.test(ua)) browser = 'safari';
    else if (/edg/i.test(ua)) browser = 'edge';

    return { type, os, browser };
  }

  /**
   * Set user ID for push notifications
   */
  static setUserId(userId: string): void {
    this.userId = userId;
  }

  /**
   * Check if notifications are supported and allowed
   */
  static isSupported(): boolean {
    return 'Notification' in window;
  }

  /**
   * Check if notifications are allowed
   */
  static isAllowed(): boolean {
    return this.isSupported() && Notification.permission === 'granted';
  }

  /**
   * Show notification for new message
   * Uses Service Worker if available, otherwise falls back to browser notifications
   */
  static async showMessageNotification(
    senderName: string,
    messageContent: string,
    senderAvatar?: string,
    conversationId?: string,
    dir: 'rtl' | 'ltr' = 'rtl'
  ): Promise<void> {
    // Check if notifications are enabled
    if (!this.notificationEnabled) return;

    // Check if permission is granted
    if (!this.isAllowed()) {
      // Try to request permission
      const permission = await this.requestPermission();
      if (permission !== 'granted') {
        return;
      }
    }

    // Check if page is visible (don't show notification if user is viewing the app)
    if (document.visibilityState === 'visible') {
      // Check if user is in the same conversation
      const currentPath = window.location.pathname;
      const currentHash = window.location.hash;
      if (conversationId && (currentPath.includes(conversationId) || currentHash.includes(conversationId))) {
        // User is viewing this conversation, don't show notification
        return;
      }
    }

    try {
      // Truncate message content for notification
      const truncatedContent = messageContent.length > 100 
        ? messageContent.substring(0, 100) + '...' 
        : messageContent;

      const title = dir === 'rtl' ? `رسالة جديدة من ${senderName}` : `New message from ${senderName}`;

      // Use Service Worker if available (for background notifications)
      if (this.serviceWorkerRegistration) {
        await this.serviceWorkerRegistration.showNotification(title, {
          body: truncatedContent,
          icon: senderAvatar || '/icon-192x192.png',
          badge: '/icon-192x192.png',
          tag: conversationId || `message-${Date.now()}`,
          requireInteraction: false,
          silent: !this.soundEnabled,
          dir: dir,
          lang: dir === 'rtl' ? 'ar' : 'en',
          vibrate: this.soundEnabled ? [200, 100, 200] : undefined,
          data: {
            conversationId: conversationId,
            senderName: senderName,
            timestamp: Date.now(),
            url: conversationId ? `/app?conversation=${conversationId}` : '/app'
          },
          actions: [
            {
              action: 'open',
              title: dir === 'rtl' ? 'فتح' : 'Open',
              icon: '/icon-192x192.png'
            }
          ]
        });
      } else {
        // Fallback to browser notifications
        const options: NotificationOptions = {
          body: truncatedContent,
          icon: senderAvatar || '/icon-192x192.png',
          badge: '/icon-192x192.png',
          tag: conversationId || `message-${Date.now()}`,
          requireInteraction: false,
          silent: !this.soundEnabled,
          dir: dir,
          lang: dir === 'rtl' ? 'ar' : 'en',
          vibrate: [200, 100, 200],
          data: {
            conversationId: conversationId,
            senderName: senderName,
            timestamp: Date.now()
          }
        };

        const notification = new Notification(title, options);

        notification.onclick = () => {
          window.focus();
          if (conversationId) {
            window.location.href = `/app?conversation=${conversationId}`;
          }
          notification.close();
        };

        setTimeout(() => {
          notification.close();
        }, 5000);
      }

      // Play sound if enabled
      if (this.soundEnabled) {
        this.playNotificationSound();
      }
    } catch (error) {
      console.error('Error showing notification:', error);
    }
  }

  /**
   * Play notification sound
   */
  private static playNotificationSound(): void {
    try {
      // Create audio context for notification sound
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // WhatsApp-like notification sound (two beeps)
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);

      // Second beep
      setTimeout(() => {
        const oscillator2 = audioContext.createOscillator();
        const gainNode2 = audioContext.createGain();
        oscillator2.connect(gainNode2);
        gainNode2.connect(audioContext.destination);
        oscillator2.frequency.value = 800;
        oscillator2.type = 'sine';
        gainNode2.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        oscillator2.start(audioContext.currentTime);
        oscillator2.stop(audioContext.currentTime + 0.3);
      }, 150);
    } catch (error) {
      console.error('Error playing notification sound:', error);
    }
  }

  /**
   * Enable/disable notifications
   */
  static setEnabled(enabled: boolean): void {
    this.notificationEnabled = enabled;
    if (typeof window !== 'undefined') {
      localStorage.setItem('royal_chat_notifications_enabled', String(enabled));
    }
  }

  /**
   * Enable/disable sound
   */
  static setSoundEnabled(enabled: boolean): void {
    this.soundEnabled = enabled;
    if (typeof window !== 'undefined') {
      localStorage.setItem('royal_chat_notifications_sound', String(enabled));
    }
  }

  /**
   * Load settings from localStorage
   */
  static loadSettings(): void {
    if (typeof window !== 'undefined') {
      const enabled = localStorage.getItem('royal_chat_notifications_enabled');
      const sound = localStorage.getItem('royal_chat_notifications_sound');
      
      if (enabled !== null) {
        this.notificationEnabled = enabled === 'true';
      }
      if (sound !== null) {
        this.soundEnabled = sound === 'true';
      }
    }
  }

  /**
   * Close all notifications
   */
  static closeAll(): void {
    // Notifications auto-close, but we can track them if needed
    if (this.serviceWorkerRegistration) {
      this.serviceWorkerRegistration.getNotifications().then(notifications => {
        notifications.forEach(notification => notification.close());
      });
    }
  }

  /**
   * Check if push notifications are supported
   */
  static isPushSupported(): boolean {
    return 'serviceWorker' in navigator && 'PushManager' in window;
  }

  /**
   * Get current push subscription
   */
  static async getPushSubscription(): Promise<PushSubscription | null> {
    if (!this.serviceWorkerRegistration) {
      return null;
    }

    try {
      return await this.serviceWorkerRegistration.pushManager.getSubscription();
    } catch (error) {
      console.error('Error getting push subscription:', error);
      return null;
    }
  }
}

// Load settings on initialization
if (typeof window !== 'undefined') {
  NotificationService.loadSettings();
  
  // Auto-initialize service worker when page loads
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      // Initialize will be called when user logs in
      console.log('Service Worker ready to initialize');
    });
  }
}

