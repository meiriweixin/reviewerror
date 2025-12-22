import React, { useState, useEffect } from 'react';
import { getAllUsersTokenUsage } from '../services/api';

const Usage = ({ user }) => {
  const [usage, setUsage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadUsage();
  }, []);

  const loadUsage = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getAllUsersTokenUsage();
      setUsage(data);
    } catch (err) {
      console.error('Error loading token usage:', err);
      setError('Failed to load token usage data');
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num) => {
    return num?.toLocaleString() || '0';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  // Calculate estimated cost (rough estimate based on GPT-4o pricing)
  // GPT-4o: $5 per 1M input tokens, $15 per 1M output tokens
  const calculateEstimatedCost = (promptTokens, completionTokens) => {
    const inputCost = (promptTokens / 1000000) * 5;
    const outputCost = (completionTokens / 1000000) * 15;
    return (inputCost + outputCost).toFixed(4);
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading usage data...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
          <div className="flex items-center">
            <svg className="w-6 h-6 text-red-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  const totalCost = calculateEstimatedCost(
    usage?.total_prompt_tokens || 0,
    usage?.total_completion_tokens || 0
  );

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">System-Wide Token Usage</h1>
        <p className="text-gray-600">Total AI token consumption across all {usage?.total_users || 0} users</p>
      </div>

      {/* Main Stats Cards - System-Wide Totals */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Tokens */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/20 rounded-xl">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
          <p className="text-white/80 text-sm font-medium mb-1">Total Tokens (All Users)</p>
          <p className="text-3xl font-bold">{formatNumber(usage?.total_tokens)}</p>
        </div>

        {/* Input Tokens */}
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/20 rounded-xl">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
              </svg>
            </div>
          </div>
          <p className="text-white/80 text-sm font-medium mb-1">Input Tokens</p>
          <p className="text-3xl font-bold">{formatNumber(usage?.total_prompt_tokens)}</p>
        </div>

        {/* Output Tokens */}
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/20 rounded-xl">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8l-4 4m0 0l4 4m-4-4h18" />
              </svg>
            </div>
          </div>
          <p className="text-white/80 text-sm font-medium mb-1">Output Tokens</p>
          <p className="text-3xl font-bold">{formatNumber(usage?.total_completion_tokens)}</p>
        </div>

        {/* Estimated Cost */}
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/20 rounded-xl">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <p className="text-white/80 text-sm font-medium mb-1">Estimated Cost</p>
          <p className="text-3xl font-bold">${totalCost}</p>
        </div>
      </div>

      {/* Individual Users Breakdown */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
          <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          Individual User Usage
        </h2>

        {!usage?.users || usage.users.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No users found</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-3 px-4 text-gray-600 font-semibold">#</th>
                  <th className="text-left py-3 px-4 text-gray-600 font-semibold">User</th>
                  <th className="text-right py-3 px-4 text-gray-600 font-semibold">Total Tokens</th>
                  <th className="text-right py-3 px-4 text-gray-600 font-semibold">Input</th>
                  <th className="text-right py-3 px-4 text-gray-600 font-semibold">Output</th>
                  <th className="text-right py-3 px-4 text-gray-600 font-semibold">Est. Cost</th>
                  <th className="text-left py-3 px-4 text-gray-600 font-semibold">Last Updated</th>
                </tr>
              </thead>
              <tbody>
                {usage.users.map((userItem, index) => (
                  <tr
                    key={userItem.user_id}
                    className={`border-b border-gray-100 hover:bg-gray-50 ${
                      userItem.user_id === user?.id ? 'bg-blue-50' : ''
                    }`}
                  >
                    <td className="py-4 px-4 text-gray-500">{index + 1}</td>
                    <td className="py-4 px-4">
                      <div>
                        <p className="font-semibold text-gray-900">
                          {userItem.name || 'Unknown User'}
                          {userItem.user_id === user?.id && (
                            <span className="ml-2 text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full">You</span>
                          )}
                        </p>
                        <p className="text-sm text-gray-500">{userItem.email}</p>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-right font-semibold text-gray-900">
                      {formatNumber(userItem.total_tokens_used)}
                    </td>
                    <td className="py-4 px-4 text-right text-gray-600">
                      {formatNumber(userItem.prompt_tokens_used)}
                    </td>
                    <td className="py-4 px-4 text-right text-gray-600">
                      {formatNumber(userItem.completion_tokens_used)}
                    </td>
                    <td className="py-4 px-4 text-right font-semibold text-orange-600">
                      ${calculateEstimatedCost(userItem.prompt_tokens_used, userItem.completion_tokens_used)}
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-500">
                      {formatDate(userItem.last_token_update)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Info Card */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
        <div className="flex items-start">
          <svg className="w-6 h-6 text-blue-500 mr-3 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h3 className="text-blue-900 font-bold mb-2">About Token Usage</h3>
            <p className="text-blue-800 text-sm leading-relaxed mb-2">
              <strong>System-Wide Totals:</strong> The statistics above show cumulative token consumption across all {usage?.total_users || 0} users in the system.
              Tokens are consumed when users upload exam papers, generate explanations, and use semantic search features.
            </p>
            <p className="text-blue-800 text-sm leading-relaxed mb-2">
              <strong>Cost Estimation:</strong> Calculated based on GPT-4o pricing ($5 per 1M input tokens, $15 per 1M output tokens).
              Actual costs may vary based on your Azure OpenAI contract and pricing tier.
            </p>
            <p className="text-blue-800 text-sm leading-relaxed">
              <strong>User Ranking:</strong> Users are sorted by total token usage (highest first). Your account is highlighted in blue for easy identification.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Usage;
