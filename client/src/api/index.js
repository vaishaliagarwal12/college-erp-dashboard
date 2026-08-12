import api from './client'

// Auth
export const loginApi = (credentials) => api.post('/auth/login', credentials)
export const forgotPassword = (payload) => api.post('/auth/forgot-password', payload)
export const resetPassword = (payload) => api.post('/auth/reset-password', payload)
export const verifyEmail = (payload) => api.post('/auth/verify-email', payload)
export const resendVerification = (payload) => api.post('/auth/resend-verification', payload)
export const changePassword = (payload) => api.post('/auth/change-password', payload)

// Dashboard
export const getDashboardStats = async () => {
  const { data } = await api.get('/dashboard/stats')
  return data
}
export const getDashboardAnalytics = async () => {
  const { data } = await api.get('/dashboard/analytics')
  return data
}

// Attendance
export const getAttendance = (params) => api.get('/attendance', { params })
export const getAttendanceSummary = (params) => api.get('/attendance/summary', { params })
export const createAttendance = (payload) => api.post('/attendance', payload)
export const bulkCreateAttendance = (records) => api.post('/attendance/bulk', { records })
export const deleteAttendance = (id) => api.delete(`/attendance/${id}`)

// Exams
export const getExams = (params) => api.get('/exams', { params })
export const createExam = (payload) => api.post('/exams', payload)
export const updateExam = (id, payload) => api.put(`/exams/${id}`, payload)
export const deleteExam = (id) => api.delete(`/exams/${id}`)

// Results
export const getResults = (params) => api.get('/results', { params })
export const createResult = (payload) => api.post('/results', payload)
export const updateResult = (id, payload) => api.put(`/results/${id}`, payload)
export const deleteResult = (id) => api.delete(`/results/${id}`)
export const getStudentTranscript = (studentId) => api.get(`/results/transcript/${studentId}`)

// Timetable
export const getTimetable = (params) => api.get('/timetable', { params })
export const createTimetable = (payload) => api.post('/timetable', payload)
export const deleteTimetable = (id) => api.delete(`/timetable/${id}`)

// Files
export const uploadFiles = (formData) =>
  api.post('/files/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
export const getFiles = (params) => api.get('/files', { params })
export const getFileDownloadUrl = (id) => `/api/v1/files/${id}`
export const deleteFile = (id) => api.delete(`/files/${id}`)

// Fees
export const getFees = (params) => api.get('/fees', { params })
export const getFeeSummary = () => api.get('/fees/summary')
export const createFee = (payload) => api.post('/fees', payload)
export const recordFeePayment = (id, payload) => api.post(`/fees/${id}/pay`, payload)
export const deleteFee = (id) => api.delete(`/fees/${id}`)

// Notifications
export const getNotifications = (params) => api.get('/notifications', { params })
export const getUnreadCount = () => api.get('/notifications/unread-count')
export const createNotification = (payload) => api.post('/notifications', payload)
export const markNotificationRead = (id) => api.patch(`/notifications/${id}/read`)
export const markAllNotificationsRead = () => api.patch('/notifications/read-all')
export const deleteNotification = (id) => api.delete(`/notifications/${id}`)

// Admissions
export const getAdmissions = (params) => api.get('/admissions', { params })
export const getMyAdmissions = () => api.get('/admissions/mine')
export const createAdmission = (payload) => api.post('/admissions', payload)
export const approveAdmission = (id) => api.post(`/admissions/${id}/approve`)
export const rejectAdmission = (id, payload) => api.post(`/admissions/${id}/reject`, payload)
export const deleteAdmission = (id) => api.delete(`/admissions/${id}`)

// Curriculum / Syllabus
export const getSyllabi = (params) => api.get('/curriculum', { params })
export const getSyllabusByCourse = (courseId) => api.get(`/curriculum/course/${courseId}`)
export const createSyllabus = (payload) => api.post('/curriculum', payload)
export const updateSyllabus = (id, payload) => api.put(`/curriculum/${id}`, payload)
export const deleteSyllabus = (id) => api.delete(`/curriculum/${id}`)

// Faculty workload
export const getWorkloads = (params) => api.get('/workload', { params })
export const getWorkloadSummary = (params) => api.get('/workload/summary', { params })
export const getFacultyWorkload = (facultyId) => api.get(`/workload/faculty/${facultyId}`)
export const createWorkload = (payload) => api.post('/workload', payload)
export const updateWorkload = (id, payload) => api.put(`/workload/${id}`, payload)
export const deleteWorkload = (id) => api.delete(`/workload/${id}`)

// Background jobs
export const getJobsHealth = () => api.get('/jobs/health')
export const runFeeReminders = (payload) => api.post('/jobs/fee-reminders', payload)
export const runReportJob = (type) => api.post(`/jobs/reports/${type}`)
export const sendEmailJob = (payload) => api.post('/jobs/email', payload)

// Exports
const downloadBlob = (blob, filename) => {
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  window.URL.revokeObjectURL(url)
}
export const exportStudents = async () => {
  const res = await api.get('/export/students', { responseType: 'blob' })
  downloadBlob(res.data, 'students.csv')
}
export const exportFaculty = async () => {
  const res = await api.get('/export/faculty', { responseType: 'blob' })
  downloadBlob(res.data, 'faculty.csv')
}
export const exportFees = async () => {
  const res = await api.get('/export/fees', { responseType: 'blob' })
  downloadBlob(res.data, 'fees.csv')
}
export const exportResults = async () => {
  const res = await api.get('/export/results', { responseType: 'blob' })
  downloadBlob(res.data, 'results.csv')
}

export default api
