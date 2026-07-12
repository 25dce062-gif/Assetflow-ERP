import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  ArrowRightLeft, 
  RotateCcw, 
  Wrench, 
  ClipboardList,
  Activity
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const navItems = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { name: 'Directory', href: '/admin/assets', icon: Package },
  { name: 'Allocations', href: '/admin/allocations', icon: ClipboardList },
  { name: 'Transfers', href: '/admin/transfers', icon: ArrowRightLeft },
  { name: 'Returns', href: '/admin/returns', icon: RotateCcw },
  { name: 'Maintenance', href: '/admin/maintenance', icon: Wrench },
];

export default function Sidebar({ isCollapsed }) {
  const { currentUser } = useAuth();
  
  return (
    <motion.div 
      initial={false}
      animate={{ width: isCollapsed ? 80 : 260 }}
      className="flex flex-col h-screen bg-background border-r border-border shrink-0 z-20 sticky top-0"
    >
      {/* Brand Header */}
      <div className="flex h-16 items-center px-4 border-b border-border">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-primary-foreground shrink-0">
          <Activity className="w-5 h-5" />
        </div>
        {!isCollapsed && (
          <motion.span 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="ml-3 text-lg font-bold tracking-tight text-foreground whitespace-nowrap"
          >
            AssetFlow
          </motion.span>
        )}
      </div>
      
      {/* Navigation */}
      <div className="flex-1 py-6 px-3 overflow-y-auto">
        <nav className="space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              title={isCollapsed ? item.name : undefined}
              className={({ isActive }) =>
                cn(
                  'group flex items-center p-2.5 rounded-lg transition-all duration-200 cursor-pointer font-medium text-sm',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  isCollapsed ? 'justify-center' : ''
                )
              }
            >
              <item.icon 
                className={cn(
                  "flex-shrink-0 transition-colors",
                  isCollapsed ? "w-5 h-5" : "w-4 h-4 mr-3"
                )} 
                aria-hidden="true" 
              />
              {!isCollapsed && (
                <span className="whitespace-nowrap">{item.name}</span>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* User Footer */}
      <div className="p-4 border-t border-border">
        <div className={cn("flex items-center", isCollapsed ? "justify-center" : "")}>
          {currentUser?.photoURL ? (
            <img src={currentUser.photoURL} alt="Profile" className="w-9 h-9 rounded-full ring-2 ring-background object-cover shrink-0" />
          ) : (
            <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold shrink-0 ring-2 ring-background">
              {currentUser?.displayName?.charAt(0) || 'U'}
            </div>
          )}
          {!isCollapsed && (
            <div className="ml-3 overflow-hidden">
              <p className="text-sm font-medium text-foreground truncate">{currentUser?.displayName || 'User'}</p>
              <p className="text-xs text-primary font-bold uppercase tracking-wider truncate">Admin</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
