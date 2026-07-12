import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Package, RotateCcw, Box, User, Activity, LogOut } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const navItems = [
  { icon: <LayoutDashboard size={20} />, label: 'My Dashboard', path: '/employee/dashboard' },
  { icon: <Package size={20} />, label: 'My Assets', path: '/employee/assets' },
  { icon: <Box size={20} />, label: 'Request Asset', path: '/employee/request' },
  { icon: <RotateCcw size={20} />, label: 'Return Asset', path: '/employee/return' },
];

export default function EmployeeSidebar({ isCollapsed }) {
  const location = useLocation();
  const { logout, currentUser } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      toast.error('Failed to log out');
    }
  };

  return (
    <motion.aside 
      animate={{ width: isCollapsed ? 80 : 280 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="h-full bg-card border-r border-border flex flex-col relative z-20 shadow-soft shrink-0"
    >
      <div className="h-16 flex items-center px-4 border-b border-border">
        <div className="flex items-center space-x-3 overflow-hidden whitespace-nowrap text-primary">
          <Activity size={28} className="shrink-0" />
          {!isCollapsed && <span className="text-xl font-bold tracking-tight text-foreground">AssetFlow<span className="text-primary">Emp</span></span>}
        </div>
      </div>

      <nav className="flex-1 py-6 px-3 space-y-1.5 overflow-y-auto custom-scrollbar">
        {navItems.map((item) => {
          const isActive = location.pathname.includes(item.path);
          return (
            <Link
              key={item.label}
              to={item.path}
              className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${
                isActive 
                  ? 'bg-primary text-primary-foreground shadow-sm' 
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <div className={isActive ? 'text-primary-foreground' : 'text-muted-foreground group-hover:text-primary transition-colors'}>
                {item.icon}
              </div>
              {!isCollapsed && <span className="font-medium whitespace-nowrap">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border">
        {!isCollapsed && (
          <div className="mb-4 flex items-center space-x-3 overflow-hidden">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
              <User size={20} className="text-primary" />
            </div>
            <div className="whitespace-nowrap overflow-hidden">
              <p className="text-sm font-semibold text-foreground truncate">{currentUser?.name || 'Employee'}</p>
              <p className="text-xs text-muted-foreground font-medium truncate">{currentUser?.department || 'Staff'}</p>
            </div>
          </div>
        )}
        <button 
          onClick={handleLogout}
          className={`flex items-center text-sm font-medium text-muted-foreground hover:text-destructive transition-colors w-full ${isCollapsed ? 'justify-center' : 'space-x-3 px-2 py-2 rounded-lg hover:bg-destructive/10'}`}
          title="Logout"
        >
          <LogOut size={20} />
          {!isCollapsed && <span>Logout</span>}
        </button>
      </div>
    </motion.aside>
  );
}
