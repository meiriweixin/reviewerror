import React from 'react';

const QuestionCard = ({ question, onClick, currentUser }) => {
  const formatGrade = (grade) => {
    if (!grade) return '';
    const upper = grade.toUpperCase();
    if (upper.startsWith('SEC')) return upper.replace('SEC', 'SEC ');
    if (upper.startsWith('JC')) return upper.replace('JC', 'JC ');
    if (upper.startsWith('UNI')) return 'UNIVERSITY';
    return upper;
  };

  const formatTimeAgo = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div
      onClick={() => onClick(question)}
      className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 cursor-pointer hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-200"
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1 pr-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
            {question.title}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2">
            {question.content}
          </p>
        </div>

        {question.bounty_active && question.bounty_amount > 0 && (
          <div className="flex-shrink-0 ml-2 flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-900/30 dark:to-orange-800/30 rounded-full border border-orange-200 dark:border-orange-700">
            <svg className="w-4 h-4 text-orange-600 dark:text-orange-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.736 6.979C9.208 6.193 9.696 6 10 6c.304 0 .792.193 1.264.979a1 1 0 001.715-1.029C12.279 4.784 11.232 4 10 4s-2.279.784-2.979 1.95c-.285.475-.507 1-.67 1.55H6a1 1 0 000 2h.013a9.358 9.358 0 000 1H6a1 1 0 100 2h.351c.163.55.385 1.075.67 1.55C7.721 15.216 8.768 16 10 16s2.279-.784 2.979-1.95a1 1 0 10-1.715-1.029c-.472.786-.96.979-1.264.979-.304 0-.792-.193-1.264-.979a4.265 4.265 0 01-.264-.521H10a1 1 0 100-2H8.017a7.36 7.36 0 010-1H10a1 1 0 100-2H8.472c.08-.185.167-.36.264-.521z" />
            </svg>
            <span className="text-orange-600 dark:text-orange-400 font-bold text-sm">
              {question.bounty_amount}
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 flex-wrap mt-4">
        {/* Subject Tag */}
        <span className="px-2.5 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg text-xs font-medium">
          {question.subject}
        </span>

        {/* Grade Tag */}
        {question.grade && (
          <span className="px-2.5 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg text-xs font-medium">
            {formatGrade(question.grade)}
          </span>
        )}

        {/* Status Badge */}
        <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
          question.status === 'solved'
            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
        }`}>
          {question.status === 'solved' ? 'Solved' : 'Open'}
        </span>

        {/* Stats - pushed to right */}
        <div className="flex items-center gap-4 ml-auto text-xs text-gray-500 dark:text-gray-400">
          {/* Answers */}
          <span className="flex items-center gap-1" title="Answers">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            {question.answer_count}
          </span>

          {/* Upvotes */}
          <span className="flex items-center gap-1" title="Upvotes">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
            {question.upvotes}
          </span>

          {/* Views */}
          <span className="flex items-center gap-1" title="Views">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            {question.view_count}
          </span>
        </div>
      </div>

      {/* Author and Time */}
      <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
        <span>by {question.user_name || 'Anonymous'}</span>
        <span>{formatTimeAgo(question.created_at)}</span>
      </div>
    </div>
  );
};

export default QuestionCard;
