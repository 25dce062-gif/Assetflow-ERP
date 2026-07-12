import { createContext, useContext, useEffect, useState } from 'react';
import { 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { toast } from 'react-hot-toast';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Sign in with Google and handle Firestore user doc
  async function signInWithGoogle() {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      try {
        // Check if user exists in Firestore
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        
        if (!userSnap.exists()) {
          // Create new user document with default Employee role
          const newUserData = {
            uid: user.uid,
            name: user.displayName,
            email: user.email,
            photoURL: user.photoURL,
            role: 'Employee',
            status: 'Active',
            createdAt: new Date().toISOString()
          };
          await setDoc(userRef, newUserData);
          setCurrentUser({ ...user, ...newUserData });
        } else {
          setCurrentUser({ ...user, ...userSnap.data() });
        }
      } catch (firestoreError) {
        console.warn("Firestore unreachable during login setup: ", firestoreError);
        toast.error("Database connection failed. Running in limited mode.");
        setCurrentUser(user);
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
          const userRef = doc(db, "users", user.uid);
          // 3-second timeout to prevent infinite loading if Firestore hangs
          const userSnap = await Promise.race([
            getDoc(userRef),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Firestore timeout')), 3000))
          ]);

          if (userSnap.exists()) {
            setCurrentUser({
              ...user,
              ...userSnap.data(),
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
