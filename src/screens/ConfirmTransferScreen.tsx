import React, { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  Clock,
  AlertCircle,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { translations, Language } from '../i18n/translations';
import { User, UserWallet, Currency } from '../types';
import { api } from '../services/api';

interface ConfirmTransferScreenProps {
  user: User;
  wallet: UserWallet;
  transferData: {
    recipientAddress: string;
    recipientName: string;
    currency: Currency;
    amount: number;
    lockDurationSeconds: number;
    lockLabel: string;
    note: string;
  };
  onSuccess: () => void;
  onBack: () => void;
  lang: Language;
}

export const ConfirmTransferScreen: React.FC<ConfirmTransferScreenProps> = ({
  user,
  wallet,
  transferData,
  onSuccess,
  onBack,
  lang,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [completed, setCompleted] = useState(false);
  const t = translations[lang];

  const currentAvailable = wallet.balances[transferData.currency]?.available || 0;
  const remaining = Math.max(0, currentAvailable - transferData.amount);

  const isLocked = transferData.lockDurationSeconds > 0;
  const unlockDate = isLocked
    ? new Date(Date.now() + transferData.lockDurationSeconds * 1000)
    : null;

  const handleConfirm = async () => {
    try {
      setLoading(true);
      setError('');
      await api.transfer({
        recipientAddress: transferData.recipientAddress,
        currency: transferData.currency,
        amount: transferData.amount,
        lockDurationSeconds: transferData.lockDurationSeconds,
        note: transferData.note,
      });

      setCompleted(true);
      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'فشل في إتمام التحويل');
      setLoading(false);
    }
  };

  if (completed) {
    return (
      <div className="flex-1 bg-[#0b0f17] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4 animate-bounce">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h3 className="text-lg font-bold text-white mb-2">{t.transferSuccess}</h3>
        <p className="text-xs text-gray-400 max-w-xs mb-6">
          {isLocked
            ? lang === 'ar'
              ? `تم تسجيل التحويل وحجز ${transferData.amount} ${transferData.currency} كقفل زمني لمدة (${transferData.lockLabel}) لدى المستلم.`
              : `Transfer recorded! ${transferData.amount} ${transferData.currency} locked for ${transferData.lockLabel}.`
            : lang === 'ar'
            ? `تم تحويل ${transferData.amount} ${transferData.currency} فورياً إلى رصيد المستلم المتاح.`
            : `Transferred ${transferData.amount} ${transferData.currency} immediately to recipient.`}
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-[#0b0f17] flex flex-col p-4 pb-20 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={onBack}
          disabled={loading}
          className="p-2 rounded-xl bg-[#141e2c] hover:bg-[#1a273a] text-gray-300 transition"
        >
          {lang === 'ar' ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
        </button>
        <h2 className="text-base font-bold text-gray-100">{t.confirmTransfer}</h2>
        <div className="w-8"></div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-950/50 border border-red-500/40 rounded-xl text-red-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Review Card */}
      <div className="bg-[#121926] border border-gray-800 rounded-3xl p-5 mb-4 text-center relative overflow-hidden">
        <div className="text-[11px] text-gray-400 mb-1">{lang === 'ar' ? 'المبلغ المراد إرساله' : 'Sending Amount'}</div>
        <div className="text-3xl font-extrabold font-mono-code text-white mb-1">
          {transferData.amount} {transferData.currency}
        </div>
        {isLocked ? (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-medium">
            <Lock className="w-3.5 h-3.5" />
            <span>{lang === 'ar' ? `مقفل لمدة ${transferData.lockLabel}` : `Locked: ${transferData.lockLabel}`}</span>
          </div>
        ) : (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium">
            <span>{t.noLock}</span>
          </div>
        )}
      </div>

      {/* Detailed rows */}
      <div className="bg-[#121926] border border-gray-800 rounded-2xl p-4 space-y-3 text-xs mb-4">
        <div className="flex items-center justify-between pb-2.5 border-b border-gray-800">
          <span className="text-gray-400">{t.recipient}</span>
          <span className="font-semibold text-gray-200">{transferData.recipientName}</span>
        </div>

        <div className="pb-2.5 border-b border-gray-800">
          <div className="text-gray-400 mb-1">{t.recipientAddress}</div>
          <div className="font-mono-code text-[11px] text-gray-300 break-all bg-[#0b0f17] p-2 rounded-lg border border-gray-800/80">
            {transferData.recipientAddress}
          </div>
        </div>

        <div className="flex items-center justify-between pb-2.5 border-b border-gray-800">
          <span className="text-gray-400">{t.lockDuration}</span>
          <span className="font-semibold text-amber-400 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            <span>{transferData.lockLabel}</span>
          </span>
        </div>

        {isLocked && unlockDate && (
          <div className="flex items-center justify-between pb-2.5 border-b border-gray-800">
            <span className="text-gray-400">{t.estimatedRelease}</span>
            <span className="font-mono-code text-gray-200 text-[11px]">
              {unlockDate.toLocaleString([], {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
        )}

        <div className="flex items-center justify-between pb-2.5 border-b border-gray-800">
          <span className="text-gray-400">{t.remainingBalance}</span>
          <span className="font-mono-code text-emerald-400 font-semibold">
            {remaining} {transferData.currency}
          </span>
        </div>

        <div className="flex items-center justify-between pb-2.5 border-b border-gray-800">
          <span className="text-gray-400">{t.networkFee}</span>
          <span className="text-emerald-400 font-semibold">{t.free}</span>
        </div>

        {transferData.note && (
          <div className="pt-1">
            <span className="text-gray-400 block mb-0.5">{t.noteOptional}:</span>
            <span className="text-gray-300 italic">{transferData.note}</span>
          </div>
        )}
      </div>

      {/* Security validation badge */}
      <div className="flex items-center gap-2 p-3 bg-emerald-950/30 border border-emerald-500/20 rounded-xl text-emerald-300 text-[11px] mb-5">
        <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400" />
        <span>
          {lang === 'ar'
            ? 'سيتم التحقق من رصيدك وخصم المبلغ وتطبيق الحجز الزمني بشكل آمن على الخادم'
            : 'Atomic deduction and server time-lock validation will execute upon confirmation'}
        </span>
      </div>

      {/* Confirm & Send Button */}
      <button
        type="button"
        onClick={handleConfirm}
        disabled={loading}
        className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition shadow-lg shadow-emerald-900/40 flex items-center justify-center gap-2"
      >
        {loading ? (
          <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
        ) : (
          <>
            <span>{t.confirmAndSend}</span>
            {lang === 'ar' ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
          </>
        )}
      </button>
    </div>
  );
};
