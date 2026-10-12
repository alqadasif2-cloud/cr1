export type Currency = 'BTC' | 'ETH' | 'USDT';

export interface CurrencyBalance {
  available: number;
  locked: number;
}

export interface UserWallet {
  id: string;
  userId: string;
  address: string;
  receiveCode: string;
  createdAt: number;
  balances: {
    BTC: CurrencyBalance;
    ETH: CurrencyBalance;
    USDT: CurrencyBalance;
  };
}

export type UserRole = 'owner' | 'user';

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  status: 'active' | 'suspended';
  walletId: string;
  createdAt: number;
}

export type TransactionStatus = 'COMPLETED' | 'LOCKED' | 'FAILED' | 'REJECTED' | 'REFUNDED';
export type TransactionSource = 'internal_transfer' | 'historical_seed' | 'internal_refund';

export interface Transaction {
  id: string;
  senderUserId: string;
  recipientUserId: string;
  senderAddress: string;
  recipientAddress: string;
  senderName: string;
  recipientName: string;
  currency: Currency;
  amount: number;
  fee: number;
  lockDurationSeconds: number;
  createdAt: number;
  unlockAt: number | null;
  unlockedAt: number | null;
  status: TransactionStatus;
  source: TransactionSource;
  isHistorical?: boolean;
  historicalDateText?: string;
  historicalTimeText?: string;
  historicalNote?: string;
  associatedSender?: string;
  isRefund?: boolean;
  refunded?: boolean;
  refundTxId?: string;
  relatedTxId?: string;
  note?: string;
  txHash: string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  titleAr: string;
  message: string;
  messageAr: string;
  type: 'RECEIVED' | 'SENT' | 'UNLOCKED' | 'SYSTEM' | 'SECURITY' | 'REFUND';
  createdAt: number;
  read: boolean;
  relatedTxId?: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: number;
  actorId: string;
  actorUsername: string;
  action: string;
  details: string;
}

export interface OperationalError {
  id: string;
  timestamp: number;
  message: string;
  context: string;
}

export interface SystemSettings {
  maxLockDurationDays: number;
  allowCustomLocks: boolean;
  defaultNetworkFeeUsdt: number;
  historicalYear: string | null;
  historicalBalanceImpact: 'display_only' | 'affect_balance';
  initialBalances: {
    BTC: number;
    ETH: number;
    USDT: number;
  };
}
