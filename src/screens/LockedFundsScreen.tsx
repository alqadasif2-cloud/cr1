import React, { useState, useEffect } from 'react';
import {
  Clock,
  ArrowRight,
  ArrowLeft,
  Lock,
  Unlock,
  Zap,
  AlertCircle,
  CheckCircle2,
  Calendar,
  User as UserIcon,
} from 'lucide-react';
import { translations, Language } from '../i18n/translations';
import { Transaction, User } from '../types';
import { api } from '../services/api';

interface LockedFundsScreenProps {
  user: User;
  onBack: () => void;
  onRefresh: () => void;
  lang: Language;
}

export const LockedFundsScreen: React.FC<LockedFundsScreenProps> = ({
  user,
  onBack,
  onRefresh,
  lang,
}) => {
  const [incomingLocked, setIncomingLocked] = useState<Transaction[]>([]);
  const [outgoingLocked, setOutgoingLocked] = useState<Transaction[]>([]);
  const [now, setNow] = useState(Date.now());
  const [loading, setLoading] = useState(true);
  const [fastForwardingId, setFastForwardingId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const t = translations[lang];

  const loadData = async () => {
    try {
      const data = await api.getLockedFunds();
      setIncomingLocked(data.incomingLocked);
      setOutgoingLocked(data.outgoingLocked);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const ticker = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    const syncInterval = setInterval(() => {
      api.triggerUnlockCheck().then(() => {
        loadData();
      });
    }, 4000);

    return () => {
      clearInterval(ticker);
      clearInterval(syncInterval);
    };
  }, []);

  const formatCountdown = (unlockAt: number | null) => {
    if (!unlockAt) return '00:00:00';
    const diff = unlockAt - now;
    if (diff <= 0) return t.matured;

    const seconds = Math.floor((diff / 1000) % 60);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    }
    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleFastForward = async (txId: string) => {
    try {
      setFastForwardingId(txId);
      await api.fastForwardTx(txId);
      setNotice(lang === 'ar' ? 'تم تسريع وقت القفل وفك الرصيد فورياً بنجاح!' : 'Time fast-forwarded! Balance unlocked.');
      await loadData();
      onRefresh();
    } catch (err: any) {
      setNotice(err.message || 'فشل في تسريع الوقت');
    } finally {
      setFastForwardingId(null);
    }
  };

  return (
    <div className="flex-1 bg-[#0b0f17] flex flex-col p-4 pb-20 overflow-y-auto">
      {/* Top Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={onBack}
          className="p-2 rounded-xl bg-[#141e2c] hover:bg-[#1a273a] text-gray-300 transition"
        >
          {lang === 'ar' ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
        </button>
        <h2 className="text-base font-bold text-gray-100 flex items-center gap-1.5">
          <Clock className="w-4 h-4 text-amber-400" />
          <span>{t.lockedFundsTitle}</span>
        </h2>
        <div className="w-8"></div>
      </div>

      {notice && (
        <div className="mb-4 p-3 bg-emerald-950/60 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs flex items-center justify-between">
          <span>{notice}</span>
          <button onClick={() => setNotice(null)} className="text-emerald-400 hover:text-white font-bold ml-2">
            ×
          </button>
        </div>
      )}

      {/* Intro info */}
      <div className="bg-[#121926] border border-amber-500/20 rounded-2xl p-3.5 mb-4 text-xs text-gray-300 leading-relaxed">
        <div className="flex items-center gap-1.5 text-amber-400 font-bold mb-1">
          <Lock className="w-3.5 h-3.5" />
          <span>{lang === 'ar' ? 'آلية قفل الأرصدة المجدولة' : 'Time-Lock Mechanism'}</span>
        </div>
        <p className="text-[11px] text-gray-400">
          {lang === 'ar'
            ? 'تظل الأرصدة المقفلة محجوزة بحساب المستلم ولا يمكن إنفاقها حتى انتهاء المدة المحددة من قبل المرسل. يقوم الخادم بفك القفل تلقائياً بمجرد حلول موعد الإتاحة.'
            : 'Locked funds remain reserved until the maturity timestamp set by the sender. Unlocking occurs automatically on the server.'}
        </p>
      </div>

      {/* Section: Incoming Locked Funds (Ready to be unlocked for current user) */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2.5">
          <h3 className="text-xs font-bold text-gray-200 flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-amber-400" />
            <span>{t.incomingLocked}</span>
          </h3>
          <span className="text-[10px] text-gray-400 font-mono-code">{incomingLocked.length} items</span>
        </div>

        {incomingLocked.length === 0 ? (
          <div className="bg-[#121926]/50 border border-gray-800/80 rounded-2xl p-6 text-center text-xs text-gray-400">
            {lang === 'ar' ? 'لا توجد مبالغ مقفلة واردة إليك حالياً' : 'No incoming locked funds at the moment'}
          </div>
        ) : (
          <div className="space-y-3">
            {incomingLocked.map((tx) => {
              const countdown = formatCountdown(tx.unlockAt);
              const isMatured = tx.unlockAt && now >= tx.unlockAt;

              return (
                <div
                  key={tx.id}
                  className="bg-[#121926] border border-amber-500/30 rounded-2xl p-4 relative overflow-hidden shadow-lg"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-gray-300 flex items-center gap-1">
                      <UserIcon className="w-3.5 h-3.5 text-gray-400" />
                      <span>{tx.senderName}</span>
                    </span>
                    <span className="text-sm font-extrabold font-mono-code text-amber-400">
                      +{tx.amount} {tx.currency}
                    </span>
                  </div>

                  {/* Countdown Timer Display */}
                  <div className="bg-[#0b0f17] border border-gray-800 rounded-xl p-3 mb-3 text-center">
                    <div className="text-[10px] text-gray-400 mb-0.5">{t.remainingTime}</div>
                    <div className="text-xl font-bold font-mono-code text-white tracking-widest">
                      {countdown}
                    </div>
                  </div>

                  {/* Date details */}
                  <div className="space-y-1 text-[11px] text-gray-400 mb-3 font-mono-code">
                    <div className="flex justify-between">
                      <span className="text-gray-400">{t.unlockDate}:</span>
                      <span className="text-gray-200">
                        {tx.unlockAt
                          ? new Date(tx.unlockAt).toLocaleString([], {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : '-'}
                      </span>
                    </div>
                    {tx.note && (
                      <div className="flex justify-between pt-1 border-t border-gray-800 text-[10px]">
                        <span className="text-gray-400">{t.noteOptional}:</span>
                        <span className="text-gray-300 italic">{tx.note}</span>
                      </div>
                    )}
                  </div>

                  {/* Instant Test Fast Forward Button */}
                  <button
                    onClick={() => handleFastForward(tx.id)}
                    disabled={fastForwardingId === tx.id}
                    className="w-full py-2 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-black font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition shadow"
                    title={t.fastForwardDesc}
                  >
                    <Zap className="w-3.5 h-3.5 fill-black" />
                    <span>
                      {fastForwardingId === tx.id
                        ? lang === 'ar'
                          ? 'جاري الفك...'
                          : 'Unlocking...'
                        : t.fastForwardTest}
                    </span>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Section: Outgoing Locked Funds (Sent to others) */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <h3 className="text-xs font-bold text-gray-200 flex items-center gap-1.5">
            <Unlock className="w-3.5 h-3.5 text-gray-400" />
            <span>{t.outgoingLocked}</span>
          </h3>
          <span className="text-[10px] text-gray-400 font-mono-code">{outgoingLocked.length} items</span>
        </div>

        {outgoingLocked.length === 0 ? (
          <div className="bg-[#121926]/50 border border-gray-800/80 rounded-2xl p-5 text-center text-xs text-gray-400">
            {lang === 'ar' ? 'لا توجد مبالغ مقفلة صادرة منك حالياً' : 'No outgoing locked funds sent'}
          </div>
        ) : (
          <div className="space-y-2.5">
            {outgoingLocked.map((tx) => (
              <div
                key={tx.id}
                className="bg-[#121926] border border-gray-800/80 rounded-xl p-3 flex items-center justify-between"
              >
                <div>
                  <div className="text-xs font-semibold text-gray-200">
                    {lang === 'ar' ? 'إلى:' : 'To:'} {tx.recipientName}
                  </div>
                  <div className="text-[10px] text-gray-400 font-mono-code">
                    {t.remainingTime}: {formatCountdown(tx.unlockAt)}
                  </div>
                </div>
                <div className="text-right rtl:text-left font-mono-code">
                  <div className="text-xs font-bold text-amber-400">
                    {tx.amount} {tx.currency}
                  </div>
                  <div className="text-[10px] text-gray-400">
                    {tx.lockDurationSeconds >= 86400
                      ? `${Math.round(tx.lockDurationSeconds / 86400)}d`
                      : `${Math.round(tx.lockDurationSeconds / 3600)}h`}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
