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

  const handleGoogleSignIn = async (role) => {
    try {
      setIsLoggingIn(true);
      await signInWithGoogle(role);
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
              <div className="space-y-4">
                <button
                  onClick={() => handleGoogleSignIn('Admin')}
                  disabled={isLoggingIn}
                  className="w-full flex justify-center items-center py-3 px-4 rounded-xl shadow-sm bg-primary/10 border border-primary/20 text-sm font-semibold text-primary hover:bg-primary/20 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all disabled:opacity-50 group"
                >
                  <span className="text-xl mr-3">👑</span>
                  {isLoggingIn ? 'Signing in...' : 'Admin Login'}
                </button>

                <button
                  onClick={() => handleGoogleSignIn('Employee')}
                  disabled={isLoggingIn}
                  className="w-full flex justify-center items-center py-3 px-4 rounded-xl shadow-sm bg-muted border border-border text-sm font-semibold text-foreground hover:bg-muted/80 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all disabled:opacity-50 group"
                >
                  <span className="text-xl mr-3">👤</span>
                  {isLoggingIn ? 'Signing in...' : 'Employee Login'}
                </button>
              </div>
            
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
