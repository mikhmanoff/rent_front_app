import React, { useState, useRef, useEffect } from 'react';

const PLACEHOLDER_PHOTO = 'https://via.placeholder.com/800x600?text=Нет+фото';

interface FullscreenGalleryProps {
  photos: string[];
  initialIndex: number;
  onClose: (lastIndex: number) => void;  // returns the index user was viewing
}

const FullscreenGallery: React.FC<FullscreenGalleryProps> = ({ photos, initialIndex, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const scrollRef = useRef<HTMLDivElement>(null);
  const currentIndexRef = useRef(initialIndex);

  useEffect(() => {
    if (scrollRef.current) {
      const width = scrollRef.current.offsetWidth;
      scrollRef.current.scrollLeft = width * initialIndex;
    }

    if (window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      tg.BackButton.show();
      const handleBack = () => onClose(currentIndexRef.current);
      tg.BackButton.onClick(handleBack);
      return () => {
        tg.BackButton.hide();
        tg.BackButton.offClick(handleBack);
      };
    }
  }, [initialIndex]);

  const handleScroll = () => {
    if (scrollRef.current) {
      const width = scrollRef.current.offsetWidth;
      const index = Math.round(scrollRef.current.scrollLeft / width);
      if (index !== currentIndex && index >= 0 && index < photos.length) {
        setCurrentIndex(index);
        currentIndexRef.current = index;
        window.Telegram?.WebApp?.HapticFeedback?.impactOccurred('light');
      }
    }
  };

  const handleClose = () => {
    onClose(currentIndexRef.current);
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.target as HTMLImageElement;
    if (!img.src.includes('placeholder.com')) {
      img.src = PLACEHOLDER_PHOTO;
    }
  };

  return (
    <div className="fixed inset-0 bg-black z-[200] flex flex-col animate-fade-in">
      {/* Header — close button + counter */}
      <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-[201]">
        {/* Close button — large, obvious */}
        <button 
          onClick={(e) => { e.stopPropagation(); handleClose(); }}
          className="flex items-center gap-2 bg-white/20 rounded-full pl-3 pr-4 py-2 text-white backdrop-blur-md active:scale-90 transition-transform"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="text-sm font-semibold">Назад</span>
        </button>

        {/* Counter */}
        <div className="bg-black/50 text-white text-sm font-bold px-3 py-1.5 rounded-full backdrop-blur-sm">
          {currentIndex + 1} / {photos.length}
        </div>
      </div>

      {/* Image Swiper */}
      <div 
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 flex overflow-x-auto snap-x snap-mandatory no-scrollbar h-full"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {photos.map((photo, index) => (
          <div key={index} className="w-screen h-full flex-shrink-0 snap-center flex items-center justify-center bg-black">
            <img 
              src={photo} 
              alt={`Photo ${index + 1}`} 
              className="max-w-full max-h-full object-contain select-none"
              loading="lazy"
              draggable={false}
              onError={handleImageError}
            />
          </div>
        ))}
      </div>

      {/* Bottom dots */}
      <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-2 pointer-events-none">
        {photos.map((_, index) => (
          <div 
            key={index}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              index === currentIndex ? 'bg-white scale-125' : 'bg-white/30'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default FullscreenGallery;