import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('=== Notification Unsubscribe API Called ===');
  console.log('Method:', req.method);
  console.log('Body:', req.body);
  
  if (req.method !== 'POST') {
    console.log('Method not allowed:', req.method);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get the user from the session
    const token = req.headers.authorization?.split(' ')[1];
    console.log('Auth token present:', !!token);
    
    if (!token) {
      console.log('No authorization token provided');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    console.log('Getting user from token...');
    const { data: { user }, error } = await supabase.auth.getUser(token);
    console.log('User retrieval result - User:', !!user, 'Error:', error);
    
    if (error || !user) {
      console.log('Authentication failed:', error);
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { fcm_token } = req.body;
    console.log('FCM token from request body:', fcm_token ? fcm_token.substring(0, 20) + '...' : 'NONE');
    
    if (!fcm_token) {
      console.log('No FCM token provided in request');
      return res.status(400).json({ error: 'FCM token required' });
    }

    console.log('Removing FCM token from database...');
    // Remove the FCM token from your database
    const { error: deleteError } = await supabase
      .from('push_subscriptions')
      .delete()
      .eq('fcm_token', fcm_token)
      .eq('user_id', user.id);

    console.log('Database deletion result - Error:', deleteError);
    
    if (deleteError) {
      console.error('Error removing FCM token:', deleteError);
      return res.status(500).json({ error: 'Failed to remove subscription' });
    }

    console.log('Subscription removed successfully');
    return res.status(200).json({ message: 'Subscription removed successfully' });
  } catch (error) {
    console.error('Error handling unsubscription:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}