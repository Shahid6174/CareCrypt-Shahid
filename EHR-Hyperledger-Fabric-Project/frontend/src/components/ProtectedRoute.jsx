import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const roleMap = {
  admin: '/admin/dashboard',
  systemAdmin: '/admin/dashboard',
  hospitalAdmin: '/admin/dashboard',
  insuranceAdmin: '/admin/dashboard',
  patient: '/patient/dashboard',
  doctor: '/doctor/dashboard',
  insurance: '/insurance/dashboard',
  insuranceAgent: '/insurance/dashboard'
}

const ProtectedRoute = ({ children, role }) => {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (!user || !user.userId) {
    return <Navigate to="/login" replace />
  }

  const allowedRoles = role ? (Array.isArray(role) ? role : [role]) : null
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const correctPath = user.dashboardPath || roleMap[user.role] || '/login'
    return <Navigate to={correctPath} replace />
  }

  return children
}

export default ProtectedRoute

