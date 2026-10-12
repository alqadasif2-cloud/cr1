import express from 'express';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);
const isProd = process.env.NODE_ENV === 'production';

app.use(express.json());

// ================= DATA MODELS =================
export type Currency = 'BTC' | 'ETH' | 'USDT';
export type UserRole = 'owner' | 'user';
export type TransactionStatus = 'COMPLETED' | 'LOCKED' | 'FAILED' | 'REJECTED' | 'REFUNDED';
export type TransactionSource = 'internal_transfer' | 'historical_seed' | 'internal_refund';

interface User {
  id: string;
  username: string;
  name: string;
  passwordHash: string;
  role: UserRole;
  createdAt: number;
  status: 'active' | 'suspended';
  walletId: string;
}

interface Wallet {
  id: string;
  userId: string;
  address: string; // 0x... 40 hex chars
  receiveCode: string; // 10 chars
  createdAt: number;
  balances: {
    BTC: { available: number; locked: number };
    ETH: { available: number; locked: number };
    USDT: { available: number; locked: number };
  };
}

interface Transaction {
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

interface Notification {
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

interface AuditLogEntry {
  id: string;
  timestamp: number;
  actorId: string;
  actorUsername: string;
  action: string;
  details: string;
}

interface OperationalError {
  id: string;
  timestamp: number;
  message: string;
  context: string;
}

interface SystemSettings {
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

interface DatabaseSchema {
  users: User[];
  wallets: Wallet[];
  transactions: Transaction[];
  notifications: Notification[];
  auditLogs: AuditLogEntry[];
  errorLogs: OperationalError[];
  settings: SystemSettings;
}

const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password + 'crypto_salt_2026_secure').digest('hex');
}

function generate0xAddress(): string {
  return '0x' + crypto.randomBytes(20).toString('hex');
}

function generateReceiveCode(): string {
  return crypto.randomBytes(5).toString('hex');
}

function generateTxHash(): string {
  return '0x' + crypto.randomBytes(32).toString('hex');
}

function logOperationalError(message: string, context: string) {
  try {
    if (db && Array.isArray(db.errorLogs)) {
      db.errorLogs.unshift({
        id: 'err_' + crypto.randomBytes(4).toString('hex'),
        timestamp: Date.now(),
        message,
        context,
      });
      if (db.errorLogs.length > 100) db.errorLogs = db.errorLogs.slice(0, 100);
    }
  } catch (e) {
    console.error('Failed to log operational error:', e);
  }
}

function logAudit(actorId: string, actorUsername: string, action: string, details: string) {
  try {
    if (db && Array.isArray(db.auditLogs)) {
      db.auditLogs.unshift({
        id: 'audit_' + crypto.randomBytes(6).toString('hex'),
        timestamp: Date.now(),
        actorId,
        actorUsername,
        action,
        details,
      });
      if (db.auditLogs.length > 200) db.auditLogs = db.auditLogs.slice(0, 200);
    }
  } catch (e) {
    console.error('Failed to log audit event:', e);
  }
}

// ================= DATABASE INITIALIZATION & IDEMPOTENT SEED =================
function createInitialDatabase(): DatabaseSchema {
  const now = Date.now();

  const samUser: User = {
    id: 'usr_sam_owner',
    username: 'sam',
    name: 'Sam',
    passwordHash: hashPassword('1234'),
    role: 'owner',
    createdAt: now - 86400000 * 10,
    status: 'active',
    walletId: 'wlt_sam_owner',
  };

  const samWallet: Wallet = {
    id: 'wlt_sam_owner',
    userId: 'usr_sam_owner',
    address: '0x7a91c4e82d6f3b105a9e7c2d8f41b6039a5d72e1',
    receiveCode: 'sam1000usd',
    createdAt: now - 86400000 * 10,
    balances: {
      BTC: { available: 0, locked: 0 },
      ETH: { available: 0, locked: 0 },
      USDT: { available: 1000.0, locked: 0 }, // Initial 1,000 USD
    },
  };

  const eslamUser: User = {
    id: 'usr_eslam_alqadasi',
    username: 'eslam alqadasi',
    name: 'Eslam',
    passwordHash: hashPassword('Eslam@2es'),
    role: 'user',
    createdAt: now - 86400000 * 5,
    status: 'active',
    walletId: 'wlt_eslam_alqadasi',
  };

  const eslamWallet: Wallet = {
    id: 'wlt_eslam_alqadasi',
    userId: 'usr_eslam_alqadasi',
    address: '0x3f82b1d94c7e6a502b8d9c1e7a50f3b48c2e61a9',
    receiveCode: 'eslamwallet',
    createdAt: now - 86400000 * 5,
    balances: {
      BTC: { available: 0, locked: 0 },
      ETH: { available: 0, locked: 0 },
      USDT: { available: 0.0, locked: 0 }, // Starts with 0.00 USD
    },
  };

  const historicalTxs: Transaction[] = [
    {
      id: 'tx_hist_eslam_1',
      senderUserId: 'usr_historical_seed',
      recipientUserId: 'usr_eslam_alqadasi',
      senderAddress: '0x0000000000000000000000000000000000000001',
      recipientAddress: '0x3f82b1d94c7e6a502b8d9c1e7a50f3b48c2e61a9',
      senderName: 'إيداع افتراضي',
      recipientName: 'Eslam',
      currency: 'USDT',
      amount: 100.0,
      fee: 0,
      lockDurationSeconds: 0,
      createdAt: 1728274260000, // Oct 7 morning
      unlockAt: null,
      unlockedAt: null,
      status: 'COMPLETED',
      source: 'historical_seed',
      isHistorical: true,
      historicalDateText: '7 أكتوبر',
      historicalTimeText: '5:11 صباحًا',
      historicalNote: 'سجل تاريخي مدخل مسبقًا في بيئة المحاكاة.',
      note: 'استلام مبلغ',
      txHash: '0x7a81000000000000000000000000000000000000000000000000000000000001',
    },
    {
      id: 'tx_hist_eslam_2',
      senderUserId: 'usr_historical_seed',
      recipientUserId: 'usr_eslam_alqadasi',
      senderAddress: '0x0000000000000000000000000000000000000002',
      recipientAddress: '0x3f82b1d94c7e6a502b8d9c1e7a50f3b48c2e61a9',
      senderName: 'إيداع افتراضي',
      recipientName: 'Eslam',
      currency: 'USDT',
      amount: 50.0,
      fee: 0,
      lockDurationSeconds: 0,
      createdAt: 1728460200000, // Oct 9 8:30 AM
      unlockAt: null,
      unlockedAt: null,
      status: 'COMPLETED',
      source: 'historical_seed',
      isHistorical: true,
      historicalDateText: '9 أكتوبر',
      historicalTimeText: '8:30 صباحًا',
      historicalNote: 'سجل تاريخي مدخل مسبقًا في بيئة المحاكاة.',
      note: 'استلام مبلغ',
      txHash: '0x7a81000000000000000000000000000000000000000000000000000000000002',
    },
    {
      id: 'tx_hist_eslam_3',
      senderUserId: 'usr_historical_seed',
      recipientUserId: 'usr_eslam_alqadasi',
      senderAddress: '0x0000000000000000000000000000000000000003',
      recipientAddress: '0x3f82b1d94c7e6a502b8d9c1e7a50f3b48c2e61a9',
      senderName: 'إيداع افتراضي',
      recipientName: 'Eslam',
      currency: 'USDT',
      amount: 150.0,
      fee: 0,
      lockDurationSeconds: 0,
      createdAt: 1728484500000, // Oct 9 3:15 PM
      unlockAt: null,
      unlockedAt: null,
      status: 'COMPLETED',
      source: 'historical_seed',
      isHistorical: true,
      historicalDateText: '9 أكتوبر',
      historicalTimeText: '3:15 مساءً',
      historicalNote: 'سجل تاريخي مدخل مسبقًا في بيئة المحاكاة.',
      note: 'استلام مبلغ',
      txHash: '0x7a81000000000000000000000000000000000000000000000000000000000003',
    },
    {
      id: 'tx_hist_eslam_4',
      senderUserId: 'usr_sami_historical',
      recipientUserId: 'usr_eslam_alqadasi',
      senderAddress: '0x0000000000000000000000000000000000000004',
      recipientAddress: '0x3f82b1d94c7e6a502b8d9c1e7a50f3b48c2e61a9',
      senderName: 'Sami',
      associatedSender: 'Sami',
      recipientName: 'Eslam',
      currency: 'USDT',
      amount: 300.0,
      fee: 0,
      lockDurationSeconds: 0,
      createdAt: 1728505200000, // Oct 9 9:00 PM
      unlockAt: null,
      unlockedAt: null,
      status: 'COMPLETED',
      source: 'historical_seed',
      isHistorical: true,
      isRefund: true,
      historicalDateText: '9 أكتوبر',
      historicalTimeText: '9:00 مساءً',
      historicalNote: 'سجل تاريخي مدخل مسبقًا في بيئة المحاكاة.',
      note: 'استرجاع مبلغ مرتبط بالمرسل Sami',
      txHash: '0x7a81000000000000000000000000000000000000000000000000000000000004',
    },
  ];

  return {
    users: [samUser, eslamUser],
    wallets: [samWallet, eslamWallet],
    transactions: historicalTxs,
    notifications: [
      {
        id: 'notif_welcome_sam',
        userId: 'usr_sam_owner',
        title: 'مرحباً مالك النظام Sam',
        titleAr: 'مرحباً مالك النظام Sam',
        message: 'تم تفعيل حساب المالك بنجاح برصيد ابتدائي 1,000 USD وصلاحيات إدارة النظام الكاملة.',
        messageAr: 'تم تفعيل حساب المالك بنجاح برصيد ابتدائي 1,000 USD وصلاحيات إدارة النظام الكاملة.',
        type: 'SYSTEM',
        createdAt: now,
        read: false,
      },
      {
        id: 'notif_welcome_eslam',
        userId: 'usr_eslam_alqadasi',
        title: 'مرحباً بك Eslam',
        titleAr: 'مرحباً بك Eslam',
        message: 'تم تفعيل محفظتك المستقلة برصيد ابتدائي 0.00 USD مع تسجيل العمليات التاريخية في سجل نشاطك.',
        messageAr: 'تم تفعيل محفظتك المستقلة برصيد ابتدائي 0.00 USD مع تسجيل العمليات التاريخية في سجل نشاطك.',
        type: 'SYSTEM',
        createdAt: now,
        read: false,
      },
    ],
    auditLogs: [
      {
        id: 'audit_init_1',
        timestamp: now,
        actorId: 'system',
        actorUsername: 'system',
        action: 'SYSTEM_INITIALIZATION',
        details: 'تمت تهيئة الحسابات الأساسية (حساب المالك Sam برصيد 1,000 USD وحساب Eslam برصيد 0 USD والسجلات التاريخية الأربعة).',
      },
    ],
    errorLogs: [],
    settings: {
      maxLockDurationDays: 30,
      allowCustomLocks: true,
      defaultNetworkFeeUsdt: 0,
      historicalYear: null,
      historicalBalanceImpact: 'display_only',
      initialBalances: {
        BTC: 0,
        ETH: 0,
        USDT: 0, // All new users start with 0.00 USD
      },
    },
  };
}

let db: DatabaseSchema;

function ensureSeeds(currentDb: DatabaseSchema): DatabaseSchema {
  let modified = false;

  if (!Array.isArray(currentDb.auditLogs)) {
    currentDb.auditLogs = [];
    modified = true;
  }
  if (!Array.isArray(currentDb.errorLogs)) {
    currentDb.errorLogs = [];
    modified = true;
  }
  if (!currentDb.settings) {
    currentDb.settings = {
      maxLockDurationDays: 30,
      allowCustomLocks: true,
      defaultNetworkFeeUsdt: 0,
      historicalYear: null,
      historicalBalanceImpact: 'display_only',
      initialBalances: { BTC: 0, ETH: 0, USDT: 0 },
    };
    modified = true;
  } else {
    if (currentDb.settings.initialBalances) {
      currentDb.settings.initialBalances = { BTC: 0, ETH: 0, USDT: 0 };
    }
  }

  // 1. Ensure Sam Owner Account exists idempotently
  let sam = currentDb.users.find((u) => u.username.toLowerCase() === 'sam');
  if (!sam) {
    const samUser: User = {
      id: 'usr_sam_owner',
      username: 'sam',
      name: 'Sam',
      passwordHash: hashPassword('1234'),
      role: 'owner',
      createdAt: Date.now() - 86400000 * 10,
      status: 'active',
      walletId: 'wlt_sam_owner',
    };
    currentDb.users.push(samUser);

    let samWallet = currentDb.wallets.find((w) => w.userId === 'usr_sam_owner');
    if (!samWallet) {
      samWallet = {
        id: 'wlt_sam_owner',
        userId: 'usr_sam_owner',
        address: '0x7a91c4e82d6f3b105a9e7c2d8f41b6039a5d72e1',
        receiveCode: 'sam1000usd',
        createdAt: Date.now() - 86400000 * 10,
        balances: {
          BTC: { available: 0, locked: 0 },
          ETH: { available: 0, locked: 0 },
          USDT: { available: 1000.0, locked: 0 },
        },
      };
      currentDb.wallets.push(samWallet);
    }
    modified = true;
  } else {
    // Ensure role is owner
    if (sam.role !== 'owner') {
      sam.role = 'owner';
      modified = true;
    }
  }

  // 2. Ensure Eslam Alqadasi Account exists idempotently
  let eslam = currentDb.users.find(
    (u) => u.username.toLowerCase() === 'eslam alqadasi' || u.username.toLowerCase() === 'eslam'
  );
  if (!eslam) {
    const eslamUser: User = {
      id: 'usr_eslam_alqadasi',
      username: 'eslam alqadasi',
      name: 'Eslam',
      passwordHash: hashPassword('Eslam@2es'),
      role: 'user',
      createdAt: Date.now() - 86400000 * 5,
      status: 'active',
      walletId: 'wlt_eslam_alqadasi',
    };
    currentDb.users.push(eslamUser);

    let eslamWallet = currentDb.wallets.find((w) => w.userId === 'usr_eslam_alqadasi');
    if (!eslamWallet) {
      eslamWallet = {
        id: 'wlt_eslam_alqadasi',
        userId: 'usr_eslam_alqadasi',
        address: '0x3f82b1d94c7e6a502b8d9c1e7a50f3b48c2e61a9',
        receiveCode: 'eslamwallet',
        createdAt: Date.now() - 86400000 * 5,
        balances: {
          BTC: { available: 0, locked: 0 },
          ETH: { available: 0, locked: 0 },
          USDT: { available: 0.0, locked: 0 },
        },
      };
      currentDb.wallets.push(eslamWallet);
    }
    modified = true;
  }

  // 3. Ensure 4 Historical Transactions for Eslam exist idempotently
  const histTxs: Transaction[] = [
    {
      id: 'tx_hist_eslam_1',
      senderUserId: 'usr_historical_seed',
      recipientUserId: 'usr_eslam_alqadasi',
      senderAddress: '0x0000000000000000000000000000000000000001',
      recipientAddress: '0x3f82b1d94c7e6a502b8d9c1e7a50f3b48c2e61a9',
      senderName: 'إيداع افتراضي',
      recipientName: 'Eslam',
      currency: 'USDT',
      amount: 100.0,
      fee: 0,
      lockDurationSeconds: 0,
      createdAt: 1728274260000,
      unlockAt: null,
      unlockedAt: null,
      status: 'COMPLETED',
      source: 'historical_seed',
      isHistorical: true,
      historicalDateText: '7 أكتوبر',
      historicalTimeText: '5:11 صباحًا',
      historicalNote: 'سجل تاريخي مدخل مسبقًا في بيئة المحاكاة.',
      note: 'استلام مبلغ',
      txHash: '0x7a81000000000000000000000000000000000000000000000000000000000001',
    },
    {
      id: 'tx_hist_eslam_2',
      senderUserId: 'usr_historical_seed',
      recipientUserId: 'usr_eslam_alqadasi',
      senderAddress: '0x0000000000000000000000000000000000000002',
      recipientAddress: '0x3f82b1d94c7e6a502b8d9c1e7a50f3b48c2e61a9',
      senderName: 'إيداع افتراضي',
      recipientName: 'Eslam',
      currency: 'USDT',
      amount: 50.0,
      fee: 0,
      lockDurationSeconds: 0,
      createdAt: 1728460200000,
      unlockAt: null,
      unlockedAt: null,
      status: 'COMPLETED',
      source: 'historical_seed',
      isHistorical: true,
      historicalDateText: '9 أكتوبر',
      historicalTimeText: '8:30 صباحًا',
      historicalNote: 'سجل تاريخي مدخل مسبقًا في بيئة المحاكاة.',
      note: 'استلام مبلغ',
      txHash: '0x7a81000000000000000000000000000000000000000000000000000000000002',
    },
    {
      id: 'tx_hist_eslam_3',
      senderUserId: 'usr_historical_seed',
      recipientUserId: 'usr_eslam_alqadasi',
      senderAddress: '0x0000000000000000000000000000000000000003',
      recipientAddress: '0x3f82b1d94c7e6a502b8d9c1e7a50f3b48c2e61a9',
      senderName: 'إيداع افتراضي',
      recipientName: 'Eslam',
      currency: 'USDT',
      amount: 150.0,
      fee: 0,
      lockDurationSeconds: 0,
      createdAt: 1728484500000,
      unlockAt: null,
      unlockedAt: null,
      status: 'COMPLETED',
      source: 'historical_seed',
      isHistorical: true,
      historicalDateText: '9 أكتوبر',
      historicalTimeText: '3:15 مساءً',
      historicalNote: 'سجل تاريخي مدخل مسبقًا في بيئة المحاكاة.',
      note: 'استلام مبلغ',
      txHash: '0x7a81000000000000000000000000000000000000000000000000000000000003',
    },
    {
      id: 'tx_hist_eslam_4',
      senderUserId: 'usr_sami_historical',
      recipientUserId: 'usr_eslam_alqadasi',
      senderAddress: '0x0000000000000000000000000000000000000004',
      recipientAddress: '0x3f82b1d94c7e6a502b8d9c1e7a50f3b48c2e61a9',
      senderName: 'Sami',
      associatedSender: 'Sami',
      recipientName: 'Eslam',
      currency: 'USDT',
      amount: 300.0,
      fee: 0,
      lockDurationSeconds: 0,
      createdAt: 1728505200000,
      unlockAt: null,
      unlockedAt: null,
      status: 'COMPLETED',
      source: 'historical_seed',
      isHistorical: true,
      isRefund: true,
      historicalDateText: '9 أكتوبر',
      historicalTimeText: '9:00 مساءً',
      historicalNote: 'سجل تاريخي مدخل مسبقًا في بيئة المحاكاة.',
      note: 'استرجاع مبلغ مرتبط بالمرسل Sami',
      txHash: '0x7a81000000000000000000000000000000000000000000000000000000000004',
    },
  ];

  for (const htx of histTxs) {
    if (!currentDb.transactions.some((t) => t.id === htx.id)) {
      currentDb.transactions.push(htx);
      modified = true;
    }
  }

  // Ensure all users have roles
  for (const u of currentDb.users) {
    if (!u.role) {
      u.role = u.username.toLowerCase() === 'sam' ? 'owner' : 'user';
      modified = true;
    }
  }

  return currentDb;
}

function loadDatabase(): DatabaseSchema {
  try {
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      const migrated = ensureSeeds(parsed);
      saveDatabase(migrated);
      return migrated;
    }
  } catch (err) {
    console.error('Error reading db.json, creating new database:', err);
  }
  const initial = createInitialDatabase();
  saveDatabase(initial);
  return initial;
}

