import React from 'react';
import { Settings, ShieldCheck, Database, Cpu, Lock, CheckCircle2 } from 'lucide-react';

export const AdminSettings: React.FC = () => {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          <Settings className="h-6 w-6 text-rose-500" />
          System Settings & Platform Architecture
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Review enterprise configurations, cryptographic safeguards, and infrastructure parameters.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Core Infrastructure */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2.5 pb-2 border-b border-slate-800">
            <Database className="h-5 w-5 text-indigo-400" />
            <h3 className="text-sm font-bold text-slate-200">Database & Tenancy Architecture</h3>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-800/60">
              <span className="text-slate-400">Database Engine</span>
              <span className="font-semibold text-slate-200">PostgreSQL (Supabase Pooler)</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-800/60">
              <span className="text-slate-400">ORM & Migration</span>
              <span className="text-slate-200">Prisma Client v6.4+</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-800/60">
              <span className="text-slate-400">Isolation Model</span>
              <span className="text-emerald-400 font-medium">Tenant-Bound Foreign Keys (userId)</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-800/60">
              <span className="text-slate-400">Connection State</span>
              <span className="text-emerald-400 flex items-center gap-1 font-medium">
                <CheckCircle2 className="h-3.5 w-3.5" /> Healthy
              </span>
            </div>
          </div>
        </div>

        {/* Security & Cryptography */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2.5 pb-2 border-b border-slate-800">
            <Lock className="h-5 w-5 text-rose-500" />
            <h3 className="text-sm font-bold text-slate-200">Cryptographic Enforcement</h3>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-800/60">
              <span className="text-slate-400">Password Hashing</span>
              <span className="text-slate-200 font-mono">Bcrypt (12 Salt Rounds)</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-800/60">
              <span className="text-slate-400">OAuth Refresh Token Storage</span>
              <span className="text-emerald-400 font-mono font-medium">AES-256-GCM + IV + Tag</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-800/60">
              <span className="text-slate-400">Session Cookie Transport</span>
              <span className="text-slate-200">HTTP-Only, SameSite=Lax</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-800/60">
              <span className="text-slate-400">Rate Limiter</span>
              <span className="text-slate-200">15 attempts / 15m (Auth)</span>
            </div>
          </div>
        </div>

        {/* AI & Outreach Intelligence */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2.5 pb-2 border-b border-slate-800">
            <Cpu className="h-5 w-5 text-purple-400" />
            <h3 className="text-sm font-bold text-slate-200">Outreach Intelligence & Engine</h3>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-800/60">
              <span className="text-slate-400">AI Model</span>
              <span className="text-purple-300 font-mono">Google Gemini 3.8-Flash</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-800/60">
              <span className="text-slate-400">Human Guardrail Policy</span>
              <span className="text-amber-400 font-medium">PENDING_APPROVAL Gate Enforced</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-800/60">
              <span className="text-slate-400">Deliverability Compliance</span>
              <span className="text-emerald-400">RFC 5322 MIME (Date, Message-ID, Base64)</span>
            </div>
          </div>
        </div>

        {/* Google OAuth Configuration */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2.5 pb-2 border-b border-slate-800">
            <ShieldCheck className="h-5 w-5 text-emerald-400" />
            <h3 className="text-sm font-bold text-slate-200">Google OAuth 2.0 Client Profile</h3>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-800/60">
              <span className="text-slate-400">Authorized Client ID</span>
              <span className="text-slate-300 font-mono truncate max-w-xs">
                525514666207-...apps.googleusercontent.com
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-800/60">
              <span className="text-slate-400">Redirect URI</span>
              <span className="text-slate-300 font-mono">/api/auth/google/callback</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-800/60">
              <span className="text-slate-400">OAuth Scopes</span>
              <span className="text-slate-300 font-mono">gmail.send, userinfo.email</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
