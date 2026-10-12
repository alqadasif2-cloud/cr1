import { User, UserWallet, Transaction, NotificationItem, Currency, SystemSettings, AuditLogEntry, OperationalError } from '../types';

let currentToken: string | null = localStorage.getItem('crypto_wallet_token') || null;

export function setAuthToken(token: string | null) {
  currentToken = token;
  if (token) {
    localStorage.setItem('crypto_wallet_token', token);
  } else {
    localStorage.removeItem('crypto_wallet_token');
  }
}

export function getAuthToken() {
  return currentToken;
}

function getHeaders(): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (currentToken) {
    headers['Authorization'] = `Bearer ${currentToken}`;
    headers['x-user-id'] = currentToken;
  }
  return headers;
}

export const api = {
  async register(username: string, name: string, password: string) {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, name, password }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'فشل في إنشاء الحساب');
    }
    const data = await res.json();
    setAuthToken(data.token);
    return data;
  },

  async login(username: string, password: string) {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'فشل في تسجيل الدخول');
    }
    const data = await res.json();
    setAuthToken(data.token);
    return data;
  },

  async getMe(): Promise<{ user: User; wallet: UserWallet }> {
    const res = await fetch('/api/auth/me', { headers: getHeaders() });
    if (!res.ok) {
      throw new Error('فشل التحقق من الجلسة');
    }
    return res.json();
  },

  async changePassword(currentPassword: string, newPassword: string) {
    const res = await fetch('/api/auth/change-password', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'فشل في تغيير كلمة المرور');
    }
    return res.json();
  },

  async getWallet(): Promise<{ wallet: UserWallet; rates: Record<string, number>; totalUsdtEquivalent: number }> {
    const res = await fetch('/api/wallet', { headers: getHeaders() });
    if (!res.ok) throw new Error('فشل في جلب بيانات المحفظة');
    return res.json();
  },

  async verifyAddress(address: string): Promise<{ valid: boolean; exists: boolean; formattedAddress?: string; error?: string }> {
    const res = await fetch('/api/wallet/verify-address', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ address }),
    });
    return res.json();
  },

  async getReceiveInfo(code: string) {
    const res = await fetch(`/api/receive/${encodeURIComponent(code)}`);
    if (!res.ok) throw new Error('معلومات المستلم غير صحيحة');
    return res.json();
  },

  async transfer(params: {
    recipientAddress: string;
    currency: Currency;
    amount: number;
    lockDurationSeconds: number;
    note?: string;
  }) {
    const res = await fetch('/api/transfer', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(params),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'فشل في تنفيذ التحويل');
    }
    return res.json();
  },

  async refundTransaction(id: string, reason?: string) {
    const res = await fetch(`/api/transactions/${id}/refund`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ reason }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'فشل في تنفيذ عملية الاسترجاع');
    }
    return res.json();
  },

  async triggerUnlockCheck() {
    const res = await fetch('/api/unlock-check', { method: 'POST', headers: getHeaders() });
    return res.json();
  },

  async fastForwardTx(txId: string) {
    const res = await fetch(`/api/transactions/${txId}/fast-forward`, {
      method: 'POST',
      headers: getHeaders(),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'فشل في تسريع القفل');
    }
    return res.json();
  },

  async getTransactions(filter?: { type?: string; currency?: string; status?: string }): Promise<Transaction[]> {
    const params = new URLSearchParams();
    if (filter?.type) params.append('type', filter.type);
    if (filter?.currency) params.append('currency', filter.currency);
    if (filter?.status) params.append('status', filter.status);

    const res = await fetch(`/api/transactions?${params.toString()}`, { headers: getHeaders() });
    if (!res.ok) throw new Error('فشل جلب المعاملات');
    return res.json();
  },

  async getTransaction(id: string): Promise<Transaction> {
    const res = await fetch(`/api/transactions/${id}`, { headers: getHeaders() });
    if (!res.ok) throw new Error('المعاملة غير موجودة');
    return res.json();
  },

  async getLockedFunds(): Promise<{ incomingLocked: Transaction[]; outgoingLocked: Transaction[]; serverTime: number }> {
    const res = await fetch('/api/locked-funds', { headers: getHeaders() });
    if (!res.ok) throw new Error('فشل جلب المبالغ المقفلة');
    return res.json();
  },

  async getNotifications(): Promise<{ notifications: NotificationItem[]; unreadCount: number }> {
    const res = await fetch('/api/notifications', { headers: getHeaders() });
    if (!res.ok) throw new Error('فشل جلب الإشعارات');
    return res.json();
  },

  async markNotificationRead(id: string) {
    await fetch(`/api/notifications/${id}/read`, { method: 'POST', headers: getHeaders() });
  },

  async markAllNotificationsRead() {
    await fetch('/api/notifications/read-all', { method: 'POST', headers: getHeaders() });
  },

  // Admin APIs
  async getAdminOverview() {
    const res = await fetch('/api/admin/overview', { headers: getHeaders() });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'فشل في جلب بيانات لوحة الإدارة');
    }
    return res.json();
  },

  async updateAdminUserStatus(userId: string, status: 'active' | 'suspended') {
    const res = await fetch(`/api/admin/users/${userId}/status`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'فشل في تعديل حالة المستخدم');
    }
    return res.json();
  },

  async updateAdminSettings(settings: Partial<SystemSettings>) {
    const res = await fetch('/api/admin/settings', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(settings),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'فشل في تحديث إعدادات النظام');
    }
    return res.json();
  },

  async getAdminAuditLogs(): Promise<AuditLogEntry[]> {
    const res = await fetch('/api/admin/audit-logs', { headers: getHeaders() });
    if (!res.ok) throw new Error('فشل في جلب سجل التدقيق');
    return res.json();
  },

  async getAdminErrorLogs(): Promise<OperationalError[]> {
    const res = await fetch('/api/admin/error-logs', { headers: getHeaders() });
    if (!res.ok) throw new Error('فشل في جلب سجل الأخطاء');
    return res.json();
  },

  async resetAdminDemo() {
    const res = await fetch('/api/admin/reset-demo', { method: 'POST', headers: getHeaders() });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'فشل في إعادة ضبط النظام');
    }
    return res.json();
  },
};
