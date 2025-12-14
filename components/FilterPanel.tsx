
import React from 'react';
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

const FilterPanel: React.FC<FilterPanelProps> = ({ filters, setFilters, count, isOpen, setIsOpen }) => {
  const [activeSheet, setActiveSheet] = React.useState<'district' | 'metro' | null>(null);

  const toggleRoom = (value: any) => {
    const currentValues = filters.rooms;
    const nextValues = currentValues.includes(value)
      ? currentValues.filter(v => v !== value)
      : [...currentValues, value];
    setFilters({ ...filters, rooms: nextValues });
  };

  const getSelectionText = (type: 'district' | 'metro') => {
    const list = type === 'district' ? districts : metroStations;
    const selectedIds = filters[type];
    if (selectedIds.length === 0) return type === 'district' ? 'Любой район' : 'Любое метро';
    
    const selectedNames = list
      .filter(item => selectedIds.includes(item.id))
      .map(item => item.name);
    
    if (selectedNames.length <= 1) return selectedNames[0];
    return `${selectedNames[0]} +${selectedNames.length - 1}`;
  };

  const resetFilters = () => {
    setFilters({
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
    });
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed top-4 left-4 z-40 bg-black/20 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 flex items-center justify-center text-white text-[13px] font-bold tracking-tight active:scale-95 transition-transform"
      >
        <span className="mr-1 opacity-70">▼</span> Фильтр
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 bg-white flex flex-col animate-slide-in-up">
          <div className="flex items-center justify-between p-5 border-b border-gray-100">
            <h2 className="text-xl font-bold">Фильтры</h2>
            <button onClick={() => setIsOpen(false)} className="p-2 text-black">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-8 pb-40">
            {/* PRICE */}
            <section>
              <h3 className="text-[10px] font-bold uppercase text-gray-400 mb-3 tracking-widest">Цена</h3>
              <div className="flex items-center gap-3">
                <input 
                  type="number" 
                  inputMode="numeric"
                  placeholder="От"
                  value={filters.priceMin}
                  onChange={(e) => setFilters({...filters, priceMin: e.target.value})}
                  className="w-full bg-[#F5F5F5] rounded-2xl p-4 border-none text-black font-semibold placeholder-gray-400 focus:ring-2 focus:ring-blue-500"
                />
                <input 
                  type="number" 
                  inputMode="numeric"
                  placeholder="До"
                  value={filters.priceMax}
                  onChange={(e) => setFilters({...filters, priceMax: e.target.value})}
                  className="w-full bg-[#F5F5F5] rounded-2xl p-4 border-none text-black font-semibold placeholder-gray-400 focus:ring-2 focus:ring-blue-500"
                />
                <select 
                  value={filters.currency}
                  onChange={(e) => setFilters({...filters, currency: e.target.value as Currency})}
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
                      filters.rooms.includes(room) 
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
                <span className={`font-semibold ${filters.district.length > 0 ? 'text-black' : 'text-gray-400'}`}>
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
                <span className={`font-semibold ${filters.metro.length > 0 ? 'text-black' : 'text-gray-400'}`}>
                  {getSelectionText('metro')}
                </span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </section>
          </div>

          {/* Footer Controls */}
          <div className="fixed bottom-0 inset-x-0 p-5 bg-white border-t border-gray-100 flex flex-col items-center gap-4">
            <button 
              onClick={() => setIsOpen(false)}
              className="w-full bg-blue-600 text-white font-bold py-5 rounded-2xl active:scale-[0.98] transition-all shadow-xl"
            >
              Показать {count} объектов
            </button>
            <button 
              onClick={resetFilters}
              className="text-gray-400 text-xs font-bold uppercase tracking-widest active:text-red-500 transition-colors"
            >
              Сбросить фильтры
            </button>
          </div>
        </div>
      )}

      {/* District Selector Bottom Sheet */}
      <MultiSelectBottomSheet 
        title="Выберите район"
        options={districts}
        selected={filters.district}
        isOpen={activeSheet === 'district'}
        onClose={() => setActiveSheet(null)}
        onChange={(ids) => setFilters({ ...filters, district: ids })}
      />

      {/* Metro Selector Bottom Sheet */}
      <MultiSelectBottomSheet 
        title="Выберите метро"
        options={metroStations}
        selected={filters.metro}
        isOpen={activeSheet === 'metro'}
        onClose={() => setActiveSheet(null)}
        onChange={(ids) => setFilters({ ...filters, metro: ids })}
      />
    </>
  );
};

export default FilterPanel;
