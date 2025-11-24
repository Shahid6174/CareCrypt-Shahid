import React, { useState, useEffect } from 'react'
import Layout from '../../components/Layout'
import { 
  FiFileText, FiUser, FiUsers, FiCheckCircle, FiXCircle,
  FiPlus, FiEye, FiHeart, FiActivity
} from 'react-icons/fi'
import api from '../../services/api'
import { toast } from 'react-toastify'
import { useAuth } from '../../contexts/AuthContext'
import { notifyClaimVerified } from '../../services/notificationService'

const DoctorDashboard = () => {
  const { user, loading: authLoading } = useAuth()
  const [activeTab, setActiveTab] = useState('patients')
  const [patients, setPatients] = useState([])
  const [claims, setClaims] = useState([])
  const [profile, setProfile] = useState(null)
  const [selectedPatient, setSelectedPatient] = useState(null)
  const [patientRecords, setPatientRecords] = useState([])
  const [loading, setLoading] = useState(false)
  const [showRecordForm, setShowRecordForm] = useState(false)
  const [recordForm, setRecordForm] = useState({
    patientId: '',
    diagnosis: '',
    treatment: '',
    notes: ''
  })

  // Show loading while auth is being checked
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
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
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-md">
          <div className="bg-red-100 rounded-full p-4 inline-flex mb-4">
            <FiUser className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Authentication Required</h2>
          <p className="text-gray-600 mb-6">Please log in to access your dashboard</p>
          <button
            onClick={() => window.location.href = '/login'}
            className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:from-blue-600 hover:to-cyan-600 transition-all shadow-lg hover:shadow-xl font-semibold"
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
  }, [user, activeTab, authLoading])

  const loadData = async () => {
    if (activeTab === 'patients') {
      await loadPatients()
    } else if (activeTab === 'claims') {
      await loadClaims()
    } else if (activeTab === 'profile') {
      await loadProfile()
    }
  }

  const loadPatients = async () => {
    if (!user || !user.userId) return
    
    try {
      setLoading(true)
      const response = await api.get(`/doctor/${user.userId}/patients`)
      const patientsData = response.data?.data || response.data || []
      setPatients(Array.isArray(patientsData) ? patientsData : [])
    } catch (error) {
      console.error('Error loading patients:', error)
      toast.error(error.response?.data?.message || 'Failed to load patients')
      setPatients([])
    } finally {
      setLoading(false)
    }
  }

  const loadClaims = async () => {
    if (!user || !user.userId) return
    
    try {
      setLoading(true)
      const response = await api.get(`/claims/byDoctor/${user.userId}`)
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
      const response = await api.get(`/doctor/${user.userId}/profile`)
      setProfile(response.data?.data || response.data || null)
    } catch (error) {
      console.error('Error loading profile:', error)
      toast.error(error.response?.data?.message || 'Failed to load profile')
      setProfile(null)
    } finally {
      setLoading(false)
    }
  }

  const loadPatientRecords = async (patientId) => {
    try {
      setLoading(true)
      const response = await api.get(`/doctor/records/${patientId}`)
      const recordsData = response.data.data || []
      setPatientRecords(Array.isArray(recordsData) ? recordsData : [])
      setSelectedPatient(patientId)
    } catch (error) {
      toast.error('Failed to load patient records')
      setPatientRecords([])
    } finally {
      setLoading(false)
    }
  }

  const handleAddRecord = async (e) => {
    e.preventDefault()
    try {
      setLoading(true)
      const response = await api.post('/doctor/addRecord', recordForm)
      
      if (response.data.success) {
        toast.success('Medical record added successfully!')
        setShowRecordForm(false)
        setRecordForm({
          patientId: '',
          diagnosis: '',
          treatment: '',
          notes: ''
        })
        if (selectedPatient) {
          loadPatientRecords(selectedPatient)
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add record')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyClaim = async (claimId, verified, notes) => {
    try {
      setLoading(true)
      const response = await api.post('/doctor/claim/verify', {
        claimId,
        verified,
        notes
      })
      
      if (response.data.success) {
        toast.success(`Claim ${verified ? 'verified' : 'rejected'} successfully!`)
        const claim = claims.find(c => c.claimId === claimId)
        if (claim) {
          notifyClaimVerified(claimId, claim.patientId, 'agent01', verified)
        }
        loadClaims()
      }
    } catch (error) {
      toast.error('Failed to verify claim')
    } finally {
      setLoading(false)
    }
  }

  const navItems = [
    { path: '/doctor/dashboard', label: 'Patients', icon: <FiUsers className="w-5 h-5" /> },
    { path: '/doctor/dashboard', label: 'Claims to Verify', icon: <FiFileText className="w-5 h-5" /> },
    { path: '/doctor/dashboard', label: 'Profile', icon: <FiUser className="w-5 h-5" /> }
  ]

  return (
    <Layout title="Doctor Dashboard" navItems={navItems}>
      <div className="space-y-6">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {['patients', 'claims', 'profile'].map((tab) => (
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
            {activeTab === 'patients' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-gray-900">My Patients</h2>
                  <button
                    onClick={() => setShowRecordForm(!showRecordForm)}
                    className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl flex items-center space-x-2 font-semibold"
                  >
                    <FiPlus className="w-5 h-5" />
                    <span>Add Medical Record</span>
                  </button>
                </div>

                {showRecordForm && (
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-100 shadow-lg">
                    <h3 className="text-xl font-bold text-gray-900 mb-6">Add Medical Record</h3>
                    <form onSubmit={handleAddRecord} className="space-y-6">
                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Patient ID *</label>
                          <input
                            type="text"
                            value={recordForm.patientId}
                            onChange={(e) => setRecordForm({ ...recordForm, patientId: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                            placeholder="Enter patient ID"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Diagnosis *</label>
                          <input
                            type="text"
                            value={recordForm.diagnosis}
                            onChange={(e) => setRecordForm({ ...recordForm, diagnosis: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                            placeholder="Enter diagnosis"
                            required
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Treatment *</label>
                          <input
                            type="text"
                            value={recordForm.treatment}
                            onChange={(e) => setRecordForm({ ...recordForm, treatment: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                            placeholder="Enter treatment"
                            required
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Notes</label>
                        <textarea
                          value={recordForm.notes}
                          onChange={(e) => setRecordForm({ ...recordForm, notes: e.target.value })}
                          rows="4"
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                          placeholder="Additional notes..."
                        />
                      </div>
                      <div className="flex space-x-4">
                        <button
                          type="submit"
                          disabled={loading}
                          className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 font-semibold"
                        >
                          {loading ? 'Adding...' : 'Add Record'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowRecordForm(false)}
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
                    <p className="mt-4 text-gray-600 font-medium">Loading patients...</p>
                  </div>
                ) : patients.length === 0 ? (
                  <div className="text-center py-16 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl">
                    <FiUsers className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-600 font-semibold text-lg">No patients assigned</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {patients.map((patient, idx) => (
                      <div key={idx} className="bg-white border-2 border-gray-200 rounded-2xl p-6 hover:shadow-xl transition-all hover:border-blue-300">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-4">
                              <FiUser className="w-6 h-6 text-blue-500" />
                              <span className="font-bold text-gray-900 text-lg">{patient.patientId || patient.userId || `Patient #${idx + 1}`}</span>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                              <div>
                                <p className="text-gray-500 font-medium">Name</p>
                                <p className="font-semibold text-gray-900">{patient.name || '-'}</p>
                              </div>
                              <div>
                                <p className="text-gray-500 font-medium">City</p>
                                <p className="font-semibold text-gray-900">{patient.city || '-'}</p>
                              </div>
                              <div>
                                <p className="text-gray-500 font-medium">DOB</p>
                                <p className="font-semibold text-gray-900">{patient.dob || '-'}</p>
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => loadPatientRecords(patient.patientId || patient.userId)}
                            className="ml-4 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl flex items-center space-x-2 font-semibold"
                          >
                            <FiEye className="w-5 h-5" />
                            <span>View Records</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {selectedPatient && patientRecords.length > 0 && (
                  <div className="mt-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-8 border border-purple-100 shadow-lg">
                    <h3 className="text-xl font-bold text-gray-900 mb-6">Records for {selectedPatient}</h3>
                    <div className="grid gap-4">
                      {patientRecords.map((record, idx) => (
                        <div key={idx} className="bg-white rounded-xl p-6 border-2 border-purple-200 hover:border-purple-300 transition-all">
                          <div className="grid grid-cols-3 gap-4 text-sm">
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
                              <p className="text-sm bg-purple-50 p-3 rounded-lg mt-1">{record.notes}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'claims' && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Claims to Verify</h2>
                {loading ? (
                  <div className="text-center py-16">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mx-auto"></div>
                  </div>
                ) : claims.length === 0 ? (
                  <div className="text-center py-16 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl">
                    <FiFileText className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-600 font-semibold text-lg">No claims to verify</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {claims.filter(c => c.status === 'pending' || !c.status).map((claim, idx) => (
                      <div key={idx} className="bg-white border-2 border-gray-200 rounded-2xl p-6 hover:shadow-xl transition-all hover:border-yellow-300">
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
                          <div className="flex space-x-3 ml-4">
                            <button
                              onClick={() => handleVerifyClaim(claim.claimId, true, 'Claim verified by doctor')}
                              className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all shadow-lg hover:shadow-xl flex items-center space-x-2 font-semibold"
                            >
                              <FiCheckCircle className="w-5 h-5" />
                              <span>Verify</span>
                            </button>
                            <button
                              onClick={() => {
                                const notes = prompt('Enter rejection reason:')
                                if (notes) {
                                  handleVerifyClaim(claim.claimId, false, notes)
                                }
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
              </div>
            )}

            {activeTab === 'profile' && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Profile Information</h2>
                {loading ? (
                  <div className="text-center py-16">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mx-auto"></div>
                  </div>
                ) : profile ? (
                  <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-8 shadow-lg">
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

export default DoctorDashboard
