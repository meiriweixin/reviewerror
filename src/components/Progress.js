import React, { useState, useEffect } from 'react';
import { getStudentStats, getSubjectStats, getCategoryStats } from '../services/api';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

const COLORS = {
  understood: '#10b981',
  reviewing: '#3b82f6',
  pending: '#f59e0b',
  total: '#8b5cf6'
};

const Progress = ({ user }) => {
  const [stats, setStats] = useState(null);
  const [subjectStats, setSubjectStats] = useState([]);
  const [categoryStats, setCategoryStats] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, [user?.grade]);

  useEffect(() => {
    if (selectedSubject) {
      loadCategoryStats(selectedSubject);
    }
  }, [selectedSubject, user?.grade]);

  const loadStats = async () => {
    setLoading(true);
    try {
      const [generalStats, subjects] = await Promise.all([
        getStudentStats(user?.grade),
        getSubjectStats(user?.grade),
      ]);
      setStats(generalStats);
      setSubjectStats(subjects);

      // Auto-select first subject if available
      if (subjects.length > 0 && !selectedSubject) {
        setSelectedSubject(subjects[0].subject);
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCategoryStats = async (subject) => {
    try {
      const categories = await getCategoryStats(subject, user?.grade);
      setCategoryStats(categories);
    } catch (error) {
      console.error('Failed to load category stats:', error);
    }
  };

  const calculatePercentage = (value, total) => {
    if (!total) return 0;
    return Math.round((value / total) * 100);
  };

  // Prepare data for pie chart (overall status distribution)
  const getPieChartData = () => {
    if (!stats) return [];
    return [
      { name: 'Understood', value: stats.understood_questions, color: COLORS.understood },
      { name: 'Reviewing', value: stats.reviewing_questions, color: COLORS.reviewing },
      { name: 'Pending', value: stats.pending_questions, color: COLORS.pending },
    ].filter(item => item.value > 0);
  };

  // Prepare data for category bar chart
  const getCategoryBarChartData = () => {
    return categoryStats.map(cat => ({
      name: cat.category.length > 15 ? cat.category.substring(0, 15) + '...' : cat.category,
      fullName: cat.category,
      Understood: cat.understood,
      Reviewing: cat.reviewing,
      Pending: cat.pending,
      Total: cat.total
    }));
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
        <p className="mt-4 text-gray-600 dark:text-gray-300">Loading progress...</p>
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
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-50">Your Progress</h2>
        <p className="text-gray-600 dark:text-gray-300 mt-1">
          Track your learning journey across all subjects
          {user?.grade && ` (Grade: ${user.grade.toUpperCase()})`}
        </p>
      </div>

      {/* Overall Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium opacity-90">Total Questions</h3>
            <svg className="w-8 h-8 opacity-80" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
              <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd"/>
            </svg>
          </div>
          <p className="text-3xl font-bold">{totalQuestions}</p>
        </div>

        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-6 text-white shadow-lg">
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

        <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl p-6 text-white shadow-lg">
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

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Overall Status Distribution Pie Chart */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-700 p-6">
          <h3 className="font-semibold text-gray-900 dark:text-gray-50 mb-4">Overall Status Distribution</h3>
          {totalQuestions > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={getPieChartData()}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {getPieChartData().map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              No data available yet
            </div>
          )}
        </div>

        {/* Overall Progress Bar */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-700 p-6">
          <h3 className="font-semibold text-gray-900 dark:text-gray-50 mb-4">Overall Completion</h3>
          <div className="relative pt-1">
            <div className="flex mb-2 items-center justify-between">
              <div>
                <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-indigo-700 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-900/40">
                  Progress
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs font-semibold inline-block text-indigo-700 dark:text-indigo-300">
                  {calculatePercentage(understoodQuestions, totalQuestions)}%
                </span>
              </div>
            </div>
            <div className="overflow-hidden h-4 mb-4 text-xs flex rounded-full bg-gray-200 dark:bg-slate-700">
              <div
                style={{ width: `${calculatePercentage(understoodQuestions, totalQuestions)}%` }}
                className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-gradient-to-r from-indigo-600 to-purple-600 transition-all duration-500"
              ></div>
            </div>
          </div>

          {/* Subject Summary Table */}
          <div className="mt-6">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">By Subject</h4>
            <div className="space-y-2">
              {subjectStats.slice(0, 5).map((subject) => (
                <div key={subject.subject} className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">{subject.subject}</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {calculatePercentage(subject.understood || 0, subject.total_questions)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Category Analytics Section */}
      {subjectStats.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-700 p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-gray-900 dark:text-gray-50">Category Performance Analysis</h3>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="px-4 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-xl text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {subjectStats.map((subject) => (
                <option key={subject.subject} value={subject.subject}>
                  {subject.subject}
                </option>
              ))}
            </select>
          </div>

          {categoryStats.length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={getCategoryBarChartData()}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
                <XAxis
                  dataKey="name"
                  tick={{ fill: '#9ca3af', fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={100}
                />
                <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: '1px solid #374151',
                    borderRadius: '0.5rem',
                    color: '#f3f4f6'
                  }}
                  labelFormatter={(label, payload) => {
                    if (payload && payload[0]) {
                      return payload[0].payload.fullName;
                    }
                    return label;
                  }}
                />
                <Legend />
                <Bar dataKey="Understood" fill={COLORS.understood} />
                <Bar dataKey="Reviewing" fill={COLORS.reviewing} />
                <Bar dataKey="Pending" fill={COLORS.pending} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              No category data available for {selectedSubject}
            </div>
          )}
        </div>
      )}

      {/* Subject-wise Breakdown */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-700 p-6">
        <h3 className="font-semibold text-gray-900 dark:text-gray-50 mb-6">Subject-wise Performance</h3>

        {subjectStats.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">No subject data available yet. Start uploading questions!</p>
          </div>
        ) : (
          <div className="space-y-6">
            {subjectStats.map((subject) => (
              <div key={subject.subject} className="border-b border-gray-100 dark:border-slate-800 pb-6 last:border-0">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-medium text-gray-900 dark:text-gray-50">{subject.subject}</h4>
                  <span className="text-sm text-gray-500 dark:text-gray-400">{subject.total_questions} questions</span>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-3">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{subject.understood || 0}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Understood</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{subject.reviewing || 0}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Reviewing</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{subject.pending || 0}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Pending</p>
                  </div>
                </div>

                <div className="relative pt-1">
                  <div className="overflow-hidden h-2 text-xs flex rounded-full bg-gray-200 dark:bg-slate-700">
                    <div
                      style={{ width: `${calculatePercentage(subject.understood || 0, subject.total_questions)}%` }}
                      className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-emerald-500"
                    ></div>
                    <div
                      style={{ width: `${calculatePercentage(subject.reviewing || 0, subject.total_questions)}%` }}
                      className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500"
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-right">
                    {calculatePercentage(subject.understood || 0, subject.total_questions)}% mastered
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Achievements Section */}
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 rounded-2xl border border-indigo-100 dark:border-indigo-900/50 p-6 mt-8">
        <h3 className="font-semibold text-gray-900 dark:text-gray-50 mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-indigo-600 dark:text-indigo-400" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
          </svg>
          Keep Going!
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {totalQuestions >= 10 && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-indigo-200 dark:border-indigo-900/50">
              <div className="text-2xl mb-2">🎯</div>
              <p className="font-semibold text-gray-900 dark:text-gray-50">Question Hunter</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Uploaded 10+ questions</p>
            </div>
          )}
          {understoodQuestions >= 5 && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-indigo-200 dark:border-indigo-900/50">
              <div className="text-2xl mb-2">⭐</div>
              <p className="font-semibold text-gray-900 dark:text-gray-50">Quick Learner</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Mastered 5+ questions</p>
            </div>
          )}
          {calculatePercentage(understoodQuestions, totalQuestions) >= 50 && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-indigo-200 dark:border-indigo-900/50">
              <div className="text-2xl mb-2">🏆</div>
              <p className="font-semibold text-gray-900 dark:text-gray-50">Half Way Hero</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">50% completion rate</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Progress;
