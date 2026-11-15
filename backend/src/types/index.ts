import { Request } from 'express';

export type Role = 'ADMIN' | 'USER';
export type AccountStatus = 'ACTIVE' | 'INACTIVE';

export interface AuthenticatedUser {
  id: string;
  fullName: string;
  email: string;
  role: Role;
  status: AccountStatus;
  mustChangePassword: boolean;
}

export interface AuthRequest extends Request {
  user?: AuthenticatedUser;
}

export interface AIResponsePayload {
  subject: string;
  bodyText: string;
  bodyHtml: string;
  personalizationNotes?: string;
  tone?: string;
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  threadId?: string;
  error?: string;
}
