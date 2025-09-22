import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Target } from 'lucide-react';
import AppBar from '../components/AppBar';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { apiClient } from '../api/apiClient';

export default function SignupPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    role: 'candidate' as 'candidate' | 'admin',
    termsAccepted: false,
  });

  const [errors, setErrors] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    termsAccepted: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const isOnline = useOnlineStatus();
  const navigate = useNavigate();

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) return 'Email is required';
    if (!emailRegex.test(email)) return 'Invalid email address';
    return '';
  };

  const validatePassword = (password: string) => {
    if (!password) return 'Password is required';
    if (password.length < 8) return 'Password must be at least 8 characters';
    return '';
  };

  const validateConfirmPassword = (confirmPassword: string, password: string) => {
    if (!confirmPassword) return 'Please confirm your password';
    if (confirmPassword !== password) return 'Passwords do not match';
    return '';
  };

  const validateTerms = (accepted: boolean) => {
    return accepted ? '' : 'You must accept the Terms of Service and Privacy Policy';
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type, checked } = e.target as HTMLInputElement;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    setErrors(prev => ({ ...prev, [name]: '' }));
    setSubmitError('');
  };

  const validateAll = () => {
    const emailError = validateEmail(formData.email);
    const passwordError = validatePassword(formData.password);
    const confirmPasswordError = validateConfirmPassword(formData.confirmPassword, formData.password);
    const termsError = validateTerms(formData.termsAccepted);

    setErrors({
      email: emailError,
      password: passwordError,
      confirmPassword: confirmPasswordError,
      termsAccepted: termsError,
    });

    return !(emailError || passwordError || confirmPasswordError || termsError);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    if (!validateAll()) return;
    setIsLoading(true);
    try {
      const response = await apiClient.register({
        email: formData.email,
        password: formData.password,
        role: formData.role
      });
      // Persist token and user on successful registration (wrapped under data)
      localStorage.setItem('token', (response as any)?.data?.token);
      localStorage.setItem('user', JSON.stringify((response as any)?.data?.user));
      // New users won't have a profile yet; go to profile page to fill it
      navigate('/profile');
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to create account. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* <AppBar /> */}
      <main className="max-w-md mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl flex items-center justify-center">
            <Target className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Join Udaan</h1>
          <p className="text-gray-600">Create your account to start your internship journey</p>
        </div>

        {!isOnline && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-800 text-sm">
              You're currently offline. Please connect to the internet to create an account.
            </p>
          </div>
        )}

        {submitError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg" aria-live="polite">
            <p className="text-red-800 text-sm">{submitError}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6" aria-label="Sign up form" noValidate>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleChange}
                className={`block w-full pl-10 pr-3 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                  errors.email ? 'border-red-400' : 'border-gray-300'
                }`}
                placeholder="Enter your email"
                aria-describedby="email-error"
                disabled={!isOnline}
              />
            </div>
            {errors.email && (
              <p className="mt-1 text-xs text-red-600" id="email-error" role="alert">
                {errors.email}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
              I am a
            </label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              disabled={!isOnline}
            >
              <option value="candidate">Student/Job Seeker</option>
              <option value="admin">Organization/Admin</option>
            </select>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  aria-describedby="password-error password-requirements"
                  className={`block w-full pl-10 pr-3 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                    errors.password ? 'border-red-400' : 'border-gray-300'
                  }`}
                  placeholder="Create a password"
                  disabled={!isOnline}
                />
              </div>
              <p id="password-requirements" className="text-xs text-gray-500 mt-2">
                Must be at least 8 characters.
              </p>
              {errors.password && (
                <p className="mt-1 text-xs text-red-600" id="password-error" role="alert">
                  {errors.password}
                </p>
              )}
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
              Confirm Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                aria-describedby="confirm-password-error"
                className={`block w-full pl-10 pr-3 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                  errors.confirmPassword ? 'border-red-400' : 'border-gray-300'
                }`}
                placeholder="Confirm your password"
                disabled={!isOnline}
              />
            </div>
            {errors.confirmPassword && (
              <p className="mt-1 text-xs text-red-600" id="confirm-password-error" role="alert">
                {errors.confirmPassword}
              </p>
            )}
          </div>

          <div className="flex items-center">
            <input
              id="terms"
              name="termsAccepted"
              type="checkbox"
              checked={formData.termsAccepted}
              onChange={handleChange}
              required
              className={`h-4 w-4 text-orange-500 focus:ring-orange-500 border-gray-300 rounded ${
                errors.termsAccepted ? 'border-red-400' : ''
              }`}
              aria-describedby="terms-error"
              disabled={!isOnline}
            />
            <label htmlFor="terms" className="ml-2 block text-sm text-gray-700">
              I agree to the{' '}
              <Link to="/terms" className="text-orange-500 hover:text-orange-600 underline">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link to="/privacy" className="text-orange-500 hover:text-orange-600 underline">
                Privacy Policy
              </Link>
            </label>
          </div>
          {errors.termsAccepted && (
            <p className="mt-1 text-xs text-red-600" id="terms-error" role="alert">
              {errors.termsAccepted}
            </p>
          )}

          <button
            type="submit"
            disabled={!isOnline || isLoading}
            className="w-full flex items-center justify-center px-6 py-3 bg-orange-500 text-white font-semibold rounded-lg hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="text-orange-500 font-semibold hover:text-orange-600">
              Sign in
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
