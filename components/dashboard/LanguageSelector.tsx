'use client';

import React, { useState, useEffect } from 'react';
import { Globe, ChevronDown, Check } from 'lucide-react';

const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'vi', name: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'zh-CN', name: 'Tiếng Trung (中文)', flag: '🇨🇳' },
];

export default function LanguageSelector() {
  const [currentLang, setCurrentLang] = useState('en');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  // Initialize Google Translate
  useEffect(() => {
    // 1. Add global styling to hide Google Translate's default UI elements
    const style = document.createElement('style');
    style.innerHTML = `
      /* Hide Google Translate Top Bar */
      .skiptranslate, .goog-te-banner-frame, #goog-gt-tt, .goog-te-balloon-frame {
        display: none !important;
      }
      body {
        top: 0px !important;
      }
      /* Hide Google Translate original text tooltips on hover */
      .goog-text-highlight {
        background-color: transparent !important;
        box-shadow: none !important;
        box-sizing: border-box !important;
      }
    `;
    document.head.appendChild(style);

    // 2. Define translation callback
    (window as any).googleTranslateElementInit = () => {
      new (window as any).google.translate.TranslateElement(
        {
          pageLanguage: 'en',
          includedLanguages: 'en,vi,zh-CN',
          layout: (window as any).google.translate.TranslateElement.InlineLayout.SIMPLE,
          autoDisplay: false,
        },
        'google_translate_element'
      );
      setScriptLoaded(true);
    };

    // 3. Inject Google Translate script if not present
    if (!document.getElementById('google-translate-script')) {
      const script = document.createElement('script');
      script.id = 'google-translate-script';
      script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      script.async = true;
      document.body.appendChild(script);
    } else {
      setScriptLoaded(true);
    }

    // 4. Retrieve saved language choice from cookies if preset
    const getCookie = (name: string) => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop()?.split(';').shift();
      return null;
    };

    const transCookie = getCookie('googtrans');
    if (transCookie) {
      const lang = transCookie.split('/').pop();
      if (lang && LANGUAGES.some(l => l.code === lang)) {
        setCurrentLang(lang);
      }
    }
  }, []);

  const handleLanguageChange = (langCode: string) => {
    setCurrentLang(langCode);
    setDropdownOpen(false);

    // Set standard Google translation cookies for cross-route memory
    const domain = window.location.hostname;
    const cookieString = `googtrans=/en/${langCode}; path=/; domain=${domain};`;
    const cookieStringNoDomain = `googtrans=/en/${langCode}; path=/;`;
    
    document.cookie = cookieString;
    document.cookie = cookieStringNoDomain;

    // Polling lookup for .goog-te-combo to prevent slow page reloads!
    let attempts = 0;
    const interval = setInterval(() => {
      const googleSelect = document.querySelector('.goog-te-combo') as HTMLSelectElement;
      if (googleSelect) {
        googleSelect.value = langCode;
        googleSelect.dispatchEvent(new Event('change'));
        clearInterval(interval);
      } else {
        attempts++;
        if (attempts >= 20) { // Max 2 seconds
          clearInterval(interval);
          // Safe fallback if scripts are blocked by firewalls or extensions
          window.location.reload();
        }
      }
    }, 100);
  };

  const getLanguageName = (code: string) => {
    return LANGUAGES.find((l) => l.code === code) || LANGUAGES[0];
  };

  const activeLang = getLanguageName(currentLang);

  return (
    <div className="relative">
      {/* Hidden container required by Google Translate SDK */}
      <div id="google_translate_element" className="hidden pointer-events-none opacity-0 h-0 w-0" />

      <button
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/40 px-3 py-2 text-xs text-slate-300 font-semibold transition-all duration-200 ease-out hover:bg-slate-800 hover:border-slate-700 hover:text-white"
        title="Translate Website"
      >
        <Globe className="h-4 w-4 text-indigo-400 animate-pulse" />
        <span className="hidden sm:inline">
          {activeLang.flag} {activeLang.name}
        </span>
        <ChevronDown className={`h-3 w-3 text-slate-500 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
      </button>

      {dropdownOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(false)} />
          <div className="absolute right-0 mt-2 w-48 origin-top-right rounded-xl border border-slate-800 bg-slate-900 p-1.5 shadow-2xl ring-1 ring-black/5 z-20 transition-all duration-200 ease-out transform scale-100 opacity-100 animate-in fade-in slide-in-from-top-2">
            <div className="px-2.5 py-1.5 border-b border-slate-850 text-[10px] uppercase font-bold tracking-wider text-slate-500">
              Select Language
            </div>
            <div className="py-1 space-y-0.5">
              {LANGUAGES.map((lang) => {
                const isActive = currentLang === lang.code;
                return (
                  <button
                    key={lang.code}
                    onClick={() => handleLanguageChange(lang.code)}
                    className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs font-semibold transition-all duration-150 ${
                      isActive
                        ? 'bg-indigo-600/15 text-indigo-300'
                        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span>{lang.flag}</span>
                      <span>{lang.name}</span>
                    </div>
                    {isActive && <Check className="h-3.5 w-3.5 text-indigo-400" />}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
