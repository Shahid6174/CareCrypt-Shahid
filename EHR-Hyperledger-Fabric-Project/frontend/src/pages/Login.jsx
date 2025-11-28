import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { toast } from 'react-toastify'
import { FiShield, FiUserCheck, FiDollarSign, FiHeart, FiLogIn, FiMail, FiLock, FiActivity, FiLock as FiSecure, FiUsers,FiFileText, 
  FiAlertTriangle  } from 'react-icons/fi'

const Login = () => {
  const [selectedRole, setSelectedRole] = useState('patient')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [currentFeature, setCurrentFeature] = useState(0)
  const { login } = useAuth()
  const navigate = useNavigate()

  const features = [
    {
      title: 'Blockchain-Based Health Records',
      description: 'Stores medical records on Hyperledger Fabric to ensure data integrity, traceability, and secure sharing between stakeholders.',
      icon: <FiShield className="w-16 h-16" />
    },
    {
      title: 'OCR-Enabled Document Processing',
      description: 'Extracts data from medical documents such as prescriptions and bills using OCR for easier record management and verification.',
      icon: <FiFileText className="w-16 h-16" />
    },
    {
      title: 'Fraud Detection Checks',
      description: 'Runs basic anomaly checks on extracted claim data to help identify potential inconsistencies or fraudulent submissions.',
      icon: <FiAlertTriangle className="w-16 h-16" />
    }
  ];
  

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % features.length)
    }, 4000)
    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const roles = [
    { value: 'patient', label: 'Patient', icon: <FiHeart className="w-6 h-6" />, color: 'bg-pink-500' },
    { value: 'doctor', label: 'Doctor', icon: <FiUserCheck className="w-6 h-6" />, color: 'bg-blue-500' },
    { value: 'insurance', label: 'Insurance Agent', icon: <FiDollarSign className="w-6 h-6" />, color: 'bg-green-500' },
    { value: 'hospitalAdmin', label: 'Hospital Admin', icon: <FiShield className="w-6 h-6" />, color: 'bg-indigo-600' },
    { value: 'insuranceAdmin', label: 'Insurance Admin', icon: <FiShield className="w-6 h-6" />, color: 'bg-emerald-600' },
    { value: 'admin', label: 'System Admin', icon: <FiShield className="w-6 h-6" />, color: 'bg-purple-500' }
  ]

  const rolePaths = {
    patient: '/patient/dashboard',
    doctor: '/doctor/dashboard',
    insurance: '/insurance/dashboard',
    hospitalAdmin: '/admin/dashboard',
    insuranceAdmin: '/admin/dashboard',
    admin: '/admin/dashboard'
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!email.trim() || !password.trim()) {
      toast.error('Please enter your email and password')
      return
    }

    setLoading(true)
    try {
      const result = await login(selectedRole, email.trim(), password)
      setLoading(false)

      if (result.success) {
        const dashboardPath = result.data?.dashboardPath || rolePaths[selectedRole] || '/login'

        if (result.needsRegistration) {
          // User needs to register - redirect to registration
          toast.info('Please register first')
          navigate('/register', { state: { role: selectedRole, email: email.trim() } })
        } else if (result.needsChaincodeRegistration) {
          // User registered but needs admin to complete blockchain registration
          toast.warning(result.message || 'Your registration is pending. Please wait for admin approval.')
          if (result.pendingApproval) {
            toast.info('Your account is waiting for admin approval. Features remain limited until approval is complete.')
          }
          // Still allow login but show warning
          navigate(dashboardPath)
        } else {
          // Successful login
          if (result.pendingApproval) {
            toast.info('Some features are disabled until your admin approves the account.')
          } else {
            toast.success(`Welcome back!`)
          }
          navigate(dashboardPath)
        }
      } else {
        toast.error(result.message || 'Login failed. Please check your credentials.')
      }
    } catch (error) {
      setLoading(false)
      toast.error(error.message || 'Login failed. Please try again.')
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding & Features */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 p-12 flex-col justify-between relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full translate-x-1/2 translate-y-1/2"></div>
        </div>

        {/* Logo/Header */}
        <div className="relative z-10">
          <div className="flex items-center space-x-3 mb-8">
            <div className="flex items-center justify-center w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl">
              <FiShield className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white">CareCrypt</h1>
              <p className="text-blue-100 text-sm">Secure Healthcare Management</p>
            </div>
          </div>
          <p className="text-white/90 text-lg leading-relaxed">
            Revolutionary blockchain-powered Electronic Health Records system that puts security, privacy, and seamless healthcare coordination at the forefront of modern medical care.
          </p>
        </div>

        {/* Animated Features */}
        <div className="relative z-10 flex-1 flex items-center">
          <div className="w-full">
            {features.map((feature, index) => (
              <div
                key={index}
                className={`transition-all duration-700 ease-in-out ${
                  index === currentFeature
                    ? 'opacity-100 translate-x-0'
                    : 'opacity-0 absolute translate-x-8 pointer-events-none'
                }`}
              >
                <div className="text-white mb-6">
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-semibold text-white mb-4">
                  {feature.title}
                </h3>
                <p className="text-blue-100 text-lg leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Feature Dots */}
        <div className="relative z-10 flex space-x-2">
          {features.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentFeature(index)}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === currentFeature ? 'w-8 bg-white' : 'w-2 bg-white/40'
              }`}
              aria-label={`Feature ${index + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-blue-50 p-8">
        <div className="max-w-md w-full">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-4">
              <FiShield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">CareCrypt</h1>
            <p className="text-gray-600">Secure Healthcare Management</p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome Back</h2>
              <p className="text-gray-600">Sign in to access your healthcare portal</p>
            </div>

          {/* Role Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">Select Role</label>
            <div className="grid grid-cols-2 gap-3">
              {roles.map((role) => (
                <button
                  key={role.value}
                  type="button"
                  onClick={() => setSelectedRole(role.value)}
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

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <div className="relative">
                <FiMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-500 to-pink-500 text-white py-3 rounded-xl font-semibold hover:from-blue-600 hover:to-pink-600 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
              ) : (
                <>
                  <FiLogIn className="w-5 h-5" />
                  <span>Login</span>
                </>
              )}
            </button>
          </form>

          {/* Register Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <button
                onClick={() => navigate('/register')}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Register here
              </button>
            </p>
          </div>
        </div>
        </div>
      </div>
    </div>
  )
}

export default Login
