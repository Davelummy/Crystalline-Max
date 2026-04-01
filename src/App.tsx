import React from 'react';
import { AlertCircle } from 'lucide-react';
import { deleteUser, getRedirectResult, signOut, type User } from 'firebase/auth';
import { doc, getDoc, serverTimestamp, writeBatch } from 'firebase/firestore';
import {
  BrowserRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams,
} from 'react-router-dom';
import { AdminDashboard } from './components/AdminDashboard';
import { AdminLoginPage } from './components/AdminLoginPage';
import { AdminNavbar } from './components/AdminNavbar';
import { AdminOnboarding } from './components/AdminOnboarding';
import { AdminQuoteRequests } from './components/AdminQuoteRequests';
import { AdminSettings } from './components/AdminSettings';
import { AdminStaffManagement } from './components/AdminStaffManagement';
import { AdminStaffProfile } from './components/AdminStaffProfile';
import { AdminStaffAssignments } from './components/AdminStaffAssignments';
import { AdminBookingDetail } from './components/AdminBookingDetail';
import { BookingFlow } from './components/BookingFlow';
import { ContactPage } from './components/ContactPage';
import { CostEstimator } from './components/CostEstimator';
import { CustomerBilling } from './components/CustomerBilling';
import { CustomerBookingDetail } from './components/CustomerBookingDetail';
import { CustomerDashboard } from './components/CustomerDashboard';
import { CustomerLoginPage } from './components/CustomerLoginPage';
import { CustomerNavbar } from './components/CustomerNavbar';
import { CustomerOnboarding } from './components/CustomerOnboarding';
import { EmployeeCheckIn } from './components/EmployeeCheckIn';
import { Hero } from './components/Hero';
import { NotFoundPage } from './components/NotFoundPage';
import { PortalSelection } from './components/PortalSelection';
import { PrivacyPage } from './components/PrivacyPage';
import { PublicNavbar } from './components/PublicNavbar';
import { QuoteRequestFlow } from './components/QuoteRequestFlow';
import { RouteGuard } from './components/RouteGuard';
import { Services } from './components/Services';
import { StaffNavbar } from './components/StaffNavbar';
import { StaffLoginPage } from './components/StaffLoginPage';
import { StaffNotifications } from './components/StaffNotifications';
import { StaffOnboarding } from './components/StaffOnboarding';
import { StaffSchedule } from './components/StaffSchedule';
import { StaffSignupPage } from './components/StaffSignupPage';
import { StaffTasks } from './components/StaffTasks';
import { TermsPage } from './components/TermsPage';
import { Testimonials } from './components/Testimonials';
import { HowItWorks } from './components/HowItWorks';
import { TrustStrip } from './components/TrustStrip';
import { CTACarousel } from './components/CTACarousel';
import { UserProfileEdit } from './components/UserProfileEdit';
import { useAuth } from './context/AuthContext';
import { auth, db } from './firebase';
import {
  clearLoginReturnPath,
  clearLoginTarget,
  COMPANY_EMAIL_DOMAIN,
  createCompanyUser,
  getAuthErrorMessage,
  getSavedLoginReturnPath,
  getSavedLoginTarget,
  hasSavedLoginTarget,
  isCompanyEmail,
  normalizeEmployeeId,
  saveLoginReturnPath,
  signInWithCompanyEmail,
  signInWithGoogle,
} from './lib/auth';
import { serviceRequiresQuote } from './lib/bookings';
import { useGeneralSettings } from './lib/generalSettings';
import type { AppUserData, EmployeeInvite, UserRole, View } from './types';

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

