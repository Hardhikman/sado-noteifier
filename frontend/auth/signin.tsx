import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabase';
import { Button } from '@/components/retroui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/retroui/Card';
import { FcGoogle } from 'react-icons/fc';

export default function SignInForm() {
  const router = useRouter();

  async function handleGoogleSignIn() {
    console.log('SignInForm: Initiating Google sign in');
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`,
      }
    });
    
    if (error) {
      console.error('Google Sign-In Error:', error);
      alert(error.message);
    } else {
      console.log('SignInForm: Google sign in initiated successfully');
    }
  }

  // Listen for auth state changes
  useEffect(() => {
    console.log('SignInForm: Setting up auth listener');
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('SignInForm: Auth state changed:', event, session?.user?.id);
      if (event === 'SIGNED_IN') {
        console.log('SignInForm: User signed in, redirecting to home');
        router.push('/');
      }
    });

    return () => {
      console.log('SignInForm: Cleaning up auth listener');
      authListener.subscription.unsubscribe();
    };
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center p-3 sm:p-4 relative overflow-hidden">
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
      <Card className="w-full max-w-md bg-white/80 backdrop-blur-sm border border-white/30 shadow-lg relative z-10">
        <CardHeader className="text-center px-4 sm:px-6 py-4 sm:py-6">
          <CardTitle className="text-xl sm:text-2xl font-bold">Welcome to SaDo AI Note</CardTitle>
          <CardDescription className="text-sm sm:text-base mt-2">
            Sign in to your account to access your notes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-6 px-4 sm:px-6 py-4 sm:py-6">
          <div className="text-center">
            <p className="text-gray-600 text-sm sm:text-base mb-4 sm:mb-6">
              Create, notify , and manage your notes with ease
            </p>
          </div>
          
          {/* Google Sign In Button */}
          <Button 
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2.5 sm:py-3" 
            variant="default"
            onClick={handleGoogleSignIn}
          >
            <FcGoogle className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="text-sm sm:text-base">Continue with Google</span>
          </Button>
          
          <div className="text-center text-xs sm:text-sm text-gray-500 mt-4 sm:mt-6">
            By signing in, you agree to our Terms of Service and Privacy Policy
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
