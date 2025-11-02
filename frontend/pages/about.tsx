import { useRouter } from 'next/router';
import { Button } from "@/components/retroui/Button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/retroui/Card"
import { ArrowLeft } from 'lucide-react';

export default function AboutPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen relative overflow-hidden">
      <header className="header fixed top-0 left-0 right-0 h-4 sm:h-6 bg-[#8b597b] shadow-sm backdrop-blur-sm border-b border-white/20 z-50">
      </header>
      
      <div className="max-w-4xl mx-auto p-3 sm:p-4 md:p-6 mt-16 relative z-10">
        {/* Simplified header with just back button */}
        <div className="flex items-center justify-between p-2 sm:p-3 mb-6">
          <div className="header-left">
            <button
              onClick={() => router.push('/')}
              className="flex items-center gap-2 text-[#8b597b] hover:text-[#7a4a6b] transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="text-sm">Back to Home</span>
            </button>
          </div>
          <div className="header-center">
            {/* Empty space where logo was */}
          </div>
          <div className="header-right">
            {/* Empty space where About button was */}
          </div>
        </div>
        
        <Card className="w-full shadow-lg bg-white/80 backdrop-blur-sm border border-white/30">
          <CardHeader>
            <CardTitle className="text-2xl sm:text-3xl font-bold text-center">
              {/* Logo with "About" text beside it */}
              <div className="flex items-center justify-center gap-4">
                <span className="text-2xl sm:text-3xl font-bold" style={{ fontFamily: "'Playwrite GB S', cursive" }}>
                  About
                </span>
                <div className="logo-container">
                  <img 
                    src="/sado_logo.png" 
                    alt="SaDo Logo" 
                    className="logo-image"
                  />
                </div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="prose max-w-none">
              <h2 className="text-xl font-semibold text-[#8b597b]">What is SaDO Noteifier</h2>
              <p className="text-gray-700">
                SaDO Noteifier is a smart note-taking and productivity web app that helps you capture ideas, organize thoughts, and stay on top of reminders effortlessly. It combines the simplicity of note-taking with the power of AI, enabling users to summarize long notes, set intelligent reminders, and receive timely notifications-all in one seamless experience.
              </p>
              
              <h2 className="text-xl font-semibold text-[#8b597b] mt-6">Key Objectives</h2>
              <ul className="list-disc pl-5 space-y-2 text-gray-700">
                <li>Simplify the way users take and manage notes.</li>
                <li>Integrate AI summarization for faster understanding of written content.</li>
                <li>Provide smart, flexible reminder notifications to boost productivity.</li>
                <li>Offer a secure and accessible platform through Google authentication.</li>
                <li>Deliver a smooth, responsive, and installable experience with PWA support.</li>
              </ul>
              
              <h2 className="text-xl font-semibold text-[#8b597b] mt-6">How It Works</h2>
              <ul className="list-disc pl-5 space-y-2 text-gray-700">
                <li><strong>Sign In Securely</strong> - Users log in using Google authentication via Supabase.</li>
                <li><strong>Create and Manage Notes</strong> - Add, edit, and delete notes stored securely in the cloud.</li>
                <li><strong>Summarize with AI</strong> - Instantly generate concise summaries using Google Gemini.</li>
                <li><strong>Set Smart Reminders</strong> - Schedule notifications (hourly/daily) with defined end dates.</li>
                <li><strong>Receive Push Alerts</strong> - Get browser notifications powered by Firebase Cloud Messaging (FCM).</li>
                <li><strong>Access Anywhere</strong> - Thanks to PWA support, it can be installed like a native app.</li>
              </ul>
              
              <h2 className="text-xl font-semibold text-[#8b597b] mt-6">Target Audience</h2>
              <ul className="list-disc pl-5 space-y-2 text-gray-700">
                <li>Students who want to take simple one sentence note and stay organized with reminder.</li>
                <li>Working professionals managing daily tasks, meeting notes, or quick reminders.</li>
                <li>Creators and thinkers who prefer jotting down spontaneous ideas with structure.</li>
                <li>Anyone seeking a simple, intelligent note app that works across devices.</li>
              </ul>
              
              <h2 className="text-xl font-semibold text-[#8b597b] mt-6">Unique Features</h2>
              <ul className="list-disc pl-5 space-y-2 text-gray-700">
                <li><strong>AI-Powered Summarization:</strong> Generates instant summaries using Google Gemini.</li>
                <li><strong>Smart Notifications:</strong> Hourly or daily reminders with customizable end dates.</li>
                <li><strong>Cloud Sync & Security:</strong> Data stored securely with Supabase backend.</li>
                <li><strong>Push Notifications:</strong> Real-time updates through FCM.</li>
                <li><strong>Responsive & Installable:</strong> Built with Tailwind CSS and PWA for a native-like experience.</li>
                <li><strong>Seamless Auth:</strong> One-click Google login for easy access and sync.</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}