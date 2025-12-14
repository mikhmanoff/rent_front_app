
import React from 'react';
import { FilterState } from '../types';

interface EndScreenProps {
  totalCount: number;
  filters: FilterState;
  onSubscribe: () => void;
  onChangeFilters: () => void;
  onRestart: () => void;
}

const districtsList = [
  { id: 'yunusabad', name: 'Юнусабад' },
  { id: 'chilanzar', name: 'Чиланзар' },
  { id: 'mirzo_ulugbek', name: 'Мирзо Улугбек' },
  { id: 'sergeli', name: 'Сергели' },
  { id: 'yakkasaray', name: 'Яккасарай' },
  { id: 'mirabad', name: 'Мирабад' },
  { id: 'shaykhantahur', name: 'Шайхантахур' },
  { id: 'almazar', name: 'Алмазар' },
  { id: 'bektemir', name: 'Бектемир' },
  { id: 'yashnabad', name: 'Яшнабад' },
  { id: 'uchtepa', name: 'Учтепа' }
];

const getFiltersSummary = (filters: FilterState) => {
  const parts: string[] = [];
  
  if (filters.rooms.length > 0) {
    parts.push(filters.rooms.join(', ') + ' комн');
  }
  
  if (filters.priceMax) {
    const symbol = filters.currency === 'USD' ? '$' : 'сум';
    parts.push(`до ${filters.priceMax} ${symbol}`);
  }
  
  if (filters.district.length > 0) {
    const names = districtsList
      .filter(d => filters.district.includes(d.id))
      .map(d => d.name);
      
    if (names.length > 0) {
      const firstTwo = names.slice(0, 2).join(', ');
      parts.push(names.length > 2 ? `${firstTwo} +${names.length - 2}` : firstTwo);
    }
  }
  
  return parts.join(' · ') || 'Все квартиры';
};

const EndScreen: React.FC<EndScreenProps> = ({ 
  totalCount, 
  filters, 
  onSubscribe, 
  onChangeFilters, 
  onRestart 
}) => {
  const filtersSummary = getFiltersSummary(filters);
  
  return (
    <div className="w-full h-[100dvh] snap-start flex flex-col items-center justify-center p-8 text-center bg-white">
      <div className="text-[64px] mb-6">🏠</div>
      
      <h2 className="text-2xl font-bold text-[#1A1A1A] mb-3 leading-tight">
        Вы посмотрели все {totalCount} объявлений
      </h2>
      
      <p className="text-base text-gray-500 mb-8 leading-relaxed">
        Хорошие варианты разбирают быстро.<br />
        Подпишитесь, чтобы не упустить новые!
      </p>
      
      <button 
        className="w-full max-w-[300px] bg-[#2481cc] text-white font-bold py-5 rounded-2xl active:scale-[0.98] transition-all shadow-lg mb-6 flex items-center justify-center gap-2"
        onClick={onSubscribe}
      >
        <span>🔔</span> Подписаться на новые
      </button>
      
      <div className="mb-10">
        <div className="text-[13px] font-bold text-gray-400 uppercase tracking-widest mb-1">Ваши фильтры:</div>
        <div className="text-sm font-medium text-[#1A1A1A]">{filtersSummary}</div>
      </div>
      
      <div className="flex flex-col gap-5">
        <button 
          className="text-[#2481cc] font-bold text-sm uppercase tracking-widest hover:underline"
          onClick={onChangeFilters}
        >
          Изменить фильтры
        </button>
        <button 
          className="text-[#2481cc] font-bold text-sm uppercase tracking-widest flex items-center justify-center gap-1 hover:underline"
          onClick={onRestart}
        >
          Начать сначала <span className="text-lg leading-none">↺</span>
        </button>
      </div>
    </div>
  );
};

export default EndScreen;
