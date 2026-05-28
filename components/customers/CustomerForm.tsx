'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  User,
  Phone,
  Mail,
  Calendar,
  Globe,
  Building,
  MapPin,
  ClipboardList,
  AlertTriangle,
  Loader2,
  CheckCircle,
  ShieldAlert,
} from 'lucide-react';

interface FieldConfig {
  id: string;
  fieldKey: string;
  fieldLabel: string;
  fieldType: 'TEXT' | 'EMAIL' | 'PHONE' | 'DATE' | 'URL' | 'TEXTAREA';
  isRequired: boolean;
  isEnabled: boolean;
  orderIndex: number;
}

interface CustomerFormProps {
  initialData?: {
    id: string;
    customerCode: string;
    name: string;
    phone: string;
    email: string | null;
    birthday: Date | string | null;
    website: string | null;
    company: string | null;
    address: string | null;
    note: string | null;
    status: 'ACTIVE' | 'LOCKED';
  };
  onClose: () => void;
  onSuccess: () => void;
}

export default function CustomerForm({ initialData, onClose, onSuccess }: CustomerFormProps) {
  const router = useRouter();
  const isEdit = !!initialData;

  // Dynamic configuration state
  const [configs, setConfigs] = useState<FieldConfig[]>([]);
  const [isLoadingConfigs, setIsLoadingConfigs] = useState(true);

  // Form input state
  const [formData, setFormData] = useState<Record<string, string>>({
    customerCode: initialData?.customerCode || '',
    name: initialData?.name || '',
    phone: initialData?.phone || '',
    email: initialData?.email || '',
    birthday: initialData?.birthday
      ? new Date(initialData.birthday).toISOString().split('T')[0]
      : '',
    website: initialData?.website || '',
    company: initialData?.company || '',
    address: initialData?.address || '',
    note: initialData?.note || '',
    status: initialData?.status || 'ACTIVE',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Duplicate check warnings
  const [duplicateWarning, setDuplicateWarning] = useState<{
    phoneExists: boolean;
    emailExists: boolean;
    matchedCustomers: Array<{ id: string; name: string; phone: string; email: string | null }>;
  } | null>(null);

  const [checkingDuplicates, setCheckingDuplicates] = useState(false);

  // Load configs
  useEffect(() => {
    async function loadConfigs() {
      try {
        const res = await fetch('/api/customers/field-config');
        const result = await res.json();
        if (res.ok && result.success) {
          // Only show enabled fields
          setConfigs(result.data.fields.filter((f: any) => f.isEnabled));
        }
      } catch (err) {
        console.error('Failed to load customer configs:', err);
      } finally {
        setIsLoadingConfigs(false);
      }
    }
    loadConfigs();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear validation error on change
    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  // Perform check-duplicate on blur
  const handleBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if ((name === 'phone' || name === 'email') && value.trim()) {
      setCheckingDuplicates(true);
      try {
        const payload = {
          phone: name === 'phone' ? value : undefined,
          email: name === 'email' ? value : undefined,
          excludeCustomerId: initialData?.id,
        };

        const res = await fetch('/api/customers/check-duplicate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const result = await res.json();

        if (res.ok && result.success) {
          const { phoneExists, emailExists, matchedCustomers } = result.data;
          if (phoneExists || emailExists) {
            setDuplicateWarning({
              phoneExists,
              emailExists,
              matchedCustomers,
            });
          } else {
            setDuplicateWarning((prev) => {
              if (!prev) return null;
              // Clear only specific warning
              const next = { ...prev };
              if (name === 'phone') next.phoneExists = false;
              if (name === 'email') next.emailExists = false;
              if (!next.phoneExists && !next.emailExists) return null;
              return next;
            });
          }
        }
      } catch (err) {
        console.error('Error checking duplicates:', err);
      } finally {
        setCheckingDuplicates(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);
    setFieldErrors({});

    const endpoint = isEdit ? `/api/customers/${initialData.id}` : '/api/customers';
    const method = isEdit ? 'PATCH' : 'POST';

    try {
      const res = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await res.json();

      if (res.ok && result.success) {
        onSuccess();
      } else {
        setErrorMessage(result.message || 'Failed to save customer record.');
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
      console.error('Customer form submit error:', err);
      setErrorMessage('An unexpected server error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getIcon = (key: string) => {
    switch (key) {
      case 'phone':
        return <Phone className="absolute left-3.5 top-3 h-4.5 w-4.5 text-slate-600" />;
      case 'email':
        return <Mail className="absolute left-3.5 top-3 h-4.5 w-4.5 text-slate-600" />;
      case 'birthday':
        return <Calendar className="absolute left-3.5 top-3 h-4.5 w-4.5 text-slate-600" />;
      case 'website':
        return <Globe className="absolute left-3.5 top-3 h-4.5 w-4.5 text-slate-600" />;
      case 'company':
        return <Building className="absolute left-3.5 top-3 h-4.5 w-4.5 text-slate-600" />;
      case 'address':
        return <MapPin className="absolute left-3.5 top-3 h-4.5 w-4.5 text-slate-600" />;
      default:
        return null;
    }
  };

  if (isLoadingConfigs) {
    return (
      <div className="flex h-32 items-center justify-center">
        <Loader2 className="h-6 w-6 text-indigo-400 animate-spin" />
        <span className="text-xs text-slate-450 ml-2">Loading workspace field layout...</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errorMessage && (
        <div className="flex items-start gap-2.5 rounded-xl border border-rose-500/20 bg-rose-500/5 p-4 text-xs text-rose-400">
          <ShieldAlert className="h-4.5 w-4.5 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Duplicate Alert Banner */}
      {duplicateWarning && (
        <div className="flex items-start gap-3 rounded-xl border border-yellow-500/25 bg-yellow-500/5 p-4 text-xs text-yellow-400 animate-in fade-in duration-200">
          <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold">Duplicate Contact Warning!</span>
            <p className="leading-normal">
              A customer with this {duplicateWarning.phoneExists ? 'phone number' : ''}
              {duplicateWarning.phoneExists && duplicateWarning.emailExists ? ' and ' : ''}
              {duplicateWarning.emailExists ? 'email address' : ''} already exists in your workspace roster:
            </p>
            <div className="mt-1.5 pl-2 border-l border-yellow-500/30 space-y-1 text-slate-350">
              {duplicateWarning.matchedCustomers.map((c) => (
                <div key={c.id}>
                  • <strong>{c.name}</strong> ({c.phone} {c.email ? `- ${c.email}` : ''})
                </div>
              ))}
            </div>
            <p className="text-[10px] text-yellow-500/80 leading-normal pt-1">
              You can still proceed to save, but consider updating the existing customer to avoid confusion.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 max-h-[60vh] overflow-y-auto pr-1">
        {configs.map((config) => {
          const key = config.fieldKey;
          const label = config.fieldLabel;
          const isRequired = config.isRequired;
          const type = config.fieldType;

          const isTextarea = type === 'TEXTAREA';
          const icon = getIcon(key);

          return (
            <div
              key={config.id}
              className={`space-y-1.5 ${isTextarea ? 'sm:col-span-2' : ''}`}
            >
              <label className="block text-xs font-semibold text-slate-300">
                <span>{label}</span>
                {isRequired && <span className="text-rose-450 ml-1 font-bold">*</span>}
              </label>

              {isTextarea ? (
                <div className="relative">
                  <textarea
                    name={key}
                    value={formData[key] || ''}
                    onChange={handleChange}
                    rows={3}
                    placeholder={`Enter ${label.toLowerCase()}...`}
                    required={isRequired}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2 text-sm text-white placeholder-slate-650 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition duration-150"
                  />
                </div>
              ) : (
                <div className="relative">
                  <input
                    type={type === 'DATE' ? 'date' : type === 'EMAIL' ? 'email' : 'text'}
                    name={key}
                    value={formData[key] || ''}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder={
                      key === 'customerCode'
                        ? 'e.g. CUST101'
                        : key === 'phone'
                        ? '0901234567'
                        : `Enter ${label.toLowerCase()}...`
                    }
                    required={isRequired}
                    className={`w-full rounded-xl border border-slate-800 bg-slate-950 ${
                      icon ? 'pl-10' : 'px-4'
                    } pr-4 py-2.5 text-sm text-white placeholder-slate-650 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition duration-150`}
                  />
                  {icon}
                </div>
              )}

              {fieldErrors[key] && (
                <p className="text-xs text-rose-400 mt-1">{fieldErrors[key]}</p>
              )}
            </div>
          );
        })}

        {/* Status input (visible on editing) */}
        {isEdit && (
          <div className="space-y-1.5 sm:col-span-2 border-t border-slate-800/80 pt-3">
            <label className="block text-xs font-semibold text-slate-300">Customer Roster Status</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition duration-150"
            >
              <option value="ACTIVE">Active (Valid Customer)</option>
              <option value="LOCKED">Locked (Restricted Access)</option>
            </select>
          </div>
        )}
      </div>

      {/* Buttons */}
      <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
        <button
          type="button"
          onClick={onClose}
          className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-2 text-xs font-semibold text-slate-400 hover:bg-slate-900 transition duration-150"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting || checkingDuplicates}
          className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-indigo-500/10 hover:bg-indigo-500 disabled:opacity-50 transition duration-150 flex items-center gap-1.5"
        >
          {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          <span>{isEdit ? 'Save Roster' : 'Register Customer'}</span>
        </button>
      </div>
    </form>
  );
}

// Add simple close icon fallback if not imported
function X(props: any) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}
