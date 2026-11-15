import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Settings as SettingsIcon,
  ShieldCheck,
  Key,
  Database,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Lock,
  RefreshCw,
  User,
  KeyRound,
  Check,
} from 'lucide-react';
import { googleAuthApi, authApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const Settings: React.FC = () => {
  const queryClient = useQueryClient();
  const { user, refreshUser } = useAuth();

  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwSuccess, setPwSuccess] = useState<string | null>(null);
  const [isUpdatingPw, setIsUpdatingPw] = useState(false);

  const { data: googleStatus, isLoading } = useQuery({
    queryKey: ['googleStatus'],
    queryFn: googleAuthApi.getStatus,
  });

  const disconnectMutation = useMutation({
    mutationFn: googleAuthApi.disconnect,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['googleStatus'] });
      queryClient.invalidateQueries({ queryKey: ['analyticsOverview'] });
      refreshUser();
    },
  });

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError(null);
    setPwSuccess(null);

    if (newPassword.length < 8) {
      setPwError('New password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPwError('New password and confirmation do not match.');
      return;
    }

    setIsUpdatingPw(true);
    try {
      const res = await authApi.changePassword({
        currentPassword,
        newPassword,
        confirmPassword,
      });
      setPwSuccess(res.message);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setShowPasswordChange(false), 3000);
    } catch (err: any) {
      setPwError(err.response?.data?.error || 'Failed to update password.');
    } finally {
      setIsUpdatingPw(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
          <SettingsIcon className="h-6 w-6 text-brand-400" />
          Workspace Profile & Integrations
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Review your employee credentials, connected Gmail account, security settings, and platform guardrails.
        </p>
      </div>

      {/* User Profile Card */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3.5">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-brand-500/20 font-bold text-lg">
              {user?.fullName?.charAt(0) || 'U'}
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                {user?.fullName || 'Employee'}
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-400 border border-brand-500/30">
                  {user?.role || 'USER'}
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5 font-mono">{user?.email}</p>
            </div>
          </div>

          <button
            onClick={() => {
              setShowPasswordChange(!showPasswordChange);
              setPwError(null);
              setPwSuccess(null);
            }}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center gap-2 transition-colors"
          >
            <KeyRound className="h-3.5 w-3.5 text-brand-400" />
            <span>{showPasswordChange ? 'Cancel Password Change' : 'Change Password'}</span>
          </button>
        </div>

        {showPasswordChange && (
          <form onSubmit={handlePasswordChange} className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-3 animate-in fade-in">
            <h4 className="text-xs font-semibold text-slate-200">Update Account Password</h4>

            {pwError && (
              <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
                {pwError}
              </div>
            )}
            {pwSuccess && (
              <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5" />
                <span>{pwSuccess}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Current Password</label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-100"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">New Password (Min 8)</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-100"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Confirm New Password</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-100"
                />
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={isUpdatingPw}
                className="px-4 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold"
              >
                {isUpdatingPw ? 'Updating...' : 'Save New Password'}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Google OAuth Section */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800">
          <div className="flex items-center gap-3.5">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Official Google Gmail OAuth 2.0 Integration
                <span
                  className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                    googleStatus?.isConnected
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                  }`}
                >
                  {googleStatus?.isConnected ? 'Active & Verified' : 'Action Required'}
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Official Google APIs Node.js client library (`googleapis`) with secure offline access and auto-refresh.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {googleStatus?.isConnected ? (
              <button
                onClick={() => disconnectMutation.mutate()}
                disabled={disconnectMutation.isPending}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-rose-500/20 hover:text-rose-400 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors"
              >
                Disconnect Account
              </button>
            ) : (
              <button
                onClick={() => googleAuthApi.initiateAuth()}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md shadow-brand-600/20"
              >
                Connect with Google
                <ExternalLink className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Security Parameters & Config */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800 space-y-2">
            <span className="font-semibold text-slate-300 flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5 text-brand-400" />
              Token Encryption Guard
            </span>
            <p className="text-slate-400 leading-relaxed">
              Google refresh tokens are never stored in plaintext. They are encrypted using <span className="text-emerald-400 font-mono">AES-256-GCM</span> with unique IV and authentication tags stored in PostgreSQL.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800 space-y-2">
            <span className="font-semibold text-slate-300 flex items-center gap-1.5">
              <RefreshCw className="h-3.5 w-3.5 text-indigo-400" />
              Automatic Token Refreshing
            </span>
            <p className="text-slate-400 leading-relaxed">
              Access tokens are automatically refreshed in the background using the encrypted refresh token and offline scope. No manual re-login needed.
            </p>
          </div>
        </div>

        {/* Scopes & Endpoints */}
        <div className="space-y-3 pt-2 text-xs">
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/30 border border-slate-800">
            <span className="text-slate-400">OAuth Scopes Authorized:</span>
            <span className="font-mono text-emerald-400">https://www.googleapis.com/auth/gmail.send</span>
          </div>
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/30 border border-slate-800">
            <span className="text-slate-400">Configured Redirect URI:</span>
            <span className="font-mono text-slate-300">http://localhost:5000/api/auth/google/callback</span>
          </div>
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/30 border border-slate-800">
            <span className="text-slate-400">Connected Gmail Address:</span>
            <span className="font-mono font-semibold text-white">
              {googleStatus?.account?.email || 'Not connected yet'}
            </span>
          </div>
        </div>
      </div>

      {/* Cloud & AI Subsystems */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 space-y-3 text-xs">
          <div className="flex items-center gap-2.5 pb-2 border-b border-slate-800">
            <Key className="h-4 w-4 text-brand-400" />
            <h3 className="font-bold text-white text-sm">Google Gemini AI Engine</h3>
          </div>
          <p className="text-slate-400 leading-relaxed">
            Connected via official Google Generative AI SDK (<code className="text-brand-300 font-mono">@google/generative-ai</code>). Generates deliverability-compliant outreach copy tailored to recipient categories.
          </p>
          <div className="flex items-center justify-between pt-2 text-slate-300">
            <span>Model Pinned:</span>
            <span className="font-mono text-indigo-400">gemini-3.8-flash</span>
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 space-y-3 text-xs">
          <div className="flex items-center gap-2.5 pb-2 border-b border-slate-800">
            <Database className="h-4 w-4 text-emerald-400" />
            <h3 className="font-bold text-white text-sm">PostgreSQL / Supabase Database</h3>
          </div>
          <p className="text-slate-400 leading-relaxed">
            Connected to AWS Southeast-1 pooled Postgres instance via Prisma ORM with strict multi-user tenant isolation.
          </p>
          <div className="flex items-center justify-between pt-2 text-slate-300">
            <span>Isolation Status:</span>
            <span className="text-emerald-400 font-semibold flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" /> Tenant Isolated
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
