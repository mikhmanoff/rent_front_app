import React, { useState, useEffect } from 'react';
import { FilterState, Currency } from '../types';
import MultiSelectBottomSheet from './MultiSelectBottomSheet';

interface FilterPanelProps {
  filters: FilterState;
  setFilters: (f: FilterState) => void;
  count: number;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const districts = [
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

const metroStations = [
  { id: 'buyuk_ipak', name: 'Буюк Ипак Йули' },
  { id: 'kosmonavtlar', name: 'Космонавтлар' },
  { id: 'oybek', name: 'Ойбек' },
  { id: 'amir_temur', name: 'Амир Темур' },
  { id: 'chorsu', name: 'Чорсу' },
  { id: 'minor', name: 'Минор' },
  { id: 'bodomzor', name: 'Бодомзор' },
  { id: 'novza', name: 'Новза' },
  { id: 'pushkin', name: 'Пушкин' }
];

const DEFAULT_FILTERS: FilterState = {
  priceMin: '',
  priceMax: '',
  currency: 'USD',
  rooms: [],
  district: [],
  metro: [],
  furniture: null,
  renovation: null,
  conditioner: null,
  petsAllowed: null,
};

function countActiveFilters(f: FilterState): number {
  let count = 0;
  if (f.priceMin || f.priceMax) count++;
  if (f.rooms.length > 0) count++;
  if (f.district.length > 0) count++;
  if (f.metro.length > 0) count++;
  return count;
}

const FilterPanel: React.FC<FilterPanelProps> = ({ filters, setFilters, count, isOpen, setIsOpen }) => {
  const [draft, setDraft] = useState<FilterState>(filters);
  const [activeSheet, setActiveSheet] = useState<'district' | 'metro' | null>(null);

  useEffect(() => {
    if (isOpen) {
      setDraft({ ...filters });
    }
  }, [isOpen]);

  const activeCount = countActiveFilters(filters);

  const toggleRoom = (value: any) => {
    const currentValues = draft.rooms;
    const nextValues = currentValues.includes(value)
      ? currentValues.filter(v => v !== value)
      : [...currentValues, value];
    setDraft({ ...draft, rooms: nextValues });
  };

  const getSelectionText = (type: 'district' | 'metro') => {
    const list = type === 'district' ? districts : metroStations;
    const selectedIds = draft[type];
    if (selectedIds.length === 0) return type === 'district' ? 'Любой район' : 'Любое метро';
    
    const selectedNames = list
      .filter(item => selectedIds.includes(item.id))
      .map(item => item.name);
    
    if (selectedNames.length <= 1) return selectedNames[0];
    return `${selectedNames[0]} +${selectedNames.length - 1}`;
  };

  const resetDraft = () => {
    setDraft({ ...DEFAULT_FILTERS });
  };

  const applyFilters = () => {
    setFilters({ ...draft });
    setIsOpen(false);
    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.impactOccurred('medium');
    }
  };

  const closeWithoutApply = () => {
    setIsOpen(false);
  };

  return (
    <>
      {/* Filter button with badge */}
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed top-4 left-4 z-40 bg-black/20 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 flex items-center justify-center text-white text-[13px] font-bold tracking-tight active:scale-95 transition-transform"
      >
        <span className="mr-1 opacity-70">▼</span> Фильтр
        {activeCount > 0 && (
          <span className="ml-1.5 bg-white text-black text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
            {activeCount}
          </span>
        )}
      </button>

      {/* Full-screen filter panel — z-[200] to cover EVERYTHING */}
      {isOpen && (
        <div className="fixed inset-0 z-[200] bg-white flex flex-col animate-slide-in-up">
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-gray-100 flex-shrink-0">
            <h2 className="text-xl font-bold">Фильтры</h2>
            <button onClick={closeWithoutApply} className="p-2 text-black">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto p-5 space-y-8">
            {/* PRICE */}
            <section>
              <h3 className="text-[10px] font-bold uppercase text-gray-400 mb-3 tracking-widest">Цена</h3>
              <div className="flex items-center gap-3">
                <input 
                  type="number" 
                  inputMode="numeric"
                  placeholder="От"
                  value={draft.priceMin}
                  onChange={(e) => setDraft({...draft, priceMin: e.target.value})}
                  className="w-full bg-[#F5F5F5] rounded-2xl p-4 border-none text-black font-semibold placeholder-gray-400 focus:ring-2 focus:ring-blue-500"
                />
                <input 
                  type="number" 
                  inputMode="numeric"
                  placeholder="До"
                  value={draft.priceMax}
                  onChange={(e) => setDraft({...draft, priceMax: e.target.value})}
                  className="w-full bg-[#F5F5F5] rounded-2xl p-4 border-none text-black font-semibold placeholder-gray-400 focus:ring-2 focus:ring-blue-500"
                />
                <select 
                  value={draft.currency}
                  onChange={(e) => setDraft({...draft, currency: e.target.value as Currency})}
                  className="bg-[#F5F5F5] rounded-2xl p-4 border-none text-black font-bold focus:ring-2 focus:ring-blue-500"
                >
                  <option value="USD">$</option>
                  <option value="UZS">сум</option>
                </select>
              </div>
            </section>

            {/* ROOMS */}
            <section>
              <h3 className="text-[10px] font-bold uppercase text-gray-400 mb-3 tracking-widest">Комнаты</h3>
              <div className="flex flex-nowrap gap-1.5 overflow-x-auto no-scrollbar">
                {['Studio', 1, 2, 3, '4+'].map((room) => (
                  <button
                    key={room}
                    onClick={() => toggleRoom(room)}
                    className={`flex-1 min-w-0 py-4 px-2 rounded-2xl font-bold text-xs transition-all truncate ${
                      draft.rooms.includes(room) 
                        ? 'bg-blue-600 text-white shadow-lg' 
                        : 'bg-[#F5F5F5] text-gray-600 active:bg-gray-200'
                    }`}
                  >
                    {room}
                  </button>
                ))}
              </div>
            </section>

            {/* DISTRICT */}
            <section>
              <h3 className="text-[10px] font-bold uppercase text-gray-400 mb-3 tracking-widest">Район</h3>
              <button 
                onClick={() => setActiveSheet('district')}
                className="w-full bg-[#F5F5F5] p-4 rounded-2xl flex items-center justify-between active:bg-gray-200 transition-colors"
              >
                <span className={`font-semibold ${draft.district.length > 0 ? 'text-black' : 'text-gray-400'}`}>
                  {getSelectionText('district')}
                </span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </section>

            {/* METRO */}
            <section>
              <h3 className="text-[10px] font-bold uppercase text-gray-400 mb-3 tracking-widest">Метро</h3>
              <button 
                onClick={() => setActiveSheet('metro')}
                className="w-full bg-[#F5F5F5] p-4 rounded-2xl flex items-center justify-between active:bg-gray-200 transition-colors"
              >
                <span className={`font-semibold ${draft.metro.length > 0 ? 'text-black' : 'text-gray-400'}`}>
                  {getSelectionText('metro')}
                </span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </section>
          </div>

          {/* Footer — inside panel flow, not separate fixed */}
          <div className="p-5 bg-white border-t border-gray-100 flex flex-col items-center gap-4 flex-shrink-0">
            <button 
              onClick={applyFilters}
              className="w-full bg-blue-600 text-white font-bold py-5 rounded-2xl active:scale-[0.98] transition-all shadow-xl"
            >
              Применить фильтры{count > 0 ? ` · ${count}` : ''}
            </button>
            <button 
              onClick={resetDraft}
              className="text-gray-400 text-xs font-bold uppercase tracking-widest active:text-red-500 transition-colors"
            >
              Сбросить фильтры
            </button>
          </div>
        </div>
      )}

      {/* District Selector */}
      <MultiSelectBottomSheet 
        title="Выберите район"
        options={districts}
        selected={draft.district}
        isOpen={activeSheet === 'district'}
        onClose={() => setActiveSheet(null)}
        onChange={(ids) => setDraft({ ...draft, district: ids })}
      />

      {/* Metro Selector */}
      <MultiSelectBottomSheet 
        title="Выберите метро"
        options={metroStations}
        selected={draft.metro}
        isOpen={activeSheet === 'metro'}
        onClose={() => setActiveSheet(null)}
        onChange={(ids) => setDraft({ ...draft, metro: ids })}
      />
    </>
  );
};

export default FilterPanel;