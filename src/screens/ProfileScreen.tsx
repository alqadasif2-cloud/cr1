import React, { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  User as UserIcon,
  ShieldCheck,
  Key,
  Copy,
  Check,
  Crown,
  Lock,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { translations, Language } from '../i18n/translations';
import { User, UserWallet } from '../types';
import { api } from '../services/api';

interface ProfileScreenProps {
  user: User;
  wallet: UserWallet;
  onBack: () => void;
  lang: Language;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  user,
  wallet,
  onBack,
  lang,
}) => {
  const [copied, setCopied] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwSuccess, setPwSuccess] = useState<string | null>(null);
  const [pwLoading, setPwLoading] = useState(false);

  const t = translations[lang];

  const handleCopy = () => {
    navigator.clipboard.writeText(wallet.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError(null);
    setPwSuccess(null);

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPwError(lang === 'ar' ? 'يرجى ملء جميع حقول كلمة المرور' : 'Fill all password fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPwError(lang === 'ar' ? 'كلمة المرور الجديدة غير متطابقة' : 'New passwords do not match');
      return;
    }

    if (newPassword.length < 4) {
      setPwError(lang === 'ar' ? 'يجب أن تكون كلمة المرور من 4 أحرف على الأقل' : 'Password must be at least 4 characters');
      return;
    }

    try {
      setPwLoading(true);
      await api.changePassword(currentPassword, newPassword);
      setPwSuccess(lang === 'ar' ? 'تم تغيير كلمة المرور بنجاح' : 'Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        setShowPasswordModal(false);
        setPwSuccess(null);
      }, 1500);
    } catch (err: any) {
      setPwError(err.message || 'فشل في تغيير كلمة المرور');
    } finally {
      setPwLoading(false);
    }
  };

  const isOwner = user.role === 'owner';

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
        <h2 className="text-base font-bold text-gray-100">{t.profile}</h2>
        <div className="w-8"></div>
      </div>

      {/* Avatar & Name */}
      <div className="bg-[#121926] border border-gray-800 rounded-3xl p-6 text-center mb-4">
        <div
          className={`w-16 h-16 rounded-3xl p-0.5 mx-auto mb-3 ${
            isOwner
              ? 'bg-gradient-to-tr from-amber-500 to-yellow-400'
              : 'bg-gradient-to-tr from-emerald-600 to-teal-400'
          }`}
        >
          <div className="w-full h-full bg-[#0d131f] rounded-[22px] flex items-center justify-center font-bold text-xl">
            {isOwner ? (
              <Crown className="w-8 h-8 text-amber-400" />
            ) : (
              <span className="text-emerald-400">{user.name.charAt(0)}</span>
            )}
          </div>
        </div>

        <h3 className="text-base font-bold text-white mb-0.5">{user.name}</h3>
        <div className="text-xs text-gray-400 font-mono-code mb-2.5">@{user.username}</div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold">
          {isOwner ? (
            <span className="bg-amber-500/10 text-amber-400 border border-amber-500/30 px-3 py-1 rounded-full flex items-center gap-1.5">
              <Crown className="w-3.5 h-3.5 text-amber-400" />
              <span>{lang === 'ar' ? 'مالك النظام (Owner)' : 'System Owner'}</span>
            </span>
          ) : (
            <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-full flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>{lang === 'ar' ? 'مستخدم نشط (User)' : 'Standard User'}</span>
            </span>
          )}
        </div>
      </div>

      {/* Info fields */}
      <div className="bg-[#121926] border border-gray-800 rounded-2xl p-4 space-y-3.5 text-xs mb-4">
        <div>
          <span className="text-gray-400 block mb-1">
            {lang === 'ar' ? 'عنوان المحفظة الافتراضية' : 'Virtual Wallet Address'}
          </span>
          <div className="bg-[#0b0f17] p-2.5 rounded-xl border border-gray-800 flex items-center justify-between font-mono-code text-[11px] text-gray-200">
            <span className="truncate pr-2">{wallet.address}</span>
            <button
              onClick={handleCopy}
              className="text-emerald-400 hover:text-emerald-300 font-sans text-xs flex items-center gap-1 shrink-0 font-bold"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'تم' : 'نسخ'}</span>
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-gray-800">
          <span className="text-gray-400">{lang === 'ar' ? 'معرّف الاستلام الفريد' : 'Receive Code'}</span>
          <span className="font-mono-code text-gray-200 font-bold">{wallet.receiveCode}</span>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-gray-800">
          <span className="text-gray-400">{lang === 'ar' ? 'معرّف الحساب الداخلي' : 'Internal User ID'}</span>
          <span className="font-mono-code text-gray-400 text-[10px]">{user.id}</span>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-gray-800">
          <span className="text-gray-400">{lang === 'ar' ? 'تاريخ الإنشاء' : 'Member Since'}</span>
          <span className="font-mono-code text-gray-200">
            {new Date(user.createdAt).toLocaleDateString()}
          </span>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-gray-800">
          <span className="text-gray-400">{t.accountStatus}</span>
          <span className="text-emerald-400 font-semibold">{t.active}</span>
        </div>
      </div>

      {/* Security: Change Password */}
      <div className="mb-4">
        <button
          onClick={() => setShowPasswordModal(true)}
          className="w-full py-3 bg-[#131d2a] hover:bg-[#1a2738] border border-gray-700/80 text-gray-200 font-semibold rounded-2xl text-xs flex items-center justify-center gap-2 transition"
        >
          <Key className="w-4 h-4 text-emerald-400" />
          <span>{lang === 'ar' ? 'تغيير كلمة المرور' : 'Change Password'}</span>
        </button>
      </div>

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-[#121926] border border-gray-700 rounded-3xl p-5 max-w-sm w-full space-y-3.5 text-xs">
            <div className="flex items-center gap-2 text-white font-bold text-sm">
              <Lock className="w-4 h-4 text-emerald-400" />
              <span>{lang === 'ar' ? 'تغيير كلمة المرور' : 'Change Password'}</span>
            </div>

            {pwError && (
              <div className="p-2.5 bg-red-950/50 border border-red-500/40 rounded-xl text-red-300 text-[11px] flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{pwError}</span>
              </div>
            )}

            {pwSuccess && (
              <div className="p-2.5 bg-emerald-950/50 border border-emerald-500/40 rounded-xl text-emerald-300 text-[11px] flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>{pwSuccess}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-3">
              <div>
                <label className="block text-gray-400 mb-1 text-[11px]">
                  {lang === 'ar' ? 'كلمة المرور الحالية:' : 'Current Password:'}
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#0b0f17] border border-gray-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-gray-400 mb-1 text-[11px]">
                  {lang === 'ar' ? 'كلمة المرور الجديدة:' : 'New Password:'}
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#0b0f17] border border-gray-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-gray-400 mb-1 text-[11px]">
                  {lang === 'ar' ? 'تأكيد كلمة المرور الجديدة:' : 'Confirm New Password:'}
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#0b0f17] border border-gray-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  disabled={pwLoading}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-xl transition flex items-center justify-center gap-1.5"
                >
                  {pwLoading ? (
                    <span className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                  ) : (
                    <span>{lang === 'ar' ? 'حفظ التغييرات' : 'Save'}</span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  disabled={pwLoading}
                  className="px-4 py-2.5 bg-[#182333] hover:bg-[#203044] text-gray-300 font-medium rounded-xl border border-gray-700 transition"
                >
                  {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
