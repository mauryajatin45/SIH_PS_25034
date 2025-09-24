import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, User2, FileText, KeyRound, AlertTriangle } from 'lucide-react';

interface SidebarProps {
  onSignOut?: () => void;
}

export default function Sidebar({ onSignOut }: SidebarProps) {
  const navigate = useNavigate();

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
    navigate('/', { replace: true });
  };

  return (
    <aside className="w-full sm:w-72 bg-white border-r border-gray-200 h-full sm:h-[calc(100vh-0px)]">
      <div className="p-4">
        {/* Candidate Card */}
        <div className="border border-gray-200 rounded-xl overflow-hidden">
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
                onClick={() => navigate('/profile/update')}
                className="w-full inline-flex items-center justify-between px-3 py-2 text-xs border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <span className="inline-flex items-center gap-2 text-gray-700">
                  <User2 className="w-4 h-4" />
                  View Profile
                </span>
              </button>

              <button
                type="button"
                onClick={() => navigate('/profile')}
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
        <div className="mt-4">
          <div className="text-[11px] uppercase font-semibold text-gray-500 mb-2">File a Grievance</div>
          <button
            type="button"
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700"
          >
            <AlertTriangle className="w-4 h-4" />
            New Grievance
          </button>
        </div>

        {/* Status */}
        <div className="mt-4">
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
    </aside>
  );
}


