
import React, { useState, useEffect, useMemo, useCallback } from 'https://esm.sh/react@19.0.0';
import { initializeApp, getApp, getApps } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { 
  getFirestore, 
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
  getDocs
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

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

const firebaseConfig = {
  apiKey: "AIzaSyAnu5kR7MFZQeVGLs5AuxqDts5yyKuCzWo",
  authDomain: "dawarsiyana.firebaseapp.com",
  projectId: "dawarsiyana",
  storageBucket: "dawarsiyana.firebasestorage.app",
  messagingSenderId: "128940429267",
  appId: "1:128940429267:web:5670369e87dd30fa25e926"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [accounts, setAccounts] = useState<UserAccount[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [branches, setBranches] = useState<{name_en: string, name_ar: string}[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [view, setView] = useState<'dashboard' | 'tickets' | 'create' | 'detail' | 'admin'>('dashboard');
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [vapidPublicKey, setVapidPublicKey] = useState<string | null>(null);
  
  // App Preferences
  const [lang, setLang] = useState<Language>('en');
  const [theme, setTheme] = useState<Theme>('light');

  const t = translations[lang];

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

  // Real-time Data Listeners
  useEffect(() => {
    if (!db) return;

    const unsubscribeTickets = onSnapshot(query(collection(db, "tickets"), orderBy("createdAt", "desc")), (snapshot) => {
      const ticketsData: Ticket[] = [];
      snapshot.forEach((doc) => ticketsData.push({ ...doc.data(), id: doc.id } as Ticket));
      setTickets(ticketsData);
    });

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
    });

    const unsubscribeNotifs = onSnapshot(query(collection(db, "notifications"), orderBy("timestamp", "desc"), limit(20)), (snapshot) => {
      const notifsData: AppNotification[] = [];
      snapshot.forEach((doc) => notifsData.push({ ...doc.data(), id: doc.id } as AppNotification));
      setNotifications(notifsData);
    });

    return () => {
      unsubscribeTickets();
      unsubscribeAccounts();
      unsubscribeBranches();
      unsubscribeNotifs();
    };
  }, []);

  const addNotification = useCallback(async (message: string, type: AppNotification['type'] = 'info', ticketId?: string) => {
    await addDoc(collection(db, "notifications"), {
      message,
      type,
      timestamp: Date.now(),
      read: false,
      ticketId: ticketId || null
    });
  }, []);

  const deleteTickets = async (ids: string[]) => {
    if (!ids.length) return;
    try {
      await Promise.all(ids.map(id => deleteDoc(doc(db, "tickets", id))));
      addNotification(`Successfully deleted ${ids.length} ticket(s).`, 'warning');
      if (selectedTicketId && ids.includes(selectedTicketId)) {
        setSelectedTicketId(null);
        setView('tickets');
      }
    } catch (error) {
      console.error("Bulk ticket deletion failed:", error);
      addNotification("Error: Failed to delete some tickets.", 'error');
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
      addNotification('Successfully subscribed to push notifications!', 'success');
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      addNotification('Failed to subscribe to push notifications.', 'error');
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
    setView('login');
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
    addNotification(`Ticket ${id} initiated.`, 'info', id);
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
    addNotification(`Ticket ${ticketId} updated.`, 'info', ticketId);
  };

  const deleteUser = async (id: string) => {
    if (id === currentUser?.id) {
      addNotification("You cannot delete your own account.", "error");
      return;
    }
    try {
      await deleteDoc(doc(db, "accounts", id));
      addNotification(`User account deleted: ${id}`, "warning");
    } catch (error) {
      console.error("User deletion failed:", error);
      addNotification("Error: System failed to delete user account.", "error");
    }
  };

  const deleteBranch = async (nameEn: string) => {
    try {
      await deleteDoc(doc(db, "branches", nameEn));
      addNotification(`Branch deleted: ${nameEn}`, "warning");
    } catch (error) {
      console.error("Branch deletion failed:", error);
      addNotification("Error: System failed to delete branch.", "error");
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
      <Login 
        onLogin={handleLogin} 
        lang={lang} 
        onSetLang={setLang}
        theme={theme}
        onSetTheme={setTheme}
        t={t} 
      />
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden relative">
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
          onMarkRead={async (id) => await updateDoc(doc(db, "notifications", id), { read: true })}
          onMarkAllRead={async () => {
            notifications.filter(n => !n.read).forEach(n => updateDoc(doc(db, "notifications", n.id), { read: true }));
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
