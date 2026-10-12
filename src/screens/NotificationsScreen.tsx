import React, { useState, useEffect } from 'react';
import {
  Bell,
  ArrowLeft,
  ArrowRight,
  CheckCheck,
  Lock,
  Unlock,
  ArrowDownLeft,
  ArrowUpRight,
  ShieldAlert,
} from 'lucide-react';
import { translations, Language } from '../i18n/translations';
import { NotificationItem } from '../types';
import { api } from '../services/api';

interface NotificationsScreenProps {
  onBack: () => void;
  onSelectTx?: (txId: string) => void;
  lang: Language;
}

export const NotificationsScreen: React.FC<NotificationsScreenProps> = ({
  onBack,
  onSelectTx,
  lang,
}) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  const t = translations[lang];

  const loadNotifs = async () => {
    try {
      const data = await api.getNotifications();
      setNotifications(data.notifications);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifs();
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const handleClickItem = async (notif: NotificationItem) => {
    if (!notif.read) {
      api.markNotificationRead(notif.id).catch(console.error);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n))
      );
    }
    if (notif.relatedTxId && onSelectTx) {
      onSelectTx(notif.relatedTxId);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'RECEIVED':
        return <ArrowDownLeft className="w-4 h-4 text-emerald-400" />;
      case 'SENT':
        return <ArrowUpRight className="w-4 h-4 text-rose-400" />;
      case 'UNLOCKED':
        return <Unlock className="w-4 h-4 text-teal-400" />;
      default:
        return <Bell className="w-4 h-4 text-indigo-400" />;
    }
  };

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
          <Bell className="w-4 h-4 text-emerald-400" />
          <span>{t.notifications}</span>
        </h2>
        <button
          onClick={handleMarkAllRead}
          className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1"
          title="تحديد الكل كمقروء"
        >
          <CheckCheck className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{lang === 'ar' ? 'قراءة الكل' : 'Mark all'}</span>
        </button>
      </div>

      {loading ? (
        <div className="text-center py-10 text-xs text-gray-400">جاري تحميل الإشعارات...</div>
      ) : notifications.length === 0 ? (
        <div className="bg-[#121926]/50 border border-gray-800 rounded-2xl p-8 text-center text-xs text-gray-400">
          {lang === 'ar' ? 'لا توجد إشعارات حالياً' : 'No notifications yet'}
        </div>
      ) : (
        <div className="space-y-2.5">
          {notifications.map((notif) => {
            const title = lang === 'ar' ? notif.titleAr : notif.title;
            const message = lang === 'ar' ? notif.messageAr : notif.message;

            return (
              <div
                key={notif.id}
                onClick={() => handleClickItem(notif)}
                className={`p-3.5 rounded-2xl border transition cursor-pointer flex items-start gap-3 ${
                  notif.read
                    ? 'bg-[#121926] border-gray-800/80 text-gray-400'
                    : 'bg-[#142030] border-emerald-500/30 text-gray-200 shadow-md'
                }`}
              >
                <div className="w-8 h-8 rounded-xl bg-[#0b0f17] border border-gray-800 flex items-center justify-center shrink-0 mt-0.5">
                  {getIcon(notif.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-gray-100 truncate pr-2">
                      {title}
                    </span>
                    <span className="text-[10px] text-gray-400 font-mono-code shrink-0">
                      {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-gray-300 mb-1">{message}</p>
                  <div className="text-[10px] text-gray-400 font-mono-code">
                    {new Date(notif.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  </div>
                </div>

                {!notif.read && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0 mt-1"></span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
