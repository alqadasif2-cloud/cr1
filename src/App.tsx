/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { AndroidFrame } from './components/AndroidFrame';
import { DisclaimerBanner } from './components/DisclaimerBanner';
import { BottomNav, NavTab } from './components/BottomNav';
import { QRCodeModal } from './components/QRCodeModal';
import { SplashScreen } from './screens/SplashScreen';
import { LoginScreen } from './screens/LoginScreen';
import { RegisterScreen } from './screens/RegisterScreen';
import { HomeScreen } from './screens/HomeScreen';
import { WalletScreen } from './screens/WalletScreen';
import { AssetDetailScreen } from './screens/AssetDetailScreen';
import { SendScreen } from './screens/SendScreen';
import { ConfirmTransferScreen } from './screens/ConfirmTransferScreen';
import { ReceiveScreen } from './screens/ReceiveScreen';
import { LockedFundsScreen } from './screens/LockedFundsScreen';
import { TransactionHistoryScreen } from './screens/TransactionHistoryScreen';
import { TransactionDetailScreen } from './screens/TransactionDetailScreen';
import { NotificationsScreen } from './screens/NotificationsScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { AdminScreen } from './screens/AdminScreen';
import { AndroidExportScreen } from './screens/AndroidExportScreen';
import { PublicReceivePage } from './screens/PublicReceivePage';
import { api, setAuthToken } from './services/api';
import { User, UserWallet, Transaction, Currency } from './types';
import { Language } from './i18n/translations';
import { Users, RefreshCw } from 'lucide-react';

