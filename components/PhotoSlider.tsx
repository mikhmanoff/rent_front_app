
import React, { useState, useRef, useEffect } from 'react';

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

  // Sync scroll position if initialIndex changes (e.g. from external source)
  useEffect(() => {
    if (scrollRef.current) {
      const width = scrollRef.current.offsetWidth;
      scrollRef.current.scrollLeft = width * initialIndex;
      setActiveIndex(initialIndex);
    }
  }, [initialIndex]);

  const handleScroll = () => {
    if (scrollRef.current) {
      const width = scrollRef.current.offsetWidth;
      const index = Math.round(scrollRef.current.scrollLeft / width);
      if (index !== activeIndex && index >= 0 && index < photos.length) {
        setActiveIndex(index);
        onIndexChange?.(index);
        if (window.Telegram?.WebApp?.HapticFeedback) {
          window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
        }
      }
    }
  };

  return (
    <div className="relative w-full h-full group" onClick={onPhotoClick}>
      <div 
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex overflow-x-auto snap-x snap-mandatory h-full no-scrollbar overscroll-x-contain"
      >
        {photos.map((photo, i) => (
          <div key={i} className="w-full h-full flex-shrink-0 snap-start">
            <img 
              src={photo} 
              alt={`Property photo ${i + 1}`} 
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        ))}
      </div>
      
      {/* Pagination indicators dots */}
      <div className="absolute bottom-4 left-0 right-0 flex flex-col items-center gap-2 z-10 pointer-events-none px-6">
         <div className="flex justify-center gap-1 w-full">
           {photos.map((_, i) => (
            <div 
              key={i} 
              className={`h-1 flex-1 rounded-full transition-all duration-300 ${
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
