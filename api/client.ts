// api/client.ts
/**
 * API клиент для работы с бэкендом
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8001';

export interface ListingFromAPI {
  id: number;
  post_id: number;
  price: number | null;
  currency: string | null;
  price_period: string | null;
  deposit: number | null;
  rooms: number | null;
  area: number | null;
  floor: number | null;
  total_floors: number | null;
  district: string | null;
  metro: string | null;
  address: string | null;
  deal_type: string | null;
  object_type: string | null;
  has_furniture: boolean | null;
  has_conditioner: boolean | null;
  has_commission: boolean;
  photos: string[];
  description: string | null;
  phones: string[];
  views_today: number;
  favorites_count: number;
  published_at: string;
}

export interface ListingsResponse {
  items: ListingFromAPI[];
  total: number;
  page: number;
  page_size: number;
  has_more: boolean;
}

export interface District {
  id: number;
  name_ru: string;
  name_uz: string | null;
}

export interface MetroStation {
  id: number;
  name_ru: string;
  name_uz: string | null;
  line_name: string | null;
  line_color: string | null;
}

export interface ListingsFilter {
  deal_type?: string;
  object_type?: string;
  rooms?: string;
  price_min?: number;
  price_max?: number;
  currency?: string;
  district?: string;
  metro?: string;
  page?: number;
  page_size?: number;
}

class APIClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE) {
    this.baseUrl = baseUrl;
  }

  private async fetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Получить список объявлений с фильтрами
   */
  async getListings(filters: ListingsFilter = {}): Promise<ListingsResponse> {
    const params = new URLSearchParams();
    
    if (filters.deal_type) params.set('deal_type', filters.deal_type);
    if (filters.object_type) params.set('object_type', filters.object_type);
    if (filters.rooms) params.set('rooms', filters.rooms);
    if (filters.price_min) params.set('price_min', filters.price_min.toString());
    if (filters.price_max) params.set('price_max', filters.price_max.toString());
    if (filters.currency) params.set('currency', filters.currency);
    if (filters.district) params.set('district', filters.district);
    if (filters.metro) params.set('metro', filters.metro);
    if (filters.page) params.set('page', filters.page.toString());
    if (filters.page_size) params.set('page_size', filters.page_size.toString());

    const query = params.toString();
    return this.fetch<ListingsResponse>(`/api/listings${query ? `?${query}` : ''}`);
  }

  /**
   * Получить одно объявление
   */
  async getListing(id: number): Promise<ListingFromAPI> {
    return this.fetch<ListingFromAPI>(`/api/listings/${id}`);
  }

  /**
   * Получить список районов
   */
  async getDistricts(): Promise<District[]> {
    return this.fetch<District[]>('/api/districts');
  }

  /**
   * Получить список станций метро
   */
  async getMetroStations(): Promise<MetroStation[]> {
    return this.fetch<MetroStation[]>('/api/metro');
  }

  /**
   * Получить статистику
   */
  async getStats(): Promise<{ total_listings: number; active_listings: number; channels_count: number }> {
    return this.fetch('/api/stats');
  }
}

// Singleton instance
export const api = new APIClient();

// Helper для конвертации API ответа в формат фронта
export function convertToListing(item: ListingFromAPI): import('../types').Listing {
  return {
    id: item.id,
    pricePerMonth: item.price || 0,
    currency: (item.currency?.toUpperCase() === 'UZS' ? 'UZS' : 'USD') as 'USD' | 'UZS',
    rooms: item.rooms || 1,
    area: item.area || 0,
    floor: item.floor || 1,
    totalFloors: item.total_floors || 1,
    address: item.address || item.district || 'Ташкент',
    district: item.district || '',
    metro: item.metro || undefined,
    photos: item.photos.length > 0 ? item.photos : ['https://via.placeholder.com/800x600?text=No+Photo'],
    type: 'apartment',
    furniture: item.has_furniture || false,
    renovation: false, // нет в API пока
    conditioner: item.has_conditioner || false,
    viewsToday: item.views_today,
    favoritesCount: item.favorites_count,
    description: item.description || '',
    deposit: item.deposit ? Math.round(item.deposit / (item.price || 1)) : 0,
    minPeriodMonths: 1,
    utilitiesIncluded: false,
    availableFrom: new Date().toISOString().split('T')[0],
    petsAllowed: false,
    kidsAllowed: true,
    heating: 'central',
    ownerPhone: item.phones[0] || '',
    ownerTelegram: '',
  };
}