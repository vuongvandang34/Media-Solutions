'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sliders, CheckCircle, AlertCircle, Loader2, Lock, Eye, EyeOff, Save } from 'lucide-react';

interface FieldConfig {
  id: string;
  fieldKey: string;
  fieldLabel: string;
  fieldType: string;
  isRequired: boolean;
  isEnabled: boolean;
  orderIndex: number;
}

export default function CustomerFieldConfigForm() {
  const router = useRouter();
  const [fields, setFields] = useState<FieldConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    async function loadConfigs() {
      try {
        const res = await fetch('/api/customers/field-config');
        const result = await res.json();
        if (res.ok && result.success) {
          setFields(result.data.fields);
        } else {
          setStatusMessage({ type: 'error', text: result.message || 'Failed to load configurations.' });
        }
      } catch (err) {
        console.error('Field config load error:', err);
        setStatusMessage({ type: 'error', text: 'Failed to communicate with database.' });
      } finally {
        setIsLoading(false);
      }
    }
    loadConfigs();
  }, []);

  const handleFieldChange = (index: number, key: keyof FieldConfig, value: any) => {
    setFields((prev) => {
      const next = [...prev];
      const updatedField = { ...next[index], [key]: value };

      // Rule: if a field is disabled, it cannot be marked required
      if (key === 'isEnabled' && value === false) {
        updatedField.isRequired = false;
      }

      next[index] = updatedField;
      return next;
    });
    setStatusMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatusMessage(null);

    // Validate rules before sending
    const lockedKeys = ['customerCode', 'name', 'phone'];
    for (const f of fields) {
      if (lockedKeys.includes(f.fieldKey)) {
        if (!f.isEnabled || !f.isRequired) {
          setStatusMessage({
            type: 'error',
            text: `Core fields (${lockedKeys.join(', ')}) must always be enabled and required.`,
          });
          setIsSubmitting(false);
          return;
        }
      }

      if (!f.isEnabled && f.isRequired) {
        setStatusMessage({
          type: 'error',
          text: `Field "${f.fieldLabel}" cannot be disabled and required simultaneously.`,
        });
        setIsSubmitting(false);
        return;
      }
    }

    try {
      const res = await fetch('/api/customers/field-config', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fields }),
      });

      const result = await res.json();

      if (res.ok && result.success) {
        setFields(result.data.fields);
        setStatusMessage({ type: 'success', text: 'Customer fields configuration updated successfully!' });
        router.refresh();
      } else {
        setStatusMessage({ type: 'error', text: result.message || 'Failed to save configuration.' });
      }
    } catch (err) {
      console.error('Submit error:', err);
      setStatusMessage({ type: 'error', text: 'A network error occurred while saving.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-40 items-center justify-center rounded-2xl border border-slate-800 bg-slate-900/10 backdrop-blur-sm">
        <Loader2 className="h-7 w-7 text-indigo-400 animate-spin" />
        <span className="text-xs text-slate-400 font-semibold ml-2">Loading field configuration deck...</span>
      </div>
    );
  }

  const lockedKeys = ['customerCode', 'name', 'phone'];

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

      {/* Field Config List */}
      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/20 shadow-xl backdrop-blur-md">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm text-slate-350">
            <thead className="bg-slate-900/60 text-xs font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-6 py-4">Field Label</th>
                <th className="px-6 py-4">Field Key</th>
                <th className="px-6 py-4">Field Type</th>
                <th className="px-6 py-4">Enabled Status</th>
                <th className="px-6 py-4">Required State</th>
                <th className="px-6 py-4">Order Index</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 bg-transparent">
              {fields.map((field, idx) => {
                const isLocked = lockedKeys.includes(field.fieldKey);

                return (
                  <tr key={field.id} className="transition duration-150 hover:bg-slate-900/30">
                    <td className="px-6 py-3.5">
                      <input
                        type="text"
                        value={field.fieldLabel}
                        onChange={(e) => handleFieldChange(idx, 'fieldLabel', e.target.value)}
                        disabled={isSubmitting}
                        className="rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition"
                      />
                    </td>
                    <td className="px-6 py-3.5 font-mono text-xs font-bold text-slate-450">
                      {field.fieldKey}
                    </td>
                    <td className="px-6 py-3.5 text-xs font-medium text-slate-400">
                      {field.fieldType}
                    </td>
                    <td className="px-6 py-3.5">
                      {isLocked ? (
                        <div className="flex items-center gap-1.5 text-xs text-emerald-450 font-bold">
                          <Lock className="h-3.5 w-3.5" />
                          <span>Always Active</span>
                        </div>
                      ) : (
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={field.isEnabled}
                            onChange={(e) => handleFieldChange(idx, 'isEnabled', e.target.checked)}
                            disabled={isSubmitting}
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-slate-800 rounded-full peer peer-focus:ring-0 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-slate-400 after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600 peer-checked:after:bg-white border border-slate-750"></div>
                          <span className="ml-2 text-xs font-semibold text-slate-350">
                            {field.isEnabled ? 'Enabled' : 'Disabled'}
                          </span>
                        </label>
                      )}
                    </td>
                    <td className="px-6 py-3.5">
                      {isLocked ? (
                        <div className="flex items-center gap-1.5 text-xs text-amber-400 font-bold">
                          <Lock className="h-3.5 w-3.5" />
                          <span>Always Required</span>
                        </div>
                      ) : (
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={field.isRequired}
                            disabled={!field.isEnabled || isSubmitting}
                            onChange={(e) => handleFieldChange(idx, 'isRequired', e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-slate-800 rounded-full peer peer-focus:ring-0 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-slate-400 after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-650 peer-checked:after:bg-white border border-slate-750 disabled:opacity-50"></div>
                          <span className="ml-2 text-xs font-semibold text-slate-350">
                            {field.isRequired ? 'Required' : 'Optional'}
                          </span>
                        </label>
                      )}
                    </td>
                    <td className="px-6 py-3.5">
                      <input
                        type="number"
                        value={field.orderIndex}
                        onChange={(e) => handleFieldChange(idx, 'orderIndex', parseInt(e.target.value || '0', 10))}
                        disabled={isSubmitting}
                        className="w-16 rounded-lg border border-slate-800 bg-slate-950/60 px-2 py-1.5 text-xs text-white text-center focus:outline-none focus:border-indigo-500"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/10 hover:bg-indigo-500 disabled:opacity-50 transition duration-150 flex items-center gap-1.5"
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          <span>Save Field Configurations</span>
        </button>
      </div>
    </form>
  );
}
