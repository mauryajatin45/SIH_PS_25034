import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Filter, AlertCircle, RefreshCw } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import InternshipCard from '../components/InternshipCard';
import SkeletonCard from '../components/SkeletonCard';
import Toast from '../components/Toast';
import { InternshipRecommendation } from '../types';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { apiClient } from '../api/apiClient';
import { mockApi } from '../api/mockApi';

export default function ResultsPage() {
  const navigate = useNavigate();
  const [profile] = useLocalStorage('udaan_profile_draft', {});
  const [recommendations, setRecommendations] = useState<InternshipRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'recommended' | 'all'>('recommended');
  const [savedInternships, setSavedInternships] = useLocalStorage<string[]>('udaan_saved_internships', []);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    sector: '',
    location: '',
    remote: false,
    minStipend: 0,
    maxDuration: 52,
  });
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Fixed sector options from DB
  const SECTOR_OPTIONS = [
    'agritech',
    'e-commerce',
    'edtech',
    'fintech',
    'govtech',
    'healthtech',
    'hospitality',
    'manufacturing',
    'media',
    'ngo'
  ];

  // Pagination state for "all" tab
  const [allOpportunitiesPage, setAllOpportunitiesPage] = useState(1);
  const [allOpportunitiesTotalPages, setAllOpportunitiesTotalPages] = useState(1);
  const [allOpportunitiesTotalCount, setAllOpportunitiesTotalCount] = useState(0);
  const [allOpportunitiesHasNext, setAllOpportunitiesHasNext] = useState(false);
  const [allOpportunitiesHasPrev, setAllOpportunitiesHasPrev] = useState(false);

  const isOnline = useOnlineStatus();

  useEffect(() => {
    const checkAndLoad = async () => {
      const completedProfileStr = localStorage.getItem('udaan_profile_complete');
      const hasDraftProfile = profile && Object.keys(profile || {}).length > 0;

      if (!completedProfileStr && !hasDraftProfile) {
        const userJson = localStorage.getItem('user');
        const token = localStorage.getItem('token');
        const user = (() => { try { return JSON.parse(userJson || 'null'); } catch { return null; } })();
        const userId = user?.id || user?._id;

        if (token && userId) {
          try {
            await apiClient.getCandidateById(userId);
            loadRecommendations();
            return;
          } catch {
            navigate('/profile', { replace: true });
            return;
          }
        } else {
          navigate('/login', { replace: true });
          return;
        }
      }

      if (completedProfileStr) {
        try {
          const parsedProfile = JSON.parse(completedProfileStr);
          if (parsedProfile && Object.keys(parsedProfile).length > 0) {
            loadRecommendations();
            return;
          }
        } catch (error) {
          console.error('Error parsing completed profile:', error);
        }
      }

      loadRecommendations();
    };

    checkAndLoad();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadRecommendations = async (type: 'recommended' | 'all' = 'recommended') => {
    const userJson = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (!token || !userJson) {
      setError('Please login first.');
      setLoading(false);
      return;
    }
    const user = (() => { try { return JSON.parse(userJson || 'null'); } catch { return null; } })();
    const userId = user?.id || user?._id;
    if (!userId) {
      setError('Invalid user session. Please login again.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      if (type === 'recommended') {
        // Try ML recommendations first
        try {
          const resp = await apiClient.getMLRecommendations(userId);
          let list = (resp as any)?.data?.recommendations || [];
          if (!Array.isArray(list) || list.length === 0) {
            // Fallback to regular recommendations if ML returns empty
            const fallbackResp = await apiClient.getRecommendations(userId, {
              sector: filters.sector,
              location: filters.location,
              remote: filters.remote,
              min_stipend: filters.minStipend,
              max_duration: filters.maxDuration,
            });
            list = (fallbackResp as any)?.data?.recommendations || [];
          }
          setRecommendations(list as any);
        } catch (mlError) {
          console.log('ML recommendations failed, using fallback:', mlError);
          // Fallback to regular recommendations
          const resp = await apiClient.getRecommendations(userId, {
            sector: filters.sector,
            location: filters.location,
            remote: filters.remote,
            min_stipend: filters.minStipend,
            max_duration: filters.maxDuration,
          });
          let list = (resp as any)?.data?.recommendations || [];
          if (!Array.isArray(list) || list.length === 0) {
            try {
              const completed = localStorage.getItem('udaan_profile_complete');
              const profileData = completed ? JSON.parse(completed) : (profile || {});
              const mock = await mockApi.getRecommendations(profileData as any);
              list = mock as any;
            } catch {}
          }
          setRecommendations(list as any);
        }
      } else {
        // Load all opportunities using the new API
        try {
          const resp = await apiClient.getAllOpportunities(userId, {
            sector: filters.sector,
            location: filters.location,
            remote: filters.remote,
            min_stipend: filters.minStipend.toString(),
            max_duration: filters.maxDuration.toString(),
          }, 1, 10); // Default to page 1, limit 10

          console.log('All opportunities API response:', resp); // Debug log

          if (resp.success && resp.data && resp.data.recommendations) {
            console.log('Recommendations data:', resp.data.recommendations); // Debug log
            const sorted = [...resp.data.recommendations].sort((a: any, b: any) => (b.stipend || 0) - (a.stipend || 0));
            setRecommendations(sorted as any);
            setAllOpportunitiesPage(resp.data.current_page);
            setAllOpportunitiesTotalPages(resp.data.total_pages);
            setAllOpportunitiesTotalCount(resp.data.total_count);
            setAllOpportunitiesHasNext(resp.data.has_next);
            setAllOpportunitiesHasPrev(resp.data.has_prev);
          } else {
            console.error('Invalid response structure:', resp); // Debug log
            // Fallback to regular recommendations if new API fails
            const fallbackResp = await apiClient.getRecommendations(userId, {
              sector: filters.sector,
              location: filters.location,
              remote: filters.remote,
              min_stipend: filters.minStipend,
              max_duration: filters.maxDuration,
            });
            let list = (fallbackResp as any)?.data?.recommendations || [];
            if (!Array.isArray(list) || list.length === 0) {
              try {
                const completed = localStorage.getItem('udaan_profile_complete');
                const profileData = completed ? JSON.parse(completed) : (profile || {});
                const mock = await mockApi.getRecommendations(profileData as any);
                list = mock as any;
              } catch {}
            }
            setRecommendations(list as any);
          }
        } catch (allOpportunitiesError) {
          console.error('All opportunities API failed:', allOpportunitiesError); // Debug log
          // Fallback to regular recommendations
          const resp = await apiClient.getRecommendations(userId, {
            sector: filters.sector,
            location: filters.location,
            remote: filters.remote,
            min_stipend: filters.minStipend,
            max_duration: filters.maxDuration,
          });
          let list = (resp as any)?.data?.recommendations || [];
          if (!Array.isArray(list) || list.length === 0) {
            try {
              const completed = localStorage.getItem('udaan_profile_complete');
              const profileData = completed ? JSON.parse(completed) : (profile || {});
              const mock = await mockApi.getRecommendations(profileData as any);
              list = mock as any;
            } catch {}
          }
          setRecommendations(list as any);
        }
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to load recommendations. Please check your connection and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const loadAllOpportunities = async (page: number) => {
    const userJson = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (!token || !userJson) {
      setError('Please login first.');
      setLoading(false);
      return;
    }
    const user = (() => { try { return JSON.parse(userJson || 'null'); } catch { return null; } })();
    const userId = user?.id || user?._id;
    if (!userId) {
      setError('Invalid user session. Please login again.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const resp = await apiClient.getAllOpportunities(userId, {
        sector: filters.sector,
        location: filters.location,
        remote: filters.remote,
        min_stipend: filters.minStipend.toString(),
        max_duration: filters.maxDuration.toString(),
      }, page, 10);

      if (resp.success) {
        const sorted = [...resp.data.recommendations].sort((a: any, b: any) => (b.stipend || 0) - (a.stipend || 0));
        setRecommendations(sorted as any);
        setAllOpportunitiesPage(resp.data.current_page);
        setAllOpportunitiesTotalPages(resp.data.total_pages);
        setAllOpportunitiesTotalCount(resp.data.total_count);
        setAllOpportunitiesHasNext(resp.data.has_next);
        setAllOpportunitiesHasPrev(resp.data.has_prev);
      } else {
        // Fallback to regular recommendations if new API fails
        const fallbackResp = await apiClient.getRecommendations(userId, {
          sector: filters.sector,
          location: filters.location,
          remote: filters.remote,
          min_stipend: filters.minStipend,
          max_duration: filters.maxDuration,
        });
        let list = (fallbackResp as any)?.data?.recommendations || [];
        if (!Array.isArray(list) || list.length === 0) {
          try {
            const completed = localStorage.getItem('udaan_profile_complete');
            const profileData = completed ? JSON.parse(completed) : (profile || {});
            const mock = await mockApi.getRecommendations(profileData as any);
            list = mock as any;
          } catch {}
        }
        setRecommendations(list as any);
      }
    } catch (allOpportunitiesError) {
      console.log('All opportunities API failed, using fallback:', allOpportunitiesError);
      // Fallback to regular recommendations
      const resp = await apiClient.getRecommendations(userId, {
        sector: filters.sector,
        location: filters.location,
        remote: filters.remote,
        min_stipend: filters.minStipend,
        max_duration: filters.maxDuration,
      });
      let list = (resp as any)?.data?.recommendations || [];
      if (!Array.isArray(list) || list.length === 0) {
        try {
          const completed = localStorage.getItem('udaan_profile_complete');
          const profileData = completed ? JSON.parse(completed) : (profile || {});
          const mock = await mockApi.getRecommendations(profileData as any);
          list = mock as any;
        } catch {}
      }
      setRecommendations(list as any);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = (internshipId: string) => {
    const newSaved = savedInternships.includes(internshipId)
      ? savedInternships.filter((id) => id !== internshipId)
      : [...savedInternships, internshipId];

    setSavedInternships(newSaved);
    setToast({
      message: savedInternships.includes(internshipId) ? 'Removed from saved' : 'Saved for later',
      type: 'success',
    });
  };

  const filteredRecommendations = recommendations.filter((intern) => {
    console.log('Filtering internship:', intern); // Debug log
    console.log('Current filters:', filters); // Debug log

    // Handle case where intern data might be malformed
    if (!intern || typeof intern !== 'object') {
      console.warn('Invalid internship data:', intern);
      return false;
    }

    // Apply sector filter - handle both regular and ML data structures
    if (filters.sector && intern.sector && intern.sector !== filters.sector) {
      console.log('Filtered out by sector:', intern.sector, '!=', filters.sector);
      return false;
    }

    // Apply location filter - handle both regular and ML data structures
    const location = typeof intern.location === 'string' ? intern.location : intern.location?.city || '';
    if (filters.location && location) {
      const locationMatch = location.toLowerCase().includes(filters.location.toLowerCase());
      if (!locationMatch) {
        console.log('Filtered out by location:', location, 'does not include', filters.location);
        return false;
      }
    }

    // Apply remote filter - handle both regular and ML data structures
    if (filters.remote && location && location !== 'Remote') {
      console.log('Filtered out by remote:', location, '!= Remote');
      return false;
    }

    // Apply stipend filter - handle both expected_salary (ML) and stipend (regular)
    const stipend = intern.expected_salary || intern.stipend || 0;
    if (stipend < filters.minStipend) {
      console.log('Filtered out by stipend:', stipend, '<', filters.minStipend);
      return false;
    }

    // Apply duration filter - handle both duration_months (ML) and duration_weeks (regular)
    const durationWeeks = intern.duration_months
      ? Math.ceil(intern.duration_months * 4.33) // Convert months to weeks
      : intern.duration_weeks || 0;
    if (durationWeeks > filters.maxDuration) {
      console.log('Filtered out by duration:', durationWeeks, '>', filters.maxDuration);
      return false;
    }

    console.log('Internship passed all filters:', intern);
    return true;
  });

  const uniqueSectors = [...new Set(recommendations.map((r) => r.sector))];

  // Refetch All opportunities when sector filter changes
  useEffect(() => {
    if (activeTab === 'all') {
      setAllOpportunitiesPage(1);
      loadRecommendations('all');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.sector, activeTab]);

  // ------- OFFLINE STATE -------
  if (!isOnline && recommendations.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="w-full px-4 lg:px-8 py-4">
          <div className="grid grid-cols-1 lg:grid-cols-[auto_minmax(0,1fr)] gap-6">
            <aside className="lg:sticky lg:top-4 self-start">
              <Sidebar />
            </aside>
            <main className="px-0 lg:px-2 py-0 lg:py-2">
              <div className="text-center">
                <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-900 mb-2">You're offline</h2>
                <p className="text-gray-600 mb-6">
                  Connect to the internet to see your internship recommendations.
                </p>
              </div>
            </main>
          </div>
        </div>
      </div>
    );
  }

  // ------- MAIN -------
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="w-full px-4 lg:px-8 py-4">
        <div className="grid grid-cols-1 lg:grid-cols-[auto_minmax(0,1fr)] gap-6">
          <aside className="lg:sticky lg:top-4 self-start">
            <Sidebar />
          </aside>

          <main className="px-0 lg:px-2 py-0 lg:py-2">
            {/* Nav Tabs (instead of old header) */}
            <div className="flex items-center space-x-4 mb-6">
              <button
                onClick={() => {
                  setActiveTab('recommended');
                  loadRecommendations('recommended');
                }}
                className={`px-4 py-2 rounded-t-lg text-sm font-medium ${
                  activeTab === 'recommended'
                    ? 'text-white bg-orange-500'
                    : 'text-gray-700 bg-gray-100 hover:bg-gray-200'
                }`}
              >
                Recommended opportunity
              </button>
              <button
                onClick={() => {
                  setActiveTab('all');
                  loadRecommendations('all');
                }}
                className={`px-4 py-2 rounded-t-lg text-sm font-medium ${
                  activeTab === 'all'
                    ? 'text-white bg-orange-500'
                    : 'text-gray-700 bg-gray-100 hover:bg-gray-200'
                }`}
              >
                All opportunity
              </button>
            </div>

            {/* Quick Filters for All Opportunities */}
            {activeTab === 'all' && (
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Sector</label>
                  <select
                    value={filters.sector}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFilters((prev) => ({ ...prev, sector: val }));
                    }}
                    className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="">All sectors</option>
                    {SECTOR_OPTIONS.map((sector) => (
                      <option key={sector} value={sector}>{sector}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Fairness Notice */}
            {/* <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-blue-800 text-sm">
                Recommendations consider fairness to reduce bias.{' '}
                <Link to="/about" className="text-blue-600 underline hover:text-blue-500">
                  Learn more
                </Link>
              </p>
            </div> */}

            {/* Filters */}
            {showFilters && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Filter Results</h3>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Sector</label>
                    <select
                      value={filters.sector}
                      onChange={(e) => setFilters((prev) => ({ ...prev, sector: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="">All sectors</option>
                      {uniqueSectors.map((sector) => (
                        <option key={sector} value={sector}>
                          {sector}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                    <input
                      type="text"
                      value={filters.location}
                      onChange={(e) => setFilters((prev) => ({ ...prev, location: e.target.value }))}
                      placeholder="City or region"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Minimum Stipend</label>
                    <select
                      value={filters.minStipend}
                      onChange={(e) => setFilters((prev) => ({ ...prev, minStipend: parseInt(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value={0}>Any stipend</option>
                      <option value={5000}>₹5,000+</option>
                      <option value={10000}>₹10,000+</option>
                      <option value={15000}>₹15,000+</option>
                    </select>
                  </div>

                  <div className="flex items-center pt-6">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filters.remote}
                        onChange={(e) => setFilters((prev) => ({ ...prev, remote: e.target.checked }))}
                        className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Remote only</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Loading */}
            {loading && (
              <div className="space-y-6">
                {[...Array(3)].map((_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="text-center py-12">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Something went wrong</h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">{error}</p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    onClick={() => loadRecommendations(activeTab)}
                    className="flex items-center justify-center px-6 py-3 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Try Again
                  </button>
                  <Link
                    to="/profile"
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-500 text-center"
                  >
                    Adjust Preferences
                  </Link>
                </div>
              </div>
            )}

            {/* Empty-with-filters */}
            {!loading && !error && filteredRecommendations.length === 0 && recommendations.length > 0 && (
              <div className="text-center py-12">
                <div className="w-20 h-20 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                  <Filter className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No matches with current filters</h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  Try adjusting your filters or broaden your preferences to see more opportunities.
                </p>
                <button
                  onClick={() =>
                    setFilters({ sector: '', location: '', remote: false, minStipend: 0, maxDuration: 52 })
                  }
                  className="px-6 py-3 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  Clear Filters
                </button>
              </div>
            )}

            {/* No results at all */}
            {!loading && !error && recommendations.length === 0 && (
              <div className="text-center py-12">
                <div className="w-20 h-20 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No close matches yet</h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  We couldn't find internships that closely match your preferences right now. Try adjusting your profile
                  or check back later for new opportunities.
                </p>
                <Link
                  to="/profile"
                  className="px-6 py-3 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  Adjust Preferences
                </Link>
              </div>
            )}

            {/* Results */}
            {!loading && !error && filteredRecommendations.length > 0 && (
              <div className="space-y-6">
                {filteredRecommendations.map((internship) => (
                  <InternshipCard
                    key={internship.id}
                    internship={internship}
                    onSave={handleSave}
                    isSaved={savedInternships.includes(internship.id)}
                  />
                ))}

                {/* Pagination for "all" tab */}
                {activeTab === 'all' && allOpportunitiesTotalPages > 1 && (
                  <div className="flex items-center justify-between bg-white px-4 py-3 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          if (allOpportunitiesHasPrev) {
                            setAllOpportunitiesPage(prev => prev - 1);
                            loadAllOpportunities(allOpportunitiesPage - 1);
                          }
                        }}
                        disabled={!allOpportunitiesHasPrev}
                        className={`px-3 py-2 text-sm font-medium rounded-md ${
                          allOpportunitiesHasPrev
                            ? 'text-orange-600 bg-orange-50 hover:bg-orange-100'
                            : 'text-gray-400 bg-gray-50 cursor-not-allowed'
                        }`}
                      >
                        Previous
                      </button>

                      <div className="flex items-center space-x-1">
                        {Array.from({ length: Math.min(5, allOpportunitiesTotalPages) }, (_, i) => {
                          let pageNum;
                          if (allOpportunitiesTotalPages <= 5) {
                            pageNum = i + 1;
                          } else if (allOpportunitiesPage <= 3) {
                            pageNum = i + 1;
                          } else if (allOpportunitiesPage >= allOpportunitiesTotalPages - 2) {
                            pageNum = allOpportunitiesTotalPages - 4 + i;
                          } else {
                            pageNum = allOpportunitiesPage - 2 + i;
                          }

                          return (
                            <button
                              key={pageNum}
                              onClick={() => {
                                setAllOpportunitiesPage(pageNum);
                                loadAllOpportunities(pageNum);
                              }}
                              className={`px-3 py-2 text-sm font-medium rounded-md ${
                                pageNum === allOpportunitiesPage
                                  ? 'text-white bg-orange-500'
                                  : 'text-gray-700 bg-white hover:bg-gray-50'
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                      </div>

                      <button
                        onClick={() => {
                          if (allOpportunitiesHasNext) {
                            setAllOpportunitiesPage(prev => prev + 1);
                            loadAllOpportunities(allOpportunitiesPage + 1);
                          }
                        }}
                        disabled={!allOpportunitiesHasNext}
                        className={`px-3 py-2 text-sm font-medium rounded-md ${
                          allOpportunitiesHasNext
                            ? 'text-orange-600 bg-orange-50 hover:bg-orange-100'
                            : 'text-gray-400 bg-gray-50 cursor-not-allowed'
                        }`}
                      >
                        Next
                      </button>
                    </div>

                    <div className="text-sm text-gray-600">
                      Showing {((allOpportunitiesPage - 1) * 10) + 1}-{Math.min(allOpportunitiesPage * 10, allOpportunitiesTotalCount)} of {allOpportunitiesTotalCount} opportunities
                    </div>
                  </div>
                )}

                <div className="text-center py-8 border-t border-gray-200">
                  <p className="text-gray-600 mb-4">How are these recommendations?</p>
                  <Link
                    to="/feedback"
                    className="inline-flex items-center px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    Give Feedback
                  </Link>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
