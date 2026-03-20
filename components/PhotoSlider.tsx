import React, { useState, useRef, useEffect, useCallback } from 'react';

const PLACEHOLDER_PHOTO = 'https://via.placeholder.com/800x600?text=Нет+фото';

interface PhotoSliderProps {
  photos: string[];
  initialIndex?: number;
  onIndexChange?: (index: number) => void;
  onPhotoClick?: () => void;
}

const PhotoSlider: React.FC<PhotoSliderProps> = ({ 
  photos, 
  initialIndex = 0, 
  onIndexChange,
  onPhotoClick 
}) => {
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      const width = scrollRef.current.offsetWidth;
      scrollRef.current.scrollLeft = width * initialIndex;
      setActiveIndex(initialIndex);
    }
  }, [initialIndex]);

  // Debounced scroll end — snap to nearest after momentum stops
  const handleScrollEnd = useCallback(() => {
    if (!scrollRef.current) return;
    const width = scrollRef.current.offsetWidth;
    const index = Math.round(scrollRef.current.scrollLeft / width);
    
    // Smooth snap to nearest photo
    scrollRef.current.scrollTo({
      left: width * index,
      behavior: 'smooth'
    });

    if (index !== activeIndex && index >= 0 && index < photos.length) {
      setActiveIndex(index);
      onIndexChange?.(index);
      window.Telegram?.WebApp?.HapticFeedback?.impactOccurred('light');
    }
  }, [activeIndex, photos.length, onIndexChange]);

  const handleScroll = () => {
    // Update index in real-time for indicator
    if (scrollRef.current) {
      const width = scrollRef.current.offsetWidth;
      const index = Math.round(scrollRef.current.scrollLeft / width);
      if (index !== activeIndex && index >= 0 && index < photos.length) {
        setActiveIndex(index);
      }
    }

    // Debounce: snap after scrolling stops (150ms)
    if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
    scrollTimeout.current = setTimeout(handleScrollEnd, 150);
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.target as HTMLImageElement;
    if (!img.src.includes('placeholder.com')) {
      img.src = PLACEHOLDER_PHOTO;
    }
  };

  return (
    <div className="relative w-full h-full group" onClick={onPhotoClick}>
      <div 
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex overflow-x-auto h-full no-scrollbar overscroll-x-contain"
        style={{ 
          WebkitOverflowScrolling: 'touch',
          scrollSnapType: 'none',  /* No snap — free smooth scroll */
        }}
      >
        {photos.map((photo, i) => (
          <div key={i} className="w-full h-full flex-shrink-0">
            <img 
              src={photo} 
              alt={`Photo ${i + 1}`} 
              className="w-full h-full object-cover"
              loading="lazy"
              draggable={false}
              onError={handleImageError}
            />
          </div>
        ))}
      </div>
      
      {/* Pagination bars */}
      <div className="absolute bottom-4 left-0 right-0 flex flex-col items-center gap-2 z-10 pointer-events-none px-6">
         <div className="flex justify-center gap-1 w-full">
           {photos.map((_, i) => (
            <div 
              key={i} 
              className={`h-1 flex-1 rounded-full transition-all duration-500 ease-out ${
                i === activeIndex ? 'bg-white shadow-sm scale-y-110' : 'bg-white/30'
              }`}
              style={{ maxWidth: '40px' }}
            />
          ))}
         </div>
      </div>
    </div>
  );
};

export default PhotoSlider;