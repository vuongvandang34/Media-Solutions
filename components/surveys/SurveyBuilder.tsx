'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ClipboardList,
  Save,
  Plus,
  Trash2,
  Lock,
  Loader2,
  Sliders,
  CheckCircle,
  AlertCircle,
  Eye,
  Settings,
  HelpCircle,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';

interface OptionInput {
  optionText: string;
  orderIndex: number;
}

interface QuestionInput {
  questionText: string;
  questionType: 'RATING' | 'NPS' | 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'OPEN_TEXT' | 'CONTACT_INFO' | 'FILE_UPLOAD';
  isRequired: boolean;
  orderIndex: number;
  metadataJson?: any;
  options: OptionInput[];
}

interface BlockInput {
  blockOrder: number;
  blockGroup: 'EXPERIENCE_METRIC' | 'CHOICE_QUESTION' | 'DATA_COLLECTION';
  blockType: 'CES' | 'CSAT' | 'NPS' | 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'OPEN_TEXT' | 'CONTACT_INFO' | 'FILE_UPLOAD';
  title: string;
  questions: QuestionInput[];
}

interface SurveyBuilderProps {
  initialData?: {
    id: string;
    name: string;
    description: string | null;
    greetingText: string | null;
    modelType: 'ONE_PART' | 'TWO_PARTS' | 'THREE_PARTS';
    defaultLanguage: string;
    goodThreshold: number;
    badThreshold: number;
    status: 'DRAFT' | 'ACTIVE' | 'LOCKED';
    blocks: any[];
  };
}

const DEFAULT_QUESTIONS: Record<string, { text: string; type: string; meta?: any }> = {
  CSAT: { text: 'How satisfied are you with our service?', type: 'RATING', meta: { scaleMin: 1, scaleMax: 5 } },
  CES: { text: 'How easy was it to complete your experience today?', type: 'RATING', meta: { scaleMin: 1, scaleMax: 5 } },
  NPS: { text: 'How likely are you to recommend us to a friend or colleague?', type: 'NPS', meta: { scaleMin: 0, scaleMax: 10 } },
  SINGLE_CHOICE: { text: 'What was the primary reason for your rating?', type: 'SINGLE_CHOICE' },
  MULTIPLE_CHOICE: { text: 'What did you like most about our service?', type: 'MULTIPLE_CHOICE' },
  OPEN_TEXT: { text: 'Do you have any additional comments or suggestions?', type: 'OPEN_TEXT' },
  CONTACT_INFO: { text: 'Please leave your contact details if you would like us to reach out.', type: 'CONTACT_INFO' },
  FILE_UPLOAD: { text: 'Upload any receipt or promotion photo.', type: 'FILE_UPLOAD' },
};

