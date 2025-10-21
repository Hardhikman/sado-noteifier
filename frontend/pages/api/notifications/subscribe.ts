import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get the user from the session
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { fcm_token } = req.body;
    if (!fcm_token) {
      return res.status(400).json({ error: 'FCM token required' });
    }

    // Save the FCM token to your database
    const { data, error: saveError } = await supabase
      .from('push_subscriptions')
      .upsert(
        {
          user_id: user.id,
          fcm_token: fcm_token,
          updated_at: new Date().toISOString()
        },
        {
          onConflict: 'fcm_token'
        }
      )
      .select();

    if (saveError) {
      console.error('Error saving FCM token:', saveError);
      return res.status(500).json({ error: 'Failed to save subscription' });
    }

    return res.status(200).json({ message: 'Subscription saved successfully' });
  } catch (error) {
    console.error('Error handling subscription:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}