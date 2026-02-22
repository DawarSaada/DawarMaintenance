
import React from 'https://esm.sh/react@19.0.0';
import { UserRole, Language } from '../types.ts';

interface SidebarProps {
  currentView: string;
  setView: (view: any) => void;
  role: UserRole;
  onLogout: () => void;
  lang: Language;
  onSetLang: (l: Language) => void;
  t: any;
  isOpen: boolean;
  onToggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setView, role, onLogout, lang, onSetLang, t, isOpen, onToggle }) => {
  const isRtl = lang === 'ar';
  
  const NavItem = ({ id, label, icon }: { id: string, label: string, icon: string }) => (
    <button
      onClick={() => setView(id)}
      className={`w-full flex items-center space-x-3 px-4 py-3.5 rounded-2xl transition-all duration-200 ${
        currentView === id 
          ? 'bg-orange-600 text-white shadow-lg scale-[1.02]' 
          : 'text-slate-400 hover:bg-slate-800 dark:hover:bg-slate-700 hover:text-white'
      } ${isRtl ? 'space-x-reverse' : ''}`}
    >
      <span className="text-2xl">{icon}</span>
      <span className="font-bold tracking-tight">{label}</span>
    </button>
  );

  return (
    <>
      {/* Mobile Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] transition-opacity duration-300 md:hidden ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={onToggle}
      />

      {/* Sidebar Container */}
      <div className={`
        fixed md:relative top-0 bottom-0 z-[70] w-72 bg-slate-900 flex flex-col p-5 shadow-2xl transition-transform duration-300 ease-in-out
        ${isRtl 
          ? (isOpen ? 'right-0' : 'translate-x-full md:translate-x-0 right-0') 
          : (isOpen ? 'left-0' : '-translate-x-full md:translate-x-0 left-0')
        }
      `}>
        {/* Close button for mobile */}
        <button 
          onClick={onToggle}
          className="md:hidden absolute top-5 ltr:right-5 rtl:left-5 text-white p-2"
        >
          ✕
        </button>

        <div className="flex flex-col items-center py-8 mb-8 border-b border-slate-800">
          <div className="w-20 h-20 bg-[#f26722] rounded-3xl flex items-center justify-center text-white text-3xl font-black mb-4 shadow-xl transform rotate-3 hover:rotate-0 transition-transform cursor-pointer">
            DS
          </div>
          <h1 className="text-white font-black text-xl tracking-tighter uppercase">{t.appName}</h1>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mt-1">{t.hub}</p>
        </div>

        <nav className="flex-1 space-y-2 overflow-y-auto px-1">
          <NavItem id="dashboard" label={t.dashboard} icon="📊" />
          <NavItem id="tickets" label={t.allTickets} icon="🎫" />
          <NavItem id="create" label={t.newTicket} icon="➕" />
          {role === UserRole.OPERATION_MANAGER && (
            <NavItem id="admin" label={t.adminSettings} icon="⚙️" />
          )}
        </nav>

        <div className="pt-6 border-t border-slate-800 space-y-4">
          {/* Mobile Language Switcher */}
          <div className="md:hidden flex items-center justify-between px-4 py-3 bg-slate-800/50 rounded-2xl border border-slate-700/50">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{lang === 'en' ? 'Language' : 'اللغة'}</span>
            <button 
              onClick={() => onSetLang(lang === 'en' ? 'ar' : 'en')}
              className="text-xs font-bold text-orange-500 hover:text-orange-400 px-3 py-1 bg-orange-500/10 rounded-lg transition-colors"
            >
              {lang === 'en' ? 'العربية' : 'English'}
            </button>
          </div>

          <button
            onClick={onLogout}
            className={`w-full flex items-center space-x-3 px-4 py-4 rounded-2xl text-slate-400 hover:bg-red-900/20 hover:text-red-400 transition-all font-bold ${isRtl ? 'space-x-reverse' : ''}`}
          >
            <span className="text-2xl">🚪</span>
            <span>{t.logout}</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
