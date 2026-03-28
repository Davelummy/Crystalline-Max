import React from 'react';
import {
  BadgeCheck,
  CheckCircle2,
  Clock,
  Copy,
  Mail,
  MapPin,
  Search,
  ShieldCheck,
  Star,
  UserPlus,
  Users,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { collection, doc, getDoc, onSnapshot, query, serverTimestamp, setDoc, updateDoc, where } from 'firebase/firestore';
import { db } from '../firebase';
import { formatSchedule, getAssignedStaffIds, getAssignedStaffLabel, getStatusLabel, sortBookingsBySchedule } from '../lib/bookings';
import type { AppUserData, BookingRecord, EmployeeInvite } from '../types';

async function generateUniqueEmployeeId() {
  let attempts = 0;

  while (attempts < 10) {
    const candidate = `CMX-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    const existingInvite = await getDoc(doc(db, 'employeeInvites', candidate));

    if (!existingInvite.exists()) {
      return candidate;
    }

    attempts += 1;
  }

  throw new Error('Could not generate a unique employee ID. Try again.');
}

export const AdminStaffManagement: React.FC = () => {
  const navigate = useNavigate();
  const [staff, setStaff] = React.useState<AppUserData[]>([]);
  const [bookings, setBookings] = React.useState<BookingRecord[]>([]);
  const [invites, setInvites] = React.useState<EmployeeInvite[]>([]);
  const [search, setSearch] = React.useState('');
  const [inviteForm, setInviteForm] = React.useState({
    displayName: '',
    email: '',
    position: 'field-operator',
  });
  const [inviteStatus, setInviteStatus] = React.useState<string | null>(null);
  const [inviteError, setInviteError] = React.useState<string | null>(null);
  const [isCreatingInvite, setIsCreatingInvite] = React.useState(false);
  const [selectedStaffId, setSelectedStaffId] = React.useState<string | null>(null);
  const [salaryForm, setSalaryForm] = React.useState({ allocation: '', currency: 'GBP' });
  const [salaryStatus, setSalaryStatus] = React.useState<string | null>(null);
  const [salaryError, setSalaryError] = React.useState<string | null>(null);
  const [isSavingSalary, setIsSavingSalary] = React.useState(false);

  React.useEffect(() => {
    const staffQuery = query(collection(db, 'users'), where('role', '==', 'employee'));
    const bookingsQuery = query(collection(db, 'bookings'));
    const invitesQuery = query(collection(db, 'employeeInvites'));

    const unsubStaff = onSnapshot(staffQuery, (snapshot) => {
      setStaff(snapshot.docs.map((entry) => entry.data() as AppUserData));
    });
    const unsubBookings = onSnapshot(bookingsQuery, (snapshot) => {
      setBookings(snapshot.docs.map((entry) => ({
        id: entry.id,
        ...(entry.data() as Omit<BookingRecord, 'id'>),
      })));
    });
    const unsubInvites = onSnapshot(invitesQuery, (snapshot) => {
      setInvites(snapshot.docs.map((entry) => entry.data() as EmployeeInvite));
    });

    return () => {
      unsubStaff();
      unsubBookings();
      unsubInvites();
    };
  }, []);

  const filteredStaff = staff.filter((member) => {
    const label = `${member.displayName || ''} ${member.email || ''} ${member.position || ''} ${member.employeeId || ''}`.toLowerCase();
    return label.includes(search.toLowerCase());
  });

  const recentInvites = React.useMemo(
    () => [...invites].sort((left, right) => left.employeeId.localeCompare(right.employeeId)).slice(0, 8),
    [invites],
  );
  const selectedStaff = React.useMemo(() => {
    if (!staff.length) {
      return null;
    }
    if (selectedStaffId) {
      const focused = staff.find((member) => member.uid === selectedStaffId);
      if (focused) return focused;
    }
    return staff[0];
  }, [staff, selectedStaffId]);

  React.useEffect(() => {
    if (!selectedStaffId && staff.length) {
      setSelectedStaffId(staff[0].uid);
    }
  }, [staff, selectedStaffId]);

  React.useEffect(() => {
    if (!selectedStaff) {
      setSalaryForm({ allocation: '', currency: 'GBP' });
      return;
    }

    setSalaryForm({
      allocation: selectedStaff.salaryAllocation?.toString() ?? '',
      currency: selectedStaff.salaryCurrency || 'GBP',
    });
    setSalaryStatus(null);
    setSalaryError(null);
  }, [selectedStaff]);

  const manageableBookings = sortBookingsBySchedule(
    bookings.filter((booking) => booking.status !== 'cancelled'),
  );

  const selectedStaffHistory = React.useMemo(() => {
    if (!selectedStaff) {
      return [];
    }

    const staffId = selectedStaff.uid;
    const relevant = manageableBookings.filter((booking) => {
      if (booking.assignedStaffId === staffId) {
        return true;
      }

      if (booking.assignedStaffIds && booking.assignedStaffIds.includes(staffId)) {
        return true;
      }

      return false;
    });

    return relevant.slice(-5).reverse();
  }, [manageableBookings, selectedStaff]);

  const handleAssign = async (bookingId: string, staffMember: AppUserData | null) => {
    await updateDoc(doc(db, 'bookings', bookingId), {
      assignedStaffId: staffMember?.uid || null,
      assignedStaffName: staffMember?.displayName || staffMember?.email || null,
      assignedStaffIds: staffMember ? [staffMember.uid] : [],
      assignedStaffNames: staffMember ? [staffMember.displayName || staffMember.email] : [],
      status: staffMember ? 'confirmed' : 'pending',
      assignedAt: staffMember ? serverTimestamp() : null,
      staffAcknowledgedAt: null,
      staffAcknowledgedByIds: [],
      updatedAt: serverTimestamp(),
    });
  };

  const handleCancelBooking = async (bookingId: string) => {
    if (!window.confirm('Cancel this booking? This cannot be undone.')) {
      return;
    }

    await updateDoc(doc(db, 'bookings', bookingId), {
      status: 'cancelled',
      cancelledBy: 'admin',
      cancelledAt: serverTimestamp(),
      assignedStaffId: null,
      assignedStaffName: null,
      assignedStaffIds: [],
      assignedStaffNames: [],
      assignedAt: null,
      staffAcknowledgedAt: null,
      staffAcknowledgedByIds: [],
      updatedAt: serverTimestamp(),
    });
  };

  const handleSalarySave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedStaff) {
      setSalaryError('Select a staff member before saving payroll info.');
      return;
    }

    const allocationValue = parseFloat(salaryForm.allocation);
    setIsSavingSalary(true);
    setSalaryStatus(null);
    setSalaryError(null);

    try {
      await updateDoc(doc(db, 'users', selectedStaff.uid), {
        salaryAllocation: Number.isNaN(allocationValue) ? null : allocationValue,
        salaryCurrency: salaryForm.currency.trim() || 'GBP',
        updatedAt: serverTimestamp(),
      });
      setSalaryStatus('Payroll info saved.');
    } catch (error) {
      console.error('Failed to save salary allocation:', error);
      setSalaryError('Could not save payroll data. Try again.');
    } finally {
      setIsSavingSalary(false);
    }
  };

  const handleCreateInvite = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsCreatingInvite(true);
    setInviteStatus(null);
    setInviteError(null);

    try {
      const employeeId = await generateUniqueEmployeeId();
      const normalizedEmail = inviteForm.email.trim().toLowerCase();

      await setDoc(doc(db, 'employeeInvites', employeeId), {
        employeeId,
        displayName: inviteForm.displayName.trim(),
        email: normalizedEmail,
        position: inviteForm.position,
        claimed: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      setInviteStatus(`Employee ID generated: ${employeeId}`);
      setInviteForm({
        displayName: '',
        email: '',
        position: 'field-operator',
      });
    } catch (error) {
      console.error('Failed to create employee invite:', error);
      setInviteError('Employee ID could not be generated. Check Firestore permissions and try again.');
    } finally {
      setIsCreatingInvite(false);
    }
  };

  const copyInvite = async (employeeId: string) => {
    if (!navigator.clipboard) {
      setInviteError('Clipboard access is not available in this browser.');
      return;
    }

    try {
      await navigator.clipboard.writeText(employeeId);
      setInviteStatus(`Copied ${employeeId} to clipboard.`);
      setInviteError(null);
    } catch (error) {
      console.error('Failed to copy employee ID:', error);
      setInviteError('Copy failed. You can still share the employee ID manually.');
    }
  };

  const getAssignedCount = (staffId: string) => bookings.filter((booking) => getAssignedStaffIds(booking).includes(staffId)).length;

  return (
    <div className="min-h-screen bg-charcoal pt-32 pb-20 px-4">
      <div className="max-w-6xl mx-auto">
        <header className="mb-12 flex flex-wrap justify-between items-end gap-6">
          <div>
            <h2 className="text-teal text-xs tracking-[0.4em] mb-4 uppercase">Human Resources</h2>
            <h3 className="text-4xl text-white font-display uppercase">Staff Management</h3>
            <p className="text-white/60 mt-2 uppercase tracking-widest text-xs font-bold">Issue employee IDs, review team records, and assign work</p>
          </div>
          <div className="flex gap-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/55" size={18} />
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search staff..."
                className="bg-white/5 border border-white/10 rounded-custom pl-12 pr-6 py-3 text-sm text-white focus:border-teal/50 outline-none transition-all"
              />
            </div>
            <div className="btn-secondary flex items-center gap-2 px-6 py-3 cursor-default">
              <UserPlus size={18} /> {staff.length} STAFF
            </div>
          </div>
        </header>

        <div className="grid gap-8">
          <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-8">
            <div className="dark-card p-6 border-white/5">
              <h4 className="text-xs font-bold uppercase tracking-widest text-white/60 mb-6">Create Staff Employee ID</h4>
              <form onSubmit={handleCreateInvite} className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-white/60 mb-2">
                    Staff Name
                  </label>
                  <input
                    type="text"
                    value={inviteForm.displayName}
                    onChange={(event) => setInviteForm((current) => ({ ...current, displayName: event.target.value }))}
                    placeholder="Amina Yusuf"
                    className="input-field bg-white/5 border-white/10 text-white focus:border-teal"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-white/60 mb-2">
                    Reserved Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/55" size={16} />
                    <input
                      type="email"
                      value={inviteForm.email}
                      onChange={(event) => setInviteForm((current) => ({ ...current, email: event.target.value }))}
                      placeholder="optional@ctmds.co.uk"
                      className="input-field bg-white/5 border-white/10 text-white pl-12 focus:border-teal"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-white/60 mb-2">
                    Position
                  </label>
                  <select
                    value={inviteForm.position}
                    onChange={(event) => setInviteForm((current) => ({ ...current, position: event.target.value }))}
                    className="input-field bg-white/5 border-white/10 text-white focus:border-teal"
                  >
                    <option value="field-operator" className="bg-charcoal text-white">Field Operator</option>
                    <option value="detailing" className="bg-charcoal text-white">Master Detailer</option>
                    <option value="commercial" className="bg-charcoal text-white">Commercial Specialist</option>
                    <option value="residential" className="bg-charcoal text-white">Residential Specialist</option>
                  </select>
                </div>

                <div className="flex items-end">
                  <button
                    type="submit"
                    disabled={isCreatingInvite}
                    className="btn-primary w-full flex items-center justify-center gap-3 disabled:opacity-50"
                  >
                    <BadgeCheck size={18} />
                    {isCreatingInvite ? 'GENERATING...' : 'ISSUE EMPLOYEE ID'}
                  </button>
                </div>
              </form>

              <div className="mt-4 min-h-6">
                {inviteStatus && (
                  <p className="text-[10px] uppercase tracking-widest text-teal font-bold">{inviteStatus}</p>
                )}
                {inviteError && (
                  <p className="text-[10px] uppercase tracking-widest text-red-500 font-bold">{inviteError}</p>
                )}
              </div>
            </div>

            <div className="dark-card p-6 border-white/5">
              <h4 className="text-xs font-bold uppercase tracking-widest text-white/60 mb-6">Recent Employee IDs</h4>
              <div className="space-y-4">
                {recentInvites.length > 0 ? recentInvites.map((invite) => (
                  <div key={invite.employeeId} className="rounded-2xl border border-white/5 bg-white/5 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-white">
                          {invite.displayName || 'Unnamed Staff Invite'}
                        </p>
                        <p className="text-[10px] uppercase tracking-widest text-teal mt-2">{invite.employeeId}</p>
                        <p className="text-[10px] uppercase tracking-widest text-white/60 mt-2">
                          {invite.email || 'Any company email can claim this ID'}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => void copyInvite(invite.employeeId)}
                        className="rounded-xl border border-white/10 px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-white/60 hover:border-teal/40 hover:text-teal transition-colors"
                      >
                        <Copy size={14} />
                      </button>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-4 text-[10px] uppercase tracking-widest font-bold">
                      <span className={invite.claimed ? 'text-emerald-400' : 'text-amber-300'}>
                        {invite.claimed ? 'Claimed' : 'Waiting for Signup'}
                      </span>
                      <span className="text-white/55">{invite.position || 'field-operator'}</span>
                      {invite.claimedByEmail && (
                        <span className="text-white/55">{invite.claimedByEmail}</span>
                      )}
                    </div>
                  </div>
                )) : (
                  <p className="text-sm text-white/50">No employee IDs issued yet.</p>
                )}
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-8">
            <div className="grid grid-cols-1 gap-4">
              {filteredStaff.length > 0 ? filteredStaff.map((member, idx) => {
                const isSelected = member.uid === selectedStaff?.uid;
                return (
                  <motion.div
                    key={member.uid}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                  className={`group dark-card relative p-6 ${isSelected ? 'border-teal/50' : 'border-white/5'} hover:border-teal/30 transition-all flex flex-wrap items-center justify-between gap-6`}
                  >
                    <div className="flex items-center gap-6">
                      <div className="w-16 h-16 rounded-2xl bg-white/5 overflow-hidden border border-white/10 group-hover:border-teal/30 transition-all flex items-center justify-center">
                        <Users className="text-teal" />
                      </div>

                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-xl font-display uppercase text-white">{member.displayName || member.email}</h4>
                        <ShieldCheck size={14} className="text-teal" />
                      </div>
                      <p className="text-teal text-xs font-bold uppercase tracking-widest mb-3">{member.position || 'Field Specialist'}</p>
                      <div className="flex flex-wrap items-center gap-6 text-[10px] text-white/60 uppercase tracking-widest font-bold">
                        <span className="flex items-center gap-1"><BadgeCheck size={12} className="text-teal" /> {member.employeeId || 'No ID saved'}</span>
                        <span className="flex items-center gap-1"><Star size={12} className="fill-teal text-teal" /> {member.experience || '0'} yrs</span>
                        <span className="flex items-center gap-1"><Clock size={12} className="text-teal/60" /> {getAssignedCount(member.uid)} assigned</span>
                        <span className="flex items-center gap-1"><MapPin size={12} className="text-teal/60" /> {member.postcode || 'Manchester'}</span>
                      </div>
                    </div>
                    </div>

                    <div className="text-right">
                      <p className="text-[10px] text-white/55 uppercase font-bold mb-1">Contact</p>
                      <p className="text-[10px] uppercase tracking-widest text-white/60">{member.phoneNumber || 'No phone saved'}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedStaffId(member.uid)}
                      className="absolute top-4 right-4 text-[10px] uppercase tracking-widest text-white/60 border border-white/10 rounded-full px-3 py-1 hover:border-teal hover:text-teal transition-colors"
                    >
                      {isSelected ? 'Viewing' : 'View Bio'}
                    </button>
                  </motion.div>
                );
              }) : (
                <div className="dark-card p-8 text-sm text-white/50">
                  No staff records found yet. Issue employee IDs above, then have staff create their own account from the public portal.
                </div>
              )}
            </div>

            <div className="space-y-8">
              <div className="dark-card p-6 border-white/5 h-fit">
                <h4 className="text-xs font-bold uppercase tracking-widest text-white/60 mb-6">Assignment Queue</h4>
                <div className="space-y-4">
                  {manageableBookings.length > 0 ? manageableBookings.map((booking) => (
                    <div key={booking.id} className="rounded-2xl border border-white/5 bg-white/5 p-4 space-y-4">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-white">{booking.customerName}</p>
                        <p className="text-[10px] uppercase tracking-widest text-white/60 mt-1">{booking.serviceLabel}</p>
                        <p className="text-[10px] uppercase tracking-widest text-teal mt-2">{formatSchedule(booking)}</p>
                        <p className="text-[10px] uppercase tracking-widest text-white/55 mt-2">{getStatusLabel(booking.status)}</p>
                        <p className="text-[10px] uppercase tracking-widest text-white/55 mt-2">{getAssignedStaffLabel(booking)}</p>
                      </div>
                      <select
                        className="input-field bg-white/5 border-white/10 text-white focus:border-teal"
                        value={booking.assignedStaffId || ''}
                        disabled={!['pending', 'confirmed'].includes(booking.status)}
                        onChange={(event) => {
                          const selected = staff.find((member) => member.uid === event.target.value) || null;
                          void handleAssign(booking.id, selected);
                        }}
                      >
                        <option value="" className="bg-charcoal text-white">Unassign booking</option>
                        {staff.map((member) => (
                          <option key={member.uid} value={member.uid} className="bg-charcoal text-white">
                            {member.displayName || member.email}
                          </option>
                        ))}
                      </select>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => navigate(`/admin/bookings/${booking.id}`)}
                          className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-white transition-colors hover:border-teal hover:text-teal"
                        >
                          Open Detail
                        </button>
                        {['pending', 'confirmed'].includes(booking.status) ? (
                          <button
                            type="button"
                            onClick={() => void handleCancelBooking(booking.id)}
                            className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-red-300 transition-colors hover:border-red-400 hover:text-red-200"
                          >
                            Cancel
                          </button>
                        ) : (
                          <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-white/55">
                            {booking.status === 'completed' ? 'Completed' : 'In progress'}
                          </div>
                        )}
                      </div>
                    </div>
                  )) : (
                    <p className="text-sm text-white/50">There are no active bookings to manage right now.</p>
                  )}
                </div>
              </div>

              <div className="dark-card p-6 border-white/5">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-white/60">Staff Biodata</h4>
                  <span className="text-[10px] uppercase tracking-widest text-white/50">Payroll & history</span>
                </div>
                {selectedStaff ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-[10px] uppercase tracking-widest text-white/50">Employee ID</p>
                        <p className="text-teal font-bold uppercase">{selectedStaff.employeeId || 'Unassigned'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-widest text-white/50">Position</p>
                        <p className="text-white font-bold">{selectedStaff.position || 'Field Specialist'}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-[10px] uppercase tracking-widest text-white/50">Experience</p>
                        <p className="text-white font-bold">{selectedStaff.experience || '0'} yrs</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-widest text-white/50">Onboarded</p>
                        <p className="text-white font-bold">{selectedStaff.onboarded ? 'Yes' : 'Pending'}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-[10px] uppercase tracking-widest text-white/50">Phone</p>
                        <p className="text-white font-bold">{selectedStaff.phoneNumber || 'Not provided'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-widest text-white/50">Region</p>
                        <p className="text-white font-bold">{selectedStaff.postcode || 'Manchester'}</p>
                      </div>
                    </div>
                    {selectedStaff.bio && (
                      <p className="text-sm text-white/60 leading-relaxed">{selectedStaff.bio}</p>
                    )}
                    <form onSubmit={handleSalarySave} className="space-y-2">
                      <p className="text-[10px] uppercase tracking-widest text-white/50">Salary allocation</p>
                      <div className="grid grid-cols-2 gap-3">
                        <input
                          type="number"
                          step="0.01"
                          value={salaryForm.allocation}
                          onChange={(event) => setSalaryForm((current) => ({ ...current, allocation: event.target.value }))}
                          placeholder={selectedStaff.salaryAllocation !== undefined ? selectedStaff.salaryAllocation.toString() : '0.00'}
                          className="input-field text-charcoal bg-white/90 border-white/20"
                        />
                        <input
                          type="text"
                          value={salaryForm.currency}
                          onChange={(event) => setSalaryForm((current) => ({ ...current, currency: event.target.value }))}
                          className="input-field text-charcoal bg-white/90 border-white/20"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={isSavingSalary}
                        className="btn-primary w-full text-[10px] py-3 uppercase tracking-widest disabled:opacity-50"
                      >
                        {isSavingSalary ? 'Saving...' : 'Update payroll'}
                      </button>
                      {salaryStatus && <p className="text-[10px] text-teal uppercase tracking-widest">{salaryStatus}</p>}
                      {salaryError && <p className="text-[10px] text-red-500 uppercase tracking-widest">{salaryError}</p>}
                    </form>
                    <div className="space-y-2">
                      <p className="text-[10px] uppercase tracking-widest text-white/50">Recent job allocation</p>
                      {selectedStaffHistory.length > 0 ? selectedStaffHistory.map((job) => (
                        <div key={job.id} className="rounded-xl border border-white/10 bg-white/5 p-3 text-[10px] uppercase tracking-widest text-white/60">
                          <p className="text-white font-bold">{job.serviceLabel}</p>
                          <p className="text-white/70">{formatSchedule(job)}</p>
                          <p className="text-teal mt-1">{getStatusLabel(job.status)}</p>
                        </div>
                      )) : (
                        <p className="text-[10px] uppercase tracking-widest text-white/50">No recent jobs assigned.</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-white/50">Select a staff card to view their biodata and payroll notes.</p>
                )}
              </div>
            </div>
          </div>

          <div className="dark-card p-6 border-white/5">
            <div className="flex items-center gap-3 text-white/55 text-[10px] uppercase tracking-widest font-bold">
              <CheckCircle2 size={14} className="text-teal" />
              Staff account flow: admin issues employee ID, staff creates account with employee ID plus company email, admin accounts stay manually provisioned in Firestore.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
