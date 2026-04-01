import React from 'react';
import { ArrowRight, ShieldCheck, UserRound } from 'lucide-react';
import { AuthPortalLayout } from './AuthPortalLayout';
import { getClientStayLoggedInPreference } from '@/lib/auth';
import type { UserRole } from '@/types';

interface CustomerLoginPageProps {
  onBack: () => void;
  onLogin: (stayLoggedIn: boolean) => void;
  isLoggingIn?: boolean;
  error?: string | null;
  activeSessionEmail?: string | null;
  activeSessionRole?: UserRole | null;
}

export const CustomerLoginPage: React.FC<CustomerLoginPageProps> = ({
  onBack,
  onLogin,
  isLoggingIn,
  error,
  activeSessionEmail,
  activeSessionRole,
}) => {
  const [stayLoggedIn, setStayLoggedIn] = React.useState(getClientStayLoggedInPreference());

  return (
    <AuthPortalLayout
      badge="Client Portal"
      title="Customer Sign In"
      description="Customers sign in with Google to manage bookings, billing, and profile details."
      error={error}
      onBack={onBack}
      backLabel="Back to Portals"
      aside={(
        <div className="space-y-4 text-[10px] uppercase tracking-widest font-bold text-white/68">
          <div className="flex items-center gap-3">
            <ShieldCheck size={14} className="text-teal" />
            Secure Google sign-in
          </div>
          <div className="flex items-center gap-3">
            <UserRound size={14} className="text-teal" />
            Customer dashboard access
          </div>
        </div>
      )}
    >
      <div className="space-y-6">
        {activeSessionEmail && activeSessionRole && activeSessionRole !== 'client' && (
          <div className="rounded-2xl border border-amber-500/25 bg-amber-500/10 p-4 text-xs uppercase tracking-widest text-amber-700">
            Active {activeSessionRole} session detected ({activeSessionEmail}). Continue with Google to switch into a customer account.
          </div>
        )}

        <div>
          <h2 className="text-lg font-display uppercase tracking-widest text-white mb-3">Continue With Google</h2>
          <p className="text-sm text-white/68 leading-relaxed">
            Use the Google account you want attached to your customer bookings.
          </p>
        </div>

        <button
          type="button"
          onClick={() => onLogin(stayLoggedIn)}
          disabled={isLoggingIn}
          className="btn-primary w-full flex items-center justify-center gap-3 disabled:opacity-50"
        >
          {isLoggingIn ? 'SIGNING IN...' : 'ENTER CLIENT PORTAL'}
          <ArrowRight size={18} />
        </button>

        <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left">
          <input
            type="checkbox"
            checked={stayLoggedIn}
            onChange={(event) => setStayLoggedIn(event.target.checked)}
            className="h-4 w-4 accent-teal"
          />
          <span className="text-[10px] font-bold uppercase tracking-widest text-white/72">
            Stay logged in on this device
          </span>
        </label>
        <p className="text-[10px] uppercase tracking-widest text-white/55">
          If left unchecked, inactivity signs you out automatically.
        </p>
      </div>
    </AuthPortalLayout>
  );
};
