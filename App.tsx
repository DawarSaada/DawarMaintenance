
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy, 
  limit, 
  setDoc,
  getDocs,
  FirestoreError
} from 'firebase/firestore';

import { db } from './firebase.ts';
import { UserRole, Ticket, TicketStatus, User, Priority, UserAccount, AppNotification, Language, Theme } from './types.ts';
import { translations } from './translations.ts';
import Sidebar from './components/Sidebar.tsx';
import Header from './components/Header.tsx';
import Dashboard from './components/Dashboard.tsx';
import TicketList from './components/TicketList.tsx';
import TicketForm from './components/TicketForm.tsx';
import TicketDetail from './components/TicketDetail.tsx';
import Login from './components/Login.tsx';
import AdminSettings from './components/AdminSettings.tsx';
import Toast from './components/Toast.tsx';

const SESSION_KEY = 'ds_session_data';
const PREFS_KEY = 'ds_user_prefs';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
  }
}

const handleFirestoreError = (error: any, operationType: OperationType, path: string | null) => {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: undefined, // Not using Firebase Auth in this custom login system yet
      email: undefined,
      emailVerified: undefined,
      isAnonymous: undefined,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
};

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [accounts, setAccounts] = useState<UserAccount[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [branches, setBranches] = useState<{name_en: string, name_ar: string}[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [view, setView] = useState<'dashboard' | 'tickets' | 'create' | 'detail' | 'admin' | 'notifications'>('dashboard');
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [vapidPublicKey, setVapidPublicKey] = useState<string | null>(null);
  
  // App Preferences
  const [lang, setLang] = useState<Language>(() => (localStorage.getItem('ds_lang') as Language) || 'en');
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem('ds_theme') as Theme) || 'light');

  useEffect(() => {
    localStorage.setItem('ds_lang', lang);
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [lang]);

  useEffect(() => {
    localStorage.setItem('ds_theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  const t = translations[lang];

  // PWA Install Prompt Logic
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Check if already installed or on iOS
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    
    if (isIos && !isStandalone) {
      setShowInstallBanner(true);
    }

    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        setShowInstallBanner(false);
      }
    } else {
      // iOS instructions
      alert(lang === 'ar' ? 'لتثبيت التطبيق على جهازك، اضغط على أيقونة "مشاركة" ثم اختر "إضافة إلى الشاشة الرئيسية".' : 'To install this app on your device, tap the "Share" icon and then select "Add to Home Screen".');
    }
  };

  // Initialize Preferences
  useEffect(() => {
    const savedPrefs = localStorage.getItem(PREFS_KEY);
    if (savedPrefs) {
      const { lang: savedLang, theme: savedTheme } = JSON.parse(savedPrefs);
      if (savedLang) setLang(savedLang);
      if (savedTheme) setTheme(savedTheme);
    }
  }, []);

  // Update DOM for RTL and Dark Mode
  useEffect(() => {
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem(PREFS_KEY, JSON.stringify({ lang, theme }));
  }, [lang, theme]);

  // Session Management
  useEffect(() => {
    const savedSession = localStorage.getItem(SESSION_KEY);
    if (savedSession) {
      try {
        const { user, expiresAt } = JSON.parse(savedSession);
        if (Date.now() < expiresAt) {
          setCurrentUser(user);
        } else {
          localStorage.removeItem(SESSION_KEY);
        }
      } catch (e) {
        localStorage.removeItem(SESSION_KEY);
      }
    }

    const checkExpiry = setInterval(() => {
      const currentSession = localStorage.getItem(SESSION_KEY);
      if (currentSession) {
        const { expiresAt } = JSON.parse(currentSession);
        if (Date.now() >= expiresAt) logout();
      }
    }, 60000);

    return () => clearInterval(checkExpiry);
  }, []);

  // Fetch VAPID public key
  useEffect(() => {
    const fetchVapidKey = async () => {
      try {
        const response = await fetch('/api/push/vapid-key');
        if (response.ok) {
          const { publicKey } = await response.json();
          setVapidPublicKey(publicKey);
        } else {
          console.error('Failed to fetch VAPID public key');
        }
      } catch (error) {
        console.error('Error fetching VAPID public key:', error);
      }
    };
    fetchVapidKey();
  }, []);

  // Account Listener (Unauthenticated)
  useEffect(() => {
    if (!db) return;

    const unsubscribeAccounts = onSnapshot(collection(db, "accounts"), (snapshot) => {
      const accountsData: UserAccount[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        accountsData.push({ ...data, id: doc.id } as UserAccount);
      });
      if (snapshot.empty) {
        const initialAccounts: UserAccount[] = [
          { id: 'admin', name: 'System Admin', role: UserRole.OPERATION_MANAGER, password: 'admin' },
          { id: 'ceo', name: 'CEO', role: UserRole.CEO, password: 'ceo' }
        ];
        initialAccounts.forEach(acc => setDoc(doc(db, "accounts", acc.id), acc));
      }
      setAccounts(accountsData);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, "accounts");
    });

    return () => unsubscribeAccounts();
  }, [db]);

  // Real-time Data Listeners (Authenticated)
  useEffect(() => {
    if (!db || !currentUser) return;

    const unsubscribeTickets = onSnapshot(query(collection(db, "tickets"), orderBy("createdAt", "desc")), (snapshot) => {
      const ticketsData: Ticket[] = [];
      snapshot.forEach((doc) => ticketsData.push({ ...doc.data(), id: doc.id } as Ticket));
      setTickets(ticketsData);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, "tickets");
    });

    const unsubscribeBranches = onSnapshot(collection(db, "branches"), (snapshot) => {
      const branchesData: {name_en: string, name_ar: string}[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        branchesData.push({
          name_en: doc.id,
          name_ar: data.name_ar || ''
        });
      });
      setBranches(branchesData.sort((a, b) => a.name_en.localeCompare(b.name_en)));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, "branches");
    });

    const unsubscribeNotifs = onSnapshot(query(collection(db, "notifications"), orderBy("timestamp", "desc"), limit(20)), (snapshot) => {
      const notifsData: AppNotification[] = [];
      snapshot.forEach((doc) => notifsData.push({ ...doc.data(), id: doc.id } as AppNotification));
      setNotifications(notifsData);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, "notifications");
    });

    return () => {
      unsubscribeTickets();
      unsubscribeBranches();
      unsubscribeNotifs();
    };
  }, [db, currentUser]);

  // Handle deep linking for tickets
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ticketId = params.get('ticket');
    if (ticketId && currentUser) {
      setSelectedTicketId(ticketId);
      setView('detail');
      // Clear the param without refreshing
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [currentUser]);

  const addNotification = useCallback(async (message: string, type: AppNotification['type'] = 'info', ticketId?: string) => {
    await addDoc(collection(db, "notifications"), {
      message,
      type,
      timestamp: Date.now(),
      read: false,
      ticketId: ticketId || null
    });

    // Send push notification via server
    try {
      await fetch('/api/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Dawar Saada Maintenance',
          body: message,
          url: ticketId ? `${window.location.origin}/?ticket=${ticketId}` : window.location.origin
        }),
      });
    } catch (e) {
      console.error('Failed to send push notification:', e);
    }
  }, [db]);

  const deleteTickets = async (ids: string[]) => {
    if (!ids.length) return;
    try {
      await Promise.all(ids.map(id => deleteDoc(doc(db, "tickets", id))));
      addNotification(`${t.deleteSuccess} (${ids.length})`, 'warning');
      if (selectedTicketId && ids.includes(selectedTicketId)) {
        setSelectedTicketId(null);
        setView('tickets');
      }
    } catch (error) {
      console.error("Bulk ticket deletion failed:", error);
      addNotification(t.deleteError, 'error');
    }
  };

  const handleLogin = (id: string, pass: string, stayLoggedIn: boolean) => {
    const account = accounts.find(a => a.id === id && a.password === pass);
    if (account) {
      const { password, ...user } = account;
      const duration = stayLoggedIn ? 2592000000 : 3600000;
      const expiresAt = Date.now() + duration;
      localStorage.setItem(SESSION_KEY, JSON.stringify({ user, expiresAt }));
      setCurrentUser(user);
      setView('dashboard');
      addNotification(`${t.welcome} ${user.name}.`, 'success');
      return true;
    }
    return false;
  };

  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  const subscribeToPushNotifications = useCallback(async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window) || !vapidPublicKey) {
      console.warn('Push notifications not supported or VAPID key not available.');
      return;
    }

    const registration = await navigator.serviceWorker.ready;
    const existingSubscription = await registration.pushManager.getSubscription();

    if (existingSubscription) {
      console.log('Existing push subscription found:', existingSubscription);
      return;
    }

    try {
      const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey,
      });

      console.log('New push subscription:', subscription);
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription),
      });
      addNotification(t.subscribeSuccess, 'success');
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      addNotification(t.subscribeError, 'error');
    }
  }, [vapidPublicKey, addNotification]);

  // Call subscribeToPushNotifications after successful login
  useEffect(() => {
    if (currentUser) {
      // Request notification permission
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          subscribeToPushNotifications();
        } else {
          console.warn('Notification permission denied.');
        }
      });
    }
  }, [currentUser, subscribeToPushNotifications]);

  const logout = useCallback(() => {
    setCurrentUser(null);
    localStorage.removeItem(SESSION_KEY);
    setView('dashboard');
    addNotification(t.loggedOut, 'info');
  }, [addNotification, t.loggedOut]);

  const createTicket = async (data: Partial<Ticket>) => {
    const id = `T-${Math.floor(Math.random() * 9000) + 1000}`;
    const newTicket: Omit<Ticket, 'id'> = {
      title: data.title!,
      description: data.description!,
      branch: data.branch || currentUser?.branch || (branches.length > 0 ? branches[0].name_en : ''),
      status: TicketStatus.PENDING_OM_REVIEW,
      priority: data.priority || Priority.MEDIUM,
      createdBy: currentUser?.name || 'Unknown',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      comments: [],
      media: data.media || []
    };
    await setDoc(doc(db, "tickets", id), newTicket);
    setView('tickets');
    addNotification(`${t.ticketInitiatedMsg} (${id})`, 'info', id);
  };

  const updateTicketStatus = async (ticketId: string, newStatus: TicketStatus, comment?: string) => {
    const ticketRef = doc(db, "tickets", ticketId);
    const ticket = tickets.find(t => t.id === ticketId);
    if (!ticket) return;
    const newComments = [...ticket.comments];
    if (comment) {
      newComments.push({
        id: Math.random().toString(36).substr(2, 9),
        author: currentUser?.name || 'System',
        role: currentUser?.role || UserRole.BRANCH_MANAGER,
        text: comment,
        timestamp: Date.now()
      });
    }
    await updateDoc(ticketRef, {
      status: newStatus,
      updatedAt: Date.now(),
      comments: newComments
    });
    addNotification(`${t.ticketUpdatedMsg} (${ticketId})`, 'info', ticketId);
  };

  const deleteUser = async (id: string) => {
    if (id === currentUser?.id) {
      addNotification(t.cannotDeleteSelf, "error");
      return;
    }
    try {
      await deleteDoc(doc(db, "accounts", id));
      addNotification(`${t.userDeleted}: ${id}`, "warning");
    } catch (error) {
      console.error("User deletion failed:", error);
      addNotification(t.userDeleteError, "error");
    }
  };

  const deleteBranch = async (nameEn: string) => {
    try {
      await deleteDoc(doc(db, "branches", nameEn));
      addNotification(`${t.branchDeleted}: ${nameEn}`, "warning");
    } catch (error) {
      console.error("Branch deletion failed:", error);
      addNotification(t.branchDeleteError, "error");
    }
  };

  const selectedTicket = useMemo(() => tickets.find(t => t.id === selectedTicketId), [tickets, selectedTicketId]);

  // Handle mobile view change automatically closing sidebar
  const handleViewChange = (newView: any) => {
    setView(newView);
    setSidebarOpen(false);
  };

  if (!currentUser) {
    return (
      <div className="relative min-h-screen">
        {showInstallBanner && (
          <div className="fixed top-0 left-0 right-0 z-[100] bg-orange-600 text-white p-3 flex justify-between items-center shadow-lg animate-fadeInDown">
            <div className="flex items-center space-x-3 space-x-reverse">
              <span className="text-2xl">📱</span>
              <span className="text-xs font-bold">{lang === 'ar' ? 'تثبيت التطبيق لتجربة أفضل' : 'Install app for a better experience'}</span>
            </div>
            <div className="flex items-center space-x-2 space-x-reverse">
              <button onClick={handleInstallClick} className="bg-white text-orange-600 px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider">{lang === 'ar' ? 'تثبيت' : 'Install'}</button>
              <button onClick={() => setShowInstallBanner(false)} className="p-1 text-white/60 hover:text-white">✕</button>
            </div>
          </div>
        )}
        <Login 
          onLogin={handleLogin} 
          lang={lang} 
          onSetLang={setLang}
          theme={theme}
          onSetTheme={setTheme}
          t={t} 
        />
      </div>
    );
  }

  const handleNotificationClick = async (notif: AppNotification) => {
    if (!notif.read) {
      await updateDoc(doc(db, "notifications", notif.id), { read: true });
    }
    if (notif.ticketId) {
      setSelectedTicketId(notif.ticketId);
      setView('detail');
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden relative">
      {showInstallBanner && (
        <div className="fixed top-0 left-0 right-0 z-[100] bg-orange-600 text-white p-3 flex justify-between items-center shadow-lg animate-fadeInDown">
          <div className="flex items-center space-x-3 space-x-reverse">
            <span className="text-2xl">📱</span>
            <span className="text-xs font-bold">{lang === 'ar' ? 'تثبيت التطبيق لتجربة أفضل' : 'Install app for a better experience'}</span>
          </div>
          <div className="flex items-center space-x-2 space-x-reverse">
            <button onClick={handleInstallClick} className="bg-white text-orange-600 px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider">{lang === 'ar' ? 'تثبيت' : 'Install'}</button>
            <button onClick={() => setShowInstallBanner(false)} className="p-1 text-white/60 hover:text-white">✕</button>
          </div>
        </div>
      )}
      <Sidebar 
        currentView={view} 
        setView={handleViewChange} 
        role={currentUser.role}
        onLogout={logout}
        lang={lang}
        onSetLang={setLang}
        t={t}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <Header 
          user={currentUser} 
          notifications={notifications}
          currentTicketId={view === 'detail' ? selectedTicketId : null}
          lang={lang}
          theme={theme}
          onSetLang={setLang}
          onSetTheme={setTheme}
          onMarkRead={handleNotificationClick}
          onMarkAllRead={async () => {
            const unread = notifications.filter(n => !n.read);
            await Promise.all(unread.map(n => updateDoc(doc(db, "notifications", n.id), { read: true })));
          }}
          t={t}
          onMenuClick={() => setSidebarOpen(true)}
        />
        <main className="flex-1 overflow-y-auto p-4 md:p-8 animate-fadeIn pb-24 md:pb-8">
          {view === 'dashboard' && (
            <Dashboard 
              tickets={tickets} 
              user={currentUser} 
              onSelectTicket={(id) => { setSelectedTicketId(id); setView('detail'); }}
              t={t}
            />
          )}
          {view === 'tickets' && (
            <TicketList 
              tickets={tickets} 
              user={currentUser} 
              onSelectTicket={(id) => { setSelectedTicketId(id); setView('detail'); }}
              onDeleteTickets={deleteTickets}
              t={t}
            />
          )}
          {view === 'create' && (
            <TicketForm 
              branches={branches}
              user={currentUser}
              onSubmit={createTicket} 
              onCancel={() => setView('dashboard')}
              t={t}
              lang={lang}
            />
          )}
          {view === 'detail' && selectedTicket && (
            <TicketDetail 
              ticket={selectedTicket} 
              user={currentUser} 
              branches={branches}
              onUpdateStatus={updateTicketStatus}
              onBack={() => setView('tickets')}
              t={t}
              lang={lang}
            />
          )}
          {view === 'admin' && currentUser.role === UserRole.OPERATION_MANAGER && (
            <AdminSettings 
              accounts={accounts} 
              onAddUser={async (a) => await setDoc(doc(db, "accounts", a.id), a)} 
              onUpdateUser={async (a, id) => await setDoc(doc(db, "accounts", id), a)} 
              onDeleteUser={deleteUser}
              branches={branches}
              onAddBranch={async (b) => await setDoc(doc(db, "branches", b.name_en), b)}
              onDeleteBranch={deleteBranch}
              t={t}
              lang={lang}
            />
          )}
          {view === 'notifications' && (
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{lang === 'ar' ? 'التنبيهات' : 'Notifications'}</h2>
                <button 
                  onClick={async () => {
                    const unread = notifications.filter(n => !n.read);
                    await Promise.all(unread.map(n => updateDoc(doc(db, "notifications", n.id), { read: true })));
                  }}
                  className="text-orange-600 text-sm font-bold uppercase hover:underline"
                >
                  {lang === 'ar' ? 'تحديد الكل كمقروء' : 'Mark all as read'}
                </button>
              </div>
              <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                {notifications.length === 0 ? (
                  <div className="p-12 text-center text-slate-400 italic">{lang === 'ar' ? 'لا توجد تنبيهات.' : 'No notifications yet.'}</div>
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {notifications.map(n => (
                      <div 
                        key={n.id} 
                        onClick={() => handleNotificationClick(n)}
                        className={`p-6 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer flex items-start space-x-4 space-x-reverse ${!n.read ? 'bg-orange-50/20 dark:bg-orange-900/10 border-l-4 border-orange-500' : ''}`}
                      >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${n.type === 'error' ? 'bg-red-100 text-red-600' : n.type === 'warning' ? 'bg-yellow-100 text-yellow-600' : 'bg-blue-100 text-blue-600'}`}>
                          {n.type === 'error' ? '⚠️' : n.type === 'warning' ? '🔔' : 'ℹ️'}
                        </div>
                        <div className="flex-1">
                          <p className={`text-sm ${!n.read ? 'text-slate-900 dark:text-white font-bold' : 'text-slate-600 dark:text-slate-400'}`}>
                            {n.message}
                          </p>
                          <p className="text-[10px] text-slate-400 mt-2 font-bold uppercase tracking-wider">
                            {new Date(n.timestamp).toLocaleString(lang === 'ar' ? 'ar-EG' : 'en-US')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
      <Toast 
        notifications={notifications} 
        onDismiss={async (id) => await updateDoc(doc(db, "notifications", id), { read: true })} 
      />
    </div>
  );
};

export default App;
