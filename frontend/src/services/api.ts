import axios from 'axios';
import {
  AdminDashboardStats,
  AdminGmailAccount,
  AdminUserListItem,
  AdminCampaignOverview,
  AuditLog,
  User,
  UserProfile,
  EmailTemplate,
  SlopMonsterResult,
} from '../types';

const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL.replace(/\/$/, '')}/api`
  : '/api';

export const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to inject Bearer token if present in localStorage
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle 401 unauthorized
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !window.location.pathname.includes('/login')) {
      // Clear token and let UI handle redirect
      localStorage.removeItem('access_token');
    }
    return Promise.reject(error);
  }
);

// ----------------- Authentication API -----------------
export const authApi = {
  login: async (credentials: { email: string; password: string; rememberMe?: boolean }): Promise<{ user: User; token: string }> => {
    const res = await api.post('/auth/login', credentials);
    if (res.data.token) {
      localStorage.setItem('access_token', res.data.token);
    }
    return res.data;
  },
  logout: async (): Promise<void> => {
    try {
      await api.post('/auth/logout');
    } finally {
      localStorage.removeItem('access_token');
    }
  },
  getMe: async (): Promise<User> => {
    const res = await api.get('/auth/me');
    return res.data;
  },
  changePassword: async (data: { currentPassword: string; newPassword: string; confirmPassword?: string }): Promise<{ success: boolean; message: string }> => {
    const res = await api.post('/auth/change-password', data);
    return res.data;
  },
};

// ----------------- Admin Management API -----------------
export const adminApi = {
  getDashboardStats: async (): Promise<{ stats: AdminDashboardStats; recentAuditLogs: AuditLog[] }> => {
    const res = await api.get('/admin/dashboard');
    return res.data;
  },
  listUsers: async (params?: { search?: string; status?: string; role?: string }): Promise<AdminUserListItem[]> => {
    const res = await api.get('/admin/users', { params });
    return res.data;
  },
  createUser: async (data: { fullName: string; email: string; initialPassword: string; role?: string; status?: string }): Promise<User> => {
    const res = await api.post('/admin/users', data);
    return res.data;
  },
  getUserDetails: async (id: string): Promise<AdminUserListItem> => {
    const res = await api.get(`/admin/users/${id}`);
    return res.data;
  },
  updateUser: async (id: string, data: { fullName?: string; status?: string; role?: string }): Promise<User> => {
    const res = await api.patch(`/admin/users/${id}`, data);
    return res.data;
  },
  toggleUserStatus: async (id: string, status: 'ACTIVE' | 'INACTIVE'): Promise<User> => {
    const res = await api.patch(`/admin/users/${id}/status`, { status });
    return res.data;
  },
  resetUserPassword: async (id: string, newPassword: string): Promise<{ success: boolean; message: string }> => {
    const res = await api.post(`/admin/users/${id}/reset-password`, { newPassword });
    return res.data;
  },
  deleteUser: async (id: string): Promise<{ success: boolean; message: string }> => {
    const res = await api.delete(`/admin/users/${id}`);
    return res.data;
  },
  listGmailAccounts: async (): Promise<AdminGmailAccount[]> => {
    const res = await api.get('/admin/gmail-accounts');
    return res.data;
  },
  getAuditLogs: async (params?: { limit?: number; action?: string }): Promise<AuditLog[]> => {
    const res = await api.get('/admin/audit-logs', { params });
    return res.data;
  },
  listCampaigns: async (): Promise<AdminCampaignOverview[]> => {
    const res = await api.get('/admin/campaigns');
    return res.data;
  },
};

// ----------------- User Workspace API -----------------
export const userApi = {
  getDashboard: () => api.get('/user/dashboard').then((r) => r.data),
  sendCampaignEmails: (campaignId: string) =>
    api.post(`/user/campaigns/${campaignId}/send`).then((r) => r.data),
};

// ----------------- Google Gmail OAuth API -----------------
export const googleAuthApi = {
  getStatus: () => api.get('/auth/google/status').then((r) => r.data),
  initiateAuth: () => {
    window.location.href = `${API_BASE}/auth/google`;
  },
  disconnect: () => api.post('/auth/google/disconnect').then((r) => r.data),
};

// ----------------- Analytics API -----------------
export const analyticsApi = {
  getOverview: () => api.get('/analytics/overview').then((r) => r.data),
};

// ----------------- Approval Workflow API -----------------
export const approvalApi = {
  getPending: () => api.get('/approval/pending').then((r) => r.data),
  updateDraft: (id: string, data: { subject?: string; bodyText?: string }) =>
    api.put(`/approval/${id}/update`, data).then((r) => r.data),
  approve: (id: string, sendImmediately = true) =>
    api.post(`/approval/${id}/approve`, { sendImmediately }).then((r) => r.data),
  reject: (id: string, reason?: string) =>
    api.post(`/approval/${id}/reject`, { reason }).then((r) => r.data),
  batchApprove: (emailIds: string[], sendImmediately = true) =>
    api.post('/approval/batch-approve', { emailIds, sendImmediately }).then((r) => r.data),
};

// ----------------- Sending Execution API -----------------
export const emailApi = {
  send: (id: string) => api.post(`/emails/send/${id}`).then((r) => r.data),
  batchSend: (emailIds: string[]) => api.post('/emails/batch-send', { emailIds }).then((r) => r.data),
};

// ----------------- AI Generation API -----------------
export const aiApi = {
  generate: (params: { recipientId: string; campaignId?: string; customInstructions?: string }) =>
    api.post('/ai/generate', params).then((r) => r.data),
  batchGenerate: (params: { recipientIds: string[]; campaignId?: string; customInstructions?: string }) =>
    api.post('/ai/batch-generate', params).then((r) => r.data),
};

// ----------------- Recipient API -----------------
export const recipientApi = {
  list: (search?: string, category?: string) =>
    api.get('/recipients', { params: { search, category } }).then((r) => r.data),
  create: (data: any) => api.post('/recipients', data).then((r) => r.data),
  batchCreate: (recipients: any[]) => api.post('/recipients/batch', { recipients }).then((r) => r.data),
  delete: (id: string) => api.delete(`/recipients/${id}`).then((r) => r.data),
};

// ----------------- Campaign API -----------------
export const campaignApi = {
  list: () => api.get('/campaigns').then((r) => r.data),
  getById: (id: string) => api.get(`/campaigns/${id}`).then((r) => r.data),
  create: (data: any) => api.post('/campaigns', data).then((r) => r.data),
  update: (id: string, data: any) => api.put(`/campaigns/${id}`, data).then((r) => r.data),
  delete: (id: string) => api.delete(`/campaigns/${id}`).then((r) => r.data),
};

// ----------------- History API -----------------
export const historyApi = {
  list: (params?: { status?: string; campaignId?: string }) =>
    api.get('/history', { params }).then((r) => r.data),
  getDetail: (id: string) => api.get(`/history/${id}`).then((r) => r.data),
};

// ----------------- Suppression List API -----------------
export const suppressionApi = {
  list: () => api.get('/suppression').then((r) => r.data),
  add: (email: string, reason?: string) => api.post('/suppression', { email, reason }).then((r) => r.data),
  remove: (email: string) => api.delete('/suppression', { data: { email } }).then((r) => r.data),
};

// ----------------- Personal Profile API -----------------
export const profileApi = {
  getProfile: (): Promise<UserProfile> => api.get('/profile').then((r) => r.data),
  updateProfile: (data: Partial<UserProfile>): Promise<UserProfile> => api.put('/profile', data).then((r) => r.data),
};

// ----------------- Deterministic Template & SlopMonster Composer API -----------------
export const composerApi = {
  getTemplates: (): Promise<EmailTemplate[]> => api.get('/composer/templates').then((r) => r.data),
  createTemplate: (data: any): Promise<EmailTemplate> => api.post('/composer/templates', data).then((r) => r.data),
  deleteTemplate: (id: string): Promise<any> => api.delete(`/composer/templates/${id}`).then((r) => r.data),
  generateDraft: (params: { recipientId: string; templateKeyOrId?: string; customInstructions?: string; campaignId?: string }): Promise<any> =>
    api.post('/composer/generate', params).then((r) => r.data),
  batchGenerate: (params: { recipientIds: string[]; templateKeyOrId?: string; customInstructions?: string; campaignId?: string }): Promise<any> =>
    api.post('/composer/batch-generate', params).then((r) => r.data),
  checkCopyQuality: (data: { subject?: string; bodyText?: string; text?: string; allowProof?: boolean }): Promise<SlopMonsterResult> =>
    api.post('/composer/check-slop', data).then((r) => r.data),
  updateDraft: (id: string, data: { subject?: string; bodyText?: string; allowProof?: boolean }): Promise<any> =>
    api.put(`/composer/drafts/${id}`, data).then((r) => r.data),
  approveDraft: (id: string, sendImmediately = false): Promise<any> =>
    api.post(`/composer/drafts/${id}/approve`, { sendImmediately }).then((r) => r.data),
};
