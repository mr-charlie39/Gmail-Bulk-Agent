import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CheckCircle2,
  XCircle,
  Send,
  Edit3,
  Save,
  AlertCircle,
  User,
  Building,
  Tag,
  Eye,
  CheckCheck
} from 'lucide-react';
import { approvalApi } from '../services/api';
import { EmailMessage } from '../types';

export const ApprovalQueue: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedEmail, setSelectedEmail] = useState<EmailMessage | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedSubject, setEditedSubject] = useState('');
  const [editedBody, setEditedBody] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);

  const { data: pendingList, isLoading } = useQuery<EmailMessage[]>({
    queryKey: ['pendingApproval'],
    queryFn: approvalApi.getPending,
    refetchInterval: 8000,
  });

  const approveMutation = useMutation({
    mutationFn: ({ id, sendImmediately }: { id: string; sendImmediately: boolean }) =>
      approvalApi.approve(id, sendImmediately),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pendingApproval'] });
      queryClient.invalidateQueries({ queryKey: ['analyticsOverview'] });
      setSelectedEmail(null);
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      approvalApi.reject(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pendingApproval'] });
      queryClient.invalidateQueries({ queryKey: ['analyticsOverview'] });
      setIsRejectModalOpen(false);
      setSelectedEmail(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, subject, bodyText }: { id: string; subject: string; bodyText: string }) =>
      approvalApi.updateDraft(id, { subject, bodyText }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pendingApproval'] });
      setIsEditing(false);
    },
  });

  const batchApproveMutation = useMutation({
    mutationFn: (emailIds: string[]) => approvalApi.batchApprove(emailIds, true),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pendingApproval'] });
      queryClient.invalidateQueries({ queryKey: ['analyticsOverview'] });
    },
  });

  const handleSelect = (email: EmailMessage) => {
    setSelectedEmail(email);
    setEditedSubject(email.subject);
    setEditedBody(email.bodyText);
    setIsEditing(false);
  };

  const handleSaveEdit = () => {
    if (!selectedEmail) return;
    updateMutation.mutate({
      id: selectedEmail.id,
      subject: editedSubject,
      bodyText: editedBody,
    });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto h-[calc(100vh-140px)] flex flex-col">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <CheckCircle2 className="h-6 w-6 text-amber-400" />
            Human-in-the-Loop Review Guard
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Strict safety rule: No email is ever sent automatically without your explicit approval.
          </p>
        </div>

        {pendingList && pendingList.length > 0 && (
          <button
            onClick={() => batchApproveMutation.mutate(pendingList.map((m) => m.id))}
            disabled={batchApproveMutation.isPending}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold uppercase tracking-wider transition-all shadow-md shadow-emerald-600/20"
          >
            <CheckCheck className="h-4 w-4" />
            Approve & Send All ({pendingList.length})
          </button>
        )}
      </div>

      {/* Main Two-Column View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0">
        {/* Left Column: List of pending items */}
        <div className="lg:col-span-5 bg-slate-900/60 border border-slate-800/80 rounded-2xl flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Drafts Queue ({pendingList?.length || 0})
            </span>
            <span className="text-[11px] text-amber-400 font-medium">Approval Required</span>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60 p-2 space-y-1">
            {pendingList && pendingList.length > 0 ? (
              pendingList.map((email) => {
                const isSelected = selectedEmail?.id === email.id;
                return (
                  <button
                    key={email.id}
                    onClick={() => handleSelect(email)}
                    className={`w-full text-left p-3.5 rounded-xl transition-all ${
                      isSelected
                        ? 'bg-brand-600/15 border border-brand-500/40 text-white'
                        : 'hover:bg-slate-800/40 border border-transparent text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-slate-200 truncate">
                        {email.recipient?.firstName || ''} {email.recipient?.lastName || email.recipient?.email}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700/60">
                        {email.recipient?.category || 'PROSPECT'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 font-medium truncate mt-1">
                      {email.subject}
                    </p>
                    <div className="flex items-center justify-between mt-2 text-[10px] text-slate-500">
                      <span>{email.recipient?.company || 'Organization'}</span>
                      <span>{new Date(email.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="h-full flex flex-col items-center justify-center p-8 text-center">
                <CheckCircle2 className="h-10 w-10 text-emerald-400 mb-3" />
                <h4 className="text-sm font-semibold text-slate-200">Review Queue is Clear</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-xs">
                  All generated emails have been approved or dispatched. Head over to AI Studio to generate new outreach campaigns.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Detailed Draft Review & Edit Pane */}
        <div className="lg:col-span-7 bg-slate-900/60 border border-slate-800/80 rounded-2xl flex flex-col overflow-hidden">
          {selectedEmail ? (
            <div className="flex-1 flex flex-col h-full overflow-hidden">
              {/* Draft Header */}
              <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/40 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-brand-500/10 text-brand-400 flex items-center justify-center font-bold text-xs">
                    {selectedEmail.recipient?.firstName?.[0] || 'R'}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">
                      {selectedEmail.recipient?.firstName} {selectedEmail.recipient?.lastName}
                    </h3>
                    <p className="text-xs text-slate-400 font-mono">{selectedEmail.recipient?.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                    title={isEditing ? 'Cancel Edit' : 'Edit Email'}
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Recipient Meta Bar */}
              <div className="px-5 py-2.5 bg-slate-950/40 border-b border-slate-800/80 flex items-center gap-6 text-xs text-slate-400 shrink-0">
                <span className="flex items-center gap-1.5">
                  <Building className="h-3.5 w-3.5 text-slate-500" />
                  {selectedEmail.recipient?.company || 'Company N/A'}
                </span>
                <span className="flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-slate-500" />
                  {selectedEmail.recipient?.jobTitle || 'Executive'}
                </span>
                <span className="flex items-center gap-1.5">
                  <Tag className="h-3.5 w-3.5 text-slate-500" />
                  {selectedEmail.recipient?.category || 'General'}
                </span>
              </div>

              {/* Draft Content (Scrollable) */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {/* Subject Line */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Subject Line
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editedSubject}
                      onChange={(e) => setEditedSubject(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:outline-none focus:border-brand-500"
                    />
                  ) : (
                    <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800 text-sm font-semibold text-slate-100">
                      {selectedEmail.subject}
                    </div>
                  )}
                </div>

                {/* Email Body */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Email Body (RFC 2822 & HTML)
                  </label>
                  {isEditing ? (
                    <div className="space-y-2">
                      <textarea
                        rows={10}
                        value={editedBody}
                        onChange={(e) => setEditedBody(e.target.value)}
                        className="w-full p-3.5 rounded-xl bg-slate-800 border border-slate-700 text-sm text-slate-100 font-sans focus:outline-none focus:border-brand-500 leading-relaxed"
                      />
                      <button
                        onClick={handleSaveEdit}
                        disabled={updateMutation.isPending}
                        className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold"
                      >
                        <Save className="h-3.5 w-3.5" />
                        Save Changes
                      </button>
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800 text-sm text-slate-200 leading-relaxed whitespace-pre-wrap font-sans">
                      {selectedEmail.bodyText}
                    </div>
                  )}
                </div>
              </div>

              {/* Actions Footer */}
              <div className="p-5 border-t border-slate-800 bg-slate-900/60 flex items-center justify-between shrink-0">
                <button
                  onClick={() => setIsRejectModalOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-semibold transition-colors"
                >
                  <XCircle className="h-4 w-4" />
                  Reject Draft
                </button>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => approveMutation.mutate({ id: selectedEmail.id, sendImmediately: false })}
                    disabled={approveMutation.isPending}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
                  >
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    Approve Only (Queue)
                  </button>
                  <button
                    onClick={() => approveMutation.mutate({ id: selectedEmail.id, sendImmediately: true })}
                    disabled={approveMutation.isPending}
                    className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold uppercase tracking-wider transition-all shadow-md shadow-emerald-600/20"
                  >
                    <Send className="h-4 w-4" />
                    Approve & Send via Gmail
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-slate-500">
              <Eye className="h-10 w-10 mb-3 text-slate-600" />
              <p className="text-sm font-semibold text-slate-400">Select an email to inspect</p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm">
                Click any draft on the left to review its AI-generated copy, verify recipient metadata, make manual edits, or dispatch via Gmail API.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Reject Modal */}
      {isRejectModalOpen && selectedEmail && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-rose-400" />
              Reject Email Draft
            </h3>
            <p className="text-xs text-slate-400">
              Specify a reason for rejecting this email draft for {selectedEmail.recipient?.email}.
            </p>
            <textarea
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g., Tone too informal, wrong product offering, or unverified contact info..."
              className="w-full p-3 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-rose-500"
            />
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setIsRejectModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={() => rejectMutation.mutate({ id: selectedEmail.id, reason: rejectReason })}
                disabled={rejectMutation.isPending}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
