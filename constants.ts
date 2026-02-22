import { TicketStatus, Priority } from './types';

export const COLORS = {
  primary: '#f26722', // The orange from Dawar Saada logo
  secondary: '#333333',
  success: '#10b981',
  danger: '#ef4444',
  warning: '#f59e0b',
  info: '#3b82f6',
};

export const STATUS_MAP: Record<TicketStatus, { label: string; color: string }> = {
  [TicketStatus.PENDING_OM_REVIEW]: { label: 'Pending OM Review', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  [TicketStatus.PENDING_CEO_APPROVAL]: { label: 'Pending CEO Approval', color: 'bg-purple-100 text-purple-800 border-purple-200' },
  [TicketStatus.CEO_REJECTED]: { label: 'CEO Rejected', color: 'bg-red-100 text-red-800 border-red-200' },
  [TicketStatus.OM_REJECTED]: { label: 'OM Rejected', color: 'bg-red-100 text-red-800 border-red-200' },
  [TicketStatus.APPROVED_PENDING_RESOLUTION]: { label: 'Approved (To Resolve)', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  [TicketStatus.IN_PROGRESS]: { label: 'In Progress', color: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
  [TicketStatus.RESOLVED_PENDING_VERIFICATION]: { label: 'Resolved (Review)', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  [TicketStatus.CLOSED]: { label: 'Closed', color: 'bg-gray-100 text-gray-800 border-gray-200' },
  [TicketStatus.RE_ISSUED]: { label: 'Re-issued', color: 'bg-orange-100 text-orange-800 border-orange-200' },
};

export const PRIORITY_MAP: Record<Priority, { label: string; color: string }> = {
  [Priority.LOW]: { label: 'Low', color: 'text-gray-500' },
  [Priority.MEDIUM]: { label: 'Medium', color: 'text-blue-500' },
  [Priority.HIGH]: { label: 'High', color: 'text-orange-500' },
  [Priority.URGENT]: { label: 'Urgent', color: 'text-red-600 font-bold' },
};
