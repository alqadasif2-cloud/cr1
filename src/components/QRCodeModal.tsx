import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { X, Copy, Check, ExternalLink } from 'lucide-react';
import { Language } from '../i18n/translations';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  address: string;
  receiveUrl: string;
  lang: Language;
}

export const QRCodeModal: React.FC<QRCodeModalProps> = ({
  isOpen,
  onClose,
  address,
  receiveUrl,
  lang,
}) => {
  const [dataUrl, setDataUrl] = useState<string>('');
  const [copiedAddr, setCopiedAddr] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    if (isOpen && (receiveUrl || address)) {
      QRCode.toDataURL(receiveUrl || address, {
        width: 280,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
      })
        .then((url) => setDataUrl(url))
        .catch((err) => console.error('QR generation error:', err));
    }
  }, [isOpen, address, receiveUrl]);

  if (!isOpen) return null;

  const handleCopyAddr = () => {
    navigator.clipboard.writeText(address);
    setCopiedAddr(true);
    setTimeout(() => setCopiedAddr(false), 2000);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(receiveUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#121926] border border-gray-700 rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-100 p-1 rounded-full bg-gray-800/80"
          aria-label="إغلاق"
        >
          <X className="w-4 h-4" />
        </button>

        <h3 className="text-base font-bold text-gray-100 mb-1">
          {lang === 'ar' ? 'رمز QR للمحفظة' : 'Wallet QR Code'}
        </h3>
        <p className="text-xs text-gray-400 mb-5">
          {lang === 'ar'
            ? 'امسح هذا الرمز للتحويل المباشر أو مشاركة الرابط'
            : 'Scan this code to transfer directly to this wallet'}
        </p>

        {/* QR Code Container */}
        <div className="p-4 bg-white rounded-2xl inline-block shadow-lg mb-5 border border-gray-300">
          {dataUrl ? (
            <img src={dataUrl} alt="QR Code" className="w-52 h-52 block mx-auto" />
          ) : (
            <div className="w-52 h-52 flex items-center justify-center text-gray-400 text-xs">
              {lang === 'ar' ? 'جاري إنشاء الرمز...' : 'Generating QR...'}
            </div>
          )}
        </div>

        {/* Short Address */}
        <div className="bg-[#0b0f17] p-3 rounded-xl border border-gray-800 mb-4 text-left font-mono-code text-xs text-gray-300 flex items-center justify-between">
          <span className="truncate pr-2">
            {address ? `${address.substring(0, 10)}...${address.substring(address.length - 8)}` : ''}
          </span>
          <button
            onClick={handleCopyAddr}
            className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 shrink-0 text-[11px] font-sans font-medium"
          >
            {copiedAddr ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedAddr ? (lang === 'ar' ? 'تم النسخ' : 'Copied') : (lang === 'ar' ? 'نسخ' : 'Copy')}</span>
          </button>
        </div>

        {/* Receive Link Action */}
        <div className="flex gap-2">
          <button
            onClick={handleCopyLink}
            className="flex-1 py-2.5 px-3 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <ExternalLink className="w-3.5 h-3.5" />}
            <span>{copiedLink ? (lang === 'ar' ? 'تم نسخ الرابط' : 'Link Copied') : (lang === 'ar' ? 'نسخ رابط الاستلام' : 'Copy Link')}</span>
          </button>
          <button
            onClick={onClose}
            className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold transition"
          >
            {lang === 'ar' ? 'إغلاق' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
