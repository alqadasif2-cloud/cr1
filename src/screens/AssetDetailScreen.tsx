import React from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Send,
  Download,
  Lock,
  TrendingUp,
  History,
} from 'lucide-react';
import { translations, Language } from '../i18n/translations';
import { Currency, UserWallet, Transaction, User } from '../types';

interface AssetDetailScreenProps {
  currency: Currency;
  wallet: UserWallet;
  user: User;
  rates: Record<string, number>;
  transactions: Transaction[];
  onNavigateToSend: (currency: Currency) => void;
  onNavigateToReceive: () => void;
  onBack: () => void;
  lang: Language;
}

export const AssetDetailScreen: React.FC<AssetDetailScreenProps> = ({
  currency,
  wallet,
  user,
  rates,
  transactions,
  onNavigateToSend,
  onNavigateToReceive,
  onBack,
  lang,
}) => {
  const t = translations[lang];

  const assetInfo = {
    BTC: { name: 'Bitcoin', symbol: '₿', color: 'text-amber-400', rate: rates.BTC || 68500 },
    ETH: { name: 'Ethereum', symbol: 'Ξ', color: 'text-indigo-400', rate: rates.ETH || 3450 },
    USDT: { name: 'Tether USD', symbol: '₮', color: 'text-emerald-400', rate: rates.USDT || 1.0 },
  }[currency];

  const bal = wallet.balances[currency];
  const total = bal.available + bal.locked;
  const totalUsdt = total * assetInfo.rate;

  const assetTxs = transactions.filter((t) => t.currency === currency);

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
        <h2 className="text-base font-bold text-gray-100 flex items-center gap-1.5">
          <span className={assetInfo.color}>{assetInfo.symbol}</span>
          <span>{assetInfo.name}</span>
        </h2>
        <div className="w-8"></div>
      </div>

      {/* Asset Hero Card */}
      <div className="bg-[#121926] border border-gray-800 rounded-3xl p-6 text-center shadow-xl mb-4">
        <div className="text-xs text-gray-400 mb-1">{t.total}</div>
        <div className="text-3xl font-extrabold font-mono-code text-white mb-1">
          {total} {currency}
        </div>
        <div className="text-xs text-emerald-400 font-mono-code mb-4">
          ≈ ${totalUsdt.toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </div>

        {/* Sub-balances */}
        <div className="grid grid-cols-2 gap-2 pt-4 border-t border-gray-800 text-xs">
          <div className="bg-[#0b0f17] p-2.5 rounded-xl text-center">
            <span className="text-[10px] text-gray-400 block mb-0.5">{t.available}</span>
            <span className="font-mono-code font-bold text-emerald-400 text-sm">
              {bal.available}
            </span>
          </div>
          <div className="bg-[#0b0f17] p-2.5 rounded-xl text-center">
            <span className="text-[10px] text-gray-400 block mb-0.5 flex items-center justify-center gap-1">
              <span>{t.locked}</span>
              <Lock className="w-3 h-3 text-amber-400" />
            </span>
            <span className="font-mono-code font-bold text-amber-400 text-sm">
              {bal.locked}
            </span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <button
          onClick={() => onNavigateToSend(currency)}
          className="py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition shadow-lg shadow-emerald-900/30"
        >
          <Send className="w-4 h-4" />
          <span>{t.send} {currency}</span>
        </button>
        <button
          onClick={onNavigateToReceive}
          className="py-3 px-4 bg-[#141e2c] hover:bg-[#1a273a] text-gray-200 border border-gray-700/80 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition"
        >
          <Download className="w-4 h-4 text-emerald-400" />
          <span>{t.receive}</span>
        </button>
      </div>

      {/* Transactions for this currency */}
      <div>
        <h3 className="text-xs font-bold text-gray-300 mb-2.5 flex items-center gap-1.5">
          <History className="w-4 h-4 text-emerald-400" />
          <span>{lang === 'ar' ? `سجل عمليات ${currency}` : `${currency} History`}</span>
        </h3>

        {assetTxs.length === 0 ? (
          <div className="bg-[#121926]/50 border border-gray-800 rounded-2xl p-6 text-center text-xs text-gray-400">
            {t.noTransactions}
          </div>
        ) : (
          <div className="space-y-2">
            {assetTxs.map((tx) => {
              const isSender = tx.senderUserId === user.id;
              const isLocked = tx.status === 'LOCKED';
              return (
                <div
                  key={tx.id}
                  className="bg-[#121926] border border-gray-800/80 rounded-xl p-3 flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-semibold text-gray-200">
                      {isLocked ? t.statusLocked : isSender ? `${t.send} -> ${tx.recipientName}` : `${t.receive} <- ${tx.senderName}`}
                    </div>
                    <div className="text-[10px] text-gray-400 font-mono-code">
                      {new Date(tx.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="text-right rtl:text-left font-mono-code font-bold">
                    <span className={isLocked ? 'text-amber-400' : isSender ? 'text-rose-400' : 'text-emerald-400'}>
                      {isSender ? '-' : '+'}
                      {tx.amount} {tx.currency}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
