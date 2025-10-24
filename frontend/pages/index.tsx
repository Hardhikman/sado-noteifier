import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Button } from "@/components/retroui/Button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/retroui/Card"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/retroui/DropdownMenu"
import { useAuth } from '../hooks/useAuth';
import { fetchNotesForUser, deleteNote } from '../lib/api';
import { Bell, Plus, LogOut, PlusCircle, User, ChevronDown, ArrowUpDown } from 'lucide-react';

export default function HomePage() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const [notes, setNotes] = useState<any[]>([]);
  const [sortBy, setSortBy] = useState<'created' | 'modified'>('created');

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
      <header className="header fixed top-0 left-0 right-0 h-4 sm:h-6 bg-[#8b597b] shadow-sm backdrop-blur-sm border-b border-white/20 z-50">
      </header>
      <main className="container mx-auto px-4 py-6 mt-16">
        {/* Profile, brand, and logout section below header */}
        <div className="flex items-center justify-between p-2 sm:p-3 mb-6">
          <div className="header-left flex items-center gap-2 sm:gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button 
                  className="text-black relative z-10 cursor-pointer hover:opacity-80 transition-opacity"
                  title="Profile"
                  style={{ fontFamily: "'Playwrite GB S', cursive", fontSize: '1rem' }}
                >
                  <span className="font-bold">PROFILE</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-50 mt-1 z-5 bg-[#efa3a0]" align="start">
                <DropdownMenuLabel className="text-white">{user?.email}</DropdownMenuLabel>
                <DropdownMenuSeparator />
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div 
            className="brand text-xl sm:text-2xl font-bold text-gray-800 cursor-pointer transition-colors"
            onClick={() => router.push('/')}
            style={{ fontFamily: "'Playwrite GB S', cursive" }}
          >
            SaDo Noteifier
          </div>
          <div className="header-right">
            <Button 
              variant="outline" 
              className="flex items-center justify-center bg-[#efa3a0] hover:bg-[#e89290] text-white relative z-10 w-8 h-8 sm:w-10 sm:h-10 p-0 rounded-full"
              onClick={signOut}
              title="Logout"
            >
              <LogOut className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
          </div>
        </div>
        {(!notes || notes.length === 0) ? (
          <div className="blank-state flex flex-col items-center justify-center min-h-[60vh] relative z-10 cursor-pointer" onClick={() => router.push('/editor')}>
            <PlusCircle className="mx-auto h-8 w-8 sm:h-10 sm:w-10 text-[#575a27]" />
            <h3 className="mt-3 text-lg sm:text-xl font-bold bg-gradient-to-r from-[#575a27] via-[#8a8e3b] to-[#575a27] bg-clip-text text-transparent animate-pulse">
              New Note. New Start
            </h3>
            <p className="mt-1 text-xs sm:text-sm text-blue-600 px-2">
              &nbsp;
            </p>
          </div>
        ) : (
          <div>
            {/* Sort button with icon only */}
            <div className="flex justify-end mb-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2 bg-[#efa3a0] text-white hover:bg-[#e89290] p-2">
                    <ArrowUpDown className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 bg-white text-gray-800 border border-gray-200">
                  <DropdownMenuItem 
                    onClick={() => setSortBy('created')}
                    className={`py-2 cursor-pointer ${sortBy === 'created' ? 'bg-[#efa3a0]/20' : 'hover:bg-gray-100'}`}
                  >
                    Date Created
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => setSortBy('modified')}
                    className={`py-2 cursor-pointer ${sortBy === 'modified' ? 'bg-[#efa3a0]/20' : 'hover:bg-gray-100'}`}
                  >
                    Date Modified
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {notes
                .sort((a, b) => {
                  // Sort by selected criteria in descending order (newest first)
                  if (sortBy === 'created') {
                    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
                  } else {
                    // Use updated_at field for modified date sorting
                    return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
                  }
                })
                .map(note => (
                <div key={note.id} className="relative">
                  <Card className="card hover:shadow-xl transition-all duration-300 relative z-10 bg-[#575a27] border border-white/50 shadow-lg hover:shadow-xl rounded-lg overflow-hidden h-full flex flex-col">
                    <div className="absolute inset-0 bg-white/30 z-0"></div>
                    <CardHeader className="relative z-10">
                      <div className="flex items-start gap-2">
                        <div className="w-1 h-4 mt-1 bg-blue-500 rounded-full"></div>
                        <CardTitle className="text-base sm:text-lg font-bold text-white line-clamp-2">{note.title}</CardTitle>
                        {/* Edit and Delete icons in top right corner */}
                        <div className="absolute top-2 right-2 flex gap-1">
                          <button
                            onClick={() => router.push(`/editor?id=${note.id}`)}
                            className="p-1 rounded-full hover:bg-[#f3f2df]/20 transition-colors"
                            title="Edit note"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#f3f2df]" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                            </svg>
                          </button>
                          <button
                            onClick={async () => {
                              try {
                                await deleteNote(note.id);
                                setNotes(n => n.filter(x => x.id !== note.id));
                              } catch (error) {
                                console.error('Error deleting note:', error);
                                alert('Failed to delete note. Please try again.');
                              }
                            }}
                            className="p-1 rounded-full hover:bg-[#f3f2df]/20 transition-colors"
                            title="Delete note"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#f3f2df]" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="relative z-10 flex-grow">
                      <div className="mb-2 sm:mb-3">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                          <span className="text-xs font-semibold text-purple-200 uppercase tracking-wide">Note</span>
                        </div>
                        <p className="text-xs sm:text-sm text-white bg-purple-900/50 p-2 rounded">
                          {note.content}
                        </p>
                      </div>
                      {note.summary && (
                        <div className="mt-2 sm:mt-3">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-xs font-semibold text-green-200 uppercase tracking-wide">Reminder</span>
                          </div>
                          <CardDescription className="text-xs sm:text-sm text-white bg-green-900/50 p-2 rounded">
                            {note.summary}
                          </CardDescription>
                        </div>
                      )}
                      {note.notify && (
                        <div className="flex items-center gap-1 sm:gap-2 text-xs text-blue-200 mb-2 sm:mb-3">
                          <Bell className="h-3 w-3 text-[#f3f2df]" />
                          <span>Notify: {note.notify_type || 'daily'}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
            {/* Large + button at bottom right corner */}
            <button
              onClick={() => router.push('/editor')}
              className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#efa3a0] hover:bg-[#e89290] text-white flex items-center justify-center shadow-md z-20 transition-colors duration-200"
            >
              <Plus className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
