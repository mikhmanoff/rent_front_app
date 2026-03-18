import React, { useState, useEffect } from 'react';
import ShareGate, { getLocalShareCount, getServerShareCount, isContactUnlocked } from './ShareGate';

const REQUIRED_SHARES = 2; // Сколько шар нужно для разблокировки

interface ActionButtonsProps {
  id: number;
  phone: string;
  telegram: string;
  /** Краткое описание для шаринга (цена, комнаты, район) */
  shareDescription?: string;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({ id, phone, telegram, shareDescription }) => {
  const tg = window.Telegram?.WebApp;
  const haptic = tg?.HapticFeedback;

  const [showShareGate, setShowShareGate] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [shareCount, setShareCount] = useState(0);
  const [pendingAction, setPendingAction] = useState<'call' | 'message' | null>(null);

  // Загружаем статус разблокировки при монтировании
  useEffect(() => {
    const localCount = getLocalShareCount(id);
    setShareCount(localCount);
    setUnlocked(localCount >= REQUIRED_SHARES);

    // Асинхронно проверяем серверные данные
    getServerShareCount(id).then(serverCount => {
      const maxCount = Math.max(localCount, serverCount);
      setShareCount(maxCount);
      setUnlocked(maxCount >= REQUIRED_SHARES);
    });
  }, [id]);

  const handleShare = () => {
    haptic?.impactOccurred('light');
    const url = `https://t.me/your_bot_name/app?startapp=${id}`;
    if (tg?.switchInlineQuery) {
      tg.switchInlineQuery(url, ['users', 'groups', 'channels']);
    } else {
      navigator.clipboard.writeText(url);
    }
  };

  const handleContactAction = (action: 'call' | 'message') => {
    if (!unlocked) {
      haptic?.impactOccurred('medium');
      setPendingAction(action);
      setShowShareGate(true);
      return;
    }

    if (action === 'message') {
      doMessage();
    } else {
      doCall();
    }
  };

  const doMessage = () => {
    haptic?.impactOccurred('light');

    if (telegram) {
      const username = telegram.replace('@', '');
      const tgUrl = `https://t.me/${username}`;
      if (tg?.openTelegramLink) {
        tg.openTelegramLink(tgUrl);
      } else {
        window.open(tgUrl, '_blank');
      }
      return;
    }

    if (phone) {
      const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
      const tgUrl = `https://t.me/${cleanPhone}`;
      if (tg?.openTelegramLink) {
        tg.openTelegramLink(tgUrl);
      } else {
        window.open(tgUrl, '_blank');
      }
      return;
    }

    tg?.showAlert?.('Контакт не указан');
  };

  const doCall = () => {
    if (!phone) {
      tg?.showAlert?.('Номер телефона не указан');
      return;
    }

    haptic?.impactOccurred('light');

    try {
      if (tg?.openLink) {
        tg.openLink(`tel:${phone}`);
      } else {
        window.location.href = `tel:${phone}`;
      }
    } catch {
      navigator.clipboard?.writeText(phone);
      tg?.showAlert?.(`Номер скопирован: ${phone}`);
    }
  };

  const handleUnlocked = () => {
    setUnlocked(true);
    setShowShareGate(false);

    // Выполняем отложенное действие
    if (pendingAction === 'message') {
      setTimeout(doMessage, 300);
    } else if (pendingAction === 'call') {
      setTimeout(doCall, 300);
    }
    setPendingAction(null);
  };

  const shareText = shareDescription || `Смотри какую квартиру нашёл в Ташкенте! 🏠`;

  return (
    <>
      <div className="flex flex-col gap-3 w-full">
        {/* Primary: Написать */}
        <button 
          onClick={() => handleContactAction('message')}
          className="w-full bg-[#2481cc] text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 active:scale-[0.98] transition-all shadow-md relative overflow-hidden"
        >
          {!unlocked && (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 opacity-70" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
          )}
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
          </svg>
          {unlocked ? 'Написать' : 'Написать · Поделитесь чтобы открыть'}
        </button>

        {/* Secondary: Позвонить + Поделиться */}
        <div className="grid grid-cols-2 gap-3 w-full">
          <button 
            onClick={() => handleContactAction('call')}
            className="bg-white border border-gray-200 text-black font-bold py-4 rounded-2xl flex items-center justify-center gap-2 active:scale-[0.98] transition-all shadow-sm relative"
          >
            {!unlocked && (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-gray-300" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
            )}
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
              <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
            </svg>
            Позвонить
          </button>
          <button 
            onClick={handleShare}
            className="bg-white border border-gray-200 text-[#2481cc] font-bold py-4 rounded-2xl flex items-center justify-center gap-2 active:scale-[0.98] transition-all shadow-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            Поделиться
          </button>
        </div>
      </div>

      {/* Share Gate Modal */}
      {showShareGate && (
        <ShareGate
          listingId={id}
          shareText={shareText}
          initialShareCount={shareCount}
          requiredShares={REQUIRED_SHARES}
          onUnlocked={handleUnlocked}
          onClose={() => {
            setShowShareGate(false);
            setPendingAction(null);
          }}
        />
      )}
    </>
  );
};

export default ActionButtons;