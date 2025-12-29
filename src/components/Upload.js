import React, { useState } from 'react';
import { uploadImage } from '../services/api';

const SUBJECTS = [
  'Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'Chinese',
  'Geography', 'History', 'Literature', 'Economics', 'Accounting',
  'Computer Science', 'Art', 'Music', 'Physical Education', 'Other'
];

// Category options based on selected subject (same as Review.js)
const CATEGORY_OPTIONS = {
  Mathematics: ['Algebra', 'Geometry', 'Arithmetic', 'Calculus', 'Statistics', 'Trigonometry'],
  Physics: ['Mechanics', 'Electricity', 'Magnetism', 'Thermodynamics', 'Optics', 'Modern Physics'],
  Chemistry: ['Organic Chemistry', 'Inorganic Chemistry', 'Physical Chemistry', 'Analytical Chemistry'],
  Biology: ['Cell Biology', 'Genetics', 'Evolution', 'Ecology', 'Human Biology', 'Botany'],
  English: ['Grammar', 'Comprehension', 'Composition', 'Literature', 'Vocabulary'],
  Chinese: ['Reading', 'Writing', 'Grammar', 'Comprehension', 'Composition'],
  Other: []
};

const Upload = ({ user }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  // eslint-disable-next-line no-unused-vars
  const [grade, setGrade] = useState(user?.grade || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [uploadProgress, setUploadProgress] = useState(null);
  const [wrongOnly, setWrongOnly] = useState(true); // Default: extract only wrong questions

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        setError('File size must be less than 10MB');
        return;
      }

      if (!file.type.startsWith('image/')) {
        setError('Please upload an image file');
        return;
      }

      setSelectedFile(file);
      setError('');

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle subject change - reset category when subject changes
  const handleSubjectChange = (newSubject) => {
    setSubject(newSubject);
    setCategory(''); // Reset category when subject changes
    setCustomCategory(''); // Reset custom category when subject changes
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedFile) {
      setError('Please select an image to upload');
      return;
    }

    if (!subject) {
      setError('Please select a subject');
      return;
    }

    // Validate custom category if "custom" is selected
    if (category === 'custom' && !customCategory.trim()) {
      setError('Please enter a custom category');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');
    setUploadProgress({ status: 'Uploading image...', percent: 30 });

    try {
      setUploadProgress({ status: 'Analyzing image with AI...', percent: 60 });

      // Use custom category if "custom" is selected, otherwise use selected category
      const finalCategory = category === 'custom' ? customCategory.trim() : category;

      const result = await uploadImage(selectedFile, subject, grade, finalCategory, wrongOnly);

      setUploadProgress({ status: wrongOnly ? 'Extracting wrong questions...' : 'Extracting all questions...', percent: 90 });

      setTimeout(() => {
        setSuccess(`Successfully extracted ${result.questions_count} question(s)!`);
        setUploadProgress(null);
        setSelectedFile(null);
        setPreview(null);
        setSubject('');
        setCategory('');
        setCustomCategory('');
        setLoading(false);
      }, 500);

    } catch (err) {
      console.error('Upload failed:', err);
      setError(err.response?.data?.detail || 'Failed to upload image. Please try again.');
      setUploadProgress(null);
      setLoading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      const fakeEvent = { target: { files: [file] } };
      handleFileChange(fakeEvent);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Upload Question Paper</h2>
        <p className="text-gray-600 mt-1">Upload scanned images of your exam papers or worksheets</p>
      </div>

      {/* Success Message */}
      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-2xl flex items-start gap-3">
          <svg className="w-5 h-5 text-green-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
          </svg>
          <p className="text-sm text-green-700">{success}</p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3">
          <svg className="w-5 h-5 text-red-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
          </svg>
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Subject Selection */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Subject *
          </label>
          <select
            value={subject}
            onChange={(e) => handleSubjectChange(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
            required
          >
            <option value="" className="text-gray-900">Select a subject</option>
            {SUBJECTS.map((sub) => (
              <option key={sub} value={sub} className="text-gray-900">{sub}</option>
            ))}
          </select>
        </div>

        {/* Category Selection */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Category <span className="text-gray-400 font-normal">(Optional)</span>
          </label>
          <select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              if (e.target.value !== 'custom') {
                setCustomCategory(''); // Clear custom input when switching away from custom
              }
            }}
            disabled={!subject || !CATEGORY_OPTIONS[subject] || CATEGORY_OPTIONS[subject].length === 0}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="" className="text-gray-900">
              {!subject ? 'Select a subject first' : 'Select a category (optional)'}
            </option>
            {subject && CATEGORY_OPTIONS[subject]?.map((cat) => (
              <option key={cat} value={cat} className="text-gray-900">{cat}</option>
            ))}
            {subject && CATEGORY_OPTIONS[subject] && CATEGORY_OPTIONS[subject].length > 0 && (
              <option value="custom" className="text-gray-900">✏️ Custom...</option>
            )}
          </select>

          {/* Custom Category Input - shows when "Custom..." is selected */}
          {category === 'custom' && (
            <div className="mt-3">
              <input
                type="text"
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                placeholder="Enter your custom category (e.g., Linear Equations, Quadratic Functions)"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
                maxLength={50}
              />
              <p className="text-xs text-gray-500 mt-2">
                Create your own category for better organization
              </p>
            </div>
          )}

          {subject && CATEGORY_OPTIONS[subject] && CATEGORY_OPTIONS[subject].length > 0 && category !== 'custom' && (
            <p className="text-xs text-gray-500 mt-2">
              Help organize questions by topic for easier filtering and review
            </p>
          )}
        </div>

        {/* Extraction Mode Toggle */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200">
                Wrong Questions Only
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {wrongOnly
                  ? 'Extract only questions marked with ✗ (crosses/wrong marks)'
                  : 'Extract ALL questions from the image regardless of marks'
                }
              </p>
            </div>
            <button
              type="button"
              onClick={() => setWrongOnly(!wrongOnly)}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                wrongOnly ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
              }`}
              role="switch"
              aria-checked={wrongOnly}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  wrongOnly ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* File Upload */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Upload Image *
          </label>

          {!preview ? (
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              className="border-2 border-dashed border-gray-300 rounded-2xl p-12 text-center hover:border-blue-400 transition-colors cursor-pointer"
            >
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                  <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <p className="mt-2 text-sm text-gray-600">
                  <span className="font-semibold text-blue-600">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-gray-500 mt-1">PNG, JPG, JPEG up to 10MB</p>
              </label>
            </div>
          ) : (
            <div className="relative">
              <img src={preview} alt="Preview" className="w-full rounded-2xl shadow-lg" />
              <button
                type="button"
                onClick={() => {
                  setSelectedFile(null);
                  setPreview(null);
                }}
                className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors shadow-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* Upload Progress */}
        {uploadProgress && (
          <div className="bg-blue-50 rounded-2xl border border-blue-200 p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
              <p className="text-sm font-medium text-blue-800">{uploadProgress.status}</p>
            </div>
            <div className="w-full bg-blue-100 rounded-full h-2.5">
              <div
                className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress.percent}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || !selectedFile || !subject}
          className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
        >
          {loading ? 'Processing...' : wrongOnly ? 'Analyze & Extract Wrong Questions' : 'Analyze & Extract All Questions'}
        </button>
      </form>

      {/* Info Box */}
      <div className="mt-8 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-2xl p-6">
        <h3 className="font-semibold text-blue-900 dark:text-blue-200 mb-2 flex items-center gap-2">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
          </svg>
          Tips for best results
        </h3>
        <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1 ml-7">
          <li>• Ensure the image is clear and well-lit</li>
          {wrongOnly && <li>• Make sure check marks (✓) and crosses (✗) are visible</li>}
          <li>• Upload one page at a time for better accuracy</li>
          <li>• Supported formats: PNG, JPG, JPEG</li>
        </ul>
      </div>
    </div>
  );
};

export default Upload;
