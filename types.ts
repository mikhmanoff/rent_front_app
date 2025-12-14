
export type Currency = 'UZS' | 'USD';
export type PropertyType = 'apartment' | 'house' | 'studio';

export interface Listing {
  id: number;
  
  // Price
  pricePerMonth: number;
  currency: Currency;
  
  // Basic info
  rooms: number | string;
  area: number;
  floor: number;
  totalFloors: number;
  address: string;
  district: string;
  metro?: string;
  
  // Photos
  photos: string[];
  
  // Tags/Features
  type: PropertyType;
  furniture: boolean;
  renovation: boolean;
  heating: 'central' | 'gas' | 'electric';
  conditioner: boolean;
  
  // Urgency/Social proof
  viewsToday: number;
  favoritesCount: number;
  
  // Details for bottom sheet
  description: string;
  deposit: number; // months
  minPeriodMonths: number;
  utilitiesIncluded: boolean;
  availableFrom: string;
  petsAllowed: boolean;
  kidsAllowed: boolean;
  
  // Contacts
  ownerPhone: string;
  ownerTelegram: string;
}

export interface FilterState {
  priceMin: string;
  priceMax: string;
  currency: Currency;
  rooms: (number | string)[];
  district: string[];
  metro: string[];
  furniture: boolean | null;
  renovation: boolean | null;
  conditioner: boolean | null;
  petsAllowed: boolean | null;
}

declare global {
  interface Window {
    Telegram: any;
  }
}
