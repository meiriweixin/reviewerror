import React, { useState, useEffect, useCallback } from 'react';
import { getQAQuestions, getCustomSubjects } from '../services/api';
import QuestionCard from './qa/QuestionCard';
import AskQuestionModal from './qa/AskQuestionModal';
import QuestionDetailModal from './qa/QuestionDetailModal';

const SUBJECTS = [
  'Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'Chinese',
  'Geography', 'History', 'Literature', 'Economics', 'Accounting',
  'Computer Science', 'Art', 'Music', 'Physical Education', 'Other'
];

const FILTER_TABS = [
  { id: 'latest', label: 'Latest' },
  { id: 'unanswered', label: 'Unanswered' },
  { id: 'my_questions', label: 'My Questions' },
  { id: 'bounties', label: 'Bounties' }
];

const CommunityQA = ({ user }) => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('latest');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [showAskModal, setShowAskModal] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [customSubjects, setCustomSubjects] = useState([]);

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

  useEffect(() => {
    setPage(0);
    setQuestions([]);
    loadQuestions(0);
  }, [activeFilter, selectedSubject, user?.grade]);

  const loadQuestions = async (pageNum = page) => {
    setLoading(true);
    try {
      const data = await getQAQuestions({
        filter: activeFilter,
        subject: selectedSubject || undefined,
        grade: user?.grade || undefined,
        limit: 20,
        offset: pageNum * 20
      });

      if (pageNum === 0) {
        setQuestions(data);
      } else {
        setQuestions(prev => [...prev, ...data]);
      }
      setHasMore(data.length === 20);
    } catch (error) {
      console.error('Failed to load questions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleQuestionCreated = () => {
    setShowAskModal(false);
    setPage(0);
    loadQuestions(0);
  };

  const handleQuestionClick = (question) => {
    setSelectedQuestion(question);
  };

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    loadQuestions(nextPage);
  };

  const handleQuestionUpdate = () => {
    loadQuestions(0);
    setPage(0);
  };

  const filteredQuestions = questions.filter(q =>
    searchQuery === '' ||
    q.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    q.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-5xl mx-auto">
      {/* Action Button - Top Right */}
      <div className="flex justify-end mb-6">
        <button
          onClick={() => setShowAskModal(true)}
          className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Ask Question
        </button>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <svg className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search questions..."
            className="w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-2xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
        </div>
      </div>

      {/* Filters Row */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        {/* Tab Filters */}
        <div className="flex gap-2 flex-wrap">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id)}
              className={`px-4 py-2 rounded-xl font-medium transition-all ${
                activeFilter === tab.id
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              {tab.label}
              {tab.id === 'bounties' && (
                <svg className="inline-block w-4 h-4 ml-1 text-orange-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.736 6.979C9.208 6.193 9.696 6 10 6c.304 0 .792.193 1.264.979a1 1 0 001.715-1.029C12.279 4.784 11.232 4 10 4s-2.279.784-2.979 1.95c-.285.475-.507 1-.67 1.55H6a1 1 0 000 2h.013a9.358 9.358 0 000 1H6a1 1 0 100 2h.351c.163.55.385 1.075.67 1.55C7.721 15.216 8.768 16 10 16s2.279-.784 2.979-1.95a1 1 0 10-1.715-1.029c-.472.786-.96.979-1.264.979-.304 0-.792-.193-1.264-.979a4.265 4.265 0 01-.264-.521H10a1 1 0 100-2H8.017a7.36 7.36 0 010-1H10a1 1 0 100-2H8.472c.08-.185.167-.36.264-.521z" />
                </svg>
              )}
            </button>
          ))}
        </div>

        {/* Subject Filter */}
        <div className="sm:ml-auto">
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          >
            <option value="">All Subjects</option>
            {SUBJECTS.map((subject) => (
              <option key={subject} value={subject}>{subject}</option>
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
      </div>

      {/* Stats Bar */}
      <div className="mb-6 p-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <div className="flex items-center gap-6 text-sm">
          <span className="text-gray-600 dark:text-gray-400">
            <span className="font-semibold text-gray-900 dark:text-white">{questions.length}</span> questions
          </span>
          {activeFilter === 'bounties' && (
            <span className="text-orange-600 dark:text-orange-400">
              Showing questions with active bounties
            </span>
          )}
        </div>
        {user?.credits !== undefined && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-900/30 dark:to-orange-800/30 rounded-xl">
            <svg className="w-4 h-4 text-orange-600 dark:text-orange-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.736 6.979C9.208 6.193 9.696 6 10 6c.304 0 .792.193 1.264.979a1 1 0 001.715-1.029C12.279 4.784 11.232 4 10 4s-2.279.784-2.979 1.95c-.285.475-.507 1-.67 1.55H6a1 1 0 000 2h.013a9.358 9.358 0 000 1H6a1 1 0 100 2h.351c.163.55.385 1.075.67 1.55C7.721 15.216 8.768 16 10 16s2.279-.784 2.979-1.95a1 1 0 10-1.715-1.029c-.472.786-.96.979-1.264.979-.304 0-.792-.193-1.264-.979a4.265 4.265 0 01-.264-.521H10a1 1 0 100-2H8.017a7.36 7.36 0 010-1H10a1 1 0 100-2H8.472c.08-.185.167-.36.264-.521z" />
            </svg>
            <span className="text-orange-600 dark:text-orange-400 font-semibold text-sm">
              {user.credits} credits
            </span>
          </div>
        )}
      </div>

      {/* Questions List */}
      <div className="space-y-4">
        {loading && questions.length === 0 ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-500 dark:text-gray-400">Loading questions...</p>
          </div>
        ) : filteredQuestions.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-12 text-center">
            <svg className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No questions found</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              {searchQuery
                ? 'Try adjusting your search or filters'
                : activeFilter === 'my_questions'
                  ? "You haven't asked any questions yet"
                  : activeFilter === 'bounties'
                    ? 'No questions with active bounties'
                    : 'Be the first to ask a question!'
              }
            </p>
            <button
              onClick={() => setShowAskModal(true)}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg"
            >
              Ask a Question
            </button>
          </div>
        ) : (
          <>
            {filteredQuestions.map((question) => (
              <QuestionCard
                key={question.id}
                question={question}
                onClick={handleQuestionClick}
                currentUser={user}
              />
            ))}

            {/* Load More Button */}
            {hasMore && !searchQuery && (
              <div className="text-center pt-4">
                <button
                  onClick={handleLoadMore}
                  disabled={loading}
                  className="px-6 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-2xl font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-all disabled:opacity-50"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Loading...
                    </span>
                  ) : (
                    'Load More'
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modals */}
      {showAskModal && (
        <AskQuestionModal
          user={user}
          onClose={() => setShowAskModal(false)}
          onQuestionCreated={handleQuestionCreated}
          customSubjects={customSubjects}
        />
      )}

      {selectedQuestion && (
        <QuestionDetailModal
          questionId={selectedQuestion.id}
          currentUser={user}
          onClose={() => setSelectedQuestion(null)}
          onUpdate={handleQuestionUpdate}
        />
      )}
    </div>
  );
};

export default CommunityQA;
