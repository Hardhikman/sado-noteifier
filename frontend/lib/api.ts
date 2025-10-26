// frontend/lib/api.ts
import axios from 'axios';
import { supabase } from './supabase';

// Base URL for backend API
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Create an axios instance with default configuration
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to include the auth token
apiClient.interceptors.request.use(
  async (config) => {
    console.log('API Request:', config.method?.toUpperCase(), config.baseURL + config.url);
    // Get the session from Supabase client directly instead of localStorage
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      config.headers.Authorization = `Bearer ${session.access_token}`;
      console.log('Authorization header added to request');
    } else {
      console.warn('No session token available for request');
    }
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle auth errors
apiClient.interceptors.response.use(
  (response) => {
    console.log('API Response:', response.status, response.config.method?.toUpperCase(), response.config.url);
    return response;
  },
  async (error) => {
    console.error('API Error:', error.response?.status, error.response?.data || error.message);
    if (error.response?.status === 401) {
      // Token might be expired, try to refresh the session
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.refresh_token) {
        try {
          // Try to refresh the session
          const { data: { session: newSession }, error: refreshError } = await supabase.auth.refreshSession();
          if (newSession?.access_token && !refreshError) {
            // Retry the original request with the new token
            const originalRequest = error.config;
            originalRequest.headers.Authorization = `Bearer ${newSession.access_token}`;
            console.log('Retrying request with refreshed token');
            return apiClient(originalRequest);
          }
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError);
        }
      }
      // If we can't refresh or it fails, redirect to login
      console.log('Redirecting to login due to auth error');
      window.location.href = '/signin';
    }
    return Promise.reject(error);
  }
);

/**
 * Create a new note
 * @param {Object} noteData - The note data to save
 * @param {string} noteData.title - The title of the note
 * @param {string} noteData.content - The content of the note
 * @param {string} noteData.user_id - The user ID
 * @param {boolean} noteData.notify - Whether to set up notifications
 * @param {string} noteData.notify_type - Type of notification (hourly/daily)
 * @param {string} noteData.notify_time - Time for daily notifications (HH:MM format)
 * @param {string} noteData.end_date - End date for notifications (ISO format)
 * @returns {Promise<Object>} The response data
 */
export async function createNote(noteData: any) {
  try {
    console.log('Creating note with data:', noteData);
    // If notify is true, use the notify endpoint
    if (noteData.notify) {
      const response = await apiClient.post('/notes/notify', {
        title: noteData.title,
        content: noteData.content,
        notify: noteData.notify,
        notify_type: noteData.notify_type,
        notify_time: noteData.notify_time || null,
        end_date: noteData.end_date || null, // Add end_date
      });
      console.log('Note with notification created:', response.data);
      return response.data;
    } else {
      // Otherwise, use the regular endpoint
      const response = await apiClient.post('/notes', {
        title: noteData.title,
        content: noteData.content,
      });
      console.log('Note created:', response.data);
      return response.data;
    }
  } catch (error) {
    console.error('Error creating note:', error);
    throw error;
  }
}

/**
 * Update an existing note
 * @param {number} noteId - The ID of the note to update
 * @param {Object} noteData - The note data to update
 * @param {string} noteData.title - The title of the note
 * @param {string} noteData.content - The content of the note
 * @param {boolean} noteData.notify - Whether to set up notifications
 * @param {string} noteData.notify_type - Type of notification (hourly/daily)
 * @param {string} noteData.notify_time - Time for daily notifications (HH:MM format)
 * @param {string} noteData.end_date - End date for notifications (ISO format)
 * @returns {Promise<Object>} The response data
 */
export async function updateNote(noteId: number, noteData: any) {
  try {
    console.log('Updating note ID:', noteId, 'with data:', noteData);
    // If notify is true, use the update with notify endpoint
    if (noteData.notify) {
      const response = await apiClient.put(`/notes/${noteId}/notify`, {
        title: noteData.title,
        content: noteData.content,
        notify: noteData.notify,
        notify_type: noteData.notify_type,
        notify_time: noteData.notify_time || null,
        end_date: noteData.end_date || null, // Add end_date
      });
      console.log('Note with notification updated:', response.data);
      return response.data;
    } else {
      // Otherwise, use the regular update endpoint
      const response = await apiClient.put(`/notes/${noteId}`, {
        title: noteData.title,
        content: noteData.content,
      });
      console.log('Note updated:', response.data);
      return response.data;
    }
  } catch (error) {
    console.error('Error updating note:', error);
    throw error;
  }
}

/**
 * Get all notes for a user
 * @returns {Promise<Array>} Array of notes
 */
export async function getNotes() {
  try {
    console.log('Fetching notes...');
    const response = await apiClient.get('/notes');
    console.log('Notes fetched:', response.data.data?.length || 0, 'items');
    return response.data.data;
  } catch (error) {
    console.error('Error fetching notes:', error);
    throw error;
  }
}

/**
 * Fetch notes for a specific user
 * @returns {Promise<Array>} Array of notes
 */
export async function fetchNotesForUser() {
  // In a real implementation, the user ID would be extracted from the auth token
  // For now, we'll just call getNotes which uses the authenticated user
  return getNotes();
}

/**
 * Get a single note by ID
 * @param {number} noteId - The ID of the note to fetch
 * @returns {Promise<Object>} The note data
 */
export async function getNoteById(noteId: number) {
  try {
    console.log('Fetching note by ID:', noteId);
    const response = await apiClient.get(`/notes/${noteId}`);
    console.log('Note fetched:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching note:', error);
    throw error;
  }
}

/**
 * Delete a note by ID
 * @param {number} noteId - The ID of the note to delete
 * @returns {Promise<Object>} The response data
 */
export async function deleteNote(noteId: number) {
  try {
    console.log('Deleting note ID:', noteId);
    const response = await apiClient.delete(`/notes/${noteId}`);
    console.log('Note deleted:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error deleting note:', error);
    throw error;
  }
}

/**
 * Subscribe to push notifications
 * @param {string} fcmToken - The FCM token to subscribe
 * @returns {Promise<Object>} The response data
 */
export async function subscribeToNotifications(fcmToken: string) {
  try {
    console.log('Subscribing to notifications with FCM token:', fcmToken.substring(0, 20) + '...');
    console.log('FCM token length:', fcmToken.length);
    
    if (!fcmToken || fcmToken.length < 10) {
      const error = new Error('Invalid FCM token');
      console.error('Invalid FCM token provided:', fcmToken);
      throw error;
    }
    
    const response = await apiClient.post('/notifications/subscribe', {
      fcm_token: fcmToken
    });
    console.log('Subscription response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('Error subscribing to notifications:', error.response?.data || error.message);
    console.error('Error details:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
      stack: error.stack
    });
    throw error;
  }
}

/**
 * Unsubscribe from push notifications
 * @param {string} fcmToken - The FCM token to unsubscribe
 * @returns {Promise<Object>} The response data
 */
export async function unsubscribeFromNotifications(fcmToken: string) {
  try {
    console.log('Unsubscribing from notifications with FCM token:', fcmToken.substring(0, 20) + '...');
    const response = await apiClient.post('/notifications/unsubscribe', {
      fcm_token: fcmToken
    });
    console.log('Unsubscription response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error unsubscribing from notifications:', error.response?.data || error.message);
    throw error;
  }
}