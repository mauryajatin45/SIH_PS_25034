import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  MapPin, 
  Calendar, 
  DollarSign, 
  ChevronDown, 
  ChevronUp, 
  Bookmark,
  BookmarkCheck,
  ExternalLink,
  Globe
} from 'lucide-react';
import { InternshipRecommendation } from '../types';

interface InternshipCardProps {
  internship: InternshipRecommendation;
  onSave?: (id: string) => void;
  isSaved?: boolean;
  showMatchDetails?: boolean; // controls match score and why-this-match
}

export default function InternshipCard({ internship, onSave, isSaved = false, showMatchDetails = true }: InternshipCardProps) {
  const [showExplanation, setShowExplanation] = useState(false);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            {internship.title}
          </h3>
          <p className="text-gray-600 font-medium mb-2">
            {internship.organization}
          </p>
        </div>
        
        <button
          onClick={() => onSave?.(internship.id)}
          className="p-2 ml-2 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500"
          aria-label={isSaved ? 'Remove from saved' : 'Save internship'}
        >
          {isSaved ? (
            <BookmarkCheck className="w-5 h-5 text-orange-500" />
          ) : (
            <Bookmark className="w-5 h-5 text-gray-400" />
          )}
        </button>
      </div>

      {/* Key Info */}
      <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
        <div className="flex items-center text-gray-600">
          <MapPin className="w-4 h-4 mr-2 flex-shrink-0" />
          <span>{internship.location}</span>
        </div>
        <div className="flex items-center text-gray-600">
          <DollarSign className="w-4 h-4 mr-2 flex-shrink-0" />
          <span>₹{internship.stipend.toLocaleString()}/month</span>
        </div>
        <div className="flex items-center text-gray-600">
          <Calendar className="w-4 h-4 mr-2 flex-shrink-0" />
          <span>{internship.duration_weeks} weeks</span>
        </div>
        <div className="flex items-center text-gray-600">
          <Globe className="w-4 h-4 mr-2 flex-shrink-0" />
          <span>{internship.start_window}</span>
        </div>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-2 mb-4">
        <span className="px-3 py-1 bg-orange-100 text-orange-800 text-xs font-medium rounded-full">
          {internship.sector}
        </span>
        {internship.skills_matched.slice(0, 3).map((skill) => (
          <span 
            key={skill}
            className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full"
          >
            {skill}
          </span>
        ))}
        {internship.skills_matched.length > 3 && (
          <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
            +{internship.skills_matched.length - 3} more
          </span>
        )}
      </div>

      {showMatchDetails && (
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-gray-600">Match Score</span>
            <span className="font-semibold text-green-600">
              {Math.round(internship.match_score * 100)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-green-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${internship.match_score * 100}%` }}
              role="progressbar"
              aria-valuenow={Math.round(internship.match_score * 100)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Match score percentage"
            />
          </div>
        </div>
      )}

      {showMatchDetails && (
        <div className="mb-4">
          <button
            onClick={() => setShowExplanation(!showExplanation)}
            className="flex items-center justify-between w-full text-left text-sm font-medium text-orange-600 hover:text-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 rounded p-1"
            aria-expanded={showExplanation}
            aria-controls={`explanation-${internship.id}`}
          >
            <span>Why this match?</span>
            {showExplanation ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
          
          {showExplanation && (
            <div 
              id={`explanation-${internship.id}`}
              className="mt-2 space-y-2"
            >
              {internship.explanations.map((explanation, index) => (
                <div key={index} className="flex items-start space-x-2 text-sm text-gray-600">
                  <div className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-2 flex-shrink-0" />
                  <span>{explanation}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Languages */}
      <div className="mb-4">
        <p className="text-xs text-gray-500 mb-1">Languages supported:</p>
        <div className="flex flex-wrap gap-1">
          {internship.language_supported.map((lang) => (
            <span 
              key={lang}
              className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
            >
              {lang}
            </span>
          ))}
        </div>
      </div>

      {/* Actions */}
      {/* <div className="flex flex-col sm:flex-row gap-3">
        <Link
          to={`/internship/${internship.id}`}
          state={{ internship }}
          className="flex-1 bg-orange-500 text-white px-4 py-2 rounded-lg text-center font-medium hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-colors"
        >
          View Details
        </Link>
        <a
          href={internship.apply_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 border border-orange-500 text-orange-500 px-4 py-2 rounded-lg text-center font-medium hover:bg-orange-50 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-colors inline-flex items-center justify-center"
        >
          Apply Now
          <ExternalLink className="w-4 h-4 ml-2" />
        </a>
      </div> */}
    </div>
  );
}