function saveDatabase(dataToSave: DatabaseSchema = db) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(dataToSave, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving db.json:', err);
  }
}

db = loadDatabase();

// ================= TIMELOCK BACKGROUND ENGINE =================
function processTimeLocks() {
  const now = Date.now();
  let updated = false;

  for (const tx of db.transactions) {
    if (tx.status === 'LOCKED' && tx.unlockAt && now >= tx.unlockAt) {
      const recipientWallet = db.wallets.find((w) => w.userId === tx.recipientUserId);
      if (recipientWallet) {
        const bal = recipientWallet.balances[tx.currency];
        if (bal) {
          bal.locked = Math.max(0, bal.locked - tx.amount);
          bal.available = bal.available + tx.amount;
        }
      }

      tx.status = 'COMPLETED';
      tx.unlockedAt = now;
      updated = true;

      db.notifications.unshift({
        id: 'notif_unlock_' + crypto.randomBytes(4).toString('hex'),
        userId: tx.recipientUserId,
        title: 'أصبح الرصيد متاحاً!',
        titleAr: 'أصبح الرصيد متاحاً!',
        message: `تم فك قفل ${tx.amount} ${tx.currency} وأصبح متاحاً للاستخدام بالكامل في محفظتك.`,
        messageAr: `تم فك قفل ${tx.amount} ${tx.currency} وأصبح متاحاً للاستخدام بالكامل في محفظتك.`,
        type: 'UNLOCKED',
        createdAt: now,
        read: false,
        relatedTxId: tx.id,
      });

      console.log(`[TimeLock Released] Tx ${tx.id} for user ${tx.recipientUserId}: ${tx.amount} ${tx.currency}`);
    }
  }

  if (updated) {
    saveDatabase();
  }
}

