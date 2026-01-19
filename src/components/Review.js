import React, { useState, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { getWrongQuestions, updateQuestionStatus, updateQuestionNotes, searchQuestions, deleteQuestion, regenerateExplanation, submitExplanationFeedback, uploadCorrectAnswer, deleteCorrectAnswer, getSimilarQuestions, getCustomSubjects } from '../services/api';
import DiagramRenderer from './diagrams/DiagramRenderer';

// Subject list (same as Upload.js)
const SUBJECTS = [
  'Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'Chinese',
  'Geography', 'History', 'Literature', 'Economics', 'Accounting',
  'Computer Science', 'Art', 'Music', 'Physical Education', 'Other'
];

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
    category: '',
    status: 'pending',
    grade: user?.grade || '',
    start_date: '',
    end_date: '',
  });

  // Category options based on selected subject (same as Upload.js)
  const categoryOptions = {
    Mathematics: ['Algebra', 'Geometry', 'Arithmetic', 'Calculus', 'Statistics', 'Trigonometry'],
    Physics: ['Mechanics', 'Electricity', 'Magnetism', 'Thermodynamics', 'Optics', 'Modern Physics'],
    Chemistry: ['Organic Chemistry', 'Inorganic Chemistry', 'Physical Chemistry', 'Analytical Chemistry'],
    Biology: ['Cell Biology', 'Genetics', 'Evolution', 'Ecology', 'Human Biology', 'Botany'],
    English: ['Grammar', 'Comprehension', 'Composition', 'Literature', 'Vocabulary'],
    Chinese: ['Reading', 'Writing', 'Grammar', 'Comprehension', 'Composition'],
    Geography: ['Physical Geography', 'Human Geography', 'Environmental Geography'],
    History: ['World History', 'Local History', 'Ancient History', 'Modern History'],
    Literature: ['Poetry', 'Prose', 'Drama', 'Fiction', 'Non-Fiction'],
    Economics: ['Microeconomics', 'Macroeconomics', 'International Economics'],
    Accounting: ['Financial Accounting', 'Management Accounting', 'Cost Accounting'],
    'Computer Science': ['Programming', 'Data Structures', 'Algorithms', 'Databases', 'Networks'],
    Art: ['Drawing', 'Painting', 'Sculpture', 'Design'],
    Music: ['Theory', 'Performance', 'Composition', 'History'],
    'Physical Education': ['Sports', 'Fitness', 'Health'],
    Other: []
  };
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [similarQuestions, setSimilarQuestions] = useState({}); // { questionId: { questions: [...], diagrams: [...] } }
  const [loadingSimilar, setLoadingSimilar] = useState(null); // questionId currently loading
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesText, setNotesText] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [customSubjects, setCustomSubjects] = useState([]);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [uploadingCorrectAnswer, setUploadingCorrectAnswer] = useState(false);
  const [deletingCorrectAnswer, setDeletingCorrectAnswer] = useState(false);

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

  // Watch for user.grade changes and update filters
  useEffect(() => {
    if (user?.grade) {
      setFilters(prev => ({ ...prev, grade: user.grade }));
    }
  }, [user?.grade]);

  // Handle subject change - reset category when subject changes
  const handleSubjectChange = (newSubject) => {
    setFilters({ ...filters, subject: newSubject, category: '' });
  };

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

  const handleGetSimilarQuestions = async (questionId) => {
    setLoadingSimilar(questionId);
    try {
      const result = await getSimilarQuestions(questionId);
      // Store similar questions and diagrams in state
      setSimilarQuestions(prev => ({
        ...prev,
        [questionId]: {
          questions: result.similar_questions || [],
          diagrams: result.diagrams || []
        }
      }));
    } catch (error) {
      console.error('Failed to get similar questions:', error);
      alert('Failed to generate similar questions. Please try again.');
    } finally {
      setLoadingSimilar(null);
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedQuestion) return;
    setSavingNotes(true);
    try {
      const updatedQuestion = await updateQuestionNotes(selectedQuestion.id, notesText);
      // Update local state
      setQuestions(questions.map(q =>
        q.id === selectedQuestion.id ? { ...q, user_notes: notesText } : q
      ));
      setSelectedQuestion({ ...selectedQuestion, user_notes: notesText });
      setEditingNotes(false);
    } catch (error) {
      console.error('Failed to save notes:', error);
      alert('Failed to save notes. Please try again.');
    } finally {
      setSavingNotes(false);
    }
  };

  const handleStartEditNotes = () => {
    setNotesText(selectedQuestion?.user_notes || '');
    setEditingNotes(true);
  };

  const handleCancelEditNotes = () => {
    setEditingNotes(false);
    setNotesText('');
  };

  const handleSubmitFeedback = async () => {
    if (!selectedQuestion || !feedbackText.trim()) return;
    setSubmittingFeedback(true);
    try {
      const updatedQuestion = await submitExplanationFeedback(selectedQuestion.id, feedbackText);
      // Update local state
      setQuestions(questions.map(q =>
        q.id === selectedQuestion.id ? updatedQuestion : q
      ));
      setSelectedQuestion(updatedQuestion);
      // Reset feedback form
      setShowFeedback(false);
      setFeedbackText('');
    } catch (error) {
      console.error('Failed to submit feedback:', error);
      alert('Failed to regenerate explanation with feedback. Please try again.');
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const handleCancelFeedback = () => {
    setShowFeedback(false);
    setFeedbackText('');
  };

  const handleUploadCorrectAnswer = async (e) => {
    const file = e.target.files[0];
    if (!file || !selectedQuestion) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file.');
      return;
    }

    setUploadingCorrectAnswer(true);
    try {
      const updatedQuestion = await uploadCorrectAnswer(selectedQuestion.id, file);
      // Update local state
      setQuestions(questions.map(q =>
        q.id === selectedQuestion.id ? updatedQuestion : q
      ));
      setSelectedQuestion(updatedQuestion);
    } catch (error) {
      console.error('Failed to upload correct answer:', error);
      alert('Failed to upload correct answer. Please try again.');
    } finally {
      setUploadingCorrectAnswer(false);
      // Reset file input
      e.target.value = '';
    }
  };

  const handleDeleteCorrectAnswer = async () => {
    if (!selectedQuestion) return;

    setDeletingCorrectAnswer(true);
    try {
      const updatedQuestion = await deleteCorrectAnswer(selectedQuestion.id);
      // Update local state
      setQuestions(questions.map(q =>
        q.id === selectedQuestion.id ? updatedQuestion : q
      ));
      setSelectedQuestion(updatedQuestion);
    } catch (error) {
      console.error('Failed to delete correct answer:', error);
      alert('Failed to delete correct answer. Please try again.');
    } finally {
      setDeletingCorrectAnswer(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800',
      understood: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800',
      reviewing: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800',
    };
    return badges[status] || badges.pending;
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-50">Review Questions</h2>
        <p className="text-gray-600 dark:text-gray-300 mt-1">Review and practice your wrongly answered questions</p>
      </div>

      {/* Filters and Search */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-700 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
          {/* Subject Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Subject</label>
            <select
              value={filters.subject}
              onChange={(e) => handleSubjectChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100"
            >
              <option value="" className="text-gray-900 dark:text-gray-100 bg-white dark:bg-slate-800">All Subjects</option>
              {SUBJECTS.map((subject) => (
                <option key={subject} value={subject} className="text-gray-900 dark:text-gray-100 bg-white dark:bg-slate-800">
                  {subject}
                </option>
              ))}
              {/* Custom subjects saved by user */}
              {customSubjects.length > 0 && (
                <option disabled className="text-gray-400">── My Subjects ──</option>
              )}
              {customSubjects.map((cs) => (
                <option key={`custom-${cs.id}`} value={cs.name} className="text-gray-900 dark:text-gray-100 bg-white dark:bg-slate-800">
                  {cs.name}
                </option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Category</label>
            <select
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              disabled={!filters.subject}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="" className="text-gray-900 dark:text-gray-100 bg-white dark:bg-slate-800">
                {filters.subject ? 'All Categories' : 'Select Subject First'}
              </option>
              {filters.subject && categoryOptions[filters.subject]?.map((cat) => (
                <option key={cat} value={cat} className="text-gray-900 dark:text-gray-100 bg-white dark:bg-slate-800">{cat}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100"
            >
              <option value="" className="text-gray-900 dark:text-gray-100 bg-white dark:bg-slate-800">All Status</option>
              <option value="pending" className="text-gray-900 dark:text-gray-100 bg-white dark:bg-slate-800">Pending</option>
              <option value="reviewing" className="text-gray-900 dark:text-gray-100 bg-white dark:bg-slate-800">Reviewing</option>
              <option value="understood" className="text-gray-900 dark:text-gray-100 bg-white dark:bg-slate-800">Understood</option>
            </select>
          </div>

          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">From Date</label>
            <input
              type="date"
              value={filters.start_date}
              onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">To Date</label>
            <input
              type="date"
              value={filters.end_date}
              onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100"
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
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
          />
          <button
            onClick={handleSearch}
            className="px-6 py-2 bg-blue-600 dark:bg-blue-600 text-white rounded-2xl hover:bg-blue-700 dark:hover:bg-blue-700 transition-colors font-medium"
          >
            Search
          </button>
        </div>
      </div>

      {/* Questions List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Loading questions...</p>
        </div>
      ) : questions.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-700 p-12 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="mt-2 text-sm font-semibold text-gray-900 dark:text-gray-100">No questions found</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Try uploading some question papers or adjusting your filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {questions.map((question) => (
            <div
              key={question.id}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-700 p-6 hover:shadow-lg dark:hover:shadow-slate-900/50 transition-shadow cursor-pointer"
              onClick={() => setSelectedQuestion(question)}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1.5">
                    <h3 className="text-base font-semibold text-gray-900 dark:text-gray-50">{question.subject}</h3>
                    {question.category && (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100/80 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                        {question.category}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    {new Date(question.created_at).toLocaleDateString()}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusBadge(question.status)}`}>
                  {question.status}
                </span>
              </div>

              {question.image_url && (
                <div className="mb-4 dark:bg-white dark:p-4 dark:rounded-2xl">
                  <img
                    src={getImageUrl(question.image_url)}
                    alt="Question"
                    className="w-full rounded-xl max-h-48 object-cover"
                    style={{
                      filter: 'grayscale(100%) contrast(120%) brightness(105%)'
                    }}
                  />
                </div>
              )}

              <p className="text-gray-700 dark:text-gray-300 text-sm line-clamp-3">{question.question_text}</p>

              <div className="mt-4">
                <div className="flex gap-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStatusUpdate(question.id, 'reviewing');
                    }}
                    disabled={updating}
                    className="flex-1 px-4 py-2.5 text-sm bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-2xl hover:bg-blue-200 dark:hover:bg-blue-900/60 transition-colors disabled:opacity-50 font-medium"
                  >
                    Reviewing
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStatusUpdate(question.id, 'understood');
                    }}
                    disabled={updating}
                    className="flex-1 px-4 py-2.5 text-sm bg-emerald-600 dark:bg-emerald-600 text-white rounded-2xl hover:bg-emerald-700 dark:hover:bg-emerald-700 transition-colors disabled:opacity-50 font-semibold shadow-sm"
                  >
                    Understood
                  </button>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleGetSimilarQuestions(question.id);
                  }}
                  disabled={loadingSimilar === question.id}
                  className="w-full mt-2 px-2 py-1 text-xs text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors disabled:opacity-50 font-normal"
                >
                  {loadingSimilar === question.id ? 'Generating...' : '→ Similar Questions'}
                </button>
              </div>

              {/* Display Similar Questions if available */}
              {similarQuestions[question.id] && similarQuestions[question.id].questions && (
                <div className="mt-4 p-4 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/50 rounded-2xl">
                  <h4 className="text-sm font-semibold text-indigo-900 dark:text-indigo-300 mb-3">Practice Questions:</h4>
                  <div className="space-y-3">
                    {similarQuestions[question.id].questions.map((sq, idx) => (
                      <div key={idx} className="bg-white dark:bg-slate-900/50 p-3 rounded-xl border border-indigo-100 dark:border-indigo-900/30">
                        <p className="text-sm text-indigo-900 dark:text-indigo-200">
                          <span className="font-semibold">{idx + 1}.</span> {sq}
                        </p>
                        {similarQuestions[question.id].diagrams && similarQuestions[question.id].diagrams[idx] && (
                          <div className="mt-2">
                            <DiagramRenderer spec={similarQuestions[question.id].diagrams[idx]} subject={question.subject} />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Question Detail Modal */}
      {selectedQuestion && (
        <div className="fixed inset-0 bg-black/60 dark:bg-black/80 flex items-center justify-center p-4 z-50" onClick={() => { setSelectedQuestion(null); setEditingNotes(false); setNotesText(''); setShowFeedback(false); setFeedbackText(''); }}>
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-slate-700 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700 p-6">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-gray-50">{selectedQuestion.subject}</h3>
                    {selectedQuestion.category && (
                      <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100/80 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                        {selectedQuestion.category}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Uploaded on {new Date(selectedQuestion.created_at).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => { setSelectedQuestion(null); setEditingNotes(false); setNotesText(''); setShowFeedback(false); setFeedbackText(''); }}
                  className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6">
              {selectedQuestion.image_url && (
                <div className="mb-6 dark:bg-white dark:p-4 dark:rounded-2xl">
                  <img
                    src={getImageUrl(selectedQuestion.image_url)}
                    alt="Question"
                    className="w-full rounded-xl"
                    style={{
                      filter: 'grayscale(100%) contrast(120%) brightness(105%)'
                    }}
                  />
                </div>
              )}

              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 dark:text-gray-50 mb-2">Question:</h4>
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{selectedQuestion.question_text}</p>
              </div>

              {selectedQuestion.explanation && (
                <div className="mb-6 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 rounded-2xl p-4">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-semibold text-blue-900 dark:text-blue-300">AI Explanation:</h4>
                    <button
                      onClick={() => setShowFeedback(!showFeedback)}
                      disabled={updating || submittingFeedback}
                      className="px-3 py-1 text-xs bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800 rounded-2xl hover:bg-orange-200 dark:hover:bg-orange-900/60 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                    >
                      {showFeedback ? 'Cancel Feedback' : 'Report Error'}
                    </button>
                  </div>

                  {/* Feedback Form */}
                  {showFeedback && (
                    <div className="mb-4 p-3 bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 rounded-xl">
                      <p className="text-sm text-orange-800 dark:text-orange-200 mb-2">
                        What's wrong with this explanation? The AI will use your feedback to generate a corrected explanation.
                      </p>
                      <textarea
                        value={feedbackText}
                        onChange={(e) => setFeedbackText(e.target.value)}
                        placeholder="e.g., 'The calculation in step 2 is wrong. 5 + 3 = 8, not 9.' or 'The formula used is incorrect, it should be A = πr² not A = 2πr'"
                        className="w-full px-3 py-2 border border-orange-300 dark:border-orange-700 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 resize-none text-sm"
                        rows={3}
                        autoFocus
                      />
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={handleSubmitFeedback}
                          disabled={submittingFeedback || !feedbackText.trim()}
                          className="px-4 py-2 text-sm bg-orange-600 dark:bg-orange-600 text-white rounded-xl hover:bg-orange-700 dark:hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                        >
                          {submittingFeedback ? 'Correcting...' : 'Submit & Correct'}
                        </button>
                        <button
                          onClick={handleCancelFeedback}
                          disabled={submittingFeedback}
                          className="px-4 py-2 text-sm bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-300 dark:hover:bg-slate-600 transition-colors disabled:opacity-50 font-medium"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="prose prose-sm max-w-none prose-headings:text-blue-900 dark:prose-headings:text-blue-300 prose-h2:text-base prose-h2:font-semibold prose-h2:mt-6 prose-h2:mb-3 prose-h2:first:mt-0 prose-p:text-blue-800 dark:prose-p:text-blue-200 prose-p:my-2 prose-li:text-blue-800 dark:prose-li:text-blue-200 prose-li:my-1 prose-ul:my-2 prose-ul:ml-4 prose-ol:my-2 prose-ol:ml-4 prose-strong:text-blue-900 dark:prose-strong:text-blue-100">
                    <ReactMarkdown
                      remarkPlugins={[remarkMath]}
                      rehypePlugins={[rehypeKatex]}
                    >
                      {selectedQuestion.explanation}
                    </ReactMarkdown>
                  </div>
                </div>
              )}

              {/* Correct Answer Section */}
              <div className="mb-6 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 rounded-2xl p-4">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-semibold text-emerald-900 dark:text-emerald-300">Correct Answer:</h4>
                  <div className="flex gap-2">
                    {selectedQuestion.correct_answer_url && (
                      <button
                        onClick={handleDeleteCorrectAnswer}
                        disabled={deletingCorrectAnswer}
                        className="px-3 py-1 text-xs bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 rounded-2xl hover:bg-red-200 dark:hover:bg-red-900/60 transition-colors disabled:opacity-50 font-medium"
                      >
                        {deletingCorrectAnswer ? 'Deleting...' : 'Remove'}
                      </button>
                    )}
                    <label className="px-3 py-1 text-xs bg-emerald-600 dark:bg-emerald-600 text-white rounded-2xl hover:bg-emerald-700 dark:hover:bg-emerald-700 transition-colors cursor-pointer font-medium">
                      {uploadingCorrectAnswer ? 'Uploading...' : (selectedQuestion.correct_answer_url ? 'Replace' : 'Upload')}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleUploadCorrectAnswer}
                        disabled={uploadingCorrectAnswer}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                {selectedQuestion.correct_answer_url ? (
                  <div className="dark:bg-white dark:p-4 dark:rounded-xl">
                    <img
                      src={getImageUrl(selectedQuestion.correct_answer_url)}
                      alt="Correct Answer"
                      className="w-full rounded-xl"
                      style={{
                        filter: 'grayscale(100%) contrast(120%) brightness(105%)'
                      }}
                    />
                  </div>
                ) : (
                  <p className="text-emerald-600/60 dark:text-emerald-400/60 italic text-sm">
                    No correct answer uploaded yet. Click "Upload" to add the correct answer image for reference.
                  </p>
                )}
              </div>

              {/* Personal Notes Section */}
              <div className="mb-6 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-2xl p-4">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-semibold text-amber-900 dark:text-amber-300">My Notes:</h4>
                  {!editingNotes && (
                    <button
                      onClick={handleStartEditNotes}
                      className="px-3 py-1 text-xs bg-amber-600 dark:bg-amber-600 text-white rounded-2xl hover:bg-amber-700 dark:hover:bg-amber-700 transition-colors font-medium"
                    >
                      {selectedQuestion.user_notes ? 'Edit' : 'Add Note'}
                    </button>
                  )}
                </div>

                {editingNotes ? (
                  <div>
                    <textarea
                      value={notesText}
                      onChange={(e) => setNotesText(e.target.value)}
                      placeholder="Add your personal notes, observations, or reminders about this question..."
                      className="w-full px-3 py-2 border border-amber-300 dark:border-amber-700 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 resize-none"
                      rows={4}
                      autoFocus
                    />
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={handleSaveNotes}
                        disabled={savingNotes}
                        className="px-4 py-2 text-sm bg-amber-600 dark:bg-amber-600 text-white rounded-xl hover:bg-amber-700 dark:hover:bg-amber-700 transition-colors disabled:opacity-50 font-medium"
                      >
                        {savingNotes ? 'Saving...' : 'Save Note'}
                      </button>
                      <button
                        onClick={handleCancelEditNotes}
                        disabled={savingNotes}
                        className="px-4 py-2 text-sm bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-300 dark:hover:bg-slate-600 transition-colors disabled:opacity-50 font-medium"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    {selectedQuestion.user_notes ? (
                      <p className="text-amber-800 dark:text-amber-200 whitespace-pre-wrap">{selectedQuestion.user_notes}</p>
                    ) : (
                      <p className="text-amber-600/60 dark:text-amber-400/60 italic">No notes yet. Click "Add Note" to add your personal observations.</p>
                    )}
                  </div>
                )}
              </div>

              <div className="flex gap-3 mb-4">
                <button
                  onClick={() => handleStatusUpdate(selectedQuestion.id, 'pending')}
                  className="flex-1 px-4 py-3 bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 rounded-2xl hover:bg-amber-200 dark:hover:bg-amber-900/60 transition-colors font-medium"
                >
                  Pending
                </button>
                <button
                  onClick={() => handleStatusUpdate(selectedQuestion.id, 'reviewing')}
                  className="flex-1 px-4 py-3 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-2xl hover:bg-blue-200 dark:hover:bg-blue-900/60 transition-colors font-medium"
                >
                  Reviewing
                </button>
                <button
                  onClick={() => handleStatusUpdate(selectedQuestion.id, 'understood')}
                  className="flex-1 px-4 py-3 bg-emerald-600 dark:bg-emerald-600 text-white rounded-2xl hover:bg-emerald-700 dark:hover:bg-emerald-700 transition-colors font-semibold shadow-sm"
                >
                  Understood
                </button>
              </div>

              <button
                onClick={() => handleGetSimilarQuestions(selectedQuestion.id)}
                disabled={loadingSimilar === selectedQuestion.id}
                className="w-full px-2 py-2 text-sm text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors mb-4 disabled:opacity-50 font-normal"
              >
                {loadingSimilar === selectedQuestion.id ? 'Generating...' : '→ Generate Similar Questions'}
              </button>

              {/* Display Similar Questions in modal if available */}
              {similarQuestions[selectedQuestion.id] && similarQuestions[selectedQuestion.id].questions && (
                <div className="mb-4 p-4 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/50 rounded-2xl">
                  <h4 className="font-semibold text-indigo-900 dark:text-indigo-300 mb-3">Practice Questions:</h4>
                  <div className="space-y-4">
                    {similarQuestions[selectedQuestion.id].questions.map((sq, idx) => (
                      <div key={idx} className="bg-white dark:bg-slate-900/50 p-4 rounded-xl border border-indigo-100 dark:border-indigo-900/30">
                        <p className="text-indigo-900 dark:text-indigo-200">
                          <span className="font-semibold text-base">{idx + 1}.</span> {sq}
                        </p>
                        {similarQuestions[selectedQuestion.id].diagrams && similarQuestions[selectedQuestion.id].diagrams[idx] && (
                          <div className="mt-3">
                            <DiagramRenderer spec={similarQuestions[selectedQuestion.id].diagrams[idx]} subject={selectedQuestion.subject} />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={() => setDeleteConfirm(selectedQuestion.id)}
                className="w-full px-4 py-3 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 rounded-2xl hover:bg-red-100 dark:hover:bg-red-950/50 transition-colors font-medium border border-red-200 dark:border-red-900/50"
              >
                Delete Question
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/60 dark:bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 border border-gray-200 dark:border-slate-700 shadow-2xl">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-50 mb-2">Delete Question?</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Are you sure you want to delete this question? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                disabled={updating}
                className="flex-1 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                disabled={updating}
                className="flex-1 px-4 py-2 bg-red-600 dark:bg-red-600 text-white rounded-2xl hover:bg-red-700 dark:hover:bg-red-700 transition-colors disabled:opacity-50 font-semibold shadow-sm"
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
