// client/src/pages/FeedbackPage.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ThumbsUp, ThumbsDown, Mic, MicOff, Send, CheckCircle } from 'lucide-react';
import AppBar from '../components/AppBar';
import Toast from '../components/Toast';
import { apiClient } from '../api/apiClient';

export default function FeedbackPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();

  // Optional: /feedback?internship=<MongoId>
  const rawInternshipId = params.get('internship') || '';
  const internshipId = useMemo(
    () => (/^[a-fA-F0-9]{24}$/.test(rawInternshipId) ? rawInternshipId : undefined),
    [rawInternshipId]
  );

  const [rating, setRating] = useState<'up' | 'down' | null>(null);
  const [textFeedback, setTextFeedback] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null); // UI only (not uploaded yet)
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] =
    useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Guard: redirect if not logged in (server needs Authorization)
  useEffect(() => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!token) navigate('/login');
  }, [navigate]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];
      recorder.addEventListener('dataavailable', (e) => chunks.push(e.data));
      recorder.addEventListener('stop', () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        setAudioBlob(blob);
        stream.getTracks().forEach((t) => t.stop());
      });
      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch {
      setToast({ message: 'Could not access microphone. Please check permissions.', type: 'error' });
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
      setMediaRecorder(null);
    }
  };

  const handleSubmit = async () => {
    if (!rating) {
      setToast({ message: 'Please give a thumbs up or down rating.', type: 'error' });
      return;
    }

    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!token) {
      setToast({ message: 'Please log in to submit feedback.', type: 'error' });
      navigate('/login');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        rating,
        text: textFeedback.trim() || undefined,
        internship: internshipId, // only sent if valid 24-char
      };
      await apiClient.submitFeedback(payload);
      setSubmitted(true);
    } catch (error) {
      console.error('Submit feedback error:', error);
      const msg =
        error instanceof Error ? error.message : 'Failed to submit feedback. Please try again.';
      setToast({ message: msg, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AppBar />
        <main className="max-w-2xl mx-auto px-4 py-12">
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Thank you for your feedback!</h1>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Your input helps us improve Udaan and provide better internship recommendations for all students.
            </p>
            <div className="space-y-3 sm:space-y-0 sm:space-x-3 sm:flex sm:justify-center">
              <button
                onClick={() => navigate('/results')}
                className="w-full sm:w-auto px-6 py-3 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                Back to Results
              </button>
              <button
                onClick={() => navigate('/')}
                className="w-full sm:w-auto px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                Start Over
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AppBar showBack onBack={() => navigate('/results')} />

      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">How were your recommendations?</h1>
          <p className="text-gray-600 mb-8">
            Your feedback helps us improve our matching algorithm and provide better recommendations.
          </p>

          {/* Rating */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Were these helpful?</h2>
            <div className="flex justify-center space-x-6">
              <button
                onClick={() => setRating('up')}
                className={`flex flex-col items-center p-6 rounded-lg border-2 transition-all ${
                  rating === 'up'
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-green-300 hover:bg-green-50'
                }`}
                aria-label="Thumbs up - recommendations were helpful"
              >
                <ThumbsUp className="w-8 h-8 mb-2" />
                <span className="font-medium">Helpful</span>
              </button>

              <button
                onClick={() => setRating('down')}
                className={`flex flex-col items-center p-6 rounded-lg border-2 transition-all ${
                  rating === 'down'
                    ? 'border-red-500 bg-red-50 text-red-700'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-red-300 hover:bg-red-50'
                }`}
                aria-label="Thumbs down - recommendations were not helpful"
              >
                <ThumbsDown className="w-8 h-8 mb-2" />
                <span className="font-medium">Not helpful</span>
              </button>
            </div>
          </div>

          {/* Text Feedback */}
          <div className="mb-8">
            <label className="block text-lg font-semibold text-gray-900 mb-4">
              Tell us more (optional)
            </label>
            <textarea
              value={textFeedback}
              onChange={(e) => setTextFeedback(e.target.value)}
              placeholder="What could we improve? Any specific feedback about the recommendations?"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
              rows={4}
              maxLength={500}
            />
            <div className="text-right text-sm text-gray-500 mt-2">{textFeedback.length}/500</div>
          </div>

          {/* Voice Feedback (UI only for now) */}
          <div className="mb-8">
            <label className="block text-lg font-semibold text-gray-900 mb-4">
              Or record a voice note (optional)
            </label>
            <div className="flex items-center space-x-4">
              {!isRecording ? (
                <button
                  onClick={startRecording}
                  className="flex items-center px-4 py-2 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={!!audioBlob}
                >
                  <Mic className="w-4 h-4 mr-2" />
                  {audioBlob ? 'Voice note recorded' : 'Start recording (30s max)'}
                </button>
              ) : (
                <button
                  onClick={stopRecording}
                  className="flex items-center px-4 py-2 bg-red-50 border border-red-200 text-red-700 rounded-lg hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <MicOff className="w-4 h-4 mr-2" />
                  Stop recording
                </button>
              )}

              {audioBlob && (
                <button onClick={() => setAudioBlob(null)} className="text-sm text-gray-500 hover:text-gray-700">
                  Remove
                </button>
              )}
            </div>

            {isRecording && (
              <div className="mt-3 flex items-center">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse mr-2" />
                <span className="text-sm text-red-600">Recording... Click stop when done</span>
              </div>
            )}
          </div>

          {/* Submit */}
          <div className="flex justify-end">
            <button
              onClick={handleSubmit}
              disabled={!rating || loading}
              className="flex items-center px-6 py-3 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-5 h-5 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="w-5 h-5 mr-2" />
              )}
              Submit Feedback
            </button>
          </div>
        </div>
      </main>

      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
