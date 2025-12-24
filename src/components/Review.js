import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { getWrongQuestions, updateQuestionStatus, searchQuestions, deleteQuestion, regenerateExplanation } from '../services/api';

// Helper to resolve image URLs - handles both relative and absolute URLs
const getImageUrl = (imageUrl) => {
  if (!imageUrl) return null;
  // If it's already a full URL (Supabase Storage), use it directly
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }
  // For relative URLs like /uploads/xxx.jpg, prepend the API URL
  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';
  return `${apiUrl}${imageUrl}`;
};

const Review = ({ user }) => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    subject: '',
    status: 'pending',
    start_date: '',
    end_date: '',
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    loadQuestions();
  }, [filters]);

  const loadQuestions = async () => {
    setLoading(true);
    try {
      const data = await getWrongQuestions(filters);
      setQuestions(data);
    } catch (error) {
      console.error('Failed to load questions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadQuestions();
      return;
    }

    setLoading(true);
    try {
      const results = await searchQuestions(searchQuery);
      setQuestions(results);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (questionId, newStatus) => {
    setUpdating(true);
    try {
      await updateQuestionStatus(questionId, newStatus);
      // Update local state
      setQuestions(questions.map(q =>
        q.id === questionId ? { ...q, status: newStatus } : q
      ));
      if (selectedQuestion?.id === questionId) {
        setSelectedQuestion({ ...selectedQuestion, status: newStatus });
      }
    } catch (error) {
      console.error('Failed to update status:', error);
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async (questionId) => {
    setUpdating(true);
    try {
      await deleteQuestion(questionId);
      // Remove from local state
      setQuestions(questions.filter(q => q.id !== questionId));
      // Close modal if it's the deleted question
      if (selectedQuestion?.id === questionId) {
        setSelectedQuestion(null);
      }
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Failed to delete question:', error);
      alert('Failed to delete question. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  const handleRegenerateExplanation = async (questionId) => {
    setUpdating(true);
    try {
      const updatedQuestion = await regenerateExplanation(questionId);
      // Update local state
      setQuestions(questions.map(q =>
        q.id === questionId ? updatedQuestion : q
      ));
      if (selectedQuestion?.id === questionId) {
        setSelectedQuestion(updatedQuestion);
      }
    } catch (error) {
      console.error('Failed to regenerate explanation:', error);
      alert('Failed to regenerate explanation. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      understood: 'bg-green-100 text-green-800 border-green-200',
      reviewing: 'bg-blue-100 text-blue-800 border-blue-200',
    };
    return badges[status] || badges.pending;
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Review Questions</h2>
        <p className="text-gray-600 mt-1">Review and practice your wrongly answered questions</p>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {/* Subject Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
            <select
              value={filters.subject}
              onChange={(e) => setFilters({ ...filters, subject: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">All Subjects</option>
              <option value="Mathematics">Mathematics</option>
              <option value="Physics">Physics</option>
              <option value="Chemistry">Chemistry</option>
              <option value="Biology">Biology</option>
              <option value="English">English</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="reviewing">Reviewing</option>
              <option value="understood">Understood</option>
            </select>
          </div>

          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">From Date</label>
            <input
              type="date"
              value={filters.start_date}
              onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">To Date</label>
            <input
              type="date"
              value={filters.end_date}
              onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Search questions by content..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
          <button
            onClick={handleSearch}
            className="px-6 py-2 bg-primary-600 text-white rounded-2xl hover:bg-primary-700 transition-colors"
          >
            Search
          </button>
        </div>
      </div>

      {/* Questions List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading questions...</p>
        </div>
      ) : questions.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="mt-2 text-sm font-semibold text-gray-900">No questions found</h3>
          <p className="mt-1 text-sm text-gray-500">Try uploading some question papers or adjusting your filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {questions.map((question) => (
            <div
              key={question.id}
              className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => setSelectedQuestion(question)}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-semibold text-gray-900">{question.subject}</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {new Date(question.created_at).toLocaleDateString()}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusBadge(question.status)}`}>
                  {question.status}
                </span>
              </div>

              {question.image_url && (
                <img
                  src={getImageUrl(question.image_url)}
                  alt="Question"
                  className="w-full rounded-2xl mb-4 max-h-48 object-cover"
                />
              )}

              <p className="text-gray-700 text-sm line-clamp-3">{question.question_text}</p>

              <div className="mt-4 flex gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStatusUpdate(question.id, 'reviewing');
                  }}
                  disabled={updating}
                  className="flex-1 px-3 py-2 text-sm bg-blue-50 text-blue-700 rounded-2xl hover:bg-blue-100 transition-colors disabled:opacity-50"
                >
                  Mark Reviewing
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStatusUpdate(question.id, 'understood');
                  }}
                  disabled={updating}
                  className="flex-1 px-3 py-2 text-sm bg-green-50 text-green-700 rounded-2xl hover:bg-green-100 transition-colors disabled:opacity-50"
                >
                  Mark Understood
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Question Detail Modal */}
      {selectedQuestion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={() => setSelectedQuestion(null)}>
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{selectedQuestion.subject}</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Uploaded on {new Date(selectedQuestion.created_at).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedQuestion(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6">
              {selectedQuestion.image_url && (
                <img
                  src={getImageUrl(selectedQuestion.image_url)}
                  alt="Question"
                  className="w-full rounded-2xl mb-6"
                />
              )}

              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 mb-2">Question:</h4>
                <p className="text-gray-700 whitespace-pre-wrap">{selectedQuestion.question_text}</p>
              </div>

              {selectedQuestion.explanation && (
                <div className="mb-6 bg-blue-50 border border-blue-200 rounded-2xl p-4">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-semibold text-blue-900">AI Explanation:</h4>
                    <button
                      onClick={() => handleRegenerateExplanation(selectedQuestion.id)}
                      disabled={updating}
                      className="px-3 py-1 text-xs bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {updating ? 'Regenerating...' : 'Regenerate'}
                    </button>
                  </div>
                  <div className="prose prose-sm max-w-none prose-headings:text-blue-900 prose-h2:text-base prose-h2:font-semibold prose-h2:mt-6 prose-h2:mb-3 prose-h2:first:mt-0 prose-p:text-blue-800 prose-p:my-2 prose-li:text-blue-800 prose-li:my-1 prose-ul:my-2 prose-ul:ml-4 prose-ol:my-2 prose-ol:ml-4 prose-strong:text-blue-900">
                    <ReactMarkdown
                      remarkPlugins={[remarkMath]}
                      rehypePlugins={[rehypeKatex]}
                    >
                      {selectedQuestion.explanation}
                    </ReactMarkdown>
                  </div>
                </div>
              )}

              <div className="flex gap-3 mb-4">
                <button
                  onClick={() => handleStatusUpdate(selectedQuestion.id, 'pending')}
                  className="flex-1 px-4 py-3 bg-yellow-50 text-yellow-700 rounded-2xl hover:bg-yellow-100 transition-colors font-medium"
                >
                  Mark as Pending
                </button>
                <button
                  onClick={() => handleStatusUpdate(selectedQuestion.id, 'reviewing')}
                  className="flex-1 px-4 py-3 bg-blue-50 text-blue-700 rounded-2xl hover:bg-blue-100 transition-colors font-medium"
                >
                  Mark as Reviewing
                </button>
                <button
                  onClick={() => handleStatusUpdate(selectedQuestion.id, 'understood')}
                  className="flex-1 px-4 py-3 bg-green-50 text-green-700 rounded-2xl hover:bg-green-100 transition-colors font-medium"
                >
                  Mark as Understood
                </button>
              </div>

              <button
                onClick={() => setDeleteConfirm(selectedQuestion.id)}
                className="w-full px-4 py-3 bg-red-50 text-red-700 rounded-2xl hover:bg-red-100 transition-colors font-medium border border-red-200"
              >
                Delete Question
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Question?</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this question? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                disabled={updating}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-2xl hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                disabled={updating}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-2xl hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {updating ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Review;
