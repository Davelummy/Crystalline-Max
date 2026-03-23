import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Briefcase, ShieldCheck, UserRound } from 'lucide-react';

interface PortalSelectionProps {
  onSelectCustomer: () => void;
  onSelectStaff: () => void;
  onSelectAdmin: () => void;
}

export const PortalSelection: React.FC<PortalSelectionProps> = ({
  onSelectCustomer,
  onSelectStaff,
  onSelectAdmin,
}) => {
  const portals = [
    {
      label: 'Client Portal',
      description: 'Customer login with Google to manage bookings and billing.',
      icon: UserRound,
      action: onSelectCustomer,
    },
    {
      label: 'Staff Portal',
      description: 'Company email login for existing staff, plus separate account creation with employee ID.',
      icon: Briefcase,
      action: onSelectStaff,
    },
    {
      label: 'Admin Portal',
      description: 'Manual admin login for boss-level access and employee ID issuance.',
      icon: ShieldCheck,
      action: onSelectAdmin,
    },
  ] as const;

  return (
    <div className="min-h-screen bg-charcoal px-4 pt-28 pb-16">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-teal text-[10px] font-bold uppercase tracking-[0.35em] mb-4">Portal Access</p>
          <h1 className="text-4xl md:text-6xl text-white font-display uppercase tracking-wider mb-6">
            Choose Your Login
          </h1>
          <p className="text-white/45 max-w-2xl mx-auto text-sm md:text-base leading-relaxed">
            Each login flow now has its own dedicated page. Pick the portal you need and continue there.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {portals.map((portal, index) => (
            <motion.button
              key={portal.label}
              type="button"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.06 }}
              onClick={portal.action}
              className="dark-card p-8 border-white/5 hover:border-teal/40 transition-all text-left group"
            >
              <div className="w-14 h-14 rounded-2xl border border-teal/20 bg-teal/10 text-teal flex items-center justify-center mb-6 group-hover:bg-teal group-hover:text-charcoal transition-colors">
                <portal.icon size={26} />
              </div>
              <h2 className="text-2xl font-display uppercase tracking-wider text-white mb-4">{portal.label}</h2>
              <p className="text-sm text-white/45 leading-relaxed mb-8">{portal.description}</p>
              <div className="inline-flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-teal">
                Continue <ArrowRight size={16} />
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
};
