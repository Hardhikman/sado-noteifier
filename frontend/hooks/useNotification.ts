import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { messaging } from '../lib/firebase';
import { getToken, onMessage, isSupported } from 'firebase/messaging';

export function useNotification() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [supported, setSupported] = useState(false);
  const [pushSupported, setPushSupported] = useState(false);
  const [fcmToken, setFcmToken] = useState<string | null>(null);

  useEffect(() => {
    // Check if notifications are supported
    if ('Notification' in window) {
      setSupported(true);
      setPermission(Notification.permission);
    } else {
      setSupported(false);
    }

    // Check if FCM is supported
    const initFcm = async () => {
      try {
        const isFcmSupported = await isSupported();
        setPushSupported(isFcmSupported && messaging !== null);
      } catch (error) {
        console.error('Error checking FCM support:', error);
        setPushSupported(false);
      }
    };

    initFcm();
  }, []);

  const requestPermission = async (): Promise<NotificationPermission> => {
    if (!supported) {
      throw new Error('Notifications not supported');
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      throw error;
    }
  };

  const showNotification = (title: string, options?: NotificationOptions) => {
    if (permission === 'granted' && supported) {
      return new Notification(title, options);
    }
    return null;
  };

  const subscribeToPush = async (): Promise<string | null> => {
    if (!pushSupported || !messaging) {
      throw new Error('Push notifications not supported');
    }

    try {
      // Get FCM token
      const token = await getToken(messaging, { 
        vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY 
      });
      
      if (token) {
        setFcmToken(token);
        
        // Send token to backend
        await saveSubscription(token);
        
        // Handle foreground messages
        onMessage(messaging, (payload) => {
          console.log('Message received in foreground:', payload);
          // Show notification if needed
          if (payload.notification) {
            showNotification(payload.notification.title || 'New Notification', {
              body: payload.notification.body,
              icon: payload.notification.icon
            });
          }
        });
        
        return token;
      }
      
      return null;
    } catch (error) {
      console.error('Error subscribing to FCM:', error);
      throw error;
    }
  };

  const unsubscribeFromPush = async (): Promise<boolean> => {
    if (!pushSupported || !fcmToken) {
      return false;
    }

    try {
      // Remove subscription from backend
      await removeSubscription(fcmToken);
      setFcmToken(null);
      return true;
    } catch (error) {
      console.error('Error unsubscribing from FCM:', error);
      return false;
    }
  };

  const saveSubscription = async (fcmToken: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('User not authenticated');
      }

      const response = await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          fcm_token: fcmToken
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save subscription');
      }
    } catch (error) {
      console.error('Error saving subscription:', error);
      throw error;
    }
  };

  const removeSubscription = async (fcmToken: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('User not authenticated');
      }

      const response = await fetch('/api/notifications/unsubscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          fcm_token: fcmToken
        })
      });

      if (!response.ok) {
        throw new Error('Failed to remove subscription');
      }
    } catch (error) {
      console.error('Error removing subscription:', error);
      throw error;
    }
  };

  return {
    permission,
    supported,
    pushSupported,
    fcmToken,
    requestPermission,
    showNotification,
    subscribeToPush,
    unsubscribeFromPush
  };
}