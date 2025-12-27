import React, { useState, useEffect } from 'react';
import { getAllUsers, createUser, deleteUser } from '../services/api';

const GRADE_OPTIONS = [
  { value: 'p1', label: 'Primary 1' },
  { value: 'p2', label: 'Primary 2' },
  { value: 'p3', label: 'Primary 3' },
  { value: 'p4', label: 'Primary 4' },
  { value: 'p5', label: 'Primary 5' },
  { value: 'p6', label: 'Primary 6' },
  { value: 'sec1', label: 'Secondary 1' },
  { value: 'sec2', label: 'Secondary 2' },
  { value: 'sec3', label: 'Secondary 3' },
  { value: 'sec4', label: 'Secondary 4' },
  { value: 'jc1', label: 'Junior College 1' },
  { value: 'jc2', label: 'Junior College 2' },
  { value: 'uni1', label: 'University Year 1' },
  { value: 'uni2', label: 'University Year 2' },
  { value: 'uni3', label: 'University Year 3' },
  { value: 'uni4', label: 'University Year 4' },
];

const User = ({ user }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUser, setNewUser] = useState({ email: '', name: '', grade: '' });
  const [message, setMessage] = useState({ type: '', text: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await getAllUsers();
      setUsers(data);
    } catch (error) {
      console.error('Failed to load users:', error);
      if (error.response?.status === 403) {
        setMessage({ type: 'error', text: 'Access denied. Admin privileges required.' });
      } else {
        setMessage({ type: 'error', text: 'Failed to load users. Please try again.' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();

    if (!newUser.email || !newUser.name) {
      setMessage({ type: 'error', text: 'Email and name are required.' });
      return;
    }

    try {
      setSubmitting(true);
      setMessage({ type: '', text: '' });
      await createUser(newUser);
      setMessage({ type: 'success', text: 'User added successfully!' });
      setNewUser({ email: '', name: '', grade: '' });
      setShowAddModal(false);
      loadUsers();
    } catch (error) {
      console.error('Failed to add user:', error);
      if (error.response?.status === 400) {
        setMessage({ type: 'error', text: error.response.data.detail || 'User already exists.' });
      } else if (error.response?.status === 403) {
        setMessage({ type: 'error', text: 'Access denied. Admin privileges required.' });
      } else {
        setMessage({ type: 'error', text: 'Failed to add user. Please try again.' });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = async (userId, userEmail) => {
    if (!window.confirm(`Are you sure you want to delete user ${userEmail}? This action cannot be undone.`)) {
      return;
    }

    try {
      setMessage({ type: '', text: '' });
      await deleteUser(userId);
      setMessage({ type: 'success', text: 'User deleted successfully!' });
      loadUsers();
    } catch (error) {
      console.error('Failed to delete user:', error);
      if (error.response?.status === 400) {
        setMessage({ type: 'error', text: error.response.data.detail || 'Cannot delete this user.' });
      } else if (error.response?.status === 403) {
        setMessage({ type: 'error', text: 'Access denied. Admin privileges required.' });
      } else {
        setMessage({ type: 'error', text: 'Failed to delete user. Please try again.' });
      }
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-SG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
          <p className="text-gray-600 mt-1">Add and manage user accounts (Admin only)</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
        >
          + Add User
        </button>
      </div>

      {message.text && (
        <div className={`mb-4 p-4 rounded-2xl ${
          message.type === 'success'
            ? 'bg-green-50 border border-green-200 text-green-700'
            : 'bg-red-50 border border-red-200 text-red-700'
        }`}>
          <p className="text-sm">{message.text}</p>
        </div>
      )}

      {/* User List */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
            <p className="mt-4 text-gray-600">Loading users...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p>No users found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grade</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((u) => (
                  <tr key={u.id} className={u.id === user?.id ? 'bg-blue-50' : ''}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{u.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{u.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {u.grade ? GRADE_OPTIONS.find(g => g.value === u.grade)?.label || u.grade : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {u.is_admin ? (
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">Admin</span>
                      ) : (
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">User</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{formatDate(u.created_at)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {u.id === user?.id ? (
                        <span className="text-gray-400">You</span>
                      ) : (
                        <button
                          onClick={() => handleDeleteUser(u.id, u.email)}
                          className="text-red-600 hover:text-red-800 font-medium"
                        >
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Add New User</h3>
            <form onSubmit={handleAddUser}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="user@example.com"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Name *</label>
                <input
                  type="text"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="John Doe"
                  required
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Grade (Optional)</label>
                <select
                  value={newUser.grade}
                  onChange={(e) => setNewUser({ ...newUser, grade: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select grade</option>
                  {GRADE_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setNewUser({ email: '', name: '', grade: '' });
                    setMessage({ type: '', text: '' });
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:bg-blue-300"
                  disabled={submitting}
                >
                  {submitting ? 'Adding...' : 'Add User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default User;
