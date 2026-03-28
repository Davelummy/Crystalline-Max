import React from 'react';
import { ArrowLeft, BadgeCheck, Briefcase, Mail, MapPin, Phone, User } from 'lucide-react';
import { doc, onSnapshot, serverTimestamp, updateDoc } from 'firebase/firestore';
import { useNavigate, useParams } from 'react-router-dom';
import { db } from '../firebase';
import type { AppUserData } from '../types';

export const AdminStaffProfile: React.FC = () => {
  const { staffId } = useParams<{ staffId: string }>();
  const navigate = useNavigate();
  const [member, setMember] = React.useState<AppUserData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [salaryForm, setSalaryForm] = React.useState({ allocation: '', currency: 'GBP' });
  const [isSavingSalary, setIsSavingSalary] = React.useState(false);
  const [salaryStatus, setSalaryStatus] = React.useState<string | null>(null);
  const [salaryError, setSalaryError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!staffId) return;
    const unsubscribe = onSnapshot(doc(db, 'users', staffId), (snapshot) => {
      if (snapshot.exists()) {
        setMember(snapshot.data() as AppUserData);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, [staffId]);

  React.useEffect(() => {
    if (!member) return;
    setSalaryForm({
      allocation: member.salaryAllocation?.toString() ?? '',
      currency: member.salaryCurrency || 'GBP',
    });
  }, [member]);

  const handleSalarySave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!member) return;
    const allocationValue = parseFloat(salaryForm.allocation);
    setIsSavingSalary(true);
    setSalaryStatus(null);
    setSalaryError(null);
    try {
      await updateDoc(doc(db, 'users', member.uid), {
        salaryAllocation: Number.isNaN(allocationValue) ? null : allocationValue,
        salaryCurrency: salaryForm.currency.trim() || 'GBP',
        updatedAt: serverTimestamp(),
      });
      setSalaryStatus('Payroll info saved.');
    } catch {
      setSalaryError('Could not save payroll data. Try again.');
    } finally {
      setIsSavingSalary(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-charcoal flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-teal/20 border-t-teal animate-spin" />
      </div>
    );
  }

  if (!member) {
    return (
      <div className="min-h-screen bg-charcoal flex items-center justify-center">
        <div className="text-center">
          <p className="text-white/60 text-sm mb-6">Staff record not found.</p>
          <button onClick={() => navigate('/admin/staff')} className="btn-secondary">
            Back to staff
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-charcoal pt-32 pb-20 px-4">
      <div className="max-w-3xl mx-auto">
        <button
          type="button"
          onClick={() => navigate('/admin/staff')}
          className="flex items-center gap-2 text-white/55 hover:text-teal transition-colors text-[10px] uppercase tracking-widest font-bold mb-10"
        >
          <ArrowLeft size={14} />
          Staff Management
        </button>

        <header className="flex items-center gap-6 mb-12">
          <div className="w-20 h-20 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
            <User size={32} className="text-teal" />
          </div>
          <div>
            <h2 className="text-teal text-xs tracking-[0.4em] mb-2 uppercase">Employment Record</h2>
            <h3 className="text-3xl text-white font-display uppercase">{member.displayName || member.email}</h3>
            <p className="text-white/55 text-[10px] uppercase tracking-widest font-bold mt-1">
              {member.position || 'Field Specialist'} &nbsp;·&nbsp; {member.employeeId || 'No ID'}
            </p>
          </div>
        </header>

        <div className="space-y-6">
          {/* Identity & Contact */}
          <div className="dark-card p-6 border-white/5">
            <div className="flex items-center gap-2 mb-6">
              <Phone size={14} className="text-teal" />
              <p className="text-[10px] uppercase tracking-widest text-white/60 font-bold">Identity &amp; Contact</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Full name</p>
                <p className="text-white font-bold text-sm">{member.displayName || '—'}</p>
              </div>
              <div className="col-span-2 md:col-span-1">
                <p className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Email</p>
                <div className="flex items-center gap-2">
                  <Mail size={12} className="text-teal/60 shrink-0" />
                  <p className="text-white font-bold text-sm break-all">{member.email}</p>
                </div>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Phone</p>
                <div className="flex items-center gap-2">
                  <Phone size={12} className="text-teal/60" />
                  <p className="text-white font-bold text-sm">{member.phoneNumber || '—'}</p>
                </div>
              </div>
              {(member.address || member.city || member.postcode) && (
                <div className="col-span-2 md:col-span-3">
                  <p className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Address</p>
                  <div className="flex items-center gap-2">
                    <MapPin size={12} className="text-teal/60 shrink-0" />
                    <p className="text-white font-bold text-sm">
                      {[member.address, member.city, member.postcode].filter(Boolean).join(', ')}
                    </p>
                  </div>
                </div>
              )}
              {!member.address && !member.city && member.postcode && (
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Postcode</p>
                  <p className="text-white font-bold text-sm">{member.postcode}</p>
                </div>
              )}
            </div>
          </div>

          {/* Employment Details */}
          <div className="dark-card p-6 border-white/5">
            <div className="flex items-center gap-2 mb-6">
              <BadgeCheck size={14} className="text-teal" />
              <p className="text-[10px] uppercase tracking-widest text-white/60 font-bold">Employment Details</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Employee ID</p>
                <p className="text-teal font-bold uppercase">{member.employeeId || 'Unassigned'}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Position</p>
                <p className="text-white font-bold text-sm">{member.position || '—'}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Experience</p>
                <p className="text-white font-bold text-sm">{member.experience ? `${member.experience} yrs` : '—'}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Onboarding</p>
                <p className={`font-bold text-sm ${member.onboarded ? 'text-teal' : 'text-amber-400'}`}>
                  {member.onboarded ? 'Complete' : 'Pending'}
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Role</p>
                <p className="text-white font-bold text-sm capitalize">{member.role}</p>
              </div>
            </div>
          </div>

          {/* Bio */}
          {member.bio && (
            <div className="dark-card p-6 border-white/5">
              <div className="flex items-center gap-2 mb-4">
                <User size={14} className="text-teal" />
                <p className="text-[10px] uppercase tracking-widest text-white/60 font-bold">Bio</p>
              </div>
              <p className="text-white/70 text-sm leading-relaxed">{member.bio}</p>
            </div>
          )}

          {/* Payroll */}
          <div className="dark-card p-6 border-white/5">
            <div className="flex items-center gap-2 mb-6">
              <Briefcase size={14} className="text-teal" />
              <p className="text-[10px] uppercase tracking-widest text-white/60 font-bold">Payroll</p>
            </div>
            <form onSubmit={handleSalarySave} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-white/40 mb-2">
                    Salary allocation
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={salaryForm.allocation}
                    onChange={(e) => setSalaryForm((c) => ({ ...c, allocation: e.target.value }))}
                    placeholder={member.salaryAllocation?.toString() ?? '0.00'}
                    className="input-field text-charcoal bg-white/90 border-white/20"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-white/40 mb-2">
                    Currency
                  </label>
                  <input
                    type="text"
                    value={salaryForm.currency}
                    onChange={(e) => setSalaryForm((c) => ({ ...c, currency: e.target.value }))}
                    className="input-field text-charcoal bg-white/90 border-white/20"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={isSavingSalary}
                className="btn-primary disabled:opacity-50"
              >
                {isSavingSalary ? 'Saving...' : 'Update Payroll'}
              </button>
              {salaryStatus && <p className="text-[10px] text-teal uppercase tracking-widest">{salaryStatus}</p>}
              {salaryError && <p className="text-[10px] text-red-500 uppercase tracking-widest">{salaryError}</p>}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
