import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import {
  getQAQuestionById,
  getQAAnswers,
  createQAAnswer,
  acceptQAAnswer,
  deleteQAAnswer,
  castQAVote,
  getUserQAVote,
  getQAComments,
  createQAComment,
  deleteQAComment,
  deleteQAQuestion
} from '../../services/api';

const QuestionDetailModal = ({ questionId, currentUser, onClose, onUpdate }) => {
  const [question, setQuestion] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [answerContent, setAnswerContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [comments, setComments] = useState({});
  const [newComment, setNewComment] = useState({});
  const [showComments, setShowComments] = useState({});
  const [userVotes, setUserVotes] = useState({});
  const [error, setError] = useState('');

  useEffect(() => {
    loadQuestion();
  }, [questionId]);

  const loadQuestion = async () => {
    try {
      const [questionData, answersData] = await Promise.all([
        getQAQuestionById(questionId),
        getQAAnswers(questionId)
      ]);
      setQuestion(questionData);
      setAnswers(answersData);

      // Load user votes for question and answers
      await loadUserVotes(questionData, answersData);
    } catch (error) {
      console.error('Failed to load question:', error);
      setError('Failed to load question');
    } finally {
      setLoading(false);
    }
  };

  const loadUserVotes = async (questionData, answersData) => {
    try {
      const votes = {};

      // Get vote for question
      const questionVote = await getUserQAVote('question', questionData.id);
      if (questionVote.vote_type) {
        votes[`question_${questionData.id}`] = questionVote.vote_type;
      }

      // Get votes for all answers
      for (const answer of answersData) {
        const answerVote = await getUserQAVote('answer', answer.id);
        if (answerVote.vote_type) {
          votes[`answer_${answer.id}`] = answerVote.vote_type;
        }
      }

      setUserVotes(votes);
    } catch (error) {
      console.error('Failed to load votes:', error);
    }
  };

  const handleVote = async (entityType, entityId, voteType) => {
    try {
      await castQAVote(entityType, entityId, voteType);

      // Update local vote state
      const key = `${entityType}_${entityId}`;
      const currentVote = userVotes[key];

      if (currentVote === voteType) {
        // Clicking same vote removes it
        setUserVotes(prev => {
          const newVotes = { ...prev };
          delete newVotes[key];
          return newVotes;
        });
      } else {
        // Set new vote
        setUserVotes(prev => ({ ...prev, [key]: voteType }));
      }

      await loadQuestion();
    } catch (error) {
      console.error('Vote failed:', error);
      setError(error.response?.data?.detail || 'Failed to vote');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleSubmitAnswer = async (e) => {
    e.preventDefault();
    if (!answerContent.trim()) return;

    setSubmitting(true);
    setError('');
    try {
      await createQAAnswer(questionId, answerContent.trim());
      setAnswerContent('');
      await loadQuestion();
      onUpdate();
    } catch (error) {
      console.error('Failed to submit answer:', error);
      setError(error.response?.data?.detail || 'Failed to submit answer');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAcceptAnswer = async (answerId) => {
    try {
      await acceptQAAnswer(answerId);
      await loadQuestion();
      onUpdate();
    } catch (error) {
      console.error('Failed to accept answer:', error);
      setError(error.response?.data?.detail || 'Failed to accept answer');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleDeleteAnswer = async (answerId) => {
    if (!window.confirm('Are you sure you want to delete this answer?')) return;

    try {
      await deleteQAAnswer(answerId);
      await loadQuestion();
      onUpdate();
    } catch (error) {
      console.error('Failed to delete answer:', error);
      setError(error.response?.data?.detail || 'Failed to delete answer');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleDeleteQuestion = async () => {
    if (!window.confirm('Are you sure you want to delete this question? This action cannot be undone.')) return;

    try {
      await deleteQAQuestion(questionId);
      onUpdate();
      onClose();
    } catch (error) {
      console.error('Failed to delete question:', error);
      setError(error.response?.data?.detail || 'Failed to delete question');
      setTimeout(() => setError(''), 3000);
    }
  };

  const loadComments = async (answerId) => {
    try {
      const data = await getQAComments(answerId);
      setComments(prev => ({ ...prev, [answerId]: data }));
    } catch (error) {
      console.error('Failed to load comments:', error);
    }
  };

  const handleAddComment = async (answerId) => {
    if (!newComment[answerId]?.trim()) return;

    try {
      await createQAComment(answerId, newComment[answerId].trim());
      setNewComment(prev => ({ ...prev, [answerId]: '' }));
      await loadComments(answerId);
    } catch (error) {
      console.error('Failed to add comment:', error);
      setError(error.response?.data?.detail || 'Failed to add comment');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleDeleteComment = async (commentId, answerId) => {
    try {
      await deleteQAComment(commentId);
      await loadComments(answerId);
    } catch (error) {
      console.error('Failed to delete comment:', error);
      setError(error.response?.data?.detail || 'Failed to delete comment');
      setTimeout(() => setError(''), 3000);
    }
  };

  const toggleComments = async (answerId) => {
    if (!showComments[answerId]) {
      await loadComments(answerId);
    }
    setShowComments(prev => ({ ...prev, [answerId]: !prev[answerId] }));
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

  const VoteButtons = ({ entityType, entityId, upvotes, downvotes, isOwner }) => {
    const key = `${entityType}_${entityId}`;
    const currentVote = userVotes[key];

    return (
      <div className="flex items-center gap-3">
        <button
          onClick={() => !isOwner && handleVote(entityType, entityId, 'upvote')}
          disabled={isOwner}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-xl transition-all ${
            isOwner
              ? 'text-gray-400 dark:text-gray-500 cursor-not-allowed'
              : currentVote === 'upvote'
                ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                : 'text-gray-600 dark:text-gray-400 hover:bg-green-50 dark:hover:bg-green-900/20 hover:text-green-600 dark:hover:text-green-400'
          }`}
          title={isOwner ? "Can't vote on your own content" : "Upvote"}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
          <span className="font-medium">{upvotes}</span>
        </button>
        <button
          onClick={() => !isOwner && handleVote(entityType, entityId, 'downvote')}
          disabled={isOwner}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-xl transition-all ${
            isOwner
              ? 'text-gray-400 dark:text-gray-500 cursor-not-allowed'
              : currentVote === 'downvote'
                ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                : 'text-gray-600 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400'
          }`}
          title={isOwner ? "Can't vote on your own content" : "Downvote"}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
          <span className="font-medium">{downvotes}</span>
        </button>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 text-center">
          <p className="text-gray-600 dark:text-gray-400">Question not found</p>
          <button
            onClick={onClose}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="flex justify-between items-start">
            <div className="flex-1 pr-4">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                {question.title}
              </h2>
              <div className="flex items-center gap-3 flex-wrap">
                <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg text-sm font-medium">
                  {question.subject}
                </span>
                {question.grade && (
                  <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg text-sm font-medium">
                    {question.grade.toUpperCase().replace('SEC', 'SEC ').replace('JC', 'JC ')}
                  </span>
                )}
                {question.bounty_active && question.bounty_amount > 0 && (
                  <div className="flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-900/30 dark:to-orange-800/30 rounded-lg border border-orange-200 dark:border-orange-700">
                    <svg className="w-4 h-4 text-orange-600 dark:text-orange-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.736 6.979C9.208 6.193 9.696 6 10 6c.304 0 .792.193 1.264.979a1 1 0 001.715-1.029C12.279 4.784 11.232 4 10 4s-2.279.784-2.979 1.95c-.285.475-.507 1-.67 1.55H6a1 1 0 000 2h.013a9.358 9.358 0 000 1H6a1 1 0 100 2h.351c.163.55.385 1.075.67 1.55C7.721 15.216 8.768 16 10 16s2.279-.784 2.979-1.95a1 1 0 10-1.715-1.029c-.472.786-.96.979-1.264.979-.304 0-.792-.193-1.264-.979a4.265 4.265 0 01-.264-.521H10a1 1 0 100-2H8.017a7.36 7.36 0 010-1H10a1 1 0 100-2H8.472c.08-.185.167-.36.264-.521z" />
                    </svg>
                    <span className="text-orange-600 dark:text-orange-400 font-bold text-sm">
                      {question.bounty_amount} credits bounty
                    </span>
                  </div>
                )}
                <span className={`px-3 py-1 rounded-lg text-sm font-medium ${
                  question.status === 'solved'
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                }`}>
                  {question.status === 'solved' ? 'Solved' : 'Open'}
                </span>
                {/* Tags */}
                {question.tags && question.tags.length > 0 && question.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-md text-xs"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-300 text-sm">
            {error}
          </div>
        )}

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Question Content */}
          <div className="mb-8 p-6 bg-gray-50 dark:bg-gray-900 rounded-2xl">
            <div className="prose prose-blue dark:prose-invert max-w-none mb-4">
              <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                {question.content}
              </ReactMarkdown>
            </div>

            {/* Attached Images */}
            {question.images && question.images.length > 0 && (
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                  Attachments ({question.images.length})
                </p>
                <div className="flex flex-wrap gap-3">
                  {question.images.map((imageUrl, index) => (
                    <a
                      key={index}
                      href={`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}${imageUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block"
                    >
                      <img
                        src={`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}${imageUrl}`}
                        alt={`Attachment ${index + 1}`}
                        className="h-32 w-auto object-cover rounded-lg border border-gray-200 dark:border-gray-600 hover:opacity-90 transition-opacity cursor-pointer"
                      />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Question Meta and Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
              <VoteButtons
                entityType="question"
                entityId={question.id}
                upvotes={question.upvotes}
                downvotes={question.downvotes}
                isOwner={question.user_id === currentUser.id}
              />
              <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                <span>by {question.user_name || 'Anonymous'}</span>
                <span>{formatTimeAgo(question.created_at)}</span>
                <span>{question.view_count} views</span>
                {question.user_id === currentUser.id && (
                  <button
                    onClick={handleDeleteQuestion}
                    className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Answers Section */}
          <div className="mb-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              {answers.length} {answers.length === 1 ? 'Answer' : 'Answers'}
            </h3>

            {answers.length === 0 ? (
              <div className="p-8 bg-gray-50 dark:bg-gray-900 rounded-2xl text-center">
                <p className="text-gray-500 dark:text-gray-400">No answers yet. Be the first to help!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {answers.map((answer) => (
                  <div
                    key={answer.id}
                    className={`p-6 rounded-2xl border-2 ${
                      answer.is_accepted
                        ? 'bg-green-50 dark:bg-green-900/20 border-green-500 dark:border-green-600'
                        : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    {/* Accepted Badge */}
                    {answer.is_accepted && (
                      <div className="mb-3 flex items-center gap-2 text-green-600 dark:text-green-400 font-semibold">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                        </svg>
                        Accepted Answer
                        {question.bounty_amount > 0 && (
                          <span className="text-orange-600 dark:text-orange-400 text-sm">
                            (+{question.bounty_amount} credits awarded)
                          </span>
                        )}
                      </div>
                    )}

                    {/* Answer Content */}
                    <div className="prose prose-blue dark:prose-invert max-w-none mb-4">
                      <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                        {answer.content}
                      </ReactMarkdown>
                    </div>

                    {/* Answer Actions */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex items-center gap-4">
                        <VoteButtons
                          entityType="answer"
                          entityId={answer.id}
                          upvotes={answer.upvotes}
                          downvotes={answer.downvotes}
                          isOwner={answer.user_id === currentUser.id}
                        />

                        {/* Accept Button */}
                        {question.user_id === currentUser.id &&
                         !question.accepted_answer_id &&
                         answer.user_id !== currentUser.id && (
                          <button
                            onClick={() => handleAcceptAnswer(answer.id)}
                            className="px-4 py-1.5 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 transition-colors"
                          >
                            Accept Answer
                          </button>
                        )}

                        {/* Comments Toggle */}
                        <button
                          onClick={() => toggleComments(answer.id)}
                          className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          {showComments[answer.id] ? 'Hide' : 'Show'} Comments
                          {comments[answer.id]?.length > 0 && ` (${comments[answer.id].length})`}
                        </button>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                        <span>by {answer.user_name || 'Anonymous'}</span>
                        <span>{formatTimeAgo(answer.created_at)}</span>
                        {answer.user_id === currentUser.id && !answer.is_accepted && (
                          <button
                            onClick={() => handleDeleteAnswer(answer.id)}
                            className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Comments Section */}
                    {showComments[answer.id] && (
                      <div className="mt-4 pl-4 border-l-2 border-gray-300 dark:border-gray-600">
                        {comments[answer.id]?.map((comment) => (
                          <div key={comment.id} className="mb-2 p-3 bg-gray-100 dark:bg-gray-800 rounded-xl">
                            <p className="text-gray-700 dark:text-gray-300 text-sm">{comment.content}</p>
                            <div className="mt-1 flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                              <span>{comment.user_name || 'Anonymous'}</span>
                              <span>{formatTimeAgo(comment.created_at)}</span>
                              {comment.user_id === currentUser.id && (
                                <button
                                  onClick={() => handleDeleteComment(comment.id, answer.id)}
                                  className="text-red-600 dark:text-red-400 hover:underline"
                                >
                                  Delete
                                </button>
                              )}
                            </div>
                          </div>
                        ))}

                        {/* Add Comment Form */}
                        <div className="mt-3 flex gap-2">
                          <input
                            type="text"
                            value={newComment[answer.id] || ''}
                            onChange={(e) => setNewComment(prev => ({ ...prev, [answer.id]: e.target.value }))}
                            placeholder="Add a comment..."
                            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleAddComment(answer.id);
                              }
                            }}
                          />
                          <button
                            onClick={() => handleAddComment(answer.id)}
                            disabled={!newComment[answer.id]?.trim()}
                            className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            Add
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Answer Form */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Your Answer</h4>
            <form onSubmit={handleSubmitAnswer}>
              <textarea
                value={answerContent}
                onChange={(e) => setAnswerContent(e.target.value)}
                placeholder="Share your knowledge... (Supports Markdown and LaTeX with $...$)"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all"
                rows={6}
                required
              />
              <div className="mt-3 flex justify-between items-center">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Supports Markdown and LaTeX math ($...$)
                </p>
                <button
                  type="submit"
                  disabled={submitting || !answerContent.trim()}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                >
                  {submitting ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Posting...
                    </span>
                  ) : (
                    'Post Answer'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestionDetailModal;
