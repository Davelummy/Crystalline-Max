import React from 'react';
import { AlertCircle } from 'lucide-react';
import { deleteUser, getRedirectResult, onAuthStateChanged, signOut, type User } from 'firebase/auth';
import { doc, getDoc, onSnapshot, serverTimestamp, setDoc, writeBatch } from 'firebase/firestore';
import { AdminDashboard } from './components/AdminDashboard';
import { AdminLoginPage } from './components/AdminLoginPage';
import { AdminNavbar } from './components/AdminNavbar';
import { AdminOnboarding } from './components/AdminOnboarding';
import { AdminSettings } from './components/AdminSettings';
import { AdminStaffManagement } from './components/AdminStaffManagement';
import { BookingFlow } from './components/BookingFlow';
import { CostEstimator } from './components/CostEstimator';
import { CustomerBilling } from './components/CustomerBilling';
import { CustomerDashboard } from './components/CustomerDashboard';
import { CustomerLoginPage } from './components/CustomerLoginPage';
import { CustomerNavbar } from './components/CustomerNavbar';
import { CustomerOnboarding } from './components/CustomerOnboarding';
import { EmployeeCheckIn } from './components/EmployeeCheckIn';
import { Hero } from './components/Hero';
import { PortalSelection } from './components/PortalSelection';
import { PrivacyPage } from './components/PrivacyPage';
import { PublicNavbar } from './components/PublicNavbar';
import { Services } from './components/Services';
import { StaffNavbar } from './components/StaffNavbar';
import { StaffLoginPage } from './components/StaffLoginPage';
import { StaffNotifications } from './components/StaffNotifications';
import { StaffOnboarding } from './components/StaffOnboarding';
import { StaffSchedule } from './components/StaffSchedule';
import { StaffSignupPage } from './components/StaffSignupPage';
import { StaffTasks } from './components/StaffTasks';
import { Testimonials } from './components/Testimonials';
import { TermsPage } from './components/TermsPage';
import { UserProfileEdit } from './components/UserProfileEdit';
import {
  clearLoginTarget,
  COMPANY_EMAIL_DOMAIN,
  createCompanyUser,
  getAuthErrorMessage,
  getSavedLoginTarget,
  hasSavedLoginTarget,
  isCompanyEmail,
  normalizeEmployeeId,
  signInWithCompanyEmail,
  signInWithGoogle,
} from './lib/auth';
import { cn } from '@/lib/utils';
import { auth, db } from './firebase';
import type { AppUserData, EmployeeInvite, Portal, View } from './types';

function AccessMessage({
  title,
  body,
  actionLabel,
  onAction,
}: {
  title: string;
  body: string;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md text-center">
        <AlertCircle className="mx-auto mb-4 text-red-500" size={48} />
        <h2 className="text-xl font-display uppercase mb-4">{title}</h2>
        <p className="text-white/72 text-sm mb-8">{body}</p>
        <button onClick={onAction} className="btn-primary">{actionLabel}</button>
      </div>
    </div>
  );
}

