'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  Heart,
  Frown,
  CheckCircle,
  ThumbsUp,
  MessageSquare,
  User,
  Mail,
  Phone,
  Share2,
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

interface PublicSurveyViewProps {
  survey: SurveyData;
  branding: TenantBranding;
}

export default function PublicSurveyView({ survey, branding }: PublicSurveyViewProps) {
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitRating, setSubmitRating] = useState<number | null>(null);

  const handleRatingClick = (questionId: string, val: number) => {
    setAnswers((prev) => ({ ...prev, [questionId]: val }));
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

  const isGoodSentiment = submitRating !== null && submitRating >= survey.goodThreshold;
  const isBadSentiment = submitRating !== null && submitRating <= survey.badThreshold;

  if (survey.status === 'LOCKED') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full rounded-3xl border border-slate-800 bg-slate-900/30 p-8 backdrop-blur-md text-center space-y-4">
          <div className="h-14 w-14 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto">
            <AlertCircle className="h-7 w-7 text-rose-400" />
          </div>
          <h2 className="text-xl font-bold text-white">Survey is Inactive</h2>
          <p className="text-sm text-slate-455">
            This customer feedback sheet has been closed or locked by {branding.businessName}. Please contact support or visit again later.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="max-w-xl w-full space-y-6">
        
        {/* Main Card */}
        <div className="rounded-3xl border border-slate-800/80 bg-slate-900/20 p-6 sm:p-8 shadow-2xl backdrop-blur-xl transition duration-300">
          
          {!isSubmitted ? (
            <form onSubmit={handleFormSubmit} className="space-y-6">
              {/* Header section with brand logo & greeting */}
              <div className="flex flex-col items-center text-center space-y-4 border-b border-slate-800/60 pb-6">
                {branding.logoUrl ? (
                  <img
                    src={branding.logoUrl}
                    alt={branding.businessName}
                    className="h-16 w-16 rounded-2xl object-contain bg-slate-950 border border-slate-800 p-1.5 shadow-md"
                  />
                ) : (
                  <div className="h-16 w-16 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center shadow-md">
                    <Sparkles className="h-8 w-8 text-indigo-400" />
                  </div>
                )}
                
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-400">
                    Welcome to
                  </span>
                  <h1 className="text-xl font-extrabold text-white sm:text-2xl">
                    {branding.businessName}
                  </h1>
                </div>

                {survey.greetingText && (
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium bg-slate-950/40 border border-slate-850 rounded-2xl px-4 py-3 max-w-md">
                    {survey.greetingText}
                  </p>
                )}
              </div>

              {/* Dynamic Questions Blocks */}
              <div className="space-y-6">
                {survey.blocks.map((block, idx) => {
                  const question = block.questions[0];
                  if (!question) return null;

                  return (
                    <div
                      key={idx}
                      className="rounded-2xl border border-slate-800/50 bg-slate-950/40 p-5 space-y-4 shadow-sm"
                    >
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-bold tracking-wider text-indigo-400 uppercase">
                          {block.title || `Part ${idx + 1}`}
                        </span>
                        <h2 className="text-sm sm:text-base font-semibold text-white leading-snug">
                          {question.questionText}
                          {question.isRequired && (
                            <span className="text-rose-500 ml-0.5">*</span>
                          )}
                        </h2>
                      </div>

                      {/* CSAT / CES: Star Ratings */}
                      {question.questionType === 'RATING' && (
                        <div className="flex justify-center gap-3 sm:gap-4 py-2">
                          {[1, 2, 3, 4, 5].map((star) => {
                            const isSelected = answers[question.id || idx.toString()] === star;
                            return (
                              <button
                                key={star}
                                type="button"
                                onClick={() => handleRatingClick(question.id || idx.toString(), star)}
                                className={`h-11 w-11 sm:h-12 sm:w-12 rounded-2xl border flex items-center justify-center text-sm sm:text-base font-extrabold transition duration-200 ${
                                  isSelected
                                    ? 'bg-indigo-600 border-indigo-500 text-white shadow-xl shadow-indigo-500/20 scale-105'
                                    : 'bg-slate-950 border-slate-850 text-slate-400 hover:border-indigo-500/50 hover:text-white'
                                }`}
                              >
                                {star}
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {/* NPS Score: 0-10 */}
                      {question.questionType === 'NPS' && (
                        <div className="space-y-3">
                          <div className="grid grid-cols-6 sm:grid-cols-11 gap-1.5 justify-center py-2">
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
                                  className={`h-9 w-9 sm:h-10 sm:w-10 rounded-xl border flex items-center justify-center text-xs font-bold transition duration-200 ${
                                    isSelected
                                      ? activeColorClass + ' scale-105 shadow-lg'
                                      : 'bg-slate-950 border-slate-850 text-slate-400 hover:border-slate-650'
                                  }`}
                                >
                                  {score}
                                </button>
                              );
                            })}
                          </div>
                          <div className="flex justify-between text-[10px] text-slate-500 px-1 font-semibold">
                            <span>Not Likely</span>
                            <span>Highly Likely</span>
                          </div>
                        </div>
                      )}

                      {/* Single Choice Selection */}
                      {question.questionType === 'SINGLE_CHOICE' && (
                        <div className="grid grid-cols-1 gap-2.5">
                          {question.options.map((opt, oIdx) => {
                            const isSelected = answers[question.id || idx.toString()] === opt.optionText;
                            return (
                              <button
                                key={oIdx}
                                type="button"
                                onClick={() => handleChoiceClick(question.id || idx.toString(), opt.optionText, false)}
                                className={`w-full text-left rounded-xl border px-4 py-3 text-xs sm:text-sm transition flex items-center justify-between ${
                                  isSelected
                                    ? 'bg-indigo-600/10 border-indigo-500/40 text-indigo-300'
                                    : 'bg-slate-950 border-slate-850 text-slate-400 hover:border-slate-700'
                                }`}
                              >
                                <span>{opt.optionText}</span>
                                <span className={`h-4.5 w-4.5 rounded-full border flex items-center justify-center ${
                                  isSelected ? 'border-indigo-400 bg-indigo-500' : 'border-slate-750 bg-slate-900'
                                }`}>
                                  {isSelected && <span className="h-2 w-2 rounded-full bg-white"></span>}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {/* Multiple Choice Selection */}
                      {question.questionType === 'MULTIPLE_CHOICE' && (
                        <div className="grid grid-cols-1 gap-2.5">
                          {question.options.map((opt, oIdx) => {
                            const selectedList = answers[question.id || idx.toString()] || [];
                            const isSelected = selectedList.includes(opt.optionText);
                            return (
                              <button
                                key={oIdx}
                                type="button"
                                onClick={() => handleChoiceClick(question.id || idx.toString(), opt.optionText, true)}
                                className={`w-full text-left rounded-xl border px-4 py-3 text-xs sm:text-sm transition flex items-center justify-between ${
                                  isSelected
                                    ? 'bg-indigo-600/10 border-indigo-500/40 text-indigo-300'
                                    : 'bg-slate-950 border-slate-850 text-slate-400 hover:border-slate-700'
                                }`}
                              >
                                <span>{opt.optionText}</span>
                                <span className={`h-4.5 w-4.5 rounded border flex items-center justify-center ${
                                  isSelected ? 'border-indigo-400 bg-indigo-500' : 'border-slate-750 bg-slate-900'
                                }`}>
                                  {isSelected && <div className="h-1 w-2 border-b-2 border-r-2 border-white rotate-45 transform -translate-y-0.5"></div>}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {/* Open Text Area */}
                      {question.questionType === 'OPEN_TEXT' && (
                        <textarea
                          value={answers[question.id || idx.toString()] || ''}
                          onChange={(e) => handleTextChange(question.id || idx.toString(), e.target.value)}
                          placeholder="Please let us know your suggestions..."
                          rows={4}
                          className="w-full rounded-2xl border border-slate-850 bg-slate-950 px-4 py-3 text-xs sm:text-sm text-white placeholder-slate-650 focus:border-indigo-500 focus:outline-none transition resize-none"
                        />
                      )}

                      {/* Contact Info Form fields */}
                      {question.questionType === 'CONTACT_INFO' && (
                        <div className="space-y-3">
                          <div className="relative">
                            <input
                              type="text"
                              placeholder="Full Name"
                              value={answers[question.id || idx.toString()]?.name || ''}
                              onChange={(e) => handleContactChange(question.id || idx.toString(), 'name', e.target.value)}
                              className="w-full rounded-xl border border-slate-850 bg-slate-950 pl-10 pr-3 py-2.5 text-xs sm:text-sm text-white placeholder-slate-650 focus:border-indigo-500 focus:outline-none transition"
                            />
                            <User className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-600" />
                          </div>

                          <div className="relative">
                            <input
                              type="email"
                              placeholder="Email Address"
                              value={answers[question.id || idx.toString()]?.email || ''}
                              onChange={(e) => handleContactChange(question.id || idx.toString(), 'email', e.target.value)}
                              className="w-full rounded-xl border border-slate-850 bg-slate-950 pl-10 pr-3 py-2.5 text-xs sm:text-sm text-white placeholder-slate-650 focus:border-indigo-500 focus:outline-none transition"
                            />
                            <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-600" />
                          </div>

                          <div className="relative">
                            <input
                              type="tel"
                              placeholder="Phone Number"
                              value={answers[question.id || idx.toString()]?.phone || ''}
                              onChange={(e) => handleContactChange(question.id || idx.toString(), 'phone', e.target.value)}
                              className="w-full rounded-xl border border-slate-850 bg-slate-950 pl-10 pr-3 py-2.5 text-xs sm:text-sm text-white placeholder-slate-650 focus:border-indigo-500 focus:outline-none transition"
                            />
                            <Phone className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-600" />
                          </div>
                        </div>
                      )}

                      {/* File Upload */}
                      {question.questionType === 'FILE_UPLOAD' && (
                        <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-950/80 p-6 text-center space-y-2">
                          <div className="h-9 w-9 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto">
                            <Share2 className="h-4 w-4 text-slate-400" />
                          </div>
                          <div className="text-xs font-semibold text-slate-300">
                            Upload Receipt attachment
                          </div>
                          <div className="text-[10px] text-slate-600">
                            PDF, PNG, JPG up to 10MB
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Submit Buttons */}
              <button
                type="submit"
                className="w-full rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white py-3.5 text-xs sm:text-sm font-semibold shadow-xl shadow-indigo-500/25 transition mt-6"
              >
                Submit Feedback Sheet
              </button>
            </form>
          ) : (
            /* CONDITIONAL SIMULATION OUTCOME CARD */
            <div className="space-y-6 text-center py-6 animate-in fade-in zoom-in-95 duration-300">
              {isGoodSentiment ? (
                /* GOOD Sentiment promotional unlock */
                <div className="space-y-6">
                  <div className="h-16 w-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto shadow-2xl">
                    <CheckCircle className="h-9 w-9 text-emerald-400" />
                  </div>

                  <div className="space-y-2">
                    <h2 className="text-xl sm:text-2xl font-black text-white">
                      Thank you for the awesome feedback!
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
                      We strive to provide outstanding services, and we are absolutely thrilled to know you had an amazing experience with us today.
                    </p>
                  </div>

                  {branding.allowPromotionPhoto && branding.promotionPhotoUrl ? (
                    <div className="rounded-3xl overflow-hidden border border-slate-800 bg-slate-950 p-4 space-y-3.5 max-w-md mx-auto text-left shadow-lg">
                      <img
                        src={branding.promotionPhotoUrl}
                        alt="Claim Promo"
                        className="w-full aspect-[16/10] object-cover rounded-2xl border border-slate-900"
                      />
                      <div className="px-1.5 space-y-1">
                        <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-1.5">
                          <Megaphone className="h-3.5 w-3.5" /> Special Thank You Discount
                        </span>
                        <h3 className="text-xs sm:text-sm font-extrabold text-white">
                          Unlock 10% Off Your Next Meal or Service!
                        </h3>
                        <p className="text-[10px] text-slate-500 leading-relaxed">
                          Show this coupon code to our cashiers on your next visit to claim. Thank you for being a valued customer!
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-950/60 p-6 max-w-sm mx-auto space-y-1.5">
                      <ThumbsUp className="h-7 w-7 text-indigo-400 mx-auto" />
                      <div className="text-xs font-bold text-slate-300">
                        Help us grow!
                      </div>
                      <p className="text-[10px] text-slate-500">
                        Please take 10 seconds to share your experience on our Google Maps profile!
                      </p>
                    </div>
                  )}
                </div>
              ) : isBadSentiment ? (
                /* BAD Sentiment Crisis Recovery form */
                <div className="space-y-6">
                  <div className="h-16 w-16 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto shadow-2xl">
                    <AlertCircle className="h-9 w-9 text-rose-455" />
                  </div>

                  <div className="space-y-2">
                    <h2 className="text-xl sm:text-2xl font-black text-white">
                      We apologize sincerely.
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
                      Your satisfaction is our absolute priority, and we regret failing to meet your standards. We would love to make this up to you.
                    </p>
                  </div>

                  <div className="rounded-3xl border border-slate-850 bg-slate-950/80 p-5 text-left space-y-4 max-w-md mx-auto shadow-lg">
                    <div className="space-y-1">
                      <span className="text-[9px] font-bold text-rose-400 uppercase tracking-widest flex items-center gap-1.5">
                        <Frown className="h-3.5 w-3.5 fill-current" /> Direct Manager Escalation
                      </span>
                      <h3 className="text-xs font-semibold text-slate-300">
                        Request a personal call-back
                      </h3>
                      <p className="text-[10px] text-slate-550 leading-relaxed">
                        Leave your contacts below. Our operations manager will reach out personally within 24 hours to address your experience.
                      </p>
                    </div>

                    <div className="space-y-2.5">
                      <input
                        type="text"
                        placeholder="Your name"
                        className="w-full rounded-xl border border-slate-850 bg-slate-900 px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none"
                      />
                      <input
                        type="tel"
                        placeholder="Contact phone"
                        className="w-full rounded-xl border border-slate-850 bg-slate-900 px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                /* Neutral Standard Feedback Gratefulness card */
                <div className="space-y-5">
                  <div className="h-16 w-16 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto">
                    <MessageSquare className="h-8 w-8 text-indigo-400" />
                  </div>

                  <div className="space-y-1">
                    <h2 className="text-xl sm:text-2xl font-black text-white">
                      Thank you for your valuable feedback!
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
                      We appreciate your honest opinion. Your review has been forwarded to our customer relations teams to help improve our services.
                    </p>
                  </div>
                </div>
              )}

              <div className="pt-6 border-t border-slate-850/80 max-w-md mx-auto space-y-4">
                <button
                  onClick={handleReset}
                  className="w-full rounded-2xl bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-300 py-3 text-xs sm:text-sm font-semibold transition"
                >
                  Restart Feedback Form
                </button>
                
                <div className="text-[9px] text-slate-600 uppercase tracking-widest font-semibold">
                  Demo Powered by FeedbackCRM
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer Brand Logo */}
        <div className="text-center text-[10px] text-slate-600 font-semibold tracking-wider uppercase">
          &copy; {new Date().getFullYear()} {branding.businessName} &bull; All Rights Reserved.
        </div>
      </div>
    </div>
  );
}
