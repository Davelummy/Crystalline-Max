import { Car, Home, Building2, ShieldCheck } from 'lucide-react';

export const SERVICES = [
  { id: 'car-full', label: 'Full Detailing Package', icon: Car, basePrice: 149, type: 'car', requiresQuote: false },
  { id: 'car-exterior', label: 'Exterior Wash & Polish', icon: Car, basePrice: 69, type: 'car', requiresQuote: false },
  { id: 'car-interior', label: 'Interior Deep Clean', icon: Car, basePrice: 89, type: 'car', requiresQuote: false },
  { id: 'home', label: 'Residential Cleaning', icon: Home, basePrice: 50, type: 'home', requiresQuote: false },
  { id: 'office', label: 'Office Cleaning', icon: Building2, basePrice: 150, type: 'office', requiresQuote: true },
  { id: 'industrial', label: 'Industrial Cleaning', icon: ShieldCheck, basePrice: 300, type: 'industrial', requiresQuote: true },
];

export const CAR_ADDONS = [
  { id: 'ceramic', label: 'Ceramic Coating', price: 149 },
  { id: 'interior-steam', label: 'Deep Interior Steam', price: 50 },
  { id: 'engine', label: 'Engine Bay Detail', price: 35 },
  { id: 'leather', label: 'Leather Conditioning', price: 35 },
  { id: 'clay', label: 'Clay Bar Treatment', price: 40 },
  { id: 'pet', label: 'Pet Hair Removal', price: 25 },
];

export const HOME_ADDONS = [
  { id: 'windows', label: 'Window Cleaning', price: 35 },
  { id: 'carpet', label: 'Carpet Shampoo', price: 65 },
  { id: 'oven', label: 'Oven Deep Clean', price: 40 },
  { id: 'fridge', label: 'Fridge Sanitization', price: 20 },
];
