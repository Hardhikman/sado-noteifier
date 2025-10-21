import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext<any>(null);

export function AuthProvider({ children }: any) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('AuthProvider: Initializing session');
    
    // Get initial session with a timeout to prevent hanging
    const initSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        console.log('AuthProvider: Got session result', { session: session?.user?.id, error });
        
        if (error) {
          console.error('AuthProvider: Error getting session', error);
        }
        
        setUser(session?.user ?? null);
        setLoading(false);
      } catch (err) {
        console.error('AuthProvider: Exception getting session', err);
        setUser(null);
        setLoading(false);
      }
    };

    initSession();

    // Listen for auth state changes
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('AuthProvider: Auth state changed:', _event, session?.user?.id);
      setUser(session?.user ?? null);
      if (loading) {
        setLoading(false);
      }
    });

    // Fallback timeout to ensure loading state resolves
    const timeout = setTimeout(() => {
      if (loading) {
        console.log('AuthProvider: Forcing loading to false after timeout');
        setLoading(false);
      }
    }, 3000);

    return () => {
      listener.subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  console.log('AuthProvider: Rendering with', { user: user?.id, loading });
  
  return (
    <AuthContext.Provider value={{ user, signOut, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);