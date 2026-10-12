import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Clock,
  Coins,
  AlertCircle,
  CheckCircle2,
  Lock,
  QrCode,
  Clipboard,
  ShieldCheck,
  Search,
} from 'lucide-react';
import { translations, Language } from '../i18n/translations';
import { User, UserWallet, Currency } from '../types';
import { api } from '../services/api';

interface SendScreenProps {
  user: User;
  wallet: UserWallet;
  defaultRecipientAddress?: string;
  defaultCurrency?: Currency;
  onProceedToReview: (transferData: {
    recipientAddress: string;
    recipientName: string;
    currency: Currency;
    amount: number;
    lockDurationSeconds: number;
    lockLabel: string;
    note: string;
  }) => void;
  onBack: () => void;
  lang: Language;
}

export const SendScreen: React.FC<SendScreenProps> = ({
  user,
  wallet,
  defaultRecipientAddress,
  defaultCurrency,
  onProceedToReview,
  onBack,
  lang,
}) => {
  const [recipientAddress, setRecipientAddress] = useState(defaultRecipientAddress || '');
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>(defaultCurrency || 'USDT');
  const [amount, setAmount] = useState('');
  const [lockDurationSeconds, setLockDurationSeconds] = useState<number>(0);
  const [customMinutes, setCustomMinutes] = useState('');
  const [isCustomLock, setIsCustomLock] = useState(false);
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [isValidatingAddr, setIsValidatingAddr] = useState(false);
  const [addressValid, setAddressValid] = useState<boolean | null>(null);
  const [validationMsg, setValidationMsg] = useState('');

  const t = translations[lang];

  // Validate address when changed (debounced)
  useEffect(() => {
    const clean = recipientAddress.trim().toLowerCase();
    if (!clean) {
      setAddressValid(null);
      setValidationMsg('');
      return;
    }

    if (!clean.startsWith('0x') && clean.length !== 10) {
      setAddressValid(false);
      setValidationMsg(
        lang === 'ar'
          ? 'يجب أن يبدأ العنوان بـ 0x أو يكون رمز استلام معتمداً'
          : 'Address must start with 0x or be a valid receive code'
      );
      return;
    }

    if (clean === wallet.address.toLowerCase() || clean === wallet.receiveCode.toLowerCase()) {
      setAddressValid(false);
      setValidationMsg(lang === 'ar' ? 'لا يمكنك التحويل إلى نفس محفظتك' : 'Cannot transfer to your own wallet');
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setIsValidatingAddr(true);
        const res = await api.verifyAddress(clean);
        if (res.exists) {
          setAddressValid(true);
          setValidationMsg(lang === 'ar' ? 'عنوان محفظة معتمد ومطابق في النظام' : 'Verified wallet address found');
        } else {
          setAddressValid(false);
          setValidationMsg(res.error || (lang === 'ar' ? 'العنوان غير مسجل في النظام' : 'Address not found in system'));
        }
      } catch (e) {
        setAddressValid(false);
        setValidationMsg(lang === 'ar' ? 'فشل التحقق من العنوان' : 'Could not verify address');
      } finally {
        setIsValidatingAddr(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [recipientAddress, wallet.address, wallet.receiveCode, lang]);

  const lockOptions = [
    { label: t.noLock, seconds: 0 },
    { label: t.lock5m, seconds: 300 },
    { label: t.lock15m, seconds: 900 },
    { label: t.lock30m, seconds: 1800 },
    { label: t.lock1h, seconds: 3600 },
    { label: t.lock6h, seconds: 21600 },
    { label: t.lock12h, seconds: 43200 },
    { label: t.lock24h, seconds: 86400 },
    { label: t.lock3d, seconds: 259200 },
    { label: t.lock7d, seconds: 604800 },
  ];

  const currentAvailable = wallet.balances[selectedCurrency]?.available || 0;

  const handleMax = () => {
    setAmount(currentAvailable.toString());
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setRecipientAddress(text.trim());
      }
    } catch {
      // clipboard access might be blocked
    }
  };

  const handleContinue = () => {
    setError('');
    const cleanAddress = recipientAddress.trim().toLowerCase();
    if (!cleanAddress) {
      setError(lang === 'ar' ? 'يرجى إدخال عنوان محفظة المستلم' : 'Please enter recipient wallet address');
      return;
    }

    if (addressValid === false) {
      setError(validationMsg || (lang === 'ar' ? 'عنوان المحفظة غير صالح' : 'Invalid recipient address'));
      return;
    }

    if (cleanAddress === wallet.address.toLowerCase() || cleanAddress === wallet.receiveCode.toLowerCase()) {
      setError(lang === 'ar' ? 'لا يمكن التحويل لنفس المحفظة' : 'Cannot send to your own wallet');
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError(lang === 'ar' ? 'يرجى إدخال مبلغ صالح أكبر من صفر' : 'Please enter a valid amount > 0');
      return;
    }

    if (numAmount > currentAvailable) {
      setError(
        lang === 'ar'
          ? `الرصيد المتاح غير كافٍ. المتاح حالياً: ${currentAvailable} ${selectedCurrency}`
          : `Insufficient balance. Available: ${currentAvailable} ${selectedCurrency}`
      );
      return;
    }

    let finalLockSeconds = lockDurationSeconds;
    let finalLockLabel = lockOptions.find((o) => o.seconds === lockDurationSeconds)?.label || t.noLock;

    if (isCustomLock) {
      const mins = parseInt(customMinutes, 10);
      if (isNaN(mins) || mins <= 0) {
        setError(lang === 'ar' ? 'يرجى إدخال مدة قفل صالحة بالدقائق' : 'Please enter valid lock duration in minutes');
        return;
      }
      finalLockSeconds = mins * 60;
      finalLockLabel = lang === 'ar' ? `${mins} دقيقة (مخصص)` : `${mins} mins (custom)`;
    }

    onProceedToReview({
      recipientAddress: cleanAddress,
      recipientName: 'مستلم المحفظة الافتراضية',
      currency: selectedCurrency,
      amount: numAmount,
      lockDurationSeconds: finalLockSeconds,
      lockLabel: finalLockLabel,
      note: note.trim(),
    });
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
        <h2 className="text-base font-bold text-gray-100">{lang === 'ar' ? 'إرسال عملات' : 'Send Funds'}</h2>
        <div className="w-8"></div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-950/50 border border-red-500/40 rounded-xl text-red-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="space-y-4">
        {/* Recipient Address Input (Privacy-preserving: Direct address only, no public user directory) */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
              <span>{t.recipientAddress}</span>
              <span className="text-[10px] text-gray-400 font-mono">(0x...)</span>
            </label>
            <button
              onClick={handlePaste}
              className="text-[11px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-medium transition"
            >
              <Clipboard className="w-3.5 h-3.5" />
              <span>{lang === 'ar' ? 'لصق' : 'Paste'}</span>
            </button>
          </div>

          <div className="relative">
            <input
              type="text"
              value={recipientAddress}
              onChange={(e) => {
                setRecipientAddress(e.target.value);
                setError('');
              }}
              placeholder="0x... أو رمز الاستلام"
              className="w-full bg-[#121926] border border-gray-700/80 rounded-2xl py-3 px-3.5 text-xs text-white placeholder-gray-500 font-mono-code focus:outline-none focus:border-emerald-500 pr-10"
            />
            {isValidatingAddr && (
              <span className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin absolute end-3 top-3.5"></span>
            )}
            {!isValidatingAddr && addressValid === true && (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 absolute end-3 top-3.5" />
            )}
            {!isValidatingAddr && addressValid === false && (
              <AlertCircle className="w-4 h-4 text-amber-400 absolute end-3 top-3.5" />
            )}
          </div>

          {validationMsg && (
            <div
              className={`text-[11px] mt-1.5 flex items-center gap-1 ${
                addressValid ? 'text-emerald-400' : 'text-amber-400'
              }`}
            >
              <span>{validationMsg}</span>
            </div>
          )}

          <div className="text-[10px] text-gray-400 mt-1">
            {lang === 'ar'
              ? 'تتم حماية الخصوصية: لا يتم الكشف عن هوية صاحب العنوان أو رصيده.'
              : 'Privacy preserved: Wallet owner identity and balance remain hidden.'}
          </div>
        </div>

        {/* Currency Selector */}
        <div>
          <label className="block text-xs font-semibold text-gray-300 mb-1.5">{lang === 'ar' ? 'اختر العملة' : 'Select Coin'}</label>
          <div className="grid grid-cols-3 gap-2">
            {(['USDT', 'BTC', 'ETH'] as Currency[]).map((c) => {
              const active = selectedCurrency === c;
              const bal = wallet.balances[c]?.available || 0;
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => setSelectedCurrency(c)}
                  className={`p-2.5 rounded-2xl border text-center transition ${
                    active
                      ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300 shadow-md shadow-emerald-950/50'
                      : 'bg-[#121926] border-gray-800 text-gray-400 hover:text-gray-200 hover:border-gray-700'
                  }`}
                >
                  <div className="font-bold text-xs">{c}</div>
                  <div className="text-[10px] font-mono-code opacity-80 mt-0.5 truncate">
                    {bal} {c}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Amount Input */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-gray-300">{t.amount}</label>
            <div className="text-[11px] text-gray-400 font-mono-code">
              {lang === 'ar' ? 'الرصيد المتاح' : 'Available'}:{' '}
              <span className="text-emerald-400 font-bold">
                {currentAvailable} {selectedCurrency}
              </span>
            </div>
          </div>
          <div className="relative">
            <input
              type="number"
              step="any"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full bg-[#121926] border border-gray-700/80 rounded-2xl py-3 px-3.5 ps-10 text-base font-bold font-mono-code text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
            />
            <Coins className="w-4 h-4 text-gray-400 absolute start-3.5 top-4" />
            <button
              type="button"
              onClick={handleMax}
              className="absolute end-3 top-2.5 px-2.5 py-1 bg-[#182433] hover:bg-[#203044] text-emerald-400 text-xs font-bold rounded-lg border border-gray-700 transition"
            >
              {t.max}
            </button>
          </div>
        </div>

        {/* Time-Lock Duration Section */}
        <div className="bg-[#121926] border border-amber-500/20 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
              <Clock className="w-4 h-4" />
              <span>{lang === 'ar' ? 'قفل الرصيد الزمني (اختياري)' : 'Time-Lock (Optional)'}</span>
            </div>
            <button
              type="button"
              onClick={() => setIsCustomLock(!isCustomLock)}
              className="text-[11px] text-gray-400 hover:text-white underline transition"
            >
              {isCustomLock ? (lang === 'ar' ? 'اختيار مدة جاهزة' : 'Select Preset') : (lang === 'ar' ? 'مدة مخصصة' : 'Custom')}
            </button>
          </div>

          <p className="text-[11px] text-gray-400 leading-relaxed">
            {lang === 'ar'
              ? 'احجز الرصيد في محفظة المستلم كـ "معلّق" ولا يُتاح للاستخدام إلا بعد انقضاء المدة المحددة.'
              : 'Lock funds in recipient wallet as pending until time expires.'}
          </p>

          {!isCustomLock ? (
            <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto pr-1">
              {lockOptions.map((opt) => {
                const isSelected = lockDurationSeconds === opt.seconds;
                return (
                  <button
                    key={opt.seconds}
                    type="button"
                    onClick={() => setLockDurationSeconds(opt.seconds)}
                    className={`py-2 px-3 rounded-xl border text-xs font-medium transition text-left rtl:text-right ${
                      isSelected
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
                        : 'bg-[#0d131f] border-gray-800 text-gray-300 hover:border-gray-700'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="space-y-2">
              <label className="text-[11px] text-gray-300">{lang === 'ar' ? 'المدة المخصصة بالدقائق:' : 'Duration in minutes:'}</label>
              <input
                type="number"
                value={customMinutes}
                onChange={(e) => setCustomMinutes(e.target.value)}
                placeholder="مثال: 45"
                className="w-full bg-[#0d131f] border border-gray-700 rounded-xl p-2.5 text-xs text-white font-mono-code focus:outline-none focus:border-amber-500"
              />
            </div>
          )}
        </div>

        {/* Note */}
        <div>
          <label className="block text-xs font-semibold text-gray-300 mb-1.5">{t.noteOptional}</label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={lang === 'ar' ? 'ملاحظة خاصة بالعملية (اختياري)' : 'Optional transaction note'}
            className="w-full bg-[#121926] border border-gray-700/80 rounded-2xl py-2.5 px-3.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Continue Button */}
        <button
          type="button"
          onClick={handleContinue}
          className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl text-xs transition shadow-lg shadow-emerald-900/30 flex items-center justify-center gap-2 mt-4"
        >
          <span>{t.continue}</span>
          {lang === 'ar' ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
};
