import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Target, Clock, Users, CheckCircle2, Cpu, Globe2, Layers3, Mail, Sparkles } from 'lucide-react';
import AppBar from '../components/AppBar';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export default function WelcomePage() {
  const isOnline = useOnlineStatus();

  return (
    <div className="min-h-screen bg-white">
      <AppBar />
      
      <main className="max-w-7xl mx-auto px-4 lg:px-8 py-10">
        {/* Hero Section */}
        <section className="relative overflow-hidden rounded-2xl mb-16 bg-gradient-to-br from-orange-50 via-white to-white">
          <div className="absolute inset-0 pointer-events-none" aria-hidden>
            <div className="absolute -top-24 -right-24 w-72 h-72 bg-orange-100 rounded-full blur-3xl opacity-70" />
            <div className="absolute -bottom-28 -left-16 w-80 h-80 bg-orange-200 rounded-full blur-3xl opacity-50" />
          </div>
          <div className="relative grid md:grid-cols-2 gap-8 items-center px-6 sm:px-10 py-14">
            <div>
              <div className="inline-flex items-center justify-center w-14 h-14 mb-6 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl">
                <Sparkles className="w-7 h-7 text-white" />
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight mb-4">
                Empowering Students with Personalized Internship Recommendations
              </h1>
              <p className="text-base sm:text-lg text-gray-600 mb-8 max-w-2xl">
                Udaan leverages AI to match students with internships that align with their skills, interests, and aspirations, making the application process simple, inclusive, and fair.
              </p>
              {!isOnline && (
                <div className="mb-6 p-3 sm:p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-yellow-800 text-sm">
                    You're currently offline. You can still start your profile, and we'll sync when you're back online.
                  </p>
                </div>
              )}
              <div className="flex flex-wrap gap-3">
                <Link
                  to="/profile"
                  className="inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-4 bg-orange-500 text-white text-base sm:text-lg font-semibold rounded-lg hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-colors shadow-lg"
                >
                  Get Started
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </div>
            </div>
            <div className="hidden md:block">
              <div className="relative mx-auto max-w-md">
                <div className="absolute inset-0 -rotate-6 rounded-2xl bg-orange-200/60" />
                <div className="relative rounded-2xl bg-white p-6 shadow-xl border border-orange-100">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center">
                      <Target className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Udaan</p>
                      <p className="text-gray-900 font-semibold">Personalized Matches</p>
                    </div>
                  </div>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-orange-500 mt-0.5" />
                      <span className="text-sm text-gray-700">AI-driven matching that aligns with your goals</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-orange-500 mt-0.5" />
                      <span className="text-sm text-gray-700">Fairness-aware algorithms reduce bias</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-orange-500 mt-0.5" />
                      <span className="text-sm text-gray-700">Optimized for low bandwidth and mobile-first</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Project Overview */}
        <section className="grid md:grid-cols-2 gap-10 items-start mb-16">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">Udaan: A Smart Internship Recommendation System</h2>
            <p className="text-gray-600 leading-relaxed">
              Udaan is an AI-powered solution designed to help students across India, especially those from rural areas, tribal districts, and first-generation learners, find internships tailored to their unique profile. By leveraging a Graph Neural Network (GNN), we ensure that every recommendation is relevant, fair, and based on multiple personal factors such as education, skills, interests, and location.
            </p>
          </div>
          <div className="rounded-xl border border-gray-200 p-6 bg-gray-50">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center">
                <Layers3 className="w-6 h-6 text-white" />
              </div>
              <p className="font-semibold text-gray-900">Project Overview</p>
            </div>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-orange-500 mt-0.5" /> GNN-powered matching</li>
              <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-orange-500 mt-0.5" /> Focus on inclusivity and fairness</li>
              <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-orange-500 mt-0.5" /> Personalization via multi-factor profiles</li>
            </ul>
          </div>
        </section>

        {/* How It Works */}
        <section className="mb-16">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-8">How Udaan Works</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[{
              icon: Users,
              title: 'Collecting Candidate Data',
              desc: 'Provide details like education, skills, location, stipend expectations, and interests.'
            }, {
              icon: Cpu,
              title: 'AI-Driven Matching',
              desc: 'Using a Graph Neural Network, Udaan matches your profile to the best internships.'
            }, {
              icon: Target,
              title: 'Personalized Recommendations',
              desc: 'Receive 3–5 tailored opportunities with clear explanations for each match.'
            }, {
              icon: Clock,
              title: 'Feedback Loop for Better Matches',
              desc: 'Your feedback helps improve future recommendations over time.'
            }].map((step, i) => (
              <div key={i} className="p-5 rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center mb-4">
                  {React.createElement(step.icon, { className: 'w-6 h-6 text-orange-500' })}
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-sm text-gray-600">{step.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Why Udaan */}
        <section className="mb-16">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-8">Why Choose Udaan?</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="p-5 rounded-xl bg-gray-50">
              <h4 className="font-semibold text-gray-900 mb-1">Personalized</h4>
              <p className="text-sm text-gray-600">Matches internships based on your unique skills, interests, and location preferences.</p>
            </div>
            <div className="p-5 rounded-xl bg-gray-50">
              <h4 className="font-semibold text-gray-900 mb-1">Fair & Transparent</h4>
              <p className="text-sm text-gray-600">Ensures unbiased recommendations with fairness-aware algorithms.</p>
            </div>
            <div className="p-5 rounded-xl bg-gray-50">
              <h4 className="font-semibold text-gray-900 mb-1">Mobile-First & Inclusive</h4>
              <p className="text-sm text-gray-600">Designed to work smoothly in low-bandwidth areas, with multilingual support.</p>
            </div>
            <div className="p-5 rounded-xl bg-gray-50">
              <h4 className="font-semibold text-gray-900 mb-1">Empowering</h4>
              <p className="text-sm text-gray-600">Builds confidence with clear explanations and reduced mismatches.</p>
            </div>
            <div className="p-5 rounded-xl bg-gray-50">
              <h4 className="font-semibold text-gray-900 mb-1">Smart & Evolving</h4>
              <p className="text-sm text-gray-600">Learns over time and improves suggestions based on feedback.</p>
            </div>
          </div>
        </section>

        {/* Target Audience */}
        <section className="grid md:grid-cols-2 gap-10 items-start mb-16">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">Who Can Benefit?</h2>
            <p className="text-gray-600">Udaan is designed to serve all students, especially those from underrepresented groups, such as:</p>
          </div>
          <div className="space-y-3">
            <div className="flex items-start gap-3"><Globe2 className="w-5 h-5 text-orange-500 mt-0.5" /><p className="text-sm text-gray-700"><strong>Students from rural areas, tribal districts, or first-generation learners.</strong></p></div>
            <div className="flex items-start gap-3"><Clock className="w-5 h-5 text-orange-500 mt-0.5" /><p className="text-sm text-gray-700"><strong>Candidates with limited digital literacy or low bandwidth access.</strong></p></div>
            <div className="flex items-start gap-3"><Users className="w-5 h-5 text-orange-500 mt-0.5" /><p className="text-sm text-gray-700"><strong>Youth seeking meaningful internships but struggling to find the right match.</strong></p></div>
          </div>
        </section>

        {/* Technology Stack */}
        <section className="mb-16">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">Built on Advanced Technology</h2>
          <p className="text-gray-600 mb-6 max-w-3xl">Udaan leverages the power of Graph Neural Networks (GNN) for smarter, more relevant recommendations. This AI-powered technology is complemented by fairness-aware algorithms that ensure all students receive equally fair treatment, no matter their background.</p>
          <div className="flex flex-wrap gap-4">
            <span className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 text-sm text-gray-700"><Cpu className="w-4 h-4 text-orange-500" /> AI</span>
            <span className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 text-sm text-gray-700"><Layers3 className="w-4 h-4 text-orange-500" /> GNN</span>
            <span className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 text-sm text-gray-700"><Target className="w-4 h-4 text-orange-500" /> Fairness</span>
            <span className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 text-sm text-gray-700"><Globe2 className="w-4 h-4 text-orange-500" /> Multilingual</span>
          </div>
        </section>

        {/* Impact & Vision */}
        <section className="text-center mb-16">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">A Step Toward Smart Education</h2>
          <p className="text-gray-600 max-w-3xl mx-auto">Udaan supports the government’s vision of Smart Education by increasing the accessibility of opportunities for students, especially those from marginalized backgrounds. By bridging the skill-opportunity gap, Udaan ensures that every student can take their first step toward a meaningful career with confidence.</p>
        </section>

        {/* Get Started CTA */}
        <section className="text-center mb-16">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">Ready to Find Your Perfect Internship?</h2>
          <p className="text-gray-600 mb-6">Fill out your profile and start receiving personalized internship recommendations.</p>
          <Link
            to="/profile"
            className="inline-flex items-center justify-center px-8 py-4 bg-orange-500 text-white text-lg font-semibold rounded-lg hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-colors shadow-lg"
          >
            Create Your Profile
            <ArrowRight className="w-5 h-5 ml-2" />
          </Link>
        </section>

        {/* Contact / Support */}
        <section className="rounded-2xl border border-gray-200 p-6 bg-gray-50">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center">
              <Mail className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-1">Need Help or Have Questions?</h2>
              <p className="text-sm text-gray-600">Our support team is ready to assist you! Feel free to reach out to us for any questions or concerns.</p>
            </div>
          </div>
        </section>

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
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
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