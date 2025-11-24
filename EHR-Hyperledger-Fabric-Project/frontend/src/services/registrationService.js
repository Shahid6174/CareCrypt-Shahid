import api from './api'

// Store registration requests locally (in a real app, this would be a backend endpoint)
const registrationRequests = JSON.parse(localStorage.getItem('registrationRequests') || '[]')

export const submitRegistrationRequest = (role, data) => {
  const request = {
    id: Date.now().toString(),
    role,
    data,
    status: 'pending',
    createdAt: new Date().toISOString()
  }
  
  registrationRequests.push(request)
  localStorage.setItem('registrationRequests', JSON.stringify(registrationRequests))
  
  return Promise.resolve({ success: true, data: request })
}

export const getRegistrationRequests = () => {
  return Promise.resolve({ success: true, data: registrationRequests })
}

export const approveRegistration = async (requestId, adminId) => {
  const requests = JSON.parse(localStorage.getItem('registrationRequests') || '[]')
  const request = requests.find(r => r.id === requestId)
  
  if (!request) {
    throw new Error('Registration request not found')
  }

  try {
    let endpoint = ''
    let payload = {}
    
    switch (request.role) {
      case 'patient':
        endpoint = '/auth/registerPatient'
        payload = {
          adminId,
          doctorId: request.data.doctorId,
          userId: request.data.userId,
          email: request.data.email,
          password: request.data.password,
          name: request.data.name,
          dob: request.data.dob,
          city: request.data.city
        }
        break
      case 'doctor':
        endpoint = '/auth/registerDoctor'
        payload = {
          adminId,
          doctorId: request.data.doctorId,
          email: request.data.email,
          password: request.data.password,
          hospitalId: request.data.hospitalId,
          name: request.data.name,
          city: request.data.city
        }
        // Set header for hospital admin
        api.defaults.headers.common['x-userid'] = request.data.hospitalId
        break
      case 'hospital':
        endpoint = '/auth/registerHospitalAdmin'
        payload = {
          adminId,
          userId: request.data.userId,
          hospitalId: request.data.hospitalId,
          name: request.data.name,
          address: request.data.address
        }
        api.defaults.headers.common['x-userid'] = adminId
        break
      case 'insurance':
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

    const response = await api.post(endpoint, payload)
    // After creating the user in MongoDB, trigger blockchain registration (complete registration)
    let createdUserId = response?.data?.data?.userId || payload.userId || request.data.userId || request.data.userId

    try {
      switch (request.role) {
        case 'patient':
          // complete patient registration (no requireUser middleware)
          await api.post('/auth/completePatientRegistration', { userId: createdUserId, adminId })
          break
        case 'doctor':
          // complete doctor registration; ensure header set to admin/hospital id
          api.defaults.headers.common['x-userid'] = request.data.hospitalId || adminId
          await api.post('/auth/completeDoctorRegistration', { userId: createdUserId, adminId: adminId })
          break
        case 'insurance':
          // complete insurance agent registration; ensure header set to insurance admin
          api.defaults.headers.common['x-userid'] = adminId
          await api.post('/auth/completeInsuranceAgentRegistration', { userId: createdUserId, adminId: adminId })
          break
        default:
          break
      }
    } catch (completeErr) {
      // If chain registration failed, mark request as failed and persist
      const failedRequests = requests.map(r =>
        r.id === requestId ? { ...r, status: 'failed', error: completeErr.message } : r
      )
      localStorage.setItem('registrationRequests', JSON.stringify(failedRequests))
      throw completeErr
    }
    
    // Update request status
    const updatedRequests = requests.map(r => 
      r.id === requestId ? { ...r, status: 'approved', approvedAt: new Date().toISOString() } : r
    )
    localStorage.setItem('registrationRequests', JSON.stringify(updatedRequests))
    
    return { success: true, data: response.data }
  } catch (error) {
    // Update request status to failed
    const updatedRequests = requests.map(r => 
      r.id === requestId ? { ...r, status: 'failed', error: error.message } : r
    )
    localStorage.setItem('registrationRequests', JSON.stringify(updatedRequests))
    
    throw error
  }
}

export const rejectRegistration = (requestId) => {
  const requests = JSON.parse(localStorage.getItem('registrationRequests') || '[]')
  const updatedRequests = requests.map(r => 
    r.id === requestId ? { ...r, status: 'rejected', rejectedAt: new Date().toISOString() } : r
  )
  localStorage.setItem('registrationRequests', JSON.stringify(updatedRequests))
  
  return Promise.resolve({ success: true })
}

