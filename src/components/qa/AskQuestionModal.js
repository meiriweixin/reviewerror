import React, { useState } from 'react';
import { createQAQuestion } from '../../services/api';

const SUBJECTS = [
  'Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'Chinese',
  'Geography', 'History', 'Literature', 'Economics', 'Accounting',
  'Computer Science', 'Art', 'Music', 'Physical Education', 'Other'
];

const AskQuestionModal = ({ user, onClose, onQuestionCreated }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [subject, setSubject] = useState('');
  const [bountyType, setBountyType] = useState('none'); // 'none' or 'custom'
  const [bountyAmount, setBountyAmount] = useState(0);
  const [customBountyInput, setCustomBountyInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleBountyTypeChange = (type) => {
    setBountyType(type);
    if (type === 'none') {
      setBountyAmount(0);
      setCustomBountyInput('');
    }
  };

  const handleCustomBountyChange = (value) => {
    setCustomBountyInput(value);
    const amount = parseInt(value) || 0;
    setBountyAmount(amount);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim() || !content.trim() || !subject) {
      setError('Please fill in all required fields');
      return;
    }

    if (bountyType === 'custom' && (!customBountyInput || bountyAmount <= 0)) {
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
      await createQAQuestion({
        title: title.trim(),
        content: content.trim(),
        subject,
        grade: user?.grade,
        bounty_amount: bountyAmount
      });
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
                placeholder="Provide context, what you've tried, and what you need help with. You can use Markdown and LaTeX ($...$) for math expressions..."
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all"
                rows={8}
                required
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Supports Markdown and LaTeX math ($...$)
              </p>
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
              </select>
            </div>

            {/* Grade Display */}
            {user?.grade && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                  Grade Level
                </label>
                <div className="px-4 py-3 bg-gray-100 dark:bg-gray-700 rounded-xl text-gray-700 dark:text-gray-300">
                  {user.grade.toUpperCase().replace('SEC', 'SEC ').replace('JC', 'JC ')}
                </div>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Based on your profile settings
                </p>
              </div>
            )}

            {/* Bounty */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                Bounty (Optional)
              </label>

              {/* Bounty Type Selection */}
              <div className="space-y-3">
                {/* No Bounty Option */}
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="bountyType"
                    checked={bountyType === 'none'}
                    onChange={() => handleBountyTypeChange('none')}
                    className="w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="ml-3 text-gray-700 dark:text-gray-300">No bounty</span>
                </label>

                {/* Custom Bounty Option */}
                <label className="flex items-start cursor-pointer">
                  <input
                    type="radio"
                    name="bountyType"
                    checked={bountyType === 'custom'}
                    onChange={() => handleBountyTypeChange('custom')}
                    className="w-4 h-4 mt-1 text-blue-600 focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="ml-3 flex-1">
                    <span className="text-gray-700 dark:text-gray-300">Custom credits</span>
                    {bountyType === 'custom' && (
                      <div className="mt-2">
                        <input
                          type="number"
                          min="1"
                          max={user?.credits || 0}
                          value={customBountyInput}
                          onChange={(e) => handleCustomBountyChange(e.target.value)}
                          placeholder="Enter amount"
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        />
                      </div>
                    )}
                  </div>
                </label>
              </div>

              {/* Info Text */}
              <div className="mt-3 flex items-center justify-between text-xs">
                <span className="text-gray-500 dark:text-gray-400">
                  Available: <span className="font-semibold text-gray-700 dark:text-gray-300">{user?.credits || 0}</span> credits
                </span>
                {bountyAmount > 0 && (
                  <span className="text-orange-600 dark:text-orange-400">
                    Bounty will be awarded to the accepted answer
                  </span>
                )}
              </div>
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
