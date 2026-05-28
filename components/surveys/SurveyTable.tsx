'use client';

import React, { useState } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import {
  ClipboardList,
  Search,
  Plus,
  Edit,
  Trash2,
  Calendar,
  Eye,
  Lock,
  Unlock,
  CheckCircle,
  Copy,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  User,
  Sliders,
  AlertCircle,
  TrendingUp,
} from 'lucide-react';

interface SurveyMember {
  id: string;
  name: string;
  description: string | null;
  greetingText: string | null;
  status: 'DRAFT' | 'ACTIVE' | 'LOCKED';
  modelType: 'ONE_PART' | 'TWO_PARTS' | 'THREE_PARTS';
  defaultLanguage: string;
  goodThreshold: number;
  badThreshold: number;
  createdAt: Date | string;
  createdBy: {
    fullName: string;
  } | null;
}

interface SurveyTableProps {
  surveys: SurveyMember[];
  total: number;
  currentPage: number;
  limit: number;
  currentUser: {
    id: string;
    role: string;
  };
}

export default function SurveyTable({
  surveys,
  total,
  currentPage,
  limit,
  currentUser,
}: SurveyTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [searchVal, setSearchVal] = useState(searchParams.get('search') || '');
  const [statusVal, setStatusVal] = useState(searchParams.get('status') || '');
  const [modelVal, setModelVal] = useState(searchParams.get('modelType') || '');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const canManage = ['BUSINESS_OWNER', 'MANAGER'].includes(currentUser.role);
  const canDelete = currentUser.role === 'BUSINESS_OWNER';

  const updateFilters = (search: string, status: string, modelType: string, page: number) => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (status) params.set('status', status);
    if (modelType) params.set('modelType', modelType);
    if (page > 1) params.set('page', page.toString());

    router.push(`${pathname}?${params.toString()}`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters(searchVal, statusVal, modelVal, 1);
  };

  const handleStatusChange = (status: string) => {
    setStatusVal(status);
    updateFilters(searchVal, status, modelVal, 1);
  };

  const handleModelChange = (modelType: string) => {
    setModelVal(modelType);
    updateFilters(searchVal, statusVal, modelType, 1);
  };

  const handleClearFilters = () => {
    setSearchVal('');
    setStatusVal('');
    setModelVal('');
    router.push(pathname);
  };

  const handleStatusToggle = async (survey: SurveyMember) => {
    if (!canManage) return;

    let nextStatus: 'DRAFT' | 'ACTIVE' | 'LOCKED' = 'ACTIVE';
    if (survey.status === 'ACTIVE') {
      nextStatus = 'LOCKED';
    } else if (survey.status === 'LOCKED') {
      nextStatus = 'ACTIVE';
    }

    try {
      const res = await fetch(`/api/surveys/${survey.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });

      if (res.ok) {
        router.refresh();
      }
    } catch (err) {
      console.error('Failed to change status:', err);
    }
  };

  const handleDeleteSurvey = async (survey: SurveyMember) => {
    if (!canDelete) return;
    if (!confirm(`Are you sure you want to permanently delete "${survey.name}" and all its question blocks? This cannot be undone.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/surveys/${survey.id}`, {
        method: 'DELETE',
      });

      const result = await res.json();

      if (res.ok && result.success) {
        setStatusMessage({ type: 'success', text: 'Survey and blocks deleted successfully.' });
        router.refresh();
      } else {
        setStatusMessage({ type: 'error', text: result.message || 'Failed to delete survey.' });
      }
    } catch (err) {
      console.error('Failed to delete survey:', err);
    }
  };

  const handleDuplicateSurvey = async (survey: SurveyMember) => {
    if (!canManage) return;
    setIsSubmitting(true);
    setStatusMessage(null);

    try {
      // 1. Fetch full survey structure
      const getRes = await fetch(`/api/surveys/${survey.id}`);
      const getResult = await getRes.json();

      if (!getRes.ok || !getResult.success) {
        setStatusMessage({ type: 'error', text: 'Failed to retrieve survey structure to clone.' });
        setIsSubmitting(false);
        return;
      }

      const original = getResult.data.survey;

      // 2. Map structure to clean creation payload
      const duplicatePayload = {
        name: `${original.name} (Copy)`,
        description: original.description,
        greetingText: original.greetingText,
        modelType: original.modelType,
        defaultLanguage: original.defaultLanguage,
        goodThreshold: original.goodThreshold,
        badThreshold: original.badThreshold,
        status: 'DRAFT',
        blocks: original.blocks.map((block: any) => ({
          blockOrder: block.blockOrder,
          blockGroup: block.blockGroup,
          blockType: block.blockType,
          title: block.title,
          questions: block.questions.map((q: any) => ({
            questionText: q.questionText,
            questionType: q.questionType,
            isRequired: q.isRequired,
            orderIndex: q.orderIndex,
            metadataJson: q.metadataJson,
            options: q.options.map((o: any) => ({
              optionText: o.optionText,
              orderIndex: o.orderIndex,
            })),
          })),
        })),
      };

      // 3. Post to API
      const postRes = await fetch('/api/surveys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(duplicatePayload),
      });

      const postResult = await postRes.json();

      if (postRes.ok && postResult.success) {
        setStatusMessage({ type: 'success', text: 'Survey duplicated successfully!' });
        router.refresh();
      } else {
        setStatusMessage({ type: 'error', text: postResult.message || 'Failed to duplicate survey.' });
      }
    } catch (err) {
      console.error('Duplicate error:', err);
      setStatusMessage({ type: 'error', text: 'A network error occurred while duplicating.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'DRAFT':
        return 'bg-slate-500/10 text-slate-400 border-slate-750/20';
      case 'LOCKED':
        return 'bg-rose-500/10 text-rose-450 border-rose-500/20';
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-550/20';
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      {statusMessage && (
        <div
          className={`flex items-start gap-3 rounded-xl border p-4 text-sm backdrop-blur-md transition-all duration-300 ${
            statusMessage.type === 'success'
              ? 'border-emerald-500/20 bg-emerald-500/5 text-emerald-400'
              : 'border-rose-500/20 bg-rose-500/5 text-rose-400'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle className="h-5 w-5 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Filter and Add Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-800 pb-5">
        <form onSubmit={handleSearchSubmit} className="flex-1 flex gap-2 max-w-lg">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search surveys by name..."
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-900/40 pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition duration-150"
            />
            <Search className="absolute left-3.5 top-3 h-4.5 w-4.5 text-slate-500" />
          </div>
          <button
            type="submit"
            className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-sm font-semibold hover:bg-slate-900 transition duration-150"
          >
            Search
          </button>
        </form>

        <div className="flex items-center gap-2">
          {/* Status Select */}
          <div className="relative">
            <select
              value={statusVal}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="rounded-xl border border-slate-800 bg-slate-900/40 px-3 py-2.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
            >
              <option value="">All Statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="ACTIVE">Active</option>
              <option value="LOCKED">Locked</option>
            </select>
          </div>

          {/* Model Type Select */}
          <div className="relative">
            <select
              value={modelVal}
              onChange={(e) => handleModelChange(e.target.value)}
              className="rounded-xl border border-slate-800 bg-slate-900/40 px-3 py-2.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
            >
              <option value="">All Layouts</option>
              <option value="ONE_PART">1-Part Block</option>
              <option value="TWO_PARTS">2-Parts Block</option>
              <option value="THREE_PARTS">3-Parts Block</option>
            </select>
          </div>

          {(searchVal || statusVal || modelVal) && (
            <button
              onClick={handleClearFilters}
              className="text-xs text-slate-500 hover:text-slate-400 font-semibold px-2 py-1"
            >
              Clear
            </button>
          )}

          {canManage && (
            <button
              onClick={() => router.push('/surveys/create')}
              className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/10 hover:bg-indigo-500 transition duration-150"
            >
              <Plus className="h-4.5 w-4.5" />
              <span>Create Survey</span>
            </button>
          )}
        </div>
      </div>

      {/* Survey Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/20 shadow-xl backdrop-blur-md">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm text-slate-355">
            <thead className="bg-slate-900/60 text-xs font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-6 py-4">Survey Details</th>
                <th className="px-6 py-4">Model Layout</th>
                <th className="px-6 py-4">Lang</th>
                <th className="px-6 py-4">Thresholds</th>
                <th className="px-6 py-4">Created By</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 bg-transparent">
              {surveys.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-xs text-slate-550">
                    No feedback survey sheets found.
                  </td>
                </tr>
              ) : (
                surveys.map((survey) => (
                  <tr key={survey.id} className="transition duration-150 hover:bg-slate-900/30">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-white truncate max-w-[200px]" title={survey.name}>
                        {survey.name}
                      </div>
                      {survey.description && (
                        <p className="text-[10px] text-slate-500 mt-0.5 truncate max-w-[200px]">
                          {survey.description}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-indigo-400">
                      {survey.modelType.replace('_', ' ')}
                    </td>
                    <td className="px-6 py-4 text-xs font-semibold uppercase text-slate-400">
                      {survey.defaultLanguage}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="flex items-center gap-0.5 text-emerald-450" title="Good Rating Threshold">
                          <TrendingUp className="h-3.5 w-3.5" />
                          <span>≥ {survey.goodThreshold}</span>
                        </span>
                        <span className="text-slate-700">|</span>
                        <span className="flex items-center gap-0.5 text-rose-450" title="Bad Rating Threshold">
                          <Sliders className="h-3.5 w-3.5" />
                          <span>≤ {survey.badThreshold}</span>
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-400">
                      <div className="flex items-center gap-1">
                        <User className="h-3.5 w-3.5 text-slate-500" />
                        <span>{survey.createdBy?.fullName || 'SaaS Seeder'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold ${getStatusBadge(survey.status)}`}>
                        {survey.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Preview button */}
                        <button
                          type="button"
                          onClick={() => router.push(`/surveys/${survey.id}/preview`)}
                          title="Mobile Preview"
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition duration-150"
                        >
                          <Eye className="h-4 w-4 text-indigo-400" />
                        </button>

                        {canManage && (
                          <>
                            {/* Toggle Lock/Activate */}
                            <button
                              type="button"
                              onClick={() => handleStatusToggle(survey)}
                              disabled={survey.status === 'DRAFT'}
                              title={
                                survey.status === 'DRAFT'
                                  ? 'Draft surveys cannot be locked'
                                  : survey.status === 'ACTIVE'
                                  ? 'Lock Survey'
                                  : 'Activate Survey'
                              }
                              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition duration-150 disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              {survey.status === 'ACTIVE' ? (
                                <Lock className="h-4 w-4" />
                              ) : (
                                <Unlock className="h-4 w-4 text-emerald-450" />
                              )}
                            </button>

                            {/* Duplicate */}
                            <button
                              type="button"
                              onClick={() => handleDuplicateSurvey(survey)}
                              disabled={isSubmitting}
                              title="Duplicate Survey"
                              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition duration-150 disabled:opacity-50"
                            >
                              <Copy className="h-4 w-4 text-amber-405" />
                            </button>

                            {/* Edit */}
                            <button
                              type="button"
                              onClick={() => router.push(`/surveys/${survey.id}/edit`)}
                              title="Edit Block Layout"
                              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition duration-150"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                          </>
                        )}

                        {canDelete && (
                          <button
                            type="button"
                            onClick={() => handleDeleteSurvey(survey)}
                            title="Delete Permanently"
                            className="rounded-lg p-1.5 text-rose-455 hover:bg-rose-500/10 transition duration-150"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-slate-555">
            Showing surveys {limit * (currentPage - 1) + 1} to {Math.min(limit * currentPage, total)} of {total} records
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => updateFilters(searchVal, statusVal, modelVal, currentPage - 1)}
              disabled={currentPage === 1}
              className="rounded-xl border border-slate-800 bg-slate-950 p-2 text-slate-400 hover:bg-slate-900 transition disabled:opacity-50"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <span className="text-xs font-semibold text-slate-300 px-3">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => updateFilters(searchVal, statusVal, modelVal, currentPage + 1)}
              disabled={currentPage === totalPages}
              className="rounded-xl border border-slate-800 bg-slate-950 p-2 text-slate-400 hover:bg-slate-900 transition disabled:opacity-50"
            >
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
