
import React from 'react';

interface ActionButtonsProps {
  id: number;
  phone: string;
  telegram: string;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({ id, phone, telegram }) => {
  const handleShare = () => {
    const url = `https://t.me/your_bot_name/app?startapp=${id}`;
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.switchInlineQuery(url, ['users', 'groups', 'channels']);
    } else {
      navigator.clipboard.writeText(url);
    }
    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
    }
  };

  const handleCall = () => {
    window.location.href = `tel:${phone}`;
  };

  const handleMessage = () => {
    window.location.href = `https://t.me/${telegram}`;
  };

  return (
    <div className="flex flex-col gap-3 w-full">
      {/* Primary Share Button */}
      <button 
        onClick={handleShare}
        className="w-full bg-[#2481cc] text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 active:scale-[0.98] transition-all shadow-md"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
        </svg>
        Поделиться
      </button>

      {/* Secondary Write/Call Row */}
      <div className="grid grid-cols-2 gap-3 w-full">
        <button 
          onClick={handleMessage}
          className="bg-white border border-gray-200 text-[#2481cc] font-bold py-4 rounded-2xl flex items-center justify-center gap-2 active:scale-[0.98] transition-all shadow-sm"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
          </svg>
          Написать
        </button>
        <button 
          onClick={handleCall}
          className="bg-white border border-gray-200 text-black font-bold py-4 rounded-2xl flex items-center justify-center gap-2 active:scale-[0.98] transition-all shadow-sm"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
            <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
          </svg>
          Позвонить
        </button>
      </div>
    </div>
  );
};

export default ActionButtons;