setInterval(processTimeLocks, 3000);

// ================= AUTH HELPERS =================
function getAuthUser(req: express.Request): User | null {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const user = db.users.find((u) => u.id === token);
    if (user) return user;
  }
  const customUserId = req.headers['x-user-id'] as string;
  if (customUserId) {
    const user = db.users.find((u) => u.id === customUserId);
    if (user) return user;
  }
  return null;
}

function requireAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({ error: 'يرجى تسجيل الدخول أولاً' });
  }
  if (user.status === 'suspended') {
    return res.status(403).json({ error: 'تم تعليق هذا الحساب من قِبل إدارة النظام' });
  }
  (req as any).user = user;
  next();
}

function requireOwner(req: express.Request, res: express.Response, next: express.NextFunction) {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({ error: 'يرجى تسجيل الدخول أولاً' });
  }
  if (user.role !== 'owner') {
    return res.status(403).json({ error: 'غير مصرح: هذه العملية مخصصة لمالك النظام فقط (Sam)' });
  }
  (req as any).user = user;
  next();
}

// ================= API ROUTES =================

app.use('/api', (req, res, next) => {
  processTimeLocks();
  next();
});

// 1. Register (All new users start with 0.00 USD, role: 'user')
app.post('/api/auth/register', (req, res) => {
  try {
    const { username, name, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'اسم المستخدم وكلمة المرور مطلوبان' });
    }

    const cleanUsername = username.trim().toLowerCase();
    if (db.users.some((u) => u.username.toLowerCase() === cleanUsername)) {
      return res.status(400).json({ error: 'اسم المستخدم مسجل مسبقاً، يرجى اختيار اسم آخر' });
    }

    if (password.length < 4) {
      return res.status(400).json({ error: 'يجب أن تتكون كلمة المرور من 4 أحرف على الأقل' });
    }

    const userId = 'usr_' + crypto.randomBytes(6).toString('hex');
    const walletId = 'wlt_' + crypto.randomBytes(6).toString('hex');

    let address = generate0xAddress();
    while (db.wallets.some((w) => w.address === address)) {
      address = generate0xAddress();
    }

    let receiveCode = generateReceiveCode();
    while (db.wallets.some((w) => w.receiveCode === receiveCode)) {
      receiveCode = generateReceiveCode();
    }

    const now = Date.now();

    const newUser: User = {
      id: userId,
      username: cleanUsername,
      name: name?.trim() || cleanUsername,
      passwordHash: hashPassword(password),
      role: 'user', // NEVER assign owner from client
      createdAt: now,
      status: 'active',
      walletId,
    };

    // STRICT REQUIREMENT: All new users get 0.00 USD balance
    const newWallet: Wallet = {
      id: walletId,
      userId,
      address,
      receiveCode,
      createdAt: now,
      balances: {
        BTC: { available: 0, locked: 0 },
        ETH: { available: 0, locked: 0 },
        USDT: { available: 0, locked: 0 },
      },
    };

    db.users.push(newUser);
    db.wallets.push(newWallet);

    db.notifications.unshift({
      id: 'notif_welcome_' + crypto.randomBytes(4).toString('hex'),
      userId,
      title: 'مرحباً بك في Crypto Wallet!',
      titleAr: 'مرحباً بك في Crypto Wallet!',
      message: `تم إنشاء محفظتك الافتراضية بنجاح بالعنوان ${address}. رصيدك الابتدائي: 0.00 USD.`,
      messageAr: `تم إنشاء محفظتك الافتراضية بنجاح بالعنوان ${address}. رصيدك الابتدائي: 0.00 USD.`,
      type: 'SYSTEM',
      createdAt: now,
      read: false,
    });

    logAudit(userId, cleanUsername, 'USER_REGISTER', `إنشاء حساب جديد للمستخدم ${cleanUsername}`);
    saveDatabase();

    res.json({
      token: userId,
      user: {
        id: newUser.id,
        username: newUser.username,
        name: newUser.name,
        role: newUser.role,
        status: newUser.status,
        walletId: newUser.walletId,
        createdAt: newUser.createdAt,
      },
      wallet: newWallet,
    });
  } catch (err: any) {
    logOperationalError(err.message, 'register');
    res.status(500).json({ error: 'حدث خطأ أثناء إنشاء الحساب' });
  }
});

