import { Bell, Search, Menu, Settings, LogOut, Sun, Moon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useState, useEffect } from 'react';

export default function TopNavbar({ toggleSidebar, isSidebarCollapsed }) {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Check initial preference
    if (document.documentElement.classList.contains('dark')) {
      setIsDark(true);
    }
  }, []);

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove('dark');
      setIsDark(false);
    } else {
      document.documentElement.classList.add('dark');
      setIsDark(true);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
      navigate('/login');
    } catch (error) {
      toast.error('Failed to log out');
    }
  };

  return (
    <header className="h-16 bg-background/80 backdrop-blur-md border-b border-border flex items-center justify-between px-6 sticky top-0 z-10 shrink-0">
      <div className="flex items-center flex-1 space-x-4">
        <button 
          onClick={toggleSidebar}
          className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          <Menu className="h-5 w-5" />
        </button>
        
        <div className="relative w-full max-w-md hidden md:block group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          </div>
          <input
            type="text"
            className="block w-full pl-9 pr-4 py-2 text-sm border border-input rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
            placeholder="Search assets, locations, or people..."
          />
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <kbd className="hidden sm:inline-block font-sans text-[10px] font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded border border-border">⌘K</kbd>
          </div>
        </div>
      </div>
      
      <div className="flex items-center space-x-2">
        <button 
          onClick={toggleTheme}
          className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors" 
          title="Toggle Theme"
        >
          {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
        <button className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors hidden sm:block">
          <Settings className="h-4 w-4" />
        </button>
        <button className="p-2 relative rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
          <Bell className="h-4 w-4" />
          <span className="absolute top-1.5 right-1.5 block h-2 w-2 rounded-full bg-destructive ring-2 ring-background"></span>
        </button>
        <div className="h-6 w-px bg-border mx-2"></div>
        <button 
          onClick={handleLogout}
          className="flex items-center p-1 pr-3 rounded-lg hover:bg-muted transition-colors group"
          title="Logout"
        >
          {currentUser?.photoURL ? (
            <img src={currentUser.photoURL} alt="Profile" className="w-7 h-7 rounded-full object-cover mr-2 ring-1 ring-border" />
          ) : (
            <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold mr-2 text-xs">
              {currentUser?.displayName?.charAt(0) || 'U'}
            </div>
          )}
          <span className="text-sm font-medium text-foreground hidden sm:block group-hover:text-destructive transition-colors">
            Logout
          </span>
          <LogOut className="w-4 h-4 ml-2 text-muted-foreground group-hover:text-destructive hidden sm:block transition-colors" />
        </button>
      </div>
    </header>
  );
}
