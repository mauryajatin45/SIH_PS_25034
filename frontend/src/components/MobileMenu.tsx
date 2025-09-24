import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, X, LogOut, User2, KeyRound, AlertTriangle } from 'lucide-react';

interface MobileMenuProps {
  onSignOut?: () => void;
}

export default function MobileMenu({ onSignOut }: MobileMenuProps) {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const user = (() => {
    try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch { return null; }
  })();

  const fullName = user?.name || user?.fullName || user?.email?.split('@')[0] || 'Candidate';
  const location = user?.location || 'Gujarat';
  const candidateId = user?.candidateId || user?._id || user?.id || '';

  const handleSignOut = () => {
    localStorage.removeItem('udaan_username');
    localStorage.removeItem('udaan_profile_draft');
    localStorage.removeItem('udaan_profile_complete');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    if (onSignOut) onSignOut();
    setIsOpen(false);
    navigate('/', { replace: true });
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Close menu on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  return (
    <>
      {/* Hamburger Button */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(true)}
        className="md:hidden p-2 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500"
        aria-label="Open menu"
      >
        <Menu className="w-6 h-6 text-gray-700" />
      </button>

      {/* Overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden" />
      )}

      {/* Mobile Menu Drawer */}
      <div
        ref={menuRef}
        className={`fixed top-0 left-0 h-full w-80 bg-white z-50 transform transition-transform duration-300 ease-in-out md:hidden ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Menu</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500"
            aria-label="Close menu"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto h-[calc(100%-73px)]">
          {/* Candidate Card */}
          <div className="border border-gray-200 rounded-xl overflow-hidden mb-4">
            <div className="px-4 py-3 bg-orange-50 border-b border-gray-200 text-xs font-semibold text-gray-700">
              Candidate ID {candidateId || '—'}
            </div>

            <div className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-semibold">
                  {fullName?.slice(0,1)?.toUpperCase() || 'U'}
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-900 leading-tight">{fullName}</div>
                  <div className="text-xs text-orange-600 font-semibold">Profile Completed: 100%</div>
                </div>
              </div>

              <div className="flex items-center text-xs text-gray-600 mb-3">
                <span className="truncate">{location}</span>
              </div>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    navigate('/profile/update');
                  }}
                  className="w-full inline-flex items-center justify-between px-3 py-2 text-xs border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <span className="inline-flex items-center gap-2 text-gray-700">
                    <User2 className="w-4 h-4" />
                    View Profile
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    navigate('/profile');
                  }}
                  className="w-full inline-flex items-center justify-between px-3 py-2 text-xs border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <span className="inline-flex items-center gap-2 text-gray-700">
                    <KeyRound className="w-4 h-4" />
                    Change Password
                  </span>
                </button>

                <button
                  type="button"
                  onClick={handleSignOut}
                  className="w-full inline-flex items-center justify-between px-3 py-2 text-xs border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <span className="inline-flex items-center gap-2 text-red-600">
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Grievance Section */}
          <div className="mb-4">
            <div className="text-[11px] uppercase font-semibold text-gray-500 mb-2">File a Grievance</div>
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                // Add grievance functionality here
              }}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700"
            >
              <AlertTriangle className="w-4 h-4" />
              New Grievance
            </button>
          </div>

          {/* Status */}
          <div>
            <div className="text-[11px] uppercase font-semibold text-gray-500 mb-2">Grievance Status</div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-lg border border-gray-200 p-3">
                <div className="text-gray-600">Pending</div>
                <div className="text-green-600 font-bold">0</div>
              </div>
              <div className="rounded-lg border border-gray-200 p-3">
                <div className="text-gray-600">Disposed</div>
                <div className="text-green-600 font-bold">0</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
