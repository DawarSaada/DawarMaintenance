
import React, { useState } from 'https://esm.sh/react@19.0.0';
import { Ticket, User, UserRole, Priority, TicketStatus } from '../types.ts';
import { STATUS_MAP, PRIORITY_MAP } from '../constants.ts';

interface TicketListProps {
  tickets: Ticket[];
  user: User;
  onSelectTicket: (id: string) => void;
  onDeleteTickets: (ids: string[]) => void;
  t: any;
}

const TicketList: React.FC<TicketListProps> = ({ tickets, user, onSelectTicket, onDeleteTickets, t }) => {
  const [filter, setFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const isOM = user.role === UserRole.OPERATION_MANAGER;

  const filteredTickets = tickets.filter(t => {
    if (user.role === UserRole.BRANCH_MANAGER && t.branch !== user.branch) return false;
    const matchesSearch = t.title.toLowerCase().includes(searchTerm.toLowerCase()) || t.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === 'all' || 
      (filter === 'pending' && [TicketStatus.PENDING_OM_REVIEW, TicketStatus.PENDING_CEO_APPROVAL].includes(t.status)) ||
      (filter === 'active' && [TicketStatus.APPROVED_PENDING_RESOLUTION, TicketStatus.IN_PROGRESS].includes(t.status)) ||
      (filter === 'closed' && t.status === TicketStatus.CLOSED);
    return matchesSearch && matchesFilter;
  });

  const handleToggleSelectAll = () => {
    setSelectedIds(selectedIds.length === filteredTickets.length ? [] : filteredTickets.map(t => t.id));
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{t.allTickets}</h2>
        <div className="flex flex-wrap items-center gap-3">
          {isOM && selectedIds.length > 0 && (
            <button onClick={() => { if(window.confirm('Delete?')) onDeleteTickets(selectedIds); setSelectedIds([]); }} className="bg-red-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg hover:bg-red-700 transition-all">
              {t.deleteSelected} ({selectedIds.length})
            </button>
          )}
          <input 
            type="text" 
            placeholder={t.search}
            className="px-4 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select className="px-4 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 dark:text-white outline-none shadow-sm font-medium" value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">{t.allStatus}</option>
            <option value="pending">{t.pendingApproval}</option>
            <option value="active">{t.inProgress}</option>
            <option value="closed">{t.closed}</option>
          </select>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex items-center">
          <input type="checkbox" checked={filteredTickets.length > 0 && selectedIds.length === filteredTickets.length} onChange={handleToggleSelectAll} className="w-5 h-5 rounded border-slate-300 dark:border-slate-700 text-orange-600 focus:ring-orange-500 cursor-pointer" />
          <span className="mx-4 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{t.selectAll} ({filteredTickets.length})</span>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {filteredTickets.map(ticket => (
            <div key={ticket.id} onClick={() => onSelectTicket(ticket.id)} className="p-5 flex items-center justify-between hover:bg-orange-50/30 dark:hover:bg-orange-900/10 transition-all cursor-pointer group">
              <div className="flex items-center space-x-4 space-x-reverse">
                <input type="checkbox" checked={selectedIds.includes(ticket.id)} onClick={e => e.stopPropagation()} onChange={() => setSelectedIds(prev => prev.includes(ticket.id) ? prev.filter(i => i !== ticket.id) : [...prev, ticket.id])} className="w-5 h-5 rounded border-slate-300 dark:border-slate-700 text-orange-600" />
                <div className={`w-1 h-10 rounded-full ${STATUS_MAP[ticket.status].color.split(' ')[0]}`}></div>
                <div>
                  <h3 className="font-bold text-slate-800 dark:text-slate-200 group-hover:text-orange-600 transition-colors">{ticket.title}</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-xs">{ticket.id} • {ticket.branch}</p>
                </div>
              </div>
              <div className="flex items-center space-x-4 space-x-reverse">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${STATUS_MAP[ticket.status].color}`}>{STATUS_MAP[ticket.status].label}</span>
                <span className="text-slate-300 dark:text-slate-600">➡️</span>
              </div>
            </div>
          ))}
          {filteredTickets.length === 0 && <div className="p-20 text-center text-slate-400 italic">{t.noTickets}</div>}
        </div>
      </div>
    </div>
  );
};

export default TicketList;
