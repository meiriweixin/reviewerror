import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createQAQuestion } from '../../services/api';

const SUBJECTS = [
  'Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'Chinese',
  'Geography', 'History', 'Literature', 'Economics', 'Accounting',
  'Computer Science', 'Art', 'Music', 'Physical Education', 'Other'
];

const GRADES = [
  { value: 'p1', label: 'P1' },
  { value: 'p2', label: 'P2' },
  { value: 'p3', label: 'P3' },
  { value: 'p4', label: 'P4' },
  { value: 'p5', label: 'P5' },
  { value: 'p6', label: 'P6' },
  { value: 'sec1', label: 'SEC 1' },
  { value: 'sec2', label: 'SEC 2' },
  { value: 'sec3', label: 'SEC 3' },
  { value: 'sec4', label: 'SEC 4' },
  { value: 'sec5', label: 'SEC 5' },
  { value: 'jc1', label: 'JC 1' },
  { value: 'jc2', label: 'JC 2' },
  { value: 'poly', label: 'Polytechnic' },
  { value: 'uni', label: 'University' },
];

const SUGGESTED_TAGS = [
  'Algebra', 'Geometry', 'Calculus', 'Trigonometry', 'Statistics',
  'Mechanics', 'Thermodynamics', 'Electricity', 'Optics',
  'Organic Chemistry', 'Inorganic Chemistry', 'Physical Chemistry',
  'Cell Biology', 'Genetics', 'Ecology',
  'Grammar', 'Comprehension', 'Essay Writing',
  'Homework', 'Exam Prep', 'Concept Clarification'
];

const BOUNTY_PRESETS = [
  { value: 0, label: 'None (Free)' },
  { value: 1, label: '1 Credit' },
  { value: 2, label: '2 Credits' },
  { value: 'custom', label: 'Custom' }
];

