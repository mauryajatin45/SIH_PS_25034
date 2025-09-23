import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Brain, Users, Eye, Lock, Mail } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Hero */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">About Udaan</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            AI-powered internship matching designed specifically for Indian students, 
            with fairness and transparency at its core.
          </p>
        </div>

        {/* How It Works */}
        <section className="mb-12">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <div className="flex items-center mb-6">
              <Brain className="w-8 h-8 text-orange-500 mr-3" />
              <h2 className="text-2xl font-semibold text-gray-900">How Udaan Works</h2>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <span className="text-orange-600 font-bold text-lg">1</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Profile Creation</h3>
                <p className="text-gray-600 text-sm">
                  You provide information about your education, skills, interests, and preferences through our simple form.
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <span className="text-orange-600 font-bold text-lg">2</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">AI Matching</h3>
                <p className="text-gray-600 text-sm">
                  Our Graph Neural Network (GNN) algorithm analyzes your profile and matches it with internship opportunities.
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <span className="text-orange-600 font-bold text-lg">3</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Smart Recommendations</h3>
                <p className="text-gray-600 text-sm">
                  You receive 3-5 highly relevant internship recommendations with clear explanations for each match.
                </p>
              </div>
            </div>

            <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-blue-800 text-sm">
                <strong>Our Technology:</strong> Udaan uses advanced Graph Neural Networks that understand the complex relationships between skills, interests, locations, and internship requirements. This helps us find matches that traditional keyword-based systems might miss.
              </p>
            </div>
          </div>
        </section>

        {/* Fairness & Transparency */}
        <section className="mb-12">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <div className="flex items-center mb-6">
              <Shield className="w-8 h-8 text-green-500 mr-3" />
              <h2 className="text-2xl font-semibold text-gray-900">Fairness & Transparency</h2>
            </div>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <Eye className="w-5 h-5 text-gray-500 mr-2" />
                  Bias-Aware Recommendations
                </h3>
                <p className="text-gray-700 mb-4">
                  Our algorithm is designed to reduce unconscious bias in internship matching. We actively work to ensure that recommendations are based on skills and qualifications, not on factors like gender, religion, or socioeconomic background.
                </p>
                <ul className="list-disc list-inside text-gray-600 space-y-1 ml-4">
                  <li>Algorithm regularly audited for fairness</li>
                  <li>Training data carefully curated to minimize bias</li>
                  <li>Equal opportunity regardless of background</li>
                  <li>Transparent scoring based on merit</li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <Users className="w-5 h-5 text-gray-500 mr-2" />
                  Clear Explanations
                </h3>
                <p className="text-gray-700 mb-4">
                  For every internship recommendation, we provide clear, understandable explanations of why we think it's a good match for you. This helps you make informed decisions and builds trust in our recommendations.
                </p>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">
                    <strong>Example:</strong> "This internship matches your Excel and Hindi skills, offers remote work within your stipend expectation, and the social impact sector aligns with your stated interests."
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Privacy */}
        <section className="mb-12">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <div className="flex items-center mb-6">
              <Lock className="w-8 h-8 text-blue-500 mr-3" />
              <h2 className="text-2xl font-semibold text-gray-900">Privacy & Data</h2>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">What We Collect</h3>
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-start">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 mr-3 flex-shrink-0"></div>
                    Education level and field of study
                  </li>
                  <li className="flex items-start">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 mr-3 flex-shrink-0"></div>
                    Skills and interests you provide
                  </li>
                  <li className="flex items-start">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 mr-3 flex-shrink-0"></div>
                    Location and work preferences
                  </li>
                  <li className="flex items-start">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 mr-3 flex-shrink-0"></div>
                    Feedback on our recommendations
                  </li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Your Data Rights</h3>
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-start">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2 mr-3 flex-shrink-0"></div>
                    We never sell your data to third parties
                  </li>
                  <li className="flex items-start">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2 mr-3 flex-shrink-0"></div>
                    You can delete your profile anytime
                  </li>
                  <li className="flex items-start">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2 mr-3 flex-shrink-0"></div>
                    Data is encrypted and securely stored
                  </li>
                  <li className="flex items-start">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2 mr-3 flex-shrink-0"></div>
                    You control what information you share
                  </li>
                </ul>
              </div>
            </div>
            
            <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <p className="text-yellow-800 text-sm">
                <strong>Your Control:</strong> Your data is stored locally on your device until you submit your profile. You can clear your draft data anytime by clearing your browser data.
              </p>
            </div>
          </div>
        </section>

        {/* Contact */}
        <section className="mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <Mail className="w-8 h-8 text-orange-500 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Get in Touch</h2>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              Have questions, suggestions, or need help? We'd love to hear from you. 
              Our team is committed to making internship discovery better for all Indian students.
            </p>
            <div className="space-y-2 text-gray-600">
              <p><strong>Email:</strong> hello@udaan.app</p>
              <p><strong>Support:</strong> Available in Hindi and English</p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <div className="text-center">
          <Link
            to="/"
            className="inline-flex items-center px-8 py-4 bg-orange-500 text-white text-lg font-semibold rounded-lg hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-colors"
          >
            Start Finding Internships
          </Link>
        </div>
      </main>
    </div>
  );
}