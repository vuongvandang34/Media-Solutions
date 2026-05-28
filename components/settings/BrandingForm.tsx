'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Image as ImageIcon,
  UploadCloud,
  Trash2,
  AlertCircle,
  CheckCircle,
  Sparkles,
  Lock,
  Loader2,
} from 'lucide-react';

interface BrandingFormProps {
  tenant: {
    id: string;
    businessName: string;
    logoUrl: string | null;
    promotionPhotoUrl: string | null;
    plan: {
      displayName: string;
      allowPromotionPhoto: boolean;
    } | null;
  };
}

export default function BrandingForm({ tenant }: BrandingFormProps) {
  const router = useRouter();
  const allowPromo = tenant.plan?.allowPromotionPhoto ?? false;

  const [logoPreview, setLogoPreview] = useState<string | null>(tenant.logoUrl);
  const [promoPreview, setPromoPreview] = useState<string | null>(tenant.promotionPhotoUrl);

  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingPromo, setUploadingPromo] = useState(false);

  const [deletingLogo, setDeletingLogo] = useState(false);
  const [deletingPromo, setDeletingPromo] = useState(false);

  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'LOGO' | 'PROMOTION_PHOTO') => {
    const file = e.target.files?.[0];
    if (!file) return;

    setStatusMessage(null);

    // Validate size and mimetype client-side
    const allowedMime = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedMime.includes(file.type)) {
      setStatusMessage({
        type: 'error',
        text: 'Invalid file type. Only JPEG, PNG, and WEBP image formats are supported.',
      });
      return;
    }

    if (type === 'LOGO') {
      if (file.size > 2 * 1024 * 1024) {
        setStatusMessage({
          type: 'error',
          text: 'Logo exceeds the maximum 2MB size limit.',
        });
        return;
      }
      setUploadingLogo(true);
    } else {
      if (file.size > 5 * 1024 * 1024) {
        setStatusMessage({
          type: 'error',
          text: 'Promotion photo exceeds the maximum 5MB size limit.',
        });
        return;
      }
      setUploadingPromo(true);
    }

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);

      const res = await fetch('/api/uploads/business-asset', {
        method: 'POST',
        body: formData,
      });

      const result = await res.json();

      if (res.ok && result.success) {
        setStatusMessage({
          type: 'success',
          text: `${type === 'LOGO' ? 'Logo' : 'Promotion photo'} has been updated successfully!`,
        });

        if (type === 'LOGO') {
          setLogoPreview(result.data.asset.fileUrl);
        } else {
          setPromoPreview(result.data.asset.fileUrl);
        }
        router.refresh();
      } else {
        setStatusMessage({
          type: 'error',
          text: result.message || `Failed to upload ${type.toLowerCase().replace('_', ' ')}.`,
        });
      }
    } catch (error) {
      console.error('Upload error:', error);
      setStatusMessage({
        type: 'error',
        text: 'An unexpected error occurred during file upload.',
      });
    } finally {
      setUploadingLogo(false);
      setUploadingPromo(false);
    }
  };

  const handleDeleteAsset = async (type: 'LOGO' | 'PROMOTION_PHOTO') => {
    if (!confirm(`Are you sure you want to delete your current ${type === 'LOGO' ? 'Logo' : 'Promotion Photo'}?`)) {
      return;
    }

    setStatusMessage(null);

    if (type === 'LOGO') {
      setDeletingLogo(true);
    } else {
      setDeletingPromo(true);
    }

    try {
      const res = await fetch(`/api/uploads/business-asset?type=${type}`, {
        method: 'DELETE',
      });

      const result = await res.json();

      if (res.ok && result.success) {
        setStatusMessage({
          type: 'success',
          text: `${type === 'LOGO' ? 'Logo' : 'Promotion photo'} removed successfully.`,
        });

        if (type === 'LOGO') {
          setLogoPreview(null);
        } else {
          setPromoPreview(null);
        }
        router.refresh();
      } else {
        setStatusMessage({
          type: 'error',
          text: result.message || 'Failed to delete branding asset.',
        });
      }
    } catch (error) {
      console.error('Delete error:', error);
      setStatusMessage({
        type: 'error',
        text: 'An unexpected error occurred while deleting.',
      });
    } finally {
      setDeletingLogo(false);
      setDeletingPromo(false);
    }
  };

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

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Logo Card Section */}
        <div className="space-y-5 rounded-2xl border border-slate-800 bg-slate-900/20 p-6 backdrop-blur-sm">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-indigo-400 flex items-center gap-2">
              <ImageIcon className="h-4.5 w-4.5" />
              <span>Business Logo</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Used in customer-facing survey forms and navigation headers. Recommends square ratio (JPG, PNG, WEBP, max 2MB).
            </p>
          </div>

          <div className="flex flex-col items-center justify-center border border-dashed border-slate-800 rounded-xl p-6 bg-slate-950/40 relative min-h-[170px]">
            {logoPreview ? (
              <div className="flex flex-col items-center gap-4">
                <div className="h-24 w-24 overflow-hidden rounded-xl border border-slate-800 bg-slate-900 flex items-center justify-center p-2">
                  <img
                    src={logoPreview}
                    alt="Business Logo"
                    className="h-full w-full object-contain"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleDeleteAsset('LOGO')}
                  disabled={deletingLogo}
                  className="flex items-center gap-1.5 rounded-lg border border-rose-500/20 bg-rose-500/5 px-3 py-1.5 text-xs text-rose-400 hover:bg-rose-500/10 transition duration-150 disabled:opacity-50"
                >
                  {deletingLogo ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" />
                  )}
                  <span>Delete Logo</span>
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full cursor-pointer hover:bg-slate-900/10 transition duration-150 p-4">
                <UploadCloud className="h-10 w-10 text-slate-600 mb-2" />
                <span className="text-xs text-slate-400 font-semibold">
                  {uploadingLogo ? 'Uploading logo...' : 'Click to upload logo'}
                </span>
                <span className="text-[10px] text-slate-600 mt-1">JPEG, PNG, WEBP up to 2MB</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => handleFileUpload(e, 'LOGO')}
                  disabled={uploadingLogo}
                />
              </label>
            )}

            {uploadingLogo && (
              <div className="absolute inset-0 bg-slate-950/80 rounded-xl flex items-center justify-center gap-2">
                <Loader2 className="h-6 w-6 text-indigo-400 animate-spin" />
                <span className="text-xs text-slate-300 font-semibold">Uploading...</span>
              </div>
            )}
          </div>
        </div>

        {/* Promotion Photo Card Section */}
        <div className="space-y-5 rounded-2xl border border-slate-800 bg-slate-900/20 p-6 backdrop-blur-sm relative overflow-hidden">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-indigo-400 flex items-center gap-2">
              <Sparkles className="h-4.5 w-4.5 text-amber-400" />
              <span>Survey Banner / Promo Photo</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Banner photo displayed at the top of customer survey pages to showcase your products/campaigns (max 5MB).
            </p>
          </div>

          {allowPromo ? (
            <div className="flex flex-col items-center justify-center border border-dashed border-slate-800 rounded-xl p-6 bg-slate-950/40 relative min-h-[170px]">
              {promoPreview ? (
                <div className="flex flex-col items-center gap-4 w-full">
                  <div className="h-24 w-full overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
                    <img
                      src={promoPreview}
                      alt="Promotion Banner"
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteAsset('PROMOTION_PHOTO')}
                    disabled={deletingPromo}
                    className="flex items-center gap-1.5 rounded-lg border border-rose-500/20 bg-rose-500/5 px-3 py-1.5 text-xs text-rose-400 hover:bg-rose-500/10 transition duration-150 disabled:opacity-50"
                  >
                    {deletingPromo ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                    <span>Delete Photo</span>
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full cursor-pointer hover:bg-slate-900/10 transition duration-150 p-4">
                  <UploadCloud className="h-10 w-10 text-slate-600 mb-2" />
                  <span className="text-xs text-slate-400 font-semibold">
                    {uploadingPromo ? 'Uploading banner...' : 'Click to upload promotion photo'}
                  </span>
                  <span className="text-[10px] text-slate-600 mt-1">JPEG, PNG, WEBP up to 5MB</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) => handleFileUpload(e, 'PROMOTION_PHOTO')}
                    disabled={uploadingPromo}
                  />
                </label>
              )}

              {uploadingPromo && (
                <div className="absolute inset-0 bg-slate-950/80 rounded-xl flex items-center justify-center gap-2">
                  <Loader2 className="h-6 w-6 text-indigo-400 animate-spin" />
                  <span className="text-xs text-slate-300 font-semibold">Uploading...</span>
                </div>
              )}
            </div>
          ) : (
            /* Disabled locked view when plan locks promo banner */
            <div className="flex flex-col items-center justify-center border border-slate-800/80 rounded-xl p-8 bg-slate-950/30 min-h-[170px] relative text-center">
              <div className="absolute top-3 right-3 rounded-lg bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 text-[9px] font-bold text-indigo-400 flex items-center gap-1">
                <Lock className="h-2.5 w-2.5" />
                <span>Feature Locked</span>
              </div>

              <div className="h-10 w-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center mb-3">
                <Lock className="h-5 w-5 text-slate-500" />
              </div>
              <span className="text-xs font-bold text-slate-450">Promotion Photo Unavailable</span>
              <p className="text-[10px] text-slate-550 max-w-[280px] mt-1 leading-normal">
                Promotion Banners are locked on your current <strong>{tenant.plan?.displayName || 'Trial'}</strong> plan.
              </p>
              <button
                type="button"
                className="mt-4 rounded-lg bg-indigo-600/10 border border-indigo-500/20 px-4 py-1.5 text-xs font-semibold text-indigo-400 hover:bg-indigo-600/25 transition duration-150"
              >
                Upgrade to Basic or Premium Plan
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