// 2. Login
app.post('/api/auth/login', (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'يرجى إدخال اسم المستخدم وكلمة المرور' });
    }

    const cleanUsername = username.trim().toLowerCase();
    const user = db.users.find((u) => u.username.toLowerCase() === cleanUsername);

    if (!user || user.passwordHash !== hashPassword(password)) {
      return res.status(401).json({ error: 'اسم المستخدم أو كلمة المرور غير صحيحة' });
    }

    if (user.status === 'suspended') {
      return res.status(403).json({ error: 'تم تعليق هذا الحساب. يرجى مراجعة إدارة النظام' });
    }

    const wallet = db.wallets.find((w) => w.userId === user.id);

    res.json({
      token: user.id,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
        status: user.status,
        walletId: user.walletId,
        createdAt: user.createdAt,
      },
      wallet,
    });
  } catch (err: any) {
    logOperationalError(err.message, 'login');
    res.status(500).json({ error: 'خطأ أثناء تسجيل الدخول' });
  }
});

// 3. Me
app.get('/api/auth/me', requireAuth, (req, res) => {
  const user = (req as any).user as User;
  const wallet = db.wallets.find((w) => w.userId === user.id);
  res.json({
    user: {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      status: user.status,
      walletId: user.walletId,
      createdAt: user.createdAt,
    },
    wallet,
  });
});

