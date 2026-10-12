import React from 'react';
import { Home, Wallet as WalletIcon, Clock, Settings, Bell } from 'lucide-react';
import { translations, Language } from '../i18n/translations';

export type NavTab = 'home' | 'wallet' | 'activity' | 'locked' | 'settings' | 'notifications';

interface BottomNavProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  unreadNotifsCount: number;
  lockedCount: number;
  lang: Language;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  onSelectTab,
  unreadNotifsCount,
  lockedCount,
  lang,
}) => {
  const t = translations[lang];

  const items = [
    { id: 'home' as NavTab, label: t.navHome, icon: Home },
    { id: 'wallet' as NavTab, label: t.navWallet, icon: WalletIcon },
    {
      id: 'locked' as NavTab,
      label: t.lockedFunds,
      icon: Clock,
      badge: lockedCount > 0 ? lockedCount : undefined,
      badgeColor: 'bg-amber-500',
    },
    { id: 'activity' as NavTab, label: t.navActivity, icon: Bell, badge: unreadNotifsCount > 0 ? unreadNotifsCount : undefined, badgeColor: 'bg-emerald-500' },
    { id: 'settings' as NavTab, label: t.navSettings, icon: Settings },
  ];

  return (
    <div className="bg-[#0e141f] border-t border-gray-800/80 px-2 py-1.5 flex items-center justify-around shrink-0 select-none">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = currentTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onSelectTab(item.id)}
            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition relative ${
              isActive
                ? 'text-emerald-400 font-semibold'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <div className="relative">
              <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110' : ''}`} />
              {item.badge !== undefined && item.badge > 0 && (
                <span className={`absolute -top-1.5 -right-2 text-[9px] font-bold text-black ${item.badgeColor} rounded-full min-w-3.5 h-3.5 px-1 flex items-center justify-center shadow`}>
                  {item.badge}
                </span>
              )}
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
};
