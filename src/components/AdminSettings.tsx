import React from 'react';
import { AlertCircle, CalendarDays, Save, Settings } from 'lucide-react';
import { DayPicker } from 'react-day-picker';
import { doc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import {
  DEFAULT_AVAILABILITY_SETTINGS,
  DETAILING_TIME_OPTIONS,
  TIME_WINDOW_OPTIONS,
  dateToIso,
  isoToDate,
  normalizeAvailabilitySettings,
} from '@/lib/availability';
import {
  DEFAULT_GENERAL_SETTINGS,
  normalizeGeneralSettings,
  type GeneralSettings,
} from '@/lib/generalSettings';
import { cn } from '@/lib/utils';
import type { AvailabilitySettings } from '@/types';

export const AdminSettings: React.FC = () => {
  const [settings, setSettings] = React.useState<GeneralSettings>(DEFAULT_GENERAL_SETTINGS);
  const [availability, setAvailability] = React.useState<AvailabilitySettings>(DEFAULT_AVAILABILITY_SETTINGS);
  const [saving, setSaving] = React.useState(false);
  const [status, setStatus] = React.useState<string | null>(null);
  const [statusTone, setStatusTone] = React.useState<'success' | 'error' | null>(null);

  React.useEffect(() => {
    const unsubscribeGeneral = onSnapshot(
      doc(db, 'settings', 'general'),
      (snapshot) => {
        setSettings(normalizeGeneralSettings(snapshot.exists() ? (snapshot.data() as Partial<GeneralSettings>) : null));
      },
      (error) => {
        console.error('Failed to load general settings:', error);
        setStatusTone('error');
        setStatus('General settings could not be loaded.');
      },
    );

    const unsubscribeAvailability = onSnapshot(
      doc(db, 'settings', 'availability'),
      (snapshot) => {
        if (snapshot.exists()) {
          setAvailability(normalizeAvailabilitySettings(snapshot.data() as Partial<AvailabilitySettings>));
        }
      },
      (error) => {
        console.error('Failed to load availability settings:', error);
        setStatusTone('error');
        setStatus('Availability settings could not be loaded.');
      },
    );

    return () => {
      unsubscribeGeneral();
      unsubscribeAvailability();
    };
  }, []);

  const toggleDetailingTime = (time: string) => {
    setAvailability((current) => ({
      ...current,
      availableDetailingTimes: current.availableDetailingTimes.includes(time)
        ? current.availableDetailingTimes.filter((entry) => entry !== time)
        : [...current.availableDetailingTimes, time],
    }));
  };

  const toggleTimeWindow = (windowId: AvailabilitySettings['availableTimeWindows'][number]) => {
    setAvailability((current) => ({
      ...current,
      availableTimeWindows: current.availableTimeWindows.includes(windowId)
        ? current.availableTimeWindows.filter((entry) => entry !== windowId)
        : [...current.availableTimeWindows, windowId],
    }));
  };

  const handleBlockedDatesChange = (dates: Date[] | undefined) => {
    setAvailability((current) => ({
      ...current,
      blockedDates: (dates || []).map(dateToIso).sort(),
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setStatus(null);
    setStatusTone(null);

    try {
      await Promise.all([
        setDoc(doc(db, 'settings', 'general'), {
          ...normalizeGeneralSettings(settings),
          updatedAt: serverTimestamp(),
        }, { merge: true }),
        setDoc(doc(db, 'settings', 'availability'), {
          ...normalizeAvailabilitySettings(availability),
          updatedAt: serverTimestamp(),
        }, { merge: true }),
      ]);
      setStatusTone('success');
      setStatus('General settings and availability saved.');
    } catch (error) {
      console.error('Failed to save settings:', error);
      setStatusTone('error');
      setStatus('Settings could not be saved.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-charcoal px-4 pb-20 pt-32">
      <div className="mx-auto max-w-6xl">
        <header className="mb-12">
          <h2 className="mb-4 text-xs tracking-[0.4em] text-teal uppercase">Configuration</h2>
          <h3 className="text-4xl text-white font-display uppercase">System Settings</h3>
          <p className="mt-2 text-xs font-bold uppercase tracking-widest text-white/40">
            General values live in `settings/general`. Availability and capacity live in `settings/availability`.
          </p>
        </header>

        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-8">
            <div className="dark-card border-white/5 p-10">
              <div className="mb-8 flex items-center gap-3">
                <Settings className="text-teal" size={18} />
                <h4 className="text-xl font-display uppercase tracking-wider text-white">General Configuration</h4>
              </div>

              <div className="space-y-8">
                <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Business Name</label>
                    <input
                      type="text"
                      value={settings.businessName}
                      onChange={(event) => setSettings((prev) => ({ ...prev, businessName: event.target.value }))}
                      className="input-field bg-white/5 border-white/10 text-white focus:border-teal"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Support Email</label>
                    <input
                      type="email"
                      value={settings.supportEmail}
                      onChange={(event) => setSettings((prev) => ({ ...prev, supportEmail: event.target.value }))}
                      className="input-field bg-white/5 border-white/10 text-white focus:border-teal"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Support Phone</label>
                    <input
                      type="text"
                      value={settings.supportPhone}
                      onChange={(event) => setSettings((prev) => ({ ...prev, supportPhone: event.target.value }))}
                      className="input-field bg-white/5 border-white/10 text-white focus:border-teal"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Service Region</label>
                    <input
                      type="text"
                      value={settings.serviceRegion}
                      onChange={(event) => setSettings((prev) => ({ ...prev, serviceRegion: event.target.value }))}
                      className="input-field bg-white/5 border-white/10 text-white focus:border-teal"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Business Address</label>
                  <textarea
                    value={settings.businessAddress}
                    onChange={(event) => setSettings((prev) => ({ ...prev, businessAddress: event.target.value }))}
                    rows={4}
                    className="input-field min-h-32 resize-y bg-white/5 border-white/10 text-white focus:border-teal"
                  />
                </div>

                <div className="space-y-3">
                  {[
                    {
                      label: 'Two-Factor Authentication',
                      description: 'Require stronger admin account security.',
                      key: 'requireTwoFactor' as const,
                    },
                    {
                      label: 'Public Registration',
                      description: 'Allow new clients to create customer profiles.',
                      key: 'publicRegistration' as const,
                    },
                    {
                      label: 'Maintenance Mode',
                      description: 'Freeze active booking intake while you test.',
                      key: 'maintenanceMode' as const,
                    },
                  ].map((item) => (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setSettings((prev) => ({ ...prev, [item.key]: !prev[item.key] }))}
                      className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-4 text-left"
                    >
                      <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-white">{item.label}</p>
                        <p className="mt-1 text-[8px] font-bold uppercase text-white/20">{item.description}</p>
                      </div>
                      <div className={cn('relative h-5 w-10 rounded-full transition-colors', settings[item.key] ? 'bg-teal' : 'bg-white/10')}>
                        <div className={cn('absolute top-1 h-3 w-3 rounded-full transition-all', settings[item.key] ? 'right-1 bg-charcoal' : 'left-1 bg-white/40')} />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="dark-card border-white/5 p-10">
              <div className="mb-8 flex items-center gap-3">
                <CalendarDays className="text-teal" size={18} />
                <h4 className="text-xl font-display uppercase tracking-wider text-white">Availability & Capacity</h4>
              </div>

              <div className="space-y-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Max Bookings Per Day</label>
                  <input
                    type="number"
                    min={1}
                    value={availability.maxBookingsPerDay}
                    onChange={(event) => setAvailability((current) => ({
                      ...current,
                      maxBookingsPerDay: Math.max(1, Number(event.target.value) || 1),
                    }))}
                    className="input-field bg-white/5 border-white/10 text-white focus:border-teal"
                  />
                </div>

                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">Available Detailing Times</p>
                  <div className="mt-4 flex flex-wrap gap-3">
                    {DETAILING_TIME_OPTIONS.map((time) => {
                      const selected = availability.availableDetailingTimes.includes(time);
                      return (
                        <button
                          key={time}
                          type="button"
                          onClick={() => toggleDetailingTime(time)}
                          className={cn(
                            'rounded-xl border px-4 py-3 text-[10px] font-bold uppercase tracking-widest transition-colors',
                            selected
                              ? 'border-teal bg-teal/10 text-teal'
                              : 'border-white/10 bg-white/5 text-white/65 hover:border-white/20 hover:text-white',
                          )}
                        >
                          {time}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">Available Residential / Commercial Windows</p>
                  <div className="mt-4 grid gap-3 md:grid-cols-3">
                    {TIME_WINDOW_OPTIONS.map((option) => {
                      const selected = availability.availableTimeWindows.includes(option.id);
                      return (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => toggleTimeWindow(option.id)}
                          className={cn(
                            'rounded-2xl border p-4 text-left transition-colors',
                            selected
                              ? 'border-teal bg-teal/10'
                              : 'border-white/10 bg-white/5 hover:border-white/20',
                          )}
                        >
                          <p className={cn('text-xs font-bold uppercase tracking-widest', selected ? 'text-teal' : 'text-white')}>
                            {option.label}
                          </p>
                          <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-white/35">
                            {option.window}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <div className="dark-card border-white/5 p-8">
              <p className="text-xs font-bold uppercase tracking-widest text-white/40">Blocked Dates</p>
              <p className="mt-2 text-sm text-white/50">
                Select dates that should be unavailable for new bookings. Customers will see these dates disabled in the booking calendar.
              </p>
              <div className="admin-calendar mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
                <DayPicker
                  mode="multiple"
                  selected={availability.blockedDates.map(isoToDate)}
                  onSelect={handleBlockedDatesChange}
                  disabled={{ before: new Date() }}
                  showOutsideDays
                />
              </div>
            </div>

            <div className="dark-card border-white/5 p-6">
              <p className="text-xs font-bold uppercase tracking-widest text-white/40">Current Availability Snapshot</p>
              <div className="mt-4 space-y-3 text-[10px] font-bold uppercase tracking-widest">
                <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                  <span className="text-white/45">Blocked dates</span>
                  <span className="text-teal">{availability.blockedDates.length}</span>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                  <span className="text-white/45">Detailing slots</span>
                  <span className="text-teal">{availability.availableDetailingTimes.length}</span>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                  <span className="text-white/45">Time windows</span>
                  <span className="text-teal">{availability.availableTimeWindows.length}</span>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                  <span className="text-white/45">Capacity per day</span>
                  <span className="text-teal">{availability.maxBookingsPerDay}</span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6">
              <div className="flex items-center gap-4">
                <AlertCircle className="text-red-400" size={24} />
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-red-300">Operational Note</p>
                  <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-red-200/55">
                    Capacity changes affect future bookings only. Existing bookings are left untouched.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div
                className={cn(
                  'text-[10px] uppercase tracking-widest',
                  statusTone === 'error'
                    ? 'text-red-300'
                    : statusTone === 'success'
                      ? 'text-emerald-300'
                      : 'text-white/30',
                )}
              >
                {status || 'General settings and availability are saved together.'}
              </div>
              <button
                type="button"
                onClick={() => void handleSave()}
                disabled={saving}
                className="btn-primary flex items-center gap-2 px-8 py-3 text-xs disabled:opacity-50"
              >
                <Save size={16} />
                {saving ? 'SAVING...' : 'SAVE SETTINGS'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
