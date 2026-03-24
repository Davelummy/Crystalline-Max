import React from 'react';
import { ArrowRight, ShieldCheck, UserRound } from 'lucide-react';
import { AuthPortalLayout } from './AuthPortalLayout';

interface CustomerLoginPageProps {
  onBack: () => void;
  onLogin: () => void;
  isLoggingIn?: boolean;
  error?: string | null;
}

export const CustomerLoginPage: React.FC<CustomerLoginPageProps> = ({
  onBack,
  onLogin,
  isLoggingIn,
  error,
}) => {
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
        <div>
          <h2 className="text-lg font-display uppercase tracking-widest text-white mb-3">Continue With Google</h2>
          <p className="text-sm text-white/68 leading-relaxed">
            Use the Google account you want attached to your customer bookings.
          </p>
        </div>

        <button
          type="button"
          onClick={onLogin}
          disabled={isLoggingIn}
          className="btn-primary w-full flex items-center justify-center gap-3 disabled:opacity-50"
        >
          {isLoggingIn ? 'SIGNING IN...' : 'ENTER CLIENT PORTAL'}
          <ArrowRight size={18} />
        </button>
      </div>
    </AuthPortalLayout>
  );
};
