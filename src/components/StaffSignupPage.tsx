import React from 'react';
import { ArrowRight, BadgeCheck, Lock, Mail } from 'lucide-react';
import { AuthPortalLayout } from './AuthPortalLayout';

interface StaffSignupPageProps {
  onBack: () => void;
  onSignup: (employeeId: string, email: string, password: string) => void;
  onGoToLogin: () => void;
  isLoggingIn?: boolean;
  error?: string | null;
}

export const StaffSignupPage: React.FC<StaffSignupPageProps> = ({
  onBack,
  onSignup,
  onGoToLogin,
  isLoggingIn,
  error,
}) => {
  const [employeeId, setEmployeeId] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onSignup(employeeId, email, password);
  };

  return (
    <AuthPortalLayout
      badge="Staff Signup"
      title="Create Staff Account"
      description="Use the employee ID issued by the boss plus your company email to create your staff account."
      error={error}
      onBack={onBack}
      backLabel="Back to Portals"
      aside={(
        <div className="space-y-4 text-[10px] uppercase tracking-widest font-bold text-white/68">
          <div className="flex items-center gap-3">
            <BadgeCheck size={14} className="text-teal" />
            Employee ID required
          </div>
          <div className="flex items-center gap-3">
            <Mail size={14} className="text-teal" />
            Use your company email
          </div>
        </div>
      )}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-widest text-white/68 mb-2">
            Employee ID
          </label>
          <div className="relative">
            <BadgeCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60" size={16} />
            <input
              type="text"
              value={employeeId}
              onChange={(event) => setEmployeeId(event.target.value.toUpperCase())}
              placeholder="CMX-ABC123"
              className="input-field bg-white/5 border-white/10 text-white pl-12 focus:border-teal"
              autoCapitalize="characters"
              autoCorrect="off"
            />
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-bold uppercase tracking-widest text-white/68 mb-2">
            Company Email
          </label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60" size={16} />
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="name@ctmds.co.uk"
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
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60" size={16} />
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Create your password"
              className="input-field bg-white/5 border-white/10 text-white pl-12 focus:border-teal"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={!employeeId || !email || !password || isLoggingIn}
          className="btn-primary w-full flex items-center justify-center gap-3 disabled:opacity-50"
        >
          {isLoggingIn ? 'CREATING ACCOUNT...' : 'CREATE STAFF ACCOUNT'}
          <ArrowRight size={18} />
        </button>

        <button
          type="button"
          onClick={onGoToLogin}
          className="btn-secondary w-full border-white/20"
        >
          BACK TO STAFF LOGIN
        </button>
      </form>
    </AuthPortalLayout>
  );
};
