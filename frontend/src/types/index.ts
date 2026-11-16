export type Role = 'ADMIN' | 'USER';
export type AccountStatus = 'ACTIVE' | 'INACTIVE';

export interface User {
  id: string;
  fullName: string;
  email: string;
  role: Role;
  status: AccountStatus;
  mustChangePassword: boolean;
  createdAt: string;
  lastLoginAt?: string | null;
  gmailConnection?: {
    gmailAddress: string;
    connected: boolean;
    tokenVersion?: number;
    updatedAt: string;
  } | null;
}

export interface AdminUserListItem extends User {
  _count?: {
    campaigns: number;
    sentEmails: number;
    recipients: number;
    generatedEmails?: number;
  };
}

export interface AdminDashboardStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  connectedGmailAccounts: number;
  totalCampaigns: number;
  totalGenerated: number;
  totalSent: number;
  totalFailed: number;
  pendingApprovals: number;
}

export interface AuditLog {
  id: string;
  actorUserId?: string | null;
  actor?: {
    fullName: string;
    email: string;
    role: string;
  } | null;
  action: string;
  targetUserId?: string | null;
  metadata?: any;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: string;
}

export interface AdminGmailAccount {
  id: string;
  userId: string;
  employeeName: string;
  employeeLoginEmail: string;
  employeeStatus: AccountStatus;
  gmailAddress: string;
  connected: boolean;
  tokenVersion: number;
  lastVerified: string;
}

export interface AdminCampaignOverview {
  id: string;
  name: string;
  description?: string;
  status: 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'COMPLETED';
  createdAt: string;
  user: {
    fullName: string;
    email: string;
  };
  _count: {
    generatedEmails: number;
    sentEmails: number;
  };
}

export interface GoogleConnectionStatus {
  isConnected: boolean;
  account: {
    email: string;
    scopes: string[];
    lastVerified: string;
  } | null;
}

export interface Recipient {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  company?: string;
  jobTitle?: string;
  category?: string;
  customData?: Record<string, any>;
  status: string;
  createdAt: string;
}

export interface Campaign {
  id: string;
  name: string;
  description?: string;
  status: 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'COMPLETED';
  promptTemplate?: string;
  subjectTemplate?: string;
  createdAt: string;
  _count?: {
    generatedEmails?: number;
    sentEmails?: number;
    emailMessages?: number;
  };
}

export interface EmailMessage {
  id: string;
  campaignId?: string;
  campaign?: Campaign;
  recipientId: string;
  recipient: Recipient;
  subject: string;
  bodyHtml: string;
  bodyText: string;
  status: 'DRAFT' | 'QUALITY_CHECKED' | 'APPROVED' | 'QUEUED' | 'GMAIL_ACCEPTED' | 'SENT' | 'FAILED' | 'BOUNCED' | 'CANCELLED' | 'PENDING_APPROVAL' | 'REJECTED';
  rejectionReason?: string;
  slopScore?: number;
  slopClean?: boolean;
  slopReport?: string;
  gmailMessageId?: string;
  gmailThreadId?: string;
  sentAt?: string;
  approvedAt?: string;
  approvedBy?: string;
  errorLog?: string;
  createdAt: string;
  updatedAt: string;
  events?: {
    id: string;
    type: string;
    metadata: any;
    timestamp: string;
  }[];
}

export interface UserProfile {
  id: string;
  userId: string;
  fullName: string;
  professionalTitle?: string;
  location?: string;
  shortBio?: string;
  skills?: string;
  servicesOffered?: string;
  portfolioUrl?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  signature?: string;
  writingStyle?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface EmailTemplate {
  id: string;
  name: string;
  category: string;
  description?: string;
  subjectTemplate: string;
  openingSentence?: string;
  reasonForContact: string;
  relevantService: string;
  portfolioInfo?: string;
  naturalClosing?: string;
  isCustom?: boolean;
}

export interface SlopMonsterResult {
  score: number;
  clean: boolean;
  wordCount: number;
  flagsByCategory: {
    vocab: number;
    phrases: number;
    punctuation: number;
    rhythm: number;
    proof: number;
  };
  totalFlags: number;
  rawReport: string;
}

export interface AnalyticsOverview {
  kpis: {
    totalEmails: number;
    sent: number;
    pending: number;
    approved: number;
    rejected: number;
    failed: number;
    totalRecipients: number;
    campaigns: number;
    approvalRate: number;
  };
  googleConnection: {
    connected: boolean;
    email: string | null;
    lastSynced?: string;
  };
  recentActivity: EmailMessage[];
}
