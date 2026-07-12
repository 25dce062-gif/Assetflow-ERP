import { Bell, Search, Menu, Settings, LogOut, Sun, Moon, CheckCircle2, AlertTriangle, MessageSquare, Trash2, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useState, useEffect, useRef } from 'react';
import { localStorageDB } from '../../services/localStorageDB';

export default function TopNavbar({ toggleSidebar, isSidebarCollapsed }) {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [isDark, setIsDark] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef(null);

  useEffect(() => {
    // Check initial preference
    if (document.documentElement.classList.contains('dark')) {
      setIsDark(true);
    }

    const unsub = localStorageDB.subscribe('notifications', (data) => {
      // Filter for current user or generic based on role
      const isManagerOrAdmin = ['Admin', 'Asset Manager'].includes(currentUser?.role);
      const userNotifs = data.filter(n => 
        n.targetUid === currentUser?.uid || 
        (isManagerOrAdmin && n.targetUid === 'Admin')
      );
      setNotifications(userNotifs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
    });

    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      unsub();
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [currentUser]);

  const handleMarkAsRead = async (id) => {
    try {
      await localStorageDB.update('notifications', id, { read: true });
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteNotification = async (id) => {
    try {
      await localStorageDB.delete('notifications', id);
    } catch (e) {
      console.error(e);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const unread = notifications.filter(n => !n.read);
      for (const notif of unread) {
        await localStorageDB.update('notifications', notif.id, { read: true });
      }
    } catch (e) {
      console.error(e);
    }
  };

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
        
        <div className="relative" ref={notificationRef}>
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 relative rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <Bell className="h-4 w-4" />
            {notifications.filter(n => !n.read).length > 0 && (
              <span className="absolute top-1.5 right-1.5 block h-2 w-2 rounded-full bg-destructive ring-2 ring-background"></span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-card border border-border rounded-xl shadow-lg z-50 overflow-hidden flex flex-col max-h-[400px]">
              <div className="p-3 border-b border-border bg-muted/30 flex justify-between items-center">
                <h3 className="font-semibold text-sm text-foreground flex items-center">
                  Notifications
                  {notifications.filter(n => !n.read).length > 0 && (
                    <span className="ml-2 text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-bold">
                      {notifications.filter(n => !n.read).length} New
                    </span>
                  )}
                </h3>
                {notifications.filter(n => !n.read).length > 0 && (
                  <button 
                    onClick={handleMarkAllAsRead}
                    className="text-xs text-primary hover:underline font-medium"
                  >
                    Mark all read
                  </button>
                )}
              </div>
              <div className="overflow-y-auto flex-1">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-muted-foreground text-sm">
                    No new notifications.
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {notifications.map((n) => (
                      <div key={n.id} className={`p-3 hover:bg-muted/30 transition-colors flex gap-3 relative group ${!n.read ? 'bg-primary/5' : ''}`}>
                        <div className={`mt-0.5 w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                          n.type === 'success' ? 'bg-emerald-500/10 text-emerald-500' :
                          n.type === 'warning' ? 'bg-amber-500/10 text-amber-500' :
                          n.type === 'error' ? 'bg-destructive/10 text-destructive' :
                          'bg-primary/10 text-primary'
                        }`}>
                          {n.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : 
                           n.type === 'warning' ? <AlertTriangle className="w-4 h-4" /> : 
                           n.type === 'error' ? <AlertTriangle className="w-4 h-4" /> : 
                           <MessageSquare className="w-4 h-4" />}
                        </div>
                        <div className="flex-1 pr-6">
                          <p className={`text-sm ${!n.read ? 'font-semibold' : 'font-medium'} text-foreground`}>{n.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{n.message}</p>
                          <span className="text-[10px] text-muted-foreground mt-1.5 block font-medium">
                            {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        
                        <div className="absolute top-3 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {!n.read && (
                            <button 
                              onClick={() => handleMarkAsRead(n.id)}
                              className="p-1 text-muted-foreground hover:text-primary bg-background rounded-md shadow-sm border border-border"
                              title="Mark as read"
                            >
                              <Check className="w-3 h-3" />
                            </button>
                          )}
                          <button 
                            onClick={() => handleDeleteNotification(n.id)}
                            className="p-1 text-muted-foreground hover:text-destructive bg-background rounded-md shadow-sm border border-border"
                            title="Delete"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

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
