// hooks/useListings.ts
import { useState, useEffect, useCallback } from 'react';
import { Listing, FilterState } from '../types';
import { api, convertToListing, ListingsFilter } from '../api/client';

interface UseListingsResult {
  listings: Listing[];
  isLoading: boolean;
  error: string | null;
  total: number;
  hasMore: boolean;
  loadMore: () => void;
  refresh: () => void;
}

export function useListings(filters: FilterState): UseListingsResult {
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const buildApiFilters = useCallback((): ListingsFilter => {
    const apiFilters: ListingsFilter = {
      page,
      page_size: 20,
    };

    if (filters.rooms.length > 0) {
      apiFilters.rooms = filters.rooms.map(r => {
        if (r === 'Studio') return 'studio';
        if (r === '4+') return '4';
        return String(r);
      }).join(',');
    }

    if (filters.priceMin) apiFilters.price_min = parseInt(filters.priceMin);
    if (filters.priceMax) apiFilters.price_max = parseInt(filters.priceMax);

    apiFilters.currency = filters.currency.toLowerCase();

    // District и metro теперь числовые ID из API
    if (filters.district.length > 0) {
      apiFilters.district = filters.district.join(',');
    }

    if (filters.metro.length > 0) {
      apiFilters.metro = filters.metro.join(',');
    }

    apiFilters.deal_type = 'rent_long';

    return apiFilters;
  }, [filters, page]);

  const loadListings = useCallback(async (reset: boolean = false) => {
    try {
      setIsLoading(true);
      setError(null);

      const currentPage = reset ? 1 : page;
      const apiFilters = buildApiFilters();
      apiFilters.page = currentPage;

      const response = await api.getListings(apiFilters);

      const newListings = response.items
        .filter(item => item.photos && item.photos.length > 0)
        .map(convertToListing);

      if (reset) {
        setListings(newListings);
        setPage(1);
      } else {
        setListings(prev => [...prev, ...newListings]);
      }

      setTotal(response.total);
      setHasMore(response.has_more);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load listings');
      console.error('Failed to load listings:', err);
    } finally {
      setIsLoading(false);
    }
  }, [buildApiFilters, page]);

  useEffect(() => {
    setPage(1);
    loadListings(true);
  }, [
    filters.rooms.join(','),
    filters.priceMin,
    filters.priceMax,
    filters.currency,
    filters.district.join(','),
    filters.metro.join(','),
  ]);

  const loadMore = useCallback(() => {
    if (!isLoading && hasMore) {
      setPage(prev => prev + 1);
      loadListings(false);
    }
  }, [isLoading, hasMore, loadListings]);

  const refresh = useCallback(() => {
    setPage(1);
    loadListings(true);
  }, [loadListings]);

  return { listings, isLoading, error, total, hasMore, loadMore, refresh };
}

export function useReferenceData() {
  const [districts, setDistricts] = useState<{ id: string; name: string }[]>([]);
  const [metroStations, setMetroStations] = useState<{ id: string; name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [districtsData, metroData] = await Promise.all([
          api.getDistricts(),
          api.getMetroStations(),
        ]);
        setDistricts(districtsData.map(d => ({ id: d.id.toString(), name: d.name_ru })));
        setMetroStations(metroData.map(m => ({ id: m.id.toString(), name: m.name_ru })));
      } catch (err) {
        console.error('Failed to load reference data:', err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  return { districts, metroStations, isLoading };
}