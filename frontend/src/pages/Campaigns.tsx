import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Layers,
  Plus,
  Send,
  Trash2,
  Calendar,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { campaignApi } from '../services/api';
import { Campaign } from '../types';
import { Link } from 'react-router-dom';

export const Campaigns: React.FC = () => {
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [promptTemplate, setPromptTemplate] = useState('');
  const [subjectTemplate, setSubjectTemplate] = useState('');

  const { data: campaigns, isLoading } = useQuery<Campaign[]>({
    queryKey: ['campaignsList'],
    queryFn: campaignApi.list,
  });

  const createMutation = useMutation({
    mutationFn: campaignApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaignsList'] });
      queryClient.invalidateQueries({ queryKey: ['analyticsOverview'] });
      setIsCreateOpen(false);
      setName('');
      setDescription('');
      setPromptTemplate('');
      setSubjectTemplate('');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: campaignApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaignsList'] });
      queryClient.invalidateQueries({ queryKey: ['analyticsOverview'] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    createMutation.mutate({
      name,
      description,
      promptTemplate,
      subjectTemplate,
    });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Layers className="h-6 w-6 text-brand-400" />
            Outreach Campaigns
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Configure target messaging themes, value propositions, and scheduled follow-up logic.
          </p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold uppercase tracking-wider transition-all shadow-md shadow-brand-600/20"
        >
          <Plus className="h-4 w-4" />
          Create Campaign
        </button>
      </div>

      {/* Campaign Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {campaigns && campaigns.length > 0 ? (
          campaigns.map((c) => (
            <div
              key={c.id}
              className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 flex flex-col justify-between hover:border-slate-700/80 transition-all space-y-4"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    {c.status}
                  </span>
                  <button
                    onClick={() => deleteMutation.mutate(c.id)}
                    className="p-1 rounded text-slate-500 hover:text-rose-400 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <h3 className="text-base font-bold text-white mt-3">{c.name}</h3>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                  {c.description || 'No description provided.'}
                </p>
              </div>

              <div className="space-y-2 pt-3 border-t border-slate-800/60 text-xs">
                <div className="flex items-center justify-between text-slate-400">
                  <span>Queued Emails</span>
                  <span className="font-semibold text-slate-200">{c._count?.emailMessages || 0}</span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>Created</span>
                  <span>{new Date(c.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="pt-2">
                <Link
                  to="/ai-studio"
                  className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border border-slate-700"
                >
                  <Sparkles className="h-3.5 w-3.5 text-brand-400" />
                  Generate Emails for Campaign
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-16 text-center bg-slate-900/40 border border-slate-800/80 rounded-2xl">
            <Layers className="h-10 w-10 text-slate-600 mx-auto mb-3" />
            <h4 className="text-sm font-semibold text-slate-300">No Outreach Campaigns Yet</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Create your first campaign to define your value proposition and automated prompt context.
            </p>
          </div>
        )}
      </div>

      {/* New Campaign Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleSubmit}
            className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-lg w-full space-y-4"
          >
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Plus className="h-5 w-5 text-brand-400" />
              Launch New Campaign
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Campaign Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Q4 Enterprise Cloud Modernization"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Description</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Targeting VP of Infrastructure and CTOs"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                AI Prompt Instructions / Value Proposition
              </label>
              <textarea
                rows={4}
                value={promptTemplate}
                onChange={(e) => setPromptTemplate(e.target.value)}
                placeholder="Focus on our SOC2 Type II compliance and 40% latency reduction. Offer a personalized architecture audit."
                className="w-full p-3 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-brand-500 leading-relaxed"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-md shadow-brand-600/20"
              >
                Create Campaign
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
