import React, { useState, useEffect } from 'react';
import { Smartphone, Monitor, Wifi, BatteryCharging, Signal } from 'lucide-react';

interface AndroidFrameProps {
  children: React.ReactNode;
  isFrameMode: boolean;
  onToggleFrameMode: () => void;
  lang: 'ar' | 'en';
}

export const AndroidFrame: React.FC<AndroidFrameProps> = ({
  children,
  isFrameMode,
  onToggleFrameMode,
  lang,
}) => {
  const [time, setTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString(lang === 'ar' ? 'ar-SA' : 'en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, [lang]);

  if (!isFrameMode) {
    return (
      <div className="min-h-screen bg-[#070a0f] text-gray-100 flex flex-col">
        {/* Floating Top Control Toolbar */}
        <div className="bg-[#0f172a]/80 backdrop-blur border-b border-gray-800/80 px-4 py-2 flex items-center justify-between text-xs text-gray-400 sticky top-0 z-50">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-semibold text-emerald-400">Crypto Wallet Android Sandbox</span>
            <span className="text-gray-600">|</span>
            <span>{lang === 'ar' ? 'عرض ملء الشاشة' : 'Full Screen View'}</span>
          </div>
          <button
            onClick={onToggleFrameMode}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs transition"
          >
            <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
            <span>{lang === 'ar' ? 'عرض في إطار هاتف أندرويد' : 'Switch to Android Phone View'}</span>
          </button>
        </div>
        <div className="flex-1 w-full max-w-xl mx-auto px-2 sm:px-4 py-2 sm:py-4">
          {children}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070a0f] text-gray-100 flex flex-col items-center justify-center p-2 sm:p-6">
      {/* Top Controls */}
      <div className="w-full max-w-[420px] mb-3 flex items-center justify-between px-2 text-xs text-gray-400">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span className="text-gray-300 font-medium">Google Pixel / Galaxy Android View</span>
        </div>
        <button
          onClick={onToggleFrameMode}
          className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs transition"
          title="تبديل إلى العرض الكامل"
        >
          <Monitor className="w-3.5 h-3.5 text-emerald-400" />
          <span>{lang === 'ar' ? 'عرض كامل' : 'Desktop View'}</span>
        </button>
      </div>

      {/* Android Device Mockup Frame */}
      <div className="w-full max-w-[412px] h-[860px] max-h-[94vh] bg-[#0b0f17] rounded-[44px] border-[6px] border-[#222f3e] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8),0_0_40px_rgba(16,185,129,0.15)] flex flex-col overflow-hidden relative">
        {/* Device Speaker / Punch Hole Camera */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 pointer-events-none">
          <div className="w-3.5 h-3.5 rounded-full bg-[#000000] border border-gray-800 shadow-inner"></div>
        </div>

        {/* Android Status Bar */}
        <div className="h-9 bg-[#0b0f17] px-6 flex items-center justify-between text-[11px] font-medium text-gray-400 z-40 select-none pt-1">
          <span className="font-mono">{time || '09:41'}</span>
          <div className="flex items-center gap-1.5 text-gray-400">
            <Signal className="w-3 h-3 text-emerald-400" />
            <Wifi className="w-3 h-3 text-emerald-400" />
            <div className="flex items-center text-[10px] text-gray-300">
              <span className="mr-0.5">98%</span>
              <BatteryCharging className="w-3.5 h-3.5 text-emerald-400" />
            </div>
          </div>
        </div>

        {/* Screen Viewport with smooth scroll */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden relative flex flex-col">
          {children}
        </div>

        {/* Android Gesture Bar */}
        <div className="h-4 bg-[#0b0f17] flex items-center justify-center pointer-events-none select-none pb-1">
          <div className="w-32 h-1 rounded-full bg-gray-600/70"></div>
        </div>
      </div>
    </div>
  );
};
