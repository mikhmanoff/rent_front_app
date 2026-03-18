import React, { useState, useEffect } from 'react';

interface ShareGateProps {
  listingId: number;
  /** Краткое описание карточки для шаринга */
  shareText: string;
  /** Количество уже засчитанных шар */
  initialShareCount: number;
  /** Сколько шар нужно для разблокировки */
  requiredShares: number;
  /** Callback когда разблокировано */
  onUnlocked: () => void;
  /** Закрыть экран */
  onClose: () => void;
}

const ShareGate: React.FC<ShareGateProps> = ({
  listingId,
  shareText,
  initialShareCount,
  requiredShares,
  onUnlocked,
  onClose,
}) => {
  const [shareCount, setShareCount] = useState(initialShareCount);
  const [isAnimating, setIsAnimating] = useState(false);
  const [justShared, setJustShared] = useState(false);

  const isUnlocked = shareCount >= requiredShares;
  const tg = window.Telegram?.WebApp;
  const haptic = tg?.HapticFeedback;

  // Если уже разблокировано — сразу вызываем callback
  useEffect(() => {
    if (isUnlocked) {
      const timer = setTimeout(() => {
        haptic?.notificationOccurred('success');
        onUnlocked();
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [isUnlocked]);

  const handleShare = () => {
    haptic?.impactOccurred('medium');
    setIsAnimating(true);

    // Формируем deep link на бота с ID объявления
    const botUsername = import.meta.env.VITE_BOT_USERNAME || 'your_bot_name';
    const shareUrl = `https://t.me/${botUsername}/app?startapp=listing_${listingId}`;
    
    const fullText = `${shareText}\n\n👉 Смотреть: ${shareUrl}`;

    // Открываем Telegram share dialog
    if (tg?.switchInlineQuery) {
      // Метод 1: через inline query (показывает выбор чата)
      tg.switchInlineQuery(fullText, ['users', 'groups', 'channels']);
    } else if (tg?.openTelegramLink) {
      // Метод 2: через share URL
      const encoded = encodeURIComponent(fullText);
      tg.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encoded}`);
    } else {
      // Метод 3: fallback — копируем в буфер
      navigator.clipboard?.writeText(fullText);
      alert('Ссылка скопирована! Отправьте её друзьям.');
    }

    // Засчитываем шару после небольшой задержки 
    // (предполагаем что пользователь отправил после открытия диалога)
    setTimeout(() => {
      const newCount = shareCount + 1;
      setShareCount(newCount);
      setIsAnimating(false);
      setJustShared(true);

      // Сохраняем на сервер
      recordShare(listingId, newCount);

      // Сбрасываем анимацию "только что поделился"
      setTimeout(() => setJustShared(false), 2000);
    }, 1500);
  };

  const progress = Math.min(shareCount / requiredShares, 1);

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/60 z-[150] animate-fade-in backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Bottom Sheet */}
      <div className="fixed inset-x-0 bottom-0 z-[151] animate-slide-in-up">
        <div className="bg-white rounded-t-[28px] shadow-2xl overflow-hidden">
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 bg-gray-200 rounded-full" />
          </div>

          <div className="px-6 pb-8 pt-2">
            {/* Icon + Title */}
            <div className="text-center mb-6">
              <div className="text-[56px] mb-3">
                {isUnlocked ? '🎉' : '🔒'}
              </div>
              <h2 className="text-[22px] font-bold text-[#1A1A1A] mb-2 leading-tight">
                {isUnlocked 
                  ? 'Номер разблокирован!' 
                  : 'Поделитесь, чтобы увидеть номер'}
              </h2>
              <p className="text-[15px] text-gray-500 leading-relaxed">
                {isUnlocked 
                  ? 'Спасибо, что помогаете другим найти жильё'
                  : `Отправьте это объявление ${requiredShares} друзьям, и мы покажем контакт владельца`
                }
              </p>
            </div>

            {/* Progress */}
            <div className="mb-6">
              {/* Progress bar */}
              <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden mb-2">
                <div 
                  className="absolute inset-y-0 left-0 rounded-full transition-all duration-700 ease-out"
                  style={{ 
                    width: `${progress * 100}%`,
                    background: isUnlocked 
                      ? 'linear-gradient(90deg, #10B981, #34D399)' 
                      : 'linear-gradient(90deg, #2481cc, #60a5fa)'
                  }}
                />
              </div>
              
              {/* Counter */}
              <div className="flex justify-between items-center">
                <span className="text-[13px] font-bold text-gray-400 uppercase tracking-wider">
                  Прогресс
                </span>
                <div className="flex items-center gap-1.5">
                  {Array.from({ length: requiredShares }).map((_, i) => (
                    <div 
                      key={i}
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-500 ${
                        i < shareCount 
                          ? 'bg-[#2481cc] text-white scale-110' 
                          : 'bg-gray-100 text-gray-300'
                      } ${i === shareCount - 1 && justShared ? 'animate-bounce' : ''}`}
                    >
                      {i < shareCount ? '✓' : i + 1}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Share Button */}
            {!isUnlocked && (
              <button 
                onClick={handleShare}
                disabled={isAnimating}
                className={`w-full py-5 rounded-2xl font-bold text-[17px] flex items-center justify-center gap-3 transition-all shadow-lg active:scale-[0.98] ${
                  isAnimating 
                    ? 'bg-gray-200 text-gray-400' 
                    : 'bg-[#2481cc] text-white'
                }`}
              >
                {isAnimating ? (
                  <>
                    <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                    Отправка...
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    Поделиться с другом ({shareCount}/{requiredShares})
                  </>
                )}
              </button>
            )}

            {/* Close / Skip hint */}
            {!isUnlocked && (
              <button 
                onClick={onClose}
                className="w-full mt-4 text-center text-gray-400 text-[13px] font-medium"
              >
                Закрыть
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

// ============================================
// Helpers: сохранение шар
// ============================================

const SHARE_STORAGE_KEY = 'share_counts';

/** Получить количество шар из localStorage (fallback) */
export function getLocalShareCount(listingId: number): number {
  try {
    const data = JSON.parse(localStorage.getItem(SHARE_STORAGE_KEY) || '{}');
    return data[listingId] || 0;
  } catch {
    return 0;
  }
}

/** Сохранить количество шар */
function recordShare(listingId: number, count: number) {
  // localStorage fallback
  try {
    const data = JSON.parse(localStorage.getItem(SHARE_STORAGE_KEY) || '{}');
    data[listingId] = count;
    localStorage.setItem(SHARE_STORAGE_KEY, JSON.stringify(data));
  } catch { /* ignore */ }

  // Серверное сохранение (если есть Telegram auth)
  const initData = window.Telegram?.WebApp?.initData;
  if (initData) {
    const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8001';
    fetch(
      `${API_BASE}/api/shares/${listingId}?init_data=${encodeURIComponent(initData)}`,
      { method: 'POST' }
    ).catch(() => { /* silent fail */ });
  }
}

/** Загрузить шары с сервера */
export async function getServerShareCount(listingId: number): Promise<number> {
  const initData = window.Telegram?.WebApp?.initData;
  if (!initData) return getLocalShareCount(listingId);

  try {
    const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8001';
    const resp = await fetch(
      `${API_BASE}/api/shares/${listingId}?init_data=${encodeURIComponent(initData)}`
    );
    if (resp.ok) {
      const data = await resp.json();
      return data.count || 0;
    }
  } catch { /* ignore */ }

  return getLocalShareCount(listingId);
}

/** Проверить, разблокирован ли номер для данного listing */
export function isContactUnlocked(listingId: number, requiredShares: number = 2): boolean {
  return getLocalShareCount(listingId) >= requiredShares;
}

export default ShareGate;