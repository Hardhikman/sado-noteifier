import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Button } from "@/components/retroui/Button"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "../components/retroui/DropdownMenu"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/retroui/Card"
import { Label } from "@/components/retroui/Label"
import { useAuth } from '../hooks/useAuth';
import { useNotification } from '../hooks/useNotification';
import { createNote, updateNote, getNoteById } from '../lib/api';
import { ChevronDown, Save, Bell, ArrowLeft } from 'lucide-react';

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
  const [notificationRequested, setNotificationRequested] = useState(false);
  const [notifyEndDate, setNotifyEndDate] = useState<string>(''); // Add end date state
  const [notifyTime, setNotifyTime] = useState<string>('09:00'); // Add time state with default 9:00 AM
  const [showDailyTimePicker, setShowDailyTimePicker] = useState(false); // State to show/hide daily time picker
  const [selectedReminderType, setSelectedReminderType] = useState<'hourly' | 'daily' | null>(null); // Track selected reminder type

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
        await subscribeToPush();
      } catch (error) {
        console.error('Error subscribing to FCM notifications:', error);
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
      
      router.push('/');
    } catch (error) {
      console.error('Error saving note:', error);
      alert('Failed to save note. Please try again.');
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
      {/* Blue Corner Glow Background */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `
            radial-gradient(circle 600px at 0% 0%, #bfdbfe, transparent),
            radial-gradient(circle 600px at 100% 0%, #bfdbfe, transparent)
          `,
        }}
      />
      <header className="header flex items-center justify-between p-4 sm:p-6 bg-white/80 shadow-sm backdrop-blur-sm border-b border-white/20 relative z-10">
        <div 
          className="brand text-lg sm:text-xl font-bold text-gray-800 cursor-pointer hover:text-blue-600 transition-colors relative z-10"
          onClick={() => router.push('/')}
        >
          SaDo Noteifier
        </div>
        <div className="header-right flex items-center gap-2 sm:gap-4 relative z-10">
          <span className="text-xs sm:text-base text-gray-600 relative z-10 truncate max-w-[100px] sm:max-w-none">{user?.email}</span>
        </div>
      </header>
      
      <div className="editor-shell max-w-4xl mx-auto p-3 sm:p-4 md:p-6">
        <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
          {/* Intuitive arrow button to go back, positioned beside the card */}
          <button
            onClick={() => router.push('/')}
            className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gray-600 hover:bg-gray-700 text-white flex items-center justify-center shadow-md z-20 transition-all duration-300 hover:scale-110 mt-0 sm:mt-2"
          >
            <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
          
          <Card className="flex-1 shadow-lg bg-white/80 backdrop-blur-sm border border-white/30 w-full">
            <CardHeader>
              <CardTitle className="text-lg font-bold border-2 border-blue-500 rounded bg-blue-100 text-blue-800 whitespace-nowrap inline-block px-1.5 py-0.5 w-auto">
                {noteId ? 'Edit Note' : 'Create New Note'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-sm sm:text-base font-medium">
                  Title
                </Label>
                <input
                  id="title"
                  className="w-full p-3 sm:p-4 text-lg sm:text-xl md:text-2xl font-bold border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/50 backdrop-blur-sm"
                  placeholder="Note Title"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="content" className="text-sm sm:text-base font-medium">
                  Note
                </Label>
                <textarea
                  id="content"
                  className="w-full h-64 sm:h-80 md:h-96 p-3 sm:p-4 text-sm sm:text-base md:text-lg border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none bg-white/50 backdrop-blur-sm"
                  placeholder="Start writing your note here..."
                  value={content}
                  onChange={e => setContent(e.target.value)}
                />
              </div>
              
              {/* Notification End Date Input - removed from here since it's moved below the Save with Notification button */}
              
              {/* Time Picker for Daily Notifications - removed from here since it's moved below the Save with Notification button */}

              <div className="flex flex-col gap-3 pt-4">
                {/* Selection indicator */}
                {selectedReminderType && (
                  <div className="text-xs sm:text-sm text-gray-600 flex items-center gap-2">
                    <div className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full ${selectedReminderType === 'hourly' ? 'bg-blue-500' : 'bg-purple-500'}`}></div>
                    Selected: {selectedReminderType === 'hourly' ? 'Hourly Reminder' : 'Daily Reminder'}
                  </div>
                )}
                
                {/* Buttons container - consistent layout for all buttons */}
                <div className="flex flex-col sm:flex-row gap-3">
                  {/* Save Note button - always visible */}
                  <Button 
                    onClick={() => handleSave(false)}
                    className="flex items-center gap-1 sm:gap-2 bg-green-600 hover:bg-green-700 text-white w-full sm:flex-1 px-3 py-1.5 sm:px-4 sm:py-2 text-sm sm:text-base"
                  >
                    <Save className="h-3 w-3 sm:h-4 sm:w-4" />
                    {noteId ? 'Update Note without Notification' : 'Save Note without Notification'}
                  </Button>
                  
                  {/* Notification buttons - shown consistently */}
                  <div className="flex flex-col gap-3 sm:flex-1">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="flex items-center gap-1 sm:gap-2 bg-blue-600 hover:bg-blue-700 text-white w-full px-3 py-1.5 sm:px-4 sm:py-2 text-sm sm:text-base"> 
                          {noteId ? 'Update Note with Notification' : 'Save Note with Notification'}
                          <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-48 sm:w-64">
                        <div className="p-2 text-xs sm:text-sm text-gray-500 border-b">Choose reminder frequency:</div>
                        <DropdownMenuItem 
                          onClick={() => {
                            setSelectedReminderType('hourly');
                          }}
                          className={`flex items-center gap-2 sm:gap-3 py-2 sm:py-3 ${selectedReminderType === 'hourly' ? 'bg-blue-50' : ''}`}
                        >
                          <div className="flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-blue-100 text-blue-600">
                            <Bell className="h-3 w-3 sm:h-4 sm:w-4" />
                          </div>
                          <div className="flex flex-col">
                            <span className="font-medium text-xs sm:text-sm">Hourly Reminder</span>
                            <span className="text-xs text-gray-500">Every hour</span>
                          </div>
                          {selectedReminderType === 'hourly' && (
                            <div className="ml-auto w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-blue-500 flex items-center justify-center">
                              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-white"></div>
                            </div>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => {
                            setSelectedReminderType('daily');
                          }}
                          className={`flex items-center gap-2 sm:gap-3 py-2 sm:py-3 ${selectedReminderType === 'daily' ? 'bg-purple-50' : ''}`}
                        >
                          <div className="flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-purple-100 text-purple-600">
                            <Bell className="h-3 w-3 sm:h-4 sm:w-4" />
                          </div>
                          <div className="flex flex-col">
                            <span className="font-medium text-xs sm:text-sm">Daily Reminder</span>
                            <span className="text-xs text-gray-500">Once per day</span>
                          </div>
                          {selectedReminderType === 'daily' && (
                            <div className="ml-auto w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-purple-500 flex items-center justify-center">
                              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-white"></div>
                            </div>
                          )}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>


                    
                    {/* Save with Hourly Notification button - only shown when hourly is selected */}
                    {selectedReminderType === 'hourly' && (
                      <div className="flex flex-col gap-3">
                        <Button 
                          onClick={() => handleSave(true, 'hourly')}
                          className="flex items-center gap-1 sm:gap-2 bg-blue-600 hover:bg-blue-700 text-white w-full px-3 py-1.5 sm:px-4 sm:py-2 text-sm sm:text-base"
                        >
                          <Bell className="h-3 w-3 sm:h-4 sm:w-4" />
                          Save with Hourly Notification
                        </Button>
                      </div>
                    )}

                    {/* Save with Daily Notification button - only shown when daily is selected */}
                    {selectedReminderType === 'daily' && (
                      <div className="flex flex-col gap-3">
                        <Button 
                          onClick={() => handleSave(true, 'daily')}
                          className="flex items-center gap-1 sm:gap-2 bg-purple-600 hover:bg-purple-700 text-white w-full px-3 py-1.5 sm:px-4 sm:py-2 text-sm sm:text-base"
                        >
                          <Bell className="h-3 w-3 sm:h-4 sm:w-4" />
                          Save with Daily Notification
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Notification End Date Input - moved below the Save with Notification button */}
                {selectedReminderType && (
                  <div className="space-y-2 mt-3">
                    <Label htmlFor="end-date" className="text-sm sm:text-base font-medium">
                      Notification End Date *
                    </Label>
                    <input
                      type="datetime-local"
                      id="end-date"
                      className="w-full p-2 sm:p-2.5 border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      value={notifyEndDate}
                      onChange={e => setNotifyEndDate(e.target.value)}
                      required
                    />
                    <p className="text-xs sm:text-sm text-gray-500">
                      Notifications will automatically stop after this date and time. This field is required when notifications are enabled.
                    </p>
                  </div>
                )}
                
                {/* Time picker for daily reminders - shown below the end date */}
                {selectedReminderType === 'daily' && (
                  <div className="space-y-2 mt-3">
                    <Label htmlFor="notify-time" className="text-sm sm:text-base font-medium">
                      Daily Reminder Time
                    </Label>
                    <input
                      type="time"
                      id="notify-time"
                      className="w-full p-2 sm:p-2.5 border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      value={notifyTime}
                      onChange={e => setNotifyTime(e.target.value)}
                    />
                    <p className="text-xs sm:text-sm text-gray-500">
                      Set the time for your daily notifications (24-hour format). Default is 9:00 AM.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}