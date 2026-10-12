import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Copy,
  Check,
  Clock,
  CheckCircle2,
  Lock,
  RotateCcw,
  History,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import { translations, Language } from '../i18n/translations';
import { Transaction, User } from '../types';
import { api } from '../services/api';

interface TransactionDetailScreenProps {
  txId: string;
  user: User;
  onBack: () => void;
  lang: Language;
}

export const TransactionDetailScreen: React.FC<TransactionDetailScreenProps> = ({
  txId,
  user,
  onBack,
  lang,
}) => {
  const [tx, setTx] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedHash, setCopiedHash] = useState(false);
  const [isRefunding, setIsRefunding] = useState(false);
  const [refundReason, setRefundReason] = useState('');
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundMsg, setRefundMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const t = translations[lang];

  const loadTx = () => {
    setLoading(true);
    api.getTransaction(txId)
      .then((data) => setTx(data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadTx();
  }, [txId]);

  if (loading || !tx) {
    return (
      <div className="flex-1 bg-[#0b0f17] flex items-center justify-center p-6 text-xs text-gray-400">
        <span className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mr-2"></span>
        <span>جاري تحميل تفاصيل المعاملة...</span>
      </div>
    );
  }

  const isHistorical = tx.isHistorical === true;
  const isRefund = tx.isRefund === true;
  const isSender = tx.senderUserId === user.id && !isRefund;
  const isLocked = tx.status === 'LOCKED';

  const handleCopyHash = () => {
    navigator.clipboard.writeText(tx.txHash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  const handleExecuteRefund = async () => {
    try {
      setIsRefunding(true);
      setError(null);
      await api.refundTransaction(tx.id, refundReason.trim() || undefined);
      setRefundMsg(lang === 'ar' ? 'تم استرجاع المعاملة وتحديث الأرصدة بنجاح' : 'Refund processed successfully');
      setShowRefundModal(false);
      loadTx();
    } catch (err: any) {
      setError(err.message || 'فشل في استرجاع المعاملة');
    } finally {
      setIsRefunding(false);
    }
  };

  const canRefund =
    !isHistorical &&
    !isRefund &&
    !tx.refunded &&
    tx.status === 'COMPLETED' &&
    (user.role === 'owner' || tx.senderUserId === user.id);

  // Exact date formatting without invented year for historical records
  const dateFormatted = isHistorical && tx.historicalDateText && tx.historicalTimeText
    ? `${tx.historicalDateText} — ${tx.historicalTimeText}`
    : new Date(tx.createdAt).toLocaleString([], {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

  return (
    <div className="flex-1 bg-[#0b0f17] flex flex-col p-4 pb-20 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={onBack}
          className="p-2 rounded-xl bg-[#141e2c] hover:bg-[#1a273a] text-gray-300 transition"
        >
          {lang === 'ar' ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
        </button>
        <h2 className="text-base font-bold text-gray-100">
          {lang === 'ar' ? 'تفاصيل المعاملة' : 'Transaction Details'}
        </h2>
        <div className="w-8"></div>
      </div>

      {refundMsg && (
        <div className="mb-4 p-3 bg-emerald-950/50 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{refundMsg}</span>
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-950/50 border border-red-500/40 rounded-xl text-red-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Status & Amount Card */}
      <div className="bg-[#121926] border border-gray-800 rounded-3xl p-5 text-center mb-4">
        <div className="w-12 h-12 rounded-2xl mx-auto flex items-center justify-center mb-3 bg-emerald-500/10 text-emerald-400">
          {isHistorical ? (
            <History className="w-6 h-6 text-blue-400" />
          ) : isRefund ? (
            <RotateCcw className="w-6 h-6 text-purple-400" />
          ) : isLocked ? (
            <Clock className="w-6 h-6 text-amber-400" />
          ) : (
            <CheckCircle2 className="w-6 h-6 text-emerald-400" />
          )}
        </div>

        <div className="text-2xl font-bold font-mono-code text-white mb-1">
          {isRefund ? '' : isSender ? '-' : '+'}
          {tx.amount.toFixed(2)} {tx.currency}
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#182333] border border-gray-700 text-gray-300">
          <span
            className={`w-2 h-2 rounded-full ${
              isHistorical
                ? 'bg-blue-400'
                : isRefund
                ? 'bg-purple-400'
                : isLocked
                ? 'bg-amber-400'
                : 'bg-emerald-400'
            }`}
          ></span>
          <span>
            {isHistorical
              ? isRefund
                ? (lang === 'ar' ? 'مكتمل بوصفه سجلًا تاريخيًا' : 'Completed as historical record')
                : (lang === 'ar' ? 'مكتمل' : 'Completed')
              : isRefund
              ? (lang === 'ar' ? 'عملية استرجاع مكتملة' : 'Refund Completed')
              : isLocked
              ? t.statusLocked
              : t.statusCompleted}
          </span>
        </div>

        {tx.refunded && (
          <div className="mt-2 text-[11px] text-purple-400 font-semibold bg-purple-950/40 py-1 px-3 rounded-full border border-purple-500/30 inline-block">
            {lang === 'ar' ? 'تم استرجاع هذه المعاملة' : 'Transaction Refunded'}
          </div>
        )}
      </div>

      {/* Details List */}
      <div className="bg-[#121926] border border-gray-800 rounded-2xl p-4 space-y-3 text-xs mb-4">
        {/* Source */}
        <div className="flex items-center justify-between pb-2.5 border-b border-gray-800">
          <span className="text-gray-400">{lang === 'ar' ? 'مصدر السجل' : 'Record Source'}</span>
          <span className="font-mono-code text-gray-300 bg-[#0b0f17] px-2 py-0.5 rounded border border-gray-800">
            {tx.source}
          </span>
        </div>

        {/* Transaction Hash */}
        <div className="pb-2.5 border-b border-gray-800">
          <div className="flex items-center justify-between text-gray-400 mb-1">
            <span>{lang === 'ar' ? 'معرّف المعاملة (TxHash)' : 'Transaction Hash'}</span>
            <button
              onClick={handleCopyHash}
              className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-medium text-[11px]"
            >
              {copiedHash ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedHash ? (lang === 'ar' ? 'تم النسخ' : 'Copied') : (lang === 'ar' ? 'نسخ' : 'Copy')}</span>
            </button>
          </div>
          <div className="font-mono-code text-[11px] text-gray-300 break-all bg-[#0b0f17] p-2 rounded-xl border border-gray-800">
            {tx.txHash}
          </div>
        </div>

        {/* Associated Sender for Record 4 */}
        {tx.associatedSender && (
          <div className="flex items-center justify-between pb-2.5 border-b border-gray-800">
            <span className="text-gray-400">{lang === 'ar' ? 'المرسل المرتبط بالسجل' : 'Associated Sender'}</span>
            <span className="font-semibold text-gray-200">{tx.associatedSender}</span>
          </div>
        )}

        {/* Addresses */}
        <div className="pb-2.5 border-b border-gray-800">
          <span className="text-gray-400 block mb-0.5">{lang === 'ar' ? 'عنوان المرسل' : 'Sender Address'}</span>
          <span className="font-mono-code text-[10px] text-gray-400 break-all">{tx.senderAddress}</span>
        </div>
        <div className="pb-2.5 border-b border-gray-800">
          <span className="text-gray-400 block mb-0.5">{lang === 'ar' ? 'عنوان المستلم' : 'Recipient Address'}</span>
          <span className="font-mono-code text-[10px] text-gray-400 break-all">{tx.recipientAddress}</span>
        </div>

        {/* Created Timestamp / Historical Date */}
        <div className="flex items-center justify-between pb-2.5 border-b border-gray-800">
          <span className="text-gray-400">{lang === 'ar' ? 'التاريخ والوقت' : 'Date & Time'}</span>
          <span className="font-mono-code text-gray-200 font-semibold text-[11px]">
            {dateFormatted}
          </span>
        </div>

        {/* Lock Duration Info */}
        {tx.lockDurationSeconds > 0 && (
          <>
            <div className="flex items-center justify-between pb-2.5 border-b border-gray-800">
              <span className="text-gray-400">{t.lockDuration}</span>
              <span className="font-semibold text-amber-400 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                <span>
                  {tx.lockDurationSeconds >= 86400
                    ? `${Math.round(tx.lockDurationSeconds / 86400)} ${lang === 'ar' ? 'يوم' : 'Days'}`
                    : tx.lockDurationSeconds >= 3600
                    ? `${Math.round(tx.lockDurationSeconds / 3600)} ${lang === 'ar' ? 'ساعة' : 'Hours'}`
                    : `${Math.round(tx.lockDurationSeconds / 60)} ${lang === 'ar' ? 'دقيقة' : 'Minutes'}`}
                </span>
              </span>
            </div>

            {tx.unlockAt && (
              <div className="flex items-center justify-between pb-2.5 border-b border-gray-800">
                <span className="text-gray-400">{t.unlockDate}</span>
                <span className="font-mono-code text-gray-200 text-[11px]">
                  {new Date(tx.unlockAt).toLocaleString()}
                </span>
              </div>
            )}
          </>
        )}

        {/* Note / Historical Note */}
        {(tx.note || tx.historicalNote) && (
          <div className="bg-[#0b0f17] p-2.5 rounded-xl border border-gray-800/80">
            <span className="text-gray-400 block text-[10px] mb-0.5">{lang === 'ar' ? 'ملاحظة:' : 'Note:'}</span>
            <span className="text-gray-300 italic text-[11px] leading-relaxed">
              {tx.historicalNote || tx.note}
            </span>
          </div>
        )}
      </div>

      {/* Action: Refund Button for Owner or authorized party */}
      {canRefund && (
        <div className="mb-4">
          <button
            onClick={() => setShowRefundModal(true)}
            className="w-full py-3 bg-[#1e1526] hover:bg-purple-950/50 border border-purple-500/40 text-purple-300 font-semibold rounded-2xl text-xs flex items-center justify-center gap-2 transition"
          >
            <RotateCcw className="w-4 h-4" />
            <span>{lang === 'ar' ? 'استرجاع هذه المعاملة (Refund)' : 'Refund this Transaction'}</span>
          </button>
        </div>
      )}

      {/* Refund Confirmation Modal */}
      {showRefundModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-[#121926] border border-purple-500/40 rounded-3xl p-5 max-w-sm w-full space-y-4 text-xs">
            <div className="flex items-center gap-2 text-purple-400 font-bold text-sm">
              <RotateCcw className="w-4 h-4" />
              <span>{lang === 'ar' ? 'تأكيد استرجاع المعاملة' : 'Confirm Refund'}</span>
            </div>

            <p className="text-gray-300 leading-relaxed text-[11px]">
              {lang === 'ar'
                ? `سيتم خصم ${tx.amount} ${tx.currency} من محفظة المستلم وإعادتها فورياً إلى محفظة المرسل مع تسجيل حركة استرجاع ذرية.`
                : `Will deduct ${tx.amount} ${tx.currency} from recipient and credit sender atomically.`}
            </p>

            <div>
              <label className="block text-gray-400 mb-1 text-[11px]">
                {lang === 'ar' ? 'سبب الاسترجاع (اختياري):' : 'Reason (optional):'}
              </label>
              <input
                type="text"
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                placeholder={lang === 'ar' ? 'مثال: طلب المستخدم أو تصحيح تجريبي' : 'e.g. Simulation correction'}
                className="w-full bg-[#0b0f17] border border-gray-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={handleExecuteRefund}
                disabled={isRefunding}
                className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold rounded-xl transition flex items-center justify-center gap-1.5"
              >
                {isRefunding ? (
                  <span className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                ) : (
                  <span>{lang === 'ar' ? 'تنفيذ الاسترجاع' : 'Execute Refund'}</span>
                )}
              </button>
              <button
                onClick={() => setShowRefundModal(false)}
                disabled={isRefunding}
                className="px-4 py-2.5 bg-[#182333] hover:bg-[#203044] text-gray-300 font-medium rounded-xl border border-gray-700 transition"
              >
                {lang === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
