import React from 'react';
import { PublicNavbar } from './components/PublicNavbar';
import { CustomerNavbar } from './components/CustomerNavbar';
import { StaffNavbar } from './components/StaffNavbar';
import { AdminNavbar } from './components/AdminNavbar';
import { PortalSelection } from './components/PortalSelection';
import { Hero } from './components/Hero';
import { Services } from './components/Services';
import { BookingFlow } from './components/BookingFlow';
import { CustomerDashboard } from './components/CustomerDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { EmployeeCheckIn } from './components/EmployeeCheckIn';
import { BrandBoard } from './components/BrandBoard';
import { CostEstimator } from './components/CostEstimator';
import { CustomerOnboarding } from './components/CustomerOnboarding';
import { StaffOnboarding } from './components/StaffOnboarding';
import { AdminOnboarding } from './components/AdminOnboarding';
import { StaffSchedule } from './components/StaffSchedule';
import { StaffTasks } from './components/StaffTasks';
import { UserProfileEdit } from './components/UserProfileEdit';
import { AdminStaffManagement } from './components/AdminStaffManagement';
import { AdminSettings } from './components/AdminSettings';
import { Testimonials } from './components/Testimonials';
import { Layout, Palette, Calendar, User, ShieldCheck, Calculator, LogIn, AlertCircle } from 'lucide-react';
import { cn } from './lib/utils';
import { auth, db } from './firebase';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';

type Portal = 'public' | 'customer' | 'staff' | 'admin';
type View = 'landing' | 'booking' | 'customer' | 'admin' | 'brand' | 'estimator' | 'checkin' | 'schedule' | 'tasks' | 'staff-mgmt' | 'settings' | 'billing' | 'selection' | 'profile';

