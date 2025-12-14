
import React, { useState, useEffect, useRef } from 'react';
import { mockListings } from '../data/mockListings';
import { useFilters } from '../hooks/useFilters';
import ListingCard from '../components/ListingCard';
import FilterPanel from '../components/FilterPanel';
import EndScreen from '../components/EndScreen';

const Feed: React.FC = () => {
  const { filters, setFilters, filteredListings } = useFilters(mockListings);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('favorites');
    if (saved) setFavorites(JSON.parse(saved));
  }, []);

  const toggleFavorite = (id: number) => {
    const next = favorites.includes(id) 
      ? favorites.filter(fid => fid !== id) 
      : [...favorites, id];
    setFavorites(next);
    localStorage.setItem('favorites', JSON.stringify(next));
  };

  const handleScroll = () => {
    if (scrollRef.current) {
      const height = scrollRef.current.offsetHeight;
      const index = Math.round(scrollRef.current.scrollTop / height);
      if (index !== currentIndex) {
        setCurrentIndex(index);
        if (window.Telegram?.WebApp?.HapticFeedback) {
          window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
        }
      }
    }
  };

  const handleRestart = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.impactOccurred('medium');
    }
  };

  const handleSubscribe = () => {
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.showAlert('Готово! Мы сообщим о новых квартирах по вашим фильтрам.');
      window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
    } else {
      alert('Подписка оформлена!');
    }
  };

  return (
    <div className="relative w-full h-[100dvh] bg-white">
      {/* Top Filter Panel */}
      <FilterPanel 
        filters={filters} 
        setFilters={setFilters} 
        count={filteredListings.length}
        isOpen={isFilterOpen}
        setIsOpen={setIsFilterOpen}
      />
      
      {/* Vertical Feed with Snap Scrolling */}
      <div 
        ref={scrollRef}
        onScroll={handleScroll}
        className="w-full h-full overflow-y-scroll snap-y snap-mandatory no-scrollbar"
      >
        {filteredListings.length > 0 ? (
          <>
            {filteredListings.map((listing) => (
              <ListingCard 
                key={listing.id} 
                listing={listing} 
                isFavorite={favorites.includes(listing.id)}
                onToggleFavorite={toggleFavorite}
              />
            ))}
            
            {/* End Screen at the very bottom of the results */}
            <EndScreen 
              totalCount={filteredListings.length}
              filters={filters}
              onSubscribe={handleSubscribe}
              onChangeFilters={() => setIsFilterOpen(true)}
              onRestart={handleRestart}
            />
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 p-10 text-center bg-white">
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
  );
};

export default Feed;
