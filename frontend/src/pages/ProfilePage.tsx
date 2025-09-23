// client/src/pages/ProfilePage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ArrowLeft, Mic, MicOff } from 'lucide-react';
import Stepper from '../components/Stepper';
import FormField from '../components/FormField';
import ChipInput from '../components/ChipInput';
import { CandidateProfile } from '../types';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { educationLevels, fields, skillSuggestions, interestOptions, cities, jobRoleOptions } from '../data/mockData';
import { apiClient } from '../api/apiClient';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

const steps = [
  { id: 'education', title: 'Education', completed: false },
  { id: 'skills', title: 'Skills', completed: false },
  { id: 'interests', title: 'Interests', completed: false },
  { id: 'constraints', title: 'Preferences', completed: false }
];

export default function ProfilePage() {
  const navigate = useNavigate();
  const isOnline = useOnlineStatus();

  const [currentStep, setCurrentStep] = useState<'education' | 'skills' | 'interests' | 'constraints'>('education');
  const [stepStates, setStepStates] = useState(steps);
  const [isListening, setIsListening] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // Local draft
  const [profile, setProfile] = useLocalStorage<Partial<CandidateProfile>>('udaan_profile_draft', {
    skills: [],
    interests: [],
    remote_ok: false,
    stipend_min: 0
  });

  // Voice recognition
  const [speechRecognition, setSpeechRecognition] = useState<any>(null);

  useEffect(() => {
    // If a completed profile snapshot exists locally, skip this page
    const complete = localStorage.getItem('udaan_profile_complete');
    if (complete) {
      navigate('/results', { replace: true });
      return;
    }

    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SR = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const recognition = new SR();
      recognition.lang = 'en-IN';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript as string;
        const skills = transcript.split(/[,\s]+/).filter((s) => s.length > 2);
        setProfile((prev) => ({ ...prev, skills: [ ...(prev.skills || []), ...skills ] }));
        setIsListening(false);
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);

      setSpeechRecognition(recognition);
    }
  }, [setProfile]);

  const startVoiceInput = () => {
    if (speechRecognition && !isListening) {
      setIsListening(true);
      speechRecognition.start();
    }
  };
  const stopVoiceInput = () => {
    if (speechRecognition && isListening) {
      speechRecognition.stop();
      setIsListening(false);
    }
  };

  // -------- Validation --------
  const validateStep = (step: string): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 'education':
        if (!profile.education_level) newErrors.education_level = 'Please select your education level';
        if (!profile.field) newErrors.field = 'Please select your field of study';
        if (!profile.grad_year) newErrors.grad_year = 'Please enter your graduation year';
        break;
      case 'skills':
        if (!profile.skills || profile.skills.length === 0) newErrors.skills = 'Please add at least one skill';
        break;
      case 'interests':
        if (!profile.interests || profile.interests.length === 0) newErrors.interests = 'Please select at least one interest';
        if (!profile.location) newErrors.location = 'Please select your location';
        break;
      case 'constraints':
        if (!profile.availability?.start) newErrors.start_date = 'Please select your availability start date';
        if (!profile.availability?.hours_per_week) newErrors.hours_per_week = 'Please enter hours per week';
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // -------- Step navigation --------
  const handleNext = () => {
    if (!validateStep(currentStep)) return;
    const idx = stepStates.findIndex((s) => s.id === currentStep);
    setStepStates((prev) => prev.map((s, i) => (i === idx ? { ...s, completed: true } : s)));
    if (idx < stepStates.length - 1) setCurrentStep(stepStates[idx + 1].id as any);
  };

  const handlePrev = () => {
    const idx = stepStates.findIndex((s) => s.id === currentStep);
    if (idx > 0) setCurrentStep(stepStates[idx - 1].id as any);
  };

  // -------- Submit: Save to DB then go to Results --------
  const handleSubmit = async () => {
    if (!isOnline) {
      setErrors({ submit: 'You are offline. Please connect to the internet.' });
      return;
    }
    if (!validateStep(currentStep)) return;

    try {
      setSubmitting(true);
      // mark all steps complete locally
      setStepStates((prev) => prev.map((s) => ({ ...s, completed: true })));

      // Build payload matching backend schema
      const payload: any = {
        education_level: profile.education_level,
        field: profile.field,
        grad_year: profile.grad_year,
        skills: profile.skills || [],
        interests: profile.interests || [],
        location: profile.location,
        remote_ok: !!profile.remote_ok,
        stipend_min: typeof profile.stipend_min === 'number' ? profile.stipend_min : 0,
        availability: {
          start: profile.availability?.start,
          hours_per_week: profile.availability?.hours_per_week
        },
        accessibility_needs: profile.accessibility_needs || 'None',
        // New fields for ML model compatibility
        max_distance_km: typeof profile.max_distance_km === 'number' ? profile.max_distance_km : 50,
        preferred_job_roles: profile.preferred_job_roles || [],
        preferred_sectors: profile.preferred_sectors || []
      };

      // Persist to DB (requires Authorization header via interceptor)
      await apiClient.saveCandidate(payload);

      // Keep a local "completed" snapshot (optional)
      const completeProfile = { ...profile, completed: true, completedAt: new Date().toISOString() };
      localStorage.setItem('udaan_profile_complete', JSON.stringify(completeProfile));

      // Go see recommendations
      navigate('/results');
    } catch (err) {
      console.error('Error saving profile:', err);
      setErrors({
        submit:
          err instanceof Error ? err.message : 'Failed to save profile. Please try again.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  // -------- UI pieces --------
  const renderSubmitError = () =>
    errors.submit ? (
      <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-700 text-sm">{errors.submit}</p>
      </div>
    ) : null;

  const renderEducationStep = () => (
    <div className="space-y-6">
      <FormField label="Current Education Level" required error={errors.education_level}>
        <select
          value={profile.education_level || ''}
          onChange={(e) => setProfile((prev) => ({ ...prev, education_level: e.target.value as any }))}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
        >
          <option value="">Select your level</option>
          {educationLevels.map((level) => (
            <option key={level} value={level}>{level}</option>
          ))}
        </select>
      </FormField>

      <FormField label="Field of Study" required error={errors.field}>
        <select
          value={profile.field || ''}
          onChange={(e) => setProfile((prev) => ({ ...prev, field: e.target.value }))}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
        >
          <option value="">Select your field</option>
          {fields.map((f) => (
            <option key={f} value={f}>{f}</option>
          ))}
        </select>
      </FormField>

      <FormField label="Expected Graduation Year" required error={errors.grad_year}>
        <input
          type="number"
          min="2024"
          max="2030"
          value={profile.grad_year || ''}
          onChange={(e) => setProfile((prev) => ({ ...prev, grad_year: parseInt(e.target.value) }))}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          placeholder="e.g., 2026"
        />
      </FormField>
    </div>
  );

  const renderSkillsStep = () => (
    <div className="space-y-6">
      <FormField label="Your Skills" required error={errors.skills}>
        <ChipInput
          value={profile.skills || []}
          onChange={(skills) => setProfile((prev) => ({ ...prev, skills }))}
          suggestions={skillSuggestions}
          placeholder="Type a skill and press Enter"
          maxItems={15}
        />
      </FormField>

      {speechRecognition && (
        <div className="mt-4">
          <button
            type="button"
            onClick={isListening ? stopVoiceInput : startVoiceInput}
            className={`flex items-center justify-center px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
              isListening
                ? 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100'
                : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
            }`}
          >
            {isListening ? (
              <>
                <MicOff className="w-4 h-4 mr-2" />
                Stop Recording
              </>
            ) : (
              <>
                <Mic className="w-4 h-4 mr-2" />
                Add Skills by Voice
              </>
            )}
          </button>
          {isListening && (
            <p className="text-sm text-gray-600 mt-2">Listening... Say your skills separated by commas.</p>
          )}
        </div>
      )}
    </div>
  );

  const renderInterestsStep = () => (
    <div className="space-y-6">
      <FormField label="Your Interests" required error={errors.interests}>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {interestOptions.map((interest) => {
            const checked = (profile.interests || []).includes(interest);
            return (
              <label
                key={interest}
                className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                  checked ? 'bg-orange-50 border-orange-200 text-orange-800' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => {
                    const list = profile.interests || [];
                    if (e.target.checked) {
                      setProfile((prev) => ({ ...prev, interests: [...list, interest] }));
                    } else {
                      setProfile((prev) => ({ ...prev, interests: list.filter((i) => i !== interest) }));
                    }
                  }}
                  className="sr-only"
                />
                <span className="text-sm font-medium">{interest}</span>
              </label>
            );
          })}
        </div>
      </FormField>

      <FormField label="Preferred Job Roles" error={errors.preferred_job_roles}>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {jobRoleOptions.map((role) => {
            const checked = (profile.preferred_job_roles || []).includes(role);
            return (
              <label
                key={role}
                className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                  checked ? 'bg-blue-50 border-blue-200 text-blue-800' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => {
                    const list = profile.preferred_job_roles || [];
                    if (e.target.checked) {
                      setProfile((prev) => ({ ...prev, preferred_job_roles: [...list, role] }));
                    } else {
                      setProfile((prev) => ({ ...prev, preferred_job_roles: list.filter((r) => r !== role) }));
                    }
                  }}
                  className="sr-only"
                />
                <span className="text-sm font-medium">{role}</span>
              </label>
            );
          })}
        </div>
        <p className="text-sm text-gray-600 mt-2">Select the job roles you're most interested in (optional)</p>
      </FormField>

      <FormField label="Preferred Sectors" error={errors.preferred_sectors}>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {interestOptions.map((sector) => {
            const checked = (profile.preferred_sectors || []).includes(sector);
            return (
              <label
                key={sector}
                className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                  checked ? 'bg-green-50 border-green-200 text-green-800' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => {
                    const list = profile.preferred_sectors || [];
                    if (e.target.checked) {
                      setProfile((prev) => ({ ...prev, preferred_sectors: [...list, sector] }));
                    } else {
                      setProfile((prev) => ({ ...prev, preferred_sectors: list.filter((s) => s !== sector) }));
                    }
                  }}
                  className="sr-only"
                />
                <span className="text-sm font-medium">{sector}</span>
              </label>
            );
          })}
        </div>
        <p className="text-sm text-gray-600 mt-2">Select your preferred industry sectors (optional)</p>
      </FormField>

      <FormField label="Maximum Distance from Location (km)" error={errors.max_distance_km}>
        <div className="space-y-2">
          <input
            type="range"
            min="10"
            max="200"
            step="10"
            value={profile.max_distance_km || 50}
            onChange={(e) => setProfile((prev) => ({ ...prev, max_distance_km: parseInt(e.target.value) }))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
          />
          <div className="flex justify-between text-sm text-gray-600">
            <span>10 km</span>
            <span className="font-medium">{profile.max_distance_km || 50} km</span>
            <span>200+ km</span>
          </div>
        </div>
        <p className="text-sm text-gray-600 mt-2">How far are you willing to travel for internships?</p>
      </FormField>

      <FormField label="Preferred Location" required error={errors.location}>
        <select
          value={profile.location || ''}
          onChange={(e) => setProfile((prev) => ({ ...prev, location: e.target.value }))}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
        >
          <option value="">Select your city</option>
          {cities.map((city) => (
            <option key={city} value={city}>{city}</option>
          ))}
        </select>
      </FormField>

      <div>
        <label className="flex items-center space-x-3 cursor-pointer">
          <input
            type="checkbox"
            checked={!!profile.remote_ok}
            onChange={(e) => setProfile((prev) => ({ ...prev, remote_ok: e.target.checked }))}
            className="w-5 h-5 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
          />
          <span className="text-gray-700 font-medium">I'm open to remote work</span>
        </label>
      </div>

      <FormField label="Minimum Stipend (₹ per month)">
        <div className="space-y-2">
          <input
            type="range"
            min="0"
            max="25000"
            step="1000"
            value={profile.stipend_min || 0}
            onChange={(e) => setProfile((prev) => ({ ...prev, stipend_min: parseInt(e.target.value) }))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
          />
          <div className="flex justify-between text-sm text-gray-600">
            <span>₹0 (No preference)</span>
            <span className="font-medium">₹{(profile.stipend_min || 0).toLocaleString()}</span>
            <span>₹25,000+</span>
          </div>
        </div>
      </FormField>
    </div>
  );

  const renderConstraintsStep = () => (
    <div className="space-y-6">
      <FormField label="When can you start?" required error={errors.start_date}>
        <input
          type="date"
          min={new Date().toISOString().split('T')[0]}
          value={profile.availability?.start || ''}
          onChange={(e) =>
            setProfile((prev) => ({
              ...prev,
              availability: { ...prev.availability, start: e.target.value, hours_per_week: prev.availability?.hours_per_week || 20 }
            }))
          }
          className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
        />
      </FormField>

      <FormField label="Hours per week" required error={errors.hours_per_week}>
        <select
          value={profile.availability?.hours_per_week || ''}
          onChange={(e) =>
            setProfile((prev) => ({
              ...prev,
              availability: { ...prev.availability, hours_per_week: parseInt(e.target.value), start: prev.availability?.start || '' }
            }))
          }
          className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
        >
          <option value="">Select hours per week</option>
          <option value="10">10 hours (Part-time)</option>
          <option value="20">20 hours (Half-time)</option>
          <option value="30">30 hours (Most time)</option>
          <option value="40">40 hours (Full-time)</option>
        </select>
      </FormField>

      <FormField label="Any accessibility needs or special requirements?">
        <textarea
          value={profile.accessibility_needs || ''}
          onChange={(e) => setProfile((prev) => ({ ...prev, accessibility_needs: e.target.value }))}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
          rows={3}
          placeholder="Optional: Tell us about any accommodations you need..."
        />
      </FormField>
    </div>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 'education': return renderEducationStep();
      case 'skills': return renderSkillsStep();
      case 'interests': return renderInterestsStep();
      case 'constraints': return renderConstraintsStep();
      default: return null;
    }
  };

  const isLastStep = currentStep === stepStates[stepStates.length - 1].id;
  const isFirstStep = currentStep === stepStates[0].id;

  return (
    <div className="min-h-screen bg-gray-50">
      <Stepper steps={stepStates} currentStep={currentStep} />

      <main className="max-w-2xl mx-auto px-4 py-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          {renderStepContent()}
          {renderSubmitError()}

          <div className="flex justify-between mt-8">
            {!isFirstStep && (
              <button
                onClick={handlePrev}
                className="flex items-center px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </button>
            )}

            <div className="flex-1" />

            <button
              onClick={isLastStep ? handleSubmit : handleNext}
              disabled={submitting || !isOnline}
              className="flex items-center px-6 py-3 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLastStep ? (submitting ? 'Saving…' : 'Get My Matches') : 'Next'}
              <ArrowRight className="w-4 h-4 ml-2" />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
