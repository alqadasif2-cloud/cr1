import React from 'react';
import {
  Globe,
  Smartphone,
  ShieldAlert,
  Sliders,
  Code2,
  LogOut,
  ChevronRight,
  User as UserIcon,
  Crown,
  Key,
  Users,
} from 'lucide-react';
import { translations, Language } from '../i18n/translations';
import { User, UserWallet } from '../types';

interface SettingsScreenProps {
  user: User;
  wallet: UserWallet;
  lang: Language;
  onToggleLang: () => void;
  isFrameMode: boolean;
  onToggleFrameMode: () => void;
  onNavigate: (screen: string) => void;
  onLogout: () => void;
  onSwitchUser: (username: string) => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  user,
  wallet,
  lang,
  onToggleLang,
  isFrameMode,
  onToggleFrameMode,
  onNavigate,
  onLogout,
  onSwitchUser,
}) => {
  const t = translations[lang];
  const isOwner = user.role === 'owner';

  return (
    <div className="flex-1 bg-[#0b0f17] flex flex-col p-4 pb-20 overflow-y-auto space-y-4">
      <div className="pt-1">
        <h2 className="text-base font-bold text-gray-100 mb-1">{t.settingsTitle}</h2>
        <p className="text-xs text-gray-400">
          {lang === 'ar' ? 'تخصيص التطبيق، تفضيلات الأمان، وأدوات النظام' : 'App preferences, security, and developer tools'}
        </p>
      </div>

      {/* User profile brief card */}
      <div
        onClick={() => onNavigate('profile')}
        className="bg-[#121926] hover:bg-[#162132] border border-gray-800 rounded-2xl p-4 flex items-center justify-between transition cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-12 h-12 rounded-2xl p-0.5 ${
              isOwner
                ? 'bg-gradient-to-tr from-amber-500 to-yellow-400'
                : 'bg-gradient-to-tr from-emerald-600 to-teal-400'
            }`}
          >
            <div className="w-full h-full bg-[#0d131f] rounded-[14px] flex items-center justify-center font-bold text-sm">
              {isOwner ? (
                <Crown className="w-5 h-5 text-amber-400" />
              ) : (
                <span className="text-emerald-400">{user.name.charAt(0)}</span>
              )}
            </div>
          </div>
          <div>
            <div className="text-xs font-bold text-white flex items-center gap-1.5">
              <span>{user.name}</span>
              {isOwner && (
                <span className="text-[10px] text-amber-400 font-bold bg-amber-500/10 px-1.5 py-0.2 rounded border border-amber-500/30">
                  Owner
                </span>
              )}
            </div>
            <div className="text-[11px] text-gray-400 font-mono-code">@{user.username}</div>
            <div className="text-[10px] text-emerald-400 mt-0.5">
              {wallet.address.substring(0, 8)}...{wallet.address.substring(wallet.address.length - 4)}
            </div>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-gray-400 rtl:rotate-180" />
      </div>

      {/* Fast User Switcher between Sam (Owner) & Eslam (User) for Testing */}
      <div className="bg-[#121926] border border-amber-500/20 rounded-2xl p-4">
        <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400 mb-1">
          <Users className="w-4 h-4" />
          <span>{lang === 'ar' ? 'تبديل الحساب للاختبار السريع:' : 'Switch Account for Testing:'}</span>
        </div>
        <p className="text-[11px] text-gray-400 mb-3">
          {lang === 'ar'
            ? 'يمكنك التبديل فورياً بين حساب المالك Sam وحساب المستخدم المستقل Eslam Alqadasi لاختبار التحويلات وصلاحيات الإدارة.'
            : 'Instantly toggle between Owner Sam and User Eslam to test permissions and transfers.'}
        </p>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <button
            onClick={() => onSwitchUser('sam')}
            className={`p-2.5 rounded-xl border text-left rtl:text-right transition ${
              user.username.toLowerCase() === 'sam'
                ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
                : 'bg-[#141f2e] border-gray-800 text-gray-300 hover:border-gray-700'
            }`}
          >
            <div className="font-semibold text-xs flex items-center gap-1">
              <Crown className="w-3.5 h-3.5 text-amber-400" />
              <span>Sam (المالك)</span>
            </div>
            <div className="text-[10px] text-gray-400 font-mono">1,000 USD</div>
          </button>
          <button
            onClick={() => onSwitchUser('eslam alqadasi')}
            className={`p-2.5 rounded-xl border text-left rtl:text-right transition ${
              user.username.toLowerCase().includes('eslam')
                ? 'bg-blue-500/20 border-blue-500 text-blue-300 font-bold'
                : 'bg-[#141f2e] border-gray-800 text-gray-300 hover:border-gray-700'
            }`}
          >
            <div className="font-semibold text-xs flex items-center gap-1">
              <UserIcon className="w-3.5 h-3.5 text-blue-400" />
              <span>Eslam (مستخدم)</span>
            </div>
            <div className="text-[10px] text-gray-400 font-mono">0.00 USD</div>
          </button>
        </div>
      </div>

      {/* Owner Admin Panel Entry */}
      {isOwner && (
        <div className="bg-[#121926] border border-amber-500/30 rounded-2xl overflow-hidden text-xs">
          <div
            onClick={() => onNavigate('admin')}
            className="p-3.5 flex items-center justify-between hover:bg-[#182333] transition cursor-pointer"
          >
            <div className="flex items-center gap-2.5 text-amber-400 font-bold">
              <Crown className="w-4 h-4" />
              <span>{lang === 'ar' ? 'لوحة تحكم مالك النظام (Admin Dashboard)' : 'Owner Admin Dashboard'}</span>
            </div>
            <ChevronRight className="w-4 h-4 text-amber-400 rtl:rotate-180" />
          </div>
        </div>
      )}

      {/* Preferences Group */}
      <div className="bg-[#121926] border border-gray-800 rounded-2xl divide-y divide-gray-800 text-xs">
        {/* Language */}
        <div className="p-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-gray-200">
            <Globe className="w-4 h-4 text-emerald-400" />
            <span>{t.language}</span>
          </div>
          <button
            onClick={onToggleLang}
            className="px-2.5 py-1 rounded-lg bg-[#182333] border border-gray-700 text-gray-200 hover:text-white font-medium text-[11px] transition"
          >
            {lang === 'ar' ? 'English (LTR)' : 'العربية (RTL)'}
          </button>
        </div>

        {/* View Mode Toggle */}
        <div className="p-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-gray-200">
            <Smartphone className="w-4 h-4 text-emerald-400" />
            <span>{t.appearance}</span>
          </div>
          <button
            onClick={onToggleFrameMode}
            className="px-2.5 py-1 rounded-lg bg-[#182333] border border-gray-700 text-gray-200 hover:text-white font-medium text-[11px] transition"
          >
            {isFrameMode ? t.desktopMode : t.androidFrame}
          </button>
        </div>

        {/* Android Native Source Inspector */}
        <div
          onClick={() => onNavigate('android-export')}
          className="p-3.5 flex items-center justify-between hover:bg-[#162132] transition cursor-pointer"
        >
          <div className="flex items-center gap-2.5 text-emerald-400 font-semibold">
            <Code2 className="w-4 h-4" />
            <span>{t.androidCodeHub}</span>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-400 rtl:rotate-180" />
        </div>
      </div>

      {/* Logout button */}
      <button
        onClick={onLogout}
        className="w-full py-3 bg-red-950/40 hover:bg-red-900/50 border border-red-500/30 text-red-300 font-semibold rounded-2xl text-xs flex items-center justify-center gap-2 transition"
      >
        <LogOut className="w-4 h-4" />
        <span>{t.logout}</span>
      </button>

      {/* Version footer */}
      <div className="text-center text-[10px] text-gray-400 pt-2 font-mono-code">
        <div>Crypto Wallet Simulator • Version 1.2.0</div>
        <div>Virtual Assets Only • Multi-Account • TimeLock Engine</div>
      </div>
    </div>
  );
};
