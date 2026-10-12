/**
 * Firebase Cloud Functions for Crypto Wallet Simulation
 * Ensures atomic transfers and server-authoritative time-lock release.
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();
const db = admin.firestore();

/**
 * Callable Function: transferFundsWithLock
 * Deducts sender's available balance and credits recipient's locked (or available) balance atomically.
 */
exports.transferFundsWithLock = functions.https.onCall(async (data, context) => {
  // 1. Verify caller authentication
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated.');
  }

  const senderUid = context.auth.uid;
  const { recipientAddress, currency, amount, lockDurationSeconds, note } = data;

  if (!recipientAddress || !currency || typeof amount !== 'number' || amount <= 0) {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid transfer parameters.');
  }

  const supportedCurrencies = ['BTC', 'ETH', 'USDT'];
  if (!supportedCurrencies.includes(currency)) {
    throw new functions.https.HttpsError('invalid-argument', 'Unsupported currency.');
  }

  const lockSec = Math.max(0, parseInt(lockDurationSeconds || 0, 10));

  // Run atomic Firestore transaction
  return await db.runTransaction(async (transaction) => {
    // Lookup sender wallet
    const senderWalletQuery = await db.collection('wallets').where('userId', '==', senderUid).limit(1).get();
    if (senderWalletQuery.empty) {
      throw new functions.https.HttpsError('not-found', 'Sender wallet not found.');
    }
    const senderWalletDoc = senderWalletQuery.docs[0];
    const senderWallet = senderWalletDoc.data();

    // Lookup recipient wallet by 0x address or receive code
    const recipientWalletQuery = await db.collection('wallets')
      .where('address', '==', recipientAddress.trim().toLowerCase())
      .limit(1)
      .get();

    if (recipientWalletQuery.empty) {
      throw new functions.https.HttpsError('not-found', 'Recipient address not found.');
    }
    const recipientWalletDoc = recipientWalletQuery.docs[0];
    const recipientWallet = recipientWalletDoc.data();

    if (recipientWallet.userId === senderUid) {
      throw new functions.https.HttpsError('invalid-argument', 'Cannot send to own wallet.');
    }

    // Check sender available balance
    const availableBal = senderWallet.balances?.[currency]?.available || 0;
    if (availableBal < amount) {
      throw new functions.https.HttpsError('failed-precondition', 'Insufficient available balance.');
    }

    const now = Date.now();
    const isLocked = lockSec > 0;
    const unlockAt = isLocked ? now + (lockSec * 1000) : null;

    // Deduct from sender
    transaction.update(senderWalletDoc.ref, {
      [`balances.${currency}.available`]: admin.firestore.FieldValue.increment(-amount)
    });

    // Credit recipient
    if (isLocked) {
      transaction.update(recipientWalletDoc.ref, {
        [`balances.${currency}.locked`]: admin.firestore.FieldValue.increment(amount)
      });
    } else {
      transaction.update(recipientWalletDoc.ref, {
        [`balances.${currency}.available`]: admin.firestore.FieldValue.increment(amount)
      });
    }

    // Create transaction record
    const txRef = db.collection('transactions').doc();
    const txData = {
      id: txRef.id,
      senderUserId: senderUid,
      recipientUserId: recipientWallet.userId,
      senderAddress: senderWallet.address,
      recipientAddress: recipientWallet.address,
      currency,
      amount,
      lockDurationSeconds: lockSec,
      createdAt: now,
      unlockAt,
      unlockedAt: null,
      status: isLocked ? 'LOCKED' : 'COMPLETED',
      note: note || '',
      txHash: '0x' + require('crypto').randomBytes(32).toString('hex')
    };
    transaction.set(txRef, txData);

    return { success: true, transactionId: txRef.id, isLocked, unlockAt };
  });
});

/**
 * Scheduled Cloud Function (Runs every 1 minute):
 * Releases matured locked balances server-side.
 */
exports.releaseMaturedLocks = functions.pubsub.schedule('every 1 minutes').onRun(async (context) => {
  const now = Date.now();
  const snapshot = await db.collection('transactions')
    .where('status', '==', 'LOCKED')
    .where('unlockAt', '<=', now)
    .get();

  if (snapshot.empty) return null;

  const batch = db.batch();

  for (const doc of snapshot.docs) {
    const tx = doc.data();

    // Query recipient wallet
    const walletQuery = await db.collection('wallets').where('userId', '==', tx.recipientUserId).limit(1).get();
    if (!walletQuery.empty) {
      const walletDoc = walletQuery.docs[0];
      batch.update(walletDoc.ref, {
        [`balances.${tx.currency}.locked`]: admin.firestore.FieldValue.increment(-tx.amount),
        [`balances.${tx.currency}.available`]: admin.firestore.FieldValue.increment(tx.amount)
      });
    }

    batch.update(doc.ref, {
      status: 'COMPLETED',
      unlockedAt: now
    });
  }

  await batch.commit();
  console.log(`Unlocked ${snapshot.size} matured transactions.`);
  return null;
});
