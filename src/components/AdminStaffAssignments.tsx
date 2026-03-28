import React from 'react';
import { ArrowLeft, BarChart3, Calendar, CheckCircle2, Clock } from 'lucide-react';
import { collection, doc, onSnapshot, query, where } from 'firebase/firestore';
import { useNavigate, useParams } from 'react-router-dom';
import { db } from '../firebase';
import { formatSchedule, getStatusLabel, sortBookingsBySchedule } from '../lib/bookings';
import type { AppUserData, BookingRecord } from '../types';

export const AdminStaffAssignments: React.FC = () => {
  const { staffId } = useParams<{ staffId: string }>();
  const navigate = useNavigate();
  const [member, setMember] = React.useState<AppUserData | null>(null);
  const [bookings, setBookings] = React.useState<BookingRecord[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!staffId) return;
    const unsubMember = onSnapshot(doc(db, 'users', staffId), (snapshot) => {
      if (snapshot.exists()) setMember(snapshot.data() as AppUserData);
      setLoading(false);
    });
    return unsubMember;
  }, [staffId]);

  React.useEffect(() => {
    if (!staffId) return;
    const bookingsQuery = query(
      collection(db, 'bookings'),
      where('assignedStaffId', '==', staffId),
    );
    const unsubBookings = onSnapshot(bookingsQuery, (snapshot) => {
      setBookings(
        snapshot.docs.map((entry) => ({ id: entry.id, ...(entry.data() as Omit<BookingRecord, 'id'>) })),
      );
    });
    return unsubBookings;
  }, [staffId]);

  const allBookings = sortBookingsBySchedule(bookings);
  const activeBookings = allBookings.filter((b) =>
    ['pending', 'confirmed', 'in_progress'].includes(b.status),
  );
  const completedBookings = allBookings.filter((b) => b.status === 'completed');
  const cancelledBookings = allBookings.filter((b) => b.status === 'cancelled');

  const avgProgress =
    activeBookings.length > 0
      ? Math.round(
          activeBookings.reduce((sum, b) => sum + (b.taskProgressPercent ?? 0), 0) /
            activeBookings.length,
        )
      : 0;

  const statusColour = (status: BookingRecord['status']) => {
    if (status === 'completed') return 'text-teal';
    if (status === 'in_progress') return 'text-vibrant-blue';
    if (status === 'cancelled') return 'text-red-400';
    if (status === 'confirmed') return 'text-amber-300';
    return 'text-white/55';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-charcoal flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-teal/20 border-t-teal animate-spin" />
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

        <header className="mb-12">
          <h2 className="text-teal text-xs tracking-[0.4em] mb-2 uppercase">Assignments</h2>
          <h3 className="text-3xl text-white font-display uppercase">
            {member?.displayName || member?.email || 'Staff Member'}
          </h3>
          <p className="text-white/55 text-[10px] uppercase tracking-widest font-bold mt-1">
            {member?.position || 'Field Specialist'} &nbsp;·&nbsp; {member?.employeeId || 'No ID'}
          </p>
        </header>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="dark-card p-4 border-white/5 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Clock size={14} className="text-amber-300" />
              <p className="text-[10px] uppercase tracking-widest text-white/50 font-bold">Active</p>
            </div>
            <p className="text-2xl font-display text-white">{activeBookings.length}</p>
          </div>
          <div className="dark-card p-4 border-white/5 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <CheckCircle2 size={14} className="text-teal" />
              <p className="text-[10px] uppercase tracking-widest text-white/50 font-bold">Done</p>
            </div>
            <p className="text-2xl font-display text-teal">{completedBookings.length}</p>
          </div>
          <div className="dark-card p-4 border-white/5 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <BarChart3 size={14} className="text-vibrant-blue" />
              <p className="text-[10px] uppercase tracking-widest text-white/50 font-bold">Avg progress</p>
            </div>
            <p className="text-2xl font-display text-white">{avgProgress}%</p>
          </div>
        </div>

        {/* Active bookings */}
        <div className="dark-card p-6 border-white/5 mb-6">
          <div className="flex items-center gap-2 mb-6">
            <Calendar size={14} className="text-teal" />
            <p className="text-[10px] uppercase tracking-widest text-white/60 font-bold">
              Active &amp; Upcoming ({activeBookings.length})
            </p>
          </div>
          {activeBookings.length > 0 ? (
            <div className="space-y-3">
              {activeBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="rounded-xl border border-white/5 bg-white/5 p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-white font-bold text-sm">{booking.customerName}</p>
                      <p className="text-white/60 text-[10px] uppercase tracking-widest mt-1">
                        {booking.serviceLabel}
                      </p>
                      <p className="text-teal text-[10px] uppercase tracking-widest mt-1">
                        {formatSchedule(booking)}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`text-[10px] uppercase tracking-widest font-bold ${statusColour(booking.status)}`}>
                        {getStatusLabel(booking.status)}
                      </p>
                      {booking.taskProgressPercent !== undefined && (
                        <p className="text-white/40 text-[10px] mt-1">{booking.taskProgressPercent}% tasks</p>
                      )}
                    </div>
                  </div>
                  {(booking.taskProgressPercent ?? 0) > 0 && (
                    <div className="mt-3">
                      <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-teal rounded-full transition-all"
                          style={{ width: `${booking.taskProgressPercent ?? 0}%` }}
                        />
                      </div>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => navigate(`/admin/bookings/${booking.id}`)}
                    className="mt-3 text-[10px] uppercase tracking-widest text-white/40 hover:text-teal transition-colors font-bold"
                  >
                    Open booking →
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-white/40 text-sm">No active assignments.</p>
          )}
        </div>

        {/* Completed bookings */}
        {completedBookings.length > 0 && (
          <div className="dark-card p-6 border-white/5 mb-6">
            <div className="flex items-center gap-2 mb-6">
              <CheckCircle2 size={14} className="text-teal" />
              <p className="text-[10px] uppercase tracking-widest text-white/60 font-bold">
                Completed ({completedBookings.length})
              </p>
            </div>
            <div className="space-y-3">
              {completedBookings.slice(0, 10).map((booking) => (
                <div
                  key={booking.id}
                  className="rounded-xl border border-white/5 bg-white/5 p-4 flex items-center justify-between gap-4"
                >
                  <div>
                    <p className="text-white font-bold text-sm">{booking.customerName}</p>
                    <p className="text-white/55 text-[10px] uppercase tracking-widest mt-1">
                      {booking.serviceLabel} &nbsp;·&nbsp; {formatSchedule(booking)}
                    </p>
                  </div>
                  <p className="text-teal text-[10px] uppercase tracking-widest font-bold shrink-0">
                    Completed
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Cancelled */}
        {cancelledBookings.length > 0 && (
          <div className="dark-card p-6 border-white/5">
            <div className="flex items-center gap-2 mb-4">
              <p className="text-[10px] uppercase tracking-widest text-white/40 font-bold">
                Cancelled ({cancelledBookings.length})
              </p>
            </div>
            <div className="space-y-2">
              {cancelledBookings.slice(0, 5).map((booking) => (
                <div key={booking.id} className="rounded-xl border border-white/5 bg-white/5 p-3 flex items-center justify-between gap-4">
                  <p className="text-white/55 text-[10px] uppercase tracking-widest">
                    {booking.customerName} — {booking.serviceLabel}
                  </p>
                  <p className="text-red-400/70 text-[10px] uppercase tracking-widest font-bold shrink-0">Cancelled</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {allBookings.length === 0 && (
          <div className="dark-card p-8 border-white/5 text-center">
            <p className="text-white/40 text-sm">No bookings assigned to this staff member yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};
