import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Users,
  Layers,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Search,
  Sparkles,
  Send,
  Eye,
  RefreshCw,
  Sliders,
  Check,
  AlertTriangle
} from 'lucide-react';
import { composerApi, recipientApi, campaignApi } from '../services/api';
import { Recipient, Campaign, EmailTemplate, SlopMonsterResult } from '../types';

export const Generator: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [selectedTemplateKey, setSelectedTemplateKey] = useState('WEB_DEV');
  const [selectedRecipientId, setSelectedRecipientId] = useState('');
  const [selectedCampaignId, setSelectedCampaignId] = useState('');
  const [customInstructions, setCustomInstructions] = useState('');
  const [batchMode, setBatchMode] = useState(false);
  const [selectedBatchIds, setSelectedBatchIds] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Live draft preview / editor
  const [activeDraft, setActiveDraft] = useState<any | null>(null);
  const [subjectText, setSubjectText] = useState('');
  const [bodyText, setBodyText] = useState('');
  const [slopResult, setSlopResult] = useState<SlopMonsterResult | null>(null);
  const [isCheckingSlop, setIsCheckingSlop] = useState(false);

  const { data: templates } = useQuery<EmailTemplate[]>({
    queryKey: ['composerTemplates'],
    queryFn: composerApi.getTemplates,
  });

  const { data: recipients } = useQuery<Recipient[]>({
    queryKey: ['recipientsList'],
    queryFn: () => recipientApi.list(),
  });

  const { data: campaigns } = useQuery<Campaign[]>({
    queryKey: ['campaignsList'],
    queryFn: campaignApi.list,
  });

  const generateSingleMutation = useMutation({
    mutationFn: composerApi.generateDraft,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['pendingApproval'] });
      queryClient.invalidateQueries({ queryKey: ['analyticsOverview'] });
      setActiveDraft(data.draft);
      setSubjectText(data.draft.subject);
      setBodyText(data.draft.body);
      setSlopResult(data.slopResult);
      setSuccessMessage('Draft generated deterministically with zero AI API costs & checked via SlopMonster.');
    },
    onError: (err: any) => {
      const msg = err.response?.data?.error || err.message || 'Draft generation failed';
      setErrorMessage(msg);
    },
  });

  const generateBatchMutation = useMutation({
    mutationFn: composerApi.batchGenerate,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['pendingApproval'] });
      queryClient.invalidateQueries({ queryKey: ['analyticsOverview'] });
      setSuccessMessage(`Successfully composed ${data.results.length} drafts! Forwarding to Approval Queue...`);
      setTimeout(() => navigate('/approval'), 1500);
    },
    onError: (err: any) => {
      const msg = err.response?.data?.error || err.message || 'Batch composition failed';
      setErrorMessage(msg);
    },
  });

  const checkSlopMutation = useMutation({
    mutationFn: composerApi.checkCopyQuality,
    onSuccess: (data) => {
      setSlopResult(data);
      setIsCheckingSlop(false);
    },
    onError: (err: any) => {
      setIsCheckingSlop(false);
      setErrorMessage(err.response?.data?.error || 'SlopMonster checker execution failed.');
    },
  });

  const approveDraftMutation = useMutation({
    mutationFn: ({ id, sendImmediately }: { id: string; sendImmediately: boolean }) =>
      composerApi.approveDraft(id, sendImmediately),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['pendingApproval'] });
      queryClient.invalidateQueries({ queryKey: ['emailHistory'] });
      queryClient.invalidateQueries({ queryKey: ['analyticsOverview'] });
      if (data.dispatched) {
        setSuccessMessage('Email successfully accepted by Gmail API for transmission!');
      } else {
        setSuccessMessage('Draft approved and queued for sending.');
      }
      setTimeout(() => navigate('/approval'), 1200);
    },
    onError: (err: any) => {
      setErrorMessage(err.response?.data?.error || 'Approval failed.');
    },
  });

  const handleGenerate = () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    const validCampaignId =
      selectedCampaignId && selectedCampaignId.trim() !== '' ? selectedCampaignId.trim() : undefined;

    if (batchMode) {
      if (selectedBatchIds.length === 0) return;
      generateBatchMutation.mutate({
        recipientIds: selectedBatchIds,
        templateKeyOrId: selectedTemplateKey,
        campaignId: validCampaignId,
        customInstructions: customInstructions ? customInstructions.trim() : undefined,
      });
    } else {
      if (!selectedRecipientId) return;
      generateSingleMutation.mutate({
        recipientId: selectedRecipientId,
        templateKeyOrId: selectedTemplateKey,
        campaignId: validCampaignId,
        customInstructions: customInstructions ? customInstructions.trim() : undefined,
      });
    }
  };

  const handleManualSlopCheck = () => {
    if (!bodyText.trim()) return;
    setIsCheckingSlop(true);
    setErrorMessage(null);
    checkSlopMutation.mutate({
      subject: subjectText,
      bodyText: bodyText,
    });
  };

  const handleToggleBatchRecipient = (id: string) => {
    if (selectedBatchIds.includes(id)) {
      setSelectedBatchIds(selectedBatchIds.filter((item) => item !== id));
    } else {
      setSelectedBatchIds([...selectedBatchIds, id]);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
          <FileText className="h-6 w-6 text-brand-400" />
          Email Composition Studio
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Free, deterministic, template-based email generation integrated with local SlopMonster quality verification. Zero AI API costs, zero external writing calls.
        </p>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2.5">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
          <span>{successMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form: Template and Target Selection */}
        <div className="lg:col-span-5 bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 space-y-5">
          {/* Generation Mode Toggle */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Outreach Mode
            </span>
            <div className="flex items-center gap-2 p-1 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs">
              <button
                type="button"
                onClick={() => setBatchMode(false)}
                className={`px-3 py-1 rounded-lg font-medium transition-all ${
                  !batchMode ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Single Contact
              </button>
              <button
                type="button"
                onClick={() => setBatchMode(true)}
                className={`px-3 py-1 rounded-lg font-medium transition-all ${
                  batchMode ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Batch Contacts
              </button>
            </div>
          </div>

          {/* Template Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Sliders className="h-3.5 w-3.5 text-brand-400" />
              Email Template (Zero-AI Deterministic)
            </label>
            <select
              value={selectedTemplateKey}
              onChange={(e) => setSelectedTemplateKey(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:outline-none focus:border-brand-500"
            >
              {templates?.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.category})
                </option>
              ))}
            </select>
          </div>

          {/* Campaign Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5 text-indigo-400" />
              Campaign Context (Optional)
            </label>
            <select
              value={selectedCampaignId}
              onChange={(e) => setSelectedCampaignId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:outline-none focus:border-brand-500"
            >
              <option value="">-- No specific campaign (Direct Outreach) --</option>
              {campaigns?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Recipient Selector (Single vs Batch) */}
          {!batchMode ? (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-brand-400" />
                Select Recipient
              </label>
              <select
                value={selectedRecipientId}
                onChange={(e) => setSelectedRecipientId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:outline-none focus:border-brand-500"
              >
                <option value="">-- Choose recipient from database --</option>
                {recipients?.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.firstName ? `${r.firstName} ${r.lastName} (${r.company || r.email})` : r.email}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5 text-brand-400" />
                  Select Recipients ({selectedBatchIds.length} chosen)
                </label>
                <button
                  type="button"
                  onClick={() =>
                    setSelectedBatchIds(
                      selectedBatchIds.length === (recipients?.length || 0)
                        ? []
                        : recipients?.map((r) => r.id) || []
                    )
                  }
                  className="text-[11px] text-brand-400 hover:text-brand-300 font-medium"
                >
                  {selectedBatchIds.length === (recipients?.length || 0) ? 'Deselect All' : 'Select All'}
                </button>
              </div>
              <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-700 bg-slate-800/40 p-2 space-y-1">
                {recipients && recipients.length > 0 ? (
                  recipients.map((r) => {
                    const isChecked = selectedBatchIds.includes(r.id);
                    return (
                      <label
                        key={r.id}
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-700/50 cursor-pointer text-xs"
                      >
                        <div className="flex items-center gap-2.5">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleBatchRecipient(r.id)}
                            className="rounded border-slate-700 bg-slate-800 text-brand-500 focus:ring-brand-500"
                          />
                          <span className="font-medium text-slate-200">
                            {r.firstName ? `${r.firstName} ${r.lastName}` : r.email}
                          </span>
                          <span className="text-slate-400">({r.company || 'N/A'})</span>
                        </div>
                      </label>
                    );
                  })
                ) : (
                  <div className="p-4 text-center text-xs text-slate-400">No recipients available.</div>
                )}
              </div>
            </div>
          )}

          {/* Custom Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Specific Angle or Contextual Note (Optional)
            </label>
            <input
              type="text"
              value={customInstructions}
              onChange={(e) => setCustomInstructions(e.target.value)}
              placeholder="e.g., Reference their recent product launch or portfolio redesign..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:outline-none focus:border-brand-500"
            />
          </div>

          {/* Compose Button */}
          <div className="pt-2">
            <button
              onClick={handleGenerate}
              disabled={
                generateSingleMutation.isPending ||
                generateBatchMutation.isPending ||
                (!batchMode && !selectedRecipientId) ||
                (batchMode && selectedBatchIds.length === 0)
              }
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-brand-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {generateSingleMutation.isPending || generateBatchMutation.isPending ? (
                <>Composing Deterministic Copy...</>
              ) : (
                <>
                  <FileText className="h-4 w-4" />
                  {batchMode ? `Compose ${selectedBatchIds.length} Drafts` : 'Compose Email Draft'}
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Form: Live Editor & SlopMonster Scorecard */}
        <div className="lg:col-span-7 space-y-5">
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FileText className="h-4 w-4 text-brand-400" />
                Email Draft & Quality Verification
              </h3>
              {slopResult && (
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                      slopResult.clean
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                    }`}
                  >
                    Slop Score: {slopResult.score}/5.0 {slopResult.clean ? 'CLEAN' : 'FLAGGED'}
                  </span>
                </div>
              )}
            </div>

            {/* Subject Line */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Subject Line
              </label>
              <input
                type="text"
                value={subjectText}
                onChange={(e) => setSubjectText(e.target.value)}
                placeholder="Subject line will appear here after composition..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:outline-none focus:border-brand-500 font-medium"
              />
            </div>

            {/* Body Text */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Email Body Text
              </label>
              <textarea
                rows={9}
                value={bodyText}
                onChange={(e) => setBodyText(e.target.value)}
                placeholder="Composed email body will appear here. You can manually edit any sentence freely..."
                className="w-full p-3.5 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:outline-none focus:border-brand-500 font-sans leading-relaxed"
              />
            </div>

            {/* SlopMonster Action Controls */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={handleManualSlopCheck}
                disabled={isCheckingSlop || !bodyText.trim()}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-2 transition-all disabled:opacity-50"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isCheckingSlop ? 'animate-spin text-brand-400' : ''}`} />
                Check Copy Quality with SlopMonster
              </button>

              {activeDraft && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => approveDraftMutation.mutate({ id: activeDraft.id, sendImmediately: false })}
                    disabled={approveDraftMutation.isPending}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all shadow-md"
                  >
                    Approve Draft
                  </button>
                  <button
                    type="button"
                    onClick={() => approveDraftMutation.mutate({ id: activeDraft.id, sendImmediately: true })}
                    disabled={approveDraftMutation.isPending}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md shadow-emerald-600/20"
                  >
                    <Send className="h-3.5 w-3.5" />
                    Approve & Send via Gmail
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* SlopMonster Findings Card */}
          {slopResult && (
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-brand-400" />
                  SlopMonster Local Editorial Audit
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  {slopResult.wordCount} words | {slopResult.totalFlags} flag(s)
                </span>
              </div>

              {/* Category Pills */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1 text-center">
                <div className="p-2 rounded-xl bg-slate-800/50 border border-slate-800">
                  <div className="text-[10px] text-slate-400 font-medium">Vocab</div>
                  <div className={`text-sm font-bold ${slopResult.flagsByCategory.vocab > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {slopResult.flagsByCategory.vocab}
                  </div>
                </div>
                <div className="p-2 rounded-xl bg-slate-800/50 border border-slate-800">
                  <div className="text-[10px] text-slate-400 font-medium">Phrases</div>
                  <div className={`text-sm font-bold ${slopResult.flagsByCategory.phrases > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {slopResult.flagsByCategory.phrases}
                  </div>
                </div>
                <div className="p-2 rounded-xl bg-slate-800/50 border border-slate-800">
                  <div className="text-[10px] text-slate-400 font-medium">Punctuation</div>
                  <div className={`text-sm font-bold ${slopResult.flagsByCategory.punctuation > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {slopResult.flagsByCategory.punctuation}
                  </div>
                </div>
                <div className="p-2 rounded-xl bg-slate-800/50 border border-slate-800">
                  <div className="text-[10px] text-slate-400 font-medium">Rhythm</div>
                  <div className={`text-sm font-bold ${slopResult.flagsByCategory.rhythm > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {slopResult.flagsByCategory.rhythm}
                  </div>
                </div>
                <div className="p-2 rounded-xl bg-slate-800/50 border border-slate-800">
                  <div className="text-[10px] text-slate-400 font-medium">Proof</div>
                  <div className={`text-sm font-bold ${slopResult.flagsByCategory.proof > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {slopResult.flagsByCategory.proof}
                  </div>
                </div>
              </div>

              {/* Raw report / Findings */}
              {slopResult.rawReport && (
                <div className="mt-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800 font-mono text-[11px] text-slate-300 whitespace-pre-wrap max-h-40 overflow-y-auto">
                  {slopResult.rawReport}
                </div>
              )}

              <p className="text-[11px] text-slate-500 italic pt-1">
                Note: SlopMonster provides local editorial quality feedback against AI writing patterns and tells. It is not an anti-spam bypass guarantee.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
