import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import NotificationBell from './NotificationBell'
import { 
  FiHome, FiLogOut, FiUser, 
  FiShield, FiActivity, FiFileText, FiUsers,
  FiHeart, FiUserCheck, FiDollarSign, FiCopy, FiAlertCircle
} from 'react-icons/fi'

const Layout = ({ children, title, navItems = [] }) => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [copied, setCopied] = React.useState(false)

  // Debug logging
  React.useEffect(() => {
    console.log('Layout rendered', { user, hasUserId: !!user?.userId, title })
  }, [user, title])

  // Early return if user is not available
  if (!user || !user.userId) {
    console.warn('Layout: User not available', { user })
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading user data...</p>
        </div>
      </div>
    )
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const getRoleIcon = () => {
    switch (user?.role) {
      case 'admin':
      case 'hospitalAdmin':
      case 'insuranceAdmin':
        return <FiShield className="w-6 h-6" />
      case 'doctor':
        return <FiUserCheck className="w-6 h-6" />
      case 'insurance':
      case 'insuranceAgent':
        return <FiDollarSign className="w-6 h-6" />
      case 'patient':
        return <FiHeart className="w-6 h-6" />
      default:
        return <FiUser className="w-6 h-6" />
    }
  }

  const getRoleColor = () => {
    switch (user?.role) {
      case 'admin':
      case 'hospitalAdmin':
      case 'insuranceAdmin':
        return 'bg-purple-500'
      case 'doctor':
        return 'bg-blue-500'
      case 'insurance':
      case 'insuranceAgent':
        return 'bg-green-500'
      case 'patient':
        return 'bg-pink-500'
      default:
        return 'bg-gray-500'
    }
  }

  const isRestricted = user?.role !== 'admin' && user?.role !== 'hospitalAdmin' && user?.role !== 'insuranceAdmin' && user?.restricted

  const handleCopyUserId = async () => {
    if (!user?.userId || !navigator?.clipboard) return
    try {
      await navigator.clipboard.writeText(user.userId)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy user ID', error)
    }
  }

  const approvalMessage = user?.approvalStatus !== 'approved'
    ? 'Your account is waiting for admin approval. We will notify you when it is ready.'
    : 'Your blockchain certificate is still being generated. This usually takes less than a minute.'
  const roleLabelMap = {
    insuranceAgent: 'insurance agent',
    hospitalAdmin: 'hospital admin',
    insuranceAdmin: 'insurance admin'
  }
  const roleLabel = roleLabelMap[user?.role] || user?.role

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className={`${getRoleColor()} text-white p-2 rounded-lg`}>
                {getRoleIcon()}
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{title}</h1>
                <p className="text-sm text-gray-500 capitalize">{user?.role} Dashboard</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <NotificationBell />
              
              {/* User Info */}
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{user?.userId}</p>
                  <p className="text-xs text-gray-500 capitalize">{roleLabel}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                  title="Logout"
                >
                  <FiLogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white shadow-sm min-h-[calc(100vh-4rem)] border-r border-gray-200">
          <nav className="p-4 space-y-2">
            {navItems.map((item, index) => (
              <button
                key={index}
                onClick={() => {
                  if (item.path !== location.pathname) {
                    navigate(item.path)
                  }
                }}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition ${
                  location.pathname === item.path
                    ? 'bg-blue-50 text-blue-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 relative">
          {isRestricted && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/95 text-center p-8 border border-dashed border-blue-300 rounded-xl">
              <FiAlertCircle className="w-10 h-10 text-blue-500 mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Waiting for Admin Approval</h2>
              <p className="text-gray-600 mb-6 max-w-2xl">{approvalMessage}</p>
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 w-full max-w-md text-left mb-4">
                <p className="text-sm font-semibold text-blue-900 mb-2">Your User ID</p>
                <div className="flex items-center justify-between bg-white rounded-xl border border-blue-100 px-4 py-3">
                  <span className="font-mono text-sm text-gray-800 truncate">{user.userId}</span>
                  <button
                    onClick={handleCopyUserId}
                    className="flex items-center space-x-2 text-sm font-semibold text-blue-600 hover:text-blue-800 transition"
                  >
                    <FiCopy className="w-4 h-4" />
                    <span>{copied ? 'Copied!' : 'Copy'}</span>
                  </button>
                </div>
              </div>
              <p className="text-sm text-gray-500 max-w-xl">
                You can still explore the dashboard, but actions are disabled until your identity is fully approved.
              </p>
            </div>
          )}

          <div className={isRestricted ? 'pointer-events-none select-none opacity-40' : ''}>
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

export default Layout

