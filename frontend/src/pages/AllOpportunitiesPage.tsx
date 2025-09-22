import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Filter, AlertCircle, RefreshCw, MapPin, Clock, DollarSign, ChevronLeft, ChevronRight } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import InternshipCard from '../components/InternshipCard';
import SkeletonCard from '../components/SkeletonCard';
import Toast from '../components/Toast';
import { InternshipRecommendation } from '../types';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { apiClient } from '../api/apiClient';

const AllOpportunitiesPage: React.FC = () => {
  const navigate = useNavigate();
  const [profile] = useLocalStorage('udaan_profile_draft', {});
  const [opportunities, setOpportunities] = useState<InternshipRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrev, setHasPrev] = useState(false);
  const [savedInternships, setSavedInternships] = useLocalStorage<string[]>('udaan_saved_internships', []);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Filter states
  const [filters, setFilters] = useState({
    sector: '',
    location: '',
    remote: false,
    min_stipend: '',
    max_duration: ''
  });

  const limit = 10;
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
            loadOpportunities(1);
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
            loadOpportunities(1);
            return;
          }
        } catch (error) {
          console.error('Error parsing completed profile:', error);
        }
      }

      loadOpportunities(1);
    };

    checkAndLoad();
  }, [navigate, profile]);

  const loadOpportunities = async (page: number = 1) => {
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

      const response = await apiClient.getAllOpportunities(
        userId,
        filters,
        page,
        limit
      );

      if (response.success) {
        setOpportunities(response.data.recommendations);
        setCurrentPage(response.data.current_page);
        setTotalPages(response.data.total_pages);
        setTotalCount(response.data.total_count);
        setHasNext(response.data.has_next);
        setHasPrev(response.data.has_prev);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch opportunities');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: string | boolean) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleApplyFilters = () => {
    setCurrentPage(1);
    loadOpportunities(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    loadOpportunities(page);
  };

  const clearFilters = () => {
    setFilters({
      sector: '',
      location: '',
      remote: false,
      min_stipend: '',
      max_duration: ''
    });
    setCurrentPage(1);
    loadOpportunities(1);
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

  const uniqueSectors = [...new Set(opportunities.map((r) => r.sector))];

  if (!isOnline && opportunities.length === 0) {
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
                  Connect to the internet to see your internship opportunities.
                </p>
              </div>
            </main>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="w-full px-4 lg:px-8 py-4">
        <div className="grid grid-cols-1 lg:grid-cols-[auto_minmax(0,1fr)] gap-6">
          <aside className="lg:sticky lg:top-4 self-start">
            <Sidebar />
          </aside>

          <main className="px-0 lg:px-2 py-0 lg:py-2">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">All Opportunities</h1>
              <p className="text-gray-600">Browse all available internship opportunities</p>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Filter Results</h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Sector</label>
                  <select
                    value={filters.sector}
                    onChange={(e) => handleFilterChange('sector', e.target.value)}
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
                    onChange={(e) => handleFilterChange('location', e.target.value)}
                    placeholder="City or region"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Minimum Stipend</label>
                  <select
                    value={filters.min_stipend}
                    onChange={(e) => handleFilterChange('min_stipend', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="">Any stipend</option>
                    <option value="5000">₹5,000+</option>
                    <option value="10000">₹10,000+</option>
                    <option value="15000">₹15,000+</option>
                  </select>
                </div>

                <div className="flex items-center pt-6">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.remote}
                      onChange={(e) => handleFilterChange('remote', e.target.checked)}
                      className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Remote only</span>
                  </label>
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <button
                  onClick={handleApplyFilters}
                  className="px-4 py-2 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  Apply Filters
                </button>
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  Clear Filters
                </button>
              </div>
            </div>

            {/* Results Summary */}
            <div className="mb-4">
              <p className="text-gray-600">
                Showing {opportunities.length} of {totalCount} opportunities
                {filters.sector && ` in ${filters.sector}`}
                {filters.location && ` in ${filters.location}`}
              </p>
            </div>

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
                    onClick={() => loadOpportunities(currentPage)}
                    className="flex items-center justify-center px-6 py-3 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Try Again
                  </button>
                </div>
              </div>
            )}

            {/* No Results */}
            {opportunities.length === 0 && !loading && (
              <div className="text-center py-12">
                <div className="w-20 h-20 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                  <Filter className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No opportunities found</h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  No opportunities found matching your criteria.
                </p>
                <button
                  onClick={clearFilters}
                  className="px-6 py-3 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  Clear Filters
                </button>
              </div>
            )}

            {/* Opportunities List */}
            {!loading && !error && opportunities.length > 0 && (
              <div className="space-y-6">
                {opportunities.map((opportunity) => (
                  <div key={opportunity.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-1">{opportunity.title}</h3>
                        <p className="text-lg font-medium text-blue-600">{opportunity.organization}</p>
                      </div>
                      <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                        {opportunity.sector}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="space-y-2">
                        <div className="flex items-center text-gray-600">
                          <MapPin className="h-4 w-4 mr-2" />
                          {opportunity.location}
                        </div>
                        <div className="flex items-center text-gray-600">
                          <DollarSign className="h-4 w-4 mr-2" />
                          ₹{opportunity.stipend.toLocaleString()}/month
                        </div>
                        <div className="flex items-center text-gray-600">
                          <Clock className="h-4 w-4 mr-2" />
                          {opportunity.duration_weeks} weeks
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div>
                          <h4 className="font-medium mb-1">Skills Required:</h4>
                          <div className="flex flex-wrap gap-1">
                            {opportunity.required_skills?.slice(0, 5).map((skill, index) => (
                              <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                                {skill}
                              </span>
                            ))}
                            {opportunity.required_skills && opportunity.required_skills.length > 5 && (
                              <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                                +{opportunity.required_skills.length - 5} more
                              </span>
                            )}
                          </div>
                        </div>
                        {opportunity.description && (
                          <div>
                            <h4 className="font-medium mb-1">Description:</h4>
                            <p className="text-sm text-gray-600 line-clamp-2">
                              {opportunity.description}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSave(opportunity.id)}
                          className={`px-4 py-2 rounded-lg font-medium ${
                            savedInternships.includes(opportunity.id)
                              ? 'bg-green-100 text-green-800 border border-green-300'
                              : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
                          }`}
                        >
                          {savedInternships.includes(opportunity.id) ? 'Saved' : 'Save'}
                        </button>
                        <button className="px-4 py-2 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600">
                          Apply Now
                        </button>
                      </div>
                      <div className="text-sm text-gray-500">
                        {opportunity.start_window}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-2 mt-8">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={!hasPrev}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>

                    <div className="flex gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                        if (pageNum > totalPages) return null;

                        return (
                          <button
                            key={pageNum}
                            onClick={() => handlePageChange(pageNum)}
                            className={`px-3 py-2 rounded-lg font-medium ${
                              pageNum === currentPage
                                ? 'bg-orange-500 text-white'
                                : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>

                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={!hasNext}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            )}
          </main>
        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default AllOpportunitiesPage;
