import React from 'react';
import { AlertCircle, Camera, CheckCircle2, Circle, ImagePlus, ShieldCheck, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { collection, doc, onSnapshot, query, serverTimestamp, updateDoc, where } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { auth, db, storage } from '../firebase';
import { cn } from '@/lib/utils';
import {
  formatSchedule,
  getAfterPhotos,
  getBeforePhotos,
  getBookingTasks,
  getCompletedTaskIds,
  getTaskProgressPercent,
  sortBookingsBySchedule,
} from '../lib/bookings';
import type { BookingPhoto, BookingRecord, View } from '../types';

interface StaffTasksProps {
  onNavigate: (view: View) => void;
}

type PhotoPhase = 'before' | 'after';

function getFileExtension(file: File) {
  const extension = file.name.split('.').pop();
  return extension ? extension.toLowerCase() : 'jpg';
}

function buildPhotoSummary(phase: PhotoPhase, count: number) {
  return `${count} ${phase} photo${count === 1 ? '' : 's'} uploaded successfully.`;
}

export const StaffTasks: React.FC<StaffTasksProps> = ({ onNavigate }) => {
  const [booking, setBooking] = React.useState<BookingRecord | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);
  const [busyAction, setBusyAction] = React.useState<string | null>(null);
  const [beforeFiles, setBeforeFiles] = React.useState<File[]>([]);
  const [afterFiles, setAfterFiles] = React.useState<File[]>([]);

  React.useEffect(() => {
    if (!auth.currentUser) return;

    const tasksQuery = query(collection(db, 'bookings'), where('assignedStaffId', '==', auth.currentUser.uid));
    const unsubscribe = onSnapshot(tasksQuery, (snapshot) => {
      const records = snapshot.docs.map((entry) => ({
        id: entry.id,
        ...(entry.data() as Omit<BookingRecord, 'id'>),
      }));
      const nextBooking = sortBookingsBySchedule(
        records.filter((entry) => entry.status === 'in_progress'),
      )[0] || sortBookingsBySchedule(
        records.filter((entry) => !['completed', 'cancelled'].includes(entry.status)),
      )[0];
      setBooking(nextBooking || null);
      setError(null);
    });

    return () => unsubscribe();
  }, []);

  const beforePhotos = React.useMemo(() => getBeforePhotos(booking), [booking]);
  const afterPhotos = React.useMemo(() => getAfterPhotos(booking), [booking]);
  const tasks = booking ? getBookingTasks(booking.serviceId, booking.addons) : [];
  const completedTaskIds = React.useMemo(() => new Set(getCompletedTaskIds(booking)), [booking]);
  const progress = booking ? getTaskProgressPercent(booking) : 0;
  const canEditTasks = beforePhotos.length > 0 && booking?.status !== 'completed';

  const uploadPhotos = async (phase: PhotoPhase) => {
    if (!booking || !auth.currentUser) return;

    const files = phase === 'before' ? beforeFiles : afterFiles;
    if (files.length === 0) {
      setError(`Choose at least one ${phase} photo first.`);
      return;
    }

    setBusyAction(`${phase}-photo`);
    setError(null);
    setSuccess(null);

    try {
      const existingPhotos = phase === 'before' ? beforePhotos : afterPhotos;
      const uploadedPhotos: BookingPhoto[] = [];

      for (const file of files) {
        const extension = getFileExtension(file);
        const path = `bookings/${booking.id}/${phase}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension}`;
        const storageRef = ref(storage, path);

        await uploadBytes(storageRef, file, {
          contentType: file.type || 'image/jpeg',
        });

        const downloadUrl = await getDownloadURL(storageRef);
        uploadedPhotos.push({
          url: downloadUrl,
          path,
          uploadedAt: new Date().toISOString(),
        });
      }

      const mergedPhotos = [...existingPhotos, ...uploadedPhotos];
      const latestPhoto = mergedPhotos[mergedPhotos.length - 1] || null;

      await updateDoc(doc(db, 'bookings', booking.id), {
        ...(phase === 'before'
          ? {
              beforePhotos: mergedPhotos,
              beforePhotoUrl: mergedPhotos[0]?.url || latestPhoto?.url || null,
              beforePhotoPath: mergedPhotos[0]?.path || latestPhoto?.path || null,
              startedAt: booking.startedAt || serverTimestamp(),
              status: booking.status === 'completed' ? 'completed' : 'in_progress',
            }
          : {
              afterPhotos: mergedPhotos,
              afterPhotoUrl: latestPhoto?.url || null,
              afterPhotoPath: latestPhoto?.path || null,
            }),
        lastProgressAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      if (phase === 'before') {
        setBeforeFiles([]);
      } else {
        setAfterFiles([]);
      }

      setSuccess(buildPhotoSummary(phase, uploadedPhotos.length));
    } catch (uploadError) {
      console.error(`${phase} photo upload failed:`, uploadError);
      setError(`The ${phase} photos could not be uploaded. Try again.`);
    } finally {
      setBusyAction(null);
    }
  };

  const toggleTask = async (taskId: string) => {
    if (!booking || !canEditTasks) {
      setError('Upload commencement photos before checking off tasks.');
      return;
    }

    setBusyAction(`task-${taskId}`);
    setError(null);
    setSuccess(null);

    try {
      const currentCompletedIds = booking.completedTaskIds ?? [];
      const nextCompletedIds = completedTaskIds.has(taskId)
        ? currentCompletedIds.filter((id) => id !== taskId)
        : [...currentCompletedIds, taskId];

      const nextProgress = tasks.length > 0 ? Math.round((nextCompletedIds.length / tasks.length) * 100) : 0;

      await updateDoc(doc(db, 'bookings', booking.id), {
        completedTaskIds: nextCompletedIds,
        taskProgressPercent: nextProgress,
        status: booking.status === 'completed' ? 'completed' : 'in_progress',
        lastProgressAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (taskError) {
      console.error('Task update failed:', taskError);
      setError('Task progress could not be updated. Try again.');
    } finally {
      setBusyAction(null);
    }
  };

  const handleCompleteJob = async () => {
    if (!booking) return;

    if (progress < 100) {
      setError('Every task must be completed before closing the job.');
      return;
    }

    if (afterPhotos.length === 0) {
      setError('Upload the after photos before marking the job complete.');
      return;
    }

    setBusyAction('complete-job');
    setError(null);
    setSuccess(null);

    try {
      await updateDoc(doc(db, 'bookings', booking.id), {
        status: 'completed',
        completedAt: serverTimestamp(),
        taskProgressPercent: 100,
        lastProgressAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setSuccess('Job marked complete. Admin and customer views are now updated.');
    } catch (completeError) {
      console.error('Job completion failed:', completeError);
      setError('The job could not be marked complete. Try again.');
    } finally {
      setBusyAction(null);
    }
  };

  const renderPhotoGallery = (photos: BookingPhoto[], label: string) => (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-white/60">
        <span>{label}</span>
        <span>{photos.length} saved</span>
      </div>
      {photos.length > 0 ? (
        <div className="grid grid-cols-3 gap-2">
          {photos.slice(0, 6).map((photo) => (
            <img key={photo.path || photo.url} src={photo.url} alt={label} className="h-20 w-full rounded-xl object-cover border border-white/10" />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-[10px] font-bold uppercase tracking-widest text-white/45">
          No photos uploaded yet
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-charcoal pt-32 pb-20 px-4">
      <div className="max-w-5xl mx-auto">
        <header className="mb-12 flex flex-col sm:flex-row sm:justify-between sm:items-end gap-6">
          <div>
            <h2 className="text-teal text-xs tracking-[0.4em] mb-4 uppercase">Task Management</h2>
            <h3 className="text-4xl text-white font-display uppercase">Current Checklist</h3>
            <p className="text-white/65 mt-2 uppercase tracking-widest text-xs font-bold">
              {booking ? `${booking.customerName} - ${booking.serviceLabel}` : 'No active booking selected'}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-white/50 uppercase font-bold mb-1">Progress</p>
            <p className="text-3xl font-display text-teal">{progress}%</p>
          </div>
        </header>

        {booking ? (
          <div className="grid xl:grid-cols-[1.2fr_0.8fr] gap-8">
            <div className="space-y-4">
              <div className="rounded-full h-3 bg-white/8 overflow-hidden">
                <div className="h-full bg-teal transition-all" style={{ width: `${progress}%` }} />
              </div>

              {tasks.map((task, idx) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className={cn(
                    'group p-5 rounded-custom border transition-all flex items-center justify-between',
                    completedTaskIds.has(task.id)
                      ? 'bg-teal/5 border-teal/20 text-teal/50'
                      : 'bg-white/5 border-white/10 text-white/72 hover:border-white/20',
                  )}
                >
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => void toggleTask(task.id)}
                      disabled={!canEditTasks || busyAction != null}
                      className={cn(
                        'w-6 h-6 rounded-full flex items-center justify-center border transition-all disabled:opacity-40',
                        completedTaskIds.has(task.id) ? 'bg-teal border-teal text-charcoal' : 'border-white/20 text-white/20',
                      )}
                    >
                      {completedTaskIds.has(task.id) ? <CheckCircle2 size={14} /> : <Circle size={14} />}
                    </button>
                    <div>
                      <p className={cn('text-sm font-bold uppercase tracking-wider', completedTaskIds.has(task.id) && 'line-through opacity-50')}>
                        {task.title}
                      </p>
                      <span className="text-[8px] uppercase tracking-[0.2em] opacity-50">{task.category}</span>
                    </div>
                  </div>

                  <div
                    className={cn(
                      'px-2 py-0.5 rounded text-[7px] font-bold uppercase tracking-widest',
                      task.priority === 'high'
                        ? 'bg-red-500/10 text-red-400'
                        : task.priority === 'medium'
                          ? 'bg-amber-500/10 text-amber-400'
                          : 'bg-teal-500/10 text-teal-400',
                    )}
                  >
                    {task.priority}
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="space-y-6">
              <div className="dark-card p-6 border-teal/20">
                <div className="flex items-center gap-3 mb-6">
                  <AlertCircle className="text-teal" size={20} />
                  <h4 className="text-xs font-bold uppercase tracking-widest">Booking Snapshot</h4>
                </div>
                <p className="text-[10px] text-white/55 uppercase leading-relaxed tracking-widest">
                  {formatSchedule(booking)} at {booking.postcode}
                </p>
                <p className="text-[10px] text-white/55 uppercase leading-relaxed tracking-widest mt-3 break-words">
                  {booking.locationLabel || booking.address}
                </p>
                <p className="text-[10px] text-white/55 uppercase leading-relaxed tracking-widest mt-3">
                  Add-ons: {booking.addons.length > 0 ? booking.addons.join(', ') : 'None'}
                </p>
              </div>

              <div className="dark-card p-6 border-white/5 space-y-5">
                <div className="flex items-center gap-3">
                  <Camera className="text-teal" size={20} />
                  <h4 className="text-xs font-bold uppercase tracking-widest">Photo Evidence</h4>
                </div>

                {renderPhotoGallery(beforePhotos, 'Before photos')}

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/60 mb-3">Add commencement photos</p>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(event) => setBeforeFiles(Array.from(event.target.files || []))}
                    className="input-field bg-white/5 border-white/10 text-white file:mr-4 file:rounded-lg file:border-0 file:bg-teal file:px-3 file:py-2 file:text-[10px] file:font-bold file:text-charcoal"
                  />
                  <p className="mt-3 text-[10px] font-bold uppercase tracking-widest text-white/45">
                    {beforeFiles.length > 0 ? `${beforeFiles.length} file(s) selected` : 'Select multiple photos if needed'}
                  </p>
                  <button
                    type="button"
                    onClick={() => void uploadPhotos('before')}
                    disabled={beforeFiles.length === 0 || busyAction != null}
                    className="btn-secondary mt-4 w-full flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <ImagePlus size={14} /> {busyAction === 'before-photo' ? 'UPLOADING...' : 'UPLOAD BEFORE PHOTOS'}
                  </button>
                </div>

                {renderPhotoGallery(afterPhotos, 'After photos')}

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/60 mb-3">Add completion photos</p>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(event) => setAfterFiles(Array.from(event.target.files || []))}
                    className="input-field bg-white/5 border-white/10 text-white file:mr-4 file:rounded-lg file:border-0 file:bg-teal file:px-3 file:py-2 file:text-[10px] file:font-bold file:text-charcoal"
                  />
                  <p className="mt-3 text-[10px] font-bold uppercase tracking-widest text-white/45">
                    {afterFiles.length > 0 ? `${afterFiles.length} file(s) selected` : 'Select multiple photos if needed'}
                  </p>
                  <button
                    type="button"
                    onClick={() => void uploadPhotos('after')}
                    disabled={afterFiles.length === 0 || busyAction != null}
                    className="btn-secondary mt-4 w-full flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <ImagePlus size={14} /> {busyAction === 'after-photo' ? 'UPLOADING...' : 'UPLOAD AFTER PHOTOS'}
                  </button>
                </div>
              </div>

              <div className="dark-card p-6 border-white/5">
                <div className="flex items-center gap-3 mb-6">
                  <ShieldCheck className="text-teal" size={20} />
                  <h4 className="text-xs font-bold uppercase tracking-widest">Safety Protocol</h4>
                </div>
                <ul className="space-y-3">
                  {['Wear gloves', 'Confirm service scope', 'Check site access'].map((item) => (
                    <li key={item} className="flex items-center gap-2 text-[9px] text-white/60 uppercase tracking-widest">
                      <div className="w-1 h-1 bg-teal rounded-full" /> {item}
                    </li>
                  ))}
                </ul>
              </div>

              {error && (
                <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-xs font-bold uppercase tracking-widest text-red-300">
                  {error}
                </div>
              )}

              {success && (
                <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-xs font-bold uppercase tracking-widest text-emerald-300">
                  {success}
                </div>
              )}

              <button
                onClick={() => void handleCompleteJob()}
                disabled={busyAction != null || progress < 100 || afterPhotos.length === 0}
                className="btn-primary w-full py-4 text-xs flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <CheckCircle2 size={16} /> {busyAction === 'complete-job' ? 'FINALIZING...' : 'MARK JOB COMPLETE'}
              </button>

              <button
                onClick={() => onNavigate('schedule')}
                className="btn-secondary w-full py-4 text-xs flex items-center justify-center gap-2"
              >
                <Sparkles size={16} /> RETURN TO SCHEDULE
              </button>
            </div>
          </div>
        ) : (
          <div className="dark-card p-8 text-white/50">
            No active assigned booking. Assign a booking from the admin portal to populate this checklist.
          </div>
        )}
      </div>
    </div>
  );
};
