import React, { useState } from 'react';
import {
  Send,
  Download,
  Clock,
  Bell,
  Copy,
  Check,
  QrCode,
  ArrowUpRight,
  ArrowDownLeft,
  ChevronRight,
  ShieldCheck,
  TrendingUp,
  Lock,
  Layers,
} from 'lucide-react';
import { translations, Language } from '../i18n/translations';
import { User, UserWallet, Transaction, Currency } from '../types';

interface HomeScreenProps {
  user: User;
  wallet: UserWallet;
  transactions: Transaction[];
  unreadNotifsCount: number;
  rates: Record<string, number>;
  totalUsdtEquivalent: number;
  availableUsdtEquivalent?: number;
  lockedUsdtEquivalent?: number;
  onNavigate: (screen: string, params?: any) => void;
  onOpenQr: () => void;
  lang: Language;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  user,
  wallet,
  transactions,
  unreadNotifsCount,
  rates,
  totalUsdtEquivalent,
  availableUsdtEquivalent,
  lockedUsdtEquivalent,
  onNavigate,
  onOpenQr,
  lang,
}) => {
  const [copiedAddr, setCopiedAddr] = useState(false);
  const t = translations[lang];

  const handleCopy = () => {
    navigator.clipboard.writeText(wallet.address);
    setCopiedAddr(true);
    setTimeout(() => setCopiedAddr(false), 2000);
  };

  const shortenedAddress = wallet.address
    ? `${wallet.address.substring(0, 6)}...${wallet.address.substring(wallet.address.length - 4)}`
    : '';

  // Asset icons and styling
  const assetDetails = [
    {
      code: 'BTC' as Currency,
      name: 'Bitcoin',
      color: 'from-amber-500 to-orange-500',
      bgColor: 'bg-amber-500/10',
      textColor: 'text-amber-400',
      symbol: '₿',
      rate: rates.BTC || 68500,
      balance: wallet.balances.BTC,
    },
    {
      code: 'ETH' as Currency,
      name: 'Ethereum',
      color: 'from-indigo-500 to-purple-500',
      bgColor: 'bg-indigo-500/10',
      textColor: 'text-indigo-400',
      symbol: 'Ξ',
      rate: rates.ETH || 3450,
      balance: wallet.balances.ETH,
    },
    {
      code: 'USDT' as Currency,
      name: 'Tether USD',
      color: 'from-emerald-500 to-teal-500',
      bgColor: 'bg-emerald-500/10',
      textColor: 'text-emerald-400',
      symbol: '₮',
      rate: rates.USDT || 1.0,
      balance: wallet.balances.USDT,
    },
  ];

  // Locked items count
  const lockedCount = transactions.filter(
    (t) => t.status === 'LOCKED' && t.recipientUserId === user.id
  ).length;

  return (
    <div className="flex-1 bg-[#0b0f17] flex flex-col p-4 pb-20 overflow-y-auto space-y-4">
      {/* Top Bar Header */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-400 p-0.5 shadow">
            <div className="w-full h-full bg-[#131b26] rounded-full flex items-center justify-center text-xs font-bold text-emerald-400">
              {user.name ? user.name.charAt(0) : 'U'}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-400 flex items-center gap-1">
              <span>{user.name}</span>
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            {/* Shortened 0x Address Button */}
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="font-mono-code text-[11px] text-gray-300 font-medium">
                {shortenedAddress}
              </span>
              <button
                onClick={handleCopy}
                className="text-gray-400 hover:text-emerald-400 p-0.5 transition"
                title={t.copyAddress}
              >
                {copiedAddr ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
          </div>
        </div>

        {/* QR Code and Notification Shortcut */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenQr}
            className="w-9 h-9 rounded-xl bg-[#141d2b] border border-gray-700/80 hover:bg-[#1c2738] text-gray-300 flex items-center justify-center transition"
            title="QR Code"
          >
            <QrCode className="w-4 h-4 text-emerald-400" />
          </button>
          <button
            onClick={() => onNavigate('notifications')}
            className="w-9 h-9 rounded-xl bg-[#141d2b] border border-gray-700/80 hover:bg-[#1c2738] text-gray-300 flex items-center justify-center relative transition"
            title={t.notifications}
          >
            <Bell className="w-4 h-4 text-gray-300" />
            {unreadNotifsCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 text-black text-[9px] font-bold rounded-full flex items-center justify-center">
                {unreadNotifsCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Main Portfolio Card */}
      <div className="rounded-3xl bg-gradient-to-br from-[#121c2c] via-[#0f1724] to-[#0c121d] border border-emerald-500/20 p-5 shadow-xl relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute top-0 end-0 w-36 h-36 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex items-center justify-between mb-1 text-xs text-gray-400">
          <span className="font-medium">{t.totalPortfolio}</span>
          <span className="text-[10px] text-emerald-400/90 font-mono-code flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            <span>USD SIMULATION</span>
          </span>
        </div>

        <div className="text-2xl font-bold font-mono-code text-white tracking-tight mb-4">
          ${totalUsdtEquivalent.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>

        {/* Available vs Locked Summary Row */}
        <div className="pt-3 border-t border-gray-800/80 grid grid-cols-2 gap-2 text-xs">
          <div>
            <div className="text-[10px] text-gray-400 mb-0.5">{t.available}</div>
            <div className="font-semibold text-emerald-400 font-mono-code flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              ${(availableUsdtEquivalent !== undefined ? availableUsdtEquivalent : wallet.balances.USDT.available).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
          <div>
            <div className="text-[10px] text-gray-400 mb-0.5 flex items-center gap-1">
              <span>{t.locked}</span>
              <Lock className="w-2.5 h-2.5 text-amber-400" />
            </div>
            <div className="font-semibold text-amber-400 font-mono-code flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
              ${(lockedUsdtEquivalent !== undefined ? lockedUsdtEquivalent : wallet.balances.USDT.locked).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions (4 Buttons as specified in section 9) */}
      <div className="grid grid-cols-4 gap-2">
        <button
          onClick={() => onNavigate('send')}
          className="flex flex-col items-center justify-center p-3 rounded-2xl bg-[#121a27] border border-gray-800 hover:border-emerald-500/40 hover:bg-[#162132] transition group shadow"
        >
          <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-1.5 group-hover:scale-105 transition">
            <Send className="w-5 h-5" />
          </div>
          <span className="text-xs font-semibold text-gray-200">{t.send}</span>
        </button>

        <button
          onClick={() => onNavigate('receive')}
          className="flex flex-col items-center justify-center p-3 rounded-2xl bg-[#121a27] border border-gray-800 hover:border-emerald-500/40 hover:bg-[#162132] transition group shadow"
        >
          <div className="w-11 h-11 rounded-2xl bg-teal-500/10 text-teal-400 flex items-center justify-center mb-1.5 group-hover:scale-105 transition">
            <Download className="w-5 h-5" />
          </div>
          <span className="text-xs font-semibold text-gray-200">{t.receive}</span>
        </button>

        <button
          onClick={() => onNavigate('activity')}
          className="flex flex-col items-center justify-center p-3 rounded-2xl bg-[#121a27] border border-gray-800 hover:border-emerald-500/40 hover:bg-[#162132] transition group shadow"
        >
          <div className="w-11 h-11 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-1.5 group-hover:scale-105 transition">
            <ArrowUpRight className="w-5 h-5" />
          </div>
          <span className="text-xs font-semibold text-gray-200">{t.activity}</span>
        </button>

        <button
          onClick={() => onNavigate('locked')}
          className="flex flex-col items-center justify-center p-3 rounded-2xl bg-[#121a27] border border-gray-800 hover:border-amber-500/40 hover:bg-[#162132] transition group shadow relative"
        >
          <div className="w-11 h-11 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-1.5 group-hover:scale-105 transition">
            <Clock className="w-5 h-5" />
          </div>
          {lockedCount > 0 && (
            <span className="absolute top-2 right-2 w-4 h-4 bg-amber-500 text-black text-[9px] font-bold rounded-full flex items-center justify-center">
              {lockedCount}
            </span>
          )}
          <span className="text-xs font-semibold text-gray-200">{t.lockedFunds}</span>
        </button>
      </div>

      {/* Asset List (BTC, ETH, USDT) */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <h3 className="text-sm font-bold text-gray-100 flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-emerald-400" />
            <span>{t.assets}</span>
          </h3>
          <button
            onClick={() => onNavigate('wallet')}
            className="text-[11px] text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-0.5"
          >
            <span>{t.viewAll}</span>
            <ChevronRight className="w-3.5 h-3.5 rtl:rotate-180" />
          </button>
        </div>

        <div className="space-y-2">
          {assetDetails.map((asset) => {
            const total = asset.balance.available + asset.balance.locked;
            const approxUsdt = total * asset.rate;

            return (
              <div
                key={asset.code}
                onClick={() => onNavigate('asset', { currency: asset.code })}
                className="bg-[#121926] hover:bg-[#172132] border border-gray-800/90 rounded-2xl p-3.5 flex items-center justify-between transition cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-2xl ${asset.bgColor} flex items-center justify-center text-base font-extrabold ${asset.textColor} shrink-0`}
                  >
                    {asset.symbol}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-gray-100">{asset.name}</div>
                    <div className="text-[11px] text-gray-400 font-mono-code flex items-center gap-1.5">
                      <span>{asset.code}</span>
                      <span>·</span>
                      <span className="text-emerald-400/90">${asset.rate.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right rtl:text-left">
                  <div className="text-xs font-bold text-white font-mono-code">
                    {total.toLocaleString('en-US', {
                      minimumFractionDigits: asset.code === 'USDT' ? 2 : 4,
                      maximumFractionDigits: 6,
                    })}{' '}
                    {asset.code}
                  </div>

                  <div className="text-[10px] text-gray-400 font-mono-code flex items-center gap-2 justify-end rtl:justify-start">
                    <span>${approxUsdt.toLocaleString('en-US', { maximumFractionDigits: 2 })}</span>
                    {asset.balance.locked > 0 && (
                      <span className="text-amber-400 flex items-center gap-0.5">
                        <Lock className="w-2.5 h-2.5" />
                        {asset.balance.locked}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Activity List */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-bold text-gray-100">{t.recentActivity}</h3>
          <button
            onClick={() => onNavigate('activity')}
            className="text-[11px] text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-0.5"
          >
            <span>{t.viewAll}</span>
            <ChevronRight className="w-3.5 h-3.5 rtl:rotate-180" />
          </button>
        </div>

        {transactions.length === 0 ? (
          <div className="bg-[#121926]/50 border border-gray-800/80 rounded-2xl p-6 text-center text-xs text-gray-400">
            {t.noTransactions}
          </div>
        ) : (
          <div className="space-y-2">
            {transactions.slice(0, 4).map((tx) => {
              const isSender = tx.senderUserId === user.id;
              const isLocked = tx.status === 'LOCKED';

              return (
                <div
                  key={tx.id}
                  onClick={() => onNavigate('tx-detail', { txId: tx.id })}
                  className="bg-[#121926] hover:bg-[#172132] border border-gray-800/80 rounded-xl p-3 flex items-center justify-between transition cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                        isLocked
                          ? 'bg-amber-500/10 text-amber-400'
                          : isSender
                          ? 'bg-rose-500/10 text-rose-400'
                          : 'bg-emerald-500/10 text-emerald-400'
                      }`}
                    >
                      {isLocked ? (
                        <Clock className="w-4 h-4" />
                      ) : isSender ? (
                        <ArrowUpRight className="w-4 h-4" />
                      ) : (
                        <ArrowDownLeft className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-gray-200">
                        {isLocked
                          ? lang === 'ar'
                            ? 'تحويل مقفل مؤقتاً'
                            : 'Time-Locked Transfer'
                          : isSender
                          ? `${lang === 'ar' ? 'إرسال إلى' : 'Sent to'} ${tx.recipientName || 'مستلم'}`
                          : `${lang === 'ar' ? 'استلام من' : 'Received from'} ${tx.senderName || 'مرسل'}`}
                      </div>
                      <div className="text-[10px] text-gray-400 font-mono-code">
                        {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>

                  <div className="text-right rtl:text-left">
                    <div
                      className={`text-xs font-bold font-mono-code ${
                        isLocked
                          ? 'text-amber-400'
                          : isSender
                          ? 'text-rose-400'
                          : 'text-emerald-400'
                      }`}
                    >
                      {isSender ? '-' : '+'}
                      {tx.amount} {tx.currency}
                    </div>
                    <div className="text-[10px] text-gray-400">
                      {isLocked ? t.statusLocked : t.statusCompleted}
                    </div>
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
