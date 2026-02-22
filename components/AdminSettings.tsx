import React, { useState } from 'https://esm.sh/react@19.0.0';
import { UserAccount, UserRole, Language } from '../types.ts';
import UserManagement from './UserManagement.tsx';
import BranchManagement from './BranchManagement.tsx';

interface AdminSettingsProps {
  accounts: UserAccount[];
  onAddUser: (user: UserAccount) => void;
  onUpdateUser: (user: UserAccount, originalId: string) => void;
  onDeleteUser: (id: string) => void;
  branches: {name_en: string, name_ar: string}[];
  onAddBranch: (branch: {name_en: string, name_ar: string}) => void;
  onDeleteBranch: (name: string) => void;
  t: any;
  lang: Language;
}

const AdminSettings: React.FC<AdminSettingsProps> = (props) => {
  const [activeTab, setActiveTab] = useState<'users' | 'branches'>('users');

  return (
    <div className="space-y-6">
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        <button 
          onClick={() => setActiveTab('users')}
          className={`px-6 py-3 font-bold text-sm transition-all border-b-2 ${activeTab === 'users' ? 'border-orange-500 text-orange-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
        >
          {props.t.usersRoles}
        </button>
        <button 
          onClick={() => setActiveTab('branches')}
          className={`px-6 py-3 font-bold text-sm transition-all border-b-2 ${activeTab === 'branches' ? 'border-orange-500 text-orange-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
        >
          {props.t.activeBranches}
        </button>
      </div>

      {activeTab === 'users' ? (
        <UserManagement 
          accounts={props.accounts} 
          onAddUser={props.onAddUser} 
          onUpdateUser={props.onUpdateUser} 
          onDeleteUser={props.onDeleteUser}
          branches={props.branches}
          t={props.t}
          lang={props.lang}
        />
      ) : (
        <BranchManagement 
          branches={props.branches} 
          onAddBranch={props.onAddBranch} 
          onDeleteBranch={props.onDeleteBranch}
          t={props.t}
          lang={props.lang}
        />
      )}
    </div>
  );
};

export default AdminSettings;