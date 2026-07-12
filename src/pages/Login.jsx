import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Activity } from 'lucide-react';
import { useState } from 'react';
import { motion } from 'framer-motion';

export default function Login() {
  const { signInWithGoogle, currentUser } = useAuth();
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const navigate = useNavigate();

  // If already logged in, redirect to appropriate dashboard
  if (currentUser) {
    if (currentUser.role === 'Admin') {
      return <Navigate to="/admin/dashboard" replace />;
    } else {
      return <Navigate to="/employee/dashboard" replace />;
    }
  }

  const handleGoogleSignIn = async () => {
    try {
      setIsLoggingIn(true);
      const user = await signInWithGoogle();
      // the redirect will happen automatically because currentUser will change and the `if (currentUser)` block will trigger.
    } catch (error) {
      // Error is handled in context via toast
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-background">
      {/* Left Panel - Branding/Gradient */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between bg-zinc-950 p-12 overflow-hidden">
        {/* Absolute Gradients for SaaS glow effect */}
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-primary/40 rounded-full blur-3xl opacity-50 mix-blend-screen pointer-events-none"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-fuchsia-600/10 rounded-full blur-3xl opacity-50 mix-blend-screen pointer-events-none"></div>
        
        <div className="relative z-10">
          <div className="flex items-center text-white space-x-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg">
              <Activity className="w-6 h-6" />
            </div>
            <span className="text-2xl font-bold tracking-tight">AssetFlow</span>
          </div>
        </div>
        
        <div className="relative z-10 max-w-lg">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight mb-6 leading-tight">
            Manage your global assets with precision.
          </h1>
          <p className="text-lg text-zinc-400 font-medium">
            The modern, lightning-fast platform designed to track, allocate, and maintain enterprise resources seamlessly.
          </p>
        </div>
        
        <div className="relative z-10 text-sm font-medium text-zinc-500">
          © 2026 AssetFlow Inc. All rights reserved.
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-8 sm:p-12 relative bg-background">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="lg:hidden flex items-center justify-center text-foreground space-x-3 mb-10">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-md">
              <Activity className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold tracking-tight">AssetFlow</span>
          </div>

          <div className="text-center mb-10">
            <h2 className="text-3xl font-extrabold text-foreground tracking-tight">
              Welcome back
            </h2>
            <p className="text-muted-foreground mt-3 font-medium">
              Sign in to your enterprise account to continue.
            </p>
          </div>

          <div className="glass-card rounded-2xl p-8 border border-border">
            <button
              onClick={handleGoogleSignIn}
              disabled={isLoggingIn}
              className="w-full flex justify-center items-center py-3 px-4 rounded-xl shadow-sm bg-background border border-border text-sm font-semibold text-foreground hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              {isLoggingIn ? (
                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin mr-3"></div>
              ) : (
                <svg className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
              )}
              {isLoggingIn ? 'Signing in...' : 'Continue with Google'}
            </button>
            
            <div className="mt-8 flex items-center justify-center">
              <div className="h-px bg-border flex-1"></div>
              <span className="px-4 text-xs text-muted-foreground font-medium uppercase tracking-wider">Enterprise SSO</span>
              <div className="h-px bg-border flex-1"></div>
            </div>
            
            <button
              disabled
              className="mt-6 w-full flex justify-center items-center py-3 px-4 rounded-xl border border-transparent bg-muted text-sm font-semibold text-muted-foreground cursor-not-allowed"
            >
              Sign in with SAML (Coming Soon)
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
