import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Sliders,
  Users,
  Layers,
  Clock,
  RotateCcw,
  CheckCircle2,
  Shield,
  Search,
  Lock,
  UserX,
  UserCheck,
  FileText,
  AlertTriangle,
  Settings,
  Crown,
  ChevronRight,
} from 'lucide-react';
import { translations, Language } from '../i18n/translations';
import { api } from '../services/api';

interface AdminScreenProps {
  onBack: () => void;
  lang: Language;
}

export const AdminScreen: React.FC<AdminScreenProps> = ({ onBack, lang }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'transfers' | 'locked' | 'audit' | 'settings'>('overview');
  const [searchUser, setSearchUser] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Settings form state
  const [maxLockDays, setMaxLockDays] = useState<number>(30);
  const [histYear, setHistYear] = useState<string>('');
  const [histImpact, setHistImpact] = useState<'display_only' | 'affect_balance'>('display_only');
  const [savingSettings, setSavingSettings] = useState(false);

  const t = translations[lang];

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getAdminOverview();
      setData(res);
      if (res.settings) {
        setMaxLockDays(res.settings.maxLockDurationDays || 30);
        setHistYear(res.settings.historicalYear || '');
        setHistImpact(res.settings.historicalBalanceImpact || 'display_only');
      }
    } catch (err: any) {
      setError(err.message || 'فشل في تحميل بيانات لوحة الإدارة');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleUserStatus = async (userId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
      await api.updateAdminUserStatus(userId, newStatus);
      setMessage(lang === 'ar' ? 'تم تحديث حالة المستخدم بنجاح' : 'User status updated');
      await loadData();
    } catch (err: any) {
      setError(err.message || 'فشل في تحديث حالة المستخدم');
    }
  };

  const handleRefundTx = async (txId: string) => {
    if (confirm(lang === 'ar' ? 'هل تريد استرجاع هذه المعاملة وخصمها من المستلم وإعادتها للمرسل؟' : 'Process refund for this transaction?')) {
      try {
        await api.refundTransaction(txId, 'استرجاع مباشر من لوحة إدارة المالك');
        setMessage(lang === 'ar' ? 'تم استرجاع المعاملة وتحديث الأرصدة بنجاح' : 'Refund processed successfully');
        await loadData();
      } catch (err: any) {
        setError(err.message || 'فشل في الاسترجاع');
      }
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingSettings(true);
      await api.updateAdminSettings({
        maxLockDurationDays: maxLockDays,
        historicalYear: histYear.trim() || null,
        historicalBalanceImpact: histImpact,
      });
      setMessage(lang === 'ar' ? 'تم حفظ إعدادات النظام بنجاح' : 'Settings saved successfully');
      await loadData();
    } catch (err: any) {
      setError(err.message || 'فشل في حفظ الإعدادات');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleReset = async () => {
    if (
      confirm(
        lang === 'ar'
          ? 'هل أنت متأكد من إعادة ضبط النظام للحالة الافتراضية؟ سيتم الإبقاء على حساب Sam برصيد 1000 USD، وحساب Eslam برصيد 0 USD وسجلاته التاريخية.'
          : 'Reset all system data to initial state?'
      )
    ) {
      try {
        setLoading(true);
        await api.resetAdminDemo();
        setMessage(lang === 'ar' ? 'تمت إعادة ضبط النظام بنجاح' : 'System reset to default state');
        await loadData();
      } catch (err: any) {
        setError(err.message || 'فشل في إعادة الضبط');
      } finally {
        setLoading(false);
      }
    }
  };

  const filteredUsers = data?.users?.filter((u: any) => {
    if (!searchUser.trim()) return true;
    const q = searchUser.toLowerCase();
    return (
      u.username.toLowerCase().includes(q) ||
      u.name.toLowerCase().includes(q) ||
      u.id.toLowerCase().includes(q) ||
      u.address.toLowerCase().includes(q)
    );
  }) || [];

  return (
    <div className="flex-1 bg-[#0b0f17] flex flex-col p-4 pb-20 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={onBack}
          className="p-2 rounded-xl bg-[#141e2c] hover:bg-[#1a273a] text-gray-300 transition"
        >
          {lang === 'ar' ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
        </button>
        <h2 className="text-base font-bold text-gray-100 flex items-center gap-1.5">
          <Crown className="w-4 h-4 text-amber-400" />
          <span>{lang === 'ar' ? 'لوحة تحكم مالك النظام (Sam)' : 'Owner Admin Dashboard (Sam)'}</span>
        </h2>
        <div className="w-8"></div>
      </div>

      {message && (
        <div className="mb-3 p-3 bg-emerald-950/60 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{message}</span>
          </div>
          <button onClick={() => setMessage(null)} className="text-white ml-2 text-sm">×</button>
        </div>
      )}

      {error && (
        <div className="mb-3 p-3 bg-red-950/60 border border-red-500/40 rounded-xl text-red-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-white ml-2 text-sm">×</button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-3 text-xs scrollbar-none">
        {[
          { id: 'overview', label: lang === 'ar' ? 'نظرة عامة' : 'Overview' },
          { id: 'users', label: lang === 'ar' ? 'إدارة الحسابات' : 'Accounts' },
          { id: 'transfers', label: lang === 'ar' ? 'التحويلات والاسترجاع' : 'Transfers' },
          { id: 'locked', label: lang === 'ar' ? 'الأرصدة المقفلة' : 'Locked' },
          { id: 'audit', label: lang === 'ar' ? 'سجل التدقيق' : 'Audit Log' },
          { id: 'settings', label: lang === 'ar' ? 'إعدادات المحاكاة' : 'Settings' },
        ].map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl font-medium transition shrink-0 ${
                active
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                  : 'bg-[#141e2c] text-gray-400 hover:text-gray-200'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {loading || !data ? (
        <div className="text-center py-10 text-xs text-gray-400 flex items-center justify-center gap-2">
          <span className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin"></span>
          <span>جاري تحميل بيانات الإدارة الموثوقة من الخادم...</span>
        </div>
      ) : (
        <div className="space-y-4 text-xs">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-[#121926] border border-gray-800 p-3.5 rounded-2xl">
                  <div className="flex items-center justify-between text-gray-400 mb-1">
                    <span className="text-[11px]">{lang === 'ar' ? 'إجمالي الحسابات' : 'Users'}</span>
                    <Users className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="text-xl font-extrabold text-white font-mono-code">{data.totalUsers}</div>
                </div>

                <div className="bg-[#121926] border border-gray-800 p-3.5 rounded-2xl">
                  <div className="flex items-center justify-between text-gray-400 mb-1">
                    <span className="text-[11px]">{lang === 'ar' ? 'إجمالي العمليات' : 'Transactions'}</span>
                    <Layers className="w-4 h-4 text-indigo-400" />
                  </div>
                  <div className="text-xl font-extrabold text-white font-mono-code">{data.totalTransactions}</div>
                </div>

                <div className="bg-[#121926] border border-gray-800 p-3.5 rounded-2xl">
                  <div className="flex items-center justify-between text-gray-400 mb-1">
                    <span className="text-[11px]">{lang === 'ar' ? 'عمليات مقفلة نشطة' : 'Active Locks'}</span>
                    <Clock className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="text-xl font-extrabold text-white font-mono-code">{data.activeLockedCount}</div>
                </div>

                <div className="bg-[#121926] border border-gray-800 p-3.5 rounded-2xl">
                  <div className="flex items-center justify-between text-gray-400 mb-1">
                    <span className="text-[11px]">{lang === 'ar' ? 'عمليات الاسترجاع' : 'Refunds'}</span>
                    <RotateCcw className="w-4 h-4 text-purple-400" />
                  </div>
                  <div className="text-xl font-extrabold text-white font-mono-code">{data.refundCount || 0}</div>
                </div>
              </div>

              {/* Sam Owner Verification Card */}
              <div className="bg-[#121926] border border-amber-500/30 rounded-2xl p-4">
                <div className="flex items-center gap-2 text-amber-400 font-bold mb-1">
                  <Crown className="w-4 h-4" />
                  <span>{lang === 'ar' ? 'حساب مالك النظام المصادق' : 'Authenticated Owner'}</span>
                </div>
                <div className="text-[11px] text-gray-300 leading-relaxed">
                  تم التحقق من صلاحيات المالك <span className="font-bold text-white font-mono">Sam</span> على مستوى الخادم. الصلاحيات الإدارية مفعلة بالكامل لمراجعة الأرصدة، السجلات التاريخية، التحويلات، والاسترجاع.
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: USERS MANAGEMENT */}
          {activeTab === 'users' && (
            <div className="space-y-3">
              <div className="relative">
                <input
                  type="text"
                  value={searchUser}
                  onChange={(e) => setSearchUser(e.target.value)}
                  placeholder={lang === 'ar' ? 'بحث باسم المستخدم أو المعرّف أو العنوان...' : 'Search by username or ID...'}
                  className="w-full bg-[#131b26] border border-gray-700/80 rounded-xl py-2 px-3 ps-9 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500"
                />
                <Search className="w-3.5 h-3.5 text-gray-400 absolute start-3 top-2.5" />
              </div>

              <div className="space-y-2">
                {filteredUsers.map((u: any) => {
                  const isOwnerUser = u.role === 'owner';
                  const isSuspended = u.status === 'suspended';

                  return (
                    <div key={u.id} className="bg-[#121926] border border-gray-800 rounded-2xl p-3.5 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-100">{u.name}</span>
                          <span className="text-[11px] text-gray-400 font-mono">@{u.username}</span>
                          {isOwnerUser && (
                            <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                              Owner
                            </span>
                          )}
                          {isSuspended && (
                            <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-red-500/20 text-red-300 border border-red-500/40">
                              موقوف
                            </span>
                          )}
                        </div>

                        {!isOwnerUser && (
                          <button
                            onClick={() => handleToggleUserStatus(u.id, u.status)}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition flex items-center gap-1 ${
                              isSuspended
                                ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/40'
                                : 'bg-red-950/60 text-red-300 border border-red-500/40'
                            }`}
                          >
                            {isSuspended ? (
                              <>
                                <UserCheck className="w-3 h-3" />
                                <span>تفعيل</span>
                              </>
                            ) : (
                              <>
                                <UserX className="w-3 h-3" />
                                <span>تعليق</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>

                      <div className="font-mono-code text-[10px] text-gray-400 bg-[#0b0f17] p-2 rounded-xl border border-gray-800/80 truncate">
                        {u.address}
                      </div>

                      <div className="grid grid-cols-3 gap-1 pt-1 text-[10px] font-mono-code">
                        <div className="bg-[#182333]/40 p-1.5 rounded-lg border border-gray-800 text-center">
                          <div className="text-gray-400">USDT</div>
                          <div className="text-emerald-400 font-bold">{u.balances?.USDT?.available || 0}</div>
                          {u.balances?.USDT?.locked > 0 && (
                            <div className="text-amber-400 text-[9px]">قفل: {u.balances.USDT.locked}</div>
                          )}
                        </div>
                        <div className="bg-[#182333]/40 p-1.5 rounded-lg border border-gray-800 text-center">
                          <div className="text-gray-400">BTC</div>
                          <div className="text-emerald-400 font-bold">{u.balances?.BTC?.available || 0}</div>
                        </div>
                        <div className="bg-[#182333]/40 p-1.5 rounded-lg border border-gray-800 text-center">
                          <div className="text-gray-400">ETH</div>
                          <div className="text-emerald-400 font-bold">{u.balances?.ETH?.available || 0}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: TRANSFERS & REFUNDS */}
          {activeTab === 'transfers' && (
            <div className="space-y-2">
              {data.transactions.map((tx: any) => {
                const canRefundThis = !tx.isHistorical && !tx.isRefund && !tx.refunded && tx.status === 'COMPLETED';

                return (
                  <div key={tx.id} className="bg-[#121926] border border-gray-800 rounded-2xl p-3 space-y-2">
                    <div className="flex items-center justify-between text-[11px]">
                      <div className="font-bold text-gray-200">
                        {tx.amount} {tx.currency}
                      </div>
                      <span className="text-[10px] font-mono-code text-gray-400">
                        {tx.source}
                      </span>
                    </div>

                    <div className="text-[10px] text-gray-400 font-mono-code truncate">
                      من: {tx.senderAddress.substring(0, 10)}... إلى: {tx.recipientAddress.substring(0, 10)}...
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-gray-800 text-[10px]">
                      <span className="text-gray-400">
                        {tx.isHistorical && tx.historicalDateText ? tx.historicalDateText : new Date(tx.createdAt).toLocaleDateString()}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className={`font-semibold ${tx.status === 'LOCKED' ? 'text-amber-400' : 'text-emerald-400'}`}>
                          {tx.status}
                        </span>
                        {canRefundThis && (
                          <button
                            onClick={() => handleRefundTx(tx.id)}
                            className="px-2 py-0.5 rounded bg-purple-950/60 hover:bg-purple-900/80 border border-purple-500/40 text-purple-300 font-bold"
                          >
                            استرجاع
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 4: LOCKED FUNDS */}
          {activeTab === 'locked' && (
            <div className="space-y-2">
              {data.transactions.filter((t: any) => t.status === 'LOCKED').length === 0 ? (
                <div className="bg-[#121926] border border-gray-800 rounded-2xl p-6 text-center text-gray-400 text-xs">
                  لا توجد مبالغ مقفلة حالياً في النظام
                </div>
              ) : (
                data.transactions.filter((t: any) => t.status === 'LOCKED').map((tx: any) => (
                  <div key={tx.id} className="bg-[#121926] border border-amber-500/30 rounded-2xl p-3.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-amber-300 font-mono-code">{tx.amount} {tx.currency}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-400 font-bold">
                        معلّق بقفل زمني
                      </span>
                    </div>
                    <div className="text-[10px] text-gray-400 font-mono-code">
                      المستلم: {tx.recipientAddress}
                    </div>
                    <div className="text-[10px] text-gray-400">
                      وقت الإتاحة التلقائي: {tx.unlockAt ? new Date(tx.unlockAt).toLocaleTimeString() : 'غير محدد'}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 5: AUDIT LOG */}
          {activeTab === 'audit' && (
            <div className="space-y-2">
              {data.auditLogs?.map((log: any) => (
                <div key={log.id} className="bg-[#121926] border border-gray-800 rounded-xl p-3 space-y-1">
                  <div className="flex items-center justify-between text-[10px] font-mono-code">
                    <span className="font-bold text-indigo-400">{log.action}</span>
                    <span className="text-gray-400">{new Date(log.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <div className="text-[11px] text-gray-300 leading-relaxed">{log.details}</div>
                  <div className="text-[9px] text-gray-400 font-mono-code">بواسطة: {log.actorUsername}</div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 6: SETTINGS */}
          {activeTab === 'settings' && (
            <div className="space-y-4">
              <form onSubmit={handleSaveSettings} className="bg-[#121926] border border-gray-800 rounded-2xl p-4 space-y-3.5">
                <h3 className="font-bold text-gray-100 flex items-center gap-1.5">
                  <Settings className="w-4 h-4 text-amber-400" />
                  <span>{lang === 'ar' ? 'إعدادات المحاكاة والتواريخ' : 'Simulation Rules'}</span>
                </h3>

                <div>
                  <label className="block text-gray-300 mb-1 text-[11px]">
                    {lang === 'ar' ? 'سنة السجلات التاريخية (تُترك فارغة لعدم اختراع سنة):' : 'Historical Records Year (leave empty if unspecified):'}
                  </label>
                  <input
                    type="text"
                    value={histYear}
                    onChange={(e) => setHistYear(e.target.value)}
                    placeholder={lang === 'ar' ? 'غير محددة (افتراضي)' : 'Unspecified'}
                    className="w-full bg-[#0b0f17] border border-gray-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-500 font-mono-code"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 mb-1 text-[11px]">
                    {lang === 'ar' ? 'أثر السجلات التاريخية على رصيد Eslam:' : 'Historical Records Balance Impact:'}
                  </label>
                  <select
                    value={histImpact}
                    onChange={(e) => setHistImpact(e.target.value as any)}
                    className="w-full bg-[#0b0f17] border border-gray-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="display_only">
                      {lang === 'ar' ? 'سجل تاريخي للعرض فقط (الرصيد الابتدائي 0.00 USD - موصى به)' : 'Display Only (Starts at 0.00 USD)'}
                    </option>
                    <option value="affect_balance">
                      {lang === 'ar' ? 'تطبيق حركات السجلات (+300 ثم -300 استرجاع = صافي 0.00 USD)' : 'Affect Balance (+300 -300 = net 0.00 USD)'}
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-300 mb-1 text-[11px]">
                    {lang === 'ar' ? 'الحد الأقصى لأيام القفل الزمني:' : 'Max Lock Duration (Days):'}
                  </label>
                  <input
                    type="number"
                    value={maxLockDays}
                    onChange={(e) => setMaxLockDays(parseInt(e.target.value, 10) || 30)}
                    className="w-full bg-[#0b0f17] border border-gray-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-500 font-mono-code"
                  />
                </div>

                <button
                  type="submit"
                  disabled={savingSettings}
                  className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-bold rounded-xl transition"
                >
                  {savingSettings ? 'جاري الحفظ...' : (lang === 'ar' ? 'حفظ إعدادات المحاكاة' : 'Save Settings')}
                </button>
              </form>

              {/* Reset to initial state */}
              <button
                onClick={handleReset}
                className="w-full py-3 bg-[#1e1518] hover:bg-red-950/60 border border-red-500/30 text-red-300 rounded-2xl font-semibold flex items-center justify-center gap-2 transition"
              >
                <RotateCcw className="w-4 h-4" />
                <span>{lang === 'ar' ? 'إعادة ضبط النظام إلى التهيئة الابتدائية المعتمدة' : 'Reset System to Initial State'}</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
