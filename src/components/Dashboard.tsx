import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Upload as UploadIcon,
  BookOpen,
  BarChart3,
  Settings as SettingsIcon,
  Activity,
  ChevronsRight,
  Moon,
  Sun,
  Bell,
  User,
  LogOut,
  GraduationCap,
  ChevronDown
} from 'lucide-react';
import Upload from './Upload';
import Review from './Review';
import Progress from './Progress';
import Settings from './Settings';
import Usage from './Usage';
import { updateUserGrade } from '../services/api';

interface DashboardProps {
  user: any;
  onLogout: () => void;
}

const GRADE_OPTIONS = [
  { value: 'sec1', label: 'SEC 1', category: 'Secondary School' },
  { value: 'sec2', label: 'SEC 2', category: 'Secondary School' },
  { value: 'sec3', label: 'SEC 3', category: 'Secondary School' },
  { value: 'sec4', label: 'SEC 4', category: 'Secondary School' },
  { value: 'jc1', label: 'JC 1', category: 'Junior College' },
  { value: 'jc2', label: 'JC 2', category: 'Junior College' },
  { value: 'poly1', label: 'Poly 1', category: 'Polytechnic' },
  { value: 'poly2', label: 'Poly 2', category: 'Polytechnic' },
  { value: 'poly3', label: 'Poly 3', category: 'Polytechnic' },
  { value: 'uni1', label: 'Uni 1', category: 'University' },
  { value: 'uni2', label: 'Uni 2', category: 'University' },
  { value: 'uni3', label: 'Uni 3', category: 'University' },
  { value: 'uni4', label: 'Uni 4', category: 'University' },
];

