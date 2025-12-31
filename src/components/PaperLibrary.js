import React, { useState, useEffect } from 'react';
import { getAllPapers, uploadPaper, downloadPaper, openPracticeMode } from '../services/api';
import { Upload, Download, Eye, FileText, User, Calendar, BookOpen, AlertCircle } from 'lucide-react';
import PDFViewer from './PDFViewer';

const SUBJECTS = [
  'Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'Chinese',
  'Geography', 'History', 'Literature', 'Economics', 'Accounting',
  'Computer Science', 'Art', 'Music', 'Physical Education', 'Other'
];

const PaperLibrary = ({ user }) => {
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [filters, setFilters] = useState({
    subject: '',
    grade: ''
  });

  // Upload form state
  const [uploadForm, setUploadForm] = useState({
    file: null,
    title: '',
    subject: '',
    grade: user?.grade || '',
    year: new Date().getFullYear()
  });
  const [uploading, setUploading] = useState(false);

  // PDF Viewer state
  const [viewingPaper, setViewingPaper] = useState(null);
  const [pdfUrl, setPdfUrl] = useState(null);

  useEffect(() => {
    loadPapers();
  }, [filters]);

  const loadPapers = async () => {
    try {
      setLoading(true);
      const response = await getAllPapers(filters);
      setPapers(response.papers || []);
      setError('');
    } catch (err) {
      console.error('Error loading papers:', err);
      setError('Failed to load papers. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        setError('Please upload a PDF file');
        return;
      }
      if (file.size > 50 * 1024 * 1024) {
        setError('File size must be less than 50MB');
        return;
      }
      setUploadForm({ ...uploadForm, file });
      setError('');
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();

    if (!uploadForm.file || !uploadForm.title || !uploadForm.subject) {
      setError('Please fill in all required fields');
      return;
    }

    setUploading(true);
    setError('');

    try {
      await uploadPaper(
        uploadForm.file,
        uploadForm.title,
        uploadForm.subject,
        uploadForm.grade,
        uploadForm.year
      );

      setSuccess('Paper uploaded successfully! You earned +1 credit.');
      setShowUploadModal(false);
      setUploadForm({
        file: null,
        title: '',
        subject: '',
        grade: user?.grade || '',
        year: new Date().getFullYear()
      });

      // Reload papers and refresh page to update credits
      await loadPapers();
      setTimeout(() => window.location.reload(), 1500);
    } catch (err) {
      console.error('Error uploading paper:', err);
      setError(err.response?.data?.detail || 'Failed to upload paper. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (paper) => {
    try {
      const response = await downloadPaper(paper.id);

      // Open download URL in new tab
      window.open(response.file_url, '_blank');

      setSuccess(`Downloaded "${paper.title}". Credits remaining: ${response.credits_remaining}`);

      // Reload papers to update counts
      await loadPapers();

      // Reload page to update credits display
      setTimeout(() => window.location.reload(), 1500);
    } catch (err) {
      console.error('Error downloading paper:', err);
      if (err.response?.status === 402) {
        setError(err.response.data.detail || 'Insufficient credits');
      } else {
        setError('Failed to download paper. Please try again.');
      }
    }
  };

  const handleOpenPractice = async (paper) => {
    try {
      const response = await openPracticeMode(paper.id);

      // Open PDF viewer with the paper
      setViewingPaper(response.paper);
      setPdfUrl(response.file_url);

      // Reload papers to update counts
      await loadPapers();
    } catch (err) {
      console.error('Error opening practice mode:', err);
      if (err.response?.status === 402) {
        setError(err.response.data.detail || 'Insufficient credits');
      } else {
        setError('Failed to open practice mode. Please try again.');
      }
    }
  };

  const handleClosePDFViewer = () => {
    setViewingPaper(null);
    setPdfUrl(null);
    // Reload page to update credits in sidebar
    window.location.reload();
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Action Button - Top Right */}
      <div className="flex justify-end mb-6">
        <button
          onClick={() => setShowUploadModal(true)}
          className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg flex items-center gap-2"
        >
          <Upload className="h-5 w-5" />
          Upload Paper +1
        </button>
      </div>

      {/* Success Message */}
      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-2xl flex items-start gap-3">
          <svg className="w-5 h-5 text-green-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
          </svg>
          <p className="text-sm text-green-700">{success}</p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Filters */}
      <div className="mb-6 bg-white rounded-2xl border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Subject</label>
            <select
              value={filters.subject}
              onChange={(e) => setFilters({ ...filters, subject: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
            >
              <option value="">All Subjects</option>
              {SUBJECTS.map((subject) => (
                <option key={subject} value={subject}>{subject}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Grade</label>
            <select
              value={filters.grade}
              onChange={(e) => setFilters({ ...filters, grade: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
            >
              <option value="">All Grades</option>
              <optgroup label="Primary School">
                <option value="p1">P 1</option>
                <option value="p2">P 2</option>
                <option value="p3">P 3</option>
                <option value="p4">P 4</option>
                <option value="p5">P 5</option>
                <option value="p6">P 6</option>
              </optgroup>
              <optgroup label="Secondary School">
                <option value="sec1">SEC 1</option>
                <option value="sec2">SEC 2</option>
                <option value="sec3">SEC 3</option>
                <option value="sec4">SEC 4</option>
              </optgroup>
              <optgroup label="Junior College">
                <option value="jc1">JC 1</option>
                <option value="jc2">JC 2</option>
              </optgroup>
              <optgroup label="University">
                <option value="uni1">Uni 1</option>
                <option value="uni2">Uni 2</option>
                <option value="uni3">Uni 3</option>
                <option value="uni4">Uni 4</option>
              </optgroup>
            </select>
          </div>
        </div>
      </div>

      {/* Papers Grid */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading papers...</p>
        </div>
      ) : papers.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-gray-200">
          <FileText className="h-16 w-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Papers Found</h3>
          <p className="text-gray-600">Be the first to upload a paper and earn credits!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {papers.map((paper) => (
            <div key={paper.id} className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{paper.title}</h3>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 border border-blue-200">
                      {paper.subject}
                    </span>
                    {paper.grade && (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700 border border-purple-200">
                        {paper.grade.toUpperCase()}
                      </span>
                    )}
                    {paper.year && (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
                        {paper.year}
                      </span>
                    )}
                  </div>
                </div>
                <FileText className="h-8 w-8 text-gray-400" />
              </div>

              <div className="space-y-2 mb-4 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span>{paper.uploader_name || 'Unknown'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>{new Date(paper.upload_date).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <span className="flex items-center gap-1">
                    <Download className="h-3 w-3" />
                    {paper.download_count} downloads
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    {paper.practice_count} practices
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleDownload(paper)}
                  className="flex-1 px-4 py-2 bg-blue-50 text-blue-700 rounded-xl font-medium hover:bg-blue-100 transition-colors border border-blue-200 flex items-center justify-center gap-2 text-sm"
                >
                  <Download className="h-4 w-4" />
                  Download -1
                </button>
                <button
                  onClick={() => handleOpenPractice(paper)}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-orange-50 to-blue-50 text-blue-700 rounded-xl font-medium hover:from-orange-100 hover:to-blue-100 transition-colors border border-blue-200 flex items-center justify-center gap-2 text-sm"
                >
                  <BookOpen className="h-4 w-4" />
                  Practice -1
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Upload Exam Paper</h3>
            <p className="text-sm text-gray-600 mb-6">Share a paper and earn +1 credit</p>

            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  PDF File *
                </label>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Max 50MB, PDF only</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={uploadForm.title}
                  onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                  placeholder="e.g., 2023 Mid-Year Mathematics Exam"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Subject *
                </label>
                <select
                  value={uploadForm.subject}
                  onChange={(e) => setUploadForm({ ...uploadForm, subject: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
                  required
                >
                  <option value="">Select subject</option>
                  {SUBJECTS.map((subject) => (
                    <option key={subject} value={subject}>{subject}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Grade
                  </label>
                  <select
                    value={uploadForm.grade}
                    onChange={(e) => setUploadForm({ ...uploadForm, grade: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
                  >
                    <option value="">Optional</option>
                    <optgroup label="Primary School">
                      <option value="p1">P 1</option>
                      <option value="p2">P 2</option>
                      <option value="p3">P 3</option>
                      <option value="p4">P 4</option>
                      <option value="p5">P 5</option>
                      <option value="p6">P 6</option>
                    </optgroup>
                    <optgroup label="Secondary School">
                      <option value="sec1">SEC 1</option>
                      <option value="sec2">SEC 2</option>
                      <option value="sec3">SEC 3</option>
                      <option value="sec4">SEC 4</option>
                    </optgroup>
                    <optgroup label="Junior College">
                      <option value="jc1">JC 1</option>
                      <option value="jc2">JC 2</option>
                    </optgroup>
                    <optgroup label="University">
                      <option value="uni1">Uni 1</option>
                      <option value="uni2">Uni 2</option>
                      <option value="uni3">Uni 3</option>
                      <option value="uni4">Uni 4</option>
                    </optgroup>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Year
                  </label>
                  <input
                    type="number"
                    value={uploadForm.year}
                    onChange={(e) => setUploadForm({ ...uploadForm, year: parseInt(e.target.value) })}
                    min="2000"
                    max={new Date().getFullYear()}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-2xl font-semibold hover:bg-gray-200 transition-colors"
                  disabled={uploading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                  disabled={uploading}
                >
                  {uploading ? 'Uploading...' : 'Upload & Earn +1'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PDF Viewer */}
      {viewingPaper && pdfUrl && (
        <PDFViewer
          paper={viewingPaper}
          fileUrl={pdfUrl}
          onClose={handleClosePDFViewer}
          user={user}
        />
      )}
    </div>
  );
};

export default PaperLibrary;
