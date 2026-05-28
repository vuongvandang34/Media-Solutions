'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Smartphone,
  Sparkles,
  ArrowLeft,
  Heart,
  Frown,
  CheckCircle,
  ThumbsUp,
  MessageSquare,
  User,
  Mail,
  Phone,
  Share2,
  Calendar,
  AlertCircle,
  Megaphone,
} from 'lucide-react';

interface Option {
  id?: string;
  optionText: string;
  orderIndex: number;
}

interface Question {
  id?: string;
  questionText: string;
  questionType: 'RATING' | 'NPS' | 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'OPEN_TEXT' | 'CONTACT_INFO' | 'FILE_UPLOAD';
  isRequired: boolean;
  orderIndex: number;
  metadataJson?: any;
  options: Option[];
}

interface SurveyBlock {
  id?: string;
  blockOrder: number;
  blockGroup: 'EXPERIENCE_METRIC' | 'CHOICE_QUESTION' | 'DATA_COLLECTION';
  blockType: 'CES' | 'CSAT' | 'NPS' | 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'OPEN_TEXT' | 'CONTACT_INFO' | 'FILE_UPLOAD';
  title: string;
  questions: Question[];
}

interface SurveyData {
  id: string;
  name: string;
  description: string | null;
  greetingText: string | null;
  status: 'DRAFT' | 'ACTIVE' | 'LOCKED';
  modelType: 'ONE_PART' | 'TWO_PARTS' | 'THREE_PARTS';
  defaultLanguage: string;
  goodThreshold: number;
  badThreshold: number;
  blocks: SurveyBlock[];
}

interface TenantBranding {
  businessName: string;
  logoUrl: string | null;
  promotionPhotoUrl: string | null;
  allowPromotionPhoto: boolean;
}

interface SurveyPreviewProps {
  survey: SurveyData;
  branding: TenantBranding;
}