const Dashboard: React.FC<DashboardProps> = ({ user, onLogout }) => {
  const navigate = useNavigate();
  // Initialize activeTab from localStorage if available (for grade change persistence)
  const [activeTab, setActiveTab] = useState(() => {
    const savedTab = localStorage.getItem('activeTab');
    return savedTab || 'upload';
  });
  const [sidebarOpen, setSidebarOpen] = useState(true);
  // Initialize dark mode from localStorage, default to false
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved === 'true';
  });
  const [showNotifications, setShowNotifications] = useState(false);
  const [showGradeDropdown, setShowGradeDropdown] = useState(false);
  const [currentGrade, setCurrentGrade] = useState(user?.grade || '');

  // Persist dark mode preference and apply to document
  useEffect(() => {
    localStorage.setItem('darkMode', String(isDark));
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showNotifications && !target.closest('.notification-container')) {
        setShowNotifications(false);
      }
      if (showGradeDropdown && !target.closest('.grade-dropdown-container')) {
        setShowGradeDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showNotifications, showGradeDropdown]);

  // Update currentGrade when user prop changes
  useEffect(() => {
    if (user?.grade) {
      setCurrentGrade(user.grade);
    }
  }, [user?.grade]);

  // Save activeTab to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('activeTab', activeTab);
  }, [activeTab]);

  const handleGradeChange = async (newGrade: string) => {
    try {
      // Save current active tab before reload so we can restore it
      localStorage.setItem('activeTab', activeTab);

      await updateUserGrade(newGrade);
      setCurrentGrade(newGrade);
      setShowGradeDropdown(false);
      // Refresh page to update user data
      window.location.reload();
    } catch (error) {
      console.error('Failed to update grade:', error);
      alert('Failed to update grade. Please try again.');
    }
  };

  // Format grade for display
  const formatGrade = (grade: string | null | undefined): string => {
    if (!grade) return 'No Grade';

    const gradeMap: { [key: string]: string } = {
      'sec1': 'SEC 1',
      'sec2': 'SEC 2',
      'sec3': 'SEC 3',
      'sec4': 'SEC 4',
      'jc1': 'JC 1',
      'jc2': 'JC 2',
      'poly1': 'Poly 1',
      'poly2': 'Poly 2',
      'poly3': 'Poly 3',
      'uni1': 'Uni 1',
      'uni2': 'Uni 2',
      'uni3': 'Uni 3',
      'uni4': 'Uni 4',
    };

    return gradeMap[grade.toLowerCase()] || grade.toUpperCase();
  };

  const menuItems = [
    { id: 'upload', label: 'Upload', icon: UploadIcon },
    { id: 'review', label: 'Review', icon: BookOpen },
    { id: 'progress', label: 'Progress', icon: BarChart3 },
    { id: 'usage', label: 'Usage', icon: Activity },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ];

  return (
    <div className={`flex min-h-screen w-full ${isDark ? 'dark' : ''}`}>
      <div className="flex w-full bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
        {/* Sidebar */}
        <nav
          className={`sticky top-0 h-screen shrink-0 border-r transition-all duration-300 ease-in-out ${
            sidebarOpen ? 'w-64' : 'w-16'
          } border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-2 shadow-sm rounded-r-2xl`}
        >
          {/* Logo Section */}
          <div className="mb-6 border-b border-gray-200 dark:border-gray-800 pb-4">
            <div className="flex items-center justify-between rounded-md p-2">
              <div className="flex items-center gap-3">
                <div className="grid size-10 shrink-0 place-content-center rounded-lg bg-gradient-to-br from-orange-500 to-blue-500 shadow-sm">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                {sidebarOpen && (
                  <div className={`transition-opacity duration-200 ${sidebarOpen ? 'opacity-100' : 'opacity-0'}`}>
                    <span className="block text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {user?.name || 'Student'}
                    </span>
                    <span className="block text-xs text-gray-500 dark:text-gray-400">
                      {user?.email || ''}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Grade Selection */}
          <div className="mb-4 px-2 grade-dropdown-container">
            <div className="relative">
              <button
                onClick={() => setShowGradeDropdown(!showGradeDropdown)}
                className={`relative flex h-11 w-full items-center rounded-md transition-all duration-200 ${
                  showGradeDropdown
                    ? "bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200"
                }`}
              >
                <div className="grid h-full w-12 place-content-center">
                  <GraduationCap className="h-4 w-4" />
                </div>
                {sidebarOpen && (
                  <div className="flex items-center justify-between flex-1 pr-2">
                    <span className="text-sm font-medium">Grade</span>
                    <div className="flex items-center gap-1">
                      <span className="text-xs">{formatGrade(currentGrade)}</span>
                      <ChevronDown className={`h-3 w-3 transition-transform ${showGradeDropdown ? 'rotate-180' : ''}`} />
                    </div>
                  </div>
                )}
              </button>

              {/* Grade Dropdown Menu */}
              {showGradeDropdown && sidebarOpen && (
                <div className="absolute left-0 right-0 top-full mt-1 mx-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
                  {GRADE_OPTIONS.reduce((acc: any[], option, index, array) => {
                    // Add category header if it's the first item or category changed
                    if (index === 0 || option.category !== array[index - 1].category) {
                      acc.push(
                        <div key={`header-${option.category}`} className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                          {option.category}
                        </div>
                      );
                    }
                    // Add the option
                    acc.push(
                      <button
                        key={option.value}
                        onClick={() => handleGradeChange(option.value)}
                        className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                          currentGrade === option.value
                            ? 'bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-medium'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                      >
                        {option.label}
                      </button>
                    );
                    return acc;
                  }, [])}
                </div>
              )}
            </div>
          </div>

          {/* Menu Items */}
          <div className="space-y-1 mb-8">
            {menuItems.map((item) => {
              const isSelected = activeTab === item.id;
              const Icon = item.icon;

              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`relative flex h-11 w-full items-center rounded-md transition-all duration-200 ${
                    isSelected
                      ? "bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 shadow-sm border-l-2 border-blue-500"
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200"
                  }`}
                >
                  <div className="grid h-full w-12 place-content-center">
                    <Icon className="h-4 w-4" />
                  </div>

                  {sidebarOpen && (
                    <span
                      className={`text-sm font-medium transition-opacity duration-200 ${
                        sidebarOpen ? 'opacity-100' : 'opacity-0'
                      }`}
                    >
                      {item.label}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Account Actions */}
          {sidebarOpen && (
            <div className="border-t border-gray-200 dark:border-gray-800 pt-4 space-y-1">
              <button
                onClick={onLogout}
                className="relative flex h-11 w-full items-center rounded-md transition-all duration-200 text-gray-600 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400"
              >
                <div className="grid h-full w-12 place-content-center">
                  <LogOut className="h-4 w-4" />
                </div>
                <span className="text-sm font-medium">Logout</span>
              </button>
            </div>
          )}

          {/* Toggle Button */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="absolute bottom-0 left-0 right-0 border-t border-gray-200 dark:border-gray-800 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            <div className="flex items-center p-3">
              <div className="grid size-10 place-content-center">
                <ChevronsRight
                  className={`h-4 w-4 transition-transform duration-300 text-gray-500 dark:text-gray-400 ${
                    sidebarOpen ? "rotate-180" : ""
                  }`}
                />
              </div>
              {sidebarOpen && (
                <span
                  className={`text-sm font-medium text-gray-600 dark:text-gray-300 transition-opacity duration-200 ${
                    sidebarOpen ? 'opacity-100' : 'opacity-0'
                  }`}
                >
                  Hide
                </span>
              )}
            </div>
          </button>
        </nav>

        {/* Main Content */}
        <div className="flex-1 bg-gray-50 dark:bg-gray-950 overflow-auto rounded-2xl m-2 ml-0">
          {/* Header */}
          <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-10 shadow-sm rounded-t-2xl">
            <div className="flex items-center justify-between p-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {menuItems.find(item => item.id === activeTab)?.label || 'Dashboard'}
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {activeTab === 'upload' && 'Upload and extract questions from your exam papers'}
                  {activeTab === 'review' && 'Review your wrongly answered questions'}
                  {activeTab === 'progress' && 'Track your learning progress and achievements'}
                  {activeTab === 'usage' && 'Monitor your AI token consumption and costs'}
                  {activeTab === 'settings' && 'Manage your account settings'}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {/* Notifications */}
                <div className="relative notification-container">
                  <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="relative p-2 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                  >
                    <Bell className="h-5 w-5" />
                    <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full"></span>
                  </button>

                  {/* Notifications Dropdown */}
                  {showNotifications && (
                    <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
                      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100">Notifications</h3>
                      </div>
                      <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                        <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No new notifications</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Dark Mode Toggle */}
                <button
                  onClick={() => setIsDark(!isDark)}
                  className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                >
                  {isDark ? (
                    <Sun className="h-4 w-4" />
                  ) : (
                    <Moon className="h-4 w-4" />
                  )}
                </button>

                {/* User Profile - Navigate to Settings */}
                <button
                  onClick={() => setActiveTab('settings')}
                  className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                >
                  <User className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Page Content */}
          <div className="p-6">
            {activeTab === 'upload' && <Upload user={user} />}
            {activeTab === 'review' && <Review user={user} />}
            {activeTab === 'progress' && <Progress user={user} />}
            {activeTab === 'usage' && <Usage user={user} />}
            {activeTab === 'settings' && <Settings user={user} />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
