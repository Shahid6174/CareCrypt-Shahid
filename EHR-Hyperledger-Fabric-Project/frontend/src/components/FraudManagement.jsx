import React, { useState, useEffect } from 'react'
import { FiAlertCircle, FiAlertTriangle, FiUsers, FiShield, FiUnlock, FiEye, FiTrendingUp, FiActivity } from 'react-icons/fi'
import api from '../services/api'
import { toast } from 'react-toastify'

const FraudManagement = () => {
  const [stats, setStats] = useState(null)
  const [blockedUsers, setBlockedUsers] = useState([])
  const [fraudulentUsers, setFraudulentUsers] = useState([])
  const [selectedUser, setSelectedUser] = useState(null)
  const [showWarnings, setShowWarnings] = useState(false)
  const [userWarnings, setUserWarnings] = useState(null)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('statistics')

  useEffect(() => {
    loadFraudData()
  }, [])

  const loadFraudData = async () => {
    setLoading(true)
    try {
      const [statsRes, blockedRes, fraudulentRes] = await Promise.all([
        api.get('/fraud/statistics'),
        api.get('/fraud/users/blocked'),
        api.get('/fraud/users/fraudulent')
      ])

      if (statsRes.data.success) setStats(statsRes.data.data)
      if (blockedRes.data.success) setBlockedUsers(blockedRes.data.data)
      if (fraudulentRes.data.success) setFraudulentUsers(fraudulentRes.data.data)
    } catch (error) {
      console.error('Error loading fraud data:', error)
      toast.error('Failed to load fraud data')
    } finally {
      setLoading(false)
    }
  }

  const handleUnblockUser = async (userId) => {
    if (!window.confirm(`Are you sure you want to unblock user ${userId}?`)) {
      return
    }

    try {
      setLoading(true)
      const response = await api.post(`/fraud/users/unblock/${userId}`)
      
      if (response.data.success) {
        toast.success(`User ${userId} has been unblocked`)
        loadFraudData()
      }
    } catch (error) {
      console.error('Error unblocking user:', error)
      toast.error(error.response?.data?.message || 'Failed to unblock user')
    } finally {
      setLoading(false)
    }
  }

  const handleViewWarnings = async (userId) => {
    try {
      setLoading(true)
      const response = await api.get(`/fraud/warnings/${userId}`)
      
      if (response.data.success) {
        setUserWarnings(response.data.data)
        setSelectedUser(userId)
        setShowWarnings(true)
      }
    } catch (error) {
      console.error('Error loading warnings:', error)
      toast.error('Failed to load warnings')
    } finally {
      setLoading(false)
    }
  }

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-purple-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-500 to-pink-600 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold mb-2">🔒 Fraud Detection Management</h2>
            <p className="text-red-100">AI-Powered fraud monitoring and user management</p>
          </div>
          <FiShield className="w-16 h-16 opacity-50" />
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl shadow-lg">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            {['statistics', 'blocked', 'fraudulent'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-1 border-b-2 font-semibold text-sm capitalize transition-all ${
                  activeTab === tab
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Statistics Tab */}
          {activeTab === 'statistics' && stats && (
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
                  <div className="flex items-center justify-between mb-4">
                    <FiUsers className="w-8 h-8 text-blue-600" />
                    <span className="text-3xl font-bold text-blue-900">{stats.totalUsers}</span>
                  </div>
                  <p className="text-sm text-blue-700 font-semibold">Total Users</p>
                </div>

                <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-6 border border-yellow-200">
                  <div className="flex items-center justify-between mb-4">
                    <FiAlertTriangle className="w-8 h-8 text-yellow-600" />
                    <span className="text-3xl font-bold text-yellow-900">{stats.usersWithFraudAttempts}</span>
                  </div>
                  <p className="text-sm text-yellow-700 font-semibold">Users with Fraud Attempts</p>
                  <p className="text-xs text-yellow-600 mt-1">{stats.fraudAttemptRate}</p>
                </div>

                <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-6 border border-red-200">
                  <div className="flex items-center justify-between mb-4">
                    <FiAlertCircle className="w-8 h-8 text-red-600" />
                    <span className="text-3xl font-bold text-red-900">{stats.blockedUsers}</span>
                  </div>
                  <p className="text-sm text-red-700 font-semibold">Blocked Users</p>
                  <p className="text-xs text-red-600 mt-1">{stats.blockRate}</p>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
                  <div className="flex items-center justify-between mb-4">
                    <FiTrendingUp className="w-8 h-8 text-purple-600" />
                    <span className="text-3xl font-bold text-purple-900">{stats.recentWarnings.count}</span>
                  </div>
                  <p className="text-sm text-purple-700 font-semibold">Recent Warnings (30d)</p>
                  <p className="text-xs text-purple-600 mt-1">Avg Score: {stats.recentWarnings.avgFraudScore}</p>
                </div>
              </div>

              {/* Additional Stats */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-200">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                  <FiActivity className="mr-2" />
                  System Health
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Fraud Detection Rate</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.fraudAttemptRate}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Block Rate</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.blockRate}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Period</p>
                    <p className="text-2xl font-bold text-gray-900">30 days</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Blocked Users Tab */}
          {activeTab === 'blocked' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">Blocked Users</h3>
                <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-semibold">
                  {blockedUsers.length} blocked
                </span>
              </div>

              {blockedUsers.length === 0 ? (
                <div className="text-center py-12">
                  <FiShield className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <p className="text-gray-600">No blocked users</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {blockedUsers.map((user) => (
                    <div key={user.userId} className="bg-red-50 border border-red-200 rounded-xl p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <FiAlertCircle className="text-red-600" />
                            <span className="font-bold text-gray-900">{user.name}</span>
                            <span className="text-sm text-gray-600">({user.email})</span>
                          </div>
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <p className="text-gray-600">User ID</p>
                              <p className="font-semibold text-gray-900">{user.userId}</p>
                            </div>
                            <div>
                              <p className="text-gray-600">Attempts</p>
                              <p className="font-semibold text-red-600">{user.attemptCount}</p>
                            </div>
                            <div>
                              <p className="text-gray-600">Blocked At</p>
                              <p className="font-semibold text-gray-900">
                                {new Date(user.blockedAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleViewWarnings(user.userId)}
                            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition flex items-center space-x-2"
                          >
                            <FiEye />
                            <span>View</span>
                          </button>
                          <button
                            onClick={() => handleUnblockUser(user.userId)}
                            disabled={loading}
                            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition flex items-center space-x-2 disabled:opacity-50"
                          >
                            <FiUnlock />
                            <span>Unblock</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Fraudulent Users Tab */}
          {activeTab === 'fraudulent' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">Users with Fraud Attempts</h3>
                <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-semibold">
                  {fraudulentUsers.length} users
                </span>
              </div>

              {fraudulentUsers.length === 0 ? (
                <div className="text-center py-12">
                  <FiShield className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <p className="text-gray-600">No fraud attempts detected</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {fraudulentUsers.map((user) => (
                    <div key={user.userId} className={`border rounded-xl p-4 ${
                      user.isBlocked ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-200'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <FiAlertTriangle className={user.isBlocked ? 'text-red-600' : 'text-yellow-600'} />
                            <span className="font-bold text-gray-900">{user.name}</span>
                            <span className="text-sm text-gray-600">({user.email})</span>
                            {user.isBlocked && (
                              <span className="bg-red-500 text-white px-2 py-1 rounded text-xs font-bold">
                                BLOCKED
                              </span>
                            )}
                          </div>
                          <div className="grid grid-cols-4 gap-4 text-sm">
                            <div>
                              <p className="text-gray-600">Attempts</p>
                              <p className="font-semibold text-gray-900">{user.attemptCount}</p>
                            </div>
                            <div>
                              <p className="text-gray-600">Warnings</p>
                              <p className="font-semibold text-gray-900">{user.warningCount}</p>
                            </div>
                            <div>
                              <p className="text-gray-600">Last Warning</p>
                              <p className="font-semibold text-gray-900">
                                {new Date(user.lastWarningAt).toLocaleDateString()}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-600">Role</p>
                              <p className="font-semibold text-gray-900 capitalize">{user.role}</p>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleViewWarnings(user.userId)}
                          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition flex items-center space-x-2"
                        >
                          <FiEye />
                          <span>View Details</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Warnings Modal */}
      {showWarnings && userWarnings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">Fraud Warning History</h3>
                  <p className="text-gray-600">User: {userWarnings.name} ({userWarnings.email})</p>
                </div>
                <button
                  onClick={() => setShowWarnings(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-gray-100 rounded-lg p-4">
                  <p className="text-sm text-gray-600">Total Warnings</p>
                  <p className="text-3xl font-bold text-gray-900">{userWarnings.totalWarnings}</p>
                </div>
                <div className="bg-gray-100 rounded-lg p-4">
                  <p className="text-sm text-gray-600">Attempt Count</p>
                  <p className="text-3xl font-bold text-gray-900">{userWarnings.attemptCount}</p>
                </div>
                <div className="bg-gray-100 rounded-lg p-4">
                  <p className="text-sm text-gray-600">Status</p>
                  <p className={`text-2xl font-bold ${userWarnings.isBlocked ? 'text-red-600' : 'text-yellow-600'}`}>
                    {userWarnings.isBlocked ? 'BLOCKED' : 'ACTIVE'}
                  </p>
                </div>
              </div>

              <h4 className="text-lg font-bold text-gray-900 mb-3">Warning Details</h4>
              {userWarnings.warnings.map((warning, index) => (
                <div key={index} className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                        #{index + 1}
                      </span>
                      <span className="font-semibold text-gray-900">{warning.reason}</span>
                    </div>
                    <span className="text-sm text-gray-600">
                      {new Date(warning.detectedAt).toLocaleString()}
                    </span>
                  </div>
                  {warning.claimId && (
                    <p className="text-sm text-gray-700 mb-1">
                      <span className="font-semibold">Claim ID:</span> {warning.claimId}
                    </p>
                  )}
                  {warning.fraudScore && (
                    <p className="text-sm text-gray-700 mb-1">
                      <span className="font-semibold">Fraud Score:</span> {warning.fraudScore}/100
                    </p>
                  )}
                  {warning.details && (
                    <details className="mt-2">
                      <summary className="text-sm text-gray-600 cursor-pointer hover:text-gray-900">
                        View Technical Details
                      </summary>
                      <pre className="mt-2 text-xs bg-white p-3 rounded border border-gray-300 overflow-x-auto">
                        {JSON.stringify(JSON.parse(warning.details), null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              ))}
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setShowWarnings(false)}
                className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default FraudManagement

