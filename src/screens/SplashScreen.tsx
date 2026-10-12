import React, { useEffect } from 'react';
import { Shield, Sparkles } from 'lucide-react';
import { Language } from '../i18n/translations';

interface SplashScreenProps {
  onFinish: () => void;
  lang: Language;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish, lang }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onFinish();
    }, 1800);
    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <div className="flex-1 bg-[#0b0f17] flex flex-col items-center justify-center p-6 text-center select-none">
      {/* Brand Icon */}
      <div className="relative mb-6">
        <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-emerald-400 p-0.5 shadow-[0_0_50px_rgba(16,185,129,0.35)] flex items-center justify-center">
          <div className="w-full h-full bg-[#0d131f] rounded-[22px] flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/10 to-transparent"></div>
            <Shield className="w-12 h-12 text-emerald-400 drop-shadow-[0_0_12px_rgba(52,211,153,0.6)]" />
          </div>
        </div>
        <div className="absolute -top-1 -right-1">
          <Sparkles className="w-5 h-5 text-emerald-300 animate-spin" style={{ animationDuration: '6s' }} />
        </div>
      </div>

      {/* App Title */}
      <h1 className="text-2xl font-extrabold tracking-tight text-white mb-1.5 flex items-center gap-1.5 justify-center">
        <span>Crypto Wallet</span>
      </h1>
      <p className="text-xs text-gray-400 max-w-[240px] leading-relaxed mb-8">
        {lang === 'ar'
          ? 'محفظة العملات الرقمية لنظام أندرويد • آمنة ومتقدمة'
          : 'Advanced Android Crypto Wallet Experience'}
      </p>

      {/* Loading Indicator */}
      <div className="flex flex-col items-center gap-3">
        <div className="w-6 h-6 border-2 border-emerald-500/20 border-t-emerald-400 rounded-full animate-spin"></div>
        <span className="text-[11px] text-gray-400 tracking-wider font-medium">
          {lang === 'ar' ? 'جاري تهيئة المحفظة المشفرة...' : 'Initializing Secure Wallet...'}
        </span>
      </div>

      <div className="absolute bottom-8 text-[10px] text-gray-400">
        Android Jetpack Compose & Material 3
      </div>
    </div>
  );
};
