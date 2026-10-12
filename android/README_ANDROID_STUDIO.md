# مشروع تطبيق Crypto Wallet لنظام Android (Jetpack Compose & Kotlin)

هذا المجلد يحتوي على ملفات البنية الأساسية لتطبيق **Crypto Wallet** الأصلي لنظام Android والمبني وفق أفضل الممارسات الهندسية.

---

## 1. التقنيات المعمارية المستخدمة
- **اللغة**: Kotlin 2.0+
- **واجهات المستخدم**: Jetpack Compose مع Material 3
- **المعمارية**: MVVM (Model-View-ViewModel) مع Clean Architecture
- **إدارة الحسابات**: Firebase Authentication
- **قاعدة البيانات السحابية**: Cloud Firestore (مع معاملات ذرية Transactions)
- **المنطق الخلفي الآمن**: Cloud Functions (لتنفيذ التحويلات وقفل الأرصدة المؤقتة وفكها تلقائياً)
- **الإشعارات**: Firebase Cloud Messaging (FCM)
- **الرموز والمربعات**: مكتبة ZXing لإنشاء رموز QR للعناوين المشفرة 0x

---

## 2. بنية الملفات داخل مجلد `android/`

```
android/
├── build.gradle.kts                        # ملف إعدادات المشروع الرئيسي
├── firestore.rules                         # قواعد أمان Firestore لمنع التلاعب بالأرصدة
├── functions/
│   ├── index.js                            # دوال Cloud Functions للتحويلات وفك الأقفال
│   └── package.json
└── app/
    ├── build.gradle.kts                    # ملف إعدادات تطبيق Android والتبعيات
    └── src/main/
        ├── AndroidManifest.xml             # الصلاحيات وروابط الويب العميقة App Links
        └── java/com/cryptowallet/app/
            ├── MainActivity.kt             # نقطة الانطلاق وإدارة مسارات Compose
            ├── model/
            │   └── Models.kt               # فئات البيانات (Wallet, Balance, Transaction)
            ├── ui/
            │   ├── theme/
            │   │   └── Theme.kt            # ألوان وهوية التطبيق (Dark Mode & Emerald)
            │   └── screens/
            │       ├── HomeScreen.kt
            │       ├── SendScreen.kt
            │       ├── ReceiveScreen.kt
            │       └── LockedFundsScreen.kt
            └── viewmodel/
                └── WalletViewModel.kt
```

---

## 3. خطوات التشغيل في Android Studio

1. **تثبيت المتطلبات**:
   - تثبيت أحدث إصدار من **Android Studio** (Koala أو Ladybug أو أحدث).
   - توفر حزمة **JDK 17**.

2. **فتح المشروع**:
   - افتح Android Studio واختر **Open**.
   - اختر مجلد `android` من هذا المستودع.
   - انتظر حتى يكتمل فحص **Gradle Sync**.

3. **ربط Firebase**:
   - أنشئ مشروعاً جديداً في [Firebase Console](https://console.firebase.google.com).
   - أضف تطبيق Android بالحزمة: `com.cryptowallet.app`.
   - قم بتحميل ملف `google-services.json` وضعه داخل مجلد `android/app/`.
   - فعّل **Firestore Database** و **Authentication**.
   - انشر قواعد الأمان من ملف `android/firestore.rules`.
   - انشر دوال Cloud Functions من مجلد `android/functions/` باستخدام:
     ```bash
     firebase deploy --only functions,firestore
     ```

4. **تشغيل التطبيق**:
   - اختر جهاز محاكي (Android Emulator) أو وصّل هاتفك المحمول بنظام Android.
   - اضغط على زر **Run** (الأخضر ▶) أو اختصار `Shift + F10`.

---

## 4. ميزة قفل المبالغ (Time-Locked Balances)
- عندما يحدد المرسل مدة قفل (مثلاً 24 ساعة):
  1. يقوم التابع السحابي بخصم المبلغ من الرصيد المتاح للمرسل.
  2. يُضاف المبلغ إلى الرصيد المقفل `locked` للمستلم.
  3. تُسجل المعاملة بحالة `LOCKED` مع توقيت الإتاحة `unlockAt = now + duration`.
  4. تعمل دالة دورية مجدولة (Cloud Scheduler) كل دقيقة لفحص المعاملات المستحقة ونقلها تلقائياً إلى الرصيد المتاح.

---

## 5. إفصاح المحاكاة
جميع الأرصدة والمعاملات والعناوين التي تبدأ بـ `0x` في هذا النظام هي لأغراض المحاكاة والتجربة التقنية فقط ولا تمثل أي أموال حقيقية أو معاملات على شبكات البلوكشين.