// 4. Change Password
app.post('/api/auth/change-password', requireAuth, (req, res) => {
  try {
    const user = (req as any).user as User;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'يرجى إدخال كلمة المرور الحالية والجديدة' });
    }

    if (user.passwordHash !== hashPassword(currentPassword)) {
      return res.status(400).json({ error: 'كلمة المرور الحالية غير صحيحة' });
    }

    if (newPassword.length < 4) {
      return res.status(400).json({ error: 'يجب ألا تقل كلمة المرور الجديدة عن 4 أحرف' });
    }

    user.passwordHash = hashPassword(newPassword);

    db.notifications.unshift({
      id: 'notif_pw_' + crypto.randomBytes(4).toString('hex'),
      userId: user.id,
      title: 'تم تغيير كلمة المرور',
      titleAr: 'تم تغيير كلمة المرور',
      message: 'تم تحديث كلمة المرور الخاصة بحسابك بنجاح.',
      messageAr: 'تم تحديث كلمة المرور الخاصة بحسابك بنجاح.',
      type: 'SECURITY',
      createdAt: Date.now(),
      read: false,
    });

    logAudit(user.id, user.username, 'PASSWORD_CHANGE', `تغيير كلمة المرور للمستخدم ${user.username}`);
    saveDatabase();

    res.json({ success: true, message: 'تم تغيير كلمة المرور بنجاح' });
  } catch (err: any) {
    logOperationalError(err.message, 'change-password');
    res.status(500).json({ error: 'خطأ أثناء تغيير كلمة المرور' });
  }
});

// 5. Wallet Details
app.get('/api/wallet', requireAuth, (req, res) => {
  const user = (req as any).user as User;
  const wallet = db.wallets.find((w) => w.userId === user.id);
  if (!wallet) return res.status(404).json({ error: 'المحفظة غير موجودة' });

  const btcAvailable = wallet.balances.BTC.available;
  const btcLocked = wallet.balances.BTC.locked;
  const ethAvailable = wallet.balances.ETH.available;
  const ethLocked = wallet.balances.ETH.locked;
  const usdtAvailable = wallet.balances.USDT.available;
  const usdtLocked = wallet.balances.USDT.locked;

  const availableUsdtEquivalent = (btcAvailable * 68500) + (ethAvailable * 3450) + usdtAvailable;
  const lockedUsdtEquivalent = (btcLocked * 68500) + (ethLocked * 3450) + usdtLocked;
  const totalUsdtEquivalent = availableUsdtEquivalent + lockedUsdtEquivalent;

  res.json({
    wallet,
    rates: {
      BTC: 68500,
      ETH: 3450,
      USDT: 1.0,
    },
    totalUsdtEquivalent,
    availableUsdtEquivalent,
    lockedUsdtEquivalent,
  });
});

// 6. Address Verification Endpoint (Privacy-safe: checks validity without leaking owner name, email or balance)
app.post('/api/wallet/verify-address', requireAuth, (req, res) => {
  const { address } = req.body;
  if (!address || typeof address !== 'string') {
    return res.status(400).json({ valid: false, error: 'العنوان مطلوب' });
  }

  const clean = address.trim().toLowerCase();
  const found = db.wallets.find(
    (w) => w.address.toLowerCase() === clean || w.receiveCode.toLowerCase() === clean
  );

  if (!found) {
    return res.json({ valid: false, exists: false, error: 'عنوان المحفظة غير مسجل في النظام' });
  }

  const currentUser = (req as any).user as User;
  if (found.userId === currentUser.id) {
    return res.json({ valid: false, exists: true, isSelf: true, error: 'لا يمكن التحويل لنفس المحفظة' });
  }

  res.json({
    valid: true,
    exists: true,
    formattedAddress: found.address,
  });
});

