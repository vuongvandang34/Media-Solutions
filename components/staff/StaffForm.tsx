'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Users, Phone, ShieldCheck, Loader2, Upload, X, ShieldAlert } from 'lucide-react';

interface StaffFormProps {
  initialData?: {
    id: string;
    staffCode: string;
    fullName: string;
    phone: string | null;
    avatarUrl: string | null;
    status: 'ACTIVE' | 'ABSENT' | 'RESIGNED';
  };
  onClose: () => void;
  onSuccess: () => void;
}

export default function StaffForm({ initialData, onClose, onSuccess }: StaffFormProps) {
  const router = useRouter();
  const isEdit = !!initialData;

  const [formData, setFormData] = useState({
    staffCode: initialData?.staffCode || '',
    fullName: initialData?.fullName || '',
    phone: initialData?.phone || '',
    avatarUrl: initialData?.avatarUrl || '',
    status: initialData?.status || 'ACTIVE',
  });

  const [avatarPreview, setAvatarPreview] = useState<string | null>(initialData?.avatarUrl || null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMessage(null);

    // Mimetype and size validation
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      setErrorMessage('Invalid file type. Only JPEG, PNG, and WEBP images are supported.');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setErrorMessage('Avatar image exceeds the 2MB size limit.');
      return;
    }

    setUploadingAvatar(true);

    try {
      const data = new FormData();
      data.append('file', file);

      const res = await fetch('/api/uploads/staff-avatar', {
        method: 'POST',
        body: data,
      });

      const result = await res.json();

      if (res.ok && result.success) {
        setFormData((prev) => ({ ...prev, avatarUrl: result.data.url }));
        setAvatarPreview(result.data.url);
      } else {
        setErrorMessage(result.message || 'Failed to upload avatar.');
      }
    } catch (err) {
      console.error('Avatar upload err:', err);
      setErrorMessage('An unexpected network error occurred.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleRemoveAvatar = () => {
    setFormData((prev) => ({ ...prev, avatarUrl: '' }));
    setAvatarPreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);
    setFieldErrors({});

    const endpoint = isEdit ? `/api/staff/${initialData.id}` : '/api/staff';
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
        setErrorMessage(result.message || 'Failed to save staff member.');
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
    } catch (error) {
      console.error('Save staff error:', error);
      setErrorMessage('An unexpected server error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {errorMessage && (
        <div className="flex items-start gap-2.5 rounded-xl border border-rose-500/20 bg-rose-500/5 p-4 text-xs text-rose-400">
          <ShieldAlert className="h-4.5 w-4.5 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Avatar Section */}
      <div className="flex items-center gap-4 border-b border-slate-800 pb-5">
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full border border-slate-800 bg-slate-900 flex items-center justify-center">
          {avatarPreview ? (
            <img src={avatarPreview} alt="Avatar" className="h-full w-full object-cover" />
          ) : (
            <Users className="h-7 w-7 text-slate-500" />
          )}

          {uploadingAvatar && (
            <div className="absolute inset-0 bg-slate-950/80 flex items-center justify-center">
              <Loader2 className="h-5 w-5 text-indigo-400 animate-spin" />
            </div>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300">Avatar Image</label>
          <div className="flex items-center gap-2 mt-1.5">
            <label className="cursor-pointer flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-950 hover:bg-slate-900 transition duration-150 text-[11px] font-semibold text-slate-350">
              <Upload className="h-3 w-3 text-indigo-400" />
              <span>Upload photo</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleAvatarUpload}
                disabled={uploadingAvatar || isSubmitting}
              />
            </label>

            {avatarPreview && (
              <button
                type="button"
                onClick={handleRemoveAvatar}
                className="flex items-center gap-1 px-2 py-1.5 rounded-lg border border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/10 transition duration-150 text-[11px] font-semibold text-rose-450"
              >
                <X className="h-3 w-3" />
                <span>Remove</span>
              </button>
            )}
          </div>
          <span className="text-[9px] text-slate-500 mt-1 block">JPG, PNG, WEBP up to 2MB</span>
        </div>
      </div>

      <div className="space-y-4">
        {/* Staff Code */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-300">Staff Code (Identifier)</label>
          <input
            type="text"
            name="staffCode"
            value={formData.staffCode}
            onChange={handleChange}
            placeholder="e.g. EMP101"
            required
            className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2 text-sm text-white placeholder-slate-650 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition duration-150"
          />
          {fieldErrors.staffCode && (
            <p className="text-xs text-rose-400 mt-1">{fieldErrors.staffCode}</p>
          )}
          <span className="text-[9px] text-slate-550 block">Unique code for survey identification (letters, numbers, hyphens only).</span>
        </div>

        {/* Full Name */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-300">Full Name</label>
          <input
            type="text"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            placeholder="John Smith"
            required
            className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2 text-sm text-white placeholder-slate-650 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition duration-150"
          />
          {fieldErrors.fullName && (
            <p className="text-xs text-rose-400 mt-1">{fieldErrors.fullName}</p>
          )}
        </div>

        {/* Phone */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-300">Phone Number (Optional)</label>
          <div className="relative">
            <input
              type="text"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="+84 901 234 567"
              className="w-full rounded-xl border border-slate-800 bg-slate-950 pl-10 pr-4 py-2 text-sm text-white placeholder-slate-650 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition duration-150"
            />
            <Phone className="absolute left-3.5 top-2.5 h-4.5 w-4.5 text-slate-600" />
          </div>
          {fieldErrors.phone && (
            <p className="text-xs text-rose-400 mt-1">{fieldErrors.phone}</p>
          )}
        </div>

        {/* Status */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-300">Workspace Status</label>
          <div className="relative">
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition duration-150 appearance-none"
            >
              <option value="ACTIVE">Active (Available for Surveys)</option>
              <option value="ABSENT">Absent (Temporarily Hidden)</option>
              <option value="RESIGNED">Resigned (Inactive Profile)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Form Buttons */}
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
          disabled={isSubmitting || uploadingAvatar}
          className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-indigo-500/10 hover:bg-indigo-500 disabled:opacity-50 transition duration-150 flex items-center gap-1.5"
        >
          {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          <span>{isEdit ? 'Save Changes' : 'Create Staff Member'}</span>
        </button>
      </div>
    </form>
  );
}
