import React, { useState, useEffect } from 'react';

interface ShareGateProps {
  listingId: number;
  shareText: string;
  initialShareCount: number;
  requiredShares: number;
  onUnlocked: () => void;
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
  const [justShared, setJustShared] = useState(false);

  const isUnlocked = shareCount >= requiredShares;
  const tg = window.Telegram?.WebApp;
  const haptic = tg?.HapticFeedback;

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

    // 1. СРАЗУ засчитываем шару ДО открытия диалога
    const newCount = shareCount + 1;
    setShareCount(newCount);
    setJustShared(true);
    recordShare(listingId, newCount);
    setTimeout(() => setJustShared(false), 2000);

    // 2. Формируем текст
    const botUsername = import.meta.env.VITE_BOT_USERNAME || 'your_bot_name';
    const shareUrl = `https://t.me/${botUsername}/app?startapp=listing_${listingId}`;
    const fullText = `${shareText}\n\n👉 Смотреть: ${shareUrl}`;

    // 3. Открываем share dialog ПОСЛЕ засчитывания
    setTimeout(() => {
      if (tg?.openTelegramLink) {
        const encoded = encodeURIComponent(fullText);
        tg.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encoded}`);
      } else if (tg?.switchInlineQuery) {
        tg.switchInlineQuery(fullText, ['users', 'groups', 'channels']);
      } else {
        navigator.clipboard?.writeText(fullText);
        tg?.showAlert?.('Ссылка скопирована! Отправьте её друзьям.');
      }
    }, 100);
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
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 bg-gray-200 rounded-full" />
          </div>

          <div className="px-6 pb-8 pt-2">
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

            <div className="mb-6">
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

            {!isUnlocked && (
              <button 
                onClick={handleShare}
                className="w-full py-5 rounded-2xl font-bold text-[17px] flex items-center justify-center gap-3 transition-all shadow-lg active:scale-[0.98] bg-[#2481cc] text-white"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                Поделиться с другом ({shareCount}/{requiredShares})
              </button>
            )}

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
// Helpers
// ============================================

const SHARE_STORAGE_KEY = 'share_counts';

export function getLocalShareCount(listingId: number): number {
  try {
    const data = JSON.parse(localStorage.getItem(SHARE_STORAGE_KEY) || '{}');
    return data[listingId] || 0;
  } catch {
    return 0;
  }
}

function recordShare(listingId: number, count: number) {
  try {
    const data = JSON.parse(localStorage.getItem(SHARE_STORAGE_KEY) || '{}');
    data[listingId] = count;
    localStorage.setItem(SHARE_STORAGE_KEY, JSON.stringify(data));
  } catch {}

  const initData = window.Telegram?.WebApp?.initData;
  if (initData) {
    const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8001';
    fetch(
      `${API_BASE}/api/shares/${listingId}?init_data=${encodeURIComponent(initData)}`,
      { method: 'POST' }
    ).catch(() => {});
  }
}

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
  } catch {}

  return getLocalShareCount(listingId);
}

export function isContactUnlocked(listingId: number, requiredShares: number = 2): boolean {
  return getLocalShareCount(listingId) >= requiredShares;
}

export default ShareGate;