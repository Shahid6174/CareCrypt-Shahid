import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { toast } from 'react-toastify'
import api from '../services/api'
import { submitRegistrationRequest } from '../services/registrationService'
import { FiShield, FiUserCheck, FiDollarSign, FiHeart, FiUserPlus, FiMail, FiLock } from 'react-icons/fi'

const Register = () => {
  const location = useLocation()
  const [selectedRole, setSelectedRole] = useState(location.state?.role || 'patient')
  const [email, setEmail] = useState(location.state?.email || '')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [formData, setFormData] = useState({})
  const [loading, setLoading] = useState(false)
  const [showUserIdModal, setShowUserIdModal] = useState(false)
  const [generatedUserId, setGeneratedUserId] = useState('')
  const [copiedUserId, setCopiedUserId] = useState(false)
  const navigate = useNavigate()
  const handleCopyUserId = async () => {
    if (!generatedUserId || !navigator?.clipboard) return
    try {
      await navigator.clipboard.writeText(generatedUserId)
      setCopiedUserId(true)
      setTimeout(() => setCopiedUserId(false), 2000)
    } catch (error) {
      toast.error('Unable to copy User ID automatically. Please copy it manually.')
    }
  }

  const handleCloseModal = () => {
    setShowUserIdModal(false)
  }

  const handleGoToLogin = () => {
    setShowUserIdModal(false)
    navigate('/login', { state: { email, role: selectedRole } })
  }

  const roles = [
    { value: 'patient', label: 'Patient', icon: <FiHeart className="w-6 h-6" />, color: 'bg-pink-500' },
    { value: 'doctor', label: 'Doctor', icon: <FiUserCheck className="w-6 h-6" />, color: 'bg-blue-500' },
    { value: 'insurance', label: 'Insurance Agent', icon: <FiDollarSign className="w-6 h-6" />, color: 'bg-green-500' }
  ]

  useEffect(() => {
    if (location.state?.role) {
      setSelectedRole(location.state.role)
    }
    if (location.state?.email) {
      setEmail(location.state.email)
    }
  }, [location.state])

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validate password
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters long')
      return
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    setLoading(true)

    try {
      let endpoint = ''
      let payload = {}

      switch (selectedRole) {
        case 'patient':
          endpoint = '/auth/registerPatient'
          if (!email || !password || !formData.name || !formData.dob || !formData.city) {
            toast.error('Please fill in all required fields')
            setLoading(false)
            return
          }
          payload = {
            email,
            password,
            name: formData.name,
            dob: formData.dob,
            city: formData.city,
            doctorId: formData.doctorId || null
          }
          break

        case 'doctor':
          endpoint = '/auth/registerDoctor'
          if (!email || !password || !formData.name || !formData.hospitalId || !formData.city) {
            toast.error('Please fill in all required fields')
            setLoading(false)
            return
          }
          payload = {
            email,
            password,
            name: formData.name,
            hospitalId: formData.hospitalId,
            city: formData.city
          }
          break

        case 'insurance':
          endpoint = '/auth/registerInsuranceAgent'
          if (!email || !password || !formData.name || !formData.insuranceId || !formData.city) {
            toast.error('Please fill in all required fields')
            setLoading(false)
            return
          }
          payload = {
            email,
            password,
            name: formData.name,
            insuranceId: formData.insuranceId,
            city: formData.city
          }
          break

        default:
          toast.error('Invalid role selected')
          setLoading(false)
          return
      }

      const response = await api.post(endpoint, payload)

      if (response.data.success) {
        toast.success(response.data.data?.message || 'Registration successful! Your userId has been generated. An admin will complete your blockchain registration shortly.')

        if (response.data.data?.userId) {
          setGeneratedUserId(response.data.data.userId)
          setShowUserIdModal(true)
        }

        // Also register a local registration request so admin dashboard (local) sees it
        try {
          const normalizedRole = selectedRole === 'insurance' ? 'insuranceAgent' : selectedRole
          const registrationMeta = response.data.data?.registrationData || {}
          const requestData = {
            userId: response.data.data?.userId,
            email,
            password,
            name: formData.name || '',
            city: formData.city || '',
            dob: formData.dob || '',
            doctorId: formData.doctorId || null,
            hospitalId: formData.hospitalId || registrationMeta.hospitalId || '',
            insuranceId: formData.insuranceId || registrationMeta.insuranceId || '',
            adminId: registrationMeta.adminId || null,
            organization: registrationMeta.organization || registrationMeta.org || null
          }
          submitRegistrationRequest(normalizedRole, requestData)
        } catch (err) {
          console.warn('Could not store local registration request:', err.message)
        }

        if (!response.data.data?.userId) {
          navigate('/login', { state: { email, role: selectedRole } })
        }
      } else {
        toast.error(response.data.message || 'Registration failed')
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Registration failed'
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const renderFormFields = () => {
    switch (selectedRole) {
      case 'patient':
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
              <input
                type="text"
                value={formData.name || ''}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="John Doe"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth *</label>
              <input
                type="text"
                value={formData.dob || ''}
                onChange={(e) => handleInputChange('dob', e.target.value)}
                placeholder="01/01/1990"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">City *</label>
              <input
                type="text"
                value={formData.city || ''}
                onChange={(e) => handleInputChange('city', e.target.value)}
                placeholder="New York"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                required
              />
            </div>
            {/* <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Doctor ID (Optional)</label>
              <input
                type="text"
                value={formData.doctorId || ''}
                onChange={(e) => handleInputChange('doctorId', e.target.value)}
                placeholder="doctor01"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div> */}
          </>
        )

      case 'doctor':
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
              <input
                type="text"
                value={formData.name || ''}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Dr. Jane Smith"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Hospital ID *</label>
              <input
                type="text"
                value={formData.hospitalId || ''}
                onChange={(e) => handleInputChange('hospitalId', e.target.value)}
                placeholder="Hospital01"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">City *</label>
              <input
                type="text"
                value={formData.city || ''}
                onChange={(e) => handleInputChange('city', e.target.value)}
                placeholder="New York"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                required
              />
            </div>
          </>
        )

      case 'insurance':
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
              <input
                type="text"
                value={formData.name || ''}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Agent Name"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Insurance ID *</label>
              <input
                type="text"
                value={formData.insuranceId || ''}
                onChange={(e) => handleInputChange('insuranceId', e.target.value)}
                placeholder="insuranceCompany01"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">City *</label>
              <input
                type="text"
                value={formData.city || ''}
                onChange={(e) => handleInputChange('city', e.target.value)}
                placeholder="New York"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                required
              />
            </div>
          </>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-pink-50 p-4">
      <div className="max-w-2xl w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-pink-500 rounded-2xl mb-4">
              <FiUserPlus className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Register Account</h1>
            <p className="text-gray-600">Create your account. A unique User ID will be generated for you.</p>
          </div>

          {/* Role Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">Select Role</label>
            <div className="grid grid-cols-3 gap-3">
              {roles.map((role) => (
                <button
                  key={role.value}
                  type="button"
                  onClick={() => {
                    setSelectedRole(role.value)
                    setFormData({})
                  }}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    selectedRole === role.value
                      ? `${role.color} text-white border-transparent shadow-lg transform scale-105`
                      : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex flex-col items-center space-y-2">
                    {role.icon}
                    <span className="text-sm font-medium">{role.label}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Registration Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
              <div className="relative">
                <FiMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password *</label>
              <div className="relative">
                <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  required
                  minLength={6}
                />
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password *</label>
              <div className="relative">
                <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  required
                  minLength={6}
                />
              </div>
            </div>

            {/* Role-specific fields */}
            {renderFormFields()}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-500 to-pink-500 text-white py-3 rounded-xl font-semibold hover:from-blue-600 hover:to-pink-600 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 mt-6"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
              ) : (
                <>
                  <FiUserPlus className="w-5 h-5" />
                  <span>Register</span>
                </>
              )}
            </button>
          </form>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <button
                onClick={() => navigate('/login')}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Login here
              </button>
            </p>
          </div>
        </div>
      </div>

      {showUserIdModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Your Unique User ID</h2>
            <p className="text-gray-600 mb-6">
              Save this ID safely. You&apos;ll need it to complete blockchain onboarding and future logins.
            </p>
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 mb-6">
              <p className="text-xs font-semibold text-gray-500 mb-2">USER ID</p>
              <div className="flex items-center justify-between bg-white rounded-xl px-4 py-3 border border-gray-100">
                <span className="font-mono text-sm text-gray-800 break-all mr-4">{generatedUserId}</span>
                <button
                  onClick={handleCopyUserId}
                  className="px-4 py-2 bg-gradient-to-r from-blue-500 to-pink-500 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-pink-600 transition"
                >
                  {copiedUserId ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>
            <div className="space-y-3">
              <button
                onClick={handleGoToLogin}
                className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-pink-500 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-pink-600 transition shadow-lg hover:shadow-xl"
              >
                Go to Login
              </button>
              <button
                onClick={handleCloseModal}
                className="w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition"
              >
                Stay on this page
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Register