const AskQuestionModal = ({ user, onClose, onQuestionCreated, customSubjects = [] }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [subject, setSubject] = useState('');
  const [grade, setGrade] = useState(user?.grade || '');
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [images, setImages] = useState([]);
  const [bountySelection, setBountySelection] = useState(0); // 0, 1, 2, or 'custom'
  const [customBountyInput, setCustomBountyInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef(null);
  const dropZoneRef = useRef(null);
  const tagInputRef = useRef(null);

  // Calculate actual bounty amount
  const bountyAmount = bountySelection === 'custom'
    ? (parseInt(customBountyInput) || 0)
    : bountySelection;

  // Handle clipboard paste for images
  useEffect(() => {
    const handlePaste = (e) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            addImage(file);
          }
        }
      }
    };

    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, []);

  const addImage = useCallback((file) => {
    if (!file.type.startsWith('image/')) {
      setError('Only image files are allowed');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB');
      return;
    }

    if (images.length >= 3) {
      setError('Maximum 3 images allowed');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setImages(prev => [...prev, {
        id: Date.now(),
        file,
        preview: e.target.result,
        name: file.name
      }]);
    };
    reader.readAsDataURL(file);
  }, [images.length]);

  const removeImage = (id) => {
    setImages(prev => prev.filter(img => img.id !== id));
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    files.forEach(file => addImage(file));
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => addImage(file));
    e.target.value = '';
  };

  const handleTagKeyDown = (e) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      addTag(tagInput.trim());
    } else if (e.key === 'Backspace' && !tagInput && tags.length > 0) {
      setTags(prev => prev.slice(0, -1));
    }
  };

  const addTag = (tag) => {
    if (tag && !tags.includes(tag) && tags.length < 5) {
      setTags(prev => [...prev, tag]);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove) => {
    setTags(prev => prev.filter(tag => tag !== tagToRemove));
  };

  const handleBountySelect = (value) => {
    setBountySelection(value);
    if (value !== 'custom') {
      setCustomBountyInput('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim() || !content.trim() || !subject) {
      setError('Please fill in all required fields');
      return;
    }

    if (bountySelection === 'custom' && (!customBountyInput || bountyAmount <= 0)) {
      setError('Please enter a valid bounty amount (positive integer)');
      return;
    }

    if (bountyAmount > (user?.credits || 0)) {
      setError(`Insufficient credits. You have ${user?.credits || 0} credits.`);
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Extract file objects from images state
      const imageFiles = images.map(img => img.file);

      await createQAQuestion({
        title: title.trim(),
        content: content.trim(),
        subject,
        grade: grade || user?.grade,
        bounty_amount: bountyAmount,
        tags: tags.length > 0 ? tags : undefined
      }, imageFiles);
      onQuestionCreated();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create question');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Ask a Question</h3>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-300 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Be specific and clear about your question..."
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                maxLength={255}
                required
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {title.length}/255 characters
              </p>
            </div>

            {/* Content */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                Details <span className="text-red-500">*</span>
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Describe your question here. It helps if you also describe what you've tried so far! You can use Markdown and LaTeX ($...$) for math expressions."
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all"
                rows={6}
                required
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Supports Markdown and LaTeX math ($...$)
              </p>
            </div>

            {/* Image Upload Dropzone */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                Attachments
              </label>
              <div
                ref={dropZoneRef}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
                  isDragging
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 bg-gray-50 dark:bg-gray-700/50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <svg className="mx-auto h-10 w-10 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-medium text-blue-600 dark:text-blue-400">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  PNG, JPG up to 5MB (max 3 images) • Paste with Ctrl+V
                </p>
              </div>

              {/* Image Previews */}
              {images.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {images.map((img) => (
                    <div key={img.id} className="relative group">
                      <img
                        src={img.preview}
                        alt={img.name}
                        className="h-20 w-20 object-cover rounded-lg border border-gray-200 dark:border-gray-600"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(img.id)}
                        className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 transition-colors shadow-sm"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Subject */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                Subject <span className="text-red-500">*</span>
              </label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                required
              >
                <option value="">Select a subject</option>
                {SUBJECTS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
                {/* Custom subjects saved by user */}
                {customSubjects.length > 0 && (
                  <option disabled className="text-gray-400">── My Subjects ──</option>
                )}
                {customSubjects.map((cs) => (
                  <option key={`custom-${cs.id}`} value={cs.name}>{cs.name}</option>
                ))}
              </select>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                Tags <span className="text-gray-400 dark:text-gray-500 font-normal">(up to 5)</span>
              </label>
              <div className="border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 p-2 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent transition-all">
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-lg text-sm"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="hover:text-blue-900 dark:hover:text-blue-100"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  <input
                    ref={tagInputRef}
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleTagKeyDown}
                    placeholder={tags.length < 5 ? "Type and press Enter..." : ""}
                    disabled={tags.length >= 5}
                    className="flex-1 min-w-[120px] px-2 py-1 bg-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none text-sm"
                  />
                </div>
              </div>
              {/* Suggested Tags */}
              {tags.length < 5 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {SUGGESTED_TAGS.filter(t => !tags.includes(t)).slice(0, 8).map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => addTag(tag)}
                      className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      + {tag}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Grade Level Dropdown */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                Grade Level
              </label>
              <select
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              >
                <option value="">Select grade level</option>
                {GRADES.map((g) => (
                  <option key={g.value} value={g.value}>{g.label}</option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Defaults to your profile grade ({user?.grade ? user.grade.toUpperCase().replace('SEC', 'SEC ').replace('JC', 'JC ') : 'not set'})
              </p>
            </div>

            {/* Bounty Selection Chips */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                  Bounty (Optional)
                </label>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Your balance: <span className="font-semibold text-orange-600 dark:text-orange-400">{user?.credits || 0} credits</span>
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                {BOUNTY_PRESETS.map((preset) => (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => handleBountySelect(preset.value)}
                    disabled={typeof preset.value === 'number' && preset.value > (user?.credits || 0)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                      bountySelection === preset.value
                        ? 'bg-orange-500 text-white shadow-md'
                        : typeof preset.value === 'number' && preset.value > (user?.credits || 0)
                          ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              {/* Custom Bounty Input */}
              {bountySelection === 'custom' && (
                <div className="mt-3">
                  <input
                    type="number"
                    min="1"
                    max={user?.credits || 0}
                    value={customBountyInput}
                    onChange={(e) => setCustomBountyInput(e.target.value)}
                    placeholder="Enter custom amount"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
              )}

              {bountyAmount > 0 && (
                <p className="mt-2 text-xs text-orange-600 dark:text-orange-400">
                  Bounty will be awarded to the accepted answer
                </p>
              )}
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Posting...
                  </span>
                ) : (
                  'Post Question'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AskQuestionModal;
