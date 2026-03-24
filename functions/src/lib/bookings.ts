export interface StaffTask {
  id: string;
  title: string;
  category: string;
  priority: 'low' | 'medium' | 'high';
}

const CAR_ADDON_LABELS: Record<string, string> = {
  'ceramic-boost': 'Ceramic boost finish',
  'seat-shampoo': 'Seat shampoo treatment',
  'pet-hair': 'Pet hair removal',
  'engine-bay': 'Engine bay detailing',
};

const HOME_ADDON_LABELS: Record<string, string> = {
  'inside-fridge': 'Inside fridge clean',
  'inside-oven': 'Inside oven clean',
  laundry: 'Laundry and linen reset',
  'after-build': 'After-build detailing',
};

const SERVICE_TASKS: Record<string, StaffTask[]> = {
  'car-full': [
    { id: 'wash', title: 'Exterior pressure wash', category: 'Detailing', priority: 'high' },
    { id: 'interior', title: 'Interior vacuum and dust', category: 'Detailing', priority: 'high' },
    { id: 'paint', title: 'Paint correction pass', category: 'Detailing', priority: 'medium' },
    { id: 'finish', title: 'Final glass and trim finish', category: 'Detailing', priority: 'medium' },
  ],
  'car-exterior': [
    { id: 'wash', title: 'Exterior wash and rinse', category: 'Detailing', priority: 'high' },
    { id: 'polish', title: 'Polish and seal finish', category: 'Detailing', priority: 'medium' },
    { id: 'wheels', title: 'Wheel and tire dressing', category: 'Detailing', priority: 'medium' },
  ],
  'car-interior': [
    { id: 'vacuum', title: 'Full vacuum and mat reset', category: 'Detailing', priority: 'high' },
    { id: 'steam', title: 'Steam clean high-contact areas', category: 'Detailing', priority: 'high' },
    { id: 'finish', title: 'Dashboard and trim finish', category: 'Detailing', priority: 'medium' },
  ],
  home: [
    { id: 'kitchen', title: 'Kitchen sanitization', category: 'Residential', priority: 'high' },
    { id: 'bathroom', title: 'Bathroom deep clean', category: 'Residential', priority: 'high' },
    { id: 'surfaces', title: 'Living area surfaces', category: 'Residential', priority: 'medium' },
  ],
  office: [
    { id: 'desks', title: 'Desk and device sanitization', category: 'Commercial', priority: 'high' },
    { id: 'common', title: 'Common area cleaning', category: 'Commercial', priority: 'medium' },
    { id: 'waste', title: 'Waste and restroom reset', category: 'Commercial', priority: 'medium' },
  ],
  industrial: [
    { id: 'inspection', title: 'Safety inspection', category: 'Industrial', priority: 'high' },
    { id: 'floor', title: 'Floor and surface clean', category: 'Industrial', priority: 'high' },
    { id: 'equipment', title: 'Equipment wipe-down', category: 'Industrial', priority: 'medium' },
  ],
};

export function getAddonLabel(serviceId: string, addonId: string) {
  if (serviceId.startsWith('car')) {
    return CAR_ADDON_LABELS[addonId] ?? addonId;
  }

  return HOME_ADDON_LABELS[addonId] ?? addonId;
}

export function getBookingTasks(serviceId: string, addons: string[] = []) {
  const baseTasks = SERVICE_TASKS[serviceId] ?? [];
  const addonTasks = addons.map<StaffTask>((addonId) => ({
    id: `addon-${addonId}`,
    title: getAddonLabel(serviceId, addonId),
    category: 'Add-on',
    priority: 'medium',
  }));

  return [...baseTasks, ...addonTasks];
}
