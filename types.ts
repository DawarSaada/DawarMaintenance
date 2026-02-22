
export enum UserRole {
  BRANCH_MANAGER = 'BRANCH_MANAGER',
  OPERATION_MANAGER = 'OPERATION_MANAGER',
  CEO = 'CEO'
}

export enum TicketStatus {
  PENDING_OM_REVIEW = 'PENDING_OM_REVIEW',
  PENDING_CEO_APPROVAL = 'PENDING_CEO_APPROVAL',
  CEO_REJECTED = 'CEO_REJECTED',
  OM_REJECTED = 'OM_REJECTED',
  APPROVED_PENDING_RESOLUTION = 'APPROVED_PENDING_RESOLUTION',
  IN_PROGRESS = 'IN_PROGRESS',
  RESOLVED_PENDING_VERIFICATION = 'RESOLVED_PENDING_VERIFICATION',
  CLOSED = 'CLOSED',
  RE_ISSUED = 'RE_ISSUED'
}

export enum Priority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT'
}

export type Language = 'en' | 'ar';
export type Theme = 'light' | 'dark';

export interface TicketComment {
  id: string;
  author: string;
  role: UserRole;
  text: string;
  timestamp: number;
}

export interface Ticket {
  id: string;
  title: string;
  description: string;
  branch: string;
  status: TicketStatus;
  priority: Priority;
  createdBy: string;
  createdAt: number;
  updatedAt: number;
  comments: TicketComment[];
  attachmentUrl?: string;
  assignedTo?: string;
  media?: string[];
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  branch?: string;
}

export interface UserAccount extends User {
  password?: string;
}

export interface AppNotification {
  id: string;
  message: string;
  type: 'success' | 'info' | 'warning' | 'error';
  timestamp: number;
  read: boolean;
  ticketId?: string;
}
