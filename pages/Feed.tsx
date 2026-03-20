// pages/Feed.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FilterState } from '../types';
import { useListings } from '../hooks/useListings';
import { getFavorites, addFavorite, removeFavorite } from '../api/client';
import ListingCard from '../components/ListingCard';
import FilterPanel from '../components/FilterPanel';
import EndScreen from '../components/EndScreen';

interface FeedProps {
  favorites: number[];
  setFavorites: (favs: number[]) => void;
  favoritesLoaded: boolean;
  setFavoritesLoaded: (loaded: boolean) => void;
  onOpenFavorites: () => void;
}

const Feed: React.FC<FeedProps> = ({ 
  favorites, setFavorites, 
  favoritesLoaded, setFavoritesLoaded,
  onOpenFavorites 
}) => {
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

  const { listings, isLoading, error, total, hasMore, loadMore, refresh } = useListings(filters);
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef(0);
  const currentIndexRef = useRef(0);

  // Загружаем избранное при старте
  useEffect(() => {
    if (favoritesLoaded) return;
    async function loadFavorites() {
      try {
        const favs = await getFavorites();
        setFavorites(favs);
      } catch (err) {
        console.error('Failed to load favorites from server:', err);
        const saved = localStorage.getItem('favorites');
        if (saved) {
          try { setFavorites(JSON.parse(saved)); } catch { setFavorites([]); }
        }
      } finally {
        setFavoritesLoaded(true);
      }
    }
    loadFavorites();
  }, [favoritesLoaded]);

  const toggleFavorite = async (id: number) => {
    const isFav = favorites.includes(id);
    const newFavorites = isFav 
      ? favorites.filter(fid => fid !== id)
      : [...favorites, id];
    setFavorites(newFavorites);

    const hasTelegram = !!window.Telegram?.WebApp?.initData;
    if (hasTelegram) {
      try {
        isFav ? await removeFavorite(id) : await addFavorite(id);
      } catch (err) {
        console.error('Failed to sync favorite:', err);
        setFavorites(favorites);
      }
    } else {
      localStorage.setItem('favorites', JSON.stringify(newFavorites));
    }
  };

  // Smooth scroll to specific index
  const scrollToIndex = useCallback((index: number) => {
    if (!scrollRef.current) return;
    const totalItems = listings.length + (hasMore ? 0 : 1); // +1 for EndScreen
    const clampedIndex = Math.max(0, Math.min(index, totalItems - 1));
    
    setIsScrolling(true);
    const height = scrollRef.current.offsetHeight;
    scrollRef.current.scrollTo({
      top: height * clampedIndex,
      behavior: 'smooth'
    });

    setCurrentIndex(clampedIndex);
    currentIndexRef.current = clampedIndex;

    // Unlock after animation
    setTimeout(() => setIsScrolling(false), 600);

    window.Telegram?.WebApp?.HapticFeedback?.impactOccurred('light');

    // Load more if near end
    if (clampedIndex >= listings.length - 3 && hasMore && !isLoading) {
      loadMore();
    }
  }, [listings.length, hasMore, isLoading, loadMore]);

  // Touch handling — detect swipe direction, move only 1 card
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (isScrolling) return;

    const touchEndY = e.changedTouches[0].clientY;
    const diff = touchStartY.current - touchEndY;
    const threshold = 50; // minimum swipe distance

    if (Math.abs(diff) < threshold) return; // too small, ignore

    if (diff > 0) {
      // Swipe up → next card
      scrollToIndex(currentIndexRef.current + 1);
    } else {
      // Swipe down → previous card
      scrollToIndex(currentIndexRef.current - 1);
    }
  }, [isScrolling, scrollToIndex]);

  // Prevent native scroll — we control it manually
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    if (isScrolling) return;

    if (e.deltaY > 30) {
      scrollToIndex(currentIndexRef.current + 1);
    } else if (e.deltaY < -30) {
      scrollToIndex(currentIndexRef.current - 1);
    }
  }, [isScrolling, scrollToIndex]);

  const handleRestart = () => {
    scrollToIndex(0);
    window.Telegram?.WebApp?.HapticFeedback?.impactOccurred('medium');
  };

  const handleSubscribe = () => {
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.showAlert('Готово! Мы сообщим о новых квартирах по вашим фильтрам.');
      window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
    } else {
      alert('Подписка оформлена!');
    }
  };

  // Loading state
  if ((isLoading && listings.length === 0) || !favoritesLoaded) {
    return (
      <div className="w-full h-[100dvh] flex flex-col items-center justify-center bg-white">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-gray-500">Загрузка объявлений...</p>
      </div>
    );
  }

  // Error state
  if (error && listings.length === 0) {
    return (
      <div className="w-full h-[100dvh] flex flex-col items-center justify-center bg-white p-6 text-center">
        <div className="text-5xl mb-4">😔</div>
        <p className="text-lg font-bold text-gray-800 mb-2">Ошибка загрузки</p>
        <p className="text-sm text-gray-500 mb-6">{error}</p>
        <button 
          onClick={refresh}
          className="bg-blue-500 text-white px-6 py-3 rounded-xl font-bold"
        >
          Попробовать снова
        </button>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[100dvh] bg-white">
      <FilterPanel 
        filters={filters} 
        setFilters={setFilters} 
        count={total}
        isOpen={isFilterOpen}
        setIsOpen={setIsFilterOpen}
      />

      <button 
        onClick={onOpenFavorites}
        className="fixed top-4 right-4 z-40 bg-black/20 backdrop-blur-md w-10 h-10 rounded-full border border-white/10 flex items-center justify-center active:scale-95 transition-transform"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="currentColor">
          <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
        {favorites.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
            {favorites.length > 99 ? '99' : favorites.length}
          </span>
        )}
      </button>
      
      {/* Vertical Feed — controlled scroll, 1 card at a time */}
      <div 
        ref={scrollRef}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd} 
        onWheel={handleWheel}
        className="w-full h-full overflow-hidden no-scrollbar"
        style={{ touchAction: 'none' }}
      >
        <div 
          style={{ 
            transform: `translateY(-${currentIndex * 100}dvh)`,
            transition: 'transform 0.5s cubic-bezier(0.32, 0.72, 0, 1)',
            willChange: 'transform',
          }}
        >
          {listings.length > 0 ? (
            <>
              {listings.map((listing) => (
                <ListingCard 
                  key={listing.id} 
                  listing={listing} 
                  isFavorite={favorites.includes(listing.id)}
                  onToggleFavorite={toggleFavorite}
                />
              ))}
              
              {isLoading && (
                <div className="w-full h-[100dvh] flex items-center justify-center">
                  <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
              
              {!hasMore && (
                <EndScreen 
                  totalCount={total}
                  filters={filters}
                  onSubscribe={handleSubscribe}
                  onChangeFilters={() => setIsFilterOpen(true)}
                  onRestart={handleRestart}
                />
              )}
            </>
          ) : (
            <div className="w-full h-[100dvh] flex flex-col items-center justify-center text-gray-400 p-10 text-center bg-white">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <p className="text-lg font-bold text-gray-800">Ничего не найдено</p>
              <p className="text-sm mt-2 opacity-60">Попробуйте изменить параметры фильтров</p>
              <button 
                onClick={() => setIsFilterOpen(true)}
                className="mt-6 bg-[#2481cc] text-white px-6 py-3 rounded-xl font-bold uppercase tracking-wider text-xs shadow-md active:scale-95 transition-transform"
              >
                Изменить фильтры
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Feed;