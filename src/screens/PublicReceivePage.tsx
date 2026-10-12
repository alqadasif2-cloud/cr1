import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  Shield,
  Copy,
  Check,
  ArrowRight,
  ArrowLeft,
  Smartphone,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import { api } from '../services/api';
import { Language } from '../i18n/translations';

interface PublicReceivePageProps {
  receiveCode: string;
  onSendToThisAddress: (address: string) => void;
  onClose: () => void;
  lang: Language;
}

export const PublicReceivePage: React.FC<PublicReceivePageProps> = ({
  receiveCode,
  onSendToThisAddress,
  onClose,
  lang,
}) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [qrUrl, setQrUrl] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    api.getReceiveInfo(receiveCode)
      .then((res) => {
        setData(res);
        QRCode.toDataURL(window.location.href, { width: 240, margin: 2 })
          .then((url) => setQrUrl(url))
          .catch(console.error);
      })
      .catch((err) => {
        setError(err.message || 'تعذر تحميل بيانات المحفظة');
      })
      .finally(() => setLoading(false));
  }, [receiveCode]);

  const handleCopy = () => {
    if (data?.address) {
      navigator.clipboard.writeText(data.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex-1 bg-[#0b0f17] flex flex-col p-4 pb-20 overflow-y-auto">
      {/* Top Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={onClose}
          className="p-2 rounded-xl bg-[#141e2c] hover:bg-[#1a273a] text-gray-300 transition"
        >
          {lang === 'ar' ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
        </button>
        <h2 className="text-sm font-bold text-gray-100 flex items-center gap-1.5">
          <Shield className="w-4 h-4 text-emerald-400" />
          <span>Crypto Wallet Pay</span>
        </h2>
        <div className="w-8"></div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-xs text-gray-400">جاري تحميل بيانات صفحة الاستلام...</div>
      ) : error ? (
        <div className="p-4 bg-red-950/40 border border-red-500/30 rounded-2xl text-red-300 text-xs text-center">
          {error}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-[#121926] border border-gray-800 rounded-3xl p-6 text-center shadow-2xl">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 p-0.5 mx-auto mb-3">
              <div className="w-full h-full bg-[#0d131f] rounded-[14px] flex items-center justify-center font-bold text-emerald-400 text-lg">
                {data.recipientName.charAt(0)}
              </div>
            </div>

            <h3 className="text-base font-bold text-white mb-0.5">{data.recipientName}</h3>
            <div className="text-[11px] text-gray-400 font-mono-code mb-4">
              {lang === 'ar' ? 'طلب تحويل رصيد عبر محفظة Crypto Wallet' : 'Payment request via Crypto Wallet'}
            </div>

            {/* QR Code */}
            <div className="p-3 bg-white rounded-2xl inline-block shadow mb-4">
              {qrUrl && <img src={qrUrl} alt="Receive QR" className="w-44 h-44 block" />}
            </div>

            {/* Address */}
            <div className="bg-[#0b0f17] p-3 rounded-2xl border border-gray-800 text-left rtl:text-right mb-4">
              <div className="text-[10px] text-gray-400 mb-1">{lang === 'ar' ? 'عنوان محفظة المستلم (0x)' : 'Recipient 0x Address'}</div>
              <div className="font-mono-code text-[11px] text-gray-200 break-all select-all">
                {data.address}
              </div>
            </div>

            {/* Copy button */}
            <button
              onClick={handleCopy}
              className="w-full py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition mb-2"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? (lang === 'ar' ? 'تم نسخ العنوان' : 'Copied') : (lang === 'ar' ? 'نسخ عنوان المحفظة' : 'Copy Address')}</span>
            </button>

            {/* Send Direct Action */}
            <button
              onClick={() => onSendToThisAddress(data.address)}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-emerald-900/30"
            >
              {lang === 'ar' ? 'إرسال تحويل إلى هذا العنوان الآن' : 'Send to this Address'}
            </button>
          </div>

          <div className="text-[11px] text-center text-gray-400 leading-relaxed px-4">
            {lang === 'ar'
              ? 'العملات المدعومة في هذا الرابط: Bitcoin (BTC) و Ethereum (ETH) و Tether (USDT).'
              : 'Supported assets: BTC, ETH, and USDT.'}
          </div>
        </div>
      )}
    </div>
  );
};
