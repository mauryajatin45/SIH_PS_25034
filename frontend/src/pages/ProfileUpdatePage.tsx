import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../api/apiClient';
import FormField from '../components/FormField';
import ChipInput from '../components/ChipInput';
import { CandidateProfile } from '../types';
import { educationLevels, fields, skillSuggestions, interestOptions, cities, jobRoleOptions } from '../data/mockData';

export default function ProfileUpdatePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<Partial<CandidateProfile>>({
    skills: [],
    interests: [],
    locations: [],
    remote_ok: false,
    stipend_min: 0,
    availability: { start: '', hours_per_week: 20 } as any,
    accessibility_needs: 'None',
    max_distance_km: 50,
    preferred_job_roles: [],
    preferred_sectors: [],
  });

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await apiClient.getMyCandidate();
        if (res?.success && res.data) {
          const c = res.data;
          setProfile({
            education_level: c.education_level,
            field: c.field,
            grad_year: c.grad_year,
            skills: c.skills || [],
            interests: c.interests || [],
            locations: c.locations || [],
            remote_ok: c.remote_ok,
            stipend_min: c.stipend_min,
            availability: { start: (c.availability?.start || '').slice(0,10), hours_per_week: c.availability?.hours_per_week || 20 } as any,
            accessibility_needs: c.accessibility_needs || 'None',
            max_distance_km: c.max_distance_km || 50,
            preferred_job_roles: c.preferred_job_roles || [],
            preferred_sectors: c.preferred_sectors || [],
          });
        }
      } catch (e: any) {
        setError(e?.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      const payload = {
        education_level: profile.education_level,
        field: profile.field,
        grad_year: profile.grad_year,
        skills: profile.skills || [],
        interests: profile.interests || [],
        locations: profile.locations || [],
        remote_ok: !!profile.remote_ok,
        stipend_min: typeof profile.stipend_min === 'number' ? profile.stipend_min : 0,
        availability: {
          start: profile.availability?.start,
          hours_per_week: profile.availability?.hours_per_week
        },
        accessibility_needs: profile.accessibility_needs || 'None',
        max_distance_km: typeof profile.max_distance_km === 'number' ? profile.max_distance_km : 50,
        preferred_job_roles: profile.preferred_job_roles || [],
        preferred_sectors: profile.preferred_sectors || [],
      };
      await apiClient.updateMyCandidate(payload);
      navigate('/results');
    } catch (e: any) {
      setError(e?.message || 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <main className="max-w-2xl mx-auto px-4 py-8">Loading…</main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-2xl mx-auto px-4 py-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h1 className="text-xl font-semibold mb-4">Update Profile</h1>
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
          )}

          <div className="space-y-6">
            <FormField label="Current Education Level">
              <select
                value={profile.education_level || ''}
                onChange={(e) => setProfile((prev) => ({ ...prev, education_level: e.target.value as any }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="">Select your level</option>
                {educationLevels.map((level) => (
                  <option key={level} value={level}>{level}</option>
                ))}
              </select>
            </FormField>

            <FormField label="Field of Study">
              <select
                value={profile.field || ''}
                onChange={(e) => setProfile((prev) => ({ ...prev, field: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="">Select your field</option>
                {fields.map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </FormField>

            <FormField label="Expected Graduation Year">
              <input
                type="number"
                min="2024"
                max="2030"
                value={profile.grad_year || ''}
                onChange={(e) => setProfile((prev) => ({ ...prev, grad_year: parseInt(e.target.value) }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </FormField>

            <FormField label="Skills">
              <ChipInput
                value={profile.skills || []}
                onChange={(skills) => setProfile((prev) => ({ ...prev, skills }))}
                suggestions={skillSuggestions}
                placeholder="Type a skill and press Enter"
                maxItems={15}
              />
            </FormField>

            <FormField label="Interests">
              <ChipInput
                value={profile.interests || []}
                onChange={(interests) => setProfile((prev) => ({ ...prev, interests }))}
                suggestions={interestOptions}
                placeholder="Type an interest and press Enter"
                maxItems={15}
              />
            </FormField>

            <FormField label="Preferred Locations">
              <ChipInput
                value={profile.locations || []}
                onChange={(locations) => setProfile((prev) => ({ ...prev, locations }))}
                suggestions={cities}
                placeholder="Type a city and press Enter"
                maxItems={10}
              />
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
              <input
                type="number"
                min={0}
                step={1000}
                value={profile.stipend_min || 0}
                onChange={(e) => setProfile((prev) => ({ ...prev, stipend_min: parseInt(e.target.value) }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </FormField>

            <FormField label="Availability Start Date">
              <input
                type="date"
                value={profile.availability?.start || ''}
                onChange={(e) => setProfile((prev) => ({ ...prev, availability: { ...(prev.availability as any), start: e.target.value } }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </FormField>

            <FormField label="Hours per week">
              <select
                value={profile.availability?.hours_per_week || 20}
                onChange={(e) => setProfile((prev) => ({ ...prev, availability: { ...(prev.availability as any), hours_per_week: parseInt(e.target.value) } }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={30}>30</option>
                <option value={40}>40</option>
              </select>
            </FormField>

            <FormField label="Accessibility needs">
              <input
                type="text"
                value={profile.accessibility_needs || ''}
                onChange={(e) => setProfile((prev) => ({ ...prev, accessibility_needs: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </FormField>

            <FormField label="Maximum Distance (km)">
              <input
                type="number"
                min={1}
                max={500}
                step={1}
                value={profile.max_distance_km || 50}
                onChange={(e) => setProfile((prev) => ({ ...prev, max_distance_km: parseInt(e.target.value) }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </FormField>

            <FormField label="Preferred Job Roles">
              <ChipInput
                value={profile.preferred_job_roles || []}
                onChange={(preferred_job_roles) => setProfile((prev) => ({ ...prev, preferred_job_roles }))}
                suggestions={jobRoleOptions}
                placeholder="Type a job role and press Enter"
                maxItems={15}
              />
            </FormField>

            <FormField label="Preferred Sectors">
              <ChipInput
                value={profile.preferred_sectors || []}
                onChange={(preferred_sectors) => setProfile((prev) => ({ ...prev, preferred_sectors }))}
                suggestions={interestOptions}
                placeholder="Type a sector and press Enter"
                maxItems={15}
              />
            </FormField>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="px-5 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="px-5 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}


