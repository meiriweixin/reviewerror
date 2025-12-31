import React, { useState } from 'react';
import { X, Camera, Upload as UploadIcon, AlertCircle, CheckCircle2, FileText, BookOpen } from 'lucide-react';
import { captureQuestion } from '../services/api';

const SUBJECTS = [
  'Mathematics',
  'English',
  'Science',
  'Physics',
  'Chemistry',
  'Biology',
  'History',
  'Geography',
  'Literature',
  'Economics',
  'Computer Science',
  'Art',
  'Music',
  'Physical Education',
];

const CATEGORIES = [
  'Algebra',
  'Geometry',
  'Calculus',
  'Statistics',
  'Trigonometry',
  'Probability',
  'Number Theory',
  'Grammar',
  'Vocabulary',
  'Reading Comprehension',
  'Writing',
  'Speaking',
  'Listening',
  'Mechanics',
  'Thermodynamics',
  'Electricity',
  'Magnetism',
  'Optics',
  'Waves',
  'Atomic Structure',
  'Chemical Bonding',
  'Stoichiometry',
  'Organic Chemistry',
  'Redox Reactions',
  'Cell Biology',
  'Genetics',
  'Evolution',
  'Ecology',
  'Human Anatomy',
  'Other',
];

const PDFViewer = ({ paper, fileUrl, onClose, user, customSubjects = [] }) => {
  const [showCaptureModal, setShowCaptureModal] = useState(false);
  const [captureForm, setCaptureForm] = useState({
    file: null,
    subject: paper?.subject || '',
    grade: user?.grade || '',
    category: '',
    note: '',
  });
  const [customCategory, setCustomCategory] = useState('');
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Filter categories based on selected subject
  const getRelevantCategories = () => {
    const subject = captureForm.subject.toLowerCase();
    if (subject.includes('math')) {
      return CATEGORIES.filter(cat =>
        ['Algebra', 'Geometry', 'Calculus', 'Statistics', 'Trigonometry', 'Probability', 'Number Theory', 'Other'].includes(cat)
      );
    } else if (subject.includes('english')) {
      return CATEGORIES.filter(cat =>
        ['Grammar', 'Vocabulary', 'Reading Comprehension', 'Writing', 'Speaking', 'Listening', 'Other'].includes(cat)
      );
    } else if (subject.includes('physics')) {
      return CATEGORIES.filter(cat =>
        ['Mechanics', 'Thermodynamics', 'Electricity', 'Magnetism', 'Optics', 'Waves', 'Other'].includes(cat)
      );
    } else if (subject.includes('chemistry')) {
      return CATEGORIES.filter(cat =>
        ['Atomic Structure', 'Chemical Bonding', 'Stoichiometry', 'Organic Chemistry', 'Redox Reactions', 'Other'].includes(cat)
      );
    } else if (subject.includes('biology')) {
      return CATEGORIES.filter(cat =>
        ['Cell Biology', 'Genetics', 'Evolution', 'Ecology', 'Human Anatomy', 'Other'].includes(cat)
      );
    }
    return ['Other'];
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setMessage({ type: 'error', text: 'Please select an image file' });
        return;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setMessage({ type: 'error', text: 'File size must be less than 10MB' });
        return;
      }

      setCaptureForm(prev => ({ ...prev, file }));

      // Generate preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);

      setMessage({ type: '', text: '' });
    }
  };

  const handleCapture = async () => {
    if (!captureForm.file) {
      setMessage({ type: 'error', text: 'Please select a question snippet image' });
      return;
    }

    if (!captureForm.subject) {
      setMessage({ type: 'error', text: 'Please select a subject' });
      return;
    }

    // Validate custom category if "custom" is selected
    if (captureForm.category === 'custom' && !customCategory.trim()) {
      setMessage({ type: 'error', text: 'Please enter a custom category' });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      // Use custom category if "custom" is selected, otherwise use selected category
      const finalCategory = captureForm.category === 'custom' ? customCategory.trim() : captureForm.category;

      await captureQuestion(
        captureForm.file,
        captureForm.subject,
        captureForm.grade,
        finalCategory,
        captureForm.note,
        paper.id
      );

      setMessage({
        type: 'success',
        text: 'Question captured successfully! Check the Review tab to see it.'
      });

      // Reset form
      setCaptureForm({
        file: null,
        subject: paper?.subject || '',
        grade: user?.grade || '',
        category: '',
        note: '',
      });
      setCustomCategory('');
      setPreviewUrl(null);

      // Close modal after 2 seconds
      setTimeout(() => {
        setShowCaptureModal(false);
        setMessage({ type: '', text: '' });
      }, 2000);
    } catch (error) {
      console.error('Failed to capture question:', error);
      setMessage({
        type: 'error',
        text: error.response?.data?.detail || 'Failed to capture question. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-7xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-br from-orange-500 to-blue-500 p-3 rounded-xl">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {paper?.title}
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm px-2 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-md">
                  {paper?.subject}
                </span>
                {paper?.grade && (
                  <span className="text-sm px-2 py-1 bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 rounded-md">
                    {paper.grade.toUpperCase()}
                  </span>
                )}
                {paper?.year && (
                  <span className="text-sm px-2 py-1 bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 rounded-md">
                    {paper.year}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowCaptureModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-blue-500 text-white rounded-xl hover:shadow-lg transition-all"
            >
              <Camera className="h-5 w-5" />
              <span>Capture Question</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* PDF Viewer */}
        <div className="flex-1 overflow-hidden p-6">
          <div className="h-full rounded-xl border-2 border-gray-200 dark:border-gray-800 overflow-hidden bg-gray-50 dark:bg-gray-950">
            <iframe
              src={fileUrl}
              className="w-full h-full"
              title={paper?.title}
            />
          </div>
        </div>

        {/* Instructions */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-800 bg-blue-50 dark:bg-blue-900/20">
          <div className="flex items-start gap-3">
            <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-1">
                How to capture questions:
              </h3>
              <ol className="text-sm text-blue-800 dark:text-blue-400 space-y-1">
                <li>1. Take a screenshot of the question you got wrong from the PDF above</li>
                <li>2. Click "Capture Question" button</li>
                <li>3. Upload the screenshot and optionally add notes</li>
                <li>4. The question will appear in your Review tab for practice</li>
              </ol>
            </div>
          </div>
        </div>
      </div>

      {/* Capture Modal */}
      {showCaptureModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-orange-500 to-blue-500 p-2 rounded-lg">
                  <Camera className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  Capture Question
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowCaptureModal(false);
                  setMessage({ type: '', text: '' });
                  setPreviewUrl(null);
                  setCustomCategory('');
                }}
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              {/* Message Display */}
              {message.text && (
                <div
                  className={`flex items-center gap-2 p-4 rounded-xl ${
                    message.type === 'success'
                      ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300'
                      : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300'
                  }`}
                >
                  {message.type === 'success' ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : (
                    <AlertCircle className="h-5 w-5" />
                  )}
                  <p className="text-sm font-medium">{message.text}</p>
                </div>
              )}

              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Question Screenshot *
                </label>
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                    id="capture-file-input"
                  />
                  <label
                    htmlFor="capture-file-input"
                    className="flex items-center justify-center gap-2 p-8 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl cursor-pointer hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all"
                  >
                    <UploadIcon className="h-6 w-6 text-gray-400" />
                    <span className="text-gray-600 dark:text-gray-400">
                      {captureForm.file ? captureForm.file.name : 'Click to upload question screenshot'}
                    </span>
                  </label>
                </div>

                {/* Preview */}
                {previewUrl && (
                  <div className="mt-4">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Preview:</p>
                    <img
                      src={previewUrl}
                      alt="Question preview"
                      className="w-full rounded-xl border border-gray-200 dark:border-gray-800"
                    />
                  </div>
                )}
              </div>

              {/* Subject */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Subject *
                </label>
                <select
                  value={captureForm.subject}
                  onChange={(e) => setCaptureForm(prev => ({ ...prev, subject: e.target.value, category: '' }))}
                  className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select subject</option>
                  {SUBJECTS.map((subject) => (
                    <option key={subject} value={subject}>
                      {subject}
                    </option>
                  ))}
                  {/* Custom subjects saved by user */}
                  {customSubjects.length > 0 && (
                    <option disabled className="text-gray-400">── My Subjects ──</option>
                  )}
                  {customSubjects.map((cs) => (
                    <option key={`custom-${cs.id}`} value={cs.name}>
                      {cs.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Category */}
              {captureForm.subject && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Category (Optional)
                  </label>
                  <select
                    value={captureForm.category}
                    onChange={(e) => {
                      setCaptureForm(prev => ({ ...prev, category: e.target.value }));
                      if (e.target.value !== 'custom') {
                        setCustomCategory(''); // Clear custom input when switching away from custom
                      }
                    }}
                    className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select category (optional)</option>
                    {getRelevantCategories().map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                    {getRelevantCategories().length > 0 && (
                      <option value="custom">✏️ Custom...</option>
                    )}
                  </select>

                  {/* Custom Category Input - shows when "Custom..." is selected */}
                  {captureForm.category === 'custom' && (
                    <div className="mt-3">
                      <input
                        type="text"
                        value={customCategory}
                        onChange={(e) => setCustomCategory(e.target.value)}
                        placeholder="Enter your custom category (e.g., Linear Equations, Quadratic Functions)"
                        className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        maxLength={50}
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        Create your own category for better organization
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Note */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Note (Optional)
                </label>
                <textarea
                  value={captureForm.note}
                  onChange={(e) => setCaptureForm(prev => ({ ...prev, note: e.target.value }))}
                  placeholder="Add any notes about this question (optional)"
                  rows={3}
                  className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  If you add a note, AI will generate an explanation for you
                </p>
              </div>

              {/* Grade Info */}
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl">
                <p className="text-sm text-blue-800 dark:text-blue-300">
                  <strong>Grade:</strong> {captureForm.grade.toUpperCase() || 'Not set'}
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                  Questions will be tagged with your current grade setting
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-800">
              <button
                onClick={() => {
                  setShowCaptureModal(false);
                  setMessage({ type: '', text: '' });
                  setPreviewUrl(null);
                  setCustomCategory('');
                }}
                className="px-6 py-2 rounded-xl border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={handleCapture}
                disabled={loading || !captureForm.file || !captureForm.subject}
                className="px-6 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-blue-500 text-white hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Capturing...' : 'Capture Question'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PDFViewer;
