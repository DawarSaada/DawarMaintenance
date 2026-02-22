
import React, { useState } from 'https://esm.sh/react@19.0.0';
import { Language, Theme } from '../types.ts';

interface LoginProps {
  onLogin: (id: string, pass: string, stayLoggedIn: boolean) => boolean;
  lang: Language;
  onSetLang: (l: Language) => void;
  theme: Theme;
  onSetTheme: (t: Theme) => void;
  t: any;
}

const Login: React.FC<LoginProps> = ({ onLogin, lang, onSetLang, theme, onSetTheme, t }) => {
  const [id, setId] = useState('');
  const [pass, setPass] = useState('');
  const [stayLoggedIn, setStayLoggedIn] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const success = onLogin(id, pass, stayLoggedIn);
    if (!success) {
      setError('Invalid User ID or Password');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex flex-col items-center justify-center p-6 transition-colors relative">
      {/* Top Bar for Toggles */}
      <div className="absolute top-6 left-6 right-6 flex justify-between items-center">
        <div className="flex items-center space-x-4 space-x-reverse">
          <button 
            onClick={() => onSetLang(lang === 'en' ? 'ar' : 'en')}
            className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-black shadow-sm text-slate-600 dark:text-slate-300 hover:border-orange-500 transition-all"
          >
            {lang === 'en' ? 'ARABIC (العربية)' : 'ENGLISH'}
          </button>
          <button 
            onClick={() => onSetTheme(theme === 'light' ? 'dark' : 'light')}
            className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm text-xl hover:border-orange-500 transition-all"
          >
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
        </div>
      </div>

      <div className="max-w-[440px] w-full bg-white dark:bg-slate-900 rounded-[40px] shadow-2xl overflow-hidden animate-fadeIn">
        <div className="bg-[#f26722] pt-14 pb-12 px-8 text-center relative">
          <h1 className="text-white text-[42px] font-black tracking-tight leading-tight">{t.appName}</h1>
          <p className="text-white/90 mt-1 font-semibold text-sm tracking-wide">{t.hub}</p>
        </div>
        
        <div className="px-10 py-10">
          <form onSubmit={handleSubmit} className="space-y-7">
            {error && <div className="bg-red-50 text-red-600 p-3 rounded-xl text-center font-bold text-xs">{error}</div>}
            
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t.userId}</label>
                <input 
                  type="text" 
                  className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[20px] outline-none text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500"
                  value={id}
                  onChange={(e) => setId(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t.password}</label>
                <input 
                  type="password" 
                  className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[20px] outline-none text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500"
                  value={pass}
                  onChange={(e) => setPass(e.target.value)}
                  required
                />
              </div>

              <div className="flex items-center space-x-3 space-x-reverse cursor-pointer" onClick={() => setStayLoggedIn(!stayLoggedIn)}>
                <div className={`w-5 h-5 rounded-md border-2 transition-colors ${stayLoggedIn ? 'bg-orange-600 border-orange-600' : 'border-slate-200 dark:border-slate-700'}`}>
                  {stayLoggedIn && <span className="text-white text-xs block text-center">✓</span>}
                </div>
                <span className="text-xs font-bold text-slate-500">{t.staySignedIn}</span>
              </div>
            </div>
            
            <button type="submit" className="w-full py-5 bg-[#f26722] text-white rounded-[20px] font-bold shadow-lg hover:bg-orange-700 transition-all transform active:scale-[0.98]">
              {t.signIn}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