export default function SurveyBuilder({ initialData }: SurveyBuilderProps) {
  const router = useRouter();
  const isEdit = !!initialData;

  // Basic info states
  const [name, setName] = useState(initialData?.name || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [greetingText, setGreetingText] = useState(initialData?.greetingText || '');
  const [modelType, setModelType] = useState<'ONE_PART' | 'TWO_PARTS' | 'THREE_PARTS'>(initialData?.modelType || 'ONE_PART');
  const [defaultLanguage, setDefaultLanguage] = useState(initialData?.defaultLanguage || 'en');
  const [goodThreshold, setGoodThreshold] = useState<number>(initialData?.goodThreshold ?? 4);
  const [badThreshold, setBadThreshold] = useState<number>(initialData?.badThreshold ?? 2);
  const [status, setStatus] = useState<'DRAFT' | 'ACTIVE' | 'LOCKED'>(initialData?.status || 'DRAFT');

  // Blocks array state
  const [blocks, setBlocks] = useState<BlockInput[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Initialize blocks based on initialData or modelType
  useEffect(() => {
    if (initialData && initialData.blocks && initialData.blocks.length > 0) {
      // Map existing blocks
      const mapped = initialData.blocks.map((block: any) => ({
        blockOrder: block.blockOrder,
        blockGroup: block.blockGroup as any,
        blockType: block.blockType as any,
        title: block.title || '',
        questions: block.questions.map((q: any) => ({
          questionText: q.questionText,
          questionType: q.questionType as any,
          isRequired: q.isRequired,
          orderIndex: q.orderIndex,
          metadataJson: q.metadataJson,
          options: q.options.map((o: any) => ({
            optionText: o.optionText,
            orderIndex: o.orderIndex,
          })),
        })),
      }));
      setBlocks(mapped);
    } else {
      adjustBlocksCount(modelType);
    }
  }, [initialData]);

  // Adjust blocks count according to model type
  const adjustBlocksCount = (type: 'ONE_PART' | 'TWO_PARTS' | 'THREE_PARTS') => {
    let requiredCount = 1;
    if (type === 'TWO_PARTS') requiredCount = 2;
    if (type === 'THREE_PARTS') requiredCount = 3;

    setBlocks((prev) => {
      const next = [...prev];
      if (next.length > requiredCount) {
        return next.slice(0, requiredCount);
      } else {
        while (next.length < requiredCount) {
          const order = next.length + 1;
          // Default: 1st block CSAT, 2nd block Choice, 3rd block Open Text
          let group: any = 'EXPERIENCE_METRIC';
          let bType: any = 'CSAT';
          if (order === 2) {
            group = 'CHOICE_QUESTION';
            bType = 'SINGLE_CHOICE';
          } else if (order === 3) {
            group = 'DATA_COLLECTION';
            bType = 'OPEN_TEXT';
          }

          const defaultQ = DEFAULT_QUESTIONS[bType];

          next.push({
            blockOrder: order,
            blockGroup: group,
            blockType: bType,
            title: `Part ${order}: ${bType}`,
            questions: [
              {
                questionText: defaultQ.text,
                questionType: defaultQ.type as any,
                isRequired: true,
                orderIndex: 1,
                metadataJson: defaultQ.meta,
                options: bType.includes('CHOICE')
                  ? [
                      { optionText: 'Option 1', orderIndex: 1 },
                      { optionText: 'Option 2', orderIndex: 2 },
                    ]
                  : [],
              },
            ],
          });
        }
        return next;
      }
    });
  };

  const handleModelTypeChange = (val: 'ONE_PART' | 'TWO_PARTS' | 'THREE_PARTS') => {
    setModelType(val);
    adjustBlocksCount(val);
  };

  const handleBlockGroupChange = (blockIdx: number, group: BlockInput['blockGroup']) => {
    let defaultType: BlockInput['blockType'] = 'CSAT';
    if (group === 'CHOICE_QUESTION') defaultType = 'SINGLE_CHOICE';
    if (group === 'DATA_COLLECTION') defaultType = 'OPEN_TEXT';

    updateBlockType(blockIdx, group, defaultType);
  };

  const updateBlockType = (blockIdx: number, group: BlockInput['blockGroup'], type: BlockInput['blockType']) => {
    setBlocks((prev) => {
      const next = [...prev];
      const defaultQ = DEFAULT_QUESTIONS[type];

      next[blockIdx] = {
        ...next[blockIdx],
        blockGroup: group,
        blockType: type,
        title: `Part ${blockIdx + 1}: ${type}`,
        questions: [
          {
            questionText: defaultQ.text,
            questionType: defaultQ.type as any,
            isRequired: true,
            orderIndex: 1,
            metadataJson: defaultQ.meta,
            options: type.includes('CHOICE')
              ? [
                  { optionText: 'Option 1', orderIndex: 1 },
                  { optionText: 'Option 2', orderIndex: 2 },
                ]
              : [],
          },
        ],
      };
      return next;
    });
  };

  const handleBlockTitleChange = (blockIdx: number, title: string) => {
    setBlocks((prev) => {
      const next = [...prev];
      next[blockIdx].title = title;
      return next;
    });
  };

  const handleQuestionTextChange = (blockIdx: number, text: string) => {
    setBlocks((prev) => {
      const next = [...prev];
      next[blockIdx].questions[0].questionText = text;
      return next;
    });
  };

  const handleQuestionRequiredToggle = (blockIdx: number, required: boolean) => {
    setBlocks((prev) => {
      const next = [...prev];
      next[blockIdx].questions[0].isRequired = required;
      return next;
    });
  };

  const handleAddOption = (blockIdx: number) => {
    setBlocks((prev) => {
      const next = [...prev];
      const options = next[blockIdx].questions[0].options;
      options.push({
        optionText: `Option ${options.length + 1}`,
        orderIndex: options.length + 1,
      });
      return next;
    });
  };

  const handleOptionTextChange = (blockIdx: number, optIdx: number, text: string) => {
    setBlocks((prev) => {
      const next = [...prev];
      next[blockIdx].questions[0].options[optIdx].optionText = text;
      return next;
    });
  };

  const handleRemoveOption = (blockIdx: number, optIdx: number) => {
    setBlocks((prev) => {
      const next = [...prev];
      const options = next[blockIdx].questions[0].options;
      if (options.length > 2) {
        options.splice(optIdx, 1);
        // Re-index
        options.forEach((opt, index) => {
          opt.orderIndex = index + 1;
        });
      }
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatusMessage(null);
    setFieldErrors({});

    // Client-side validations
    if (badThreshold >= goodThreshold) {
      setErrorMessageOnly('Bad rating threshold must be strictly lower than the good threshold.');
      setIsSubmitting(false);
      return;
    }

    // Verify each choice question has at least 2 options
    for (const [idx, block] of blocks.entries()) {
      if (block.blockType.includes('CHOICE')) {
        const options = block.questions[0].options;
        if (!options || options.length < 2) {
          setErrorMessageOnly(`Part ${idx + 1} (${block.blockType}) requires at least 2 options.`);
          setIsSubmitting(false);
          return;
        }

        const emptyOpt = options.some((opt) => !opt.optionText.trim());
        if (emptyOpt) {
          setErrorMessageOnly(`All options inside Part ${idx + 1} must contain text.`);
          setIsSubmitting(false);
          return;
        }
      }
    }

    const payload = {
      name,
      description,
      greetingText,
      modelType,
      defaultLanguage,
      goodThreshold,
      badThreshold,
      status,
      blocks,
    };

    const endpoint = isEdit ? `/api/surveys/${initialData.id}` : '/api/surveys';
    const method = isEdit ? 'PATCH' : 'POST';

    try {
      const res = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (res.ok && result.success) {
        setStatusMessage({
          type: 'success',
          text: `Survey ${isEdit ? 'updated' : 'created'} successfully!`,
        });
        router.push('/surveys');
        router.refresh();
      } else {
        setStatusMessage({
          type: 'error',
          text: result.message || 'Failed to save survey block layout.',
        });
        if (result.errors) {
          const mapped: Record<string, string> = {};
          for (const [key, val] of Object.entries(result.errors)) {
            if (Array.isArray(val) && val.length > 0) {
              mapped[key] = val[0];
            }
          }
          setFieldErrors(mapped);
        }
      }
    } catch (err) {
      console.error('Survey builder submit error:', err);
      setStatusMessage({ type: 'error', text: 'An unexpected database error occurred.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const setErrorMessageOnly = (text: string) => {
    setStatusMessage({ type: 'error', text });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
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

      {/* Survey Info Card */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/20 p-6 backdrop-blur-sm space-y-5">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-indigo-400 flex items-center gap-2 border-b border-slate-800 pb-3">
          <Settings className="h-4.5 w-4.5" />
          <span>Basic Survey Configurations</span>
        </h3>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {/* Survey Name */}
          <div className="space-y-2 md:col-span-2">
            <label className="block text-xs font-semibold text-slate-350">Survey Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Haircut Service Experience Feedback"
              required
              disabled={isSubmitting}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-sm text-white placeholder-slate-650 focus:border-indigo-500 focus:outline-none transition"
            />
            {fieldErrors.name && <p className="text-xs text-rose-455 mt-1">{fieldErrors.name}</p>}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-355">Short Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional survey details..."
              rows={2}
              disabled={isSubmitting}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2 text-sm text-white placeholder-slate-650 focus:border-indigo-500 focus:outline-none transition"
            />
          </div>

          {/* Greeting Text */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-355">Customer Greeting Header</label>
            <textarea
              value={greetingText}
              onChange={(e) => setGreetingText(e.target.value)}
              placeholder="e.g. Thank you for visiting us. Please share your rating!"
              rows={2}
              disabled={isSubmitting}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2 text-sm text-white placeholder-slate-650 focus:border-indigo-500 focus:outline-none transition"
            />
          </div>

          {/* Model Layout Structure */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-350">Survey Layout Block Count</label>
            <select
              value={modelType}
              onChange={(e) => handleModelTypeChange(e.target.value as any)}
              disabled={isSubmitting}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none transition"
            >
              <option value="ONE_PART">1-Part Page (Exactly 1 Metric Block)</option>
              <option value="TWO_PARTS">2-Parts Page (Exactly 2 Metric Blocks)</option>
              <option value="THREE_PARTS">3-Parts Page (Exactly 3 Metric Blocks)</option>
            </select>
            <span className="text-[10px] text-slate-550 block">Controls the dynamic block cards rendered below.</span>
          </div>

          {/* Language */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-350">Default Language</label>
            <select
              value={defaultLanguage}
              onChange={(e) => setDefaultLanguage(e.target.value)}
              disabled={isSubmitting}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none transition"
            >
              <option value="en">English (en)</option>
              <option value="vi">Vietnamese (vi)</option>
            </select>
          </div>

          {/* Threshold Good */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-350">Good Satisfaction Threshold (Rating)</label>
            <input
              type="number"
              value={goodThreshold}
              onChange={(e) => setGoodThreshold(parseInt(e.target.value || '0', 10))}
              placeholder="e.g. 4"
              required
              min={1}
              max={10}
              disabled={isSubmitting}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none transition"
            />
            <span className="text-[10px] text-slate-550 block">Ratings at/above this value trigger good-sentiment logic.</span>
          </div>

          {/* Threshold Bad */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-350">Critical Alert Threshold (Rating)</label>
            <input
              type="number"
              value={badThreshold}
              onChange={(e) => setBadThreshold(parseInt(e.target.value || '0', 10))}
              placeholder="e.g. 2"
              required
              min={0}
              max={9}
              disabled={isSubmitting}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none transition"
            />
            <span className="text-[10px] text-slate-550 block">Ratings at/below this value flag crisis alert triggers.</span>
          </div>
        </div>
      </div>

      {/* Dynamic Blocks Cards */}
      <div className="space-y-6">
        <div className="border-b border-slate-800 pb-2">
          <h2 className="text-xl font-bold text-white">Experience Builder Blocks</h2>
          <p className="text-xs text-slate-555">Configure each metric page block segment below.</p>
        </div>

        {blocks.map((block, blockIdx) => (
          <div
            key={blockIdx}
            className="rounded-2xl border border-slate-800 bg-slate-900/20 p-6 backdrop-blur-sm space-y-5"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-800 pb-3">
              <span className="rounded-lg bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 text-xs font-bold text-indigo-400">
                Block Roster #{block.blockOrder}
              </span>
              <input
                type="text"
                value={block.title}
                onChange={(e) => handleBlockTitleChange(blockIdx, e.target.value)}
                placeholder="Block Header Label (e.g. Service Quality)"
                required
                disabled={isSubmitting}
                className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition w-full sm:max-w-xs"
              />
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              {/* Block Group Selector */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-350">Metric Group Category</label>
                <select
                  value={block.blockGroup}
                  onChange={(e) => handleBlockGroupChange(blockIdx, e.target.value as any)}
                  disabled={isSubmitting}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-xs text-white focus:border-indigo-500 focus:outline-none transition"
                >
                  <option value="EXPERIENCE_METRIC">Customer Experience Standard Rating</option>
                  <option value="CHOICE_QUESTION">Multiple / Single Choice Questions</option>
                  <option value="DATA_COLLECTION">Feedback & Detail Data Collection</option>
                </select>
              </div>

              {/* Block Type Selector based on Group */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-350">Metric Block Form Type</label>
                {block.blockGroup === 'EXPERIENCE_METRIC' ? (
                  <select
                    value={block.blockType}
                    onChange={(e) => updateBlockType(blockIdx, 'EXPERIENCE_METRIC', e.target.value as any)}
                    disabled={isSubmitting}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-xs text-white focus:border-indigo-500 focus:outline-none transition"
                  >
                    <option value="CSAT">CSAT (Customer Satisfaction, Scale 1-5)</option>
                    <option value="CES">CES (Customer Effort Score, Scale 1-5)</option>
                    <option value="NPS">NPS (Net Promoter Score, Scale 0-10)</option>
                  </select>
                ) : block.blockGroup === 'CHOICE_QUESTION' ? (
                  <select
                    value={block.blockType}
                    onChange={(e) => updateBlockType(blockIdx, 'CHOICE_QUESTION', e.target.value as any)}
                    disabled={isSubmitting}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-xs text-white focus:border-indigo-500 focus:outline-none transition"
                  >
                    <option value="SINGLE_CHOICE">Single Choice Selection</option>
                    <option value="MULTIPLE_CHOICE">Multiple Choice Selection</option>
                  </select>
                ) : (
                  <select
                    value={block.blockType}
                    onChange={(e) => updateBlockType(blockIdx, 'DATA_COLLECTION', e.target.value as any)}
                    disabled={isSubmitting}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-xs text-white focus:border-indigo-500 focus:outline-none transition"
                  >
                    <option value="OPEN_TEXT">Open Text Area (Customer Review Box)</option>
                    <option value="CONTACT_INFO">Contact Info (Name, Email, Phone)</option>
                    <option value="FILE_UPLOAD">File Attachment Placeholder</option>
                  </select>
                )}
              </div>

              {/* Question Text */}
              <div className="space-y-2 sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-350">Survey Question Display Label</label>
                <input
                  type="text"
                  value={block.questions[0].questionText}
                  onChange={(e) => handleQuestionTextChange(blockIdx, e.target.value)}
                  placeholder="e.g. How satisfied are you with our waiting times today?"
                  required
                  disabled={isSubmitting}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-xs text-white placeholder-slate-650 focus:border-indigo-500 focus:outline-none transition"
                />
              </div>

              {/* Options Editor (Visible only for choices) */}
              {block.blockType.includes('CHOICE') && (
                <div className="space-y-3 sm:col-span-2 border-t border-slate-800/80 pt-4">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-indigo-400">Manage Multiple Choice Options</label>
                    <button
                      type="button"
                      onClick={() => handleAddOption(blockIdx)}
                      disabled={isSubmitting}
                      className="flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-950 hover:bg-slate-900 px-3 py-1 text-[11px] font-semibold text-slate-300 transition"
                    >
                      <Plus className="h-3 w-3" />
                      <span>Add Option</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {block.questions[0].options.map((opt, optIdx) => (
                      <div key={optIdx} className="flex items-center gap-2 animate-in fade-in duration-150">
                        <span className="text-xs text-slate-600 font-mono">#{opt.orderIndex}</span>
                        <input
                          type="text"
                          value={opt.optionText}
                          onChange={(e) => handleOptionTextChange(blockIdx, optIdx, e.target.value)}
                          placeholder="e.g. High Pricing"
                          required
                          disabled={isSubmitting}
                          className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition"
                        />
                        {block.questions[0].options.length > 2 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveOption(blockIdx, optIdx)}
                            disabled={isSubmitting}
                            className="rounded-xl border border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/10 p-1.5 text-rose-455 transition duration-150"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Submit Buttons */}
      <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
        <button
          type="button"
          onClick={() => router.push('/surveys')}
          className="rounded-xl border border-slate-800 bg-slate-950 px-5 py-2.5 text-xs font-semibold text-slate-400 hover:bg-slate-900 transition"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-xl bg-indigo-600 px-6 py-2.5 text-xs font-semibold text-white shadow-lg shadow-indigo-500/10 hover:bg-indigo-500 disabled:opacity-50 transition flex items-center gap-1.5"
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          <span>{isEdit ? 'Save Block Layout' : 'Build Custom Survey'}</span>
        </button>
      </div>
    </form>
  );
}
