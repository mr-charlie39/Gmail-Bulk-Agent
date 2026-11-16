import React, { useState, useEffect } from 'react';
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
  UserCheck,
  Save,
  Globe,
  FileCode
} from 'lucide-react';
import { googleAuthApi, authApi, profileApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { UserProfile } from '../types';

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

  // Profile Form state (10 fields)
  const [profileForm, setProfileForm] = useState<Partial<UserProfile>>({
    fullName: '',
    professionalTitle: '',
    location: '',
    shortBio: '',
    skills: '',
    servicesOffered: '',
    portfolioUrl: '',
    linkedinUrl: '',
    githubUrl: '',
    signature: '',
    writingStyle: '',
  });
  const [profileSavedMsg, setProfileSavedMsg] = useState<string | null>(null);

  const { data: userProfile, isLoading: isProfileLoading } = useQuery<UserProfile>({
    queryKey: ['userProfile'],
    queryFn: profileApi.getProfile,
  });

  useEffect(() => {
    if (userProfile) {
      setProfileForm({
        fullName: userProfile.fullName || '',
        professionalTitle: userProfile.professionalTitle || '',
        location: userProfile.location || '',
        shortBio: userProfile.shortBio || '',
        skills: userProfile.skills || '',
        servicesOffered: userProfile.servicesOffered || '',
        portfolioUrl: userProfile.portfolioUrl || '',
        linkedinUrl: userProfile.linkedinUrl || '',
        githubUrl: userProfile.githubUrl || '',
        signature: userProfile.signature || '',
        writingStyle: userProfile.writingStyle || '',
      });
    }
  }, [userProfile]);

  const updateProfileMutation = useMutation({
    mutationFn: profileApi.updateProfile,
    onSuccess: (updated) => {
      queryClient.setQueryData(['userProfile'], updated);
      setProfileSavedMsg('Profile successfully saved! Deterministic templates will use your updated details.');
      refreshUser();
      setTimeout(() => setProfileSavedMsg(null), 4000);
    },
  });

  const { data: googleStatus } = useQuery({
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

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate(profileForm);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
          <SettingsIcon className="h-6 w-6 text-brand-400" />
          Sender Profile & Workspace Configuration
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Manage your verified sender persona, Gmail OAuth credentials, and local SlopMonster quality settings.
        </p>
      </div>

      {/* User Account Bar */}
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

      {/* 10-Field Personal Profile Management Form */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 space-y-5">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-brand-400" />
              Sender Profile Details (10 Fields)
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              These details are substituted deterministically into templates. No AI hallucination or fabricated achievements.
            </p>
          </div>
          {profileSavedMsg && (
            <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5 bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/20">
              <CheckCircle2 className="h-4 w-4" />
              Saved
            </span>
          )}
        </div>

        <form onSubmit={handleProfileSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">1. Full Name</label>
              <input
                type="text"
                required
                value={profileForm.fullName || ''}
                onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">2. Professional Title</label>
              <input
                type="text"
                value={profileForm.professionalTitle || ''}
                onChange={(e) => setProfileForm({ ...profileForm, professionalTitle: e.target.value })}
                placeholder="e.g. Full-Stack Software Engineer"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">3. Location</label>
              <input
                type="text"
                value={profileForm.location || ''}
                onChange={(e) => setProfileForm({ ...profileForm, location: e.target.value })}
                placeholder="e.g. Remote / San Francisco, CA"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">4. Writing Style Preference</label>
              <input
                type="text"
                value={profileForm.writingStyle || ''}
                onChange={(e) => setProfileForm({ ...profileForm, writingStyle: e.target.value })}
                placeholder="e.g. Direct, concise, professional"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">5. Short Bio</label>
            <textarea
              rows={2}
              value={profileForm.shortBio || ''}
              onChange={(e) => setProfileForm({ ...profileForm, shortBio: e.target.value })}
              placeholder="A brief 1-2 sentence overview of your technical background..."
              className="w-full p-3 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">6. Skills (Comma-separated)</label>
              <textarea
                rows={2}
                value={profileForm.skills || ''}
                onChange={(e) => setProfileForm({ ...profileForm, skills: e.target.value })}
                placeholder="TypeScript, React, Node.js, Java, Spring Boot, PostgreSQL..."
                className="w-full p-3 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">7. Services Offered</label>
              <textarea
                rows={2}
                value={profileForm.servicesOffered || ''}
                onChange={(e) => setProfileForm({ ...profileForm, servicesOffered: e.target.value })}
                placeholder="Custom web applications, REST APIs, frontend engineering..."
                className="w-full p-3 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">8. Portfolio URL</label>
              <input
                type="url"
                value={profileForm.portfolioUrl || ''}
                onChange={(e) => setProfileForm({ ...profileForm, portfolioUrl: e.target.value })}
                placeholder="https://github.com/username"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">9. LinkedIn URL</label>
              <input
                type="url"
                value={profileForm.linkedinUrl || ''}
                onChange={(e) => setProfileForm({ ...profileForm, linkedinUrl: e.target.value })}
                placeholder="https://linkedin.com/in/username"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">GitHub URL</label>
              <input
                type="url"
                value={profileForm.githubUrl || ''}
                onChange={(e) => setProfileForm({ ...profileForm, githubUrl: e.target.value })}
                placeholder="https://github.com/username"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">10. Default Sender Signature</label>
            <textarea
              rows={3}
              value={profileForm.signature || ''}
              onChange={(e) => setProfileForm({ ...profileForm, signature: e.target.value })}
              placeholder="Best regards,&#10;Your Name&#10;Full-Stack Engineer"
              className="w-full p-3 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white font-mono"
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={updateProfileMutation.isPending}
              className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {updateProfileMutation.isPending ? 'Saving...' : 'Save Sender Profile'}
            </button>
          </div>
        </form>
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
            <span className="text-slate-400">Connected Gmail Address:</span>
            <span className="font-mono font-semibold text-white">
              {googleStatus?.account?.email || 'Not connected yet'}
            </span>
          </div>
        </div>
      </div>

      {/* Local SlopMonster & Database Architecture */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 space-y-3 text-xs">
          <div className="flex items-center gap-2.5 pb-2 border-b border-slate-800">
            <ShieldCheck className="h-4 w-4 text-brand-400" />
            <h3 className="font-bold text-white text-sm">SlopMonster Quality Engine</h3>
          </div>
          <p className="text-slate-400 leading-relaxed">
            Running locally via Python 3 (<code className="text-brand-300 font-mono">tools/deslop.py</code>). Flags AI writing patterns, corporate buzzwords, and syntactical tells with zero external API calls.
          </p>
          <div className="flex items-center justify-between pt-2 text-slate-300">
            <span>Execution Runtime:</span>
            <span className="font-mono text-emerald-400">Local Python 3 (Free)</span>
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
