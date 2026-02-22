
import React from 'https://esm.sh/react@19.0.0';
import { Ticket, User, TicketStatus, UserRole } from '../types.ts';
import { STATUS_MAP } from '../constants.ts';

interface DashboardProps {
  tickets: Ticket[];
  user: User;
  onSelectTicket: (id: string) => void;
  t: any;
}

const Dashboard: React.FC<DashboardProps> = ({ tickets, user, onSelectTicket, t }) => {
  const filteredTickets = user.role === UserRole.BRANCH_MANAGER 
    ? tickets.filter(t => t.branch === user.branch)
    : tickets;

  const stats = {
    total: filteredTickets.length,
    pending: filteredTickets.filter(t => [TicketStatus.PENDING_OM_REVIEW, TicketStatus.PENDING_CEO_APPROVAL].includes(t.status)).length,
    resolved: filteredTickets.filter(t => t.status === TicketStatus.CLOSED).length,
    actionNeeded: filteredTickets.filter(t => {
      if (user.role === UserRole.OPERATION_MANAGER) return t.status === TicketStatus.PENDING_OM_REVIEW || t.status === TicketStatus.APPROVED_PENDING_RESOLUTION;
      if (user.role === UserRole.CEO) return t.status === TicketStatus.PENDING_CEO_APPROVAL;
      if (user.role === UserRole.BRANCH_MANAGER) return t.status === TicketStatus.RESOLVED_PENDING_VERIFICATION || t.status === TicketStatus.OM_REJECTED || t.status === TicketStatus.CEO_REJECTED;
      return false;
    }).length
  };

  const recentTickets = [...filteredTickets].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 5);

  const StatCard = ({ label, value, color }: { label: string, value: number, color: string }) => (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 transition-colors">
      <p className="text-slate-500 dark:text-slate-400 text-sm font-medium uppercase tracking-wider">{label}</p>
      <p className={`text-3xl font-bold mt-2 ${color}`}>{value}</p>
    </div>
  );

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label={t.myTasks} value={stats.actionNeeded} color="text-orange-600" />
        <StatCard label={t.pendingApproval} value={stats.pending} color="text-yellow-600" />
        <StatCard label={t.resolved} value={stats.resolved} color="text-emerald-600" />
        <StatCard label={t.totalTickets} value={stats.total} color="text-slate-800 dark:text-slate-200" />
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
          <h3 className="text-slate-800 dark:text-slate-100 font-bold text-lg">{t.recentActivity}</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left rtl:text-right">
            <thead>
              <tr className="text-slate-500 dark:text-slate-400 uppercase text-[10px] font-bold tracking-widest">
                <th className="px-6 py-4">{t.id}</th>
                <th className="px-6 py-4">{t.issue}</th>
                <th className="px-6 py-4">{t.branch}</th>
                <th className="px-6 py-4">{t.status}</th>
                <th className="px-6 py-4 text-right rtl:text-left">{t.action}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {recentTickets.map(ticket => (
                <tr key={ticket.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-6 py-4 font-mono text-sm text-slate-500 dark:text-slate-400">{ticket.id}</td>
                  <td className="px-6 py-4">
                    <p className="font-semibold text-slate-800 dark:text-slate-200">{ticket.title}</p>
                    <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{ticket.description}</p>
                  </td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-400 text-sm">{ticket.branch}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${STATUS_MAP[ticket.status].color}`}>
                      {STATUS_MAP[ticket.status].label}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right rtl:text-left">
                    <button 
                      onClick={() => onSelectTicket(ticket.id)}
                      className="text-[#f26722] hover:text-orange-700 font-semibold text-sm transition-colors"
                    >
                      {t.viewDetails}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
