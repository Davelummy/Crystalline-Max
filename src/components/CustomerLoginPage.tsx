import React from 'react';
import { ArrowRight, Mail, ShieldCheck, UserRound } from 'lucide-react';
import { AuthPortalLayout } from './AuthPortalLayout';
import { getClientStayLoggedInPreference, getSavedClientEmailForSignIn, isClientEmailSignInLink } from '@/lib/auth';
import type { UserRole } from '@/types';

interface CustomerLoginPageProps {
  onBack: () => void;
  onLogin: (stayLoggedIn: boolean) => void;
  onEmailLinkRequest: (email: string, stayLoggedIn: boolean) => Promise<boolean>;
  onEmailLinkComplete: (email: string) => Promise<boolean>;
  isLoggingIn?: boolean;
  error?: string | null;
  activeSessionEmail?: string | null;
  activeSessionRole?: UserRole | null;
}

export const CustomerLoginPage: React.FC<CustomerLoginPageProps> = ({
  onBack,
  onLogin,
  onEmailLinkRequest,
  onEmailLinkComplete,
  isLoggingIn,
  error,
  activeSessionEmail,
  activeSessionRole,
}) => {
  const [stayLoggedIn, setStayLoggedIn] = React.useState(getClientStayLoggedInPreference());
  const [email, setEmail] = React.useState(getSavedClientEmailForSignIn() || '');
  const [emailStatus, setEmailStatus] = React.useState<string | null>(null);
  const isEmailLink = isClientEmailSignInLink();

  const handleEmailRequest = async (event: React.FormEvent) => {
    event.preventDefault();
    setEmailStatus(null);

    const sent = await onEmailLinkRequest(email, stayLoggedIn);
    if (sent) {
      setEmailStatus('Check your inbox for a secure Crystalline Max sign-in link.');
    }
  };

  const handleEmailComplete = async (event: React.FormEvent) => {
    event.preventDefault();
    setEmailStatus(null);
    await onEmailLinkComplete(email);
  };

  return (
    <AuthPortalLayout
      badge="Client Portal"
      title="Customer Sign In"
      description="Customers sign in with Google or a secure email link to manage bookings, billing, and profile details."
      error={error}
      onBack={onBack}
      backLabel="Back to Portals"
      aside={(
        <div className="space-y-4 text-[10px] uppercase tracking-widest font-bold text-white/68">
          <div className="flex items-center gap-3">
            <ShieldCheck size={14} className="text-teal" />
            Secure Google and email-link sign-in
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

        <div className="flex items-center gap-4">
          <div className="h-px flex-1 bg-white/10" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-white/45">or</span>
          <div className="h-px flex-1 bg-white/10" />
        </div>

        <form onSubmit={isEmailLink ? handleEmailComplete : handleEmailRequest} className="space-y-4">
          <div>
            <h2 className="text-lg font-display uppercase tracking-widest text-white mb-3">
              {isEmailLink ? 'Complete Email Sign In' : 'Continue With Email'}
            </h2>
            <p className="text-sm text-white/68 leading-relaxed">
              {isEmailLink
                ? 'Confirm the same email address you used to request this secure link.'
                : 'We will email you a one-time secure link. No password required.'}
            </p>
          </div>

          <label className="block">
            <span className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-white/55">
              Email address
            </span>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/45" size={16} />
              <input
                required
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-4 pl-12 text-sm text-white placeholder:text-white/30 outline-none transition-colors focus:border-teal/50"
              />
            </div>
          </label>

          <button
            type="submit"
            disabled={isLoggingIn}
            className="w-full rounded-xl border border-teal/25 bg-teal/10 px-4 py-4 text-[10px] font-bold uppercase tracking-widest text-teal transition-colors hover:bg-teal hover:text-charcoal disabled:opacity-50"
          >
            {isLoggingIn
              ? 'PLEASE WAIT...'
              : isEmailLink
                ? 'VERIFY EMAIL AND ENTER'
                : 'EMAIL ME A SECURE LINK'}
          </button>

          {emailStatus && (
            <p className="rounded-xl border border-teal/20 bg-teal/10 px-4 py-3 text-xs font-bold uppercase tracking-widest text-teal">
              {emailStatus}
            </p>
          )}
        </form>

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
