
import React, { useState, useRef, useEffect } from 'https://esm.sh/react@19.0.0';
import { User, UserRole, AppNotification, Language, Theme } from '../types.ts';

interface HeaderProps {
  user: User;
  notifications: AppNotification[];
  currentTicketId?: string | null;
  lang: Language;
  theme: Theme;
  onSetLang: (l: Language) => void;
  onSetTheme: (t: Theme) => void;
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  t: any;
  onMenuClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ user, notifications, currentTicketId, lang, theme, onSetLang, onSetTheme, onMarkRead, onMarkAllRead, t, onMenuClick }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const unreadCount = notifications.filter(n => !n.read).length;
  const dropdownRef = useRef<HTMLDivElement>(null);
  const isRtl = lang === 'ar';

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 h-16 md:h-20 flex items-center justify-between px-4 md:px-8 shadow-sm relative z-40 transition-colors">
      <div className="flex items-center space-x-2 md:space-x-3 space-x-reverse">
        {/* Mobile Menu Button */}
        <button 
          onClick={onMenuClick}
          className="md:hidden p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-2xl"
        >
          ☰
        </button>

        <div className="hidden sm:block h-8 w-1 bg-orange-500 rounded-full mx-1"></div>
        <div className="flex flex-col">
          <h2 className="text-slate-800 dark:text-slate-100 font-bold text-sm md:text-lg leading-tight truncate max-w-[120px] md:max-w-none">
            {user.role === UserRole.BRANCH_MANAGER ? user.branch : user.name}
          </h2>
          <div className="flex items-center space-x-2 space-x-reverse md:hidden">
             <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
              {user.role.replace('_', ' ')}
            </span>
          </div>
        </div>
        {currentTicketId && (
          <span className="hidden lg:flex bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-3 py-1 rounded-lg text-xs font-mono font-bold border border-slate-200 dark:border-slate-700 ml-4 rtl:mr-4">
            #{currentTicketId}
          </span>
        )}
      </div>

      <div className="flex items-center space-x-2 md:space-x-6 space-x-reverse">
        {/* Theme Toggle */}
        <button 
          onClick={() => onSetTheme(theme === 'light' ? 'dark' : 'light')}
          className="p-2 md:p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-xl"
        >
          {theme === 'light' ? '🌙' : '☀️'}
        </button>

        {/* Language Toggle - Visible on all screens */}
        <button 
          onClick={() => onSetLang(lang === 'en' ? 'ar' : 'en')}
          className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-[9px] md:text-[10px] font-black text-slate-600 dark:text-slate-300 hover:bg-orange-100 dark:hover:bg-orange-900 transition-colors border border-slate-200 dark:border-slate-700 whitespace-nowrap"
        >
          {lang === 'en' ? 'AR' : 'EN'}
        </button>

        {/* Notification Bell */}
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setShowDropdown(!showDropdown)}
            className="p-2 md:p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative text-xl md:text-2xl"
          >
            🔔
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 bg-red-500 text-white text-[9px] font-black w-4 h-4 flex items-center justify-center rounded-full border-2 border-white dark:border-slate-900">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showDropdown && (
            <div className={`absolute ${isRtl ? 'left-0' : 'right-0'} mt-4 w-72 md:w-96 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-fadeInUp`}>
              <div className="px-4 py-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
                <span className="font-black uppercase tracking-widest text-slate-800 dark:text-slate-100 text-[10px]">Updates</span>
                {unreadCount > 0 && (
                  <button onClick={onMarkAllRead} className="text-orange-600 text-[10px] font-black uppercase hover:underline">
                    Clear
                  </button>
                )}
              </div>
              <div className="max-h-[70vh] overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-12 text-center text-slate-400 text-xs italic font-medium">No recent activity.</div>
                ) : (
                  notifications.slice(0, 15).map((n) => (
                    <div key={n.id} className={`p-5 border-b border-slate-50 dark:border-slate-700 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer ${!n.read ? 'bg-orange-50/20 dark:bg-orange-900/10' : ''}`}>
                      <p className={`text-xs leading-relaxed ${!n.read ? 'text-slate-900 dark:text-white font-bold' : 'text-slate-500 dark:text-slate-400 font-medium'}`}>
                        {n.message}
                      </p>
                      <span className="block text-[9px] text-slate-400 font-bold uppercase tracking-tight mt-2 opacity-60">
                        {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div className="hidden md:flex flex-col text-right ltr:text-right rtl:text-left">
          <span className="text-slate-800 dark:text-slate-100 font-bold text-sm truncate max-w-[150px]">{user.name}</span>
          <span className="text-slate-400 dark:text-slate-500 text-[9px] font-black uppercase tracking-[0.15em]">
            {user.role.replace('_', ' ')}
          </span>
        </div>
      </div>
    </header>
  );
};

export default Header;
