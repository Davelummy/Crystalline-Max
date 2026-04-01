import { Car, Home, Building2, ShieldCheck } from 'lucide-react';

export const SERVICES = [
  { id: 'car-full', label: 'Full Detailing Package', icon: Car, basePrice: 85, type: 'car', requiresQuote: false },
  { id: 'car-exterior', label: 'Exterior Wash & Polish', icon: Car, basePrice: 45, type: 'car', requiresQuote: false },
  { id: 'car-interior', label: 'Interior Deep Clean', icon: Car, basePrice: 55, type: 'car', requiresQuote: false },
  { id: 'home', label: 'Residential Cleaning', icon: Home, basePrice: 45, type: 'home', requiresQuote: false },
  { id: 'office', label: 'Office Cleaning', icon: Building2, basePrice: 120, type: 'office', requiresQuote: true },
  { id: 'industrial', label: 'Industrial Cleaning', icon: ShieldCheck, basePrice: 250, type: 'industrial', requiresQuote: true },
];

export const CAR_ADDONS = [
  { id: 'ceramic', label: 'Ceramic Coating', price: 60 },
  { id: 'interior-steam', label: 'Deep Interior Steam', price: 40 },
  { id: 'engine', label: 'Engine Bay Detail', price: 30 },
  { id: 'leather', label: 'Leather Conditioning', price: 25 },
  { id: 'clay', label: 'Clay Bar Treatment', price: 35 },
  { id: 'pet', label: 'Pet Hair Removal', price: 20 },
];

export const HOME_ADDONS = [
  { id: 'windows', label: 'Window Cleaning', price: 25 },
  { id: 'carpet', label: 'Carpet Shampoo', price: 50 },
  { id: 'oven', label: 'Oven Deep Clean', price: 35 },
  { id: 'fridge', label: 'Fridge Sanitization', price: 15 },
];
