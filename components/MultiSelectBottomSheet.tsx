
import React from 'react';

interface Option {
  id: string;
  name: string;
}

interface MultiSelectBottomSheetProps {
  title: string;
  options: Option[];
  selected: string[];
  isOpen: boolean;
  onClose: () => void;
  onChange: (selectedIds: string[]) => void;
}

const MultiSelectBottomSheet: React.FC<MultiSelectBottomSheetProps> = ({ 
  title, 
  options, 
  selected, 
  isOpen, 
  onClose, 
  onChange 
}) => {
  if (!isOpen) return null;

  const toggleOption = (id: string) => {
    const next = selected.includes(id) 
      ? selected.filter(sid => sid !== id)
      : [...selected, id];
    onChange(next);
  };

  const toggleAll = () => {
    if (selected.length === options.length) {
      onChange([]);
    } else {
      onChange(options.map(o => o.id));
    }
  };

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/50 z-[100] animate-fade-in" 
        onClick={onClose}
      />
      <div className="fixed inset-x-0 bottom-0 h-[80vh] bg-white rounded-t-[32px] z-[110] flex flex-col animate-slide-in-up shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-xl font-bold">{title}</h2>
          <button onClick={onClose} className="p-2 text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-1">
          <label className="flex items-center gap-4 p-4 rounded-2xl active:bg-gray-50 transition-colors">
            <input 
              type="checkbox" 
              className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              checked={selected.length === options.length && options.length > 0}
              onChange={toggleAll}
            />
            <span className="font-bold text-gray-800">Выбрать все</span>
          </label>
          <hr className="my-2 border-gray-100" />
          {options.map((option) => (
            <label key={option.id} className="flex items-center gap-4 p-4 rounded-2xl active:bg-gray-50 transition-colors">
              <input 
                type="checkbox" 
                className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                checked={selected.includes(option.id)}
                onChange={() => toggleOption(option.id)}
              />
              <span className="font-medium text-gray-700">{option.name}</span>
            </label>
          ))}
        </div>

        <div className="p-4 bg-white border-t border-gray-100">
          <button 
            onClick={onClose}
            className="w-full bg-blue-600 text-white font-bold py-5 rounded-2xl active:scale-[0.98] transition-all shadow-lg"
          >
            Готово
          </button>
        </div>
      </div>
    </>
  );
};

export default MultiSelectBottomSheet;
