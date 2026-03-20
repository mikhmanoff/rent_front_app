import React, { useState, useEffect, useRef } from 'react';
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

// Собирает query params из черновика фильтров
function buildPreviewParams(draft: FilterState): string {
  const params = new URLSearchParams();
  params.set('deal_type', 'rent_long');
  params.set('page', '1');
  params.set('page_size', '1'); // нам нужен только total

  if (draft.rooms.length > 0) {
    const mapped = draft.rooms.map(r => {
      if (r === 'Studio') return 'studio';
      if (r === '4+') return '4';
      return String(r);
    });
    params.set('rooms', mapped.join(','));
  }
  if (draft.priceMin) params.set('price_min', draft.priceMin);
  if (draft.priceMax) params.set('price_max', draft.priceMax);
  params.set('currency', draft.currency.toLowerCase());
  if (draft.district.length > 0) params.set('district', draft.district.join(','));
  if (draft.metro.length > 0) params.set('metro', draft.metro.join(','));

  return params.toString();
}

const FilterPanel: React.FC<FilterPanelProps> = ({ filters, setFilters, count, isOpen, setIsOpen }) => {
  const [draft, setDraft] = useState<FilterState>(filters);
  const [activeSheet, setActiveSheet] = useState<'district' | 'metro' | null>(null);
  const [previewCount, setPreviewCount] = useState<number | null>(null);
  const [isLoadingCount, setIsLoadingCount] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activeCount = countActiveFilters(filters);

  // Синхронизируем черновик при открытии
  useEffect(() => {
    if (isOpen) {
      setDraft({ ...filters });
      setPreviewCount(count); // начинаем с текущего count
    }
  }, [isOpen]);

  // Запрашиваем preview count при изменении черновика (с debounce)
  useEffect(() => {
    if (!isOpen) return;

    // Debounce 400ms
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchPreviewCount(draft);
    }, 400);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [
    draft.rooms.join(','),
    draft.priceMin,
    draft.priceMax,
    draft.currency,
    draft.district.join(','),
    draft.metro.join(','),
    isOpen,
  ]);

  const fetchPreviewCount = async (d: FilterState) => {
    setIsLoadingCount(true);
    try {
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8001';
      const query = buildPreviewParams(d);
      const resp = await fetch(`${API_BASE}/api/listings?${query}`);
      if (resp.ok) {
        const data = await resp.json();
        setPreviewCount(data.total ?? 0);
      }
    } catch (err) {
      console.error('Preview count error:', err);
    } finally {
      setIsLoadingCount(false);
    }
  };

  const toggleRoom = (value: any) => {
    const nextValues = draft.rooms.includes(value)
      ? draft.rooms.filter(v => v !== value)
      : [...draft.rooms, value];
    setDraft({ ...draft, rooms: nextValues });
  };

  const getSelectionText = (type: 'district' | 'metro') => {
    const list = type === 'district' ? districts : metroStations;
    const selectedIds = draft[type];
    if (selectedIds.length === 0) return type === 'district' ? 'Любой район' : 'Любое метро';
    const selectedNames = list.filter(item => selectedIds.includes(item.id)).map(item => item.name);
    if (selectedNames.length <= 1) return selectedNames[0];
    return `${selectedNames[0]} +${selectedNames.length - 1}`;
  };

  const resetDraft = () => {
    setDraft({ ...DEFAULT_FILTERS });
  };

  const applyFilters = () => {
    setFilters({ ...draft });
    setIsOpen(false);
    window.Telegram?.WebApp?.HapticFeedback?.impactOccurred('medium');
  };

  const closeWithoutApply = () => {
    setIsOpen(false);
  };

  // Текст кнопки
  const buttonText = isLoadingCount
    ? 'Считаем...'
    : previewCount !== null && previewCount > 0
      ? `Показать ${previewCount} вариантов`
      : previewCount === 0
        ? 'Ничего не найдено'
        : 'Применить фильтры';

  return (
    <>
      {/* Filter button */}
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

      {/* Full-screen filter panel */}
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

          {/* Footer */}
          <div className="p-5 bg-white border-t border-gray-100 flex flex-col items-center gap-4 flex-shrink-0">
            <button 
              onClick={applyFilters}
              disabled={previewCount === 0}
              className={`w-full font-bold py-5 rounded-2xl active:scale-[0.98] transition-all shadow-xl ${
                previewCount === 0
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 text-white'
              }`}
            >
              {buttonText}
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