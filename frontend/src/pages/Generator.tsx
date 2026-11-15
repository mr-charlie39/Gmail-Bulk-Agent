import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Users,
  Layers,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  HelpCircle
} from 'lucide-react';
import { aiApi, recipientApi, campaignApi } from '../services/api';
import { Recipient, Campaign } from '../types';

export const Generator: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [selectedRecipientId, setSelectedRecipientId] = useState('');
  const [selectedCampaignId, setSelectedCampaignId] = useState('');
  const [customInstructions, setCustomInstructions] = useState('');
  const [batchMode, setBatchMode] = useState(false);
  const [selectedBatchIds, setSelectedBatchIds] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { data: recipients } = useQuery<Recipient[]>({
    queryKey: ['recipientsList'],
    queryFn: () => recipientApi.list(),
  });

  const { data: campaigns } = useQuery<Campaign[]>({
    queryKey: ['campaignsList'],
    queryFn: campaignApi.list,
  });

  const generateSingleMutation = useMutation({
    mutationFn: aiApi.generate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pendingApproval'] });
      queryClient.invalidateQueries({ queryKey: ['analyticsOverview'] });
      navigate('/approval');
    },
    onError: (err: any) => {
      const msg = err.response?.data?.error || err.message || 'Generation failed';
      setErrorMessage(msg);
    },
  });

  const generateBatchMutation = useMutation({
    mutationFn: aiApi.batchGenerate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pendingApproval'] });
      queryClient.invalidateQueries({ queryKey: ['analyticsOverview'] });
      navigate('/approval');
    },
    onError: (err: any) => {
      const msg = err.response?.data?.error || err.message || 'Batch generation failed';
      setErrorMessage(msg);
    },
  });

  const handleGenerate = () => {
    setErrorMessage(null);
    const validCampaignId =
      selectedCampaignId && selectedCampaignId.trim() !== '' ? selectedCampaignId.trim() : undefined;

    if (batchMode) {
      if (selectedBatchIds.length === 0) return;
      generateBatchMutation.mutate({
        recipientIds: selectedBatchIds,
        campaignId: validCampaignId,
        customInstructions: customInstructions ? customInstructions.trim() : undefined,
      });
    } else {
      if (!selectedRecipientId) return;
      generateSingleMutation.mutate({
        recipientId: selectedRecipientId,
        campaignId: validCampaignId,
        customInstructions: customInstructions ? customInstructions.trim() : undefined,
      });
    }
  };

  const handleToggleBatchRecipient = (id: string) => {
    if (selectedBatchIds.includes(id)) {
      setSelectedBatchIds(selectedBatchIds.filter((item) => item !== id));
    } else {
      setSelectedBatchIds([...selectedBatchIds, id]);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
          <Sparkles className="h-6 w-6 text-brand-400" />
          AI Email Generation Studio
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Powered by Google Gemini 1.5. Generates targeted, category-aware drafts and queues them directly into your approval workflow.
        </p>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Configuration Form */}
        <div className="lg:col-span-2 bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 space-y-5">
          {/* Generation Mode Toggle */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Target Selection Mode
            </span>
            <div className="flex items-center gap-2 p-1 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs">
              <button
                type="button"
                onClick={() => setBatchMode(false)}
                className={`px-3 py-1 rounded-lg font-medium transition-all ${
                  !batchMode ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Single Recipient
              </button>
              <button
                type="button"
                onClick={() => setBatchMode(true)}
                className={`px-3 py-1 rounded-lg font-medium transition-all ${
                  batchMode ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Batch Recipients
              </button>
            </div>
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
              <option value="">-- No specific campaign (General Outreach) --</option>
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
                    {r.firstName ? `${r.firstName} ${r.lastName} (${r.company || r.email})` : r.email} — [{r.category || 'GENERAL'}]
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
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                          {r.category || 'GENERAL'}
                        </span>
                      </label>
                    );
                  })
                ) : (
                  <div className="p-4 text-center text-xs text-slate-400">No recipients available.</div>
                )}
              </div>
            </div>
          )}

          {/* Custom Prompt Instructions */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Specific Angles or Custom Instructions (Optional)
            </label>
            <textarea
              rows={4}
              value={customInstructions}
              onChange={(e) => setCustomInstructions(e.target.value)}
              placeholder="e.g., Emphasize our recent cloud security benchmark, reference their Q3 expansion, or suggest a 10-minute briefing on Tuesday..."
              className="w-full p-3.5 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:outline-none focus:border-brand-500 leading-relaxed"
            />
          </div>

          {/* Submit Button */}
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
                <>Generating Personalized Drafts with Gemini...</>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Generate Drafts & Queue for Approval
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Informational Guidance Panel */}
        <div className="space-y-4">
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <HelpCircle className="h-4 w-4 text-brand-400" />
              Category-Aware Intelligence
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Gemini automatically personalizes tone, vocabulary, and length according to each recipient's designated category:
            </p>
            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-800/50 border border-slate-800">
                <span className="font-semibold text-slate-200">ENTERPRISE:</span>
                <span className="text-slate-400 ml-1">ROI-focused, security, executive efficiency.</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-800/50 border border-slate-800">
                <span className="font-semibold text-slate-200">STARTUP:</span>
                <span className="text-slate-400 ml-1">Speed, execution, high-energy, value-first.</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-800/50 border border-slate-800">
                <span className="font-semibold text-slate-200">INVESTOR:</span>
                <span className="text-slate-400 ml-1">Market size, traction, concise metrics.</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5 mb-2">
              <CheckCircle2 className="h-4 w-4" />
              Human Guardrail Guarantee
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Every draft generated here is placed in the <span className="text-amber-400 font-semibold">PENDING_APPROVAL</span> state. You maintain 100% control to review, edit, or reject before any email touches the Gmail API.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
