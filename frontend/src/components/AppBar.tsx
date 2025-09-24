// src/components/AppBar.tsx
import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, HelpCircle, User } from 'lucide-react';

interface AppBarProps {
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
}

export default function AppBar({ title, showBack = false, onBack }: AppBarProps) {
  const location = useLocation();
  const navigate = useNavigate();

  // -------- Google Translate init (unchanged) --------
  useEffect(() => {
    const initGoogleTranslate = () => {
      if ((window as any).google && (window as any).google.translate) {
        new (window as any).google.translate.TranslateElement(
          {
            pageLanguage: 'en',
            includedLanguages: 'en,hi,bn,ta,te,gu,kn,ml,mr,pa,ur,as,or',
            layout: (window as any).google.translate.TranslateElement.InlineLayout.SIMPLE,
            autoDisplay: false,
            multilanguagePage: true
          },
          'google_translate_element'
        );
      }
    };

    (window as any).googleTranslateElementInit = initGoogleTranslate;

    if ((window as any).google && (window as any).google.translate) {
      initGoogleTranslate();
    } else {
      const checkGoogleTranslate = setInterval(() => {
        if ((window as any).google && (window as any).google.translate) {
          clearInterval(checkGoogleTranslate);
          initGoogleTranslate();
        }
      }, 100);
      setTimeout(() => clearInterval(checkGoogleTranslate), 10000);
    }
  }, []);
  // ---------------------------------------------------

  const getTitle = () => {
    if (title) return title;
    switch (location.pathname) {
      case '/': return 'Udaan';
      case '/profile': return 'Your Profile';
      case '/results':
      case '/result': return 'Udaan';
      case '/feedback': return 'Feedback';
      case '/about': return 'About Udaan';
      default: 
        if (location.pathname.startsWith('/internship/')) return 'Internship Details';
        return 'Udaan';
    }
  };

  const currentTitle = getTitle();

  // -------- Route-based UI logic --------
  const path = location.pathname.toLowerCase();
  const hasToken = !!localStorage.getItem('token');
  const showProfileMenu =
    hasToken ||
    path === '/profile' ||
    path === '/results' ||
    path === '/result' ||
    path.startsWith('/profile/'); // covers nested profile routes if you add later

  // -------- Profile dropdown --------
  const [menuOpen, setMenuOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const handleLogout = () => {
    localStorage.removeItem('udaan_username');
    localStorage.removeItem('udaan_profile_draft');
    localStorage.removeItem('udaan_profile_complete');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setMenuOpen(false);
    navigate('/', { replace: true });
  };

  // Close dropdown on outside click / Esc
  useEffect(() => {
    if (!menuOpen) return;
    const onClick = (e: MouseEvent) => {
      const t = e.target as Node;
      if (menuRef.current && !menuRef.current.contains(t) && btnRef.current && !btnRef.current.contains(t)) {
        setMenuOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  // -------- Language dropdown (Google Translate control) --------
  const LANGUAGE_OPTIONS: { code: string; label: string }[] = [
    { code: 'en', label: 'English' },
    { code: 'hi', label: 'हिन्दी' },
    { code: 'bn', label: 'বাংলা' },
    { code: 'ta', label: 'தமிழ்' },
    { code: 'te', label: 'తెలుగు' },
    { code: 'gu', label: 'ગુજરાતી' },
    { code: 'kn', label: 'ಕನ್ನಡ' },
    { code: 'ml', label: 'മലയാളം' },
    { code: 'mr', label: 'मराठी' },
    { code: 'pa', label: 'ਪੰਜਾਬੀ' },
    { code: 'ur', label: 'اردو' },
    { code: 'as', label: 'অসমীয়া' },
    { code: 'or', label: 'ଓଡିଆ' },
  ];

  const [selectedLang, setSelectedLang] = useState<string>(() => {
    return localStorage.getItem('udaan_lang') || 'en';
  });

  // Helper: set both host and top-level domain cookies so Google sees it
  const setGoogTransCookie = (lang: string) => {
    const cookieValue = `/en/${lang}`;
    const cookieBase = `googtrans=${cookieValue}; path=/`;
    try {
      // Current host
      document.cookie = cookieBase;
      // Top-level domain (best-effort)
      const host = window.location.hostname;
      const parts = host.split('.');
      if (parts.length > 1) {
        const tld = `.${parts.slice(-2).join('.')}`;
        document.cookie = `${cookieBase}; domain=${tld}`;
      }
    } catch {}
  };

  const triggerGoogleTranslate = (lang: string) => {
    // Prefer driving the hidden Google combo if available
    const combo = document.querySelector<HTMLSelectElement>('.goog-te-combo');
    if (combo) {
      if (combo.value !== lang) {
        combo.value = lang;
        combo.dispatchEvent(new Event('change'));
      } else {
        // Force re-apply in case same language is chosen
        combo.dispatchEvent(new Event('change'));
      }
      return;
    }
    // Fallback: reload which Google will pick via cookie
    window.location.reload();
  };

  const onChangeLanguage = (lang: string) => {
    setSelectedLang(lang);
    localStorage.setItem('udaan_lang', lang);
    setGoogTransCookie(lang);
    triggerGoogleTranslate(lang);
  };

  // Apply persisted language once Google is ready
  useEffect(() => {
    const saved = localStorage.getItem('udaan_lang');
    if (!saved || saved === 'en') return;
    // Defer until google translate combo exists
    const start = Date.now();
    const timer = setInterval(() => {
      const combo = document.querySelector('.goog-te-combo');
      if (combo || Date.now() - start > 8000) {
        clearInterval(timer);
        if (saved) {
          setGoogTransCookie(saved);
          triggerGoogleTranslate(saved);
        }
      }
    }, 200);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 px-4 py-3">
      <div className="flex items-center justify-between max-w-4xl mx-auto">
        <div className="flex items-center space-x-3">
          {showBack && (
            <button
              onClick={onBack}
              className="p-2 -ml-2 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500"
              aria-label="Go back"
              type="button"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
          )}

          {/* Title clickable only if it's Udaan */}
          {currentTitle === 'Udaan' ? (
            <Link to="/" className="flex items-center space-x-2 text-xl font-semibold text-gray-900 hover:text-orange-500">
              <img
                src="/src/assets/images/logo.png"
                alt="Udaan Logo"
                className="w-8 h-8"
              />
              <span>{currentTitle}</span>
            </Link>
          ) : (
            <h1 className="text-xl font-semibold text-gray-900">{currentTitle}</h1>
          )}
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Custom Language Dropdown */}
          <label htmlFor="lang-select" className="sr-only">Select language</label>
          <select
            id="lang-select"
            value={selectedLang}
            onChange={(e) => onChangeLanguage(e.target.value)}
            className="bg-white border border-gray-200 rounded-md px-3 py-2 text-sm text-gray-700 shadow-sm hover:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500 min-w-[130px]"
            title="Change language"
            aria-label="Change language"
          >
            {LANGUAGE_OPTIONS.map(opt => (
              <option key={opt.code} value={opt.code}>{opt.label}</option>
            ))}
          </select>

          <div
            id="google_translate_element"
            className="google-translate-container"
            title="Translate this page"
            aria-label="Language selector"
          ></div>

          {/* === Right-side controls === */}
          {showProfileMenu ? (
            // ---- Profile icon + dropdown (on /result, /results, /profile) ----
            <div className="relative">
              <button
                ref={btnRef}
                type="button"
                onClick={() => setMenuOpen(v => !v)}
                className="flex items-center px-2 py-1 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                aria-controls="profile-menu"
                title="Profile menu"
              >
                <User className="w-5 h-5 text-gray-700" />
              </button>

              {menuOpen && (
                <div
                  id="profile-menu"
                  ref={menuRef}
                  role="menu"
                  className="absolute right-0 mt-2 w-44 bg-white border border-gray-200 rounded-lg shadow-lg z-20 overflow-hidden"
                >
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => { setMenuOpen(false); navigate('/results'); }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    Dashboard
                  </button>
                  <div className="border-t border-gray-200" />
                  <button
                    type="button"
                    role="menuitem"
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            // ---- Default: Login / Sign Up on other routes ----
            <>
              <Link
                to="/login"
                className="px-4 py-1 text-sm font-medium text-orange-500 rounded-lg hover:bg-orange-100 focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                Login
              </Link>
              <Link
                to="/signup"
                className="px-4 py-1 text-sm font-medium text-white bg-orange-500 rounded-lg hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                Sign Up
              </Link>
            </>
          )}

          <Link
            to="/about"
            className="p-2 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500"
            aria-label="Help and information"
          >
            <HelpCircle className="w-5 h-5 text-gray-600" />
          </Link>
        </div>
      </div>
    </header>
  );
}
