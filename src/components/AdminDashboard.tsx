import React from 'react';
import { Activity, AlertCircle, Calendar as CalendarIcon, Clock, MapPin, Play, Users } from 'lucide-react';
import { motion } from 'motion/react';
import { collection, doc, onSnapshot, orderBy, query, serverTimestamp, updateDoc, where } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { formatSchedule, getAfterPhotos, getAssignedStaffLabel, getBeforePhotos, getPrimaryAfterPhotoUrl, getPrimaryBeforePhotoUrl, getStatusLabel, getTaskProgressPercent, sortBookingsByCreatedAt, sortBookingsBySchedule } from '../lib/bookings';
import { PhotoGalleryOverlay } from './PhotoGalleryOverlay';
import type { AppUserData, BookingPhoto, BookingRecord, CheckIn } from '../types';

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [checkins, setCheckins] = React.useState<CheckIn[]>([]);
  const [employees, setEmployees] = React.useState<AppUserData[]>([]);
  const [bookings, setBookings] = React.useState<BookingRecord[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [galleryState, setGalleryState] = React.useState<{ title: string; photos: BookingPhoto[] } | null>(null);

  React.useEffect(() => {
    const checkinsQuery = query(collection(db, 'checkins'), orderBy('timestamp', 'desc'));
    const employeesQuery = query(collection(db, 'users'), where('role', '==', 'employee'));
    const bookingsQuery = query(collection(db, 'bookings'));

    const unsubCheckins = onSnapshot(checkinsQuery, (snapshot) => {
      setCheckins(snapshot.docs.map((entry) => ({ id: entry.id, ...(entry.data() as Omit<CheckIn, 'id'>) })));
    });
    const unsubEmployees = onSnapshot(employeesQuery, (snapshot) => {
      setEmployees(snapshot.docs.map((entry) => entry.data() as AppUserData));
    });
    const unsubBookings = onSnapshot(bookingsQuery, (snapshot) => {
      const records = snapshot.docs.map((entry) => ({
        id: entry.id,
        ...(entry.data() as Omit<BookingRecord, 'id'>),
      }));
      setBookings(sortBookingsByCreatedAt(records));
      setLoading(false);
    }, () => setLoading(false));

    return () => {
      unsubCheckins();
      unsubEmployees();
      unsubBookings();
    };
  }, []);

  const activeBookings = bookings.filter((booking) => ['confirmed', 'in_progress'].includes(booking.status)).slice(0, 4);
  const scheduleQueue = sortBookingsBySchedule(
    bookings.filter((booking) => !['completed', 'cancelled'].includes(booking.status)),
  ).slice(0, 5);
  const pendingCount = bookings.filter((booking) => booking.status === 'pending').length;
  const revenue = bookings
    .filter((booking) => booking.paymentStatus === 'paid')
    .reduce((sum, booking) => sum + (booking.paymentAmount != null ? booking.paymentAmount / 100 : booking.total), 0);

  const areaCoverage: Array<[string, number]> = (Object.entries(
    bookings.reduce<Record<string, number>>((counts, booking) => {
      const area = booking.postcode?.split(' ')[0] || booking.city || 'Unknown';
      counts[area] = (counts[area] || 0) + 1;
      return counts;
    }, {}),
  ) as Array<[string, number]>)
    .sort((left, right) => right[1] - left[1])
    .slice(0, 4);

  const maxAreaCount = areaCoverage[0]?.[1] || 1;

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

  if (loading) return <div className="pt-32 text-center">Loading Dashboard...</div>;

  return (
    <div className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {galleryState && (
        <PhotoGalleryOverlay
          title={galleryState.title}
          photos={galleryState.photos}
          onClose={() => setGalleryState(null)}
        />
      )}
      <div className="mb-12 flex flex-col sm:flex-row sm:justify-between sm:items-end gap-6">
        <div>
          <h1 className="text-4xl mb-4 font-display uppercase tracking-wider">Admin Control</h1>
          <p className="text-charcoal/60">Live operations from customer bookings, staff activity, and team assignments.</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-white/60 uppercase tracking-widest">System Status</p>
          <p className="text-teal font-bold uppercase tracking-widest flex items-center gap-2 sm:justify-end">
            <Activity size={12} /> Operational
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-8">
          <div className="grid grid-cols-2 gap-4">
            <div className="dark-card p-6">
              <div className="flex items-center gap-4 mb-4">
                <Users className="text-teal" size={20} />
                <h2 className="text-xs font-display uppercase tracking-widest">Staff</h2>
              </div>
              <p className="text-3xl font-bold">{employees.length}</p>
            </div>
            <div className="dark-card p-6">
              <div className="flex items-center gap-4 mb-4">
                <Play className="text-teal" size={20} />
                <h2 className="text-xs font-display uppercase tracking-widest">Live</h2>
              </div>
              <p className="text-3xl font-bold">{activeBookings.length}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="dark-card p-6">
              <p className="text-[10px] text-white/60 uppercase tracking-widest mb-2">Pending</p>
              <p className="text-2xl font-display text-teal">{pendingCount}</p>
            </div>
            <div className="dark-card p-6">
              <p className="text-[10px] text-white/60 uppercase tracking-widest mb-2">Revenue</p>
              <p className="text-2xl font-display text-teal">£{revenue.toFixed(0)}</p>
            </div>
          </div>

          <div className="dark-card p-6">
            <h2 className="text-xs font-display uppercase tracking-widest mb-6 border-b border-white/10 pb-4">Coverage Snapshot</h2>
            <div className="space-y-4">
              {areaCoverage.length > 0 ? areaCoverage.map(([area, count]) => (
                <div key={area}>
                  <div className="flex justify-between items-center text-[10px] uppercase tracking-widest mb-2">
                    <span>{area}</span>
                    <span className="text-teal">{count} bookings</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                    <div
                      className="h-full bg-teal rounded-full"
                      style={{ width: `${Math.max(20, (count / maxAreaCount) * 100)}%` }}
                    />
                  </div>
                </div>
              )) : (
                <p className="text-sm text-white/60">Coverage data appears once bookings are created.</p>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-1 space-y-8">
          <div className="dark-card p-6">
            <h2 className="text-xs font-display uppercase tracking-widest mb-6 border-b border-white/10 pb-4">Active & Upcoming Bookings</h2>
            <div className="space-y-4">
              {scheduleQueue.length > 0 ? scheduleQueue.map((booking) => (
                <div key={booking.id} className="p-4 rounded bg-white/5 border border-white/5">
                  <div className="flex justify-between items-start mb-2 gap-4">
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-widest">{booking.customerName}</h3>
                      <p className="text-[10px] text-white/60 uppercase tracking-widest mt-1">{booking.serviceLabel}</p>
                    </div>
                    <span className="text-[10px] bg-teal/20 text-teal px-2 py-1 rounded uppercase font-bold">
                      {getStatusLabel(booking.status)}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1 text-[10px] text-white/60 uppercase tracking-widest">
                    <span className="flex items-center gap-2"><CalendarIcon size={10} /> {formatSchedule(booking)}</span>
                    <span className="flex items-center gap-2"><MapPin size={10} /> {booking.postcode}</span>
                    <span className="flex items-center gap-2"><Users size={10} /> {getAssignedStaffLabel(booking)}</span>
                  </div>
                  <div className="mt-4">
                    <div className="mb-2 flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-white/60">
                      <span>Progress</span>
                      <span>{getTaskProgressPercent(booking)}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-white/8 overflow-hidden">
                      <div className="h-full bg-teal rounded-full transition-all" style={{ width: `${getTaskProgressPercent(booking)}%` }} />
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2 text-[10px] font-bold uppercase tracking-widest">
                    <div className="rounded-lg border border-white/10 bg-white/5 px-2 py-2 text-white/55">
                      <p>Before</p>
                      {getPrimaryBeforePhotoUrl(booking) ? (
                        <>
                          <img src={getPrimaryBeforePhotoUrl(booking)!} alt="Before service" className="mt-2 h-16 w-full rounded object-cover" />
                          <button
                            type="button"
                            onClick={() => setGalleryState({ title: `${booking.customerName} Before Photos`, photos: getBeforePhotos(booking) })}
                            className="mt-2 w-full rounded border border-white/10 bg-white/5 px-2 py-2 text-[10px] font-bold uppercase tracking-widest text-white/85 hover:border-teal hover:text-teal transition-colors"
                          >
                            View ({getBeforePhotos(booking).length})
                          </button>
                        </>
                      ) : (
                        <p className="mt-2">Pending</p>
                      )}
                    </div>
                    <div className="rounded-lg border border-white/10 bg-white/5 px-2 py-2 text-white/55">
                      <p>After</p>
                      {getPrimaryAfterPhotoUrl(booking) ? (
                        <>
                          <img src={getPrimaryAfterPhotoUrl(booking)!} alt="After service" className="mt-2 h-16 w-full rounded object-cover" />
                          <button
                            type="button"
                            onClick={() => setGalleryState({ title: `${booking.customerName} After Photos`, photos: getAfterPhotos(booking) })}
                            className="mt-2 w-full rounded border border-white/10 bg-white/5 px-2 py-2 text-[10px] font-bold uppercase tracking-widest text-white/85 hover:border-teal hover:text-teal transition-colors"
                          >
                            View ({getAfterPhotos(booking).length})
                          </button>
                        </>
                      ) : (
                        <p className="mt-2">Pending</p>
                      )}
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => navigate(`/admin/bookings/${booking.id}`)}
                      className="rounded-lg border border-white/10 bg-white/5 px-2 py-2 text-[10px] font-bold uppercase tracking-widest text-white/85 transition-colors hover:border-teal hover:text-teal"
                    >
                      Open Detail
                    </button>
                    {['pending', 'confirmed'].includes(booking.status) ? (
                      <button
                        type="button"
                        onClick={() => void handleCancelBooking(booking.id)}
                        className="rounded-lg border border-red-500/30 bg-red-500/10 px-2 py-2 text-[10px] font-bold uppercase tracking-widest text-red-300 transition-colors hover:border-red-400 hover:text-red-200"
                      >
                        Cancel
                      </button>
                    ) : (
                      <div className="rounded-lg border border-white/10 bg-white/5 px-2 py-2 text-[10px] font-bold uppercase tracking-widest text-white/55">
                        {booking.status === 'completed' ? 'Completed' : 'Locked'}
                      </div>
                    )}
                  </div>
                </div>
              )) : (
                <div className="text-center py-10 text-white/60">
                  <AlertCircle className="mx-auto mb-4 opacity-20" size={32} />
                  <p className="uppercase tracking-widest text-[10px]">No bookings yet</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="dark-card p-6 min-h-[600px]">
            <h2 className="text-xs font-display uppercase tracking-widest mb-6 border-b border-white/10 pb-4">Live Activity Feed</h2>
            <div className="space-y-4">
              {checkins.length === 0 ? (
                <div className="text-center py-20 text-white/60">
                  <AlertCircle className="mx-auto mb-4 opacity-20" size={32} />
                  <p className="uppercase tracking-widest text-[10px]">No activity logged yet</p>
                </div>
              ) : (
                checkins.slice(0, 8).map((checkin) => (
                  <motion.div
                    key={checkin.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-start gap-3 p-3 rounded bg-white/5 border border-white/5"
                  >
                    <div className={`w-1.5 h-1.5 rounded-full mt-1.5 ${checkin.type === 'in' ? 'bg-teal' : 'bg-red-500'}`} />
                    <div className="flex-grow">
                      <div className="flex justify-between items-start">
                        <h3 className="text-[10px] font-bold uppercase tracking-wider">
                          {checkin.employeeName || 'Unknown'}
                        </h3>
                        <span className="text-[10px] text-white/60 uppercase tracking-widest">
                          {checkin.timestamp?.toDate
                            ? checkin.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            : 'Pending'}
                        </span>
                      </div>
                      <p className="text-[10px] text-white/60 uppercase tracking-widest mt-0.5">
                        Checked {checkin.type === 'in' ? 'In' : 'Out'}
                      </p>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
