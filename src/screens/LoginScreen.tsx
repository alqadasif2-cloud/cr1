import React, { useState } from 'react';
import { Shield, Lock, User as UserIcon, ArrowRight, ArrowLeft, AlertCircle } from 'lucide-react';
import { api } from '../services/api';
import { translations, Language } from '../i18n/translations';
import { User, UserWallet } from '../types';

interface LoginScreenProps {
  onSuccess: (user: User, wallet: UserWallet) => void;
  onGoToRegister: () => void;
  lang: Language;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onSuccess,
  onGoToRegister,
  lang,
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const t = translations[lang];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError(lang === 'ar' ? 'يرجى إدخال اسم المستخدم وكلمة المرور' : 'Please enter username and password');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const data = await api.login(username.trim(), password);
      onSuccess(data.user, data.wallet);
    } catch (err: any) {
      // Generic secure error message to avoid user enumeration
      setError(lang === 'ar' ? 'اسم المستخدم أو كلمة المرور غير صحيحة' : 'Invalid username or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 bg-[#0b0f17] p-6 flex flex-col justify-between overflow-y-auto">
      <div className="pt-4 max-w-sm mx-auto w-full">
        {/* Brand Icon */}
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-400 p-0.5 mb-5 mx-auto shadow-lg shadow-emerald-950/40 flex items-center justify-center">
          <div className="w-full h-full bg-[#0d131f] rounded-[14px] flex items-center justify-center">
            <Shield className="w-8 h-8 text-emerald-400" />
          </div>
        </div>

        <h2 className="text-xl font-extrabold text-center text-white mb-1 tracking-tight">Crypto Wallet</h2>
        <p className="text-xs text-center text-gray-400 mb-6">
          {lang === 'ar' ? 'تسجيل الدخول الآمن إلى محفظتك الرقمية' : 'Secure Sign-In to your digital wallet'}
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-950/40 border border-red-500/30 rounded-xl text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">{t.username}</label>
            <div className="relative">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={lang === 'ar' ? 'أدخل اسم المستخدم' : 'Enter username'}
                autoComplete="off"
                className="w-full bg-[#131b26] border border-gray-700/80 rounded-xl py-3 px-3 ps-10 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition"
              />
              <UserIcon className="w-4 h-4 text-gray-400 absolute start-3 top-3.5" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">{t.password}</label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                className="w-full bg-[#131b26] border border-gray-700/80 rounded-xl py-3 px-3 ps-10 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition"
              />
              <Lock className="w-4 h-4 text-gray-400 absolute start-3 top-3.5" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition shadow-lg shadow-emerald-900/30 flex items-center justify-center gap-2 mt-2"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
            ) : (
              <>
                <span>{t.login}</span>
                {lang === 'ar' ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
              </>
            )}
          </button>
        </form>
      </div>

      <div className="pt-6 pb-2 text-center">
        <button
          onClick={onGoToRegister}
          className="text-xs text-gray-400 hover:text-emerald-400 transition font-medium"
        >
          {t.loginPrompt}
        </button>
      </div>
    </div>
  );
};