// 7. Transfer Funds with Optional Time-Lock (Server Authoritative & Atomic)
app.post('/api/transfer', requireAuth, (req, res) => {
  try {
    const user = (req as any).user as User;
    const { recipientAddress, currency, amount, lockDurationSeconds, note } = req.body;

    if (!recipientAddress || !currency || !amount) {
      return res.status(400).json({ error: 'يرجى تعبئة جميع الحقول المطلوبة' });
    }

    const cleanRecipient = recipientAddress.trim().toLowerCase();
    const numAmount = parseFloat(amount);

    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({ error: 'المبلغ غير صالح، يجب أن يكون أكبر من صفر' });
    }

    const validCurrencies: Currency[] = ['BTC', 'ETH', 'USDT'];
    if (!validCurrencies.includes(currency as Currency)) {
      return res.status(400).json({ error: 'العملة المختارة غير مدعومة' });
    }

    const senderWallet = db.wallets.find((w) => w.userId === user.id);
    if (!senderWallet) return res.status(400).json({ error: 'محفظة المرسل غير موجودة' });

    // Recipient lookup
    const recipientWallet = db.wallets.find(
      (w) => w.address.toLowerCase() === cleanRecipient || w.receiveCode.toLowerCase() === cleanRecipient
    );

    if (!recipientWallet) {
      return res.status(404).json({ error: 'عنوان المستلم غير مسجل بالنظام. تأكد من إدخال عنوان 0x صحيح' });
    }

    if (recipientWallet.userId === user.id) {
      return res.status(400).json({ error: 'لا يمكن إرسال رصيد لنفس المحفظة' });
    }

    const recipientUser = db.users.find((u) => u.id === recipientWallet.userId);
    if (recipientUser?.status === 'suspended') {
      return res.status(400).json({ error: 'محفظة المستلم موقوفة حالياً ولا يمكنها استلام مبالغ' });
    }

    // Atomic Balance Check
    const curr = currency as Currency;
    if (senderWallet.balances[curr].available < numAmount) {
      return res.status(400).json({
        error: `الرصيد المتاح غير كافٍ. المتاح حالياً: ${senderWallet.balances[curr].available} ${curr}`,
      });
    }

    const lockSeconds = Math.max(0, parseInt(lockDurationSeconds || 0, 10));
    const maxSeconds = db.settings.maxLockDurationDays * 86400;
    if (lockSeconds > maxSeconds) {
      return res.status(400).json({
        error: `مدة القفل تتجاوز الحد الأقصى المسموح به (${db.settings.maxLockDurationDays} يوماً)`,
      });
    }

    const now = Date.now();
    const isLocked = lockSeconds > 0;
    const unlockAt = isLocked ? now + (lockSeconds * 1000) : null;
    const txHash = generateTxHash();

    // Atomic balance updates
    senderWallet.balances[curr].available = parseFloat((senderWallet.balances[curr].available - numAmount).toFixed(6));

    if (isLocked) {
      recipientWallet.balances[curr].locked = parseFloat((recipientWallet.balances[curr].locked + numAmount).toFixed(6));
    } else {
      recipientWallet.balances[curr].available = parseFloat((recipientWallet.balances[curr].available + numAmount).toFixed(6));
    }

    const tx: Transaction = {
      id: 'tx_' + crypto.randomBytes(8).toString('hex'),
      senderUserId: user.id,
      recipientUserId: recipientWallet.userId,
      senderAddress: senderWallet.address,
      recipientAddress: recipientWallet.address,
      senderName: user.name,
      recipientName: recipientUser?.name || 'مستلم',
      currency: curr,
      amount: numAmount,
      fee: 0,
      lockDurationSeconds: lockSeconds,
      createdAt: now,
      unlockAt,
      unlockedAt: null,
      status: isLocked ? 'LOCKED' : 'COMPLETED',
      source: 'internal_transfer',
      note: note?.trim() || '',
      txHash,
    };

    db.transactions.unshift(tx);

    const lockDesc = isLocked
      ? lockSeconds >= 86400
        ? `${Math.round(lockSeconds / 86400)} يوم`
        : lockSeconds >= 3600
        ? `${Math.round(lockSeconds / 3600)} ساعة`
        : `${Math.round(lockSeconds / 60)} دقيقة`
      : '';

    // Notifications strictly for the 2 parties
    db.notifications.unshift({
      id: 'notif_' + crypto.randomBytes(6).toString('hex'),
      userId: recipientWallet.userId,
      title: isLocked ? 'تحويل وارد مقفل' : 'تحويل وارد جديد',
      titleAr: isLocked ? 'تحويل وارد مقفل' : 'تحويل وارد جديد',
      message: isLocked
        ? `استلمت ${numAmount} ${curr} مقفلة لمدة (${lockDesc}) في محفظتك`
        : `استلمت ${numAmount} ${curr} في محفظتك الافتراضية`,
      messageAr: isLocked
        ? `استلمت ${numAmount} ${curr} مقفلة لمدة (${lockDesc}) في محفظتك`
        : `استلمت ${numAmount} ${curr} في محفظتك الافتراضية`,
      type: 'RECEIVED',
      createdAt: now,
      read: false,
      relatedTxId: tx.id,
    });

    db.notifications.unshift({
      id: 'notif_' + crypto.randomBytes(6).toString('hex'),
      userId: user.id,
      title: 'تم إرسال التحويل',
      titleAr: 'تم إرسال التحويل',
      message: isLocked
        ? `تم إرسال ${numAmount} ${curr} بنجاح إلى العنوان ${recipientWallet.address.substring(0, 10)}... مع قفل (${lockDesc})`
        : `تم إرسال ${numAmount} ${curr} بنجاح إلى العنوان ${recipientWallet.address.substring(0, 10)}...`,
      messageAr: isLocked
        ? `تم إرسال ${numAmount} ${curr} بنجاح إلى العنوان ${recipientWallet.address.substring(0, 10)}... مع قفل (${lockDesc})`
        : `تم إرسال ${numAmount} ${curr} بنجاح إلى العنوان ${recipientWallet.address.substring(0, 10)}...`,
      type: 'SENT',
      createdAt: now,
      read: false,
      relatedTxId: tx.id,
    });

    saveDatabase();

    res.json({
      success: true,
      transaction: tx,
      updatedBalances: senderWallet.balances,
    });
  } catch (err: any) {
    logOperationalError(err.message, 'transfer');
    res.status(500).json({ error: 'فشل في إتمام التحويل' });
  }
});

