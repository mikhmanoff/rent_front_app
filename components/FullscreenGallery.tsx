import React, { useState, useRef, useEffect, useCallback } from 'react';

const PLACEHOLDER_PHOTO = 'https://via.placeholder.com/800x600?text=Нет+фото';

interface FullscreenGalleryProps {
  photos: string[];
  initialIndex: number;
  onClose: (lastIndex: number) => void;
}

const FullscreenGallery: React.FC<FullscreenGalleryProps> = ({ photos, initialIndex, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const currentIndexRef = useRef(initialIndex);
  const containerRef = useRef<HTMLDivElement>(null);

  const [isAnimating, setIsAnimating] = useState(false);
  const touchStartX = useRef(0);
  const touchDeltaX = useRef(0);
  const [dragOffset, setDragOffset] = useState(0);
  const isDragging = useRef(false);

  useEffect(() => {
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
  }, []);

  const goTo = useCallback((index: number) => {
    const clamped = Math.max(0, Math.min(index, photos.length - 1));
    setIsAnimating(true);
    setCurrentIndex(clamped);
    currentIndexRef.current = clamped;
    setDragOffset(0);
    setTimeout(() => setIsAnimating(false), 300);
  }, [photos.length]);

  const onTouchStart = (e: React.TouchEvent) => {
    e.stopPropagation(); // Block Feed from catching this
    if (isAnimating) return;
    touchStartX.current = e.touches[0].clientX;
    touchDeltaX.current = 0;
    isDragging.current = true;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    e.stopPropagation(); // Block Feed vertical swipe
    if (!isDragging.current) return;
    const delta = e.touches[0].clientX - touchStartX.current;
    touchDeltaX.current = delta;
    setDragOffset(delta);
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    e.stopPropagation(); // Block Feed from catching this
    if (!isDragging.current) return;
    isDragging.current = false;
    const threshold = window.innerWidth * 0.2;
    
    if (touchDeltaX.current < -threshold && currentIndex < photos.length - 1) {
      goTo(currentIndex + 1);
    } else if (touchDeltaX.current > threshold && currentIndex > 0) {
      goTo(currentIndex - 1);
    } else {
      setIsAnimating(true);
      setDragOffset(0);
      setTimeout(() => setIsAnimating(false), 300);
    }
  };

  const handleClose = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    onClose(currentIndexRef.current);
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.target as HTMLImageElement;
    if (!img.src.includes('placeholder.com')) {
      img.src = PLACEHOLDER_PHOTO;
    }
  };

  const translateX = -(currentIndex * 100) + (dragOffset / (window.innerWidth || 1)) * 100;

  return (
    <div 
      className="fixed inset-0 bg-black z-[300] flex flex-col"
      style={{ touchAction: 'none' }}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-[301]">
        {/* Counter — left */}
        <div className="bg-black/50 text-white text-sm font-bold px-3 py-1.5 rounded-full backdrop-blur-sm">
          {currentIndex + 1} / {photos.length}
        </div>

        {/* Close X button — right */}
        <button 
          onClick={handleClose}
          className="w-10 h-10 bg-white/15 rounded-full flex items-center justify-center backdrop-blur-md active:scale-90 transition-transform"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Image strip */}
      <div 
        ref={containerRef}
        className="flex-1 flex items-center overflow-hidden"
      >
        <div 
          className="flex h-full"
          style={{
            width: `${photos.length * 100}vw`,
            transform: `translateX(${translateX}vw)`,
            transition: isAnimating ? 'transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)' : 'none',
            willChange: 'transform',
          }}
        >
          {photos.map((photo, index) => (
            <div 
              key={index} 
              className="flex items-center justify-center bg-black"
              style={{ width: '100vw', height: '100%', flexShrink: 0 }}
            >
              <img 
                src={photo} 
                alt={`Photo ${index + 1}`} 
                className="max-w-full max-h-full object-contain select-none"
                loading={Math.abs(index - currentIndex) <= 1 ? 'eager' : 'lazy'}
                draggable={false}
                onError={handleImageError}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Bottom dots */}
      {photos.length <= 20 && (
        <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-1.5 pointer-events-none px-6">
          {photos.map((_, index) => (
            <div 
              key={index}
              className={`w-1.5 h-1.5 rounded-full transition-all duration-200 ${
                index === currentIndex ? 'bg-white scale-150' : 'bg-white/30'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default FullscreenGallery;