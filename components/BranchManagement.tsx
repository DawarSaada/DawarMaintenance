
import React, { useState } from 'https://esm.sh/react@19.0.0';
import { Language } from '../types.ts';

interface BranchManagementProps {
  branches: {name_en: string, name_ar: string}[];
  onAddBranch: (branch: {name_en: string, name_ar: string}) => void;
  onDeleteBranch: (name_en: string) => void;
  t: any;
  lang: Language;
}

const BranchManagement: React.FC<BranchManagementProps> = ({ branches, onAddBranch, onDeleteBranch, t, lang }) => {
  const [newBranchEn, setNewBranchEn] = useState('');
  const [newBranchAr, setNewBranchAr] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newBranchEn.trim() && newBranchAr.trim()) {
      onAddBranch({ name_en: newBranchEn.trim(), name_ar: newBranchAr.trim() });
      setNewBranchEn('');
      setNewBranchAr('');
    }
  };

  const handleDelete = (nameEn: string) => {
    const confirmation = window.confirm(`${t.delete}? ${nameEn}`);
    if (confirmation) {
      onDeleteBranch(nameEn);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl animate-fadeIn">
      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800">
        <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest mb-6">{t.addBranch}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t.branchEn}</label>
            <input 
              required
              type="text" 
              placeholder="e.g. Al Quoz"
              className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none text-slate-900 dark:text-white font-medium"
              value={newBranchEn}
              onChange={(e) => setNewBranchEn(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ltr:text-left rtl:text-right">{t.branchAr}</label>
            <input 
              required
              type="text" 
              placeholder="مثال: القوز"
              dir="rtl"
              className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none text-slate-900 dark:text-white font-medium"
              value={newBranchAr}
              onChange={(e) => setNewBranchAr(e.target.value)}
            />
          </div>
        </div>
        <div className="mt-8 flex justify-end">
          <button 
            type="submit"
            className="px-10 py-4 bg-orange-600 text-white font-bold rounded-2xl shadow-lg hover:bg-orange-700 transition-all transform active:scale-95"
          >
            {t.addBranch}
          </button>
        </div>
      </form>

      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="px-8 py-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
          <h3 className="text-slate-800 dark:text-slate-100 font-bold">{t.activeBranches}</h3>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {branches.map(branch => (
            <div key={branch.name_en} className="px-8 py-5 flex justify-between items-center group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
              <div className="flex flex-col">
                <span className="text-slate-800 dark:text-slate-200 font-bold">{branch.name_en}</span>
                <span className="text-slate-400 dark:text-slate-500 text-sm font-medium" dir="rtl">{branch.name_ar}</span>
              </div>
              <button 
                onClick={() => handleDelete(branch.name_en)}
                className="text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity text-sm font-bold flex items-center"
              >
                <span className="mr-2">🗑️</span> {t.delete}
              </button>
            </div>
          ))}
          {branches.length === 0 && (
            <div className="p-20 text-center text-slate-400 italic">No branches configured.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BranchManagement;