// 8. Refund / Reversal Operation
app.post('/api/transactions/:id/refund', requireAuth, (req, res) => {
  try {
    const user = (req as any).user as User;
    const { id } = req.params;
    const { reason } = req.body;

    const originalTx = db.transactions.find((t) => t.id === id);
    if (!originalTx) {
      return res.status(404).json({ error: 'المعاملة الأصلية غير موجودة' });
    }

    if (originalTx.isHistorical) {
      return res.status(400).json({ error: 'لا يمكن استرجاع السجلات التاريخية المعدة مسبقاً' });
    }

    if (originalTx.status !== 'COMPLETED') {
      return res.status(400).json({ error: 'لا يمكن استرجاع معاملة غير مكتملة أو مقفلة' });
    }

    if (originalTx.refunded) {
      return res.status(400).json({ error: 'تم استرجاع هذه المعاملة مسبقاً' });
    }

    // Authorization: only Owner Sam or the original sender can trigger/request refund
    if (user.role !== 'owner' && originalTx.senderUserId !== user.id) {
      return res.status(403).json({ error: 'غير مصرح لك بطلب استرجاع هذه المعاملة' });
    }

    const recipientWallet = db.wallets.find((w) => w.userId === originalTx.recipientUserId);
    const senderWallet = db.wallets.find((w) => w.userId === originalTx.senderUserId);

    if (!recipientWallet || !senderWallet) {
      return res.status(400).json({ error: 'محافظ المعاملة غير متوفرة' });
    }

    const curr = originalTx.currency;
    if (recipientWallet.balances[curr].available < originalTx.amount) {
      return res.status(400).json({
        error: `رصيد المستلم المتاح حالياً (${recipientWallet.balances[curr].available} ${curr}) لا يكفي لتنفيذ الاسترجاع`,
      });
    }

    // Atomic balance reversal
    recipientWallet.balances[curr].available = parseFloat((recipientWallet.balances[curr].available - originalTx.amount).toFixed(6));
    senderWallet.balances[curr].available = parseFloat((senderWallet.balances[curr].available + originalTx.amount).toFixed(6));

    const now = Date.now();
    const refundTxId = 'tx_refund_' + crypto.randomBytes(6).toString('hex');

    const refundTx: Transaction = {
      id: refundTxId,
      senderUserId: originalTx.recipientUserId,
      recipientUserId: originalTx.senderUserId,
      senderAddress: recipientWallet.address,
      recipientAddress: senderWallet.address,
      senderName: originalTx.recipientName,
      recipientName: originalTx.senderName,
      currency: curr,
      amount: originalTx.amount,
      fee: 0,
      lockDurationSeconds: 0,
      createdAt: now,
      unlockAt: null,
      unlockedAt: null,
      status: 'COMPLETED',
      source: 'internal_refund',
      isRefund: true,
      relatedTxId: originalTx.id,
      note: reason ? `استرجاع: ${reason}` : `استرجاع المعاملة ${originalTx.id}`,
      txHash: generateTxHash(),
    };

    originalTx.refunded = true;
    originalTx.refundTxId = refundTxId;

    db.transactions.unshift(refundTx);

    // Notifications
    db.notifications.unshift({
      id: 'notif_' + crypto.randomBytes(6).toString('hex'),
      userId: originalTx.senderUserId,
      title: 'تم استرجاع المبلغ',
      titleAr: 'تم استرجاع المبلغ',
      message: `تمت استعادة ${originalTx.amount} ${curr} إلى محفظتك بنجاح كعملية استرجاع.`,
      messageAr: `تمت استعادة ${originalTx.amount} ${curr} إلى محفظتك بنجاح كعملية استرجاع.`,
      type: 'REFUND',
      createdAt: now,
      read: false,
      relatedTxId: refundTxId,
    });

    db.notifications.unshift({
      id: 'notif_' + crypto.randomBytes(6).toString('hex'),
      userId: originalTx.recipientUserId,
      title: 'خصم استرجاع عملية',
      titleAr: 'خصم استرجاع عملية',
      message: `تم خصم ${originalTx.amount} ${curr} من رصيدك لإتمام عملية استرجاع المعاملة ${originalTx.id}.`,
      messageAr: `تم خصم ${originalTx.amount} ${curr} من رصيدك لإتمام عملية استرجاع المعاملة ${originalTx.id}.`,
      type: 'REFUND',
      createdAt: now,
      read: false,
      relatedTxId: refundTxId,
    });

    logAudit(
      user.id,
      user.username,
      'TRANSACTION_REFUND',
      `استرجاع المعاملة ${originalTx.id} بمبلغ ${originalTx.amount} ${curr}`
    );

    saveDatabase();

    res.json({
      success: true,
      refundTransaction: refundTx,
      message: 'تم إتمام عملية الاسترجاع بنجاح وتحديث الأرصدة',
    });
  } catch (err: any) {
    logOperationalError(err.message, 'refund');
    res.status(500).json({ error: 'فشل في تنفيذ الاسترجاع' });
  }
});

// 9. Fast-forward lock (testing helper)
app.post('/api/transactions/:id/fast-forward', requireAuth, (req, res) => {
  const { id } = req.params;
  const tx = db.transactions.find((t) => t.id === id);

  if (!tx) return res.status(404).json({ error: 'العملية غير موجودة' });
  if (tx.status !== 'LOCKED') return res.status(400).json({ error: 'العملية ليست مقفلة حالياً' });

  tx.unlockAt = Date.now() - 1000;
  processTimeLocks();

  res.json({ success: true, message: 'تم تسريع وقت القفل وإتاحة الرصيد فورياً للتجربة' });
});

// 10. Transactions List for authenticated user
app.get('/api/transactions', requireAuth, (req, res) => {
  const user = (req as any).user as User;
  const { type, currency, status } = req.query;

  // Filter only transactions related to this user
  let list = db.transactions.filter(
    (t) => t.senderUserId === user.id || t.recipientUserId === user.id
  );

  if (type === 'sent') {
    list = list.filter((t) => t.senderUserId === user.id && !t.isRefund);
  } else if (type === 'received') {
    list = list.filter((t) => t.recipientUserId === user.id && !t.isRefund);
  } else if (type === 'locked') {
    list = list.filter((t) => t.status === 'LOCKED');
  } else if (type === 'refund') {
    list = list.filter((t) => t.isRefund || t.refunded);
  }

  if (currency && currency !== 'all') {
    list = list.filter((t) => t.currency === currency);
  }

  if (status && status !== 'all') {
    list = list.filter((t) => t.status === status);
  }

  // Sort descending by createdAt
  list.sort((a, b) => b.createdAt - a.createdAt);

  res.json(list);
});

