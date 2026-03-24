import React from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '@/firebase';
import type { AppUserData } from '@/types';

interface AuthContextValue {
  user: User | null;
  userData: AppUserData | null;
  userRole: AppUserData['role'] | null;
  loading: boolean;
}

const AuthContext = React.createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = React.useState<User | null>(null);
  const [userData, setUserData] = React.useState<AppUserData | null>(null);
  const [userRole, setUserRole] = React.useState<AppUserData['role'] | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let unsubscribeUserDoc: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);

      if (unsubscribeUserDoc) {
        unsubscribeUserDoc();
        unsubscribeUserDoc = null;
      }

      if (!nextUser) {
        setUserData(null);
        setUserRole(null);
        setLoading(false);
        return;
      }

      setLoading(true);

      unsubscribeUserDoc = onSnapshot(
        doc(db, 'users', nextUser.uid),
        (snapshot) => {
          if (!snapshot.exists()) {
            setUserData(null);
            setUserRole(null);
            setLoading(false);
            return;
          }

          const data = snapshot.data() as AppUserData;
          setUserData(data);
          setUserRole(data.role);
          setLoading(false);
        },
        (error) => {
          console.error('Error listening to user data:', error);
          setLoading(false);
        },
      );
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeUserDoc) unsubscribeUserDoc();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, userData, userRole, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
