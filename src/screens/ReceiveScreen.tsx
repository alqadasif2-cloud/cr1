import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  ArrowLeft,
  ArrowRight,
  Copy,
  Check,
  Share2,
  ExternalLink,
  ShieldCheck,
  Info,
} from 'lucide-react';
import { translations, Language } from '../i18n/translations';
import { User, UserWallet } from '../types';

interface ReceiveScreenProps {
  user: User;
  wallet: UserWallet;
  onBack: () => void;
  lang: Language;
}

export const ReceiveScreen: React.FC<ReceiveScreenProps> = ({
  user,
  wallet,
  onBack,
  lang,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  const t = translations[lang];

  // Receive link format as specified in section 7
  const origin = window.location.origin;
  const receiveUrl = `${origin}/receive/${wallet.receiveCode}`;

  useEffect(() => {
    if (wallet.address) {
      QRCode.toDataURL(receiveUrl, {
        width: 260,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error('QR generation failed:', err));
    }
  }, [wallet.address, receiveUrl]);

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(wallet.address);
    setCopiedAddress(true);
    setTimeout(() => setCopiedAddress(false), 2000);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(receiveUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Crypto Wallet: ${user.name}`,
          text: `حول لي عبر Crypto Wallet على العنوان:\n${wallet.address}\nأو الرابط:\n${receiveUrl}`,
          url: receiveUrl,
        });
      } catch (err) {
        handleCopyLink();
      }
    } else {
      handleCopyLink();
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
        <h2 className="text-base font-bold text-gray-100">{t.receiveTitle}</h2>
        <button
          onClick={handleShare}
          className="p-2 rounded-xl bg-[#141e2c] hover:bg-[#1a273a] text-emerald-400 transition"
          title={t.share}
        >
          <Share2 className="w-4 h-4" />
        </button>
      </div>

      {/* QR Code Container */}
      <div className="bg-[#121926] border border-gray-800 rounded-3xl p-6 flex flex-col items-center text-center shadow-xl mb-4">
        <div className="p-3 bg-white rounded-2xl shadow-lg border border-gray-300 mb-4 inline-block">
          {qrDataUrl ? (
            <img src={qrDataUrl} alt="Receive QR Code" className="w-48 h-48 block mx-auto" />
          ) : (
            <div className="w-48 h-48 flex items-center justify-center text-gray-400 text-xs">
              {lang === 'ar' ? 'جاري تجهيز الرمز...' : 'Generating QR...'}
            </div>
          )}
        </div>

        <div className="text-xs font-semibold text-gray-200 mb-0.5">{user.name}</div>
        <div className="text-[11px] text-gray-400 mb-4">{t.scanQrToPay}</div>

        {/* 0x Address Box */}
        <div className="w-full bg-[#0b0f17] border border-gray-800 rounded-2xl p-3.5 text-left rtl:text-right">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] text-gray-400 font-medium">{t.recipientAddress}</span>
            <button
              onClick={handleCopyAddress}
              className="text-emerald-400 hover:text-emerald-300 text-[11px] font-semibold flex items-center gap-1"
            >
              {copiedAddress ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedAddress ? t.addressCopied : t.copyAddress}</span>
            </button>
          </div>
          <div className="font-mono-code text-[11px] text-gray-200 break-all select-all leading-relaxed">
            {wallet.address}
          </div>
        </div>
      </div>

      {/* Shareable Link Box (Section 7) */}
      <div className="bg-[#121926] border border-gray-800 rounded-2xl p-4 mb-4">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-bold text-gray-200">{t.publicReceiveLink}</span>
          <button
            onClick={handleCopyLink}
            className="text-emerald-400 hover:text-emerald-300 text-xs font-semibold flex items-center gap-1"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5" /> : <ExternalLink className="w-3.5 h-3.5" />}
            <span>{copiedLink ? t.linkCopied : t.copyLink}</span>
          </button>
        </div>
        <div className="font-mono-code text-[11px] text-gray-400 break-all bg-[#0b0f17] p-2.5 rounded-xl border border-gray-800/80 mb-2">
          {receiveUrl}
        </div>
        <div className="text-[10px] text-gray-400 leading-relaxed">
          {lang === 'ar'
            ? 'يمكن للمرسل فتح هذا الرابط في متصفح أو تطبيق متوافق لعرض عنوانك وإرسال رصيد لك مباشرة.'
            : 'Share this secure URL with senders to load your public receive profile directly.'}
        </div>
      </div>

      {/* Security Guidance (Section 17) */}
      <div className="bg-[#101724] border border-emerald-500/10 rounded-2xl p-3.5 flex items-start gap-2 text-[11px] text-gray-400 leading-relaxed">
        <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
        <div>
          <strong className="text-gray-200 block mb-0.5">
            {lang === 'ar' ? 'أمان روابط وعناوين الاستلام' : 'Public Address Security'}
          </strong>
          {lang === 'ar'
            ? 'عنوانك ورابط الاستلام هما بيانات عامة آمنة للمشاركة ولا يمنحان أي صلاحية للتحكم بأرصدتك أو سحبها. لا يتم إضافة أي رصيد إلا بتنفيذ تحويل خادمي صحيح.'
            : 'Your 0x address and receive URL are safe to share publicly and do not permit withdrawals.'}
        </div>
      </div>
    </div>
  );
};
