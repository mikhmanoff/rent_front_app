
import React, { useState, useRef, useEffect } from 'react';

interface FullscreenGalleryProps {
  photos: string[];
  initialIndex: number;
  onClose: () => void;
}

const FullscreenGallery: React.FC<FullscreenGalleryProps> = ({ photos, initialIndex, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initial scroll position
    if (scrollRef.current) {
      const width = scrollRef.current.offsetWidth;
      scrollRef.current.scrollLeft = width * initialIndex;
    }

    // Telegram Back Button Integration
    if (window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      tg.BackButton.show();
      tg.BackButton.onClick(onClose);
      return () => {
        tg.BackButton.hide();
        tg.BackButton.offClick(onClose);
      };
    }
  }, [initialIndex, onClose]);

  const handleScroll = () => {
    if (scrollRef.current) {
      const width = scrollRef.current.offsetWidth;
      const index = Math.round(scrollRef.current.scrollLeft / width);
      if (index !== currentIndex && index >= 0 && index < photos.length) {
        setCurrentIndex(index);
        if (window.Telegram?.WebApp?.HapticFeedback) {
          window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
        }
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black z-[200] flex flex-col animate-fade-in touch-none">
      {/* Header with Close Button */}
      <div className="absolute top-0 left-0 right-0 p-4 flex justify-end z-[201]">
        <button 
          onClick={(e) => { e.stopPropagation(); onClose(); }}
          className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-white backdrop-blur-md active:scale-90 transition-transform"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Image Swiper Area */}
      <div 
        ref={scrollRef}
        onScroll={handleScroll}
        onClick={onClose}
        className="flex-1 flex overflow-x-auto snap-x snap-mandatory no-scrollbar h-full"
      >
        {photos.map((photo, index) => (
          <div key={index} className="w-screen h-full flex-shrink-0 snap-start flex items-center justify-center bg-black">
            <img 
              src={photo} 
              alt={`Property photo ${index + 1}`} 
              className="max-w-full max-h-full object-contain select-none"
              loading="lazy"
            />
          </div>
        ))}
      </div>

      {/* Footer Info */}
      <div className="absolute bottom-10 left-0 right-0 flex flex-col items-center gap-4 pointer-events-none">
        <div className="text-white text-sm font-medium bg-black/40 px-3 py-1 rounded-full backdrop-blur-sm">
          {currentIndex + 1} / {photos.length}
        </div>
        
        <div className="flex gap-2">
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
    </div>
  );
};

export default FullscreenGallery;
