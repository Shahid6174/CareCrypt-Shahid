import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../../components/Layout'
import { 
  FiFileText, FiPlus, FiUser, FiHeart, FiShield,
  FiUpload, FiEdit, FiEye, FiDownload, FiTrash2, FiFile,
  FiAlertTriangle, FiAlertCircle, FiCheckCircle
} from 'react-icons/fi'
import api from '../../services/api'
import { toast } from 'react-toastify'
import { useAuth } from '../../contexts/AuthContext'
import { notifyClaimSubmitted } from '../../services/notificationService'

const PatientDashboard = () => {
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('claims')
  const [claims, setClaims] = useState([])
  const [records, setRecords] = useState([])
  const [profile, setProfile] = useState(null)
  const [documents, setDocuments] = useState([])
  const [fraudStatus, setFraudStatus] = useState(null)
  const [loading, setLoading] = useState(false)
  const [showClaimForm, setShowClaimForm] = useState(false)
  const [showDocumentUpload, setShowDocumentUpload] = useState(false)
  const [claimForm, setClaimForm] = useState({
    doctorId: '',
    policyId: '',
    hospitalId: '',
    claimAmount: '',
    medicalRecordIds: [],
    claimType: '',
    description: '',
    documents: []
  })
  const [uploadForm, setUploadForm] = useState({
    file: null,
    category: 'medical_record',
    description: ''
  })

  // Show loading while auth is being checked
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-white to-pink-50">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
          <p className="text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    )
  }

  // Early return if user is not loaded
  if (!user || !user.userId) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-white to-pink-50">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-md">
          <div className="bg-red-100 rounded-full p-4 inline-flex mb-4">
            <FiShield className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Authentication Required</h2>
          <p className="text-gray-600 mb-6">Please log in to access your dashboard</p>
          <button
            onClick={() => navigate('/login')}
            className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-pink-500 text-white rounded-lg hover:from-blue-600 hover:to-pink-600 transition-all shadow-lg hover:shadow-xl font-semibold"
          >
            Go to Login
          </button>
        </div>
      </div>
    )
  }

  useEffect(() => {
    if (!user || !user.userId || authLoading || user.restricted) return
    loadData()
    loadFraudStatus()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, activeTab, authLoading])

  const loadData = async () => {
    if (!user || !user.userId) return
    
    try {
      if (activeTab === 'claims') {
        await loadClaims()
      } else if (activeTab === 'records') {
        await loadRecords()
      } else if (activeTab === 'profile') {
        await loadProfile()
      } else if (activeTab === 'documents') {
        await loadDocuments()
      }
    } catch (error) {
      console.error('Error in loadData:', error)
    }
  }

  const loadClaims = async () => {
    if (!user || !user.userId) return
    
    try {
      setLoading(true)
      const response = await api.get(`/patient/${user.userId}/claims`)
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

  const loadRecords = async () => {
    if (!user || !user.userId) return
    
    try {
      setLoading(true)
      const response = await api.get(`/patient/${user.userId}/records`)
      const recordsData = response.data?.data || response.data || []
      setRecords(Array.isArray(recordsData) ? recordsData : [])
    } catch (error) {
      console.error('Error loading records:', error)
      toast.error(error.response?.data?.message || 'Failed to load records')
      setRecords([])
    } finally {
      setLoading(false)
    }
  }

  const loadProfile = async () => {
    if (!user || !user.userId) return
    
    try {
      setLoading(true)
      const response = await api.get(`/patient/${user.userId}/profile`)
      setProfile(response.data?.data || response.data || null)
    } catch (error) {
      console.error('Error loading profile:', error)
      toast.error(error.response?.data?.message || 'Failed to load profile')
      setProfile(null)
    } finally {
      setLoading(false)
    }
  }

  const loadDocuments = async () => {
    if (!user || !user.userId) return
    
    try {
      setLoading(true)
      const response = await api.get('/documents/list')
      const docsData = response.data?.data || response.data || []
      setDocuments(Array.isArray(docsData) ? docsData : [])
    } catch (error) {
      console.error('Error loading documents:', error)
      toast.error(error.response?.data?.message || 'Failed to load documents')
      setDocuments([])
    } finally {
      setLoading(false)
    }
  }

  const loadFraudStatus = async () => {
    if (!user || !user.userId) return
    
    try {
      const response = await api.get(`/fraud/status/${user.userId}`)
      if (response.data.success) {
        setFraudStatus(response.data.data)
      }
    } catch (error) {
      console.error('Error loading fraud status:', error)
      // Don't show error toast as this is background data
    }
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setUploadForm({ ...uploadForm, file })
    }
  }

  const handleUploadDocument = async (e) => {
    e.preventDefault()
    if (!uploadForm.file) {
      toast.error('Please select a file to upload')
      return
    }

    try {
      setLoading(true)
      const formData = new FormData()
      formData.append('document', uploadForm.file)
      formData.append('category', uploadForm.category)
      formData.append('description', uploadForm.description)

      const response = await api.post('/documents/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      if (response.data.success) {
        toast.success('Document uploaded successfully!')
        setShowDocumentUpload(false)
        setUploadForm({ file: null, category: 'medical_record', description: '' })
        await loadDocuments()
      }
    } catch (error) {
      console.error('Error uploading document:', error)
      toast.error(error.response?.data?.message || 'Failed to upload document')
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadDocument = async (documentId, fileName) => {
    try {
      const response = await api.get(`/documents/download/${documentId}`, {
        responseType: 'blob'
      })
      
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', fileName)
      document.body.appendChild(link)
      link.click()
      link.remove()
      toast.success('Download started')
    } catch (error) {
      console.error('Error downloading document:', error)
      toast.error('Failed to download document')
    }
  }

  const handleDeleteDocument = async (documentId) => {
    if (!window.confirm('Are you sure you want to delete this document?')) {
      return
    }

    try {
      setLoading(true)
      const response = await api.delete(`/documents/${documentId}`)
      
      if (response.data.success) {
        toast.success('Document deleted successfully!')
        await loadDocuments()
      }
    } catch (error) {
      console.error('Error deleting document:', error)
      toast.error('Failed to delete document')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitClaim = async (e) => {
    e.preventDefault()
    if (!user || !user.userId) {
      toast.error('User not authenticated')
      return
    }
    
    try {
      setLoading(true)
      const response = await api.post('/patient/claim/submit', {
        ...claimForm,
        claimAmount: parseFloat(claimForm.claimAmount),
        medicalRecordIds: claimForm.medicalRecordIds.filter(id => id.trim())
      })
      
      if (response.data.success) {
        toast.success('Claim submitted successfully!')
        if (claimForm.doctorId) {
          notifyClaimSubmitted(user.userId, response.data.data?.claimId || 'NEW', claimForm.doctorId)
        }
        setShowClaimForm(false)
        setClaimForm({
          doctorId: '',
          policyId: '',
          hospitalId: '',
          claimAmount: '',
          medicalRecordIds: [],
          claimType: '',
          description: '',
          documents: []
        })
        await loadClaims()
      }
    } catch (error) {
      console.error('Error submitting claim:', error)
      toast.error(error.response?.data?.message || error.message || 'Failed to submit claim')
    } finally {
      setLoading(false)
    }
  }

  const navItems = [
    { path: '/patient/dashboard', label: 'Claims', icon: <FiFileText className="w-5 h-5" /> },
    { path: '/patient/dashboard', label: 'Medical Records', icon: <FiHeart className="w-5 h-5" /> },
    { path: '/patient/dashboard', label: 'Documents', icon: <FiFile className="w-5 h-5" /> },
    { path: '/patient/dashboard', label: 'Profile', icon: <FiUser className="w-5 h-5" /> },
    { path: '/patient/dashboard', label: 'Access Control', icon: <FiShield className="w-5 h-5" /> }
  ]

  const categoryColors = {
    medical_record: 'bg-blue-100 text-blue-700',
    prescription: 'bg-green-100 text-green-700',
    lab_report: 'bg-purple-100 text-purple-700',
    scan: 'bg-pink-100 text-pink-700',
    insurance: 'bg-yellow-100 text-yellow-700',
    other: 'bg-gray-100 text-gray-700'
  }

  return (
    <Layout title="Patient Dashboard" navItems={navItems}>
      <div className="space-y-6">
        
        {/* Fraud Status Banners */}
        {fraudStatus && fraudStatus.isBlocked && (
          <div className="bg-red-50 border-l-4 border-red-500 rounded-lg shadow-lg overflow-hidden">
            <div className="p-6">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <FiAlertCircle className="h-8 w-8 text-red-500" />
                </div>
                <div className="ml-4 flex-1">
                  <h3 className="text-lg font-bold text-red-900 mb-2">
                    🚫 Account Blocked
                  </h3>
                  <p className="text-red-800 mb-3">
                    Your account has been blocked due to {fraudStatus.attemptCount} fraudulent claim attempts. 
                    You cannot submit new claims.
                  </p>
                  <div className="bg-red-100 rounded-lg p-4 mb-3">
                    <p className="text-sm text-red-900 font-semibold">
                      Blocked on: {new Date(fraudStatus.blockedAt).toLocaleString()}
                    </p>
                  </div>
                  <p className="text-sm text-red-700">
                    ⚠️ Please contact support to appeal this decision.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {fraudStatus && !fraudStatus.isBlocked && fraudStatus.attemptCount > 0 && (
          <div className="bg-yellow-50 border-l-4 border-yellow-500 rounded-lg shadow-lg overflow-hidden">
            <div className="p-6">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <FiAlertTriangle className="h-7 w-7 text-yellow-600" />
                </div>
                <div className="ml-4 flex-1">
                  <h3 className="text-lg font-bold text-yellow-900 mb-2">
                    ⚠️ Fraud Detection Warning
                  </h3>
                  <p className="text-yellow-800 mb-3">
                    You have {fraudStatus.attemptCount} fraudulent claim attempt(s) on record.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                    <div className="bg-yellow-100 rounded-lg p-3">
                      <p className="text-xs text-yellow-700 mb-1">Total Attempts</p>
                      <p className="text-2xl font-bold text-yellow-900">{fraudStatus.attemptCount}</p>
                    </div>
                    <div className="bg-yellow-100 rounded-lg p-3">
                      <p className="text-xs text-yellow-700 mb-1">Remaining Attempts</p>
                      <p className="text-2xl font-bold text-yellow-900">{fraudStatus.remainingAttempts}</p>
                    </div>
                    <div className="bg-yellow-100 rounded-lg p-3">
                      <p className="text-xs text-yellow-700 mb-1">Last Warning</p>
                      <p className="text-sm font-semibold text-yellow-900">
                        {new Date(fraudStatus.lastWarningAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="bg-yellow-100 rounded-lg p-4">
                    <p className="text-sm text-yellow-900 font-semibold mb-2">
                      ⚠️ Important: Your account will be blocked after 3 fraudulent attempts
                    </p>
                    <ul className="text-xs text-yellow-800 space-y-1">
                      <li>• Ensure all documents are genuine and unedited</li>
                      <li>• Match claim amounts with document amounts</li>
                      <li>• Include proper medical terminology</li>
                      <li>• Upload clear, high-quality scans</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {fraudStatus && fraudStatus.attemptCount === 0 && !fraudStatus.isBlocked && (
          <div className="bg-green-50 border-l-4 border-green-500 rounded-lg shadow-md overflow-hidden">
            <div className="p-4">
              <div className="flex items-center">
                <FiCheckCircle className="h-6 w-6 text-green-600 mr-3" />
                <div>
                  <p className="text-sm font-semibold text-green-900">✅ Account in Good Standing</p>
                  <p className="text-xs text-green-700">No fraud attempts detected</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {['claims', 'records', 'documents', 'profile', 'access'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-4 px-1 border-b-2 font-semibold text-sm capitalize transition-all ${
                    activeTab === tab
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* Claims Tab */}
            {activeTab === 'claims' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-gray-900">My Claims</h2>
                  <button
                    onClick={() => setShowClaimForm(!showClaimForm)}
                    className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl flex items-center space-x-2 font-semibold"
                  >
                    <FiPlus className="w-5 h-5" />
                    <span>Submit New Claim</span>
                  </button>
                </div>

                {showClaimForm && (
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-100 shadow-lg">
                    <h3 className="text-xl font-bold text-gray-900 mb-6">Submit Insurance Claim</h3>
                    <form onSubmit={handleSubmitClaim} className="space-y-6">
                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Doctor ID *</label>
                          <input
                            type="text"
                            value={claimForm.doctorId}
                            onChange={(e) => setClaimForm({ ...claimForm, doctorId: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                            placeholder="Enter doctor ID"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Policy ID *</label>
                          <input
                            type="text"
                            value={claimForm.policyId}
                            onChange={(e) => setClaimForm({ ...claimForm, policyId: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                            placeholder="Enter policy ID"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Hospital ID *</label>
                          <input
                            type="text"
                            value={claimForm.hospitalId}
                            onChange={(e) => setClaimForm({ ...claimForm, hospitalId: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                            placeholder="Enter hospital ID"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Claim Amount *</label>
                          <input
                            type="number"
                            value={claimForm.claimAmount}
                            onChange={(e) => setClaimForm({ ...claimForm, claimAmount: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                            placeholder="0.00"
                            step="0.01"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Claim Type *</label>
                          <select
                            value={claimForm.claimType}
                            onChange={(e) => setClaimForm({ ...claimForm, claimType: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                            required
                          >
                            <option value="">Select type</option>
                            <option value="Surgery">Surgery</option>
                            <option value="Consultation">Consultation</option>
                            <option value="Emergency">Emergency</option>
                            <option value="Medication">Medication</option>
                            <option value="Lab Tests">Lab Tests</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Medical Record IDs</label>
                          <input
                            type="text"
                            value={claimForm.medicalRecordIds.join(', ')}
                            onChange={(e) => setClaimForm({ 
                              ...claimForm, 
                              medicalRecordIds: e.target.value.split(',').map(id => id.trim())
                            })}
                            placeholder="R-abc123, R-def456"
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Description *</label>
                        <textarea
                          value={claimForm.description}
                          onChange={(e) => setClaimForm({ ...claimForm, description: e.target.value })}
                          rows="4"
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                          placeholder="Describe your claim in detail..."
                          required
                        />
                      </div>
                      <div className="flex space-x-4">
                        <button
                          type="submit"
                          disabled={loading}
                          className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 font-semibold"
                        >
                          {loading ? 'Submitting...' : 'Submit Claim'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowClaimForm(false)}
                          className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-all font-semibold"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {loading ? (
                  <div className="text-center py-16">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mx-auto"></div>
                    <p className="mt-4 text-gray-600 font-medium">Loading claims...</p>
                  </div>
                ) : claims.length === 0 ? (
                  <div className="text-center py-16 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl">
                    <FiFileText className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-600 font-semibold text-lg">No claims found</p>
                    <p className="text-sm mt-2 text-gray-500">Click "Submit New Claim" to create your first claim</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {claims.map((claim, idx) => (
                      <div key={idx} className="bg-white border-2 border-gray-200 rounded-2xl p-6 hover:shadow-xl transition-all hover:border-blue-300">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-4">
                              <span className="font-bold text-gray-900 text-lg">{claim.claimId || `Claim #${idx + 1}`}</span>
                              <span className={`px-4 py-1.5 rounded-full text-xs font-bold ${
                                claim.status === 'approved' ? 'bg-green-100 text-green-700' :
                                claim.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                claim.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-blue-100 text-blue-700'
                              }`}>
                                {claim.status || 'pending'}
                              </span>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <p className="text-gray-500 font-medium">Type</p>
                                <p className="font-semibold text-gray-900">{claim.claimType || '-'}</p>
                              </div>
                              <div>
                                <p className="text-gray-500 font-medium">Amount</p>
                                <p className="font-semibold text-gray-900">${claim.claimAmount || '-'}</p>
                              </div>
                              <div>
                                <p className="text-gray-500 font-medium">Doctor</p>
                                <p className="font-semibold text-gray-900">{claim.doctorId || '-'}</p>
                              </div>
                              <div>
                                <p className="text-gray-500 font-medium">Hospital</p>
                                <p className="font-semibold text-gray-900">{claim.hospitalId || '-'}</p>
                              </div>
                            </div>
                            {claim.description && (
                              <p className="mt-3 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">{claim.description}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Records Tab */}
            {activeTab === 'records' && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Medical Records</h2>
                {loading ? (
                  <div className="text-center py-16">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mx-auto"></div>
                  </div>
                ) : records.length === 0 ? (
                  <div className="text-center py-16 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl">
                    <FiHeart className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-600 font-semibold text-lg">No medical records found</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {records.map((record, idx) => (
                      <div key={idx} className="bg-white border-2 border-gray-200 rounded-2xl p-6 hover:shadow-xl transition-all hover:border-purple-300">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-4">
                              <span className="font-bold text-gray-900 text-lg">{record.recordId || `Record #${idx + 1}`}</span>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                              <div>
                                <p className="text-gray-500 font-medium">Diagnosis</p>
                                <p className="font-semibold text-gray-900">{record.diagnosis || '-'}</p>
                              </div>
                              <div>
                                <p className="text-gray-500 font-medium">Treatment</p>
                                <p className="font-semibold text-gray-900">{record.treatment || '-'}</p>
                              </div>
                              <div>
                                <p className="text-gray-500 font-medium">Date</p>
                                <p className="font-semibold text-gray-900">{record.date || '-'}</p>
                              </div>
                            </div>
                            {record.notes && (
                              <div className="mt-3">
                                <p className="text-gray-500 text-sm font-medium">Notes</p>
                                <p className="text-sm bg-gray-50 p-3 rounded-lg mt-1">{record.notes}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Documents Tab */}
            {activeTab === 'documents' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-gray-900">My Documents</h2>
                  <button
                    onClick={() => setShowDocumentUpload(!showDocumentUpload)}
                    className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all shadow-lg hover:shadow-xl flex items-center space-x-2 font-semibold"
                  >
                    <FiUpload className="w-5 h-5" />
                    <span>Upload Document</span>
                  </button>
                </div>

                {showDocumentUpload && (
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-8 border border-green-100 shadow-lg">
                    <h3 className="text-xl font-bold text-gray-900 mb-6">Upload New Document</h3>
                    <form onSubmit={handleUploadDocument} className="space-y-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Select File *</label>
                        <input
                          type="file"
                          onChange={handleFileChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                          accept=".pdf,.jpg,.jpeg,.png,.gif,.doc,.docx,.xls,.xlsx"
                          required
                        />
                        <p className="text-xs text-gray-500 mt-2">Accepted: PDF, JPEG, PNG, GIF, DOC, DOCX, XLS, XLSX (Max 10MB)</p>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Category *</label>
                        <select
                          value={uploadForm.category}
                          onChange={(e) => setUploadForm({ ...uploadForm, category: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                        >
                          <option value="medical_record">Medical Record</option>
                          <option value="prescription">Prescription</option>
                          <option value="lab_report">Lab Report</option>
                          <option value="scan">Scan/X-Ray</option>
                          <option value="insurance">Insurance Document</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                        <textarea
                          value={uploadForm.description}
                          onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
                          rows="3"
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                          placeholder="Add a description for this document..."
                        />
                      </div>
                      <div className="flex space-x-4">
                        <button
                          type="submit"
                          disabled={loading}
                          className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 font-semibold"
                        >
                          {loading ? 'Uploading...' : 'Upload Document'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowDocumentUpload(false)}
                          className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-all font-semibold"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {loading ? (
                  <div className="text-center py-16">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-green-500 mx-auto"></div>
                    <p className="mt-4 text-gray-600 font-medium">Loading documents...</p>
                  </div>
                ) : documents.length === 0 ? (
                  <div className="text-center py-16 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl">
                    <FiFile className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-600 font-semibold text-lg">No documents uploaded</p>
                    <p className="text-sm mt-2 text-gray-500">Upload your first document to get started</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {documents.map((doc, idx) => (
                      <div key={idx} className="bg-white border-2 border-gray-200 rounded-2xl p-6 hover:shadow-xl transition-all hover:border-green-300">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-3">
                              <FiFile className="w-6 h-6 text-gray-400" />
                              <span className="font-bold text-gray-900">{doc.fileName}</span>
                              <span className={`px-3 py-1 rounded-full text-xs font-bold ${categoryColors[doc.category]}`}>
                                {doc.category.replace('_', ' ')}
                              </span>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                              <div>
                                <p className="text-gray-500 font-medium">Type</p>
                                <p className="font-semibold text-gray-900">{doc.fileType}</p>
                              </div>
                              <div>
                                <p className="text-gray-500 font-medium">Size</p>
                                <p className="font-semibold text-gray-900">{(doc.fileSize / 1024).toFixed(2)} KB</p>
                              </div>
                              <div>
                                <p className="text-gray-500 font-medium">Uploaded</p>
                                <p className="font-semibold text-gray-900">{new Date(doc.uploadedAt).toLocaleDateString()}</p>
                              </div>
                            </div>
                            {doc.description && (
                              <p className="mt-3 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">{doc.description}</p>
                            )}
                          </div>
                          <div className="flex space-x-2 ml-4">
                            <button
                              onClick={() => handleDownloadDocument(doc.documentId, doc.fileName)}
                              className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-all"
                              title="Download"
                            >
                              <FiDownload className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleDeleteDocument(doc.documentId)}
                              className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-all"
                              title="Delete"
                            >
                              <FiTrash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Profile Information</h2>
                {loading ? (
                  <div className="text-center py-16">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mx-auto"></div>
                  </div>
                ) : profile ? (
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 shadow-lg">
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

            {/* Access Control Tab */}
            {activeTab === 'access' && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Access Control</h2>
                <div className="space-y-6">
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-8 border border-green-100 shadow-lg">
                    <h3 className="font-bold text-lg mb-4">Grant Doctor Access</h3>
                    <form onSubmit={async (e) => {
                      e.preventDefault()
                      if (!user || !user.userId) {
                        toast.error('User not authenticated')
                        return
                      }
                      const doctorId = e.target.doctorId.value
                      try {
                        const response = await api.post('/patient/grantAccess', { doctorIdToGrant: doctorId })
                        if (response.data.success) {
                          toast.success('Access granted successfully')
                          e.target.reset()
                        }
                      } catch (error) {
                        console.error('Error granting access:', error)
                        toast.error(error.response?.data?.message || 'Failed to grant access')
                      }
                    }} className="flex space-x-3">
                      <input
                        type="text"
                        name="doctorId"
                        placeholder="Doctor ID"
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                        required
                      />
                      <button type="submit" className="px-8 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all shadow-lg hover:shadow-xl font-semibold">
                        Grant Access
                      </button>
                    </form>
                  </div>
                  
                  <div className="bg-gradient-to-br from-red-50 to-rose-50 rounded-2xl p-8 border border-red-100 shadow-lg">
                    <h3 className="font-bold text-lg mb-4">Revoke Doctor Access</h3>
                    <form onSubmit={async (e) => {
                      e.preventDefault()
                      if (!user || !user.userId) {
                        toast.error('User not authenticated')
                        return
                      }
                      const doctorId = e.target.doctorId.value
                      try {
                        const response = await api.post('/patient/revokeAccess', { doctorIdToRevoke: doctorId })
                        if (response.data.success) {
                          toast.success('Access revoked successfully')
                          e.target.reset()
                        }
                      } catch (error) {
                        console.error('Error revoking access:', error)
                        toast.error(error.response?.data?.message || 'Failed to revoke access')
                      }
                    }} className="flex space-x-3">
                      <input
                        type="text"
                        name="doctorId"
                        placeholder="Doctor ID"
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition"
                        required
                      />
                      <button type="submit" className="px-8 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition-all shadow-lg hover:shadow-xl font-semibold">
                        Revoke Access
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default PatientDashboard
