import React, { useState } from 'react';
import { Shield, Lock, User as UserIcon, ArrowRight, ArrowLeft, AlertCircle, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';
import { translations, Language } from '../i18n/translations';
import { User, UserWallet } from '../types';

interface RegisterScreenProps {
  onSuccess: (user: User, wallet: UserWallet) => void;
  onGoToLogin: () => void;
  lang: Language;
}

export const RegisterScreen: React.FC<RegisterScreenProps> = ({
  onSuccess,
  onGoToLogin,
  lang,
}) => {
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const t = translations[lang];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password || !confirmPassword) {
      setError(t.fillAllFields);
      return;
    }

    if (password !== confirmPassword) {
      setError(t.passwordMismatch);
      return;
    }

    if (password.length < 6) {
      setError(lang === 'ar' ? 'يجب ألا تقل كلمة المرور عن 6 أحرف' : 'Password must be at least 6 characters');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const data = await api.register(username.trim(), name.trim(), password);
      onSuccess(data.user, data.wallet);
    } catch (err: any) {
      setError(err.message || 'فشل في إنشاء الحساب');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 bg-[#0b0f17] p-6 flex flex-col justify-between overflow-y-auto">
      <div className="pt-2">
        {/* Header Icon */}
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-500 p-0.5 mb-4 mx-auto shadow-lg flex items-center justify-center">
          <div className="w-full h-full bg-[#0d131f] rounded-[14px] flex items-center justify-center">
            <Shield className="w-7 h-7 text-emerald-400" />
          </div>
        </div>

        <h2 className="text-xl font-bold text-center text-white mb-1">{t.createWalletTitle}</h2>
        <p className="text-xs text-center text-gray-400 mb-5">
          {t.createWalletDesc}
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-950/40 border border-red-500/30 rounded-xl text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">{t.fullName}</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={lang === 'ar' ? 'الاسم المستعار أو الحقيقي' : 'Full name or alias'}
              className="w-full bg-[#131b26] border border-gray-700/80 rounded-xl py-2 px-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">{t.username} *</label>
            <div className="relative">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. crypto_trader"
                className="w-full bg-[#131b26] border border-gray-700/80 rounded-xl py-2 px-3 ps-10 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
              />
              <UserIcon className="w-4 h-4 text-gray-400 absolute start-3 top-2.5" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">{t.password} *</label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#131b26] border border-gray-700/80 rounded-xl py-2 px-3 ps-10 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
              />
              <Lock className="w-4 h-4 text-gray-400 absolute start-3 top-2.5" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">{t.confirmPassword} *</label>
            <div className="relative">
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#131b26] border border-gray-700/80 rounded-xl py-2 px-3 ps-10 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
              />
              <Lock className="w-4 h-4 text-gray-400 absolute start-3 top-2.5" />
            </div>
          </div>

          {/* Features info list */}
          <div className="bg-[#101724] p-3 rounded-xl border border-gray-800 text-[11px] text-gray-400 space-y-1 mt-3">
            <div className="flex items-center gap-1.5 text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>{lang === 'ar' ? 'توليد عنوان محفظة فريد يبدأ بـ 0x تلقائياً' : 'Auto-generated unique 0x address'}</span>
            </div>
            <div className="flex items-center gap-1.5 text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>{lang === 'ar' ? 'رابط استلام مخصص ومشاركة فورية' : 'Personal receive link & QR code'}</span>
            </div>
            <div className="flex items-center gap-1.5 text-gray-300">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
              <span>{lang === 'ar' ? 'يبدأ الحساب الجديد برصيد 0.00 USD وفق السياسة القياسية' : 'New account starts with 0.00 USD initial balance'}</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold rounded-xl text-xs transition shadow-lg shadow-emerald-900/30 flex items-center justify-center gap-2 mt-4"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
            ) : (
              <>
                <span>{t.register}</span>
                {lang === 'ar' ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
              </>
            )}
          </button>
        </form>
      </div>

      <div className="pt-4 pb-2 text-center">
        <button
          onClick={onGoToLogin}
          className="text-xs text-gray-400 hover:text-emerald-400 transition"
        >
          {t.registerPrompt}
        </button>
      </div>
    </div>
  );
};
