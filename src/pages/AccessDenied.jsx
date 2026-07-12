import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

export default function AccessDenied() {
  const { currentUser } = useAuth();
  
  const returnPath = currentUser?.role === 'Admin' ? '/admin/dashboard' : '/employee/dashboard';

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full text-center space-y-6"
      >
        <div className="w-24 h-24 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-destructive/20 shadow-soft">
          <ShieldAlert className="w-12 h-12 text-destructive" />
        </div>
        
        <h1 className="text-4xl font-extrabold text-foreground tracking-tight">Access Denied</h1>
        
        <p className="text-muted-foreground font-medium text-lg">
          You do not have permission to view this page. This area is restricted to administrators.
        </p>
        
        <div className="pt-8">
          <Link 
            to={returnPath}
            className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold shadow-sm hover:bg-primary/90 transition-all hover:-translate-y-0.5"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Return to Dashboard
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
