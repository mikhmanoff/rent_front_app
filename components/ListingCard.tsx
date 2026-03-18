import React, { useState } from 'react';
import { Listing } from '../types';
import PhotoSlider from './PhotoSlider';
import PriceTag from './PriceTag';
import ActionButtons from './ActionButtons';
import FullscreenGallery from './FullscreenGallery';

interface ListingCardProps {
  listing: Listing;
  isFavorite: boolean;
  onToggleFavorite: (id: number) => void;
}

// Функция для форматирования даты "15 янв в 18:52"
function formatPublishedDate(dateString: string): string {
  const date = new Date(dateString);
  
  const day = date.getDate();
  const months = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
  const month = months[date.getMonth()];
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  
  return `${day} ${month} в ${hours}:${minutes}`;
}

function buildShareDescription(listing: Listing): string {
  const price = listing.currency === 'USD' 
    ? `$${listing.pricePerMonth}` 
    : `${listing.pricePerMonth.toLocaleString()} сум`;
  
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
  const [localFavCount, setLocalFavCount] = useState(listing.favoritesCount);

  const handleFavClick = () => {
    onToggleFavorite(listing.id);
    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.impactOccurred('medium');
    }
  };

  const shareDescription = buildShareDescription(listing);

  return (
    <div className="relative w-full h-[100dvh] snap-start flex flex-col bg-white overflow-hidden">
      {/* Photo Area */}
      <div 
        className="relative h-[65vh] w-full flex-shrink-0 cursor-pointer"
        onClick={() => setShowFullscreen(true)}
      >
        <PhotoSlider 
          photos={listing.photos} 
          initialIndex={currentPhotoIndex}
          onIndexChange={setCurrentPhotoIndex}
        />
      </div>

      {/* Info Block */}
      <div className="flex-1 flex flex-col p-4 pt-3 bg-white overflow-hidden">
        {/* Price Row */}
        <div className="mb-1">
          <PriceTag 
            amount={listing.pricePerMonth} 
            currency={listing.currency} 
          />
        </div>

        {/* Basic Stats */}
        <div className="flex flex-wrap items-center gap-x-2 text-sm font-semibold text-gray-700 mb-1 uppercase tracking-tight">
          <span>{listing.rooms} комн</span>
          <span className="text-gray-300">·</span>
          <span>{listing.area} м²</span>
          <span className="text-gray-300">·</span>
          <span>{listing.floor}/{listing.totalFloors}</span>
        </div>

        {/* Location + Favorite Button Row */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1 text-base font-medium text-gray-500 truncate flex-1 pr-2">
            <span className="text-sm">📍</span>
            <span className="truncate">{listing.address}</span>
          </div>
          
          <button 
            onClick={handleFavClick}
            className="w-10 h-10 bg-white border border-gray-100 rounded-xl shadow-md flex items-center justify-center transition-transform active:scale-90 flex-shrink-0"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className={`h-5 w-5 transition-colors ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-300'}`} 
              viewBox="0 0 24 24" 
              stroke="currentColor" 
              strokeWidth={1.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>
        </div>

        {/* Urgency Row: Views + Published time + More details link */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3 text-[11px] font-bold uppercase tracking-wider text-gray-400">
            <span className="flex items-center gap-1">
              <span className="text-sm">🔥</span> {listing.viewsToday} просмотров
            </span>
            <span className="flex items-center gap-1">
              <span className="text-sm">🕐</span> {formatPublishedDate(listing.publishedAt)}
            </span>
          </div>
          <button 
            onClick={() => setIsDetailsOpen(true)}
            className="text-blue-500 text-xs font-bold uppercase tracking-widest hover:underline transition-colors"
          >
            Подробнее →
          </button>
        </div>

        {/* Tags Row */}
        <div className="flex flex-wrap gap-x-1.5 gap-y-0.5 text-[11px] font-bold text-gray-400 uppercase tracking-widest">
          {listing.renovation && <span>Ремонт</span>}
          {listing.renovation && listing.furniture && <span className="text-gray-200">·</span>}
          {listing.furniture && <span>Мебель</span>}
          {(listing.furniture || listing.renovation) && listing.conditioner && <span className="text-gray-200">·</span>}
          {listing.conditioner && <span>Кондиционер</span>}
        </div>
      </div>

      {/* STATIC Action Buttons — now with share-to-unlock */}
      {!showFullscreen && (
        <div className="p-4 bg-white z-[102] border-t border-gray-50 flex-shrink-0 animate-fade-in">
          <ActionButtons 
            id={listing.id} 
            phone={listing.ownerPhone} 
            telegram={listing.ownerTelegram}
            shareDescription={shareDescription}
          />
        </div>
      )}

      {/* Fullscreen Gallery View */}
      {showFullscreen && (
        <FullscreenGallery 
          photos={listing.photos}
          initialIndex={currentPhotoIndex}
          onClose={() => setShowFullscreen(false)}
        />
      )}

      {/* Bottom Sheet Modal */}
      {isDetailsOpen && (
        <>
          {/* Overlay */}
          <div 
            className="fixed inset-0 bg-black/50 z-[100] animate-fade-in"
            onClick={() => setIsDetailsOpen(false)}
          />
          
          {/* Bottom Sheet */}
          <div 
            className="fixed inset-x-0 bottom-0 h-[80vh] bg-white rounded-t-[20px] z-[101] flex flex-col animate-slide-in-up shadow-2xl overflow-hidden"
          >
            {/* Handle Indicator */}
            <div className="flex justify-center pt-4 pb-2" onClick={() => setIsDetailsOpen(false)}>
              <div className="w-10 h-1 bg-gray-200 rounded-full" />
            </div>

            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto px-5 py-2 pb-[160px] no-scrollbar">
              
              {/* Published Date in Details */}
              <div className="mb-4 text-sm text-gray-400">
                Опубликовано: {formatPublishedDate(listing.publishedAt)}
              </div>

              {/* Description Section */}
              <section className="mb-6">
                <h3 className="text-[18px] font-semibold text-[#1A1A1A] mb-3">Описание</h3>
                <div className="h-[1px] bg-[#F0F0F0] mb-3" />
                <p className="text-[#4A4A4A] text-[15px] leading-relaxed">
                  {listing.description}
                </p>
              </section>

              {/* Conditions Section */}
              <section className="mb-6">
                <h3 className="text-[18px] font-semibold text-[#1A1A1A] mb-3">Условия аренды</h3>
                <div className="h-[1px] bg-[#F0F0F0] mb-1" />
                
                <div className="flex justify-between py-2 border-b border-[#F0F0F0]">
                  <span className="text-[#888] text-[15px]">Депозит</span>
                  <span className="text-[#1A1A1A] font-medium text-[15px]">
                    {listing.deposit > 0 ? `${listing.deposit} месяц(а)` : 'Без залога'}
                  </span>
                </div>
                
                <div className="flex justify-between py-2 border-b border-[#F0F0F0]">
                  <span className="text-[#888] text-[15px]">Мин. срок</span>
                  <span className="text-[#1A1A1A] font-medium text-[15px]">{listing.minPeriodMonths} месяцев</span>
                </div>
                
                <div className="flex justify-between py-2 border-b border-[#F0F0F0]">
                  <span className="text-[#888] text-[15px]">Коммуналка</span>
                  <span className="text-[#1A1A1A] font-medium text-[15px]">
                    {listing.utilitiesIncluded ? 'Включена' : 'Отдельно'}
                  </span>
                </div>
                
                <div className="flex justify-between py-2 border-b border-[#F0F0F0]">
                  <span className="text-[#888] text-[15px]">Доступно с</span>
                  <span className="text-[#1A1A1A] font-medium text-[15px]">{listing.availableFrom}</span>
                </div>
              </section>

              {/* Amenities Section */}
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