import React, { useState, useEffect, useRef } from 'react';
import { trackShare } from '../hooks/useAnalytics';

const UNLOCK_DURATION_MS = 60 * 60 * 1000; // 1 час
const SHARE_DELAY_SEC = 15;

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8001';

interface ShareGateProps {
  listingId: number;
  shareText: string;
  onUnlocked: () => void;
  onClose: () => void;
}

async function prepareShareMessage(listingId: number, initData: string): Promise<string | null> {
  try {
    const resp = await fetch(
      `${API_BASE}/api/prepare-share/${listingId}?init_data=${encodeURIComponent(initData)}`,
      { method: 'POST' }
    );
    if (!resp.ok) return null;
    const data = await resp.json();
    return data.prepared_message_id || null;
  } catch {
    return null;
  }
}

const ShareGate: React.FC<ShareGateProps> = ({
  listingId,
  shareText,
  onUnlocked,
  onClose,
}) => {
  const [countdown, setCountdown] = useState(0);
  const [isWaiting, setIsWaiting] = useState(false);
  const [shared, setShared] = useState(false);
  const [isPreparing, setIsPreparing] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const tg = window.Telegram?.WebApp;
  const haptic = tg?.HapticFeedback;

  useEffect(() => {
    if (isGloballyUnlocked()) {
      haptic?.notificationOccurred('success');
      onUnlocked();
    }
  }, []);

  useEffect(() => {
    if (countdown > 0) {
      timerRef.current = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            setGlobalUnlock();
            setShared(true);
            recordShareToServer(listingId);
            trackShare(listingId, 'unlock');  // Analytics
            haptic?.notificationOccurred('success');
            setTimeout(() => onUnlocked(), 600);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    }
  }, [isWaiting]);

  const startCountdown = () => {
    setIsWaiting(true);
    setCountdown(SHARE_DELAY_SEC);
  };

  const handleShare = async () => {
    haptic?.impactOccurred('medium');
    setIsPreparing(true);
    trackShare(listingId, 'click');  // Analytics

    const initData = tg?.initData;
    
    if (initData && tg?.shareMessage) {
      const preparedId = await prepareShareMessage(listingId, initData);
      if (preparedId) {
        setIsPreparing(false);
        try {
          tg.shareMessage(preparedId, (success: boolean) => {
            if (success) {
              trackShare(listingId, 'sent');  // Analytics
              startCountdown();
            }
          });
          return;
        } catch (e) {
          console.warn('[share-gate] shareMessage failed:', e);
        }
      }
    }

    setIsPreparing(false);
    const botUsername = import.meta.env.VITE_BOT_USERNAME || 'rentaly_bot';
    const botUrl = `https://t.me/${botUsername}/app`;
    const messageText = shareText || '🔍 Найди квартиру мечты в Ташкенте';

    if (tg?.openTelegramLink) {
      const params = new URLSearchParams({ url: botUrl, text: messageText });
      tg.openTelegramLink(`https://t.me/share/url?${params.toString()}`);
    } else {
      navigator.clipboard?.writeText(`${messageText}\n${botUrl}`);
      tg?.showAlert?.('Ссылка скопирована! Отправьте её друзьям.');
    }

    startCountdown();
  };

  const progress = countdown > 0 ? (SHARE_DELAY_SEC - countdown) / SHARE_DELAY_SEC : 0;

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/60 z-[150] animate-fade-in backdrop-blur-sm"
        onClick={!isWaiting ? onClose : undefined}
      />
      
      <div className="fixed inset-x-0 bottom-0 z-[151] animate-slide-in-up">
        <div className="bg-white rounded-t-[28px] shadow-2xl overflow-hidden">
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 bg-gray-200 rounded-full" />
          </div>

          <div className="px-6 pb-8 pt-2">
            <div className="text-center mb-6">
              <div className="text-[56px] mb-3">
                {shared ? '🎉' : isWaiting ? '⏳' : '🔒'}
              </div>
              <h2 className="text-[22px] font-bold text-[#1A1A1A] mb-2 leading-tight">
                {shared 
                  ? 'Номера открыты на 1 час!' 
                  : isWaiting 
                    ? 'Подождите...'
                    : 'Поделитесь, чтобы увидеть номер'
                }
              </h2>
              <p className="text-[15px] text-gray-500 leading-relaxed">
                {shared 
                  ? 'Спасибо! Теперь все контакты доступны'
                  : isWaiting 
                    ? 'Отправьте объявление другу в открывшемся окне'
                    : 'Отправьте это объявление другу, и мы откроем все номера на 1 час'
                }
              </p>
            </div>

            {isWaiting && countdown > 0 && (
              <div className="mb-6">
                <div className="flex justify-center mb-4">
                  <div className="relative w-20 h-20">
                    <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                      <circle cx="40" cy="40" r="35" fill="none" stroke="#F0F0F0" strokeWidth="6" />
                      <circle 
                        cx="40" cy="40" r="35" fill="none" 
                        stroke="#2481cc" strokeWidth="6"
                        strokeLinecap="round"
                        strokeDasharray={`${2 * Math.PI * 35}`}
                        strokeDashoffset={`${2 * Math.PI * 35 * (1 - progress)}`}
                        className="transition-all duration-1000 ease-linear"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-[24px] font-bold text-[#2481cc] tabular-nums">
                        {countdown}
                      </span>
                    </div>
                  </div>
                </div>
                <p className="text-center text-[13px] text-gray-400 font-medium">
                  Номер откроется через {countdown} сек
                </p>
              </div>
            )}

            {!isWaiting && !shared && (
              <button 
                onClick={handleShare}
                disabled={isPreparing}
                className={`w-full py-5 rounded-2xl font-bold text-[17px] flex items-center justify-center gap-3 transition-all shadow-lg active:scale-[0.98] bg-[#2481cc] text-white ${isPreparing ? 'opacity-70' : ''}`}
              >
                {isPreparing ? (
                  <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                )}
                {isPreparing ? 'Подготовка...' : 'Отправить другу'}
              </button>
            )}

            {!isWaiting && !shared && (
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
// Global unlock logic
// ============================================

const GLOBAL_UNLOCK_KEY = 'global_unlock_until';

export function isGloballyUnlocked(): boolean {
  try {
    const until = parseInt(localStorage.getItem(GLOBAL_UNLOCK_KEY) || '0');
    return Date.now() < until;
  } catch {
    return false;
  }
}

function setGlobalUnlock() {
  try {
    const until = Date.now() + UNLOCK_DURATION_MS;
    localStorage.setItem(GLOBAL_UNLOCK_KEY, until.toString());
  } catch {}
}

export function getUnlockTimeRemaining(): number {
  try {
    const until = parseInt(localStorage.getItem(GLOBAL_UNLOCK_KEY) || '0');
    return Math.max(0, until - Date.now());
  } catch {
    return 0;
  }
}

function recordShareToServer(listingId: number) {
  const initData = window.Telegram?.WebApp?.initData;
  if (initData) {
    fetch(
      `${API_BASE}/api/shares/${listingId}?init_data=${encodeURIComponent(initData)}`,
      { method: 'POST' }
    ).catch(() => {});
  }
}

export function getLocalShareCount(listingId: number): number {
  return isGloballyUnlocked() ? 99 : 0;
}

export async function getServerShareCount(listingId: number): Promise<number> {
  return isGloballyUnlocked() ? 99 : 0;
}

export function isContactUnlocked(listingId: number, requiredShares: number = 1): boolean {
  return isGloballyUnlocked();
}

export default ShareGate;