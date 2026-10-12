import React, { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  Search,
  RotateCcw,
  History,
  ShieldAlert,
} from 'lucide-react';
import { translations, Language } from '../i18n/translations';
import { Transaction, User } from '../types';

interface TransactionHistoryScreenProps {
  user: User;
  transactions: Transaction[];
  onSelectTx: (txId: string) => void;
  onBack: () => void;
  lang: Language;
}

export const TransactionHistoryScreen: React.FC<TransactionHistoryScreenProps> = ({
  user,
  transactions,
  onSelectTx,
  onBack,
  lang,
}) => {
  const [filterType, setFilterType] = useState<'all' | 'sent' | 'received' | 'locked' | 'refund'>('all');
  const [selectedCurrency, setSelectedCurrency] = useState<string>('all');
  const [search, setSearch] = useState('');

  const t = translations[lang];

  const filtered = transactions.filter((tx) => {
    // Type filter
    if (filterType === 'sent' && (tx.senderUserId !== user.id || tx.isRefund)) return false;
    if (filterType === 'received' && (tx.recipientUserId !== user.id || tx.isRefund)) return false;
    if (filterType === 'locked' && tx.status !== 'LOCKED') return false;
    if (filterType === 'refund' && !tx.isRefund && !tx.refunded) return false;

    // Currency filter
    if (selectedCurrency !== 'all' && tx.currency !== selectedCurrency) return false;

    // Search query
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchHash = tx.txHash.toLowerCase().includes(q);
      const matchParty = (tx.senderName + ' ' + tx.recipientName + ' ' + (tx.associatedSender || '')).toLowerCase().includes(q);
      const matchNote = ((tx.note || '') + ' ' + (tx.historicalNote || '')).toLowerCase().includes(q);
      const matchDate = ((tx.historicalDateText || '') + ' ' + (tx.historicalTimeText || '')).toLowerCase().includes(q);
      if (!matchHash && !matchParty && !matchNote && !matchDate) return false;
    }

    return true;
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
        <h2 className="text-base font-bold text-gray-100">{t.activity}</h2>
        <div className="w-8"></div>
      </div>

      {/* Search Input */}
      <div className="relative mb-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={lang === 'ar' ? 'بحث بالمعرّف، التاريخ، أو الطرف...' : 'Search by ID, date, or note...'}
          className="w-full bg-[#131b26] border border-gray-700/80 rounded-xl py-2 px-3 ps-9 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
        />
        <Search className="w-3.5 h-3.5 text-gray-400 absolute start-3 top-2.5" />
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-3 text-xs scrollbar-none">
        {[
          { id: 'all', label: lang === 'ar' ? 'الكل' : 'All' },
          { id: 'sent', label: t.send },
          { id: 'received', label: t.receive },
          { id: 'locked', label: t.lockedFunds },
          { id: 'refund', label: lang === 'ar' ? 'الاسترجاع' : 'Refunds' },
        ].map((tab) => {
          const active = filterType === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setFilterType(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl font-medium transition shrink-0 ${
                active
                  ? 'bg-emerald-600 text-white font-bold'
                  : 'bg-[#141e2c] text-gray-400 hover:text-gray-200'
              }`}
            >
              {tab.label}
            </button>
          );
        })}

        {/* Currency filters */}
        <select
          value={selectedCurrency}
          onChange={(e) => setSelectedCurrency(e.target.value)}
          className="bg-[#141e2c] border border-gray-700 text-gray-300 text-xs rounded-xl px-2.5 py-1.5 focus:outline-none shrink-0"
        >
          <option value="all">{lang === 'ar' ? 'جميع العملات' : 'All Coins'}</option>
          <option value="USDT">USDT</option>
          <option value="BTC">BTC</option>
          <option value="ETH">ETH</option>
        </select>
      </div>

      {/* Transactions List */}
      <div className="space-y-2.5">
        {filtered.length === 0 ? (
          <div className="bg-[#121926]/50 border border-gray-800 rounded-2xl p-8 text-center text-xs text-gray-400">
            {t.noTransactions}
          </div>
        ) : (
          filtered.map((tx) => {
            const isHistorical = tx.isHistorical === true;
            const isRefund = tx.isRefund === true;
            const isSender = tx.senderUserId === user.id && !isRefund;
            const isLocked = tx.status === 'LOCKED';

            // Exact formatting according to Section 11:
            // 7 أكتوبر — 5:11 صباحًا (دون سنة مخترعة)
            const dateLabel = isHistorical && tx.historicalDateText && tx.historicalTimeText
              ? `${tx.historicalDateText} — ${tx.historicalTimeText}`
              : `${new Date(tx.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })} — ${new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

            let titleText = '';
            if (isHistorical) {
              if (isRefund) {
                titleText = tx.associatedSender
                  ? `${lang === 'ar' ? 'استرجاع مبلغ مرتبط بالمرسل' : 'Refund linked to sender'} ${tx.associatedSender}`
                  : (lang === 'ar' ? 'استرجاع مبلغ' : 'Refund');
              } else {
                titleText = lang === 'ar' ? 'استلام مبلغ' : 'Received funds';
              }
            } else if (isRefund) {
              titleText = lang === 'ar' ? 'عملية استرجاع رصيد' : 'Refund Transaction';
            } else if (isLocked) {
              titleText = lang === 'ar' ? `تحويل مقفل (${tx.amount} ${tx.currency})` : `Locked (${tx.amount} ${tx.currency})`;
            } else if (isSender) {
              titleText = `${lang === 'ar' ? 'إرسال مبلغ' : 'Sent funds'}`;
            } else {
              titleText = `${lang === 'ar' ? 'استلام مبلغ' : 'Received funds'}`;
            }

            return (
              <div
                key={tx.id}
                onClick={() => onSelectTx(tx.id)}
                className={`border rounded-2xl p-3.5 flex flex-col gap-2 transition cursor-pointer ${
                  isHistorical
                    ? 'bg-[#121926] hover:bg-[#162132] border-blue-500/30'
                    : isRefund
                    ? 'bg-[#121926] hover:bg-[#162132] border-purple-500/30'
                    : isLocked
                    ? 'bg-[#121926] hover:bg-[#162132] border-amber-500/30'
                    : 'bg-[#121926] hover:bg-[#162132] border-gray-800/90'
                }`}
              >
                {/* Header row with date */}
                <div className="flex items-center justify-between text-[11px] text-gray-400 pb-1.5 border-b border-gray-800/60 font-mono-code">
                  <div className="font-semibold text-gray-300 flex items-center gap-1.5">
                    {isHistorical && <History className="w-3.5 h-3.5 text-blue-400" />}
                    <span>{dateLabel}</span>
                  </div>
                  {isHistorical && (
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/30">
                      {lang === 'ar' ? 'سجل تاريخي' : 'Historical Seed'}
                    </span>
                  )}
                  {tx.refunded && (
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/30">
                      {lang === 'ar' ? 'مسترجع' : 'Refunded'}
                    </span>
                  )}
                </div>

                {/* Main details row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        isRefund
                          ? 'bg-purple-500/10 text-purple-400'
                          : isLocked
                          ? 'bg-amber-500/10 text-amber-400'
                          : isSender
                          ? 'bg-rose-500/10 text-rose-400'
                          : 'bg-emerald-500/10 text-emerald-400'
                      }`}
                    >
                      {isRefund ? (
                        <RotateCcw className="w-4 h-4" />
                      ) : isLocked ? (
                        <Clock className="w-4 h-4" />
                      ) : isSender ? (
                        <ArrowUpRight className="w-4 h-4" />
                      ) : (
                        <ArrowDownLeft className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-gray-100">{titleText}</div>
                      <div className="text-[10px] text-gray-400 flex items-center gap-2 mt-0.5">
                        <span className="font-semibold text-gray-300">
                          {isHistorical
                            ? isRefund
                              ? (lang === 'ar' ? 'الحالة: مكتمل بوصفه سجلًا تاريخيًا' : 'Status: Completed as historical record')
                              : (lang === 'ar' ? 'الحالة: مكتمل' : 'Status: Completed')
                            : isLocked
                            ? t.statusLocked
                            : t.statusCompleted}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right rtl:text-left">
                    <div
                      className={`text-xs font-extrabold font-mono-code ${
                        isRefund
                          ? 'text-purple-400'
                          : isLocked
                          ? 'text-amber-400'
                          : isSender
                          ? 'text-rose-400'
                          : 'text-emerald-400'
                      }`}
                    >
                      {isRefund ? '' : isSender ? '-' : '+'}
                      {tx.amount.toFixed(2)} {tx.currency}
                    </div>
                  </div>
                </div>

                {/* Historical Simulation Note */}
                {isHistorical && tx.historicalNote && (
                  <div className="text-[10px] text-gray-400 bg-[#0d1420] p-2 rounded-xl border border-blue-500/20 italic">
                    <span className="font-medium text-gray-300">
                      {lang === 'ar' ? 'ملاحظة: ' : 'Note: '}
                    </span>
                    <span>{tx.historicalNote}</span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
