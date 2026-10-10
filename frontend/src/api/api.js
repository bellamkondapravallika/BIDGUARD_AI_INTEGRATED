const API_BASE = '/api/v1'

export const getToken = () => localStorage.getItem('bidguard_token')
export const setToken = (token) => localStorage.setItem('bidguard_token', token)
export const removeToken = () => localStorage.removeItem('bidguard_token')

const request = async (path, options = {}) => {
  const token = getToken()
  const headers = { ...(options.headers || {}) }

  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`
  }

  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json'
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  })

  if (res.status === 401) {
    // Only redirect if this wasn't an explicit login attempt
    if (!path.startsWith('/auth/login') && !path.startsWith('/auth/register')) {
      removeToken()
      if (window.location.pathname !== '/login' && window.location.pathname !== '/signup') {
        window.location.href = '/login'
      }
    }
  }

  let data = {}
  try {
    const text = await res.text()
    data = text ? JSON.parse(text) : {}
  } catch {
    data = {}
  }

  if (!res.ok) {
    const errorMsg = data.detail || (typeof data.message === 'string' ? data.message : `Request failed (${res.status})`)
    throw new Error(errorMsg)
  }

  return data
}

// Authentication
export const login = (email, password) =>
  request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) })

export const signup = (name, organization, email, password, confirmPassword) =>
  request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      full_name: name,
      organization,
      email,
      password,
      confirm_password: confirmPassword || password,
    }),
  })

export const getMe = () => request('/auth/me')
export const logout = () => request('/auth/logout', { method: 'POST' }).catch(() => ({}))
export const forgotPassword = (email) =>
  request('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) })
export const resetPassword = (token, new_password, confirm_password) =>
  request('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ token, new_password, confirm_password }),
  })

// Profile & Settings
export const getProfile = () => request('/profile')
export const updateProfile = (payload) =>
  request('/profile', { method: 'PATCH', body: JSON.stringify(payload) })
export const changePassword = (current_password, new_password, confirm_password) =>
  request('/profile/change-password', {
    method: 'POST',
    body: JSON.stringify({ current_password, new_password, confirm_password }),
  })
export const getSettings = () => request('/settings')
export const updateSettings = (payload) =>
  request('/settings', { method: 'PATCH', body: JSON.stringify(payload) })

// Dashboard
export const getDashboardStats = () => request('/dashboard/summary')
export const getComplianceTrends = () => request('/dashboard/compliance-trends')
export const getRiskDistribution = () => request('/dashboard/risk-distribution')

// Bid Cases
export const getBidCases = (params = {}) => {
  const query = new URLSearchParams()
  if (params.search) query.append('search', params.search)
  if (params.status) query.append('status', params.status)
  if (params.category) query.append('category', params.category)
  if (params.risk) query.append('risk', params.risk)
  const qs = query.toString() ? `?${query.toString()}` : ''
  return request(`/bids${qs}`)
}

export const createBidCase = (payload) =>
  request('/bids', { method: 'POST', body: JSON.stringify(payload) })

export const getBidDetail = (bidId) => request(`/bids/${bidId}`)
export const updateBidCase = (bidId, payload) =>
  request(`/bids/${bidId}`, { method: 'PATCH', body: JSON.stringify(payload) })
export const deleteBidCase = (bidId) =>
  request(`/bids/${bidId}`, { method: 'DELETE' })

// Documents
export const uploadBidDocuments = (bidId, formData) =>
  request(`/bids/${bidId}/documents`, { method: 'POST', body: formData })

export const getBidDocuments = (bidId) => request(`/bids/${bidId}/documents`)
export const deleteDocument = (docId) =>
  request(`/documents/${docId}`, { method: 'DELETE' })
export const uploadDocuments = (files) =>
  request('/documents/upload', { method: 'POST', body: JSON.stringify({ files }) })

// Analysis & Compliance
export const analyzeBid = (bidId) =>
  bidId ? request(`/bids/${bidId}/analyze`, { method: 'POST' }) : request('/analysis/run', { method: 'POST' })

export const getBidAnalysis = (bidId) => request(`/bids/${bidId}/analysis`)
export const getComplianceMatrix = (caseId) =>
  request(caseId ? `/compliance?case_id=${encodeURIComponent(caseId)}` : '/compliance')

// Risks
export const getRiskAlerts = (params = {}) => {
  const query = new URLSearchParams()
  if (params.severity) query.append('severity', params.severity)
  if (params.status) query.append('status', params.status)
  if (params.case_id) query.append('case_id', params.case_id)
  const qs = query.toString() ? `?${query.toString()}` : ''
  return request(`/risks${qs}`)
}

export const updateRiskStatus = (riskId, payload) =>
  request(`/risks/${riskId}`, { method: 'PATCH', body: JSON.stringify(payload) })

// Evidence
export const getEvidence = (caseId) =>
  request(caseId ? `/evidence?case_id=${encodeURIComponent(caseId)}` : '/evidence')

export const getEvidenceDetail = (evidenceId) => request(`/evidence/${evidenceId}`)

// Reports
export const generateReport = (bidId, payload = { report_type: 'full_compliance', file_format: 'pdf' }) =>
  request(`/bids/${bidId}/reports`, { method: 'POST', body: JSON.stringify(payload) })

export const getReports = (caseId) =>
  request(caseId ? `/reports?case_id=${encodeURIComponent(caseId)}` : '/reports')

// Audit Trail
export const getAuditTrail = (params = {}) => {
  const query = new URLSearchParams()
  if (params.entity_type) query.append('entity_type', params.entity_type)
  if (params.action) query.append('action', params.action)
  const qs = query.toString() ? `?${query.toString()}` : ''
  return request(`/audit-logs${qs}`)
}

// Notifications
export const getNotifications = () => request('/notifications')
export const markNotificationRead = (id) =>
  request(`/notifications/${id}/read`, { method: 'PATCH' })
export const markAllNotificationsRead = () =>
  request('/notifications/read-all', { method: 'POST' })

// Demo & Showcase Seeding
export const seedDemoShowcase = () => request('/demo/seed-showcase', { method: 'POST' })
