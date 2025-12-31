import React, { useState, useEffect, useCallback } from 'react';
import { uploadImage, getCustomSubjects, createCustomSubject, deleteCustomSubject } from '../services/api';

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
  const [customSubject, setCustomSubject] = useState('');
  const [category, setCategory] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  // eslint-disable-next-line no-unused-vars
  const [grade, setGrade] = useState(user?.grade || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [uploadProgress, setUploadProgress] = useState(null);
  const [wrongOnly, setWrongOnly] = useState(true); // Default: extract only wrong questions
  const [customSubjects, setCustomSubjects] = useState([]); // User's saved custom subjects
  const [savingSubject, setSavingSubject] = useState(false);

  // Load custom subjects on mount
  const loadCustomSubjects = useCallback(async () => {
    try {
      const subjects = await getCustomSubjects();
      setCustomSubjects(subjects);
    } catch (err) {
      console.error('Failed to load custom subjects:', err);
    }
  }, []);

  useEffect(() => {
    loadCustomSubjects();
  }, [loadCustomSubjects]);

  // Save custom subject to database
  const handleSaveCustomSubject = async () => {
    if (!customSubject.trim()) return;

    setSavingSubject(true);
    try {
      await createCustomSubject(customSubject.trim());
      await loadCustomSubjects(); // Refresh the list
      setSubject(customSubject.trim()); // Switch to the newly created subject
      setCustomSubject(''); // Clear the input
      setSuccess('Custom subject saved!');
      setTimeout(() => setSuccess(''), 2000);
    } catch (err) {
      if (err.response?.data?.detail === 'Subject already exists') {
        setError('This subject already exists');
      } else {
        setError('Failed to save custom subject');
      }
    } finally {
      setSavingSubject(false);
    }
  };

  // Delete custom subject
  const handleDeleteCustomSubject = async (subjectId, subjectName) => {
    try {
      await deleteCustomSubject(subjectId);
      await loadCustomSubjects(); // Refresh the list
      // If the deleted subject was selected, reset selection
      if (subject === subjectName) {
        setSubject('');
      }
    } catch (err) {
      setError('Failed to delete subject');
    }
  };

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
    if (newSubject !== 'custom') {
      setCustomSubject(''); // Clear custom subject when switching away
    }
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

    // Validate custom subject if "custom" is selected
    if (subject === 'custom' && !customSubject.trim()) {
      setError('Please enter a custom subject');
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

      // Use custom values if "custom" is selected
      const finalSubject = subject === 'custom' ? customSubject.trim() : subject;
      const finalCategory = category === 'custom' ? customCategory.trim() : category;

      const result = await uploadImage(selectedFile, finalSubject, grade, finalCategory, wrongOnly);

      setUploadProgress({ status: wrongOnly ? 'Extracting wrong questions...' : 'Extracting all questions...', percent: 90 });

      setTimeout(() => {
        setSuccess(`Successfully extracted ${result.questions_count} question(s)!`);
        setUploadProgress(null);
        setSelectedFile(null);
        setPreview(null);
        setSubject('');
        setCustomSubject('');
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

  const handlePaste = (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          const fakeEvent = { target: { files: [file] } };
          handleFileChange(fakeEvent);
        }
        break;
      }
    }
  };

  // Add paste event listener
  useEffect(() => {
    const handleGlobalPaste = (e) => {
      // Only handle paste if we're on this component and no input is focused
      const activeElement = document.activeElement;
      if (!activeElement || activeElement.tagName === 'BODY' || activeElement.tagName === 'DIV') {
        handlePaste(e);
      }
    };

    window.addEventListener('paste', handleGlobalPaste);
    return () => window.removeEventListener('paste', handleGlobalPaste);
  }, []);

  return (
    <div className="max-w-2xl mx-auto min-h-[calc(100vh-200px)] flex flex-col justify-center">
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
        {/* Subject & Category Selection - Side by Side */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Subject */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
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
                {/* Custom subjects saved by user */}
                {customSubjects.length > 0 && (
                  <option disabled className="text-gray-400">── My Subjects ──</option>
                )}
                {customSubjects.map((cs) => (
                  <option key={`custom-${cs.id}`} value={cs.name} className="text-gray-900">
                    {cs.name}
                  </option>
                ))}
                <option value="custom" className="text-gray-900">➕ Add New Subject...</option>
              </select>

              {/* Custom subjects with delete buttons */}
              {customSubjects.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {customSubjects.map((cs) => (
                    <span
                      key={cs.id}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs"
                    >
                      {cs.name}
                      <button
                        type="button"
                        onClick={() => handleDeleteCustomSubject(cs.id, cs.name)}
                        className="text-blue-400 hover:text-red-500 transition-colors"
                        title="Delete subject"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* Custom Subject Input - shows when "Add New Subject..." is selected */}
              {subject === 'custom' && (
                <div className="mt-3 flex gap-2">
                  <input
                    type="text"
                    value={customSubject}
                    onChange={(e) => setCustomSubject(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleSaveCustomSubject();
                      }
                    }}
                    placeholder="Enter subject name (e.g., Psychology)"
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
                    maxLength={50}
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={handleSaveCustomSubject}
                    disabled={!customSubject.trim() || savingSubject}
                    className="px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {savingSubject ? '...' : 'Save'}
                  </button>
                </div>
              )}
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Category <span className="text-gray-400 font-normal">(Optional)</span>
              </label>
              <select
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  if (e.target.value !== 'custom') {
                    setCustomCategory('');
                  }
                }}
                disabled={!subject || subject === 'custom' || (!CATEGORY_OPTIONS[subject] && !customSubjects.find(cs => cs.name === subject))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="" className="text-gray-900">
                  {!subject ? 'Select subject first' : subject === 'custom' ? 'Save subject first' : 'Select category (optional)'}
                </option>
                {subject && subject !== 'custom' && CATEGORY_OPTIONS[subject]?.map((cat) => (
                  <option key={cat} value={cat} className="text-gray-900">{cat}</option>
                ))}
                {subject && subject !== 'custom' && (CATEGORY_OPTIONS[subject]?.length > 0 || customSubjects.find(cs => cs.name === subject)) && (
                  <option value="custom" className="text-gray-900">✏️ Custom...</option>
                )}
                {/* For custom subjects, allow custom category */}
                {subject && subject !== 'custom' && !CATEGORY_OPTIONS[subject] && customSubjects.find(cs => cs.name === subject) && (
                  <option value="custom" className="text-gray-900">✏️ Add Category...</option>
                )}
              </select>
            </div>
          </div>

          {/* Custom Category Input - shows when "Custom..." is selected */}
          {category === 'custom' && (
            <div className="mt-4">
              <input
                type="text"
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                placeholder="Enter custom category (e.g., Linear Equations)"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
                maxLength={50}
              />
            </div>
          )}
        </div>

        {/* File Upload */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex justify-between items-center mb-3">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200">
              Upload Image *
            </label>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">Wrong Questions Only</span>
              <button
                type="button"
                onClick={() => setWrongOnly(!wrongOnly)}
                className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  wrongOnly ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                }`}
                role="switch"
                aria-checked={wrongOnly}
                title={wrongOnly ? 'Extract only wrong questions (marked with ✗)' : 'Extract all questions from image'}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    wrongOnly ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {!preview ? (
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center hover:border-blue-400 transition-colors cursor-pointer"
            >
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <svg className="mx-auto h-10 w-10 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                  <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <p className="mt-2 text-sm text-gray-600">
                  <span className="font-semibold text-blue-600">Click</span>, Drag & Drop, or <span className="font-semibold text-blue-600">Paste</span> (Ctrl+V)
                </p>
                <p className="text-xs text-gray-400 mt-1">PNG, JPG, JPEG up to 10MB</p>
              </label>

              {/* Tips inside upload area */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-400 leading-relaxed">
                  💡 <span className="font-medium">Tips:</span> Clear, well-lit image • One page at a time
                  {wrongOnly && ' • Ensure ✓ and ✗ marks are visible'}
                </p>
              </div>
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
    </div>
  );
};

export default Upload;
