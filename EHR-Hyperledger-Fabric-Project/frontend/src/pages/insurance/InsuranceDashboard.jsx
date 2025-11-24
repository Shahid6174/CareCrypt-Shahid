import React, { useState, useEffect } from 'react'
import Layout from '../../components/Layout'
import { 
  FiFileText, FiUser, FiCheckCircle, FiXCircle, FiEye,
  FiDollarSign, FiClock
} from 'react-icons/fi'
import api from '../../services/api'
import { toast } from 'react-toastify'
import { useAuth } from '../../contexts/AuthContext'
import { notifyClaimProcessed } from '../../services/notificationService'

const InsuranceDashboard = () => {
  const { user, loading: authLoading } = useAuth()
  const [activeTab, setActiveTab] = useState('claims')
  const [claims, setClaims] = useState([])
  const [profile, setProfile] = useState(null)
  const [selectedClaim, setSelectedClaim] = useState(null)
  const [claimDetails, setClaimDetails] = useState(null)
  const [claimRecords, setClaimRecords] = useState([])
  const [loading, setLoading] = useState(false)
  const [showApproveModal, setShowApproveModal] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [approveForm, setApproveForm] = useState({
    claimId: '',
    approvedAmount: '',
    notes: ''
  })
  const [rejectForm, setRejectForm] = useState({
    claimId: '',
    rejectionReason: ''
  })

  // Show loading while auth is being checked
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-green-500"></div>
          <p className="text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    )
  }

  // Early return if user is not loaded
  if (!user || !user.userId) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-md">
          <div className="bg-red-100 rounded-full p-4 inline-flex mb-4">
            <FiUser className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Authentication Required</h2>
          <p className="text-gray-600 mb-6">Please log in to access your dashboard</p>
          <button
            onClick={() => window.location.href = '/login'}
            className="w-full px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all shadow-lg hover:shadow-xl font-semibold"
          >
            Go to Login
          </button>
        </div>
      </div>
    )
  }

  useEffect(() => {
    if (user && user.userId && !authLoading) {
      loadData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, user, authLoading])

  const loadData = async () => {
    if (activeTab === 'claims') {
      await loadClaims()
    } else if (activeTab === 'profile') {
      await loadProfile()
    }
  }

  const loadClaims = async () => {
    if (!user || !user.userId) return
    
    try {
      setLoading(true)
      const response = await api.get('/claims/byStatus', {
        params: { status: 'pending' }
      })
      const claimsData = response.data?.data || response.data || []
      setClaims(Array.isArray(claimsData) ? claimsData : [])
    } catch (error) {
      console.error('Error loading claims:', error)
      toast.error(error.response?.data?.message || 'Failed to load claims')
      setClaims([])
    } finally {
      setLoading(false)
    }
  }

  const loadProfile = async () => {
    if (!user || !user.userId) return
    
    try {
      setLoading(true)
      const response = await api.get(`/insurance/agent/${user.userId}/profile`)
      setProfile(response.data?.data || response.data || null)
    } catch (error) {
      console.error('Error loading profile:', error)
      toast.error(error.response?.data?.message || 'Failed to load profile')
      setProfile(null)
    } finally {
      setLoading(false)
    }
  }

  const loadClaimDetails = async (claimId) => {
    try {
      setLoading(true)
      const [claimResponse, recordsResponse] = await Promise.all([
        api.get(`/insurance/claim/${claimId}`),
        api.get(`/insurance/claim/${claimId}/records`)
      ])
      setClaimDetails(claimResponse.data.data || null)
      const recordsData = recordsResponse.data.data || []
      setClaimRecords(Array.isArray(recordsData) ? recordsData : [])
      setSelectedClaim(claimId)
    } catch (error) {
      toast.error('Failed to load claim details')
      setClaimDetails(null)
      setClaimRecords([])
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (e) => {
    e.preventDefault()
    try {
      setLoading(true)
      const response = await api.post('/insurance/claim/approve', {
        ...approveForm,
        approvedAmount: parseFloat(approveForm.approvedAmount)
      })
      
      if (response.data.success) {
        toast.success('Claim approved successfully!')
        const claim = claims.find(c => c.claimId === approveForm.claimId)
        if (claim) {
          notifyClaimProcessed(
            approveForm.claimId,
            claim.patientId,
            'approved',
            approveForm.approvedAmount,
            approveForm.notes
          )
        }
        setShowApproveModal(false)
        setApproveForm({ claimId: '', approvedAmount: '', notes: '' })
        loadClaims()
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to approve claim')
    } finally {
      setLoading(false)
    }
  }

  const handleReject = async (e) => {
    e.preventDefault()
    try {
      setLoading(true)
      const response = await api.post('/insurance/claim/reject', {
        claimId: rejectForm.claimId,
        reason: rejectForm.rejectionReason
      })
      
      if (response.data.success) {
        toast.success('Claim rejected')
        const claim = claims.find(c => c.claimId === rejectForm.claimId)
        if (claim) {
          notifyClaimProcessed(
            rejectForm.claimId,
            claim.patientId,
            'rejected',
            null,
            rejectForm.rejectionReason
          )
        }
        setShowRejectModal(false)
        setRejectForm({ claimId: '', rejectionReason: '' })
        loadClaims()
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reject claim')
    } finally {
      setLoading(false)
    }
  }

  const navItems = [
    { path: '/insurance/dashboard', label: 'Claims', icon: <FiFileText className="w-5 h-5" /> },
    { path: '/insurance/dashboard', label: 'Profile', icon: <FiUser className="w-5 h-5" /> }
  ]

  return (
    <Layout title="Insurance Agent Dashboard" navItems={navItems}>
      <div className="space-y-6">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {['claims', 'profile'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-4 px-1 border-b-2 font-semibold text-sm capitalize transition-all ${
                    activeTab === tab
                      ? 'border-green-500 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'claims' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900">Pending Claims</h2>

                {loading ? (
                  <div className="text-center py-16">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-green-500 mx-auto"></div>
                    <p className="mt-4 text-gray-600 font-medium">Loading claims...</p>
                  </div>
                ) : claims.length === 0 ? (
                  <div className="text-center py-16 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl">
                    <FiFileText className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-600 font-semibold text-lg">No pending claims</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {claims.map((claim, idx) => (
                      <div key={idx} className="bg-white border-2 border-gray-200 rounded-2xl p-6 hover:shadow-xl transition-all hover:border-green-300">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-4">
                              <span className="font-bold text-gray-900 text-lg">{claim.claimId || `Claim #${idx + 1}`}</span>
                              <span className="px-4 py-1.5 rounded-full text-xs font-bold bg-yellow-100 text-yellow-700">
                                {claim.status || 'pending'}
                              </span>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                              <div>
                                <p className="text-gray-500 font-medium">Type</p>
                                <p className="font-semibold text-gray-900">{claim.claimType || '-'}</p>
                              </div>
                              <div>
                                <p className="text-gray-500 font-medium">Amount</p>
                                <p className="font-semibold text-gray-900">${claim.claimAmount || '-'}</p>
                              </div>
                              <div>
                                <p className="text-gray-500 font-medium">Patient</p>
                                <p className="font-semibold text-gray-900">{claim.patientId || '-'}</p>
                              </div>
                              <div>
                                <p className="text-gray-500 font-medium">Hospital</p>
                                <p className="font-semibold text-gray-900">{claim.hospitalId || '-'}</p>
                              </div>
                            </div>
                            {claim.description && (
                              <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">{claim.description}</p>
                            )}
                          </div>
                          <div className="flex flex-col space-y-2 ml-4">
                            <button
                              onClick={() => loadClaimDetails(claim.claimId)}
                              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl flex items-center space-x-2 font-semibold"
                            >
                              <FiEye className="w-5 h-5" />
                              <span>View</span>
                            </button>
                            <button
                              onClick={() => {
                                setApproveForm({ ...approveForm, claimId: claim.claimId, approvedAmount: claim.claimAmount })
                                setShowApproveModal(true)
                              }}
                              className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all shadow-lg hover:shadow-xl flex items-center space-x-2 font-semibold"
                            >
                              <FiCheckCircle className="w-5 h-5" />
                              <span>Approve</span>
                            </button>
                            <button
                              onClick={() => {
                                setRejectForm({ ...rejectForm, claimId: claim.claimId })
                                setShowRejectModal(true)
                              }}
                              className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition-all shadow-lg hover:shadow-xl flex items-center space-x-2 font-semibold"
                            >
                              <FiXCircle className="w-5 h-5" />
                              <span>Reject</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {selectedClaim && claimDetails && (
                  <div className="mt-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-100 shadow-lg">
                    <h3 className="text-xl font-bold text-gray-900 mb-6">Claim Details: {selectedClaim}</h3>
                    <div className="grid grid-cols-2 gap-6 mb-6">
                      {Object.entries(claimDetails).map(([key, value]) => (
                        <div key={key} className="bg-white p-4 rounded-xl shadow-sm">
                          <p className="text-sm text-gray-500 capitalize font-medium">{key.replace(/([A-Z])/g, ' $1')}</p>
                          <p className="text-lg font-bold text-gray-900 mt-1">{value || '-'}</p>
                        </div>
                      ))}
                    </div>
                    {claimRecords.length > 0 && (
                      <div>
                        <h4 className="font-bold text-lg mb-4">Related Medical Records</h4>
                        <div className="grid gap-3">
                          {claimRecords.map((record, idx) => (
                            <div key={idx} className="bg-white rounded-xl p-4 border-2 border-blue-200">
                              <p className="text-sm font-semibold">{record.recordId || `Record #${idx + 1}`}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Approve Modal */}
                {showApproveModal && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
                      <h3 className="text-xl font-bold text-gray-900 mb-6">Approve Claim</h3>
                      <form onSubmit={handleApprove} className="space-y-6">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Approved Amount *</label>
                          <input
                            type="number"
                            value={approveForm.approvedAmount}
                            onChange={(e) => setApproveForm({ ...approveForm, approvedAmount: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                            step="0.01"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Notes</label>
                          <textarea
                            value={approveForm.notes}
                            onChange={(e) => setApproveForm({ ...approveForm, notes: e.target.value })}
                            rows="3"
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                            placeholder="Add notes..."
                          />
                        </div>
                        <div className="flex space-x-4">
                          <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 font-semibold"
                          >
                            {loading ? 'Approving...' : 'Approve'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowApproveModal(false)}
                            className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-all font-semibold"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}

                {/* Reject Modal */}
                {showRejectModal && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
                      <h3 className="text-xl font-bold text-gray-900 mb-6">Reject Claim</h3>
                      <form onSubmit={handleReject} className="space-y-6">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Rejection Reason *</label>
                          <textarea
                            value={rejectForm.rejectionReason}
                            onChange={(e) => setRejectForm({ ...rejectForm, rejectionReason: e.target.value })}
                            rows="4"
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition"
                            placeholder="Explain why this claim is being rejected..."
                            required
                          />
                        </div>
                        <div className="flex space-x-4">
                          <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 font-semibold"
                          >
                            {loading ? 'Rejecting...' : 'Reject'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowRejectModal(false)}
                            className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-all font-semibold"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'profile' && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Profile Information</h2>
                {loading ? (
                  <div className="text-center py-16">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-green-500 mx-auto"></div>
                  </div>
                ) : profile ? (
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-8 shadow-lg">
                    <div className="grid grid-cols-2 gap-6">
                      {Object.entries(profile).map(([key, value]) => (
                        <div key={key} className="bg-white p-4 rounded-xl shadow-sm">
                          <p className="text-sm text-gray-500 capitalize font-medium">{key.replace(/([A-Z])/g, ' $1')}</p>
                          <p className="text-lg font-bold text-gray-900 mt-1">{value || '-'}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">No profile data available</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default InsuranceDashboard
