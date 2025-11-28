import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import ErrorBoundary from './components/ErrorBoundary'
import Chatbot from './components/Chatbot'
import Login from './pages/Login'
import Register from './pages/Register'
import AdminDashboard from './pages/admin/AdminDashboard'
import PatientDashboard from './pages/patient/PatientDashboard'
import DoctorDashboard from './pages/doctor/DoctorDashboard'
import InsuranceDashboard from './pages/insurance/InsuranceDashboard'
import ProtectedRoute from './components/ProtectedRoute'

const ROLE_TO_PATH = {
  admin: '/admin/dashboard',
  systemAdmin: '/admin/dashboard',
  hospitalAdmin: '/admin/dashboard',
  insuranceAdmin: '/admin/dashboard',
  patient: '/patient/dashboard',
  doctor: '/doctor/dashboard',
  insuranceAgent: '/insurance/dashboard'
}

const getDashboardPath = (user) => {
  if (!user) return '/login'
  return user.dashboardPath || ROLE_TO_PATH[user.role] || '/login'
}

function AppRoutes() {
  const { user, loading } = useAuth()

  // Show loading screen while checking auth
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <Routes>
      <Route 
        path="/login" 
        element={
          !user ? (
            <Login />
          ) : (
            <Navigate to={getDashboardPath(user)} replace />
          )
        } 
      />
      <Route 
        path="/register" 
        element={
          !user ? (
            <Register />
          ) : (
            <Navigate to={getDashboardPath(user)} replace />
          )
        } 
      />
      
      <Route path="/admin/dashboard" element={
        <ProtectedRoute role={['admin', 'systemAdmin', 'hospitalAdmin', 'insuranceAdmin']}>
          <AdminDashboard />
        </ProtectedRoute>
      } />
      
      <Route path="/patient/dashboard" element={
        <ProtectedRoute role="patient">
          <PatientDashboard />
        </ProtectedRoute>
      } />
      
      <Route path="/doctor/dashboard" element={
        <ProtectedRoute role="doctor">
          <DoctorDashboard />
        </ProtectedRoute>
      } />
      
      <Route path="/insurance/dashboard" element={
        <ProtectedRoute role="insuranceAgent">
          <InsuranceDashboard />
        </ProtectedRoute>
      } />
      
      <Route path="/" element={
        user ? (
          <Navigate to={getDashboardPath(user)} replace />
        ) : (
          <Navigate to="/login" replace />
        )
      } />
      <Route path="*" element={
        user ? (
          <Navigate to={getDashboardPath(user)} replace />
        ) : (
          <Navigate to="/login" replace />
        )
      } />
    </Routes>
  )
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <AppRoutes />
          <Chatbot />
          <ToastContainer
            position="top-right"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="light"
          />
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  )
}

export default App

