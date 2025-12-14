
import { useState, useMemo } from 'react';
import { Listing, FilterState, Currency } from '../types';

export const useFilters = (initialListings: Listing[]) => {
  const [filters, setFilters] = useState<FilterState>({
    priceMin: '',
    priceMax: '',
    currency: 'USD',
    rooms: [],
    district: [],
    metro: [],
    furniture: null,
    renovation: null,
    conditioner: null,
    petsAllowed: null,
  });

  const filteredListings = useMemo(() => {
    return initialListings.filter(listing => {
      if (filters.priceMin && listing.pricePerMonth < parseInt(filters.priceMin)) return false;
      if (filters.priceMax && listing.pricePerMonth > parseInt(filters.priceMax)) return false;
      
      if (filters.rooms.length > 0 && !filters.rooms.includes(listing.rooms)) return false;
      
      if (filters.district.length > 0 && !filters.district.includes(listing.district)) return false;

      if (filters.metro.length > 0 && (!listing.metro || !filters.metro.includes(listing.metro))) return false;
      
      if (filters.furniture !== null && listing.furniture !== filters.furniture) return false;
      if (filters.renovation !== null && listing.renovation !== filters.renovation) return false;
      if (filters.conditioner !== null && listing.conditioner !== filters.conditioner) return false;
      if (filters.petsAllowed !== null && listing.petsAllowed !== filters.petsAllowed) return false;
      
      return true;
    });
  }, [initialListings, filters]);

  return {
    filters,
    setFilters,
    filteredListings
  };
};