export default function App() {
  const [portal, setPortal] = React.useState<Portal>('public');
  const [currentView, setCurrentView] = React.useState<View>('landing');
  const [preSelectedService, setPreSelectedService] = React.useState<string | null>(null);
  const [user, setUser] = React.useState<any>(null);
  const [userData, setUserData] = React.useState<any>(null);
  const [userRole, setUserRole] = React.useState<string | null>(null);
  const [isOnboarded, setIsOnboarded] = React.useState<boolean>(false);
  const [loading, setLoading] = React.useState(true);

  const [isLoggingIn, setIsLoggingIn] = React.useState(false);
  const [authError, setAuthError] = React.useState<string | null>(null);

  const handleBookFromEstimator = (serviceId: string) => {
    setPreSelectedService(serviceId);
    setCurrentView('booking');
  };

  React.useEffect(() => {
    let unsubscribeDoc: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      
      if (unsubscribeDoc) {
        unsubscribeDoc();
        unsubscribeDoc = null;
      }

      if (user) {
        unsubscribeDoc = onSnapshot(doc(db, 'users', user.uid), (userDoc) => {
          if (userDoc.exists()) {
            const data = userDoc.data();
            setUserData(data);
            setUserRole(data.role);
            setIsOnboarded(!!data.onboarded);
            
            // Auto-redirect to correct portal if they are logged in
            if (portal === 'public') {
              if (data.role === 'admin') {
                setPortal('admin');
                setCurrentView('admin');
              } else if (data.role === 'employee') {
                setPortal('staff');
                setCurrentView('schedule');
              } else {
                setPortal('customer');
                setCurrentView('customer');
              }
            }
          } else {
            setUserData(null);
            setUserRole(null);
            setIsOnboarded(false);
          }
          setLoading(false);
        }, (error) => {
          console.error("Error listening to user data:", error);
          setLoading(false);
        });
      } else {
        setUserData(null);
        setUserRole(null);
        setIsOnboarded(false);
        setPortal('public');
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeDoc) unsubscribeDoc();
    };
  }, []);

  const handleLogin = async (targetPortal: Portal) => {
    if (isLoggingIn) return;
    
    setIsLoggingIn(true);
    setAuthError(null);
    
    const provider = new GoogleAuthProvider();
    // Add custom parameters to help with popup issues in iframes
    provider.setCustomParameters({ prompt: 'select_account' });

    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      // Fetch user data to determine correct portal/view
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      let finalPortal = targetPortal;
      let finalView: any = 'landing';

      if (userDoc.exists()) {
        const data = userDoc.data();
        // If they are admin, they can go anywhere, but default to admin if they pick staff or public
        if (data.role === 'admin' && (targetPortal === 'public' || targetPortal === 'staff')) {
          finalPortal = 'admin';
        } else if (data.role === 'employee' && targetPortal === 'public') {
          finalPortal = 'staff';
        } else if (targetPortal === 'public') {
          finalPortal = 'customer';
        }
      }

      // Set default views
      if (finalPortal === 'admin') finalView = 'admin';
      else if (finalPortal === 'staff') finalView = 'schedule';
      else if (finalPortal === 'customer') finalView = 'customer';

      setPortal(finalPortal);
      setCurrentView(finalView);
      
    } catch (error: any) {
      console.error("Login failed:", error);
      if (error.code === 'auth/popup-blocked') {
        setAuthError("The login popup was blocked by your browser. Please allow popups for this site.");
      } else if (error.code === 'auth/cancelled-popup-request') {
        setAuthError("A login request was already in progress. Please wait.");
      } else if (error.code === 'auth/popup-closed-by-user') {
        setAuthError("The login window was closed before completion.");
      } else {
        setAuthError("An unexpected error occurred during login. Please try again.");
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setPortal('public');
    setCurrentView('landing');
    setPreSelectedService(null);
  };

  const renderPortal = () => {
    if (loading) return <div className="min-h-screen flex items-center justify-center uppercase tracking-widest text-xs">Syncing Portal...</div>;

    // Public Portal
    if (portal === 'public') {
      return (
        <>
          <PublicNavbar 
            onNavigate={(view) => { setCurrentView(view); if (view !== 'booking') setPreSelectedService(null); }} 
            onLogin={handleLogin} 
          />
          <main>
            {currentView === 'landing' ? (
              <>
                <Hero 
                  onBookNow={() => setCurrentView('booking')} 
                  onViewServices={() => {
                    const el = document.getElementById('services');
                    el?.scrollIntoView({ behavior: 'smooth' });
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
                onComplete={() => { setPortal('customer'); setPreSelectedService(null); }} 
              />
            ) : currentView === 'estimator' ? (
              <CostEstimator onBook={handleBookFromEstimator} />
            ) : currentView === 'selection' ? (
              <PortalSelection onSelect={handleLogin} isLoggingIn={isLoggingIn} error={authError} />
            ) : (
              <Hero 
                onBookNow={() => setCurrentView('booking')} 
                onViewServices={() => {
                  const el = document.getElementById('services');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
              />
            )}
          </main>
        </>
      );
    }

    // Auth Required Portals
    if (!user) {
      setPortal('public');
      return null;
    }

    // Onboarding Check
    if (!isOnboarded) {
      if (portal === 'customer') return <CustomerOnboarding onComplete={() => setIsOnboarded(true)} />;
      if (portal === 'staff') return <StaffOnboarding onComplete={() => setIsOnboarded(true)} />;
      if (portal === 'admin') return <AdminOnboarding onComplete={() => setIsOnboarded(true)} />;
    }

    // Role Mismatch Check
    if (portal === 'admin' && userRole !== 'admin') {
      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="max-w-md text-center">
            <AlertCircle className="mx-auto mb-4 text-red-500" size={48} />
            <h2 className="text-xl font-display uppercase mb-4">Access Denied</h2>
            <p className="text-charcoal/40 text-sm mb-8">You do not have administrative privileges.</p>
            <button onClick={() => setPortal('customer')} className="btn-primary">Return to Client Portal</button>
          </div>
        </div>
      );
    }

    if (portal === 'staff' && userRole !== 'employee' && userRole !== 'admin') {
      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="max-w-md text-center">
            <AlertCircle className="mx-auto mb-4 text-red-500" size={48} />
            <h2 className="text-xl font-display uppercase mb-4">Staff Only</h2>
            <p className="text-charcoal/40 text-sm mb-8">This portal is reserved for Crystalline Max employees.</p>
            <button onClick={() => setPortal('customer')} className="btn-primary">Return to Client Portal</button>
          </div>
        </div>
      );
    }

    // Render Portal Content
    return (
      <>
        {portal === 'customer' && <CustomerNavbar onNavigate={setCurrentView} user={user} onLogout={handleLogout} />}
        {portal === 'staff' && (
          <StaffNavbar 
            onNavigate={setCurrentView} 
            user={user} 
            onLogout={handleLogout} 
            onSwitchPortal={(p) => {
              setPortal(p);
              if (p === 'admin') setCurrentView('admin');
              else if (p === 'staff') setCurrentView('schedule');
              else if (p === 'customer') setCurrentView('customer');
            }} 
            userRole={userRole} 
          />
        )}
        {portal === 'admin' && <AdminNavbar onNavigate={setCurrentView} user={user} onLogout={handleLogout} />}
        
        <main>
          {portal === 'customer' && (
            currentView === 'booking' ? (
              <BookingFlow 
                initialServiceId={preSelectedService || undefined} 
                onComplete={() => { setCurrentView('customer'); setPreSelectedService(null); }} 
              />
            ) : currentView === 'profile' ? (
              <UserProfileEdit user={user} onBack={() => setCurrentView('customer')} />
            ) : <CustomerDashboard onNavigate={setCurrentView} user={user} userData={userData} />
          )}
          {portal === 'staff' && (
            currentView === 'checkin' ? <EmployeeCheckIn /> : 
            currentView === 'schedule' ? <StaffSchedule onNavigate={setCurrentView} /> :
            currentView === 'tasks' ? <StaffTasks onNavigate={setCurrentView} /> :
            <div className="pt-32 text-center uppercase tracking-widest text-xs text-white/40">
              {currentView} module coming soon
            </div>
          )}
          {portal === 'admin' && (
            currentView === 'admin' ? <AdminDashboard /> : 
            currentView === 'staff-mgmt' ? <AdminStaffManagement /> :
            currentView === 'settings' ? <AdminSettings /> :
            <div className="pt-32 text-center uppercase tracking-widest text-xs text-white/40">
              {currentView} module coming soon
            </div>
          )}
        </main>
      </>
    );
  };

  return (
    <div className={cn("min-h-screen relative overflow-hidden", portal === 'customer' ? "bg-white text-charcoal" : "bg-charcoal text-white")}>
      {/* Ambient Background Glows */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className={cn(
          "absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full blur-[180px] animate-pulse",
          portal === 'customer' ? "bg-teal/25" : "bg-teal/20"
        )} />
        <div className={cn(
          "absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full blur-[180px] animate-pulse",
          portal === 'customer' ? "bg-vibrant-blue/25" : "bg-vibrant-blue/20"
        )} style={{ animationDelay: '2s' }} />
        {portal === 'admin' && (
          <div className="absolute top-[30%] right-[10%] w-[40%] h-[40%] bg-purple-500/15 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
        )}
      </div>

      <div className="relative z-10">
        {renderPortal()}
      </div>

      <footer className={cn("py-20 border-t", portal === 'customer' ? "bg-charcoal text-white border-white/5" : "bg-black text-white border-white/5")}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-12">
            <div className="col-span-2">
              <h4 className="text-2xl mb-6">CRYSTALLINE MAX LTD</h4>
              <p className="text-white/40 text-sm max-w-sm leading-relaxed">
                Premium mobile car detailing and residential/commercial cleaning services based in Manchester. 
                Precision in every detail, excellence in every clean.
              </p>
            </div>
            <div>
              <h5 className="text-xs font-bold uppercase tracking-widest mb-6 text-teal">Contact</h5>
              <p className="text-sm text-white/60">info@crystallinemax.co.uk</p>
              <p className="text-sm text-white/60">+44 (0) 161 123 4567</p>
            </div>
            <div>
              <h5 className="text-xs font-bold uppercase tracking-widest mb-6 text-teal">Location</h5>
              <p className="text-sm text-white/60">Manchester Hub</p>
              <p className="text-sm text-white/60">Salford, M5 4WT</p>
            </div>
          </div>
          <div className="mt-20 pt-8 border-t border-white/5 flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-white/20">
            <p>© 2026 CRYSTALLINE MAX LTD. ALL RIGHTS RESERVED.</p>
            <div className="flex gap-8">
              <a href="#" className="hover:text-teal transition-colors">Privacy</a>
              <a href="#" className="hover:text-teal transition-colors">Terms</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
