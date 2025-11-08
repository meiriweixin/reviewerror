import React, { useState } from 'react';
import { updateUserGrade } from '../services/api';

const GRADE_OPTIONS = [
  { value: 'sec1', label: 'Secondary 1' },
  { value: 'sec2', label: 'Secondary 2' },
  { value: 'sec3', label: 'Secondary 3' },
  { value: 'sec4', label: 'Secondary 4' },
  { value: 'jc1', label: 'Junior College 1' },
  { value: 'jc2', label: 'Junior College 2' },
  { value: 'poly1', label: 'Polytechnic Year 1' },
  { value: 'poly2', label: 'Polytechnic Year 2' },
  { value: 'poly3', label: 'Polytechnic Year 3' },
  { value: 'uni1', label: 'University Year 1' },
  { value: 'uni2', label: 'University Year 2' },
  { value: 'uni3', label: 'University Year 3' },
  { value: 'uni4', label: 'University Year 4' },
];

const Settings = ({ user }) => {
  const [grade, setGrade] = useState(user?.grade || '');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleSaveGrade = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      await updateUserGrade(grade);
      setMessage({ type: 'success', text: 'Grade updated successfully!' });
    } catch (error) {
      console.error('Failed to update grade:', error);
      setMessage({ type: 'error', text: 'Failed to update grade. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
        <p className="text-gray-600 mt-1">Manage your account preferences</p>
      </div>

      {/* Profile Information */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Profile Information</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
            <input
              type="text"
              value={user?.name || ''}
              disabled
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              type="email"
              value={user?.email || ''}
              disabled
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
            />
          </div>
        </div>
      </div>

      {/* Grade Settings */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Academic Settings</h3>

        {message.text && (
          <div className={`mb-4 p-4 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-50 border border-green-200 text-green-700'
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}>
            <p className="text-sm">{message.text}</p>
          </div>
        )}

        <form onSubmit={handleSaveGrade}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Current Grade Level</label>
            <select
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">Select your grade</option>
              {GRADE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={saving || !grade}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>

      {/* App Information */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">About</h3>
        <div className="space-y-3 text-sm text-gray-600">
          <p>
            <span className="font-medium text-gray-900">Version:</span> 1.0.0
          </p>
          <p>
            <span className="font-medium text-gray-900">Description:</span> AI-powered Student Review App helps you track and master wrongly answered questions across all subjects.
          </p>
          <p>
            <span className="font-medium text-gray-900">Technology:</span> Built with React, FastAPI, and Azure OpenAI GPT-4o Vision
          </p>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <h4 className="font-semibold text-gray-900 mb-2">Features</h4>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-center gap-2">
              <svg className="w-4 h-4 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
              </svg>
              AI-powered question extraction from images
            </li>
            <li className="flex items-center gap-2">
              <svg className="w-4 h-4 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
              </svg>
              Vector database storage with Supabase
            </li>
            <li className="flex items-center gap-2">
              <svg className="w-4 h-4 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
              </svg>
              Progress tracking and analytics
            </li>
            <li className="flex items-center gap-2">
              <svg className="w-4 h-4 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
              </svg>
              Google OAuth authentication
            </li>
          </ul>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            © 2024 Student Review App. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Settings;
