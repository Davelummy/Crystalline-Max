import React from 'react';
import { ArrowRight, BadgeCheck, Briefcase, Lock, Mail } from 'lucide-react';
import { AuthPortalLayout } from './AuthPortalLayout';

interface StaffLoginPageProps {
  onBack: () => void;
  onLogin: (email: string, password: string) => void;
  onCreateAccount: () => void;
  isLoggingIn?: boolean;
  error?: string | null;
}

export const StaffLoginPage: React.FC<StaffLoginPageProps> = ({
  onBack,
  onLogin,
  onCreateAccount,
  isLoggingIn,
  error,
}) => {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onLogin(email, password);
  };

  return (
    <AuthPortalLayout
      badge="Staff Portal"
      title="Staff Sign In"
      description="Existing staff sign in with their company email and password. New employees should create their account using the employee ID issued by the boss."
      error={error}
      onBack={onBack}
      backLabel="Back to Portals"
      aside={(
        <div className="space-y-4 text-[10px] uppercase tracking-widest font-bold text-white/68">
          <div className="flex items-center gap-3">
            <Briefcase size={14} className="text-teal" />
            Company email only
          </div>
          <div className="flex items-center gap-3">
            <BadgeCheck size={14} className="text-teal" />
            New staff need an employee ID
          </div>
        </div>
      )}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-widest text-white/68 mb-2">
            Company Email
          </label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/45" size={16} />
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="name@crystallinemax.co.uk"
              className="input-field bg-white/5 border-white/10 text-white pl-12 focus:border-teal"
              autoCapitalize="none"
              autoCorrect="off"
            />
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-bold uppercase tracking-widest text-white/68 mb-2">
            Password
          </label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/45" size={16} />
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your password"
              className="input-field bg-white/5 border-white/10 text-white pl-12 focus:border-teal"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={!email || !password || isLoggingIn}
          className="btn-primary w-full flex items-center justify-center gap-3 disabled:opacity-50"
        >
          {isLoggingIn ? 'SIGNING IN...' : 'ENTER STAFF PORTAL'}
          <ArrowRight size={18} />
        </button>

        <button
          type="button"
          onClick={onCreateAccount}
          className="btn-secondary w-full border-white/20"
        >
          CREATE STAFF ACCOUNT
        </button>
      </form>
    </AuthPortalLayout>
  );
};
