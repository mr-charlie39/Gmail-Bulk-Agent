import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ShieldAlert,
  UserX,
  Trash2,
  AlertOctagon,
  Plus
} from 'lucide-react';
import { suppressionApi } from '../services/api';

export const Suppression: React.FC = () => {
  const queryClient = useQueryClient();
  const [newEmail, setNewEmail] = useState('');
  const [reason, setReason] = useState('UNSUBSCRIBE');
  const [isAddOpen, setIsAddOpen] = useState(false);

  const { data: suppressions, isLoading } = useQuery({
    queryKey: ['suppressionList'],
    queryFn: suppressionApi.list,
  });

  const addMutation = useMutation({
    mutationFn: ({ email, reason }: { email: string; reason: string }) =>
      suppressionApi.add(email, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppressionList'] });
      setIsAddOpen(false);
      setNewEmail('');
    },
  });

  const removeMutation = useMutation({
    mutationFn: (email: string) => suppressionApi.remove(email),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppressionList'] });
    },
  });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail) return;
    addMutation.mutate({ email: newEmail, reason });
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <ShieldAlert className="h-6 w-6 text-rose-400" />
            Suppression & Unsubscribe List
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Protects your Gmail sender domain reputation by hard-blocking emails to unsubscribed or bounced contacts.
          </p>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold uppercase tracking-wider transition-all shadow-md shadow-rose-600/20"
        >
          <Plus className="h-4 w-4" />
          Add to Suppression
        </button>
      </div>

      {/* Suppression Table */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400 bg-slate-900/40">
              <th className="py-3.5 px-6">Suppressed Email</th>
              <th className="py-3.5 px-6">Reason</th>
              <th className="py-3.5 px-6">Added Date</th>
              <th className="py-3.5 px-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-xs text-slate-200">
            {suppressions && suppressions.length > 0 ? (
              suppressions.map((item: any) => (
                <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3.5 px-6 font-mono text-slate-200">{item.email}</td>
                  <td className="py-3.5 px-6">
                    <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
                      {item.reason}
                    </span>
                  </td>
                  <td className="py-3.5 px-6 text-slate-400">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-3.5 px-6 text-right">
                    <button
                      onClick={() => removeMutation.mutate(item.email)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="Remove from suppression"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="py-12 text-center text-slate-500">
                  No suppressed emails on record.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleAdd}
            className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4"
          >
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <UserX className="h-5 w-5 text-rose-400" />
              Suppress Email Address
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address *</label>
              <input
                type="email"
                required
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="contact@domain.com"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-rose-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Reason</label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-rose-500"
              >
                <option value="UNSUBSCRIBE">Unsubscribed via Link</option>
                <option value="BOUNCE">Hard Bounced Mailbox</option>
                <option value="MANUAL">Manual Suppression</option>
                <option value="COMPLAINT">Spam / Complaint Flag</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsAddOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={addMutation.isPending}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold"
              >
                Suppress Email
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
