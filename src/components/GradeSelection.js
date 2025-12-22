import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { updateUserGrade } from '../services/api';

const GRADE_OPTIONS = [
  { value: 'sec1', label: 'Secondary 1', category: 'Secondary School' },
  { value: 'sec2', label: 'Secondary 2', category: 'Secondary School' },
  { value: 'sec3', label: 'Secondary 3', category: 'Secondary School' },
  { value: 'sec4', label: 'Secondary 4', category: 'Secondary School' },
  { value: 'jc1', label: 'Junior College 1', category: 'Junior College' },
  { value: 'jc2', label: 'Junior College 2', category: 'Junior College' },
  { value: 'poly1', label: 'Polytechnic Year 1', category: 'Polytechnic' },
  { value: 'poly2', label: 'Polytechnic Year 2', category: 'Polytechnic' },
  { value: 'poly3', label: 'Polytechnic Year 3', category: 'Polytechnic' },
  { value: 'uni1', label: 'University Year 1', category: 'University' },
  { value: 'uni2', label: 'University Year 2', category: 'University' },
  { value: 'uni3', label: 'University Year 3', category: 'University' },
  { value: 'uni4', label: 'University Year 4', category: 'University' },
];

const GradeSelection = ({ user, onGradeSelected }) => {
  const navigate = useNavigate();
  const [selectedGrade, setSelectedGrade] = useState(user?.grade || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedGrade) {
      setError('Please select your grade level');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await updateUserGrade(selectedGrade);
      if (onGradeSelected) {
        onGradeSelected();
      }
      navigate('/dashboard');
    } catch (err) {
      console.error('Failed to update grade:', err);
      setError('Failed to update grade. Please try again.');
      setLoading(false);
    }
  };

  // Group grades by category
  const groupedGrades = GRADE_OPTIONS.reduce((acc, grade) => {
    if (!acc[grade.category]) {
      acc[grade.category] = [];
    }
    acc[grade.category].push(grade);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome, {user?.name?.split(' ')[0]}!</h1>
          <p className="text-gray-600">Select your current grade level to get started</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            {Object.entries(groupedGrades).map(([category, grades]) => (
              <div key={category}>
                <h3 className="text-sm font-semibold text-gray-700 mb-3 px-1">{category}</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {grades.map((grade) => (
                    <button
                      key={grade.value}
                      type="button"
                      onClick={() => setSelectedGrade(grade.value)}
                      className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                        selectedGrade === grade.value
                          ? 'border-primary-600 bg-primary-50 shadow-md'
                          : 'border-gray-200 bg-white hover:border-primary-300 hover:bg-primary-25'
                      }`}
                    >
                      <div className="text-center">
                        <p className={`font-semibold ${
                          selectedGrade === grade.value ? 'text-primary-700' : 'text-gray-900'
                        }`}>
                          {grade.label}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 flex gap-4">
            <button
              type="submit"
              disabled={loading || !selectedGrade}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-lg font-semibold hover:from-primary-700 hover:to-secondary-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              {loading ? 'Saving...' : 'Continue to Dashboard'}
            </button>
          </div>
        </form>

        {user?.grade && (
          <div className="mt-6 text-center">
            <button
              onClick={() => {
                if (onGradeSelected) {
                  onGradeSelected();
                }
                navigate('/dashboard');
              }}
              className="text-sm text-gray-600 hover:text-gray-900 underline"
            >
              Skip for now
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default GradeSelection;
