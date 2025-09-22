import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Target, Clock, Users } from 'lucide-react';
import AppBar from '../components/AppBar';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export default function WelcomePage() {
  const isOnline = useOnlineStatus();

  return (
    <div className="min-h-screen bg-white">
      <AppBar />
      
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="mb-8">
            <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl flex items-center justify-center">
              <Target className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4 leading-tight">
              Find internships that fit you
            </h1>
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
              Answer a few simple questions. We'll suggest 3–5 opportunities 
              that match your skills, interests, and preferences.
            </p>
          </div>
          
          {!isOnline && (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-yellow-800 text-sm">
                You're currently offline. You can still start your profile, and we'll sync when you're back online.
              </p>
            </div>
          )}
          
          <Link
            to="/profile"
            className="inline-flex items-center justify-center px-8 py-4 bg-orange-500 text-white text-lg font-semibold rounded-lg hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-colors shadow-lg"
          >
            Start Your Journey
            <ArrowRight className="w-5 h-5 ml-2" />
          </Link>
        </div>

        {/* Features */}
        <div className="grid sm:grid-cols-3 gap-6 mb-12">
          <div className="text-center p-6 bg-gray-50 rounded-lg">
            <Clock className="w-8 h-8 text-orange-500 mx-auto mb-4" />
            <h3 className="font-semibold text-gray-900 mb-2">Quick & Simple</h3>
            <p className="text-sm text-gray-600">
              Complete your profile in under 2 minutes with our step-by-step form.
            </p>
          </div>
          
          <div className="text-center p-6 bg-gray-50 rounded-lg">
            <Target className="w-8 h-8 text-orange-500 mx-auto mb-4" />
            <h3 className="font-semibold text-gray-900 mb-2">Smart Matching</h3>
            <p className="text-sm text-gray-600">
              AI-powered recommendations based on your skills and preferences.
            </p>
          </div>
          
          <div className="text-center p-6 bg-gray-50 rounded-lg">
            <Users className="w-8 h-8 text-orange-500 mx-auto mb-4" />
            <h3 className="font-semibold text-gray-900 mb-2">Fair & Transparent</h3>
            <p className="text-sm text-gray-600">
              Unbiased recommendations with clear explanations for every match.
            </p>
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="text-center mb-8">
          <p className="text-sm text-gray-500 mb-4">
            Trusted by thousands of students across India
          </p>
          <div className="flex justify-center space-x-8 opacity-60">
            <div className="text-xs text-gray-400">10,000+ Students</div>
            <div className="text-xs text-gray-400">500+ Organizations</div>
            <div className="text-xs text-gray-400">15+ Languages</div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-6 mt-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
            <div className="text-sm text-gray-500">
              © 2025 Udaan. Made for Indian students.
            </div>
            <div className="flex space-x-6 text-sm">
              <Link to="/about" className="text-gray-600 hover:text-orange-500">
                About
              </Link>
              <a href="#" className="text-gray-600 hover:text-orange-500">
                Privacy
              </a>
              <a href="#" className="text-gray-600 hover:text-orange-500">
                Terms
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}