function SyncingScreen() {
  return (
    <div className="min-h-screen bg-charcoal flex items-center justify-center">
      <div className="flex flex-col items-center gap-8">
        <div className="relative w-16 h-16">
          {/* Outer ring */}
          <div
            className="absolute inset-0 rounded-full border-2 border-teal/20 border-t-teal animate-spin"
            style={{ animationDuration: '1.4s', animationTimingFunction: 'linear' }}
          />
          {/* Inner ring — reverse */}
          <div
            className="absolute inset-[5px] rounded-full border-2 border-transparent border-b-teal/50 animate-spin"
            style={{ animationDuration: '0.9s', animationTimingFunction: 'linear', animationDirection: 'reverse' }}
          />
          {/* Centre pulse */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className="w-2.5 h-2.5 rounded-full bg-teal animate-pulse"
              style={{ boxShadow: '0 0 14px 4px rgba(0,245,212,0.55)' }}
            />
          </div>
        </div>
        <p className="text-[10px] uppercase tracking-[0.4em] text-teal/55 font-bold">Crystalline Max</p>
      </div>
    </div>
  );
}

function getDefaultAuthenticatedPath(user: User | null, userRole: UserRole | null) {
  if (userRole === 'admin') return '/admin/dashboard';
  if (userRole === 'employee') return '/staff';
  if (userRole === 'client') return '/customer';
  if (user) return '/portal';
  return null;
}

function getLoginPathForTarget(target: 'customer' | 'staff' | 'admin') {
  if (target === 'staff') return '/staff/login';
  if (target === 'admin') return '/admin';
  return '/login';
}

function isSafeDestination(pathname: string | undefined, prefix: '/customer' | '/staff' | '/admin') {
  return Boolean(pathname && pathname.startsWith(prefix));
}

function PublicFooter() {
  const navigate = useNavigate();
  const { settings } = useGeneralSettings();
  const addressLines = settings.businessAddress
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  return (
    <footer className="bg-black py-20 text-white border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-12">
          <div className="col-span-2">
            <h4 className="text-2xl mb-6 uppercase">{settings.businessName}</h4>
            <p className="text-white/68 text-sm max-w-sm leading-relaxed">
              Premium mobile car detailing and residential/commercial cleaning services based in {settings.serviceRegion}.
              Precision in every detail, excellence in every clean.
            </p>
          </div>
          <div>
            <h5 className="text-xs font-bold uppercase tracking-widest mb-6 text-teal">Contact</h5>
            <p className="text-sm text-white/75">{settings.supportEmail}</p>
            <p className="text-sm text-white/75">{settings.supportPhone}</p>
            <button
              type="button"
              onClick={() => navigate('/contact')}
              className="mt-4 text-[10px] font-bold uppercase tracking-widest text-white/70 transition-colors hover:text-teal"
            >
              Contact Page
            </button>
          </div>
          <div>
            <h5 className="text-xs font-bold uppercase tracking-widest mb-6 text-teal">Location</h5>
            <p className="text-sm text-white/75">{settings.serviceRegion}</p>
            <div className="mt-3 space-y-1">
              {addressLines.map((line) => (
                <p key={line} className="text-sm text-white/75">{line}</p>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-20 flex flex-col gap-4 border-t border-white/5 pt-8 text-[10px] font-bold uppercase tracking-widest text-white/60 md:flex-row md:items-center md:justify-between">
          <p>© 2026 CRYSTALLINE MAX LTD. ALL RIGHTS RESERVED.</p>
          <div className="flex flex-wrap gap-6">
            <button type="button" onClick={() => navigate('/')} className="hover:text-teal transition-colors">Home</button>
            <button type="button" onClick={() => navigate('/services')} className="hover:text-teal transition-colors">Services</button>
            <button type="button" onClick={() => navigate('/quote')} className="hover:text-teal transition-colors">Quotes</button>
            <button type="button" onClick={() => navigate('/estimate')} className="hover:text-teal transition-colors">Estimator</button>
            <button type="button" onClick={() => navigate('/contact')} className="hover:text-teal transition-colors">Contact</button>
            <button type="button" onClick={() => navigate('/portal')} className="hover:text-teal transition-colors">Portals</button>
            <button type="button" onClick={() => navigate('/privacy')} className="hover:text-teal transition-colors">Privacy</button>
            <button type="button" onClick={() => navigate('/terms')} className="hover:text-teal transition-colors">Terms</button>
          </div>
        </div>
      </div>
    </footer>
  );
}

function LandingPage() {
  const navigate = useNavigate();

  return (
    <>
      <Hero
        onBookNow={() => navigate('/book')}
        onViewServices={() => navigate('/services')}
      />
      <TrustStrip />
      <Services
        onBook={(serviceId) => navigate(`/book/${serviceId}`)}
        onRequestQuote={(serviceId) => navigate(`/quote/${serviceId}`)}
        onEstimate={() => navigate('/estimate')}
        onContact={() => navigate('/contact')}
      />
      <HowItWorks />
      <Testimonials />
      <CTACarousel
        onBook={(serviceId) => navigate(`/book/${serviceId}`)}
        onRequestQuote={(serviceId) => navigate(`/quote/${serviceId}`)}
        onEstimate={() => navigate('/estimate')}
      />
    </>
  );
}

function ServicesPage() {
  const navigate = useNavigate();
  return (
    <Services
      onBook={(serviceId) => navigate(`/book/${serviceId}`)}
      onRequestQuote={(serviceId) => navigate(`/quote/${serviceId}`)}
      onEstimate={() => navigate('/estimate')}
      onContact={() => navigate('/contact')}
    />
  );
}

function CostEstimatorPage() {
  const navigate = useNavigate();
  return (
    <CostEstimator
      onBook={(serviceId) => navigate(`/book/${serviceId}`)}
      onRequestQuote={(serviceId) => navigate(`/quote/${serviceId}`)}
      onContact={() => navigate('/contact')}
    />
  );
}

function ContactPageRoute() {
  const navigate = useNavigate();
  return <ContactPage onBookNow={() => navigate('/book')} onGoToPortal={() => navigate('/portal')} />;
}

function BookingFlowPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { serviceId } = useParams();
  const quoteBasePath = location.pathname.startsWith('/customer') ? '/customer/quote' : '/quote';

  if (serviceId && serviceRequiresQuote(serviceId)) {
    return <Navigate to={`${quoteBasePath}/${serviceId}`} replace />;
  }

  return (
    <BookingFlow
      initialServiceId={serviceId}
      onRequestQuote={(nextServiceId) => navigate(`${quoteBasePath}/${nextServiceId}`)}
      onComplete={() => navigate('/customer', { replace: true })}
    />
  );
}

function QuoteRequestPage() {
  const { serviceId } = useParams();
  return <QuoteRequestFlow initialServiceId={serviceId} source="public" />;
}

function CustomerQuoteRequestPage() {
  const { serviceId } = useParams();
  return <QuoteRequestFlow initialServiceId={serviceId} source="customer_portal" />;
}

function PublicLayout() {
  const navigate = useNavigate();

  const handleNavigate = React.useCallback((view: View) => {
    if (view === 'services') {
      navigate('/services');
      return;
    }
    if (view === 'booking') {
      navigate('/book');
      return;
    }
    if (view === 'quote') {
      navigate('/quote');
      return;
    }
    if (view === 'estimator') {
      navigate('/estimate');
      return;
    }
    if (view === 'contact') {
      navigate('/contact');
      return;
    }
    if (view === 'selection') {
      navigate('/portal');
      return;
    }
    if (view === 'privacy') {
      navigate('/privacy');
      return;
    }
    if (view === 'terms') {
      navigate('/terms');
      return;
    }
    navigate('/');
  }, [navigate]);

  return (
    <>
      <PublicNavbar onNavigate={handleNavigate} />
      <main>
        <Outlet />
      </main>
      <PublicFooter />
    </>
  );
}

function CustomerLayout({ onLogout }: { onLogout: (nextPath?: string) => Promise<void> }) {
  const navigate = useNavigate();
  const { user, userData, userRole, loading } = useAuth();
  const redirectTo = !user ? '/portal' : '/login';

  return (
    <RouteGuard allowed={['client']} userRole={userRole} loading={loading} redirectTo={redirectTo}>
      {!user ? (
        <SyncingScreen />
      ) : !userData || !userData.onboarded ? (
        <CustomerOnboarding onComplete={() => navigate('/customer', { replace: true })} />
      ) : (
        <>
          <CustomerNavbar
            onNavigate={(view) => {
              if (view === 'booking') {
                navigate('/customer/booking');
                return;
              }
              if (view === 'billing') {
                navigate('/customer/billing');
                return;
              }
              if (view === 'quote') {
                navigate('/customer/quote');
                return;
              }
              if (view === 'profile') {
                navigate('/customer/profile');
                return;
              }
              navigate('/customer');
            }}
            user={user}
            onLogout={() => void onLogout('/')}
          />
          <Outlet />
        </>
      )}
    </RouteGuard>
  );
}

function StaffLayout({ onLogout }: { onLogout: (nextPath?: string) => Promise<void> }) {
  const navigate = useNavigate();
  const { user, userData, userRole, loading } = useAuth();
  const redirectTo = !user ? '/portal' : '/staff/login';

  return (
    <RouteGuard allowed={['employee']} userRole={userRole} loading={loading} redirectTo={redirectTo}>
      {!user ? (
        <SyncingScreen />
      ) : !userData ? (
        <AccessMessage
          title="Provisioning Required"
          body="Staff users must have a valid Firestore employee profile before they can use the staff portal."
          actionLabel="Return to Portals"
          onAction={() => {
            void onLogout('/portal');
          }}
        />
      ) : !userData.onboarded ? (
        <StaffOnboarding onComplete={() => navigate('/staff', { replace: true })} />
      ) : (
        <>
          <StaffNavbar
            onNavigate={(view) => {
              if (view === 'checkin') {
                navigate('/staff/checkin');
                return;
              }
              if (view === 'tasks') {
                navigate('/staff/tasks');
                return;
              }
              if (view === 'notifications') {
                navigate('/staff/notifications');
                return;
              }
              navigate('/staff');
            }}
            user={user}
            onLogout={() => void onLogout('/')}
          />
          <Outlet />
        </>
      )}
    </RouteGuard>
  );
}

function AdminLayout({ onLogout }: { onLogout: (nextPath?: string) => Promise<void> }) {
  const navigate = useNavigate();
  const { user, userData, userRole, loading } = useAuth();
  const redirectTo = !user ? '/admin' : userRole === 'employee' ? '/staff' : '/customer';

  return (
    <RouteGuard allowed={['admin']} userRole={userRole} loading={loading} redirectTo={redirectTo}>
      {!user ? (
        <SyncingScreen />
      ) : !userData ? (
        <AccessMessage
          title="Provisioning Required"
          body="Admin access requires a manually provisioned Firestore admin profile."
          actionLabel="Return to Admin Login"
          onAction={() => {
            void onLogout('/admin');
          }}
        />
      ) : !userData.onboarded ? (
        <AdminOnboarding onComplete={() => navigate('/admin/dashboard', { replace: true })} />
      ) : (
        <>
          <AdminNavbar
            user={user}
            onLogout={() => void onLogout('/admin')}
          />
          <Outlet />
        </>
      )}
    </RouteGuard>
  );
}

function PortalSelectionRoute() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, userRole, loading } = useAuth();

  if (loading) return <SyncingScreen />;

  if (user && !userRole) {
    return (
      <AccessMessage
        title="Provisioning Required"
        body="Your account is signed in but no role profile was found yet. Ask admin to issue a valid employee ID and complete signup again."
        actionLabel="Sign Out"
        onAction={() => {
          void signOut(auth);
        }}
      />
    );
  }

  const redirect = getDefaultAuthenticatedPath(user, userRole);
  if (redirect && redirect !== location.pathname) {
    return <Navigate to={redirect} replace />;
  }

  return (
    <PortalSelection
      onSelectCustomer={() => navigate('/login', { state: location.state })}
      onSelectStaff={() => navigate('/staff/login', { state: location.state })}
    />
  );
}

function CustomerLoginRoute({
  onLogin,
  isLoggingIn,
  error,
}: {
  onLogin: (stayLoggedIn: boolean, fromPath?: string) => Promise<string | undefined>;
  isLoggingIn: boolean;
  error: string | null;
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, userRole, loading } = useAuth();

  if (loading) return <SyncingScreen />;

  if (userRole === 'client') {
    const redirect = getDefaultAuthenticatedPath(user, userRole);
    if (redirect) {
      return <Navigate to={redirect} replace />;
    }
  }

  const fromPath = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname;

  return (
    <CustomerLoginPage
      onBack={() => navigate('/portal')}
      onLogin={async (stayLoggedIn) => {
        const nextPath = await onLogin(stayLoggedIn, fromPath);
        if (nextPath) navigate(nextPath, { replace: true });
      }}
      isLoggingIn={isLoggingIn}
      error={error}
      activeSessionEmail={user?.email}
      activeSessionRole={userRole}
    />
  );
}

function StaffLoginRoute({
  onLogin,
  isLoggingIn,
  error,
}: {
  onLogin: (email: string, password: string, fromPath?: string) => Promise<string | undefined>;
  isLoggingIn: boolean;
  error: string | null;
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, userRole, loading } = useAuth();

  if (loading) return <SyncingScreen />;

  if (userRole === 'employee') {
    const redirect = getDefaultAuthenticatedPath(user, userRole);
    if (redirect) {
      return <Navigate to={redirect} replace />;
    }
  }

  const fromPath = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname;

  return (
    <StaffLoginPage
      onBack={() => navigate('/portal')}
      onLogin={async (email, password) => {
        const nextPath = await onLogin(email, password, fromPath);
        if (nextPath) navigate(nextPath, { replace: true });
      }}
      onCreateAccount={() => navigate('/staff/signup', { state: location.state })}
      isLoggingIn={isLoggingIn}
      error={error}
      activeSessionEmail={user?.email}
      activeSessionRole={userRole}
    />
  );
}

function StaffSignupRoute({
  onSignup,
  isLoggingIn,
  error,
}: {
  onSignup: (employeeId: string, email: string, password: string, fromPath?: string) => Promise<string | undefined>;
  isLoggingIn: boolean;
  error: string | null;
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, userRole, loading } = useAuth();

  if (loading) return <SyncingScreen />;

  if (userRole === 'employee') {
    const redirect = getDefaultAuthenticatedPath(user, userRole);
    if (redirect) {
      return <Navigate to={redirect} replace />;
    }
  }

  const fromPath = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname;

  return (
    <StaffSignupPage
      onBack={() => navigate('/portal')}
      onSignup={async (employeeId, email, password) => {
        const nextPath = await onSignup(employeeId, email, password, fromPath);
        if (nextPath) navigate(nextPath, { replace: true });
      }}
      onGoToLogin={() => navigate('/staff/login', { state: location.state })}
      isLoggingIn={isLoggingIn}
      error={error}
      activeSessionEmail={user?.email}
      activeSessionRole={userRole}
    />
  );
}

function AdminLoginRoute({
  onLogin,
  isLoggingIn,
  error,
}: {
  onLogin: (email: string, password: string, fromPath?: string) => Promise<string | undefined>;
  isLoggingIn: boolean;
  error: string | null;
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, userRole, loading } = useAuth();

  if (loading) return <SyncingScreen />;

  const redirect = getDefaultAuthenticatedPath(user, userRole);
  if (redirect) {
    return <Navigate to={redirect} replace />;
  }

  const fromPath = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname;

  return (
    <AdminLoginPage
      onBack={() => navigate('/')}
      onLogin={async (email, password) => {
        const nextPath = await onLogin(email, password, fromPath);
        if (nextPath) navigate(nextPath, { replace: true });
      }}
      isLoggingIn={isLoggingIn}
      error={error}
    />
  );
}

function CustomerBookingDetailRoute() {
  const navigate = useNavigate();
  const { bookingId } = useParams();

  if (!bookingId) {
    return <Navigate to="/customer" replace />;
  }

  return <CustomerBookingDetail bookingId={bookingId} onBack={() => navigate('/customer')} />;
}

function CustomerDashboardRoute() {
  const navigate = useNavigate();
  const { user, userData } = useAuth();

  return (
    <CustomerDashboard
      onNavigate={(view) => {
        if (view === 'booking') {
          navigate('/customer/booking');
          return;
        }
        if (view === 'billing') {
          navigate('/customer/billing');
          return;
        }
        if (view === 'quote') {
          navigate('/customer/quote');
          return;
        }
        if (view === 'profile') {
          navigate('/customer/profile');
          return;
        }
        navigate('/customer');
      }}
      user={user}
      userData={userData}
    />
  );
}

function CustomerBillingRoute() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return <CustomerBilling user={user} onBack={() => navigate('/customer')} />;
}

