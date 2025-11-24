import React, { useState, useEffect } from 'react'
import Layout from '../../components/Layout'
import { 
  FiUsers, FiUserCheck, FiShield, FiCheckCircle, FiXCircle,
  FiClock, FiActivity, FiPlus, FiDollarSign, FiAlertTriangle
} from 'react-icons/fi'
import { getRegistrationRequests, approveRegistration, rejectRegistration } from '../../services/registrationService'
import api from '../../services/api'
import { toast } from 'react-toastify'
import { useAuth } from '../../contexts/AuthContext'
import FraudManagement from '../../components/FraudManagement'

const AdminDashboard = () => {
  const { user, loading: authLoading } = useAuth()
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('pending')
  const [mainTab, setMainTab] = useState('requests') // 'requests' or 'direct'
  const [showDoctorForm, setShowDoctorForm] = useState(false)
  const [showAgentForm, setShowAgentForm] = useState(false)
  const [doctorForm, setDoctorForm] = useState({
    adminId: '',
    doctorId: '',
    hospitalId: '',
    name: '',
    city: ''
  })
  const [agentForm, setAgentForm] = useState({
    adminId: '',
    agentId: '',
    insuranceId: '',
    name: '',
    city: ''
  })

  useEffect(() => {
    loadRequests()
  }, [])

  const loadRequests = async () => {
    try {
      const result = await getRegistrationRequests()
      setRequests(result.data || [])
    } catch (error) {
      toast.error('Failed to load registration requests')
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (requestId) => {
    try {
      await approveRegistration(requestId, user.userId)
      toast.success('Registration approved successfully!')
      loadRequests()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to approve registration')
    }
  }

  const handleReject = async (requestId) => {
    if (!window.confirm('Are you sure you want to reject this registration request?')) {
      return
    }
    
    try {
      await rejectRegistration(requestId)
      toast.success('Registration request rejected')
      loadRequests()
    } catch (error) {
      toast.error('Failed to reject registration')
    }
  }

  const filteredRequests = requests.filter(r => {
    if (activeTab === 'pending') return r.status === 'pending'
    if (activeTab === 'approved') return r.status === 'approved'
    if (activeTab === 'rejected') return r.status === 'rejected'
    return true
  })

  const handleRegisterDoctor = async (e) => {
    e.preventDefault()
    if (!user || !user.userId) {
      toast.error('User not authenticated')
      return
    }

    try {
      setLoading(true)
      // Set header for hospital admin
      const hospitalId = doctorForm.hospitalId || user.userId
      api.defaults.headers.common['x-userid'] = hospitalId
      
      const response = await api.post('/auth/registerDoctor', {
        adminId: doctorForm.adminId || hospitalId,
        doctorId: doctorForm.doctorId,
        hospitalId: hospitalId,
        name: doctorForm.name,
        city: doctorForm.city
      })

      if (response.data.success) {
        toast.success('Doctor registered successfully!')
        setShowDoctorForm(false)
        setDoctorForm({
          adminId: '',
          doctorId: '',
          hospitalId: '',
          name: '',
          city: ''
        })
        // Reset header
        api.defaults.headers.common['x-userid'] = user.userId
      }
    } catch (error) {
      console.error('Error registering doctor:', error)
      toast.error(error.response?.data?.message || error.message || 'Failed to register doctor')
      // Reset header
      api.defaults.headers.common['x-userid'] = user.userId
    } finally {
      setLoading(false)
    }
  }

  const handleRegisterAgent = async (e) => {
    e.preventDefault()
    if (!user || !user.userId) {
      toast.error('User not authenticated')
      return
    }

    try {
      setLoading(true)
      // Set header for insurance admin
      const insuranceId = agentForm.insuranceId
      api.defaults.headers.common['x-userid'] = insuranceId
      
      const response = await api.post('/auth/registerInsuranceAgent', {
        adminId: agentForm.adminId || insuranceId,
        agentId: agentForm.agentId,
        insuranceId: insuranceId,
        name: agentForm.name,
        city: agentForm.city
      })

      if (response.data.success) {
        toast.success('Insurance agent registered successfully!')
        setShowAgentForm(false)
        setAgentForm({
          adminId: '',
          agentId: '',
          insuranceId: '',
          name: '',
          city: ''
        })
      }
      // Reset header
      api.defaults.headers.common['x-userid'] = user.userId
    } catch (error) {
      console.error('Error registering agent:', error)
      toast.error(error.response?.data?.message || error.message || 'Failed to register insurance agent')
      // Reset header
      api.defaults.headers.common['x-userid'] = user.userId
    } finally {
      setLoading(false)
    }
  }

  const navItems = [
    { path: '/admin/dashboard', label: 'Registration Requests', icon: <FiUsers className="w-5 h-5" /> },
    { path: '/admin/dashboard', label: 'Direct Registration', icon: <FiPlus className="w-5 h-5" /> }
  ]

  // Show loading while auth is being checked
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-purple-500"></div>
          <p className="text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user || !user.userId) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-md">
          <div className="bg-red-100 rounded-full p-4 inline-flex mb-4">
            <FiShield className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Authentication Required</h2>
          <p className="text-gray-600 mb-6">Please log in to access your dashboard</p>
          <button
            onClick={() => window.location.href = '/login'}
            className="w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-lg hover:from-purple-600 hover:to-indigo-600 transition-all shadow-lg hover:shadow-xl font-semibold"
          >
            Go to Login
          </button>
        </div>
      </div>
    )
  }


  return (
    <Layout title="Admin Dashboard" navItems={navItems}>
      <div className="space-y-6">
        {/* Main Tabs */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              <button
                onClick={() => setMainTab('requests')}
                className={`py-4 px-1 border-b-2 font-semibold text-sm transition-all ${
                  mainTab === 'requests'
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Registration Requests
              </button>
              <button
                onClick={() => setMainTab('direct')}
                className={`py-4 px-1 border-b-2 font-semibold text-sm transition-all ${
                  mainTab === 'direct'
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Direct Registration
              </button>
              <button
                onClick={() => setMainTab('fraud')}
                className={`py-4 px-1 border-b-2 font-semibold text-sm transition-all flex items-center space-x-2 ${
                  mainTab === 'fraud'
                    ? 'border-red-500 text-red-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <FiAlertTriangle />
                <span>Fraud Management</span>
              </button>
            </nav>
          </div>
        </div>

        {mainTab === 'fraud' && <FraudManagement />}

        {mainTab === 'requests' && (
          <>
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Total Requests</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{requests.length}</p>
              </div>
              <div className="bg-gradient-to-br from-blue-100 to-blue-200 p-4 rounded-xl">
                <FiUsers className="w-7 h-7 text-blue-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Pending</p>
                <p className="text-3xl font-bold text-yellow-600 mt-1">
                  {requests.filter(r => r.status === 'pending').length}
                </p>
              </div>
              <div className="bg-gradient-to-br from-yellow-100 to-yellow-200 p-4 rounded-xl">
                <FiClock className="w-7 h-7 text-yellow-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Approved</p>
                <p className="text-3xl font-bold text-green-600 mt-1">
                  {requests.filter(r => r.status === 'approved').length}
                </p>
              </div>
              <div className="bg-gradient-to-br from-green-100 to-green-200 p-4 rounded-xl">
                <FiCheckCircle className="w-7 h-7 text-green-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Rejected</p>
                <p className="text-3xl font-bold text-red-600 mt-1">
                  {requests.filter(r => r.status === 'rejected').length}
                </p>
              </div>
              <div className="bg-gradient-to-br from-red-100 to-red-200 p-4 rounded-xl">
                <FiXCircle className="w-7 h-7 text-red-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {['pending', 'approved', 'rejected', 'all'].map((tab) => (
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

          {/* Requests List */}
          <div className="p-6">
            {loading ? (
              <div className="text-center py-16">
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-purple-500 mx-auto"></div>
                <p className="mt-4 text-gray-600 font-medium">Loading requests...</p>
              </div>
            ) : filteredRequests.length === 0 ? (
              <div className="text-center py-16 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl">
                <FiUsers className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600 font-semibold text-lg">No registration requests found</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {filteredRequests.map((request) => (
                  <div
                    key={request.id}
                    className="bg-white border-2 border-gray-200 rounded-2xl p-6 hover:shadow-xl transition-all hover:border-purple-300"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-4">
                          <span className={`px-4 py-1.5 rounded-full text-xs font-bold ${
                            request.role === 'patient' ? 'bg-pink-100 text-pink-700' :
                            request.role === 'doctor' ? 'bg-blue-100 text-blue-700' :
                            request.role === 'hospital' ? 'bg-purple-100 text-purple-700' :
                            'bg-green-100 text-green-700'
                          }`}>
                            {request.role}
                          </span>
                          <span className={`px-4 py-1.5 rounded-full text-xs font-bold ${
                            request.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                            request.status === 'approved' ? 'bg-green-100 text-green-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {request.status}
                          </span>
                          <span className="text-sm text-gray-500 font-medium">
                            {new Date(request.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          {Object.entries(request.data).map(([key, value]) => (
                            <div key={key}>
                              <p className="text-xs text-gray-500 capitalize font-medium">{key.replace(/([A-Z])/g, ' $1')}</p>
                              <p className="text-sm font-semibold text-gray-900">{value || '-'}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      {request.status === 'pending' && (
                        <div className="flex space-x-3 ml-4">
                          <button
                            onClick={() => handleApprove(request.id)}
                            className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all shadow-lg hover:shadow-xl flex items-center space-x-2 font-semibold"
                          >
                            <FiCheckCircle className="w-5 h-5" />
                            <span>Approve</span>
                          </button>
                          <button
                            onClick={() => handleReject(request.id)}
                            className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition-all shadow-lg hover:shadow-xl flex items-center space-x-2 font-semibold"
                          >
                            <FiXCircle className="w-5 h-5" />
                            <span>Reject</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        </>
        )}

        {mainTab === 'direct' && (
          <div className="space-y-6">
            {/* Direct Registration Section */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Direct User Registration</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Register Doctor */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-6 shadow-lg">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
                      <FiUserCheck className="w-6 h-6 text-blue-500" />
                      <span>Register Doctor</span>
                    </h3>
                    <button
                      onClick={() => setShowDoctorForm(!showDoctorForm)}
                      className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl flex items-center space-x-2 font-semibold"
                    >
                      <FiPlus className="w-5 h-5" />
                      <span>{showDoctorForm ? 'Cancel' : 'Add Doctor'}</span>
                    </button>
                  </div>

                  {showDoctorForm && (
                    <form onSubmit={handleRegisterDoctor} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Admin ID</label>
                        <input
                          type="text"
                          value={doctorForm.adminId}
                          onChange={(e) => setDoctorForm({ ...doctorForm, adminId: e.target.value })}
                          placeholder="hospitalAdmin or Hospital01"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                        <p className="text-xs text-gray-500 mt-1">Leave empty to use Hospital ID</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Doctor ID *</label>
                        <input
                          type="text"
                          value={doctorForm.doctorId}
                          onChange={(e) => setDoctorForm({ ...doctorForm, doctorId: e.target.value })}
                          placeholder="doctor01"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Hospital ID *</label>
                        <input
                          type="text"
                          value={doctorForm.hospitalId}
                          onChange={(e) => setDoctorForm({ ...doctorForm, hospitalId: e.target.value })}
                          placeholder="Hospital01"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Doctor Name *</label>
                        <input
                          type="text"
                          value={doctorForm.name}
                          onChange={(e) => setDoctorForm({ ...doctorForm, name: e.target.value })}
                          placeholder="Dr. Jane Smith"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">City *</label>
                        <input
                          type="text"
                          value={doctorForm.city}
                          onChange={(e) => setDoctorForm({ ...doctorForm, city: e.target.value })}
                          placeholder="New York"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition disabled:opacity-50"
                      >
                        {loading ? 'Registering...' : 'Register Doctor'}
                      </button>
                    </form>
                  )}
                </div>

                {/* Register Insurance Agent */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-6 shadow-lg">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
                      <FiDollarSign className="w-6 h-6 text-green-500" />
                      <span>Register Insurance Agent</span>
                    </h3>
                    <button
                      onClick={() => setShowAgentForm(!showAgentForm)}
                      className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all shadow-lg hover:shadow-xl flex items-center space-x-2 font-semibold"
                    >
                      <FiPlus className="w-5 h-5" />
                      <span>{showAgentForm ? 'Cancel' : 'Add Agent'}</span>
                    </button>
                  </div>

                  {showAgentForm && (
                    <form onSubmit={handleRegisterAgent} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Admin ID</label>
                        <input
                          type="text"
                          value={agentForm.adminId}
                          onChange={(e) => setAgentForm({ ...agentForm, adminId: e.target.value })}
                          placeholder="insuranceAdmin or Insurance01"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                        />
                        <p className="text-xs text-gray-500 mt-1">Leave empty to use Insurance ID</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Agent ID *</label>
                        <input
                          type="text"
                          value={agentForm.agentId}
                          onChange={(e) => setAgentForm({ ...agentForm, agentId: e.target.value })}
                          placeholder="agent01"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Insurance ID *</label>
                        <input
                          type="text"
                          value={agentForm.insuranceId}
                          onChange={(e) => setAgentForm({ ...agentForm, insuranceId: e.target.value })}
                          placeholder="Insurance01"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Agent Name *</label>
                        <input
                          type="text"
                          value={agentForm.name}
                          onChange={(e) => setAgentForm({ ...agentForm, name: e.target.value })}
                          placeholder="Agent John"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">City *</label>
                        <input
                          type="text"
                          value={agentForm.city}
                          onChange={(e) => setAgentForm({ ...agentForm, city: e.target.value })}
                          placeholder="New York"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                          required
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition disabled:opacity-50"
                      >
                        {loading ? 'Registering...' : 'Register Agent'}
                      </button>
                    </form>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}

export default AdminDashboard

