import React from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/firebase';

export interface GeneralSettings {
  businessName: string;
  supportEmail: string;
  supportPhone: string;
  serviceRegion: string;
  maintenanceMode: boolean;
  requireTwoFactor: boolean;
  publicRegistration: boolean;
}

export const DEFAULT_GENERAL_SETTINGS: GeneralSettings = {
  businessName: 'Crystalline Max',
  supportEmail: 'support@crystallinemax.co.uk',
  supportPhone: '+44 161 524 7812',
  serviceRegion: 'Greater Manchester',
  maintenanceMode: false,
  requireTwoFactor: true,
  publicRegistration: true,
};

export function normalizeGeneralSettings(value?: Partial<GeneralSettings> | null): GeneralSettings {
  return {
    ...DEFAULT_GENERAL_SETTINGS,
    ...(value || {}),
  };
}

export function useGeneralSettings() {
  const [settings, setSettings] = React.useState<GeneralSettings>(DEFAULT_GENERAL_SETTINGS);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    return onSnapshot(
      doc(db, 'settings', 'general'),
      (snapshot) => {
        setSettings(normalizeGeneralSettings(snapshot.exists() ? (snapshot.data() as Partial<GeneralSettings>) : null));
        setError(null);
        setLoading(false);
      },
      (nextError) => {
        console.error('Error loading general settings:', nextError);
        setError('General settings could not be loaded.');
        setLoading(false);
      },
    );
  }, []);

  return { settings, loading, error };
}