// 11. Transaction detail
app.get('/api/transactions/:id', requireAuth, (req, res) => {
  const user = (req as any).user as User;
  const { id } = req.params;
  const tx = db.transactions.find((t) => t.id === id);

  if (!tx) return res.status(404).json({ error: 'المعاملة غير موجودة' });

  // Privacy rule: user can only view their own transactions unless they are owner
  if (user.role !== 'owner' && tx.senderUserId !== user.id && tx.recipientUserId !== user.id) {
    return res.status(403).json({ error: 'غير مصرح لك بعرض هذه المعاملة' });
  }

  res.json(tx);
});

// 12. Locked Funds for user
app.get('/api/locked-funds', requireAuth, (req, res) => {
  const user = (req as any).user as User;

  const incomingLocked = db.transactions.filter(
    (t) => t.recipientUserId === user.id && t.status === 'LOCKED'
  );

  const outgoingLocked = db.transactions.filter(
    (t) => t.senderUserId === user.id && t.status === 'LOCKED'
  );

  res.json({
    incomingLocked,
    outgoingLocked,
    serverTime: Date.now(),
  });
});

// 13. Notifications
app.get('/api/notifications', requireAuth, (req, res) => {
  const user = (req as any).user as User;
  const userNotifs = db.notifications.filter((n) => n.userId === user.id);
  const unreadCount = userNotifs.filter((n) => !n.read).length;

  res.json({
    notifications: userNotifs,
    unreadCount,
  });
});

app.post('/api/notifications/:id/read', requireAuth, (req, res) => {
  const user = (req as any).user as User;
  const notif = db.notifications.find((n) => n.id === req.params.id && n.userId === user.id);
  if (notif) {
    notif.read = true;
    saveDatabase();
  }
  res.json({ success: true });
});

app.post('/api/notifications/read-all', requireAuth, (req, res) => {
  const user = (req as any).user as User;
  db.notifications.forEach((n) => {
    if (n.userId === user.id) n.read = true;
  });
  saveDatabase();
  res.json({ success: true });
});

// 14. Public receive code lookup (for shareable links)
app.get('/api/receive/:code', (req, res) => {
  const { code } = req.params;
  const cleanCode = code.trim().toLowerCase();

  const wallet = db.wallets.find(
    (w) => w.receiveCode.toLowerCase() === cleanCode || w.address.toLowerCase() === cleanCode
  );

  if (!wallet) {
    return res.status(404).json({ error: 'عنوان المحفظة أو رمز الاستلام غير مسجل' });
  }

  // Privacy rule: do not leak recipient real personal details or balances
  res.json({
    address: wallet.address,
    receiveCode: wallet.receiveCode,
    recipientLabel: 'محفظة رقمية افتراضية معتمدة',
    supportedCurrencies: ['USDT', 'BTC', 'ETH'],
  });
});

// ================= ADMIN APIS (OWNER ONLY - SAM) =================

// Admin Overview
app.get('/api/admin/overview', requireOwner, (req, res) => {
  const totalUsers = db.users.length;
  const totalTransactions = db.transactions.length;
  const activeLockedCount = db.transactions.filter((t) => t.status === 'LOCKED').length;
  const refundCount = db.transactions.filter((t) => t.isRefund || t.refunded).length;

  const users = db.users.map((u) => {
    const w = db.wallets.find((wl) => wl.userId === u.id);
    return {
      id: u.id,
      username: u.username,
      name: u.name,
      role: u.role,
      status: u.status,
      address: w?.address || '',
      receiveCode: w?.receiveCode || '',
      createdAt: u.createdAt,
      balances: w?.balances || {
        BTC: { available: 0, locked: 0 },
        ETH: { available: 0, locked: 0 },
        USDT: { available: 0, locked: 0 },
      },
    };
  });

  res.json({
    totalUsers,
    totalTransactions,
    activeLockedCount,
    refundCount,
    users,
    transactions: db.transactions.slice(0, 50),
    auditLogs: db.auditLogs.slice(0, 30),
    errorLogs: db.errorLogs.slice(0, 20),
    settings: db.settings,
  });
});

// Admin User Status Toggle
app.post('/api/admin/users/:id/status', requireOwner, (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const targetUser = db.users.find((u) => u.id === id);
  if (!targetUser) return res.status(404).json({ error: 'المستخدم غير موجود' });

  if (targetUser.role === 'owner') {
    return res.status(400).json({ error: 'لا يمكن تعليق حساب مالك النظام' });
  }

  targetUser.status = status === 'suspended' ? 'suspended' : 'active';
  const owner = (req as any).user as User;

  logAudit(
    owner.id,
    owner.username,
    'USER_STATUS_CHANGE',
    `تغيير حالة المستخدم ${targetUser.username} إلى ${targetUser.status}`
  );

  saveDatabase();
  res.json({ success: true, user: targetUser });
});

// Admin Update System Settings
app.post('/api/admin/settings', requireOwner, (req, res) => {
  const { maxLockDurationDays, historicalYear, historicalBalanceImpact } = req.body;
  const owner = (req as any).user as User;

  if (typeof maxLockDurationDays === 'number') {
    db.settings.maxLockDurationDays = Math.max(1, maxLockDurationDays);
  }

  if (historicalYear !== undefined) {
    db.settings.historicalYear = historicalYear ? String(historicalYear).trim() : null;
  }

  if (historicalBalanceImpact === 'affect_balance' || historicalBalanceImpact === 'display_only') {
    db.settings.historicalBalanceImpact = historicalBalanceImpact;
  }

  logAudit(
    owner.id,
    owner.username,
    'SETTINGS_UPDATE',
    `تحديث إعدادات النظام: سنة السجلات=${db.settings.historicalYear || 'غير محددة'}, تأثير الرصيد=${db.settings.historicalBalanceImpact}`
  );

  saveDatabase();
  res.json({ success: true, settings: db.settings });
});

// Admin Audit Logs
app.get('/api/admin/audit-logs', requireOwner, (req, res) => {
  res.json(db.auditLogs);
});

// Admin Error Logs
app.get('/api/admin/error-logs', requireOwner, (req, res) => {
  res.json(db.errorLogs);
});

// Admin Reset to Demo State
app.post('/api/admin/reset-demo', requireOwner, (req, res) => {
  db = createInitialDatabase();
  saveDatabase(db);
  res.json({
    success: true,
    message: 'تمت إعادة ضبط النظام بنجاح إلى الحالة الافتراضية (Sam: 1000 USD، Eslam: 0 USD مع السجلات التاريخية الأربعة).',
  });
});

// ================= VITE / FRONTEND SERVING =================
async function startServer() {
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Crypto Wallet server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
