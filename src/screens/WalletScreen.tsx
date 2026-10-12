import React, { useState } from 'react';
import {
  Wallet as WalletIcon,
  Copy,
  Check,
  QrCode,
  ShieldCheck,
  TrendingUp,
  Lock,
  ArrowUpRight,
  ArrowDownLeft,
  ChevronRight,
} from 'lucide-react';
import { translations, Language } from '../i18n/translations';
import { User, UserWallet, Currency } from '../types';

interface WalletScreenProps {
  user: User;
  wallet: UserWallet;
  rates: Record<string, number>;
  totalUsdtEquivalent: number;
  onNavigate: (screen: string, params?: any) => void;
  onOpenQr: () => void;
  lang: Language;
}

export const WalletScreen: React.FC<WalletScreenProps> = ({
  user,
  wallet,
  rates,
  totalUsdtEquivalent,
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

  const assets: Array<{
    code: Currency;
    name: string;
    symbol: string;
    color: string;
    rate: number;
  }> = [
    { code: 'BTC', name: 'Bitcoin', symbol: '₿', color: 'text-amber-400', rate: rates.BTC || 68500 },
    { code: 'ETH', name: 'Ethereum', symbol: 'Ξ', color: 'text-indigo-400', rate: rates.ETH || 3450 },
    { code: 'USDT', name: 'Tether USD', symbol: '₮', color: 'text-emerald-400', rate: rates.USDT || 1.0 },
  ];

  return (
    <div className="flex-1 bg-[#0b0f17] flex flex-col p-4 pb-20 overflow-y-auto space-y-4">
      {/* Top Title */}
      <div className="flex items-center justify-between pt-1">
        <h2 className="text-base font-bold text-gray-100 flex items-center gap-2">
          <WalletIcon className="w-5 h-5 text-emerald-400" />
          <span>{t.navWallet}</span>
        </h2>
        <button
          onClick={onOpenQr}
          className="p-2 rounded-xl bg-[#141d2b] border border-gray-700 hover:bg-[#1a2536] text-emerald-400 transition"
        >
          <QrCode className="w-4 h-4" />
        </button>
      </div>

      {/* Wallet Card with Full Address */}
      <div className="bg-[#121926] border border-gray-800 rounded-3xl p-5 shadow-xl">
        <div className="flex items-center justify-between mb-3 text-xs text-gray-400">
          <span className="font-semibold text-gray-300">{user.name}</span>
          <span className="flex items-center gap-1 text-emerald-400 text-[10px]">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>0x Standard Protected</span>
          </span>
        </div>

        <div className="text-[10px] text-gray-400 mb-1">{lang === 'ar' ? 'عنوان المحفظة الفريد' : 'Wallet Address (0x)'}</div>
        <div className="bg-[#0b0f17] p-3 rounded-2xl border border-gray-800 flex items-center justify-between mb-4">
          <span className="font-mono-code text-[11px] text-gray-200 truncate pr-2 select-all">
            {wallet.address}
          </span>
          <button
            onClick={handleCopy}
            className="text-emerald-400 hover:text-emerald-300 shrink-0 text-xs font-semibold flex items-center gap-1"
          >
            {copiedAddr ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedAddr ? t.addressCopied : t.copyAddress}</span>
          </button>
        </div>

        {/* Total equivalent */}
        <div className="pt-3 border-t border-gray-800 flex items-center justify-between text-xs">
          <span className="text-gray-400">{t.totalPortfolio}</span>
          <span className="font-mono-code font-bold text-emerald-400 text-sm">
            ${totalUsdtEquivalent.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      {/* Asset Breakdown Cards */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-gray-300">{t.assets}</h3>

        {assets.map((asset) => {
          const bal = wallet.balances[asset.code];
          const totalCoin = bal.available + bal.locked;
          const totalValUsdt = totalCoin * asset.rate;

          return (
            <div
              key={asset.code}
              onClick={() => onNavigate('asset', { currency: asset.code })}
              className="bg-[#121926] hover:bg-[#162132] border border-gray-800 rounded-2xl p-4 transition cursor-pointer"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#0b0f17] border border-gray-800 flex items-center justify-center text-lg font-bold shrink-0">
                    <span className={asset.color}>{asset.symbol}</span>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">{asset.name}</div>
                    <div className="text-[11px] text-gray-400 font-mono-code">
                      1 {asset.code} ≈ ${asset.rate.toLocaleString()}
                    </div>
                  </div>
                </div>

                <div className="text-right rtl:text-left">
                  <div className="text-sm font-bold font-mono-code text-white">
                    {totalCoin.toLocaleString('en-US', { maximumFractionDigits: 6 })} {asset.code}
                  </div>
                  <div className="text-[10px] text-gray-400 font-mono-code">
                    ≈ ${totalValUsdt.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                  </div>
                </div>
              </div>

              {/* Sub-bar showing available vs locked */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-800/80 text-[11px]">
                <div className="bg-[#0b0f17] p-2 rounded-xl">
                  <span className="text-[10px] text-gray-400 block">{t.available}</span>
                  <span className="font-mono-code font-bold text-emerald-400">
                    {bal.available} {asset.code}
                  </span>
                </div>
                <div className="bg-[#0b0f17] p-2 rounded-xl">
                  <span className="text-[10px] text-gray-400 block flex items-center gap-1">
                    <span>{t.locked}</span>
                    <Lock className="w-2.5 h-2.5 text-amber-400" />
                  </span>
                  <span className="font-mono-code font-bold text-amber-400">
                    {bal.locked} {asset.code}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
