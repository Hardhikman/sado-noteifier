import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import { Button } from "@/components/retroui/Button"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/retroui/DropdownMenu"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/retroui/Card"
import { Label } from "@/components/retroui/Label"
import { Tooltip } from "@/components/retroui/Tooltip" // Add Tooltip import
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/retroui/Dialog"
import { useAuth } from '../hooks/useAuth';
import { useNotification } from '../hooks/useNotification';
import { createNote, updateNote, getNoteById } from '../lib/api';
import { supabase } from '../lib/supabase';
import { ChevronDown, Save, Bell, ArrowLeft, User, LogOut } from 'lucide-react';

export default function EditorPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { 
    permission, 
    supported, 
    pushSupported, 
    requestPermission, 
    subscribeToPush 
  } = useNotification();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [noteId, setNoteId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false); // Add saving state
  const [notificationRequested, setNotificationRequested] = useState(false);
  const [notifyEndDate, setNotifyEndDate] = useState<string>(''); // Add end date state
  const [notifyTime, setNotifyTime] = useState<string>('09:00'); // Add time state with default 9:00 AM
  const [showDailyTimePicker, setShowDailyTimePicker] = useState(false); // State to show/hide daily time picker
  const [selectedReminderType, setSelectedReminderType] = useState<'hourly' | 'daily' | null>(null); // Track selected reminder type
  const [showNotificationDialog, setShowNotificationDialog] = useState(false); // Add state for dialog

  // Load note data if we're editing an existing note
  useEffect(() => {
    const { id } = router.query;
    if (id) {
      const noteIdNum = Number(id);
      setNoteId(noteIdNum);
      setLoading(true);
      
      // Fetch the existing note data
      getNoteById(noteIdNum)
        .then(data => {
          console.log('Received note data:', data); // Debug log
          // The API returns { data: note_data }, so we need to access data.data
          if (data && data.data) {
            setTitle(data.data.title || '');
            setContent(data.data.content || '');
          }
        })
        .catch(error => {
          console.error('Error fetching note:', error);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [router.query]);

  async function handleSave(notify = false, notify_type = 'daily') {
    if (!title.trim()) {
      alert('Please enter a title for your note');
      return;
    }
    
    // Validate end date is required when notifications are enabled
    if (notify && !notifyEndDate) {
      alert('Please select an end date for notifications');
      return;
    }
    
    // Set saving state to true to show loading message
    setSaving(true);
    
    // Request notification permission if user wants to save with notification
    if (notify && supported && permission !== 'granted') {
      try {
        const result = await requestPermission();
        setNotificationRequested(true);
        if (result !== 'granted') {
          alert('Notification permission is required to set reminders. You can still save the note without notifications.');
          notify = false; // Disable notification if permission not granted
        }
      } catch (error) {
        console.error('Error requesting notification permission:', error);
        alert('Failed to request notification permission. You can still save the note without notifications.');
        notify = false; // Disable notification if permission request fails
      }
    }
    
    // Subscribe to FCM notifications if needed
    if (notify && pushSupported) {
      try {
        console.log('Attempting to subscribe to FCM notifications...');
        console.log('Push supported:', pushSupported);
        await subscribeToPush();
        console.log('FCM subscription completed');
      } catch (error) {
        console.error('Error subscribing to FCM notifications:', error);
        console.error('Error details:', {
          name: error.name,
          message: error.message,
          stack: error.stack
        });
        // Continue anyway as we can still use local notifications
      }
    }
    
    try {
      const payload = { 
        title, 
        content, 
        user_id: user?.id, 
        notify,
        notify_type: notify_type,
        notify_time: (notify && notify_type === 'daily') ? notifyTime : undefined, // Add notify_time for daily notifications
        end_date: notify ? notifyEndDate : undefined // Add end date to payload
      };
      
      console.log('Saving note with payload:', payload);
      console.log('Note ID:', noteId);
      
      if (noteId) {
        // Update existing note
        console.log('Updating existing note with ID:', noteId);
        await updateNote(noteId, payload);
      } else {
        // Create new note
        console.log('Creating new note');
        await createNote(payload);
      }
      
      // Show a message to the user that the note is being saved
      alert('Note saved successfully! The AI reminder will be generated shortly.');
      
      router.push('/');
    } catch (error) {
      console.error('Error saving note:', error);
      alert('Failed to save note. Please try again.');
    } finally {
      // Reset saving state
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading note...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      <header className="header fixed top-0 left-0 right-0 h-4 sm:h-6 bg-[#8b597b] shadow-sm backdrop-blur-sm border-b border-white/20 z-50">
      </header>
      
      <div className="editor-shell max-w-4xl mx-auto p-3 sm:p-4 md:p-6 mt-16 relative z-10">
        <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
          {/* Intuitive arrow button to go back, positioned beside the card */}
          <button
            onClick={() => router.push('/')}
            className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#efa3a0] hover:bg-[#e89290] text-white flex items-center justify-center shadow-md z-40 transition-all duration-300 hover:scale-110 mt-16 sm:mt-20"
          >
            <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
          
          <div className="flex-1 w-full">
            {/* Brand logo */}
            <div 
              className="flex items-center justify-center mb-4 cursor-pointer"
              onClick={() => router.push('/')}
            >
              <div className="logo-container">
                <img 
                  src="/sado_logo.png" 
                  alt="SaDo Logo" 
                  className="logo-image"
                />
              </div>
            </div>
            
            <Card className="shadow-lg bg-white/80 backdrop-blur-sm border border-white/30 w-full">
              <CardContent className="space-y-4 sm:space-y-6">
                {/* Save button inside the card, moved down */}
                <div className="flex justify-end mt-4">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button className="flex items-center gap-1 bg-[#efa3a0] hover:bg-[#e89290] text-white px-3 py-1.5 text-sm">
                        Save
                        <ChevronDown className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="flex flex-row w-auto p-1 min-w-[100px] mt-2 bg-white border-0 shadow-lg">
                      <Tooltip.Provider>
                        <Tooltip.Trigger asChild>
                          <DropdownMenuItem 
                            onClick={() => handleSave(false)}
                            className="flex flex-col items-center justify-center gap-1 py-2 px-2 rounded hover:bg-gray-100"
                          >
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100 text-green-600">
                              <Save className="h-4 w-4" />
                            </div>
                          </DropdownMenuItem>
                        </Tooltip.Trigger>
                        <Tooltip.Content>
                          Save Only
                        </Tooltip.Content>
                      </Tooltip.Provider>
                      
                      <Tooltip.Provider>
                        <Tooltip.Trigger asChild>
                          <DropdownMenuItem 
                            onClick={() => {
                              // Show notification dialog when user selects "Notify"
                              setShowNotificationDialog(true);
                            }}
                            className="flex flex-col items-center justify-center gap-1 py-2 px-2 rounded hover:bg-gray-100"
                          >
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600">
                              <Bell className="h-4 w-4" />
                            </div>
                          </DropdownMenuItem>
                        </Tooltip.Trigger>
                        <Tooltip.Content>
                          Save with Notification
                        </Tooltip.Content>
                      </Tooltip.Provider>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                
                <div className="space-y-2">
                  <input
                    id="title"
                    className="w-full p-3 sm:p-4 text-lg sm:text-xl md:text-2xl font-bold border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/50 backdrop-blur-sm"
                    placeholder="Note Title"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    style={{ color: '#493129', fontFamily: "'Playwrite GB S', cursive" }}
                  />
                </div>
                
                <div className="space-y-2">
                  <textarea
                    id="content"
                    className="w-full h-64 sm:h-80 md:h-96 p-3 sm:p-4 text-sm sm:text-base md:text-lg border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none bg-white/50 backdrop-blur-sm"
                    placeholder="Start writing your note here..."
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    style={{ color: '#493129', fontFamily: "'Playwrite GB S', cursive" }}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      
      {/* Saving indicator dialog */}
      <Dialog open={saving} onOpenChange={setSaving}>
        <DialogContent className="sm:max-w-md bg-[#8b597b] text-white backdrop-blur-sm">
          <div className="flex flex-col items-center justify-center py-6">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4"></div>
            <h3 className="text-lg font-medium text-white mb-2">Saving Note</h3>
            <p className="text-white/80 text-center">Please wait while your note is being saved...</p>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Notification Settings Dialog */}
      <Dialog open={showNotificationDialog} onOpenChange={setShowNotificationDialog}>
        <DialogContent className="sm:max-w-md bg-[#8b597b] text-white backdrop-blur-sm">
          <DialogHeader className="relative">
            <DialogTitle className="text-white">Notification Settings</DialogTitle>
            <button 
              onClick={() => setShowNotificationDialog(false)}
              className="absolute top-0 right-0 w-6 h-6 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
            >
              <span className="text-white text-lg leading-none">&times;</span>
            </button>
          </DialogHeader>
          <div className="space-y-4">
            {/* Reminder type selection */}
            <div className="flex gap-2">
              <Button 
                onClick={() => setSelectedReminderType('hourly')}
                className={`flex-1 text-xs py-2 ${selectedReminderType === 'hourly' ? 'bg-blue-600 text-white' : 'bg-white/20 text-white'}`}
              >
                Hourly Reminder
              </Button>
              <Button 
                onClick={() => setSelectedReminderType('daily')}
                className={`flex-1 text-xs py-2 ${selectedReminderType === 'daily' ? 'bg-purple-600 text-white' : 'bg-white/20 text-white'}`}
              >
                Daily Reminder
              </Button>
            </div>
            
            {/* Notification End Date Input */}
            <div className="space-y-2">
              <Label htmlFor="end-date" className="text-xs font-medium text-white">
                Notification End Date *
              </Label>
              <input
                type="datetime-local"
                id="end-date"
                className="w-full p-2 border border-white/30 rounded-lg text-sm bg-white/10 text-white"
                value={notifyEndDate}
                onChange={e => setNotifyEndDate(e.target.value)}
                required
                style={{ fontFamily: "'Playwrite GB S', cursive" }}
              />
              <p className="text-xs text-white/80">
                Notifications will automatically stop after this date and time.
              </p>
            </div>
            
            {/* Time picker for daily reminders */}
            {selectedReminderType === 'daily' && (
              <div className="space-y-2">
                <Label htmlFor="notify-time" className="text-xs font-medium text-white">
                  Daily Reminder Time
                </Label>
                <input
                  type="time"
                  id="notify-time"
                  className="w-full p-2 border border-white/30 rounded-lg text-sm bg-white/10 text-white"
                  value={notifyTime}
                  onChange={e => setNotifyTime(e.target.value)}
                  style={{ fontFamily: "'Playwrite GB S', cursive" }}
                />
                <p className="text-xs text-white/80">
                  Default is 9:00 AM.
                </p>
              </div>
            )}
            
            {/* Save with notification button */}
            <Button 
              onClick={() => {
                handleSave(true, selectedReminderType);
                setShowNotificationDialog(false); // Close dialog after saving
              }}
              className="w-full flex items-center justify-center gap-2 bg-[#efa3a0] hover:bg-[#e89290] text-white py-2 text-sm"
            >
              <Bell className="h-4 w-4" />
              Save with {selectedReminderType === 'hourly' ? 'Hourly' : 'Daily'} Notification
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}