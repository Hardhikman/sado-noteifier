import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { messaging } from '../lib/firebase';
import { getToken, onMessage, isSupported } from 'firebase/messaging';
import { subscribeToNotifications, unsubscribeFromNotifications } from '../lib/api';

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
        console.log('Checking FCM support...');
        const isFcmSupported = await isSupported();
        console.log('FCM Support Status:', isFcmSupported);
        console.log('Messaging object available:', !!messaging);
        setPushSupported(isFcmSupported && messaging !== null);
        if (!isFcmSupported) {
          console.warn('FCM is not supported in this browser');
        }
        if (!messaging) {
          console.warn('Firebase Messaging is not initialized');
        }
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
      console.log('Requesting notification permission...');
      const result = await Notification.requestPermission();
      console.log('Notification permission result:', result);
      setPermission(result);
      return result;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      throw error;
    }
  };

  const showNotification = (title: string, options?: NotificationOptions) => {
    if (permission === 'granted' && supported) {
      console.log('Showing notification:', title, options);
      return new Notification(title, options);
    }
    return null;
  };

  const subscribeToPush = async (): Promise<string | null> => {
    console.log('Attempting to subscribe to push notifications...');
    console.log('Push supported:', pushSupported);
    console.log('Messaging object:', !!messaging);
    
    if (!pushSupported || !messaging) {
      const error = new Error('Push notifications not supported');
      console.error('Push subscription error:', error.message);
      throw error;
    }

    try {
      console.log('Requesting FCM token...');
      console.log('VAPID key:', process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY ? 'Present' : 'Missing');
      
      // Get FCM token
      const token = await getToken(messaging, { 
        vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY 
      });
      
      console.log('FCM token received:', token ? 'YES' : 'NO');
      
      if (token) {
        console.log('FCM token value:', token.substring(0, 20) + '...');
        setFcmToken(token);
        
        console.log('Saving subscription to backend...');
        // Send token to backend
        await saveSubscription(token);
        console.log('Subscription saved successfully');
        
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
      } else {
        console.warn('No FCM token received - this could be due to various reasons:');
        console.warn('1. User denied notification permission');
        console.warn('2. Browser does not support FCM');
        console.warn('3. VAPID key is missing or incorrect');
        console.warn('4. Service worker is not registered properly');
        console.warn('5. Firebase configuration is incorrect');
      }
      
      return null;
    } catch (error) {
      console.error('Error subscribing to FCM:', error);
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      throw error;
    }
  };

  const unsubscribeFromPush = async (): Promise<boolean> => {
    if (!pushSupported || !fcmToken) {
      console.warn('Cannot unsubscribe: push not supported or no token');
      return false;
    }

    try {
      console.log('Removing subscription from backend...');
      // Remove subscription from backend
      await removeSubscription(fcmToken);
      console.log('Subscription removed successfully');
      setFcmToken(null);
      return true;
    } catch (error) {
      console.error('Error unsubscribing from FCM:', error);
      return false;
    }
  };

  const saveSubscription = async (fcmToken: string) => {
    try {
      console.log('Getting user session...');
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.error('User not authenticated');
        throw new Error('User not authenticated');
      }
      
      console.log('User session found, user ID:', session.user.id);

      // Use the backend API instead of the Next.js API route
      console.log('Calling subscribeToNotifications API...');
      await subscribeToNotifications(fcmToken);
      console.log('subscribeToNotifications API call completed');
    } catch (error) {
      console.error('Error saving subscription:', error);
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      throw error;
    }
  };

  const removeSubscription = async (fcmToken: string) => {
    try {
      console.log('Getting user session for removal...');
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.error('User not authenticated');
        throw new Error('User not authenticated');
      }
      
      console.log('User session found for removal, user ID:', session.user.id);

      // Use the backend API instead of the Next.js API route
      console.log('Calling unsubscribeFromNotifications API...');
      await unsubscribeFromNotifications(fcmToken);
      console.log('unsubscribeFromNotifications API call completed');
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