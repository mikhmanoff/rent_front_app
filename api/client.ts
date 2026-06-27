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

// ============================================
// FIX: Правильное построение URL фото
// ============================================
function buildPhotoUrl(photoPath: string): string {
  // Если уже полный URL — не трогаем
  if (photoPath.startsWith('http://') || photoPath.startsWith('https://')) {
    return photoPath;
  }
  
  const base = (import.meta.env.VITE_API_URL || 'http://localhost:8001').replace(/\/$/, '');
  const path = photoPath.startsWith('/') ? photoPath : `/${photoPath}`;
  
  return `${base}${path}`;
}

const PLACEHOLDER_PHOTO = 'https://via.placeholder.com/800x600?text=Нет+фото';

// Helper для конвертации API ответа в формат фронта
export function convertToListing(item: ListingFromAPI): import('../types').Listing {
  // Фильтруем пустые пути и строим правильные URL
  const photos = item.photos
    .filter(p => p && p.trim() !== '')
    .map(buildPhotoUrl);
  
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
    photos: photos.length > 0 ? photos : [PLACEHOLDER_PHOTO],
    type: 'apartment',
    furniture: item.has_furniture || false,
    renovation: false,
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
    publishedAt: item.published_at,
  };
}

function getInitData(): string {
  return window.Telegram?.WebApp?.initData || '';
}

/**
 * Получить список избранных
 */
export async function getFavorites(): Promise<number[]> {
  const initData = getInitData();
  if (!initData) return [];

  const response = await fetch(`${API_BASE}/api/favorites`, {
    headers: { 'X-Telegram-Init-Data': initData },
  });

  if (!response.ok) return [];

  const data = await response.json();
  return data.favorites || [];
}

/**
 * Добавить в избранное
 */
export async function addFavorite(listingId: number): Promise<boolean> {
  const initData = getInitData();
  if (!initData) return false;

  const response = await fetch(`${API_BASE}/api/favorites/${listingId}`, {
    method: 'POST',
    headers: { 'X-Telegram-Init-Data': initData },
  });

  return response.ok;
}

/**
 * Удалить из избранного
 */
export async function removeFavorite(listingId: number): Promise<boolean> {
  const initData = getInitData();
  if (!initData) return false;

  const response = await fetch(`${API_BASE}/api/favorites/${listingId}`, {
    method: 'DELETE',
    headers: { 'X-Telegram-Init-Data': initData },
  });

  return response.ok;
}

/**
 * Получить полные данные избранных объявлений
 */
export async function getFavoriteListings(
  page: number = 1,
  pageSize: number = 20
): Promise<ListingsResponse> {
  const initData = getInitData();
  if (!initData) {
    return { items: [], total: 0, page: 1, page_size: pageSize, has_more: false };
  }

  const params = new URLSearchParams({
    page: page.toString(),
    page_size: pageSize.toString(),
  });

  const response = await fetch(`${API_BASE}/api/favorites/listings?${params}`, {
    headers: { 'X-Telegram-Init-Data': initData },
  });

  if (!response.ok) {
    return { items: [], total: 0, page: 1, page_size: pageSize, has_more: false };
  }

  return response.json();
}