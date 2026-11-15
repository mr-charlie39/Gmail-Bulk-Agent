import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Users,
  UserPlus,
  Upload,
  Search,
  Trash2,
  Building,
  Tag,
  Mail,
  CheckCircle2,
  FileSpreadsheet
} from 'lucide-react';
import { recipientApi } from '../services/api';
import { Recipient } from '../types';

export const Recipients: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);

  // New recipient form state
  const [newEmail, setNewEmail] = useState('');
  const [newFirstName, setNewFirstName] = useState('');
  const [newLastName, setNewLastName] = useState('');
  const [newCompany, setNewCompany] = useState('');
  const [newJobTitle, setNewJobTitle] = useState('');
  const [newCategory, setNewCategory] = useState('ENTERPRISE');

  // CSV text state
  const [csvRawText, setCsvRawText] = useState('');

  const { data: recipients, isLoading } = useQuery<Recipient[]>({
    queryKey: ['recipientsList', searchTerm, selectedCategory],
    queryFn: () => recipientApi.list(searchTerm || undefined, selectedCategory || undefined),
  });

  const createMutation = useMutation({
    mutationFn: recipientApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipientsList'] });
      queryClient.invalidateQueries({ queryKey: ['analyticsOverview'] });
      setIsAddModalOpen(false);
      resetForm();
    },
  });

  const batchMutation = useMutation({
    mutationFn: recipientApi.batchCreate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipientsList'] });
      queryClient.invalidateQueries({ queryKey: ['analyticsOverview'] });
      setIsCsvModalOpen(false);
      setCsvRawText('');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: recipientApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipientsList'] });
      queryClient.invalidateQueries({ queryKey: ['analyticsOverview'] });
    },
  });

  const resetForm = () => {
    setNewEmail('');
    setNewFirstName('');
    setNewLastName('');
    setNewCompany('');
    setNewJobTitle('');
    setNewCategory('ENTERPRISE');
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail) return;
    createMutation.mutate({
      email: newEmail,
      firstName: newFirstName || undefined,
      lastName: newLastName || undefined,
      company: newCompany || undefined,
      jobTitle: newJobTitle || undefined,
      category: newCategory,
    });
  };

  const handleCsvSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvRawText.trim()) return;

    // Parse CSV lines
    const lines = csvRawText.trim().split('\n');
    const parsed: any[] = [];

    for (const line of lines) {
      const parts = line.split(',').map((p) => p.trim().replace(/^["']|["']$/g, ''));
      if (parts.length >= 1 && parts[0].includes('@')) {
        parsed.push({
          email: parts[0],
          firstName: parts[1] || undefined,
          lastName: parts[2] || undefined,
          company: parts[3] || undefined,
          jobTitle: parts[4] || undefined,
          category: parts[5] || 'ENTERPRISE',
        });
      }
    }

    if (parsed.length > 0) {
      batchMutation.mutate(parsed);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Users className="h-6 w-6 text-brand-400" />
            Prospect & Recipient Repository
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage your verified contact lists, company domains, and personalization categories.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsCsvModalOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
          >
            <Upload className="h-4 w-4" />
            Import CSV
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold uppercase tracking-wider transition-all shadow-md shadow-brand-600/20"
          >
            <UserPlus className="h-4 w-4" />
            Add Contact
          </button>
        </div>
      </div>

      {/* Filter and Search controls */}
      <div className="flex flex-col sm:flex-row gap-3 bg-slate-900/60 border border-slate-800/80 p-3.5 rounded-2xl">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, email, or company..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-800/70 border border-slate-700 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-brand-500"
          />
        </div>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-3.5 py-2 rounded-xl bg-slate-800/70 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
        >
          <option value="">All Categories</option>
          <option value="ENTERPRISE">Enterprise</option>
          <option value="STARTUP">Startup</option>
          <option value="INVESTOR">Investor</option>
          <option value="RECRUITER">Recruiter</option>
          <option value="GENERAL">General</option>
        </select>
      </div>

      {/* Recipients Table */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400 bg-slate-900/40">
              <th className="py-3.5 px-6">Prospect Name</th>
              <th className="py-3.5 px-6">Email Address</th>
              <th className="py-3.5 px-6">Company & Title</th>
              <th className="py-3.5 px-6">Audience Tier</th>
              <th className="py-3.5 px-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-xs text-slate-200">
            {recipients && recipients.length > 0 ? (
              recipients.map((r) => (
                <tr key={r.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3.5 px-6 font-semibold text-white">
                    {r.firstName || r.lastName ? `${r.firstName || ''} ${r.lastName || ''}` : '—'}
                  </td>
                  <td className="py-3.5 px-6 font-mono text-slate-300">{r.email}</td>
                  <td className="py-3.5 px-6">
                    <div className="font-medium">{r.company || '—'}</div>
                    <div className="text-[11px] text-slate-400">{r.jobTitle || '—'}</div>
                  </td>
                  <td className="py-3.5 px-6">
                    <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-400 border border-brand-500/20">
                      {r.category || 'GENERAL'}
                    </span>
                  </td>
                  <td className="py-3.5 px-6 text-right">
                    <button
                      onClick={() => deleteMutation.mutate(r.id)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="Delete Recipient"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="py-12 text-center text-slate-500">
                  No prospects found. Add a contact or import via CSV to begin.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add Single Recipient Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleAddSubmit}
            className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4"
          >
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-brand-400" />
              Add Target Prospect
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">First Name</label>
                <input
                  type="text"
                  value={newFirstName}
                  onChange={(e) => setNewFirstName(e.target.value)}
                  placeholder="e.g., Alex"
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-brand-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Last Name</label>
                <input
                  type="text"
                  value={newLastName}
                  onChange={(e) => setNewLastName(e.target.value)}
                  placeholder="e.g., Mercer"
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Email Address <span className="text-rose-400">*</span>
              </label>
              <input
                type="email"
                required
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="alex.mercer@company.com"
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-brand-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Company</label>
                <input
                  type="text"
                  value={newCompany}
                  onChange={(e) => setNewCompany(e.target.value)}
                  placeholder="Acme Corp"
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-brand-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Job Title</label>
                <input
                  type="text"
                  value={newJobTitle}
                  onChange={(e) => setNewJobTitle(e.target.value)}
                  placeholder="VP Engineering"
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Audience Tier</label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-brand-500"
              >
                <option value="ENTERPRISE">ENTERPRISE (ROI, security, scale)</option>
                <option value="STARTUP">STARTUP (Speed, growth, agility)</option>
                <option value="INVESTOR">INVESTOR (Metrics, traction)</option>
                <option value="RECRUITER">RECRUITER (Talent, collaboration)</option>
                <option value="GENERAL">GENERAL</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-md shadow-brand-600/20"
              >
                Save Contact
              </button>
            </div>
          </form>
        </div>
      )}

      {/* CSV Import Modal */}
      {isCsvModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleCsvSubmit}
            className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-lg w-full space-y-4"
          >
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-emerald-400" />
              Batch Import Prospects via CSV
            </h3>
            <p className="text-xs text-slate-400">
              Paste comma-separated rows. Expected format:
              <br />
              <code className="text-emerald-400 font-mono text-[11px]">
                email, firstName, lastName, company, jobTitle, category
              </code>
            </p>

            <textarea
              rows={8}
              value={csvRawText}
              onChange={(e) => setCsvRawText(e.target.value)}
              placeholder="sarah@enterprise.io, Sarah, Connor, Cyberdyne, CTO, ENTERPRISE&#10;john@founder.co, John, Doe, Seedling, CEO, STARTUP"
              className="w-full p-3 rounded-xl bg-slate-800 border border-slate-700 font-mono text-xs text-white focus:outline-none focus:border-emerald-500 leading-relaxed"
            />

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsCsvModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={batchMutation.isPending}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
              >
                Import Prospects
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
