import React from 'react';
import { AlertCircle, Bell, Database, Globe, Palette, Save, Settings, Shield } from 'lucide-react';
import { doc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { cn } from '@/src/lib/utils';

const sections = [
  { id: 'general', label: 'General', icon: Settings },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'data', label: 'Data & Sync', icon: Database },
  { id: 'regions', label: 'Service Regions', icon: Globe },
  { id: 'branding', label: 'Branding', icon: Palette },
];

interface GeneralSettings {
  businessName: string;
  supportEmail: string;
  supportPhone: string;
  serviceRegion: string;
  maintenanceMode: boolean;
  requireTwoFactor: boolean;
  publicRegistration: boolean;
}

const defaultSettings: GeneralSettings = {
  businessName: 'Crystalline Max',
  supportEmail: 'support@crystallinemax.com',
  supportPhone: '+44 161 123 4567',
  serviceRegion: 'Greater Manchester',
  maintenanceMode: false,
  requireTwoFactor: true,
  publicRegistration: true,
};

export const AdminSettings: React.FC = () => {
  const [settings, setSettings] = React.useState<GeneralSettings>(defaultSettings);
  const [saving, setSaving] = React.useState(false);
  const [status, setStatus] = React.useState<string | null>(null);

  React.useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'settings', 'general'), (snapshot) => {
      if (snapshot.exists()) {
        setSettings({
          ...defaultSettings,
          ...(snapshot.data() as Partial<GeneralSettings>),
        });
      }
    });

    return () => unsubscribe();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setStatus(null);

    try {
      await setDoc(doc(db, 'settings', 'general'), {
        ...settings,
        updatedAt: serverTimestamp(),
      }, { merge: true });
      setStatus('Settings saved.');
    } catch (error) {
      console.error('Failed to save settings:', error);
      setStatus('Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-charcoal pt-32 pb-20 px-4">
      <div className="max-w-4xl mx-auto">
        <header className="mb-12">
          <h2 className="text-teal text-xs tracking-[0.4em] mb-4 uppercase">Configuration</h2>
          <h3 className="text-4xl text-white font-display uppercase">System Settings</h3>
          <p className="text-white/40 mt-2 uppercase tracking-widest text-xs font-bold">Values are stored in Firestore at settings/general</p>
        </header>

        <div className="grid md:grid-cols-4 gap-8">
          <div className="md:col-span-1 space-y-2">
            {sections.map((section, idx) => (
              <button
                key={section.id}
                className={cn(
                  'w-full p-4 flex items-center gap-3 rounded-custom text-[10px] font-bold uppercase tracking-widest transition-all',
                  idx === 0 ? 'bg-teal text-charcoal' : 'text-white/40 hover:bg-white/5 hover:text-white',
                )}
              >
                <section.icon size={16} /> {section.label}
              </button>
            ))}
          </div>

          <div className="md:col-span-3 space-y-8">
            <div className="dark-card p-10 border-white/5">
              <h4 className="text-xl font-display uppercase text-white mb-8 tracking-wider">General Configuration</h4>

              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Business Name</label>
                    <input
                      type="text"
                      value={settings.businessName}
                      onChange={(event) => setSettings((prev) => ({ ...prev, businessName: event.target.value }))}
                      className="bg-white/5 border border-white/10 rounded-custom px-4 py-3 text-sm text-white w-full focus:border-teal/50 outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Support Email</label>
                    <input
                      type="email"
                      value={settings.supportEmail}
                      onChange={(event) => setSettings((prev) => ({ ...prev, supportEmail: event.target.value }))}
                      className="bg-white/5 border border-white/10 rounded-custom px-4 py-3 text-sm text-white w-full focus:border-teal/50 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Support Phone</label>
                    <input
                      type="text"
                      value={settings.supportPhone}
                      onChange={(event) => setSettings((prev) => ({ ...prev, supportPhone: event.target.value }))}
                      className="bg-white/5 border border-white/10 rounded-custom px-4 py-3 text-sm text-white w-full focus:border-teal/50 outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Service Region</label>
                    <input
                      type="text"
                      value={settings.serviceRegion}
                      onChange={(event) => setSettings((prev) => ({ ...prev, serviceRegion: event.target.value }))}
                      className="bg-white/5 border border-white/10 rounded-custom px-4 py-3 text-sm text-white w-full focus:border-teal/50 outline-none"
                    />
                  </div>
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
                      className="w-full flex items-center justify-between p-4 bg-white/5 rounded-custom border border-white/10 text-left"
                    >
                      <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-white">{item.label}</p>
                        <p className="text-[8px] text-white/20 uppercase font-bold mt-1">{item.description}</p>
                      </div>
                      <div className={cn('w-10 h-5 rounded-full relative transition-colors', settings[item.key] ? 'bg-teal' : 'bg-white/10')}>
                        <div className={cn('absolute top-1 w-3 h-3 rounded-full transition-all', settings[item.key] ? 'right-1 bg-charcoal' : 'left-1 bg-white/40')} />
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-12 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="text-[10px] uppercase tracking-widest text-white/30">
                  {status || 'Changes are written to Firestore when saved.'}
                </div>
                <button
                  onClick={() => void handleSave()}
                  disabled={saving}
                  className="btn-primary px-8 py-3 text-xs flex items-center gap-2 disabled:opacity-50"
                >
                  <Save size={16} /> {saving ? 'SAVING...' : 'SAVE SETTINGS'}
                </button>
              </div>
            </div>

            <div className="p-6 rounded-custom bg-red-500/5 border border-red-500/20 flex items-center gap-4">
              <AlertCircle className="text-red-500" size={24} />
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-red-500">Danger Zone</p>
                <p className="text-[10px] text-red-500/40 uppercase font-bold">There is no destructive action wired into this local build.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
