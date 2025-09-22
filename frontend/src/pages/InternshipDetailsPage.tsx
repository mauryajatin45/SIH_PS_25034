import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  MapPin, 
  Calendar, 
  DollarSign, 
  Clock, 
  Building, 
  ExternalLink,
  Bookmark,
  BookmarkCheck,
  ArrowLeft,
  Globe,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import AppBar from '../components/AppBar';
import LoadingSpinner from '../components/LoadingSpinner';
import InternshipCard from '../components/InternshipCard';
import { InternshipRecommendation } from '../types';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { mockApi } from '../api/mockApi';

export default function InternshipDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const [internship, setInternship] = useState<InternshipRecommendation | null>(null);
  const [similarInternships, setSimilarInternships] = useState<InternshipRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savedInternships, setSavedInternships] = useLocalStorage<string[]>('udaan_saved_internships', []);

  useEffect(() => {
    loadInternshipDetails();
  }, [id]);

  const loadInternshipDetails = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const [details, similar] = await Promise.all([
        mockApi.getInternshipDetails(id),
        mockApi.getSimilarInternships(id)
      ]);
      
      if (!details) {
        setError('Internship not found');
        return;
      }
      
      setInternship(details);
      setSimilarInternships(similar);
    } catch (err) {
      setError('Failed to load internship details');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = (internshipId: string) => {
    const newSaved = savedInternships.includes(internshipId)
      ? savedInternships.filter(id => id !== internshipId)
      : [...savedInternships, internshipId];
    
    setSavedInternships(newSaved);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AppBar />
        <main className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        </main>
      </div>
    );
  }

  if (error || !internship) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AppBar />
        <main className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {error || 'Internship not found'}
            </h2>
            <Link
              to="/results"
              className="inline-flex items-center px-6 py-3 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Results
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AppBar />
      
      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Back Button */}
        <Link
          to="/results"
          className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6 focus:outline-none focus:ring-2 focus:ring-orange-500 rounded"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to results
        </Link>

        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{internship.title}</h1>
              <div className="flex items-center text-gray-600 mb-4">
                <Building className="w-5 h-5 mr-2" />
                <span className="text-lg font-medium">{internship.organization}</span>
              </div>
            </div>
            
            <button
              onClick={() => handleSave(internship.id)}
              className="p-3 ml-4 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500"
              aria-label={savedInternships.includes(internship.id) ? 'Remove from saved' : 'Save internship'}
            >
              {savedInternships.includes(internship.id) ? (
                <BookmarkCheck className="w-6 h-6 text-orange-500" />
              ) : (
                <Bookmark className="w-6 h-6 text-gray-400" />
              )}
            </button>
          </div>

          {/* Key Info Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <div className="flex items-center">
              <MapPin className="w-5 h-5 text-gray-400 mr-3" />
              <div>
                <p className="text-sm text-gray-500">Location</p>
                <p className="font-medium">{internship.location}</p>
              </div>
            </div>
            
            <div className="flex items-center">
              <DollarSign className="w-5 h-5 text-gray-400 mr-3" />
              <div>
                <p className="text-sm text-gray-500">Stipend</p>
                <p className="font-medium">₹{internship.stipend.toLocaleString()}/month</p>
              </div>
            </div>
            
            <div className="flex items-center">
              <Calendar className="w-5 h-5 text-gray-400 mr-3" />
              <div>
                <p className="text-sm text-gray-500">Duration</p>
                <p className="font-medium">{internship.duration_weeks} weeks</p>
              </div>
            </div>
            
            <div className="flex items-center">
              <Clock className="w-5 h-5 text-gray-400 mr-3" />
              <div>
                <p className="text-sm text-gray-500">Start Window</p>
                <p className="font-medium">{internship.start_window}</p>
              </div>
            </div>
          </div>

          {/* Match Score */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Your Match Score</span>
              <span className="text-lg font-bold text-green-600">
                {Math.round(internship.match_score * 100)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-green-500 h-3 rounded-full transition-all duration-500"
                style={{ width: `${internship.match_score * 100}%` }}
              />
            </div>
          </div>

          {/* Quick Apply */}
          <div className="flex flex-col sm:flex-row gap-3">
            <a
              href={internship.apply_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 bg-orange-500 text-white px-6 py-3 rounded-lg text-center font-semibold hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-colors inline-flex items-center justify-center"
            >
              Apply Now
              <ExternalLink className="w-5 h-5 ml-2" />
            </a>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">About this internship</h2>
              <p className="text-gray-700 leading-relaxed">{internship.description}</p>
            </div>

            {/* Responsibilities */}
            {internship.responsibilities && internship.responsibilities.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">What you'll do</h2>
                <ul className="space-y-3">
                  {internship.responsibilities.map((responsibility, index) => (
                    <li key={index} className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{responsibility}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Why This Match */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Why this is a great match for you</h2>
              <div className="space-y-3">
                {internship.explanations.map((explanation, index) => (
                  <div key={index} className="flex items-start">
                    <div className="w-2 h-2 rounded-full bg-orange-500 mr-3 mt-2 flex-shrink-0" />
                    <p className="text-gray-700">{explanation}</p>
                  </div>
                ))}
              </div>
              
              {/* Confidence Meter */}
              <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-green-800">Match Confidence</span>
                  <span className="text-sm font-bold text-green-800">Very High</span>
                </div>
                <p className="text-sm text-green-700">
                  This internship aligns exceptionally well with your profile and preferences.
                </p>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Facts */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Facts</h3>
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Sector</p>
                  <span className="inline-block px-3 py-1 bg-orange-100 text-orange-800 text-sm font-medium rounded-full">
                    {internship.sector}
                  </span>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500 mb-2">Skills you'll use</p>
                  <div className="flex flex-wrap gap-2">
                    {internship.skills_matched.map((skill) => (
                      <span 
                        key={skill}
                        className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500 mb-2">Languages supported</p>
                  <div className="flex items-center space-x-2">
                    <Globe className="w-4 h-4 text-gray-400" />
                    <div className="flex flex-wrap gap-1">
                      {internship.language_supported.map((lang) => (
                        <span 
                          key={lang}
                          className="text-sm text-gray-700"
                        >
                          {lang}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {internship.deadline && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Application Deadline</p>
                    <p className="text-sm font-medium text-red-600">
                      {new Date(internship.deadline).toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Required Skills */}
            {internship.required_skills && internship.required_skills.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Required Skills</h3>
                <div className="space-y-2">
                  {internship.required_skills.map((skill) => (
                    <div key={skill} className="flex items-center">
                      <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                      <span className="text-sm text-gray-700">{skill}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Similar Internships */}
        {similarInternships.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Similar internships you might like</h2>
            <div className="grid lg:grid-cols-2 gap-6">
              {similarInternships.map((similar) => (
                <InternshipCard
                  key={similar.id}
                  internship={similar}
                  onSave={handleSave}
                  isSaved={savedInternships.includes(similar.id)}
                />
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}