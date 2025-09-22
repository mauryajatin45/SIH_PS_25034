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
      case '/result': return 'Your Matches';
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
            <Link to="/" className="text-xl font-semibold text-gray-900 hover:text-orange-500">
              {currentTitle}
            </Link>
          ) : (
            <h1 className="text-xl font-semibold text-gray-900">{currentTitle}</h1>
          )}
        </div>
        
        <div className="flex items-center space-x-3">
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
