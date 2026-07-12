import { createContext, useContext, useEffect, useState } from 'react';
import { 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { auth } from '../services/firebase';
import { localStorageDB } from '../services/localStorageDB';
import { toast } from 'react-hot-toast';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Sign in with Google and handle Firestore user doc
  async function signInWithGoogle(requestedRole = 'Employee') {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      try {
        // Check if user exists in localStorageDB
        const userSnap = await localStorageDB.getById('users', user.uid);
        
        const newUserData = {
          uid: user.uid,
          name: user.displayName,
          email: user.email,
          photoURL: user.photoURL,
          role: requestedRole,
          status: 'Active',
          createdAt: userSnap ? userSnap.createdAt : new Date().toISOString()
        };
        
        await localStorageDB.set('users', user.uid, newUserData);
        setCurrentUser({ ...user, ...newUserData });
      } catch (localError) {
        console.warn("Local storage error during login setup: ", localError);
        toast.error("Database connection failed. Running in limited mode.");
        setCurrentUser({ ...user, role: requestedRole });
      }
      
      toast.success('Successfully logged in!');
      return user;
    } catch (error) {
      console.error("Firebase Auth Error Details:", error);
      
      // Extract the most readable error message
      const errorMessage = error.message || error.code || 'Failed to log in with Google.';
      
      toast.error(`Authentication Failed: ${errorMessage}`, {
        duration: 5000,
      });
      throw error;
    }
  }

  async function logout() {
    setCurrentUser(null);
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout error", error);
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        if (user) {
          const userSnap = await localStorageDB.getById('users', user.uid);

          if (userSnap) {
            setCurrentUser({
              ...user,
              ...userSnap,
            });
          } else {
            setCurrentUser(user);
          }
        } else {
          setCurrentUser(null);
        }
      } catch (error) {
        console.error(error);
        setCurrentUser(user);
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    signInWithGoogle,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {loading ? (
        <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-muted-foreground font-medium animate-pulse">Initializing Application...</p>
        </div>
      ) : children}
    </AuthContext.Provider>
  );
}
