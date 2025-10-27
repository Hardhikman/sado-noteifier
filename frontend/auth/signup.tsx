import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabase';
import { Button } from '@/components/retroui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/retroui/Card';
import { FcGoogle } from 'react-icons/fc';

export default function SignUpForm() {
  const router = useRouter();

  async function handleGoogleSignUp() {
    console.log('SignUpForm: Initiating Google sign up');
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`
      }
    });
    
    if (error) {
      console.error('Google Sign-Up Error:', error);
      alert(error.message);
    } else {
      console.log('SignUpForm: Google sign up initiated successfully');
    }
  }

  // Listen for auth state changes
  useEffect(() => {
    console.log('SignUpForm: Setting up auth listener');
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('SignUpForm: Auth state changed:', event, session?.user?.id);
      if (event === 'SIGNED_IN') {
        console.log('SignUpForm: User signed in, redirecting to home');
        router.push('/');
      }
    });

    return () => {
      console.log('SignUpForm: Cleaning up auth listener');
      authListener.subscription.unsubscribe();
    };
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center p-3 sm:p-4 relative overflow-hidden">
      <Card className="w-auto max-w-md bg-white/80 backdrop-blur-sm border border-white/30 shadow-lg relative z-10 mx-auto">
        <CardHeader className="text-center px-4 sm:px-6 py-4 sm:py-6">
          <CardTitle className="text-xl sm:text-2xl font-bold">Create SaDo Account</CardTitle>
          <CardDescription className="text-sm sm:text-base mt-2">
            Get started with SaDo AI Noteifier
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-6 px-4 sm:px-6 py-4 sm:py-6">
          {/* Google Sign Up Button */}
          <Button 
            className="flex items-center justify-center gap-2 bg-[#efa3a0] hover:bg-[#e89290] text-white py-2 sm:py-2.5 px-4 sm:px-6 mx-auto"
            variant="default"
            onClick={handleGoogleSignUp}
          >
            <FcGoogle className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="text-sm sm:text-base">Continue with Google</span>
          </Button>
          
          <div className="text-center text-xs sm:text-sm text-gray-500">
            Already have an account? <a href="/signin" className="text-blue-600 hover:underline">Sign In</a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}