function CustomerProfileRoute() {
  const navigate = useNavigate();
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <UserProfileEdit user={user} onBack={() => navigate('/customer')} />;
}

function AdminBookingDetailRoute() {
  const navigate = useNavigate();
  const { bookingId } = useParams();

  if (!bookingId) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return <AdminBookingDetail bookingId={bookingId} onBack={() => navigate('/admin/dashboard')} />;
}

function StaffScheduleRoute() {
  const navigate = useNavigate();

  return (
    <StaffSchedule
      onNavigate={(view) => {
        if (view === 'tasks') {
          navigate('/staff/tasks');
          return;
        }
        navigate('/staff');
      }}
    />
  );
}

function StaffTasksRoute() {
  const navigate = useNavigate();

  return (
    <StaffTasks
      onNavigate={(view) => {
        if (view === 'schedule') {
          navigate('/staff');
          return;
        }
        navigate('/staff/tasks');
      }}
    />
  );
}

function StaffNotificationsRoute() {
  const navigate = useNavigate();

  return (
    <StaffNotifications
      onNavigate={(view) => {
        if (view === 'tasks') {
          navigate('/staff/tasks');
          return;
        }
        navigate('/staff/notifications');
      }}
    />
  );
}

function AppRouter() {
  const { user, userRole, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoggingIn, setIsLoggingIn] = React.useState(false);
  const [authError, setAuthError] = React.useState<string | null>(null);

  const buildCompanyDisplayName = React.useCallback((email: string) => {
    const localPart = email.split('@')[0] || 'staff';
    return localPart
      .split(/[._-]/)
      .filter(Boolean)
      .map((part) => part[0]?.toUpperCase() + part.slice(1))
      .join(' ');
  }, []);

  const resolveTargetPath = React.useCallback(
    (target: 'customer' | 'staff' | 'admin', fromPath?: string) => {
      if (target === 'customer') {
        return isSafeDestination(fromPath, '/customer') ? fromPath : '/customer';
      }
      if (target === 'staff') {
        return isSafeDestination(fromPath, '/staff') ? fromPath : '/staff';
      }
      return isSafeDestination(fromPath, '/admin') ? fromPath : '/admin/dashboard';
    },
    [],
  );

  const completePortalLogin = React.useCallback(async (
    nextUser: User,
    targetPortal: 'customer' | 'staff' | 'admin',
    fromPath?: string,
  ) => {
    const userSnapshot = await getDoc(doc(db, 'users', nextUser.uid));

    if (!userSnapshot.exists()) {
      if (targetPortal === 'customer') {
        return resolveTargetPath('customer', fromPath);
      }

      throw new Error(
        targetPortal === 'staff'
          ? 'No staff profile was found for this account. Use Create Staff Account with your employee ID first.'
          : 'Admin access must be provisioned manually in Firebase Authentication and Firestore.',
      );
    }

    const data = userSnapshot.data() as AppUserData;

    if (data.role === 'admin') {
      if (targetPortal === 'staff') {
        throw new Error('Admin accounts must use the dedicated /admin path.');
      }
      return resolveTargetPath('admin', fromPath);
    }

    if (data.role === 'employee') {
      if (targetPortal === 'admin') {
        throw new Error('Only Firestore users with the role admin can enter the admin portal.');
      }
      return resolveTargetPath('staff', fromPath);
    }

    if (targetPortal !== 'customer') {
      throw new Error('This account does not have access to the selected workforce portal.');
    }

    return resolveTargetPath('customer', fromPath);
  }, [resolveTargetPath]);

  React.useEffect(() => {
    let active = true;

    getRedirectResult(auth)
      .then(async (result) => {
        if (!active || !result?.user) return;

        try {
          const target = getSavedLoginTarget();
          const nextPath = await completePortalLogin(result.user, target, getSavedLoginReturnPath() || undefined);
          clearLoginTarget();
          clearLoginReturnPath();
          navigate(nextPath, { replace: true });
        } catch (error) {
          console.error('Redirect login failed:', error);
          setAuthError(error instanceof Error ? error.message : getAuthErrorMessage(error));
          navigate(getLoginPathForTarget(getSavedLoginTarget()), { replace: true });
        } finally {
          setIsLoggingIn(false);
        }
      })
      .catch((error) => {
        if (!active) return;
        console.error('Redirect login failed:', error);
        setAuthError(getAuthErrorMessage(error));
        navigate(getLoginPathForTarget(getSavedLoginTarget()), { replace: true });
        setIsLoggingIn(false);
      });

    return () => {
      active = false;
    };
  }, [completePortalLogin, navigate]);

  React.useEffect(() => {
    const pathname = location.pathname;
    const authPages = ['/login', '/staff/login', '/staff/signup', '/admin'];
    if (!authPages.includes(pathname)) {
      setAuthError(null);
    }
  }, [location.pathname]);

  const handleCustomerLogin = React.useCallback(async (stayLoggedIn: boolean, fromPath?: string) => {
    if (isLoggingIn) return undefined;

    setIsLoggingIn(true);
    setAuthError(null);

    try {
      saveLoginReturnPath(fromPath);
      const result = await signInWithGoogle('customer', { stayLoggedIn });
      if (!result?.user) return undefined;
      clearLoginTarget();
      clearLoginReturnPath();
      return await completePortalLogin(result.user, 'customer', fromPath);
    } catch (error) {
      console.error('Customer login failed:', error);
      setAuthError(getAuthErrorMessage(error));
      return undefined;
    } finally {
      setIsLoggingIn(false);
    }
  }, [completePortalLogin, isLoggingIn]);

  const handleStaffLogin = React.useCallback(async (email: string, password: string, fromPath?: string) => {
    if (isLoggingIn) return undefined;

    const normalizedEmail = email.trim().toLowerCase();
    setIsLoggingIn(true);
    setAuthError(null);

    if (!isCompanyEmail(normalizedEmail)) {
      setAuthError(`Use your ${COMPANY_EMAIL_DOMAIN} company email for staff access.`);
      setIsLoggingIn(false);
      return undefined;
    }

    try {
      const result = await signInWithCompanyEmail(normalizedEmail, password);
      return await completePortalLogin(result.user, 'staff', fromPath);
    } catch (error) {
      console.error('Staff login failed:', error);
      setAuthError(error instanceof Error ? error.message : getAuthErrorMessage(error));
      return undefined;
    } finally {
      setIsLoggingIn(false);
    }
  }, [completePortalLogin, isLoggingIn]);

  const handleStaffSignup = React.useCallback(async (employeeId: string, email: string, password: string, fromPath?: string) => {
    if (isLoggingIn) return undefined;

    const normalizedEmployeeId = normalizeEmployeeId(employeeId);
    const normalizedEmail = email.trim().toLowerCase();

    setIsLoggingIn(true);
    setAuthError(null);

    if (!normalizedEmployeeId) {
      setAuthError('Enter the employee ID issued by the boss.');
      setIsLoggingIn(false);
      return undefined;
    }

    if (!isCompanyEmail(normalizedEmail)) {
      setAuthError(`Use your ${COMPANY_EMAIL_DOMAIN} company email when creating a staff account.`);
      setIsLoggingIn(false);
      return undefined;
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
        return resolveTargetPath('staff', fromPath);
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
      return resolveTargetPath('staff', fromPath);
    } catch (error) {
      console.error('Staff signup failed:', error);

      if (createdUser && !staffProfileCreated) {
        await deleteUser(createdUser).catch((cleanupError) => {
          console.error('Failed to remove incomplete staff account:', cleanupError);
        });
      }

      // Always sign out after a failed signup so the user is not left in a
      // partially-authenticated state that shows "Provisioning Required".
      await signOut(auth).catch(() => undefined);

      setAuthError(error instanceof Error ? error.message : getAuthErrorMessage(error));
      return undefined;
    } finally {
      setIsLoggingIn(false);
    }
  }, [buildCompanyDisplayName, isLoggingIn, resolveTargetPath]);

  const handleAdminLogin = React.useCallback(async (email: string, password: string, fromPath?: string) => {
    if (isLoggingIn) return undefined;

    const normalizedEmail = email.trim().toLowerCase();
    setIsLoggingIn(true);
    setAuthError(null);

    if (!isCompanyEmail(normalizedEmail)) {
      setAuthError(`Admin access requires a ${COMPANY_EMAIL_DOMAIN} company email.`);
      setIsLoggingIn(false);
      return undefined;
    }

    try {
      const result = await signInWithCompanyEmail(normalizedEmail, password);
      return await completePortalLogin(result.user, 'admin', fromPath);
    } catch (error) {
      console.error('Admin login failed:', error);
      setAuthError(error instanceof Error ? error.message : getAuthErrorMessage(error));
      return undefined;
    } finally {
      setIsLoggingIn(false);
    }
  }, [completePortalLogin, isLoggingIn]);

  const handleLogout = React.useCallback(async (nextPath = '/') => {
    await signOut(auth);
    clearLoginTarget();
    clearLoginReturnPath();
    setAuthError(null);
    navigate(nextPath, { replace: true });
  }, [navigate]);

  if (loading && hasSavedLoginTarget()) {
    return <SyncingScreen />;
  }

  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/services" element={<ServicesPage />} />
        <Route path="/estimate" element={<CostEstimatorPage />} />
        <Route path="/contact" element={<ContactPageRoute />} />
        <Route path="/quote" element={<QuoteRequestPage />} />
        <Route path="/quote/:serviceId" element={<QuoteRequestPage />} />
        <Route path="/book" element={<BookingFlowPage />} />
        <Route path="/book/:serviceId" element={<BookingFlowPage />} />
        <Route path="/privacy" element={<PrivacyPage onBack={() => navigate('/')} />} />
        <Route path="/terms" element={<TermsPage onBack={() => navigate('/')} />} />
      </Route>

      <Route path="/portal" element={<PortalSelectionRoute />} />
      <Route
        path="/login"
        element={<CustomerLoginRoute onLogin={handleCustomerLogin} isLoggingIn={isLoggingIn} error={authError} />}
      />

      <Route path="/customer" element={<CustomerLayout onLogout={handleLogout} />}>
        <Route index element={<CustomerDashboardRoute />} />
        <Route path="booking" element={<BookingFlowPage />} />
        <Route path="quote" element={<CustomerQuoteRequestPage />} />
        <Route path="quote/:serviceId" element={<CustomerQuoteRequestPage />} />
        <Route path="bookings/:bookingId" element={<CustomerBookingDetailRoute />} />
        <Route path="billing" element={<CustomerBillingRoute />} />
        <Route path="profile" element={<CustomerProfileRoute />} />
      </Route>

      <Route path="/staff">
        <Route
          path="login"
          element={<StaffLoginRoute onLogin={handleStaffLogin} isLoggingIn={isLoggingIn} error={authError} />}
        />
        <Route
          path="signup"
          element={<StaffSignupRoute onSignup={handleStaffSignup} isLoggingIn={isLoggingIn} error={authError} />}
        />
        <Route element={<StaffLayout onLogout={handleLogout} />}>
          <Route index element={<StaffScheduleRoute />} />
          <Route path="checkin" element={<EmployeeCheckIn />} />
          <Route path="tasks" element={<StaffTasksRoute />} />
          <Route path="notifications" element={<StaffNotificationsRoute />} />
        </Route>
      </Route>

      <Route path="/admin">
        <Route
          index
          element={<AdminLoginRoute onLogin={handleAdminLogin} isLoggingIn={isLoggingIn} error={authError} />}
        />
        <Route element={<AdminLayout onLogout={handleLogout} />}>
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="staff" element={<AdminStaffManagement />} />
          <Route path="staff/:staffId/profile" element={<AdminStaffProfile />} />
          <Route path="staff/:staffId/assignments" element={<AdminStaffAssignments />} />
          <Route path="quotes" element={<AdminQuoteRequests />} />
          <Route path="bookings/:bookingId" element={<AdminBookingDetailRoute />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage onHome={() => navigate('/')} />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRouter />
    </BrowserRouter>
  );
}
