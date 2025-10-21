import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Button } from "@/components/retroui/Button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/retroui/Card"
import { useAuth } from '../hooks/useAuth';
import { fetchNotesForUser, deleteNote } from '../lib/api';
import { Bell, Plus, LogOut, PlusCircle } from 'lucide-react';

export default function HomePage() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const [notes, setNotes] = useState<any[]>([]);

  // Debug logging
  useEffect(() => {
    console.log('HomePage auth state:', { user, loading });
  }, [user, loading]);

  useEffect(() => {
    if (user) {
      console.log('Fetching notes for user:', user.id);
      fetchNotesForUser().then(setNotes).catch(error => {
        console.error('Error fetching notes:', error);
      });
    }
  }, [user]);

  // Redirect to signin if not loading and no user
  useEffect(() => {
    console.log('Checking redirect condition:', { loading, user });
    if (!loading && !user) {
      console.log('Redirecting to signin');
      router.push('/signin');
    }
  }, [user, loading, router]);

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your notes...</p>
        </div>
      </div>
    );
  }

  // If no user, redirect will happen above
  if (!user) {
    return null;
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
          className="brand text-xl font-bold text-gray-800 cursor-pointer hover:text-blue-600 transition-colors relative z-10"
          onClick={() => router.push('/')}
        >
          SaDo Noteifier
        </div>
        <div className="header-right flex items-center gap-2 sm:gap-4 relative z-10">
          <span className="text-sm sm:text-base text-gray-600 relative z-10 truncate max-w-[120px] sm:max-w-none">{user?.email}</span>
          <Button onClick={signOut} variant="outline" className="flex items-center gap-1 sm:gap-2 bg-gray-600 hover:bg-gray-700 text-white relative z-10 px-2 py-1 sm:px-4 sm:py-2">
            <LogOut className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden xs:inline">Logout</span>
          </Button>
        </div>
      </header>
      <main className="container mx-auto px-4 py-6">
        {(!notes || notes.length === 0) ? (
          <div className="blank-state flex items-center justify-center min-h-[60vh] relative z-10" onClick={() => router.push('/editor')}>
            {/* Soft Green Glow */}
            <div
              className="absolute inset-0 z-0 rounded-lg"
              style={{
                backgroundImage: `
                  radial-gradient(circle at center, #8FFFB0, transparent)
                `,
              }}
            />
            <Card className="max-w-md mx-auto text-center py-8 sm:py-12 hover:shadow-lg transition-shadow cursor-pointer relative z-10 bg-white/70 border border-white/50 shadow-lg rounded-lg overflow-hidden w-full sm:w-auto">
              <div className="absolute inset-0 bg-white/30 z-0"></div>
              <CardContent className="relative z-10">
                <PlusCircle className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-blue-400" />
                <h3 className="mt-2 text-sm sm:text-base font-medium text-blue-800">No notes yet</h3>
                <p className="mt-1 text-xs sm:text-sm text-blue-600 px-2">
                  Get started by creating a new note.
                </p>
                <div className="mt-4 sm:mt-6 flex justify-center">
                  <Button className="bg-blue-500 hover:bg-blue-600 relative z-10 px-3 py-1.5 sm:px-4 sm:py-2">
                    <Plus className="mr-1 h-3 w-3 sm:mr-2 sm:h-4 sm:w-4" />
                    <span className="text-sm sm:text-base">New Note</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800 border-b-2 border-blue-500 pb-1 sm:pb-2 w-full sm:w-auto">Your Notes</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {notes.map(note => (
                <div key={note.id} className="relative">
                  {/* Soft Green Glow */}
                  <div
                    className="absolute inset-0 z-0 rounded-lg"
                    style={{
                      backgroundImage: `
                        radial-gradient(circle at center, #8FFFB0, transparent)
                      `,
                    }}
                  />
                  <Card className="card hover:shadow-xl transition-all duration-300 relative z-10 bg-white/70 border border-white/50 shadow-lg hover:shadow-xl rounded-lg overflow-hidden h-full flex flex-col">
                    <div className="absolute inset-0 bg-white/30 z-0"></div>
                    <CardHeader className="relative z-10">
                      <div className="flex items-start gap-2">
                        <div className="w-1 h-4 mt-1 bg-blue-500 rounded-full"></div>
                        <CardTitle className="text-base sm:text-lg font-bold text-gray-800 line-clamp-2">{note.title}</CardTitle>
                      </div>
                      {note.summary && (
                        <div className="mt-2 sm:mt-3">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-xs font-semibold text-green-600 uppercase tracking-wide">Reminder</span>
                          </div>
                          <CardDescription className="text-xs sm:text-sm text-gray-600 bg-green-50/50 p-2 rounded">
                            {note.summary}
                          </CardDescription>
                        </div>
                      )}
                    </CardHeader>
                    <CardContent className="relative z-10 flex-grow">
                      <div className="mb-2 sm:mb-3">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                          <span className="text-xs font-semibold text-purple-600 uppercase tracking-wide">Note</span>
                        </div>
                        <p className="text-xs sm:text-sm text-gray-700 bg-purple-50/50 p-2 rounded">
                          {note.content}
                        </p>
                      </div>
                      {note.notify && (
                        <div className="flex items-center gap-1 sm:gap-2 text-xs text-blue-600 mb-2 sm:mb-3">
                          <Bell className="h-3 w-3" />
                          <span>Notify: {note.notify_type || 'daily'}</span>
                        </div>
                      )}
                      {note.created_at && (
                        <div className="text-xs text-gray-500 mb-3 sm:mb-4">
                          Created: {new Date(note.created_at).toLocaleDateString()}
                        </div>
                      )}
                      <div className="card-toolbar flex flex-col sm:flex-row gap-2">
                        <Button 
                          onClick={() => router.push(`/editor?id=${note.id}`)} 
                          variant="outline" 
                          size="sm"
                          className="border-blue-500 text-blue-600 hover:bg-blue-50 w-full sm:w-auto"
                        >
                          Edit
                        </Button>
                        <Button 
                          onClick={async () => {
                            try {
                              await deleteNote(note.id);
                              setNotes(n => n.filter(x => x.id !== note.id));
                            } catch (error) {
                              console.error('Error deleting note:', error);
                              alert('Failed to delete note. Please try again.');
                            }
                          }} 
                          variant="destructive" 
                          size="sm"
                          className="border-red-500 text-red-600 hover:bg-red-50 bg-white w-full sm:w-auto"
                        >
                          Delete
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
            {/* Large + button at bottom right corner */}
            <button
              onClick={() => router.push('/editor')}
              className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gray-600 hover:bg-gray-700 text-white flex items-center justify-center shadow-lg z-20 transition-all duration-300 hover:scale-110"
            >
              <Plus className="h-5 w-5 sm:h-8 sm:w-8" />
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
