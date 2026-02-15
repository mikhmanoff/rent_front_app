// pages/Favorites.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Listing } from '../types';
import { getFavoriteListings, convertToListing, removeFavorite } from '../api/client';
import ListingCard from '../components/ListingCard';

interface FavoritesProps {
  favorites: number[];
  setFavorites: (favs: number[]) => void;
  onBack: () => void;
}

const Favorites: React.FC<FavoritesProps> = ({ favorites, setFavorites, onBack }) => {
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Загружаем избранные объявления
  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async (reset = true) => {
    try {
      setIsLoading(true);
      const currentPage = reset ? 1 : page;
      const response = await getFavoriteListings(currentPage, 20);
      
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
      console.error('Failed to load favorites:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleFavorite = async (id: number) => {
    const isFav = favorites.includes(id);
    
    // Оптимистичное обновление
    const newFavorites = isFav 
      ? favorites.filter(fid => fid !== id)
      : [...favorites, id];
    setFavorites(newFavorites);

    if (isFav) {
      // Удаляем — убираем карточку из списка
      setListings(prev => prev.filter(l => l.id !== id));
      setTotal(prev => prev - 1);
      
      try {
        await removeFavorite(id);
      } catch (err) {
        // Откат
        setFavorites(favorites);
        setListings(prev => [...prev]); // refresh
      }
    }
  };

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      if (scrollHeight - scrollTop - clientHeight < 200 && hasMore && !isLoading) {
        setPage(prev => prev + 1);
        loadFavorites(false);
      }
    }
  };

  // Telegram Back Button
  useEffect(() => {
    if (window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      tg.BackButton.show();
      tg.BackButton.onClick(onBack);
      return () => {
        tg.BackButton.hide();
        tg.BackButton.offClick(onBack);
      };
    }
  }, [onBack]);

  // Loading
  if (isLoading && listings.length === 0) {
    return (
      <div className="w-full h-[100dvh] flex flex-col items-center justify-center bg-white">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-gray-500">Загрузка избранного...</p>
      </div>
    );
  }

  // Empty state
  if (!isLoading && listings.length === 0) {
    return (
      <div className="w-full h-[100dvh] flex flex-col items-center justify-center bg-white p-8 text-center">
        <div className="text-[64px] mb-6">💔</div>
        <h2 className="text-2xl font-bold text-[#1A1A1A] mb-3">Пока пусто</h2>
        <p className="text-base text-gray-500 mb-8 leading-relaxed">
          Нажимайте ❤️ на понравившихся объявлениях,<br/>
          и они появятся здесь
        </p>
        <button 
          onClick={onBack}
          className="bg-[#2481cc] text-white font-bold py-4 px-8 rounded-2xl active:scale-[0.98] transition-all shadow-lg"
        >
          Смотреть объявления
        </button>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[100dvh] bg-white">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
        <button 
          onClick={onBack}
          className="p-2 -ml-2 text-black"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-lg font-bold">Избранное</h1>
        <div className="text-sm text-gray-400 font-medium">{total} шт</div>
      </div>

      {/* Feed */}
      <div 
        ref={scrollRef}
        onScroll={handleScroll}
        className="w-full h-full overflow-y-scroll snap-y snap-mandatory no-scrollbar pt-[56px]"
      >
        {listings.map((listing) => (
          <ListingCard 
            key={listing.id} 
            listing={listing} 
            isFavorite={favorites.includes(listing.id)}
            onToggleFavorite={toggleFavorite}
          />
        ))}
        
        {isLoading && (
          <div className="w-full h-[100dvh] snap-start flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>
    </div>
  );
};

export default Favorites;