export default function SurveyPreview({ survey, branding }: SurveyPreviewProps) {
  const router = useRouter();

  // State to simulate user inputs inside the mobile screen
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitRating, setSubmitRating] = useState<number | null>(null);

  // Helper to get first rating from responses to trigger dynamic logic
  const handleRatingClick = (questionId: string, val: number) => {
    setAnswers((prev) => ({ ...prev, [questionId]: val }));
    // Track the primary rating to trigger good/bad logic
    setSubmitRating(val);
  };

  const handleTextChange = (questionId: string, val: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: val }));
  };

  const handleChoiceClick = (questionId: string, optionText: string, isMulti: boolean) => {
    setAnswers((prev) => {
      const current = prev[questionId];
      if (isMulti) {
        const arr = Array.isArray(current) ? [...current] : [];
        if (arr.includes(optionText)) {
          return { ...prev, [questionId]: arr.filter((x) => x !== optionText) };
        } else {
          return { ...prev, [questionId]: [...arr, optionText] };
        }
      } else {
        return { ...prev, [questionId]: optionText };
      }
    });
  };

  const handleContactChange = (questionId: string, field: string, val: string) => {
    setAnswers((prev) => {
      const current = prev[questionId] || {};
      return {
        ...prev,
        [questionId]: {
          ...current,
          [field]: val,
        },
      };
    });
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
  };

  const handleReset = () => {
    setAnswers({});
    setIsSubmitted(false);
    setSubmitRating(null);
  };

  // Determine sentiment response based on the primary rating
  const isGoodSentiment = submitRating !== null && submitRating >= survey.goodThreshold;
  const isBadSentiment = submitRating !== null && submitRating <= survey.badThreshold;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* LEFT: Simulation Information & Settings Controls */}
      <div className="lg:col-span-5 space-y-6">
        <button
          onClick={() => router.push('/surveys')}
          className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition group border border-slate-800 rounded-xl px-3.5 py-2 bg-slate-950"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
          <span>Back to Survey Sheets</span>
        </button>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/20 p-6 backdrop-blur-md space-y-5">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-400">
              Interactive Simulator
            </span>
            <h2 className="text-xl font-bold text-white mt-0.5">{survey.name}</h2>
            {survey.description && (
              <p className="text-xs text-slate-400 mt-1">{survey.description}</p>
            )}
          </div>

          <div className="border-t border-slate-800 pt-4 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Active Layout Model:</span>
              <span className="font-semibold text-indigo-400 uppercase">
                {survey.modelType.replace('_', ' ')}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Default Language:</span>
              <span className="font-semibold text-slate-300 uppercase">
                {survey.defaultLanguage}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Good Rating Sentiment:</span>
              <span className="font-bold text-emerald-400">
                &ge; {survey.goodThreshold} Stars
              </span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Crisis Alert Threshold:</span>
              <span className="font-bold text-rose-455">
                &le; {survey.badThreshold} Stars
              </span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Promotion Banner:</span>
              <span>
                {branding.allowPromotionPhoto && branding.promotionPhotoUrl ? (
                  <span className="text-emerald-450 font-semibold">Enabled</span>
                ) : (
                  <span className="text-slate-600 font-semibold">Not Set</span>
                )}
              </span>
            </div>
          </div>

          <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-4 space-y-2">
            <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
              <span>Simulate Real-time Responses</span>
            </h4>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Interact with the elements inside the mobile preview frame on the right. 
              Clicking ratings and submitting will activate custom branding rules and conditional crisis/promotional alerts.
            </p>
            {submitRating !== null && (
              <div className="pt-2 border-t border-slate-900 mt-2 flex items-center gap-2 text-xs">
                <span className="text-slate-500">Selected Rating:</span>
                <span className={`font-bold ${isGoodSentiment ? 'text-emerald-400' : isBadSentiment ? 'text-rose-400' : 'text-amber-400'}`}>
                  {submitRating} Stars
                </span>
                <span>
                  {isGoodSentiment ? (
                    <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[9px] font-medium text-emerald-400 border border-emerald-500/20">
                      <Heart className="h-2 w-2 fill-current" /> Good Sentiment
                    </span>
                  ) : isBadSentiment ? (
                    <span className="inline-flex items-center gap-0.5 rounded-full bg-rose-500/10 px-2 py-0.5 text-[9px] font-medium text-rose-400 border border-rose-500/20">
                      <Frown className="h-2 w-2 fill-current" /> Crisis Triggered
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-500/10 px-2 py-0.5 text-[9px] font-medium text-amber-400 border border-amber-500/20">
                      Passive Rating
                    </span>
                  )}
                </span>
              </div>
            )}
            {isSubmitted && (
              <button
                onClick={handleReset}
                className="w-full mt-2 rounded-lg bg-indigo-600/10 border border-indigo-500/20 hover:bg-indigo-600/20 text-indigo-400 px-3 py-1.5 text-xs font-semibold transition"
              >
                Reset Simulator Flow
              </button>
            )}
          </div>
        </div>
      </div>

      {/* RIGHT: High-fidelity Visual Smartphone Simulator */}
      <div className="lg:col-span-7 flex justify-center">
        <div className="relative mx-auto w-full max-w-[370px]">
          {/* Phone Speaker & Camera Notch */}
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 h-5 w-40 bg-slate-950 rounded-b-2xl z-30 flex items-center justify-center border-b border-x border-slate-800">
            <div className="h-1.5 w-16 bg-slate-850 rounded-full mb-1"></div>
            <div className="absolute right-4 top-1.5 h-2 w-2 bg-slate-900 rounded-full"></div>
          </div>

          {/* Smartphone Frame Outer Shell */}
          <div className="relative rounded-[45px] border-4 border-slate-800 bg-slate-950 shadow-2xl p-2.5 transition duration-300 ring-8 ring-slate-900/60 overflow-hidden">
            {/* Phone Screen Container */}
            <div className="relative w-full aspect-[9/19.5] rounded-[36px] bg-slate-900 overflow-y-auto scrollbar-thin select-none flex flex-col">
              {/* StatusBar Mock */}
              <div className="h-10 bg-slate-950 w-full flex items-center justify-between px-6 pt-1 text-[10px] text-slate-400 font-mono z-20 shrink-0">
                <span>9:41 AM</span>
                <div className="flex items-center gap-1.5">
                  <span>5G</span>
                  <div className="w-5 h-2.5 border border-slate-400 rounded-sm p-0.5 flex items-center">
                    <div className="bg-slate-400 h-full w-3.5"></div>
                  </div>
                </div>
              </div>

              {/* Main Phone Content Body */}
              <div className="flex-1 p-5 space-y-6 pb-12 flex flex-col justify-between">
                {!isSubmitted ? (
                  <form onSubmit={handleFormSubmit} className="space-y-6 flex-1 flex flex-col justify-between">
                    {/* Header: Logo & Greeting */}
                    <div className="space-y-4 shrink-0">
                      <div className="flex flex-col items-center text-center mt-2 space-y-2">
                        {branding.logoUrl ? (
                          <img
                            src={branding.logoUrl}
                            alt="Logo"
                            className="h-12 w-12 rounded-xl object-contain bg-slate-950 border border-slate-800 p-1"
                          />
                        ) : (
                          <div className="h-12 w-12 rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center">
                            <Sparkles className="h-6 w-6 text-indigo-400" />
                          </div>
                        )}
                        <h3 className="text-sm font-bold text-white tracking-tight">
                          {branding.businessName}
                        </h3>
                      </div>

                      {survey.greetingText && (
                        <div className="rounded-2xl bg-slate-950/60 border border-slate-850 p-4 text-center">
                          <p className="text-xs text-slate-200 leading-relaxed font-medium">
                            {survey.greetingText}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Interactive Blocks list */}
                    <div className="space-y-5 flex-1 mt-4">
                      {survey.blocks.map((block, idx) => {
                        const question = block.questions[0];
                        if (!question) return null;

                        return (
                          <div
                            key={idx}
                            className="rounded-2xl border border-slate-850 bg-slate-950/40 p-4 space-y-3.5 animate-in fade-in slide-in-from-bottom-2 duration-300"
                          >
                            <div className="space-y-1">
                              <span className="text-[9px] font-bold tracking-wider text-indigo-400 uppercase">
                                {block.title || `Part ${idx + 1}`}
                              </span>
                              <h4 className="text-xs font-semibold text-white leading-snug">
                                {question.questionText}
                                {question.isRequired && (
                                  <span className="text-rose-500 ml-0.5">*</span>
                                )}
                              </h4>
                            </div>

                            {/* Render Rating Type: Star Rating 1-5 */}
                            {question.questionType === 'RATING' && (
                              <div className="flex justify-center gap-2.5 py-1">
                                {[1, 2, 3, 4, 5].map((star) => {
                                  const isSelected = answers[question.id || idx.toString()] === star;
                                  return (
                                    <button
                                      key={star}
                                      type="button"
                                      onClick={() => handleRatingClick(question.id || idx.toString(), star)}
                                      className={`h-9 w-9 rounded-xl border flex items-center justify-center text-sm font-bold transition duration-200 ${
                                        isSelected
                                          ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/20 scale-105'
                                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-indigo-500/50 hover:text-white'
                                      }`}
                                    >
                                      {star}
                                    </button>
                                  );
                                })}
                              </div>
                            )}

                            {/* Render NPS Score: 0-10 */}
                            {question.questionType === 'NPS' && (
                              <div className="space-y-2">
                                <div className="grid grid-cols-6 gap-1.5 justify-center py-1">
                                  {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => {
                                    const isSelected = answers[question.id || idx.toString()] === score;
                                    let activeColorClass = 'bg-indigo-600 border-indigo-500 text-white';
                                    if (score <= 6) activeColorClass = 'bg-rose-600 border-rose-500 text-white';
                                    else if (score <= 8) activeColorClass = 'bg-amber-600 border-amber-500 text-white';
                                    else activeColorClass = 'bg-emerald-600 border-emerald-500 text-white';

                                    return (
                                      <button
                                        key={score}
                                        type="button"
                                        onClick={() => handleRatingClick(question.id || idx.toString(), score)}
                                        className={`h-7 w-7 rounded-lg border flex items-center justify-center text-[10px] font-bold transition duration-200 ${
                                          isSelected
                                            ? activeColorClass + ' scale-105 shadow-md'
                                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-650'
                                        }`}
                                      >
                                        {score}
                                      </button>
                                    );
                                  })}
                                </div>
                                <div className="flex justify-between text-[9px] text-slate-500 px-1 font-semibold">
                                  <span>Not Likely</span>
                                  <span>Highly Likely</span>
                                </div>
                              </div>
                            )}

                            {/* Render Choices (Single) */}
                            {question.questionType === 'SINGLE_CHOICE' && (
                              <div className="space-y-2">
                                {question.options.map((opt, oIdx) => {
                                  const isSelected = answers[question.id || idx.toString()] === opt.optionText;
                                  return (
                                    <button
                                      key={oIdx}
                                      type="button"
                                      onClick={() => handleChoiceClick(question.id || idx.toString(), opt.optionText, false)}
                                      className={`w-full text-left rounded-xl border px-3.5 py-2.5 text-xs transition flex items-center justify-between ${
                                        isSelected
                                          ? 'bg-indigo-600/10 border-indigo-500/40 text-indigo-300'
                                          : 'bg-slate-950 border-slate-850 text-slate-400 hover:border-slate-700'
                                      }`}
                                    >
                                      <span>{opt.optionText}</span>
                                      <span className={`h-4 w-4 rounded-full border flex items-center justify-center ${
                                        isSelected ? 'border-indigo-400 bg-indigo-500' : 'border-slate-750 bg-slate-900'
                                      }`}>
                                        {isSelected && <span className="h-1.5 w-1.5 rounded-full bg-white"></span>}
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>
                            )}

                            {/* Render Choices (Multiple) */}
                            {question.questionType === 'MULTIPLE_CHOICE' && (
                              <div className="space-y-2">
                                {question.options.map((opt, oIdx) => {
                                  const selectedList = answers[question.id || idx.toString()] || [];
                                  const isSelected = selectedList.includes(opt.optionText);
                                  return (
                                    <button
                                      key={oIdx}
                                      type="button"
                                      onClick={() => handleChoiceClick(question.id || idx.toString(), opt.optionText, true)}
                                      className={`w-full text-left rounded-xl border px-3.5 py-2.5 text-xs transition flex items-center justify-between ${
                                        isSelected
                                          ? 'bg-indigo-600/10 border-indigo-500/40 text-indigo-300'
                                          : 'bg-slate-950 border-slate-850 text-slate-400 hover:border-slate-700'
                                      }`}
                                    >
                                      <span>{opt.optionText}</span>
                                      <span className={`h-4 w-4 rounded border flex items-center justify-center ${
                                        isSelected ? 'border-indigo-400 bg-indigo-500' : 'border-slate-750 bg-slate-900'
                                      }`}>
                                        {isSelected && <div className="h-1 w-1.5 border-b-2 border-r-2 border-white rotate-45 transform -translate-y-0.5"></div>}
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>
                            )}

                            {/* Render Open Text Area */}
                            {question.questionType === 'OPEN_TEXT' && (
                              <textarea
                                value={answers[question.id || idx.toString()] || ''}
                                onChange={(e) => handleTextChange(question.id || idx.toString(), e.target.value)}
                                placeholder="Type your honest review here..."
                                rows={3}
                                className="w-full rounded-xl border border-slate-850 bg-slate-950 px-3 py-2.5 text-xs text-white placeholder-slate-650 focus:border-indigo-500 focus:outline-none transition resize-none"
                              />
                            )}

                            {/* Render Contact Info (Name, Email, Phone) */}
                            {question.questionType === 'CONTACT_INFO' && (
                              <div className="space-y-2.5">
                                <div className="relative">
                                  <input
                                    type="text"
                                    placeholder="Your Full Name"
                                    value={answers[question.id || idx.toString()]?.name || ''}
                                    onChange={(e) => handleContactChange(question.id || idx.toString(), 'name', e.target.value)}
                                    className="w-full rounded-xl border border-slate-850 bg-slate-950 pl-8 pr-3 py-2 text-[11px] text-white placeholder-slate-650 focus:border-indigo-500 focus:outline-none transition"
                                  />
                                  <User className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-600" />
                                </div>

                                <div className="relative">
                                  <input
                                    type="email"
                                    placeholder="Your Email Address"
                                    value={answers[question.id || idx.toString()]?.email || ''}
                                    onChange={(e) => handleContactChange(question.id || idx.toString(), 'email', e.target.value)}
                                    className="w-full rounded-xl border border-slate-850 bg-slate-950 pl-8 pr-3 py-2 text-[11px] text-white placeholder-slate-650 focus:border-indigo-500 focus:outline-none transition"
                                  />
                                  <Mail className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-600" />
                                </div>

                                <div className="relative">
                                  <input
                                    type="tel"
                                    placeholder="Your Phone Number"
                                    value={answers[question.id || idx.toString()]?.phone || ''}
                                    onChange={(e) => handleContactChange(question.id || idx.toString(), 'phone', e.target.value)}
                                    className="w-full rounded-xl border border-slate-850 bg-slate-950 pl-8 pr-3 py-2 text-[11px] text-white placeholder-slate-650 focus:border-indigo-500 focus:outline-none transition"
                                  />
                                  <Phone className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-600" />
                                </div>
                              </div>
                            )}

                            {/* Render File Upload */}
                            {question.questionType === 'FILE_UPLOAD' && (
                              <div className="rounded-xl border border-dashed border-slate-800 bg-slate-950/80 p-4 text-center space-y-1.5">
                                <div className="h-7 w-7 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto">
                                  <Share2 className="h-3.5 w-3.5 text-slate-400" />
                                </div>
                                <div className="text-[10px] font-semibold text-slate-400">
                                  Attach Receipt or File
                                </div>
                                <div className="text-[8px] text-slate-600">
                                  PDF, PNG, JPG up to 10MB
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white py-3 text-xs font-semibold shadow-lg shadow-indigo-500/20 transition mt-6 shrink-0"
                    >
                      Submit Feedback
                    </button>
                  </form>
                ) : (
                  /* SIMULATION RESULT DISPLAY PAGE */
                  <div className="flex-1 flex flex-col justify-between h-full animate-in fade-in zoom-in-95 duration-350">
                    <div className="space-y-6 my-auto text-center">
                      {isGoodSentiment ? (
                        /* GOOD RATING: PROMOTIONAL FLOW */
                        <div className="space-y-5">
                          <div className="h-16 w-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/5">
                            <CheckCircle className="h-8 w-8 text-emerald-400" />
                          </div>

                          <div className="space-y-2">
                            <h3 className="text-base font-bold text-white">
                              Awesome! Thank you so much!
                            </h3>
                            <p className="text-xs text-slate-400 px-2 leading-relaxed">
                              We are absolutely thrilled that you had a wonderful experience with us today. Your positive feedback keeps us going!
                            </p>
                          </div>

                          {/* Promotional Photo Enforced based on Premium Plan */}
                          {branding.allowPromotionPhoto && branding.promotionPhotoUrl ? (
                            <div className="rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 p-2.5 space-y-2">
                              <img
                                src={branding.promotionPhotoUrl}
                                alt="Promo Offer"
                                className="w-full aspect-[16/10] object-cover rounded-xl border border-slate-900"
                              />
                              <div className="px-1 text-left space-y-0.5">
                                <span className="text-[8px] font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-1">
                                  <Megaphone className="h-3 w-3" /> Exclusive Promotion Offer
                                </span>
                                <h4 className="text-[10px] font-bold text-white">
                                  Unlock 10% Off Your Next Visit!
                                </h4>
                                <p className="text-[9px] text-slate-500 leading-snug">
                                  Present this screen to our cashier or staff member during checkout to claim your customer appreciation discount.
                                </p>
                              </div>
                            </div>
                          ) : (
                            <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-950/50 p-5 space-y-1">
                              <ThumbsUp className="h-6 w-6 text-indigo-400 mx-auto" />
                              <div className="text-[10px] font-semibold text-slate-300">
                                Share the love on Google Maps!
                              </div>
                              <p className="text-[9px] text-slate-500">
                                It takes only 10 seconds and helps our small business grow!
                              </p>
                            </div>
                          )}
                        </div>
                      ) : isBadSentiment ? (
                        /* BAD RATING: CRISIS RESPONSE RECOVERY FORM */
                        <div className="space-y-5">
                          <div className="h-16 w-16 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto shadow-xl shadow-rose-500/5">
                            <AlertCircle className="h-8 w-8 text-rose-455" />
                          </div>

                          <div className="space-y-2">
                            <h3 className="text-base font-bold text-white">
                              We are deeply sorry!
                            </h3>
                            <p className="text-xs text-slate-400 px-1 leading-relaxed">
                              Your experience today was not up to our standards. We strive to provide the best service, and we want to make it right.
                            </p>
                          </div>

                          <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4 text-left space-y-3">
                            <span className="text-[8px] font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1">
                              <Frown className="h-3 w-3 fill-current" /> Manager Recovery Request
                            </span>
                            <p className="text-[9px] text-slate-500 leading-snug">
                              To help us improve and reach out directly to resolve this, please leave your contact info below. Our branch owner will contact you personally within 24 hours.
                            </p>
                            <div className="space-y-2">
                              <input
                                type="text"
                                placeholder="Contact Name"
                                className="w-full rounded-lg border border-slate-850 bg-slate-900 px-2.5 py-1.5 text-[10px] text-white focus:outline-none"
                              />
                              <input
                                type="tel"
                                placeholder="Phone Number"
                                className="w-full rounded-lg border border-slate-850 bg-slate-900 px-2.5 py-1.5 text-[10px] text-white focus:outline-none"
                              />
                            </div>
                          </div>
                        </div>
                      ) : (
                        /* NEUTRAL RATING: STANDARD THANK YOU */
                        <div className="space-y-4">
                          <div className="h-16 w-16 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto">
                            <MessageSquare className="h-7 w-7 text-indigo-400" />
                          </div>

                          <div className="space-y-1">
                            <h3 className="text-base font-bold text-white">
                              Thank you for your feedback!
                            </h3>
                            <p className="text-xs text-slate-400 leading-relaxed">
                              Your comments have been captured and will be analyzed by our operational staff to make our customer services even better.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-3 mt-8 shrink-0">
                      <button
                        onClick={handleReset}
                        className="w-full rounded-xl bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-300 py-3 text-xs font-semibold transition"
                      >
                        Try Again
                      </button>
                      <div className="text-[8px] text-slate-600 text-center font-mono uppercase tracking-widest">
                        End of Flow Simulator
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Home Indicator Mock */}
              <div className="h-4 bg-slate-950 w-full flex justify-center items-center pb-2 shrink-0">
                <div className="h-1 w-28 bg-slate-800 rounded-full"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
