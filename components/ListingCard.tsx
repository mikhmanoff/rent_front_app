import React, { useState, useRef } from 'react';
import { Listing } from '../types';
import PhotoSlider from './PhotoSlider';
import ActionButtons from './ActionButtons';
import FullscreenGallery from './FullscreenGallery';

interface ListingCardProps {
  listing: Listing;
  isFavorite: boolean;
  onToggleFavorite: (id: number) => void;
}

function formatPublishedDate(dateString: string): string {
  const date = new Date(dateString);
  const day = date.getDate();
  const months = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
  const month = months[date.getMonth()];
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${day} ${month} в ${hours}:${minutes}`;
}

function formatPrice(amount: number, currency: string): string {
  const formatted = amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return currency === 'USD' ? `$${formatted}` : `${formatted} сум`;
}

function buildShareDescription(listing: Listing): string {
  const price = formatPrice(listing.pricePerMonth, listing.currency);
  const parts = [
    `🏠 ${listing.rooms} комн, ${listing.area} м²`,
    `💰 ${price}/мес`,
    `📍 ${listing.address}`,
  ];
  if (listing.furniture) parts.push('✅ Мебель');
  if (listing.conditioner) parts.push('✅ Кондиционер');
  return parts.join('\n');
}

const ListingCard: React.FC<ListingCardProps> = ({ listing, isFavorite, onToggleFavorite }) => {
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  
  // Track touch to distinguish tap from swipe on photo area
  const photoTouchStart = useRef<{ x: number; y: number; time: number } | null>(null);

  const handleFavClick = () => {
    onToggleFavorite(listing.id);
    window.Telegram?.WebApp?.HapticFeedback?.impactOccurred('medium');
  };

  // Photo area touch handlers — open gallery only on TAP (not swipe)
  const onPhotoTouchStart = (e: React.TouchEvent) => {
    photoTouchStart.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
      time: Date.now(),
    };
  };

  const onPhotoTouchEnd = (e: React.TouchEvent) => {
    if (!photoTouchStart.current) return;
    const dx = Math.abs(e.changedTouches[0].clientX - photoTouchStart.current.x);
    const dy = Math.abs(e.changedTouches[0].clientY - photoTouchStart.current.y);
    const dt = Date.now() - photoTouchStart.current.time;
    
    // It's a tap: small movement, short duration
    if (dx < 10 && dy < 10 && dt < 300) {
      setShowFullscreen(true);
    }
    photoTouchStart.current = null;
  };

  // Close gallery and sync index back to slider
  const closeGallery = (lastIndex: number) => {
    setCurrentPhotoIndex(lastIndex);
    setShowFullscreen(false);
  };

  const shareDescription = buildShareDescription(listing);
  const price = formatPrice(listing.pricePerMonth, listing.currency);

  const tags: string[] = [];
  if (listing.furniture) tags.push('Мебель');
  if (listing.renovation) tags.push('Ремонт');
  if (listing.conditioner) tags.push('Кондиционер');

  return (
    <div 
      className="relative w-full h-[100dvh] flex flex-col bg-white"
      style={{ contain: 'layout style', overflow: 'hidden' }}
    >
      {/* Photo — fills available space */}
      <div 
        className="relative w-full flex-1 min-h-0"
        onTouchStart={onPhotoTouchStart}
        onTouchEnd={onPhotoTouchEnd}
      >
        <PhotoSlider 
          photos={listing.photos} 
          initialIndex={currentPhotoIndex}
          onIndexChange={setCurrentPhotoIndex}
        />
      </div>

      {/* Info Block */}
      <div className="flex-shrink-0 px-4 pt-2 pb-1 bg-white">
        {/* Price + Stats */}
        <div className="flex items-baseline justify-between mb-1">
          <div className="flex items-baseline gap-1">
            <span className="text-[26px] font-bold text-black tracking-tight leading-none">{price}</span>
            <span className="text-sm font-medium text-black/60">/мес</span>
          </div>
          <div className="flex items-center gap-1.5 text-[13px] font-semibold text-gray-500">
            <span>{listing.rooms} комн</span>
            <span className="text-gray-300">·</span>
            <span>{listing.area} м²</span>
            <span className="text-gray-300">·</span>
            <span>{listing.floor}/{listing.totalFloors}</span>
          </div>
        </div>

        {/* Location + Details + Fav */}
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-1 text-[14px] font-medium text-gray-500 truncate flex-1 pr-2">
            <span className="text-xs">📍</span>
            <span className="truncate">{listing.address}</span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button onClick={() => setIsDetailsOpen(true)}
              className="text-blue-500 text-[11px] font-bold uppercase tracking-wider"
            >Подробнее →</button>
            <button onClick={handleFavClick}
              className="w-9 h-9 bg-white border border-gray-100 rounded-xl shadow-sm flex items-center justify-center transition-transform active:scale-90"
            >
              <svg xmlns="http://www.w3.org/2000/svg" 
                className={`h-4 w-4 transition-colors ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-300'}`} 
                viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Tags + Date */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            {tags.length > 0 ? tags.join(' · ') : ''}
          </div>
          <div className="text-[10px] font-medium text-gray-400">
            Опубликовано {formatPublishedDate(listing.publishedAt)}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      {!showFullscreen && (
        <div className="px-4 pb-3 pt-1 bg-white z-[102] border-t border-gray-50 flex-shrink-0">
          <ActionButtons 
            id={listing.id} phone={listing.ownerPhone} telegram={listing.ownerTelegram}
            shareDescription={shareDescription}
          />
        </div>
      )}

      {/* Fullscreen Gallery — synced */}
      {showFullscreen && (
        <FullscreenGallery 
          photos={listing.photos}
          initialIndex={currentPhotoIndex}
          onClose={closeGallery}
        />
      )}

      {/* Details Bottom Sheet */}
      {isDetailsOpen && (
        <>
          <div className="fixed inset-0 bg-black/50 z-[100] animate-fade-in" onClick={() => setIsDetailsOpen(false)} />
          <div className="fixed inset-x-0 bottom-0 h-[80vh] bg-white rounded-t-[20px] z-[101] flex flex-col animate-slide-in-up shadow-2xl overflow-hidden">
            <div className="flex justify-center pt-4 pb-2" onClick={() => setIsDetailsOpen(false)}>
              <div className="w-10 h-1 bg-gray-200 rounded-full" />
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-2 pb-[60px] no-scrollbar">
              <div className="mb-4 text-sm text-gray-400">Опубликовано: {formatPublishedDate(listing.publishedAt)}</div>
              <section className="mb-6">
                <h3 className="text-[18px] font-semibold text-[#1A1A1A] mb-3">Описание</h3>
                <div className="h-[1px] bg-[#F0F0F0] mb-3" />
                <p className="text-[#4A4A4A] text-[15px] leading-relaxed">{listing.description}</p>
              </section>
              <section className="mb-6">
                <h3 className="text-[18px] font-semibold text-[#1A1A1A] mb-3">Условия аренды</h3>
                <div className="h-[1px] bg-[#F0F0F0] mb-1" />
                <div className="flex justify-between py-2 border-b border-[#F0F0F0]">
                  <span className="text-[#888] text-[15px]">Депозит</span>
                  <span className="text-[#1A1A1A] font-medium text-[15px]">{listing.deposit > 0 ? `${listing.deposit} месяц(а)` : 'Без залога'}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-[#F0F0F0]">
                  <span className="text-[#888] text-[15px]">Мин. срок</span>
                  <span className="text-[#1A1A1A] font-medium text-[15px]">{listing.minPeriodMonths} месяцев</span>
                </div>
                <div className="flex justify-between py-2 border-b border-[#F0F0F0]">
                  <span className="text-[#888] text-[15px]">Коммуналка</span>
                  <span className="text-[#1A1A1A] font-medium text-[15px]">{listing.utilitiesIncluded ? 'Включена' : 'Отдельно'}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-[#F0F0F0]">
                  <span className="text-[#888] text-[15px]">Доступно с</span>
                  <span className="text-[#1A1A1A] font-medium text-[15px]">{listing.availableFrom}</span>
                </div>
              </section>
              <section className="mb-8">
                <h3 className="text-[18px] font-semibold text-[#1A1A1A] mb-3">Удобства</h3>
                <div className="h-[1px] bg-[#F0F0F0] mb-3" />
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className={listing.kidsAllowed ? "text-green-500" : "text-red-500"}>{listing.kidsAllowed ? "✓" : "✗"}</span>
                    <span className="text-[#1A1A1A] text-[15px]">Можно с детьми</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={listing.petsAllowed ? "text-green-500" : "text-red-500"}>{listing.petsAllowed ? "✓" : "✗"}</span>
                    <span className="text-[#1A1A1A] text-[15px]">Можно с животными</span>
                  </div>
                  {listing.conditioner && (
                    <div className="flex items-center gap-2">
                      <span className="text-green-500">✓</span>
                      <span className="text-[#1A1A1A] text-[15px]">Кондиционер</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    <span className="text-[#1A1A1A] text-[15px]">
                      Отопление: {listing.heating === 'central' ? 'Центральное' : listing.heating === 'gas' ? 'Газовый котел' : 'Электрическое'}
                    </span>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ListingCard;