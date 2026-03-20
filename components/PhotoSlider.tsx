import React, { useState, useRef, useEffect, memo } from 'react';

const PLACEHOLDER_PHOTO = 'https://via.placeholder.com/800x600?text=Нет+фото';

interface PhotoSliderProps {
  photos: string[];
  initialIndex?: number;
  onIndexChange?: (index: number) => void;
}

const PhotoSlider: React.FC<PhotoSliderProps> = memo(({ 
  photos, 
  initialIndex = 0, 
  onIndexChange,
}) => {
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastSyncedIndex = useRef(initialIndex);

  // Sync when initialIndex changes from outside (e.g. returning from gallery)
  useEffect(() => {
    if (initialIndex !== lastSyncedIndex.current && scrollRef.current) {
      lastSyncedIndex.current = initialIndex;
      const width = scrollRef.current.offsetWidth;
      // Use instant scroll — no animation, no flicker
      scrollRef.current.scrollTo({ left: width * initialIndex, behavior: 'instant' as ScrollBehavior });
      setActiveIndex(initialIndex);
    }
  }, [initialIndex]);

  const handleScroll = () => {
    if (scrollRef.current) {
      const width = scrollRef.current.offsetWidth;
      if (width === 0) return;
      const index = Math.round(scrollRef.current.scrollLeft / width);
      if (index !== activeIndex && index >= 0 && index < photos.length) {
        setActiveIndex(index);
        lastSyncedIndex.current = index;
        onIndexChange?.(index);
        window.Telegram?.WebApp?.HapticFeedback?.impactOccurred('light');
      }
    }
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.target as HTMLImageElement;
    if (!img.src.includes('placeholder.com')) {
      img.src = PLACEHOLDER_PHOTO;
    }
  };

  return (
    <div 
      className="relative w-full h-full"
      style={{ contain: 'layout style paint' }}
    >
      <div 
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex overflow-x-auto snap-x snap-mandatory h-full no-scrollbar"
        style={{ 
          WebkitOverflowScrolling: 'touch',
          overscrollBehaviorX: 'contain',
        }}
      >
        {photos.map((photo, i) => (
          <div key={i} className="w-full h-full flex-shrink-0 snap-center">
            <img 
              src={photo} 
              alt={`Photo ${i + 1}`} 
              className="w-full h-full object-cover pointer-events-none"
              loading="lazy"
              draggable={false}
              onError={handleImageError}
            />
          </div>
        ))}
      </div>
      
      {/* Photo counter badge */}
      {photos.length > 1 && (
        <div className="absolute top-4 right-4 bg-black/50 text-white text-xs font-bold px-2.5 py-1 rounded-full backdrop-blur-sm z-10 pointer-events-none">
          {activeIndex + 1} / {photos.length}
        </div>
      )}

      {/* Pagination bars */}
      {photos.length > 1 && (
        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1 z-10 pointer-events-none px-6">
          {photos.map((_, i) => (
            <div 
              key={i} 
              className={`h-1 flex-1 rounded-full transition-colors duration-200 ${
                i === activeIndex ? 'bg-white' : 'bg-white/30'
              }`}
              style={{ maxWidth: '40px' }}
            />
          ))}
        </div>
      )}
    </div>
  );
});

PhotoSlider.displayName = 'PhotoSlider';

export default PhotoSlider;