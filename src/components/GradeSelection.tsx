import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { updateUserGrade } from '../services/api';
import {
  GraduationCap,
  BookOpen,
  Briefcase,
  Building2,
  Check,
  Sparkles,
  ArrowRight
} from 'lucide-react';

const GRADE_OPTIONS = [
  { value: 'sec1', label: 'Secondary 1', category: 'Secondary School', icon: BookOpen, color: 'blue' },
  { value: 'sec2', label: 'Secondary 2', category: 'Secondary School', icon: BookOpen, color: 'blue' },
  { value: 'sec3', label: 'Secondary 3', category: 'Secondary School', icon: BookOpen, color: 'blue' },
  { value: 'sec4', label: 'Secondary 4', category: 'Secondary School', icon: BookOpen, color: 'blue' },
  { value: 'jc1', label: 'Junior College 1', category: 'Junior College', icon: GraduationCap, color: 'purple' },
  { value: 'jc2', label: 'Junior College 2', category: 'Junior College', icon: GraduationCap, color: 'purple' },
  { value: 'poly1', label: 'Polytechnic Year 1', category: 'Polytechnic', icon: Briefcase, color: 'orange' },
  { value: 'poly2', label: 'Polytechnic Year 2', category: 'Polytechnic', icon: Briefcase, color: 'orange' },
  { value: 'poly3', label: 'Polytechnic Year 3', category: 'Polytechnic', icon: Briefcase, color: 'orange' },
  { value: 'uni1', label: 'University Year 1', category: 'University', icon: Building2, color: 'green' },
  { value: 'uni2', label: 'University Year 2', category: 'University', icon: Building2, color: 'green' },
  { value: 'uni3', label: 'University Year 3', category: 'University', icon: Building2, color: 'green' },
  { value: 'uni4', label: 'University Year 4', category: 'University', icon: Building2, color: 'green' },
];

interface GradeSelectionProps {
  user: any;
  onGradeSelected: () => void;
}

const GradeSelection: React.FC<GradeSelectionProps> = ({ user, onGradeSelected }) => {
  const navigate = useNavigate();
  const [selectedGrade, setSelectedGrade] = useState(user?.grade || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
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
  const groupedGrades = GRADE_OPTIONS.reduce((acc: any, grade) => {
    if (!acc[grade.category]) {
      acc[grade.category] = [];
    }
    acc[grade.category].push(grade);
    return acc;
  }, {});

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Secondary School': return BookOpen;
      case 'Junior College': return GraduationCap;
      case 'Polytechnic': return Briefcase;
      case 'University': return Building2;
      default: return BookOpen;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Secondary School': return 'blue';
      case 'Junior College': return 'purple';
      case 'Polytechnic': return 'orange';
      case 'University': return 'green';
      default: return 'blue';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-5xl w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-orange-500 to-blue-500 mb-6 shadow-lg">
            <Sparkles className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-3">
            Welcome, <span className="bg-gradient-to-r from-orange-600 to-blue-600 bg-clip-text text-transparent">{user?.name?.split(' ')[0]}</span>!
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Select your current education level to personalize your learning experience
          </p>
        </div>

        {error && (
          <div className="mb-8 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg animate-in fade-in slide-in-from-top-2 duration-300">
            <p className="text-sm text-red-700 font-medium">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="space-y-8">
            {Object.entries(groupedGrades).map(([category, grades]: [string, any]) => {
              const CategoryIcon = getCategoryIcon(category);
              const color = getCategoryColor(category);

              return (
                <div key={category} className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow duration-300">
                  <div className="flex items-center gap-3 mb-5">
                    <div className={`p-2 rounded-lg ${
                      color === 'blue' ? 'bg-blue-100' :
                      color === 'purple' ? 'bg-purple-100' :
                      color === 'orange' ? 'bg-orange-100' :
                      'bg-green-100'
                    }`}>
                      <CategoryIcon className={`w-5 h-5 ${
                        color === 'blue' ? 'text-blue-600' :
                        color === 'purple' ? 'text-purple-600' :
                        color === 'orange' ? 'text-orange-600' :
                        'text-green-600'
                      }`} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">{category}</h3>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {grades.map((grade: any) => {
                      const isSelected = selectedGrade === grade.value;
                      return (
                        <button
                          key={grade.value}
                          type="button"
                          onClick={() => setSelectedGrade(grade.value)}
                          className={`relative p-4 rounded-xl border-2 transition-all duration-200 group ${
                            isSelected
                              ? `border-${color}-500 bg-${color}-50 shadow-md scale-105`
                              : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md hover:scale-102'
                          }`}
                          style={{
                            borderColor: isSelected ?
                              (color === 'blue' ? '#3b82f6' :
                               color === 'purple' ? '#a855f7' :
                               color === 'orange' ? '#f97316' : '#22c55e') : undefined,
                            backgroundColor: isSelected ?
                              (color === 'blue' ? '#eff6ff' :
                               color === 'purple' ? '#faf5ff' :
                               color === 'orange' ? '#fff7ed' : '#f0fdf4') : undefined
                          }}
                        >
                          {isSelected && (
                            <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-gradient-to-br from-orange-500 to-blue-500 flex items-center justify-center shadow-lg">
                              <Check className="w-4 h-4 text-white" />
                            </div>
                          )}
                          <div className="text-center">
                            <p className={`font-semibold text-sm ${
                              isSelected ? 'text-gray-900' : 'text-gray-700 group-hover:text-gray-900'
                            }`}>
                              {grade.label.replace(category.split(' ')[0] + ' ', '')}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-10 flex gap-4">
            <button
              type="submit"
              disabled={loading || !selectedGrade}
              className="flex-1 group relative px-8 py-4 bg-gradient-to-r from-orange-500 to-blue-500 text-white rounded-xl font-semibold hover:from-orange-600 hover:to-blue-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl disabled:hover:shadow-lg transform hover:scale-105 disabled:hover:scale-100"
            >
              <span className="flex items-center justify-center gap-2">
                {loading ? 'Saving...' : 'Continue to Dashboard'}
                {!loading && <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
              </span>
            </button>
          </div>
        </form>

        {user?.grade && (
          <div className="mt-8 text-center">
            <button
              onClick={() => {
                if (onGradeSelected) {
                  onGradeSelected();
                }
                navigate('/dashboard');
              }}
              className="text-sm text-gray-600 hover:text-gray-900 underline underline-offset-4 transition-colors"
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
