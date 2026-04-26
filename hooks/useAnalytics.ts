// hooks/useAnalytics.ts
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8001';
const BATCH_INTERVAL_MS = 5000;
const MAX_BUFFER_SIZE = 20;

function generateSessionId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
}

function getInitData(): string {
  return window.Telegram?.WebApp?.initData || '';
}

class AnalyticsTracker {
  private sessionId: string;
  private buffer: any[] = [];
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private sessionStartTime: number;
  private initialized = false;

  constructor() {
    this.sessionId = generateSessionId();
    this.sessionStartTime = Date.now();
  }

  async init() {
    if (this.initialized) return;
    this.initialized = true;

    try {
      const initData = getInitData();
      const tg = window.Telegram?.WebApp;
      await fetch(`${API_BASE}/api/analytics/session/start?init_data=${encodeURIComponent(initData)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: this.sessionId,
          device_info: {
            platform: tg?.platform || navigator.userAgent.substring(0, 50),
            version: tg?.version || 'unknown',
            is_telegram: !!tg?.initData,
          },
        }),
      });
    } catch (e) {
      console.warn('[analytics] session start failed:', e);
    }

    this.track('app_open');

    this.intervalId = setInterval(() => this.flush(), BATCH_INTERVAL_MS);

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.track('app_close');
        this.flush();
        this.endSession();
      }
    });

    window.addEventListener('beforeunload', () => {
      this.flush();
      this.endSession();
    });
  }

  track(type: string, data?: Record<string, any>, listingId?: number) {
    this.buffer.push({
      type,
      listing_id: listingId || undefined,
      ...data,
    });
    if (this.buffer.length >= MAX_BUFFER_SIZE) {
      this.flush();
    }
  }

  async flush() {
    if (this.buffer.length === 0) return;
    const events = [...this.buffer];
    this.buffer = [];

    try {
      const initData = getInitData();
      await fetch(`${API_BASE}/api/analytics/events?init_data=${encodeURIComponent(initData)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: this.sessionId, events }),
      });
    } catch (e) {
      this.buffer.unshift(...events);
      console.warn('[analytics] flush failed:', e);
    }
  }

  private async endSession() {
    const duration = Math.round((Date.now() - this.sessionStartTime) / 1000);
    try {
      const initData = getInitData();
      const payload = JSON.stringify({ session_id: this.sessionId, duration_sec: duration });
      const url = `${API_BASE}/api/analytics/session/end?init_data=${encodeURIComponent(initData)}`;

      if (navigator.sendBeacon) {
        navigator.sendBeacon(url, new Blob([payload], { type: 'application/json' }));
      } else {
        await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: payload, keepalive: true });
      }
    } catch (e) { /* ignore */ }
  }

  getSessionId(): string { return this.sessionId; }

  destroy() {
    if (this.intervalId) clearInterval(this.intervalId);
    this.flush();
    this.endSession();
  }
}

// Singleton
export const analytics = new AnalyticsTracker();

// Convenience functions
export function trackListingView(listingId: number) {
  analytics.track('listing_view', undefined, listingId);
}

export function trackDetailsOpen(listingId: number) {
  analytics.track('listing_details', undefined, listingId);
}

export function trackContactClick(listingId: number, contactType: 'message' | 'call') {
  analytics.track(contactType === 'message' ? 'contact_message' : 'contact_call', undefined, listingId);
}

export function trackShare(listingId: number, type: 'click' | 'sent' | 'unlock') {
  const eventType = type === 'click' ? 'share_click' : type === 'sent' ? 'share_sent' : 'share_unlock';
  analytics.track(eventType, undefined, listingId);
}

export function trackFavorite(listingId: number, action: 'add' | 'remove') {
  analytics.track(action === 'add' ? 'favorite_add' : 'favorite_remove', undefined, listingId);
}

export function trackFilter(filters: Record<string, any>) {
  analytics.track('filter_apply', { filters });
}

export function trackPhotoGallery(listingId: number) {
  analytics.track('photo_gallery', undefined, listingId);
}