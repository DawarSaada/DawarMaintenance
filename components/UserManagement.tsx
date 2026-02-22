
import React, { useState } from 'https://esm.sh/react@19.0.0';
import { UserAccount, UserRole, Language } from '../types.ts';

interface UserManagementProps {
  accounts: UserAccount[];
  branches: {name_en: string, name_ar: string}[];
  onAddUser: (user: UserAccount) => void;
  onUpdateUser: (user: UserAccount, originalId: string) => void;
  onDeleteUser: (id: string) => void;
  t: any;
  lang: Language;
}

const UserManagement: React.FC<UserManagementProps> = ({ accounts, branches, onAddUser, onUpdateUser, onDeleteUser, t, lang }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<UserAccount>>({
    id: '',
    name: '',
    role: UserRole.BRANCH_MANAGER,
    password: 'password',
    branch: branches[0]?.name_en || ''
  });

  const startEdit = (account: UserAccount) => {
    setFormData(account);
    setEditingUserId(account.id);
    setIsAdding(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm(`${t.delete}? ID: ${id}`)) {
      onDeleteUser(id);
    }
  };

  const cancelForm = () => {
    setIsAdding(false);
    setEditingUserId(null);
    setFormData({
      id: '',
      name: '',
      role: UserRole.BRANCH_MANAGER,
      password: 'password',
      branch: branches[0]?.name_en || ''
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.id && formData.name) {
      if (editingUserId) {
        onUpdateUser(formData as UserAccount, editingUserId);
      } else {
        onAddUser(formData as UserAccount);
      }
      cancelForm();
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{t.usersRoles}</h2>
        <button 
          onClick={() => isAdding ? cancelForm() : setIsAdding(true)}
          className={`px-6 py-2 ${isAdding ? 'bg-slate-400' : 'bg-slate-800 dark:bg-slate-700'} text-white font-bold rounded-xl shadow-lg hover:bg-black transition-all`}
        >
          {isAdding ? t.cancel : t.addUser}
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-6 animate-fadeIn">
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">{t.userId}</label>
            <input 
              required
              type="text"
              disabled={!!editingUserId}
              className={`w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none font-medium text-slate-900 dark:text-white ${editingUserId ? 'opacity-50 cursor-not-allowed' : ''}`}
              placeholder="e.g. BM_MIRDIF_01"
              value={formData.id}
              onChange={e => setFormData({...formData, id: e.target.value})}
            />
            {editingUserId && <p className="text-[10px] text-orange-500 font-bold uppercase">Primary Key - Cannot be modified</p>}
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">{t.fullName}</label>
            <input 
              required
              type="text"
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none font-medium text-slate-900 dark:text-white"
              placeholder="e.g. John Doe"
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
            />
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">{t.role}</label>
            <select 
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none font-medium text-slate-900 dark:text-white"
              value={formData.role}
              onChange={e => setFormData({...formData, role: e.target.value as UserRole})}
            >
              <option value={UserRole.BRANCH_MANAGER}>Branch Manager</option>
              <option value={UserRole.OPERATION_MANAGER}>Operation Manager</option>
              <option value={UserRole.CEO}>CEO</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">{t.password}</label>
            <input 
              required
              type="text"
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none font-medium text-slate-900 dark:text-white"
              value={formData.password}
              onChange={e => setFormData({...formData, password: e.target.value})}
            />
          </div>
          {formData.role === UserRole.BRANCH_MANAGER && (
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">{t.branch}</label>
              <select 
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none font-medium text-slate-900 dark:text-white"
                value={formData.branch}
                onChange={e => setFormData({...formData, branch: e.target.value})}
              >
                {branches.map(b => (
                  <option key={b.name_en} value={b.name_en}>
                    {lang === 'ar' ? b.name_ar : b.name_en}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="md:col-span-2 flex justify-end">
            <button type="submit" className="px-10 py-3 bg-[#f26722] text-white font-bold rounded-xl shadow-lg hover:bg-orange-600 transition-all">
              {editingUserId ? t.save : t.addUser}
            </button>
          </div>
        </form>
      )}

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        <table className="w-full text-left rtl:text-right">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 text-slate-400 text-[10px] font-bold uppercase tracking-widest">
              <th className="px-6 py-4">{t.userId}</th>
              <th className="px-6 py-4">{t.fullName}</th>
              <th className="px-6 py-4">{t.role}</th>
              <th className="px-6 py-4">{t.branch}</th>
              <th className="px-6 py-4">{t.status}</th>
              <th className="px-6 py-4 text-right rtl:text-left">{t.actions}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {accounts.map(account => {
              const bInfo = branches.find(b => b.name_en === account.branch);
              const branchDisplay = bInfo ? (lang === 'ar' ? bInfo.name_ar : bInfo.name_en) : 'Corporate';
              return (
                <tr key={account.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                  <td className="px-6 py-4 font-mono text-sm text-slate-500 dark:text-slate-400">{account.id}</td>
                  <td className="px-6 py-4 font-bold text-slate-800 dark:text-slate-100">{account.name}</td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-bold text-slate-400 border border-slate-200 dark:border-slate-700 px-2 py-1 rounded-md">
                      {account.role.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-500 dark:text-slate-400 text-sm">{branchDisplay}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center text-emerald-500 text-xs font-bold">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2 ml-2"></span>
                      ACTIVE
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right rtl:text-left">
                    <div className="flex justify-end space-x-3 space-x-reverse">
                      <button 
                        onClick={() => startEdit(account)}
                        className="text-orange-600 hover:text-orange-700 font-bold text-sm underline"
                      >
                        {t.edit}
                      </button>
                      <button 
                        onClick={() => handleDelete(account.id)}
                        className="text-red-500 hover:text-red-700 font-bold text-sm underline opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        {t.delete}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserManagement;