export default function App() {
  const [lang, setLang] = useState<Language>('ar');
  const [isFrameMode, setIsFrameMode] = useState<boolean>(true);
  const [currentScreen, setCurrentScreen] = useState<string>('splash');
  const [screenParams, setScreenParams] = useState<any>(null);

  // Auth & Data state
  const [user, setUser] = useState<User | null>(null);
  const [wallet, setWallet] = useState<UserWallet | null>(null);
  const [rates, setRates] = useState<Record<string, number>>({ BTC: 68500, ETH: 3450, USDT: 1.0 });
  const [totalUsdtEquivalent, setTotalUsdtEquivalent] = useState<number>(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [unreadNotifsCount, setUnreadNotifsCount] = useState<number>(0);
  const [lockedCount, setLockedCount] = useState<number>(0);

  // Modals
  const [isQrOpen, setIsQrOpen] = useState(false);

  // Sync RTL / LTR on language change
  useEffect(() => {
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [lang]);

  // Handle URL deep link check for receive: /receive/:code
  useEffect(() => {
    const path = window.location.pathname;
    if (path.startsWith('/receive/')) {
      const code = path.replace('/receive/', '').split('/')[0];
      if (code) {
        setCurrentScreen('public-receive');
        setScreenParams({ receiveCode: code });
      }
    }
  }, []);

  const refreshAllData = useCallback(async () => {
    if (!user) return;
    try {
      const [walletRes, txsRes, notifsRes] = await Promise.all([
        api.getWallet(),
        api.getTransactions(),
        api.getNotifications(),
      ]);

      setWallet(walletRes.wallet);
      setRates(walletRes.rates);
      setTotalUsdtEquivalent(walletRes.totalUsdtEquivalent);
      setTransactions(txsRes);
      setUnreadNotifsCount(notifsRes.unreadCount);

      const activeLocks = txsRes.filter(
        (t) => t.status === 'LOCKED' && t.recipientUserId === user.id
      ).length;
      setLockedCount(activeLocks);
    } catch (err) {
      console.error('Error refreshing wallet state:', err);
    }
  }, [user]);

  // Boot check
  useEffect(() => {
    api.getMe()
      .then((data) => {
        setUser(data.user);
        setWallet(data.wallet);
      })
      .catch(() => {
        // Not authenticated or fallback needed
      });
  }, []);

  // Periodic poll for time locks & wallet updates
  useEffect(() => {
    if (!user) return;
    refreshAllData();
    const interval = setInterval(() => {
      refreshAllData();
    }, 4000);
    return () => clearInterval(interval);
  }, [user, refreshAllData]);

  const handleSplashFinish = () => {
    if (user) {
      setCurrentScreen('home');
    } else {
      setCurrentScreen('login');
    }
  };

  const handleAuthSuccess = (loggedUser: User, loggedWallet: UserWallet) => {
    setUser(loggedUser);
    setWallet(loggedWallet);
    setCurrentScreen('home');
    refreshAllData();
  };

  const handleLogout = () => {
    setAuthToken(null);
    setUser(null);
    setWallet(null);
    setCurrentScreen('login');
  };

  const handleSwitchUser = async (targetUsername: string) => {
    try {
      const isSam = targetUsername.toLowerCase() === 'sam';
      const pw = isSam ? '1234' : 'Eslam@2es';
      const userToLogin = isSam ? 'sam' : 'eslam alqadasi';
      const res = await api.login(userToLogin, pw);
      setUser(res.user);
      setWallet(res.wallet);
      setCurrentScreen('home');
      refreshAllData();
    } catch (err) {
      console.error('Failed to switch user:', err);
    }
  };

  const navigateTo = (screen: string, params: any = null) => {
    setScreenParams(params);
    setCurrentScreen(screen);
  };

  const handleSelectNavTab = (tab: NavTab) => {
    switch (tab) {
      case 'home':
        navigateTo('home');
        break;
      case 'wallet':
        navigateTo('wallet');
        break;
      case 'locked':
        navigateTo('locked');
        break;
      case 'activity':
        navigateTo('activity');
        break;
      case 'settings':
        navigateTo('settings');
        break;
      case 'notifications':
        navigateTo('notifications');
        break;
    }
  };

  // Determine active bottom nav tab
  let activeTab: NavTab = 'home';
  if (['home'].includes(currentScreen)) activeTab = 'home';
  else if (['wallet', 'asset'].includes(currentScreen)) activeTab = 'wallet';
  else if (['locked'].includes(currentScreen)) activeTab = 'locked';
  else if (['activity', 'tx-detail'].includes(currentScreen)) activeTab = 'activity';
  else if (['settings', 'profile', 'admin', 'android-export'].includes(currentScreen)) activeTab = 'settings';
  else if (['notifications'].includes(currentScreen)) activeTab = 'activity';

  const showBottomNav =
    user && !['splash', 'login', 'register', 'public-receive'].includes(currentScreen);

  const receiveUrl = wallet ? `${window.location.origin}/receive/${wallet.receiveCode}` : '';

  return (
    <AndroidFrame
      isFrameMode={isFrameMode}
      onToggleFrameMode={() => setIsFrameMode(!isFrameMode)}
      lang={lang}
    >
      <div className="flex-1 flex flex-col min-h-full bg-[#0b0f17]">
        {/* Top Simulation Disclaimer Banner */}
        <DisclaimerBanner lang={lang} />

        {/* Quick Account Switcher Helper Bar */}
        {user && !['splash', 'login', 'register', 'public-receive'].includes(currentScreen) && (
          <div className="bg-[#0e1520] border-b border-gray-800/80 px-3 py-1.5 flex items-center justify-between text-[11px] select-none">
            <div className="flex items-center gap-1.5 text-gray-300">
              <span className={`w-2 h-2 rounded-full ${user.role === 'owner' ? 'bg-amber-400' : 'bg-emerald-400'}`}></span>
              <span className="font-semibold text-white">{user.name}</span>
              <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${user.role === 'owner' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'}`}>
                {user.role === 'owner' ? 'مالك النظام' : 'مستخدم'}
              </span>
            </div>
            <div className="flex items-center gap-1 text-[10px]">
              <span className="text-gray-400">{lang === 'ar' ? 'تبديل:' : 'Switch:'}</span>
              <button
                onClick={() => handleSwitchUser(user.username.toLowerCase() === 'sam' ? 'eslam alqadasi' : 'sam')}
                className="px-2 py-0.5 rounded bg-[#182433] hover:bg-[#203044] text-emerald-300 font-medium border border-gray-700 transition flex items-center gap-1"
                title="تبديل الحساب للاختبار"
              >
                <Users className="w-3 h-3 text-emerald-400" />
                <span>{user.username.toLowerCase() === 'sam' ? 'Eslam Alqadasi' : 'Sam (المالك)'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Viewport Content Router */}
        <div className="flex-1 flex flex-col relative overflow-hidden">
          {currentScreen === 'splash' && (
            <SplashScreen onFinish={handleSplashFinish} lang={lang} />
          )}

          {currentScreen === 'login' && (
            <LoginScreen
              onSuccess={handleAuthSuccess}
              onGoToRegister={() => setCurrentScreen('register')}
              lang={lang}
            />
          )}

          {currentScreen === 'register' && (
            <RegisterScreen
              onSuccess={handleAuthSuccess}
              onGoToLogin={() => setCurrentScreen('login')}
              lang={lang}
            />
          )}

          {currentScreen === 'home' && user && wallet && (
            <HomeScreen
              user={user}
              wallet={wallet}
              transactions={transactions}
              unreadNotifsCount={unreadNotifsCount}
              rates={rates}
              totalUsdtEquivalent={totalUsdtEquivalent}
              onNavigate={navigateTo}
              onOpenQr={() => setIsQrOpen(true)}
              lang={lang}
            />
          )}

          {currentScreen === 'wallet' && user && wallet && (
            <WalletScreen
              user={user}
              wallet={wallet}
              rates={rates}
              totalUsdtEquivalent={totalUsdtEquivalent}
              onNavigate={navigateTo}
              onOpenQr={() => setIsQrOpen(true)}
              lang={lang}
            />
          )}

          {currentScreen === 'asset' && user && wallet && (
            <AssetDetailScreen
              currency={(screenParams?.currency as Currency) || 'USDT'}
              wallet={wallet}
              user={user}
              rates={rates}
              transactions={transactions}
              onNavigateToSend={(c) => navigateTo('send', { defaultCurrency: c })}
              onNavigateToReceive={() => navigateTo('receive')}
              onBack={() => navigateTo('home')}
              lang={lang}
            />
          )}

          {currentScreen === 'send' && user && wallet && (
            <SendScreen
              user={user}
              wallet={wallet}
              defaultRecipientAddress={screenParams?.recipientAddress}
              defaultCurrency={screenParams?.defaultCurrency}
              onProceedToReview={(data) => navigateTo('confirm-transfer', data)}
              onBack={() => navigateTo('home')}
              lang={lang}
            />
          )}

          {currentScreen === 'confirm-transfer' && user && wallet && screenParams && (
            <ConfirmTransferScreen
              user={user}
              wallet={wallet}
              transferData={screenParams}
              onSuccess={() => {
                refreshAllData();
                navigateTo('home');
              }}
              onBack={() => navigateTo('send')}
              lang={lang}
            />
          )}

          {currentScreen === 'receive' && user && wallet && (
            <ReceiveScreen
              user={user}
              wallet={wallet}
              onBack={() => navigateTo('home')}
              lang={lang}
            />
          )}

          {currentScreen === 'locked' && user && (
            <LockedFundsScreen
              user={user}
              onBack={() => navigateTo('home')}
              onRefresh={refreshAllData}
              lang={lang}
            />
          )}

          {currentScreen === 'activity' && user && (
            <TransactionHistoryScreen
              user={user}
              transactions={transactions}
              onSelectTx={(id) => navigateTo('tx-detail', { txId: id })}
              onBack={() => navigateTo('home')}
              lang={lang}
            />
          )}

          {currentScreen === 'tx-detail' && user && screenParams?.txId && (
            <TransactionDetailScreen
              txId={screenParams.txId}
              user={user}
              onBack={() => navigateTo('activity')}
              lang={lang}
            />
          )}

          {currentScreen === 'notifications' && (
            <NotificationsScreen
              onBack={() => navigateTo('home')}
              onSelectTx={(id) => navigateTo('tx-detail', { txId: id })}
              lang={lang}
            />
          )}

          {currentScreen === 'profile' && user && wallet && (
            <ProfileScreen
              user={user}
              wallet={wallet}
              onBack={() => navigateTo('settings')}
              lang={lang}
            />
          )}

          {currentScreen === 'settings' && user && wallet && (
            <SettingsScreen
              user={user}
              wallet={wallet}
              lang={lang}
              onToggleLang={() => setLang(lang === 'ar' ? 'en' : 'ar')}
              isFrameMode={isFrameMode}
              onToggleFrameMode={() => setIsFrameMode(!isFrameMode)}
              onNavigate={navigateTo}
              onLogout={handleLogout}
              onSwitchUser={handleSwitchUser}
            />
          )}

          {currentScreen === 'admin' && (
            <AdminScreen onBack={() => navigateTo('settings')} lang={lang} />
          )}

          {currentScreen === 'android-export' && (
            <AndroidExportScreen onBack={() => navigateTo('settings')} lang={lang} />
          )}

          {currentScreen === 'public-receive' && (
            <PublicReceivePage
              receiveCode={screenParams?.receiveCode || (wallet?.receiveCode || '')}
              onSendToThisAddress={(addr) => {
                if (!user) {
                  setCurrentScreen('login');
                } else {
                  navigateTo('send', { recipientAddress: addr });
                }
              }}
              onClose={() => (user ? navigateTo('home') : setCurrentScreen('login'))}
              lang={lang}
            />
          )}
        </div>

        {/* Persistent Android Bottom Navigation */}
        {showBottomNav && (
          <BottomNav
            currentTab={activeTab}
            onSelectTab={handleSelectNavTab}
            unreadNotifsCount={unreadNotifsCount}
            lockedCount={lockedCount}
            lang={lang}
          />
        )}
      </div>

      {/* QR Code Modal */}
      {wallet && (
        <QRCodeModal
          isOpen={isQrOpen}
          onClose={() => setIsQrOpen(false)}
          address={wallet.address}
          receiveUrl={receiveUrl}
          lang={lang}
        />
      )}
    </AndroidFrame>
  );
}
