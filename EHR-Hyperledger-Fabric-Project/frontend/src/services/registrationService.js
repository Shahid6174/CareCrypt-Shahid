import api from './api'

const STORAGE_KEY = 'registrationRequests'

const readRequests = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
  } catch (error) {
    console.warn('Unable to read registration requests:', error)
    return []
  }
}

const writeRequests = (requests) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(requests))
}

const updateRequestStatus = (requests, requestId, updater) => {
  const updatedRequests = requests.map((req) =>
    req.id === requestId ? { ...req, ...updater(req) } : req
  )
  writeRequests(updatedRequests)
  return updatedRequests
}

export const submitRegistrationRequest = (role, data = {}) => {
  const requests = readRequests()
  const request = {
    id: Date.now().toString(),
    role,
    data,
    status: 'pending',
    createdAt: new Date().toISOString()
  }

  requests.push(request)
  writeRequests(requests)

  return Promise.resolve({ success: true, data: request })
}

export const getRegistrationRequests = () => {
  return Promise.resolve({ success: true, data: readRequests() })
}

const completeSelfRegistration = async (request, adminId) => {
  if (!request.data?.userId) {
    throw new Error('Missing userId for approval')
  }
  const normalizedRole = request.role === 'insuranceAgent' ? 'insurance' : request.role
  const effectiveAdminId = request.data?.adminId || adminId
  let response
  const originalHeader = api.defaults.headers.common['x-userid']
  api.defaults.headers.common['x-userid'] = effectiveAdminId

  try {
    switch (normalizedRole) {
      case 'patient':
        response = await api.post('/auth/completePatientRegistration', {
          userId: request.data.userId,
          adminId: effectiveAdminId
        })
        break
      case 'doctor':
        response = await api.post('/auth/completeDoctorRegistration', {
          userId: request.data.userId,
          adminId: effectiveAdminId
        })
        break
      case 'insurance':
        response = await api.post('/auth/completeInsuranceAgentRegistration', {
          userId: request.data.userId,
          adminId: effectiveAdminId
        })
        break
      default:
        response = null
        break
    }
  } finally {
    if (originalHeader === undefined) {
      delete api.defaults.headers.common['x-userid']
    } else {
      api.defaults.headers.common['x-userid'] = originalHeader
    }
  }

  return response
}

const legacyRegisterAndComplete = async (request, adminId) => {
  let endpoint = ''
  let payload = {}

  switch (request.role) {
    case 'hospital':
      endpoint = '/auth/registerHospitalAdmin'
      payload = {
        adminId,
        userId: request.data.userId,
        hospitalId: request.data.hospitalId,
        name: request.data.name,
        address: request.data.address
      }
      break
    case 'insuranceAdmin':
      endpoint = '/auth/registerInsuranceAdmin'
      payload = {
        adminId,
        userId: request.data.userId,
        email: request.data.email,
        password: request.data.password,
        insuranceId: request.data.insuranceId,
        name: request.data.name,
        address: request.data.address
      }
      break
    default:
      throw new Error('Invalid role')
  }

  return await api.post(endpoint, payload)
}

export const approveRegistration = async (requestId, adminId) => {
  const requests = readRequests()
  const request = requests.find((r) => r.id === requestId)

  if (!request) {
    throw new Error('Registration request not found')
  }

  const normalizedRole = request.role === 'insuranceAgent' ? 'insurance' : request.role

  try {
    let response

    if (['patient', 'doctor', 'insurance'].includes(normalizedRole)) {
      response = await completeSelfRegistration(request, adminId)
    } else {
      response = await legacyRegisterAndComplete(request, adminId)
    }

    updateRequestStatus(requests, requestId, () => ({
      status: 'approved',
      approvedAt: new Date().toISOString(),
      error: undefined
    }))

    return { success: true, data: response?.data || null }
  } catch (error) {
    updateRequestStatus(requests, requestId, () => ({
      status: 'failed',
      error: error.message
    }))
    throw error
  }
}

export const rejectRegistration = (requestId) => {
  const requests = readRequests()
  updateRequestStatus(requests, requestId, () => ({
    status: 'rejected',
    rejectedAt: new Date().toISOString()
  }))

  return Promise.resolve({ success: true })
}
