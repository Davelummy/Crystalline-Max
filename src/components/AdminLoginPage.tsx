import React from 'react';
import { ArrowRight, Lock, Mail, ShieldCheck } from 'lucide-react';
import { AuthPortalLayout } from './AuthPortalLayout';

interface AdminLoginPageProps {
  onBack: () => void;
  onLogin: (email: string, password: string) => void;
  isLoggingIn?: boolean;
  error?: string | null;
}

export const AdminLoginPage: React.FC<AdminLoginPageProps> = ({
  onBack,
  onLogin,
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
      badge="Admin Portal"
      title="Admin Sign In"
      description="Admin access is restricted to manually provisioned accounts. The email must exist in Firebase Authentication and the matching Firestore user document must have role admin."
      error={error}
      onBack={onBack}
      backLabel="Back to Portals"
      aside={(
        <div className="space-y-4 text-[10px] uppercase tracking-widest font-bold text-white/35">
          <div className="flex items-center gap-3">
            <ShieldCheck size={14} className="text-teal" />
            Manual admin provisioning only
          </div>
          <div className="flex items-center gap-3">
            <Mail size={14} className="text-teal" />
            Company email required
          </div>
        </div>
      )}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">
            Company Email
          </label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={16} />
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="admin@crystallinemax.co.uk"
              className="input-field bg-white/5 border-white/10 text-white pl-12 focus:border-teal"
              autoCapitalize="none"
              autoCorrect="off"
            />
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">
            Password
          </label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={16} />
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
          {isLoggingIn ? 'SIGNING IN...' : 'ENTER ADMIN PORTAL'}
          <ArrowRight size={18} />
        </button>
      </form>
    </AuthPortalLayout>
  );
};
