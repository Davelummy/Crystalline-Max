import React from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/firebase';

export interface GeneralSettings {
  businessName: string;
  supportEmail: string;
  supportPhone: string;
  businessAddress: string;
  serviceRegion: string;
  maintenanceMode: boolean;
  requireTwoFactor: boolean;
  publicRegistration: boolean;
}

export const DEFAULT_GENERAL_SETTINGS: GeneralSettings = {
  businessName: 'Crystalline Max Ltd',
  supportEmail: 'admin@ctmds.co.uk',
  supportPhone: '07425 241192',
  businessAddress: 'International House\n61 Mosley Street\nManchester\nM2 3HZ',
  serviceRegion: 'Manchester, Salford, Stockport, Oxfordshire and close environs',
  maintenanceMode: false,
  requireTwoFactor: true,
  publicRegistration: true,
};

function normalizeServiceRegion(value?: string) {
  if (!value) return DEFAULT_GENERAL_SETTINGS.serviceRegion;

  const normalized = value.trim();
  if (!normalized) return DEFAULT_GENERAL_SETTINGS.serviceRegion;

  const lower = normalized.toLowerCase();
  const mentionsCoreAreas =
    lower.includes('greater manchester') ||
    (lower.includes('manchester') && lower.includes('salford') && lower.includes('stockport'));

  if (mentionsCoreAreas && !lower.includes('oxfordshire')) {
    return DEFAULT_GENERAL_SETTINGS.serviceRegion;
  }

  return normalized;
}

function migrateLegacyGeneralSettings(value?: Partial<GeneralSettings> | null): Partial<GeneralSettings> {
  if (!value) {
    return {};
  }

  return {
    ...value,
    businessName: value.businessName === 'Crystalline Max' ? DEFAULT_GENERAL_SETTINGS.businessName : value.businessName,
    supportEmail: value.supportEmail === 'support@crystallinemax.co.uk' ? DEFAULT_GENERAL_SETTINGS.supportEmail : value.supportEmail,
    supportPhone: value.supportPhone === '+44 161 524 7812' ? DEFAULT_GENERAL_SETTINGS.supportPhone : value.supportPhone,
    businessAddress: value.businessAddress || DEFAULT_GENERAL_SETTINGS.businessAddress,
    serviceRegion: normalizeServiceRegion(value.serviceRegion),
  };
}

export function normalizeGeneralSettings(value?: Partial<GeneralSettings> | null): GeneralSettings {
  return {
    ...DEFAULT_GENERAL_SETTINGS,
    ...migrateLegacyGeneralSettings(value),
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