export default function App() {
  const [portal, setPortal] = React.useState<Portal>('public');
  const [pathname, setPathname] = React.useState(() => (
    typeof window === 'undefined' ? '/' : window.location.pathname
  ));
  const [currentView, setCurrentView] = React.useState<View>(() => (
    typeof window === 'undefined'
      ? 'landing'
      : window.location.pathname === '/admin'
        ? 'admin-login'
        : window.location.pathname === '/privacy'
          ? 'privacy'
          : window.location.pathname === '/terms'
            ? 'terms'
            : 'landing'
  ));
  const [preSelectedService, setPreSelectedService] = React.useState<string | null>(null);
  const [user, setUser] = React.useState<User | null>(null);
  const [userData, setUserData] = React.useState<AppUserData | null>(null);
  const [userRole, setUserRole] = React.useState<AppUserData['role'] | null>(null);
  const [isOnboarded, setIsOnboarded] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [isLoggingIn, setIsLoggingIn] = React.useState(false);
  const [authError, setAuthError] = React.useState<string | null>(null);
  const isAdminPath = pathname === '/admin';
  const isPrivacyPath = pathname === '/privacy';
  const isTermsPath = pathname === '/terms';
  const footerPhone = '+44 161 524 7812';
  const footerAddressLine = '18 Birchfields Road, Manchester, M13 0ZE';

  const publicViews = React.useMemo<View[]>(() => [
    'landing',
    'booking',
    'estimator',
    'selection',
    'customer-login',
    'staff-login',
    'staff-signup',
    'admin-login',
    'privacy',
    'terms',
  ], []);

  const buildCompanyDisplayName = React.useCallback((email: string) => {
    const localPart = email.split('@')[0] || 'staff';
    return localPart
      .split(/[._-]/)
      .filter(Boolean)
      .map((part) => part[0]?.toUpperCase() + part.slice(1))
      .join(' ');
  }, []);

  const resetToSelection = React.useCallback((message: string) => {
    setAuthError(message);
    setPortal('public');
    setCurrentView('selection');
  }, []);

  const replacePath = React.useCallback((nextPath: '/' | '/admin' | '/privacy' | '/terms') => {
    if (typeof window === 'undefined') return;
    if (window.location.pathname !== nextPath) {
      window.history.replaceState({}, '', nextPath);
    }
    setPathname(nextPath);
  }, []);

  const goToPublicView = React.useCallback((view: Extract<View, 'selection' | 'customer-login' | 'staff-login' | 'staff-signup' | 'admin-login' | 'landing' | 'booking' | 'estimator' | 'privacy' | 'terms'>) => {
    setAuthError(null);
    setPortal('public');
    setCurrentView(view);
  }, []);

  const getLoginViewForTarget = React.useCallback((target: Exclude<Portal, 'public'>): Extract<View, 'customer-login' | 'staff-login' | 'admin-login'> => {
    if (target === 'staff') return 'staff-login';
    if (target === 'admin') return 'admin-login';
    return 'customer-login';
  }, []);

  const resetToLoginView = React.useCallback((target: Exclude<Portal, 'public'>, message: string) => {
    setAuthError(message);
    setPortal('public');
    setCurrentView(getLoginViewForTarget(target));
  }, [getLoginViewForTarget]);

  const rejectPortalLogin = React.useCallback(async (target: Exclude<Portal, 'public'>, message: string) => {
    await signOut(auth).catch(() => undefined);
    resetToLoginView(target, message);
  }, [resetToLoginView]);

  const completePortalLogin = React.useCallback(async (nextUser: User, targetPortal: Exclude<Portal, 'public'>) => {
    const userSnapshot = await getDoc(doc(db, 'users', nextUser.uid));

    if (!userSnapshot.exists()) {
      if (targetPortal === 'customer') {
        setPortal('customer');
        setCurrentView('customer');
        return true;
      }

      await rejectPortalLogin(
        targetPortal,
        targetPortal === 'staff'
          ? 'No staff profile was found for this account. Use Create Staff Account with your employee ID first.'
          : 'Admin access must be provisioned manually in Firebase Authentication and Firestore.',
      );
      return false;
    }

    const data = userSnapshot.data() as AppUserData;

    if (data.role === 'admin') {
      setPortal(targetPortal === 'customer' ? 'customer' : targetPortal === 'staff' ? 'staff' : 'admin');
      setCurrentView(targetPortal === 'customer' ? 'customer' : targetPortal === 'staff' ? 'schedule' : 'admin');
      return true;
    }

    if (data.role === 'employee') {
      if (targetPortal === 'admin') {
        await rejectPortalLogin('admin', 'Only Firestore users with the role admin can enter the admin portal.');
        return false;
      }

      setPortal(targetPortal === 'customer' ? 'customer' : 'staff');
      setCurrentView(targetPortal === 'customer' ? 'customer' : 'schedule');
      return true;
    }

    if (targetPortal !== 'customer') {
      await rejectPortalLogin(targetPortal, 'This account does not have access to the selected workforce portal.');
      return false;
    }

    setPortal('customer');
    setCurrentView('customer');
    return true;
  }, [rejectPortalLogin]);

  const handleBookFromEstimator = (serviceId: string) => {
    setPreSelectedService(serviceId);
    setCurrentView('booking');
  };

  React.useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const syncPathname = () => setPathname(window.location.pathname);
    window.addEventListener('popstate', syncPathname);

    return () => {
      window.removeEventListener('popstate', syncPathname);
    };
  }, []);

  React.useEffect(() => {
    if (portal === 'admin' || (portal === 'public' && currentView === 'admin-login')) {
      replacePath('/admin');
      return;
    }

    if (portal === 'public' && currentView === 'privacy') {
      replacePath('/privacy');
      return;
    }

    if (portal === 'public' && currentView === 'terms') {
      replacePath('/terms');
      return;
    }

    replacePath('/');
  }, [currentView, portal, replacePath]);

  React.useEffect(() => {
    if (portal !== 'public') return;

    if (isAdminPath && currentView !== 'admin-login') {
      setCurrentView('admin-login');
      return;
    }

    if (isPrivacyPath && currentView !== 'privacy') {
      setCurrentView('privacy');
      return;
    }

    if (isTermsPath && currentView !== 'terms') {
      setCurrentView('terms');
      return;
    }

    if (!isAdminPath && currentView === 'admin-login') {
      setCurrentView('landing');
    }

    if (!isPrivacyPath && currentView === 'privacy') {
      setCurrentView('landing');
    }

    if (!isTermsPath && currentView === 'terms') {
      setCurrentView('landing');
    }
  }, [currentView, isAdminPath, isPrivacyPath, isTermsPath, portal]);

  React.useEffect(() => {
    let active = true;
    const loginTargetView = hasSavedLoginTarget() ? getLoginViewForTarget(getSavedLoginTarget()) : null;

    if (loginTargetView) {
      setCurrentView(loginTargetView);
    }

    getRedirectResult(auth)
      .then(async (result) => {
        if (!active || !result?.user) return;
        await completePortalLogin(result.user, getSavedLoginTarget());
        clearLoginTarget();
      })
      .catch((error) => {
        if (!active) return;
        console.error('Redirect login failed:', error);
        setAuthError(getAuthErrorMessage(error));
        if (loginTargetView) {
          setCurrentView(loginTargetView);
        }
        setIsLoggingIn(false);
      });

    return () => {
      active = false;
    };
  }, [completePortalLogin, getLoginViewForTarget]);

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
        setIsOnboarded(false);
        setPortal('public');
        setCurrentView((currentView) => (
          publicViews.includes(currentView)
            ? currentView
            : window.location.pathname === '/admin'
              ? 'admin-login'
              : window.location.pathname === '/privacy'
                ? 'privacy'
                : window.location.pathname === '/terms'
                  ? 'terms'
              : 'landing'
        ));
        setLoading(false);
        return;
      }

      setLoading(true);

      if (!isAdminPath && hasSavedLoginTarget() && getSavedLoginTarget() === 'customer') {
        setPortal('customer');
        setCurrentView('customer');
      }

      unsubscribeUserDoc = onSnapshot(doc(db, 'users', nextUser.uid), (snapshot) => {
        if (!snapshot.exists()) {
          setUserData(null);
          setUserRole(null);
          setIsOnboarded(false);
          setLoading(false);
          return;
        }

        const data = snapshot.data() as AppUserData;
        setUserData(data);
        setUserRole(data.role);
        setIsOnboarded(Boolean(data.onboarded));
        setLoading(false);
      }, (error) => {
        console.error('Error listening to user data:', error);
        setLoading(false);
      });
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeUserDoc) unsubscribeUserDoc();
    };
  }, [isAdminPath, publicViews]);

  React.useEffect(() => {
    if (loading || !user || portal !== 'public') return;

    const hasCustomerLoginIntent =
      currentView === 'customer-login' ||
      (hasSavedLoginTarget() && getSavedLoginTarget() === 'customer');

    if (isAdminPath) {
      if (userRole === 'admin') {
        setPortal('admin');
        setCurrentView('admin');
        return;
      }

      setAuthError('Only manually provisioned admin accounts can access the admin portal.');
      void signOut(auth).catch(() => undefined);
      return;
    }

    if (userRole === 'admin') {
      setPortal('admin');
      setCurrentView('admin');
      return;
    }

    if (userRole === 'employee') {
      setPortal('staff');
      setCurrentView('schedule');
      return;
    }

    if (userRole === 'client') {
      clearLoginTarget();
      setPortal('customer');
      setCurrentView('customer');
      return;
    }

    if (!userData && (hasCustomerLoginIntent || !isCompanyEmail(user.email || ''))) {
      clearLoginTarget();
      setPortal('customer');
      setCurrentView('customer');
    }
  }, [currentView, isAdminPath, loading, portal, user, userData, userRole]);

  const handleCustomerLogin = async () => {
    if (isLoggingIn) return;

    setIsLoggingIn(true);
    setAuthError(null);

    try {
      const result = await signInWithGoogle('customer');
      if (!result?.user) return;
      await completePortalLogin(result.user, 'customer');
      clearLoginTarget();
    } catch (error) {
      console.error('Customer login failed:', error);
      setAuthError(getAuthErrorMessage(error));
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleStaffLogin = async (email: string, password: string) => {
    if (isLoggingIn) return;

    const normalizedEmail = email.trim().toLowerCase();
    setIsLoggingIn(true);
    setAuthError(null);

    if (!isCompanyEmail(normalizedEmail)) {
      setAuthError(`Use your ${COMPANY_EMAIL_DOMAIN} company email for staff access.`);
      setIsLoggingIn(false);
      return;
    }

    try {
      const result = await signInWithCompanyEmail(normalizedEmail, password);
      await completePortalLogin(result.user, 'staff');
    } catch (error) {
      console.error('Staff login failed:', error);
      setAuthError(getAuthErrorMessage(error));
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleStaffSignup = async (employeeId: string, email: string, password: string) => {
    if (isLoggingIn) return;

    const normalizedEmployeeId = normalizeEmployeeId(employeeId);
    const normalizedEmail = email.trim().toLowerCase();

    setIsLoggingIn(true);
    setAuthError(null);

    if (!normalizedEmployeeId) {
      setAuthError('Enter the employee ID issued by the boss.');
      setIsLoggingIn(false);
      return;
    }

    if (!isCompanyEmail(normalizedEmail)) {
      setAuthError(`Use your ${COMPANY_EMAIL_DOMAIN} company email when creating a staff account.`);
      setIsLoggingIn(false);
      return;
    }

    let createdUser: User | null = null;
    let onboardingUser: User | null = null;
    let staffProfileCreated = false;

    try {
      try {
        const credential = await createCompanyUser(normalizedEmail, password);
        createdUser = credential.user;
        onboardingUser = credential.user;
      } catch (error) {
        const code = typeof error === 'object' && error && 'code' in error
          ? String((error as { code: unknown }).code)
          : '';

        if (code !== 'auth/email-already-in-use') {
          throw error;
        }

        const credential = await signInWithCompanyEmail(normalizedEmail, password);
        onboardingUser = credential.user;
      }

      if (!onboardingUser) {
        throw new Error('Staff account provisioning could not start.');
      }

      await onboardingUser.getIdToken(true);

      const inviteSnapshot = await getDoc(doc(db, 'employeeInvites', normalizedEmployeeId));

      if (!inviteSnapshot.exists()) {
        throw new Error('This employee ID was not found. Contact the boss for a valid staff ID.');
      }

      const invite = inviteSnapshot.data() as EmployeeInvite;
      const reservedEmail = invite.email?.trim().toLowerCase();

      if (invite.claimed) {
        throw new Error('This employee ID has already been used. Contact the boss if you need a replacement.');
      }

      if (reservedEmail && reservedEmail !== normalizedEmail) {
        throw new Error(`This employee ID is reserved for ${reservedEmail}. Use that company email or ask the boss to update the invite.`);
      }

      const userRef = doc(db, 'users', onboardingUser.uid);
      const inviteRef = doc(db, 'employeeInvites', normalizedEmployeeId);
      const existingUserSnapshot = await getDoc(userRef);

      if (existingUserSnapshot.exists()) {
        await completePortalLogin(onboardingUser, 'staff');
        return;
      }

      const batch = writeBatch(db);

      batch.set(userRef, {
        uid: onboardingUser.uid,
        email: normalizedEmail,
        displayName: invite.displayName || buildCompanyDisplayName(normalizedEmail),
        role: 'employee',
        employeeId: normalizedEmployeeId,
        phoneNumber: '',
        position: invite.position || 'field-operator',
        experience: '',
        onboarded: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      batch.update(inviteRef, {
        claimed: true,
        claimedByUid: onboardingUser.uid,
        claimedByEmail: normalizedEmail,
        claimedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      await batch.commit();
      staffProfileCreated = true;
      await completePortalLogin(onboardingUser, 'staff');
    } catch (error) {
      console.error('Staff signup failed:', error);

      if (createdUser && !staffProfileCreated) {
        await deleteUser(createdUser).catch((cleanupError) => {
          console.error('Failed to remove incomplete staff account:', cleanupError);
        });
      }

      const message = error instanceof Error ? error.message : getAuthErrorMessage(error);
      resetToLoginView('staff', message);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleAdminLogin = async (email: string, password: string) => {
    if (isLoggingIn) return;

    const normalizedEmail = email.trim().toLowerCase();
    setIsLoggingIn(true);
    setAuthError(null);

    if (!isCompanyEmail(normalizedEmail)) {
      setAuthError(`Admin access requires a ${COMPANY_EMAIL_DOMAIN} company email.`);
      setIsLoggingIn(false);
      return;
    }

    try {
      const result = await signInWithCompanyEmail(normalizedEmail, password);
      await completePortalLogin(result.user, 'admin');
    } catch (error) {
      console.error('Admin login failed:', error);
      setAuthError(getAuthErrorMessage(error));
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async (nextView: View = 'landing') => {
    await signOut(auth);
    setAuthError(null);
    setPortal('public');
    setCurrentView(nextView);
    setPreSelectedService(null);
  };

  const renderPublicPortal = () => {
    if (currentView === 'admin-login') {
      return (
        <AdminLoginPage
          onBack={() => goToPublicView('landing')}
          onLogin={handleAdminLogin}
          isLoggingIn={isLoggingIn}
          error={authError}
        />
      );
    }

    return (
      <>
        <PublicNavbar
          onNavigate={(view) => {
            setCurrentView(view);
            if (view !== 'booking') setPreSelectedService(null);
          }}
        />
        <main>
          {currentView === 'landing' ? (
          <>
            <Hero
              onBookNow={() => setCurrentView('booking')}
              onViewServices={() => {
                const element = document.getElementById('services');
                element?.scrollIntoView({ behavior: 'smooth' });
              }}
            />
            <Services onBook={handleBookFromEstimator} />
            <Testimonials />
            <div className="py-20 text-center bg-charcoal border-y border-white/5">
              <h3 className="text-2xl mb-8 text-white">Ready for a precision clean?</h3>
              <div className="flex flex-wrap justify-center gap-4">
                <button onClick={() => setCurrentView('booking')} className="btn-primary">START BOOKING</button>
                <button onClick={() => setCurrentView('estimator')} className="btn-secondary">GET ESTIMATE</button>
              </div>
            </div>
          </>
        ) : currentView === 'booking' ? (
          <BookingFlow
            initialServiceId={preSelectedService || undefined}
            onComplete={() => {
              setPortal('customer');
              setCurrentView('customer');
              setPreSelectedService(null);
            }}
          />
        ) : currentView === 'estimator' ? (
          <CostEstimator onBook={handleBookFromEstimator} />
        ) : currentView === 'selection' ? (
          <PortalSelection
            onSelectCustomer={() => goToPublicView('customer-login')}
            onSelectStaff={() => goToPublicView('staff-login')}
          />
        ) : currentView === 'customer-login' ? (
          <CustomerLoginPage
            onBack={() => goToPublicView('selection')}
            onLogin={handleCustomerLogin}
            isLoggingIn={isLoggingIn}
            error={authError}
          />
        ) : currentView === 'staff-login' ? (
          <StaffLoginPage
            onBack={() => goToPublicView('selection')}
            onLogin={handleStaffLogin}
            onCreateAccount={() => goToPublicView('staff-signup')}
            isLoggingIn={isLoggingIn}
            error={authError}
          />
        ) : currentView === 'staff-signup' ? (
          <StaffSignupPage
            onBack={() => goToPublicView('selection')}
            onSignup={handleStaffSignup}
            onGoToLogin={() => goToPublicView('staff-login')}
            isLoggingIn={isLoggingIn}
            error={authError}
          />
        ) : currentView === 'privacy' ? (
          <PrivacyPage onBack={() => goToPublicView('landing')} />
        ) : currentView === 'terms' ? (
          <TermsPage onBack={() => goToPublicView('landing')} />
        ) : (
          <Hero
            onBookNow={() => setCurrentView('booking')}
            onViewServices={() => {
              const element = document.getElementById('services');
              element?.scrollIntoView({ behavior: 'smooth' });
            }}
          />
        )}
        </main>
      </>
    );
  };

  const renderAuthenticatedPortal = () => {
    if (!user) return renderPublicPortal();

    if (!userData) {
      if (portal === 'customer') {
        return <CustomerOnboarding onComplete={() => setIsOnboarded(true)} />;
      }

      return (
        <AccessMessage
          title="Provisioning Required"
          body="Staff and admin users must have the correct Firestore profile before they can use these portals."
          actionLabel="Return to Portal Selection"
          onAction={() => {
            void handleLogout('selection');
          }}
        />
      );
    }

    if (!isOnboarded) {
      if (userRole === 'client') return <CustomerOnboarding onComplete={() => setIsOnboarded(true)} />;
      if (userRole === 'employee') return <StaffOnboarding onComplete={() => setIsOnboarded(true)} />;
      if (userRole === 'admin') return <AdminOnboarding onComplete={() => setIsOnboarded(true)} />;
    }

    if (portal === 'admin' && userRole !== 'admin') {
      return (
        <AccessMessage
          title="Access Denied"
          body="You do not have administrative privileges."
          actionLabel="Return to Portal Selection"
          onAction={() => {
            void handleLogout('selection');
          }}
        />
      );
    }

    if (portal === 'staff' && userRole !== 'employee' && userRole !== 'admin') {
      return (
        <AccessMessage
          title="Staff Only"
          body="This portal is reserved for Crystalline Max employees."
          actionLabel="Return to Portal Selection"
          onAction={() => {
            void handleLogout().then(() => setCurrentView('selection'));
          }}
        />
      );
    }

    return (
      <>
        {portal === 'customer' && <CustomerNavbar onNavigate={setCurrentView} user={user} onLogout={() => void handleLogout('landing')} />}
        {portal === 'staff' && (
          <StaffNavbar
            onNavigate={setCurrentView}
            user={user}
            onLogout={() => void handleLogout('landing')}
          />
        )}
        {portal === 'admin' && <AdminNavbar onNavigate={setCurrentView} user={user} onLogout={() => void handleLogout('admin-login')} />}

        <main>
          {portal === 'customer' && (
            currentView === 'booking' ? (
              <BookingFlow
                initialServiceId={preSelectedService || undefined}
                onComplete={() => {
                  setCurrentView('customer');
                  setPreSelectedService(null);
                }}
              />
            ) : currentView === 'profile' ? (
              <UserProfileEdit user={user} onBack={() => setCurrentView('customer')} />
            ) : currentView === 'billing' ? (
              <CustomerBilling user={user} onBack={() => setCurrentView('customer')} />
            ) : (
              <CustomerDashboard onNavigate={setCurrentView} user={user} userData={userData} />
            )
          )}

          {portal === 'staff' && (
            currentView === 'checkin' ? <EmployeeCheckIn /> :
            currentView === 'schedule' ? <StaffSchedule onNavigate={setCurrentView} /> :
            currentView === 'tasks' ? <StaffTasks onNavigate={setCurrentView} /> :
            currentView === 'notifications' ? <StaffNotifications onNavigate={setCurrentView} /> :
            <div className="pt-32 text-center uppercase tracking-widest text-xs text-white/65">
              {currentView} module coming soon
            </div>
          )}

          {portal === 'admin' && (
            currentView === 'admin' ? <AdminDashboard /> :
            currentView === 'staff-mgmt' ? <AdminStaffManagement /> :
            currentView === 'settings' ? <AdminSettings /> :
            <div className="pt-32 text-center uppercase tracking-widest text-xs text-white/65">
              {currentView} module coming soon
            </div>
          )}
        </main>
      </>
    );
  };

  return (
    <div className={cn('min-h-screen relative overflow-hidden', portal === 'customer' ? 'bg-white text-charcoal' : 'bg-charcoal text-white')}>
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className={cn(
            'absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full blur-[180px] animate-pulse',
            portal === 'customer' ? 'bg-teal/25' : 'bg-teal/20',
          )}
        />
        <div
          className={cn(
            'absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full blur-[180px] animate-pulse',
            portal === 'customer' ? 'bg-vibrant-blue/25' : 'bg-vibrant-blue/20',
          )}
          style={{ animationDelay: '2s' }}
        />
        {portal === 'admin' && (
          <div
            className="absolute top-[30%] right-[10%] w-[40%] h-[40%] bg-purple-500/15 rounded-full blur-[120px] animate-pulse"
            style={{ animationDelay: '1s' }}
          />
        )}
      </div>

      <div className="relative z-10">
        {loading ? (
          <div className="min-h-screen flex items-center justify-center uppercase tracking-widest text-xs">Syncing Portal...</div>
        ) : portal === 'public' ? (
          renderPublicPortal()
        ) : (
          renderAuthenticatedPortal()
        )}
      </div>

      <footer className={cn('py-20 border-t', portal === 'customer' ? 'bg-charcoal text-white border-white/5' : 'bg-black text-white border-white/5')}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-12">
            <div className="col-span-2">
              <h4 className="text-2xl mb-6">CRYSTALLINE MAX LTD</h4>
              <p className="text-white/68 text-sm max-w-sm leading-relaxed">
                Premium mobile car detailing and residential/commercial cleaning services based in Manchester.
                Precision in every detail, excellence in every clean.
              </p>
            </div>
            <div>
              <h5 className="text-xs font-bold uppercase tracking-widest mb-6 text-teal">Contact</h5>
              <p className="text-sm text-white/75">info@crystallinemax.co.uk</p>
              <p className="text-sm text-white/75">{footerPhone}</p>
            </div>
            <div>
              <h5 className="text-xs font-bold uppercase tracking-widest mb-6 text-teal">Location</h5>
              <p className="text-sm text-white/75">Manchester Hub</p>
              <p className="text-sm text-white/75">{footerAddressLine}</p>
            </div>
          </div>
          <div className="mt-20 flex flex-col gap-4 border-t border-white/5 pt-8 text-[10px] font-bold uppercase tracking-widest text-white/45 md:flex-row md:items-center md:justify-between">
            <p>© 2026 CRYSTALLINE MAX LTD. ALL RIGHTS RESERVED.</p>
            <div className="flex gap-8">
              <button type="button" onClick={() => goToPublicView('privacy')} className="hover:text-teal transition-colors">Privacy</button>
              <button type="button" onClick={() => goToPublicView('terms')} className="hover:text-teal transition-colors">Terms</button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
