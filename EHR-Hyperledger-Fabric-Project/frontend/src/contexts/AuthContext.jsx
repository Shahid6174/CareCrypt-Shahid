import React, { createContext, useContext, useState, useEffect } from 'react'
import api from '../services/api'

const AuthContext = createContext(null)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

const ROLE_DASHBOARD_MAP = {
  admin: '/admin/dashboard',
  systemAdmin: '/admin/dashboard',
  hospitalAdmin: '/admin/dashboard',
  insuranceAdmin: '/admin/dashboard',
  patient: '/patient/dashboard',
  doctor: '/doctor/dashboard',
  insurance: '/insurance/dashboard',
  insuranceAgent: '/insurance/dashboard'
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const buildUserData = (roleHint, payload = {}) => {
    const normalizedRole = payload.role || roleHint
    const registeredOnChain = Boolean(payload.registeredOnChain)
    const approvalStatus = payload.approvalStatus || (registeredOnChain ? 'approved' : 'pending')
    const restricted = payload.restricted ?? (approvalStatus !== 'approved' || !registeredOnChain)
    const dashboardPath = ROLE_DASHBOARD_MAP[normalizedRole] || ROLE_DASHBOARD_MAP[roleHint] || '/login'

    return {
      userId: payload.userId,
      role: normalizedRole,
      name: payload.name,
      registeredOnChain,
      approvalStatus,
      restricted,
      dashboardPath,
      ...payload
    }
  }

  useEffect(() => {
    // Check for stored user session
    const initializeAuth = async () => {
      try {
        const storedUser = localStorage.getItem('user')
        const storedToken = localStorage.getItem('token')
        
        if (storedUser && storedToken) {
          try {
            const parsedUser = JSON.parse(storedUser)
            const userData = buildUserData(parsedUser.role, parsedUser)
            // Validate user data structure
            if (userData && userData.userId && userData.role) {
              setUser(userData)
              api.defaults.headers.common['x-userid'] = userData.userId
            } else {
              // Invalid user data, clear it
              localStorage.removeItem('user')
              localStorage.removeItem('token')
            }
          } catch (error) {
            console.error('Error parsing user data:', error)
            localStorage.removeItem('user')
            localStorage.removeItem('token')
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error)
      } finally {
        setLoading(false)
      }
    }
    
    initializeAuth()
  }, [])

  const login = async (role, email, password) => {
    try {
      let endpoint = ''
      switch (role) {
        case 'patient':
          endpoint = '/auth/loginPatient'
          break
        case 'doctor':
          endpoint = '/auth/loginDoctor'
          break
        case 'insurance':
          endpoint = '/auth/loginInsuranceAgent'
          break
        case 'hospitalAdmin':
          endpoint = '/auth/loginHospitalAdmin'
          break
        case 'insuranceAdmin':
          endpoint = '/auth/loginInsuranceAdmin'
          break
        case 'admin':
          // Admin login uses dedicated admin endpoint
          endpoint = '/auth/loginAdmin'
          break
        default:
          throw new Error('Invalid role')
      }

      const response = await api.post(endpoint, { email, password })
      
      // Handle needsRegistration response
      if (response.data.data?.needsRegistration) {
        return {
          success: false,
          needsRegistration: true,
          message: response.data.data.message || 'Please register first'
        }
      }

      // Handle needsChaincodeRegistration response
      if (response.data.data?.needsChaincodeRegistration) {
        const userData = buildUserData(role, {
          ...response.data.data,
          registeredOnChain: false
        })
        
        setUser(userData)
        localStorage.setItem('user', JSON.stringify(userData))
        localStorage.setItem('token', userData.userId)
        api.defaults.headers.common['x-userid'] = userData.userId
        
        return {
          success: true,
          needsChaincodeRegistration: true,
          userId: userData.userId,
          message: response.data.data.message || 'Registration pending admin approval',
          data: userData,
          pendingApproval: true
        }
      }

      // Successful login
      if (response.data.success && response.data.data) {
        const userData = buildUserData(role, response.data.data)
        
        setUser(userData)
        localStorage.setItem('user', JSON.stringify(userData))
        localStorage.setItem('token', userData.userId)
        api.defaults.headers.common['x-userid'] = userData.userId
        
        return { 
          success: true, 
          data: userData,
          pendingApproval: userData.approvalStatus !== 'approved'
        }
      }
      
      throw new Error(response.data.message || 'Login failed')
    } catch (error) {
      // Handle network errors and API errors
      const errorMessage = error.response?.data?.message || error.message || 'Login failed'
      return {
        success: false,
        message: errorMessage
      }
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('user')
    localStorage.removeItem('token')
    delete api.defaults.headers.common['x-userid']
  }

  const value = {
    user,
    login,
    logout,
    loading
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
