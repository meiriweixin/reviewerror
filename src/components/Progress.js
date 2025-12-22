import React, { useState, useEffect } from 'react';
import { getStudentStats, getSubjectStats } from '../services/api';

const Progress = ({ user }) => {
  const [stats, setStats] = useState(null);
  const [subjectStats, setSubjectStats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    try {
      const [generalStats, subjects] = await Promise.all([
        getStudentStats(),
        getSubjectStats(),
      ]);
      setStats(generalStats);
      setSubjectStats(subjects);
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculatePercentage = (value, total) => {
    if (!total) return 0;
    return Math.round((value / total) * 100);
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading progress...</p>
      </div>
    );
  }

  const totalQuestions = stats?.total_questions || 0;
  const understoodQuestions = stats?.understood_questions || 0;
  const reviewingQuestions = stats?.reviewing_questions || 0;
  const pendingQuestions = stats?.pending_questions || 0;

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Your Progress</h2>
        <p className="text-gray-600 mt-1">Track your learning journey across all subjects</p>
      </div>

      {/* Overall Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium opacity-90">Total Questions</h3>
            <svg className="w-8 h-8 opacity-80" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
              <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd"/>
            </svg>
          </div>
          <p className="text-3xl font-bold">{totalQuestions}</p>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium opacity-90">Understood</h3>
            <svg className="w-8 h-8 opacity-80" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
            </svg>
          </div>
          <p className="text-3xl font-bold">{understoodQuestions}</p>
          <p className="text-sm opacity-90 mt-1">{calculatePercentage(understoodQuestions, totalQuestions)}% complete</p>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium opacity-90">Reviewing</h3>
            <svg className="w-8 h-8 opacity-80" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"/>
            </svg>
          </div>
          <p className="text-3xl font-bold">{reviewingQuestions}</p>
          <p className="text-sm opacity-90 mt-1">{calculatePercentage(reviewingQuestions, totalQuestions)}% in progress</p>
        </div>

        <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium opacity-90">Pending</h3>
            <svg className="w-8 h-8 opacity-80" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
            </svg>
          </div>
          <p className="text-3xl font-bold">{pendingQuestions}</p>
          <p className="text-sm opacity-90 mt-1">{calculatePercentage(pendingQuestions, totalQuestions)}% remaining</p>
        </div>
      </div>

      {/* Overall Progress Bar */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-8">
        <h3 className="font-semibold text-gray-900 mb-4">Overall Completion</h3>
        <div className="relative pt-1">
          <div className="flex mb-2 items-center justify-between">
            <div>
              <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-primary-600 bg-primary-200">
                Progress
              </span>
            </div>
            <div className="text-right">
              <span className="text-xs font-semibold inline-block text-primary-600">
                {calculatePercentage(understoodQuestions, totalQuestions)}%
              </span>
            </div>
          </div>
          <div className="overflow-hidden h-4 mb-4 text-xs flex rounded-full bg-gray-200">
            <div
              style={{ width: `${calculatePercentage(understoodQuestions, totalQuestions)}%` }}
              className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-gradient-to-r from-primary-600 to-secondary-600 transition-all duration-500"
            ></div>
          </div>
        </div>
      </div>

      {/* Subject-wise Breakdown */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-6">Subject-wise Performance</h3>

        {subjectStats.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No subject data available yet. Start uploading questions!</p>
          </div>
        ) : (
          <div className="space-y-6">
            {subjectStats.map((subject) => (
              <div key={subject.subject} className="border-b border-gray-100 pb-6 last:border-0">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-medium text-gray-900">{subject.subject}</h4>
                  <span className="text-sm text-gray-500">{subject.total_questions} questions</span>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-3">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">{subject.understood || 0}</p>
                    <p className="text-xs text-gray-500">Understood</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">{subject.reviewing || 0}</p>
                    <p className="text-xs text-gray-500">Reviewing</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-yellow-600">{subject.pending || 0}</p>
                    <p className="text-xs text-gray-500">Pending</p>
                  </div>
                </div>

                <div className="relative pt-1">
                  <div className="overflow-hidden h-2 text-xs flex rounded-full bg-gray-200">
                    <div
                      style={{ width: `${calculatePercentage(subject.understood || 0, subject.total_questions)}%` }}
                      className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-green-500"
                    ></div>
                    <div
                      style={{ width: `${calculatePercentage(subject.reviewing || 0, subject.total_questions)}%` }}
                      className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500"
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 text-right">
                    {calculatePercentage(subject.understood || 0, subject.total_questions)}% mastered
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Achievements Section */}
      <div className="bg-gradient-to-br from-primary-50 to-secondary-50 rounded-2xl border border-primary-100 p-6 mt-8">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
          </svg>
          Keep Going!
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {totalQuestions >= 10 && (
            <div className="bg-white rounded-2xl p-4 border border-primary-200">
              <div className="text-2xl mb-2">🎯</div>
              <p className="font-semibold text-gray-900">Question Hunter</p>
              <p className="text-xs text-gray-600">Uploaded 10+ questions</p>
            </div>
          )}
          {understoodQuestions >= 5 && (
            <div className="bg-white rounded-2xl p-4 border border-primary-200">
              <div className="text-2xl mb-2">⭐</div>
              <p className="font-semibold text-gray-900">Quick Learner</p>
              <p className="text-xs text-gray-600">Mastered 5+ questions</p>
            </div>
          )}
          {calculatePercentage(understoodQuestions, totalQuestions) >= 50 && (
            <div className="bg-white rounded-2xl p-4 border border-primary-200">
              <div className="text-2xl mb-2">🏆</div>
              <p className="font-semibold text-gray-900">Half Way Hero</p>
              <p className="text-xs text-gray-600">50% completion rate</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Progress;
