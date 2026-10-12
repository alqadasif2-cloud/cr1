import React, { useState } from 'react';
import { AlertCircle, X, ShieldAlert } from 'lucide-react';
import { translations, Language } from '../i18n/translations';

interface DisclaimerBannerProps {
  lang: Language;
}

export const DisclaimerBanner: React.FC<DisclaimerBannerProps> = ({ lang }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const t = translations[lang];

  if (dismissed) return null;

  return (
    <>
      <div className="bg-emerald-950/40 border border-emerald-500/20 text-emerald-200/90 px-3 py-1.5 text-[11px] flex items-center justify-between gap-2 transition">
        <div className="flex items-center gap-1.5 overflow-hidden">
          <AlertCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span className="truncate">{t.simulationNotice}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setIsOpen(true)}
            className="text-emerald-400 underline hover:text-emerald-300 font-medium"
          >
            {lang === 'ar' ? 'تفاصيل الإفصاح' : 'Details'}
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="text-gray-400 hover:text-gray-200 p-0.5"
            aria-label="إغلاق التنبيه"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121926] border border-gray-700/80 rounded-2xl max-w-md w-full p-5 shadow-2xl">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-emerald-400">
                <ShieldAlert className="w-5 h-5" />
                <h3 className="font-bold text-base text-gray-100">
                  {lang === 'ar' ? 'إفصاح نظام المحاكاة والأمان' : 'Simulation & Security Disclosure'}
                </h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-200 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="text-xs text-gray-300 space-y-2.5 leading-relaxed">
              <p>
                {lang === 'ar'
                  ? '• هذا التطبيق هو نظام محاكاة برمجي كامل مصمم لمحاكاة تجربة محافظ العملات المشفرة، وإدارة حسابات المستخدمين، ونظام قفل الأرصدة المؤقت.'
                  : '• This application is an educational simulation system demonstrating crypto wallet UX, unique 0x address management, and time-locked balance scheduling.'}
              </p>
              <p>
                {lang === 'ar'
                  ? '• جميع الأرصدة (BTC، ETH، USDT) والعناوين التي تبدأ بـ 0x والتحويلات هي قيود افتراضية داخل قاعدة بيانات الخادم، ولا ترتبط بشبكات بلوكشين حقيقية ولا تمثل أي أموال أو مطالبات مالية فعلية.'
                  : '• All assets (BTC, ETH, USDT), 0x addresses, and transfers exist strictly within the simulated backend ledger and represent zero financial value.'}
              </p>
              <p>
                {lang === 'ar'
                  ? '• العمليات البرمجية كخصم الأرصدة، وقفل المبالغ، والتحقق من انتهاء المدة الزمنية تُدار من خلال منطق الخادم الحقيقي والعمليات الذرية.'
                  : '• Core functions like atomic deductions, server-authoritative time-locks, and release triggers execute live on the backend server.'}
              </p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="mt-4 w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-medium text-xs transition"
            >
              {lang === 'ar' ? 'فهمت ذلك' : 'I Understand'}
            </button>
          </div>
        </div>
      )}
    </>
  );
};
