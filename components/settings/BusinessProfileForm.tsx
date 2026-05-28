'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Building, MapPin, Globe, User, Phone, CheckCircle, AlertCircle } from 'lucide-react';

interface BusinessProfileFormProps {
  initialTenant: {
    businessName: string;
    businessAddress: string;
    country: string;
    ownerName: string;
    ownerPhone: string;
    ownerEmail: string;
  };
}

export default function BusinessProfileForm({ initialTenant }: BusinessProfileFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    businessName: initialTenant.businessName || '',
    businessAddress: initialTenant.businessAddress || '',
    country: initialTenant.country || '',
    ownerName: initialTenant.ownerName || '',
    ownerPhone: initialTenant.ownerPhone || '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error for field
    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatusMessage(null);
    setFieldErrors({});

    try {
      const res = await fetch('/api/tenant/me', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await res.json();

      if (res.ok && result.success) {
        setStatusMessage({
          type: 'success',
          text: result.message || 'Business profile updated successfully!',
        });
        router.refresh();
      } else {
        setStatusMessage({
          type: 'error',
          text: result.message || 'Failed to update business profile.',
        });
        if (result.errors) {
          // Map array of errors to first item message
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
      console.error('Submit error:', error);
      setStatusMessage({
        type: 'error',
        text: 'An unexpected network error occurred.',
      });
    } finally {
      setIsSubmitting(false);
    }
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

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Business Settings */}
        <div className="space-y-5 rounded-2xl border border-slate-800 bg-slate-900/20 p-6 backdrop-blur-sm">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-indigo-400 flex items-center gap-2">
            <Building className="h-4 w-4" />
            <span>Workspace Profile</span>
          </h3>

          {/* Business Name */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-300">Business Name</label>
            <input
              type="text"
              name="businessName"
              value={formData.businessName}
              onChange={handleChange}
              placeholder="e.g. Media Solutions Cafe"
              required
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-sm text-white placeholder-slate-600 shadow-inner focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition duration-150"
            />
            {fieldErrors.businessName && (
              <p className="text-xs text-rose-400 mt-1">{fieldErrors.businessName}</p>
            )}
          </div>

          {/* Business Address */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-300">Business Address</label>
            <div className="relative">
              <input
                type="text"
                name="businessAddress"
                value={formData.businessAddress}
                onChange={handleChange}
                placeholder="123 Nguyen Hue, Quan 1, HCMC"
                required
                className="w-full rounded-xl border border-slate-800 bg-slate-950 pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-600 shadow-inner focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition duration-150"
              />
              <MapPin className="absolute left-3.5 top-3 h-4.5 w-4.5 text-slate-600" />
            </div>
            {fieldErrors.businessAddress && (
              <p className="text-xs text-rose-400 mt-1">{fieldErrors.businessAddress}</p>
            )}
          </div>

          {/* Country */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-300">Country</label>
            <div className="relative">
              <input
                type="text"
                name="country"
                value={formData.country}
                onChange={handleChange}
                placeholder="Vietnam"
                required
                className="w-full rounded-xl border border-slate-800 bg-slate-950 pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-600 shadow-inner focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition duration-150"
              />
              <Globe className="absolute left-3.5 top-3 h-4.5 w-4.5 text-slate-600" />
            </div>
            {fieldErrors.country && (
              <p className="text-xs text-rose-400 mt-1">{fieldErrors.country}</p>
            )}
          </div>
        </div>

        {/* Ownership Settings */}
        <div className="space-y-5 rounded-2xl border border-slate-800 bg-slate-900/20 p-6 backdrop-blur-sm">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-indigo-400 flex items-center gap-2">
            <User className="h-4 w-4" />
            <span>Owner Contact Deck</span>
          </h3>

          {/* Owner Full Name */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-300">Owner Full Name</label>
            <input
              type="text"
              name="ownerName"
              value={formData.ownerName}
              onChange={handleChange}
              placeholder="Nguyen Van A"
              required
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-sm text-white placeholder-slate-600 shadow-inner focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition duration-150"
            />
            {fieldErrors.ownerName && (
              <p className="text-xs text-rose-400 mt-1">{fieldErrors.ownerName}</p>
            )}
          </div>

          {/* Owner Phone */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-300">Owner Phone Number</label>
            <div className="relative">
              <input
                type="text"
                name="ownerPhone"
                value={formData.ownerPhone}
                onChange={handleChange}
                placeholder="e.g. 0901234567"
                required
                className="w-full rounded-xl border border-slate-800 bg-slate-950 pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-600 shadow-inner focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition duration-150"
              />
              <Phone className="absolute left-3.5 top-3 h-4.5 w-4.5 text-slate-600" />
            </div>
            {fieldErrors.ownerPhone && (
              <p className="text-xs text-rose-400 mt-1">{fieldErrors.ownerPhone}</p>
            )}
          </div>

          {/* Owner Email (Disabled) */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-500">Owner Email Address (Read-only)</label>
            <input
              type="email"
              value={initialTenant.ownerEmail}
              disabled
              className="w-full rounded-xl border border-slate-850 bg-slate-950/40 px-4 py-2.5 text-sm text-slate-500 cursor-not-allowed shadow-inner focus:outline-none"
            />
            <p className="text-[10px] text-slate-500 leading-normal">
              To change your primary administrative email, please contact platform customer support.
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/10 hover:bg-indigo-500 disabled:opacity-50 transition duration-150"
        >
          {isSubmitting ? 'Saving changes...' : 'Save Workspace Profile'}
        </button>
      </div>
    </form>
  );
}
