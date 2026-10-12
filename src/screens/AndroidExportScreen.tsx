import React, { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Code2,
  Copy,
  Check,
  FileCode,
  FolderGit2,
  Terminal,
  Smartphone,
  ExternalLink,
} from 'lucide-react';
import { translations, Language } from '../i18n/translations';

interface AndroidExportScreenProps {
  onBack: () => void;
  lang: Language;
}

export const AndroidExportScreen: React.FC<AndroidExportScreenProps> = ({ onBack, lang }) => {
  const [activeFile, setActiveFile] = useState<string>('MainActivity.kt');
  const [copied, setCopied] = useState(false);
  const t = translations[lang];

  const files: Record<string, { path: string; desc: string; code: string }> = {
    'MainActivity.kt': {
      path: 'android/app/src/main/java/com/cryptowallet/app/MainActivity.kt',
      desc: lang === 'ar' ? 'نقطة الانطلاق ونظام التنقل المعتمد على Jetpack Compose' : 'Entry point & Jetpack Compose Navigation',
      code: `package com.cryptowallet.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.cryptowallet.app.ui.screens.*
import com.cryptowallet.app.ui.theme.CryptoWalletTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            CryptoWalletTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    val navController = rememberNavController()
                    NavHost(navController = navController, startDestination = "home") {
                        composable("home") {
                            HomeScreen(
                                onNavigateToSend = { navController.navigate("send") },
                                onNavigateToReceive = { navController.navigate("receive") },
                                onNavigateToLocked = { navController.navigate("locked") }
                            )
                        }
                        composable("send") {
                            SendScreen(onBack = { navController.popBackStack() })
                        }
                        composable("receive") {
                            ReceiveScreen(onBack = { navController.popBackStack() })
                        }
                        composable("locked") {
                            LockedFundsScreen(onBack = { navController.popBackStack() })
                        }
                    }
                }
            }
        }
    }
}`,
    },
    'Models.kt': {
      path: 'android/app/src/main/java/com/cryptowallet/app/model/Models.kt',
      desc: lang === 'ar' ? 'نماذج البيانات للمحافظ والتحويلات والأقفال الزمنية' : 'Data classes for Wallets, Transfers & Time-Locks',
      code: `package com.cryptowallet.app.model

enum class Currency { BTC, ETH, USDT }

data class Balance(
    val available: Double = 0.0,
    val locked: Double = 0.0
) {
    val total: Double get() = available + locked
}

data class Wallet(
    val id: String = "",
    val userId: String = "",
    val address: String = "", // Starts with 0x followed by 40 hex chars
    val receiveCode: String = "",
    val balances: Map<String, Balance> = mapOf(
        "BTC" to Balance(0.05, 0.0),
        "ETH" to Balance(2.50, 0.0),
        "USDT" to Balance(1500.0, 0.0)
    ),
    val createdAt: Long = System.currentTimeMillis()
)

data class Transaction(
    val id: String = "",
    val senderUserId: String = "",
    val recipientUserId: String = "",
    val senderAddress: String = "",
    val recipientAddress: String = "",
    val currency: String = "USDT",
    val amount: Double = 0.0,
    val lockDurationSeconds: Long = 0L,
    val createdAt: Long = System.currentTimeMillis(),
    val unlockAt: Long? = null,
    val status: String = "COMPLETED", // LOCKED, COMPLETED
    val note: String = "",
    val txHash: String = ""
)`,
    },
    'firestore.rules': {
      path: 'android/firestore.rules',
      desc: lang === 'ar' ? 'قواعد الأمان ومنع تعديل الأرصدة مباشرة من العميل' : 'Strict Firestore rules enforcing server authority',
      code: `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isAuthenticated() { return request.auth != null; }
    function isOwner(userId) { return isAuthenticated() && request.auth.uid == userId; }

    match /users/{userId} {
      allow read: if isAuthenticated();
      allow write: if isOwner(userId);
    }

    // CRITICAL: Wallets & balances can NEVER be updated by direct client writes!
    // Balance deductions and time-lock releases are done via Cloud Functions only.
    match /wallets/{walletId} {
      allow read: if isAuthenticated();
      allow write: if false; 
    }

    match /transactions/{txId} {
      allow read: if isAuthenticated() && (
        resource.data.senderUserId == request.auth.uid ||
        resource.data.recipientUserId == request.auth.uid
      );
      allow write: if false;
    }
  }
}`,
    },
    'functions/index.js': {
      path: 'android/functions/index.js',
      desc: lang === 'ar' ? 'Cloud Functions لإجراء الخصم الذري وفك الأقفال' : 'Firebase Cloud Functions for atomic deductions and release cron',
      code: `const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();
const db = admin.firestore();

// 1. Atomic transfer with time lock
exports.transferFundsWithLock = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated');
  const senderUid = context.auth.uid;
  const { recipientAddress, currency, amount, lockDurationSeconds } = data;

  return await db.runTransaction(async (transaction) => {
    // Lookup wallets, verify available balance, deduct and credit locked balance
    // Creates atomic record with unlockAt timestamp
  });
});

// 2. Scheduled Cron worker (Runs every minute to unlock matured balances)
exports.releaseMaturedLocks = functions.pubsub.schedule('every 1 minutes').onRun(async () => {
  const now = Date.now();
  const snapshot = await db.collection('transactions')
    .where('status', '==', 'LOCKED')
    .where('unlockAt', '<=', now)
    .get();

  const batch = db.batch();
  for (const doc of snapshot.docs) {
    const tx = doc.data();
    // Move from locked to available balance
  }
  await batch.commit();
});`,
    },
    'build.gradle.kts': {
      path: 'android/app/build.gradle.kts',
      desc: lang === 'ar' ? 'إعدادات تبعيات Android و Jetpack Compose و Firebase' : 'Android Gradle configuration with Jetpack Compose & Firebase BOM',
      code: `plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("org.jetbrains.kotlin.plugin.compose")
    id("com.google.gms.google-services")
}

android {
    namespace = "com.cryptowallet.app"
    compileSdk = 35
    defaultConfig {
        applicationId = "com.cryptowallet.app"
        minSdk = 26
        targetSdk = 35
        versionCode = 1
        versionName = "1.0.0"
    }
    buildFeatures { compose = true }
}

dependencies {
    implementation(platform("androidx.compose:compose-bom:2024.12.01"))
    implementation("androidx.compose.material3:material3")
    implementation(platform("com.google.firebase:firebase-bom:33.7.0"))
    implementation("com.google.firebase:firebase-auth-ktx")
    implementation("com.google.firebase:firebase-firestore-ktx")
    implementation("com.google.firebase:firebase-functions-ktx")
}`,
    },
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(files[activeFile].code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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
          <Code2 className="w-4 h-4 text-emerald-400" />
          <span>{lang === 'ar' ? 'أكواد تطبيق Android الأصلي' : 'Native Android Code'}</span>
        </h2>
        <div className="w-8"></div>
      </div>

      {/* Guide notice */}
      <div className="bg-[#121926] border border-emerald-500/20 rounded-2xl p-3.5 mb-3 text-xs text-gray-300 leading-relaxed">
        <div className="font-bold text-emerald-400 mb-1 flex items-center gap-1">
          <Smartphone className="w-4 h-4" />
          <span>{lang === 'ar' ? 'دليل تصدير المشروع إلى Android Studio' : 'Android Studio Workflow'}</span>
        </div>
        <p className="text-[11px] text-gray-400">
          {lang === 'ar'
            ? 'تم إنشاء بنية ملفات Android الأصلية بالكامل في مجلد android/ داخل مستودع التطبيق، بما يشمل كود Kotlin وJetpack Compose وقواعد أمان Firestore ودوال Cloud Functions.'
            : 'All native Kotlin & Jetpack Compose files are generated in the android/ directory ready to open in Android Studio.'}
        </p>
      </div>

      {/* File Selector Tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-2 mb-3 scrollbar-none">
        {Object.keys(files).map((fileName) => {
          const active = activeFile === fileName;
          return (
            <button
              key={fileName}
              onClick={() => setActiveFile(fileName)}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium transition shrink-0 ${
                active
                  ? 'bg-emerald-600 text-white font-bold'
                  : 'bg-[#141e2c] text-gray-400 hover:text-gray-200'
              }`}
            >
              {fileName}
            </button>
          );
        })}
      </div>

      {/* Active file details */}
      <div className="bg-[#0e141f] border border-gray-800 rounded-2xl overflow-hidden mb-4">
        <div className="bg-[#121926] p-3 border-b border-gray-800 flex items-center justify-between">
          <div>
            <div className="text-xs font-mono font-bold text-emerald-400">{files[activeFile].path}</div>
            <div className="text-[10px] text-gray-400">{files[activeFile].desc}</div>
          </div>
          <button
            onClick={handleCopy}
            className="p-1.5 px-2.5 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-lg text-xs font-medium flex items-center gap-1 transition"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'تم النسخ' : 'نسخ الكود'}</span>
          </button>
        </div>

        <pre className="p-3 text-[11px] font-mono-code text-gray-300 overflow-x-auto bg-[#070a0f] max-h-96 leading-relaxed select-all">
          {files[activeFile].code}
        </pre>
      </div>

      {/* Terminal instructions */}
      <div className="bg-[#101724] border border-gray-800 rounded-2xl p-3.5 text-xs text-gray-400">
        <div className="flex items-center gap-1.5 text-gray-200 font-bold mb-2">
          <Terminal className="w-4 h-4 text-emerald-400" />
          <span>{lang === 'ar' ? 'خطوات التشغيل في Android Studio' : 'Steps to build in Android Studio'}</span>
        </div>
        <ol className="list-decimal list-inside space-y-1 text-[11px] leading-relaxed">
          <li>{lang === 'ar' ? 'افتح Android Studio وحدد Open an Existing Project.' : 'Open Android Studio and choose Open.'}</li>
          <li>{lang === 'ar' ? 'اختر مجلد android/ من داخل هذا المشروع.' : 'Select the android/ directory.'}</li>
          <li>{lang === 'ar' ? 'انتظر انتهاء مزامنة Gradle Sync.' : 'Wait for Gradle Sync to finish.'}</li>
          <li>{lang === 'ar' ? 'أضف ملف google-services.json من مشروع Firebase الخاص بك.' : 'Add your google-services.json from Firebase.'}</li>
          <li>{lang === 'ar' ? 'اضغط Run لتشغيل التطبيق على الهاتف أو المحاكي.' : 'Click Run to launch on device or emulator.'}</li>
        </ol>
      </div>

      {/* GitHub Actions CI/CD Card */}
      <div className="bg-[#101724] border border-emerald-500/20 rounded-2xl p-3.5 text-xs text-gray-400 mt-3">
        <div className="flex items-center gap-1.5 text-emerald-400 font-bold mb-1.5">
          <FolderGit2 className="w-4 h-4" />
          <span>{lang === 'ar' ? 'بناء APK تلقائياً عبر GitHub Actions' : 'Automated APK Build via GitHub Actions'}</span>
        </div>
        <p className="text-[11px] text-gray-300 leading-relaxed mb-2">
          {lang === 'ar'
            ? 'تم إعداد مسار العمل .github/workflows/build-apk.yml جاهزاً. بمجرد دفع المشروع (Push) إلى GitHub أو تشغيله يدوياً عبر علامة التبويب Actions، سيتم بناء ملف APK وتوفيره للتحميل المباشر.'
            : 'The CI workflow .github/workflows/build-apk.yml is configured. Once pushed to GitHub or triggered in the Actions tab, it compiles and provides a downloadable debug APK.'}
        </p>
        <div className="bg-[#0b0f17] p-2 rounded-xl border border-gray-800 text-[10px] font-mono-code text-gray-400">
          .github/workflows/build-apk.yml
        </div>
      </div>
    </div>
  );
};
