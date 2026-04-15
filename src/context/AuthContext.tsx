import React from 'react';
import { onAuthStateChanged, signOut, type User } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '@/firebase';
import { getClientStayLoggedInPreference, isCompanyEmail } from '@/lib/auth';
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
            setUserRole(isCompanyEmail(nextUser.email || '') ? null : 'client');
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

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!user || !userRole) return;

    const clientTimeoutMinutes = Number(import.meta.env.VITE_CLIENT_IDLE_TIMEOUT_MINUTES || '30');
    const getIdleTimeoutMinutes = (role: AppUserData['role']) => {
      if (role === 'admin') return 15;
      if (role === 'employee') return 60;
      if (role === 'client') {
        return Number.isFinite(clientTimeoutMinutes) && clientTimeoutMinutes > 0 ? clientTimeoutMinutes : 30;
      }
      return 30;
    };

    if (userRole === 'client' && getClientStayLoggedInPreference()) return;

    const idleTimeoutMs = getIdleTimeoutMinutes(userRole) * 60 * 1000;

    let timerId: number | null = null;

    const resetTimer = () => {
      if (timerId) {
        window.clearTimeout(timerId);
      }
      timerId = window.setTimeout(() => {
        void signOut(auth);
      }, idleTimeoutMs);
    };

    const events: Array<keyof WindowEventMap> = [
      'mousemove',
      'mousedown',
      'keydown',
      'scroll',
      'touchstart',
      'click',
    ];

    events.forEach((eventName) => window.addEventListener(eventName, resetTimer, { passive: true }));
    document.addEventListener('visibilitychange', resetTimer);
    resetTimer();

    return () => {
      events.forEach((eventName) => window.removeEventListener(eventName, resetTimer));
      document.removeEventListener('visibilitychange', resetTimer);
      if (timerId) {
        window.clearTimeout(timerId);
      }
    };
  }, [user, userRole]);

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
