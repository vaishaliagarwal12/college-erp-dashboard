import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import {
  getAdmissions,
  getMyAdmissions,
  createAdmission,
  approveAdmission,
  rejectAdmission,
  deleteAdmission,
} from '../../api'
import { useAuth } from '../../context/AuthContext'

const STATUS_STYLES = {
  Pending: 'bg-yellow-100 text-yellow-700',
  Approved: 'bg-green-100 text-green-700',
  Rejected: 'bg-red-100 text-red-700',
}

const emptyForm = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  gender: 'Male',
  course: '',
  department: '',
  semester: 1,
  batch: new Date().getFullYear(),
  guardianName: '',
  guardianPhone: '',
  address: '',
}

function Admissions() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const isStudent = user?.role === 'Student'
  const [form, setForm] = useState(emptyForm)
  const [statusFilter, setStatusFilter] = useState('')
  const [rejecting, setRejecting] = useState(null)
  const [remarks, setRemarks] = useState('')

  const { data, isLoading, error } = useQuery({
    queryKey: isStudent ? ['myAdmissions'] : ['admissions', statusFilter],
    queryFn: () =>
      (isStudent ? getMyAdmissions() : getAdmissions({ limit: 50, status: statusFilter || undefined })).then(
        (r) => r.data
      ),
  })

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['admissions'] })
    queryClient.invalidateQueries({ queryKey: ['myAdmissions'] })
  }

  const applyMutation = useMutation({
    mutationFn: (payload) => createAdmission({ ...payload, semester: Number(payload.semester), batch: Number(payload.batch) }),
    onSuccess: () => {
      toast.success('Application submitted')
      setForm(emptyForm)
      invalidate()
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to submit application'),
  })

  const approveMutation = useMutation({
    mutationFn: (id) => approveAdmission(id),
    onSuccess: (res) => {
      const info = res.data?.data
      const extra = info?.rollNumber ? ` (Roll no: ${info.rollNumber})` : ''
      toast.success(`Application approved${extra}`)
      invalidate()
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to approve'),
  })

  const rejectMutation = useMutation({
    mutationFn: ({ id, payload }) => rejectAdmission(id, payload),
    onSuccess: () => {
      toast.success('Application rejected')
      setRejecting(null)
      setRemarks('')
      invalidate()
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to reject'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteAdmission(id),
    onSuccess: () => {
      toast.success('Application deleted')
      invalidate()
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to delete'),
  })

  const handleApply = (e) => {
    e.preventDefault()
    applyMutation.mutate(form)
  }

  const handleReject = (e) => {
    e.preventDefault()
    if (!rejecting) return
    rejectMutation.mutate({ id: rejecting, payload: { remarks } })
  }

  const admissions = data?.data || []

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Admissions</h1>

      {isStudent ? (
        <>
          <form onSubmit={handleApply} className="bg-white p-5 rounded-lg shadow-sm space-y-3">
            <h2 className="font-semibold">Apply for admission</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <input
                className="border rounded px-3 py-2"
                placeholder="First name"
                value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                required
              />
              <input
                className="border rounded px-3 py-2"
                placeholder="Last name"
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                required
              />
              <input
                type="email"
                className="border rounded px-3 py-2"
                placeholder="Email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
              <input
                className="border rounded px-3 py-2"
                placeholder="Phone"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                required
              />
              <select
                className="border rounded px-3 py-2"
                value={form.gender}
                onChange={(e) => setForm({ ...form, gender: e.target.value })}
              >
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
              </select>
              <input
                className="border rounded px-3 py-2"
                placeholder="Course ID"
                value={form.course}
                onChange={(e) => setForm({ ...form, course: e.target.value })}
                required
              />
              <input
                className="border rounded px-3 py-2"
                placeholder="Department ID"
                value={form.department}
                onChange={(e) => setForm({ ...form, department: e.target.value })}
                required
              />
              <input
                type="number"
                min="1"
                max="12"
                className="border rounded px-3 py-2"
                placeholder="Semester"
                value={form.semester}
                onChange={(e) => setForm({ ...form, semester: Number(e.target.value) })}
              />
              <input
                type="number"
                className="border rounded px-3 py-2"
                placeholder="Batch year"
                value={form.batch}
                onChange={(e) => setForm({ ...form, batch: Number(e.target.value) })}
              />
              <input
                className="border rounded px-3 py-2"
                placeholder="Guardian name"
                value={form.guardianName}
                onChange={(e) => setForm({ ...form, guardianName: e.target.value })}
              />
              <input
                className="border rounded px-3 py-2"
                placeholder="Guardian phone"
                value={form.guardianPhone}
                onChange={(e) => setForm({ ...form, guardianPhone: e.target.value })}
              />
            </div>
            <button className="bg-blue-600 text-white rounded px-4 py-2 hover:bg-blue-700">
              Submit Application
            </button>
          </form>

          <div className="space-y-3">
            <h2 className="font-semibold">My applications</h2>
            {isLoading && <p className="text-gray-500">Loading...</p>}
            {!isLoading && admissions.length === 0 && (
              <p className="text-gray-400 text-center py-6">No applications yet</p>
            )}
            {admissions.map((a) => (
              <div key={a.id} className="bg-white rounded-lg shadow-sm p-4 flex items-center gap-3">
                <div className="flex-1">
                  <p className="font-medium">{a.name}</p>
                  <p className="text-sm text-gray-600">
                    {a.course?.name || 'Course'} — Sem {a.semester} · Batch {a.batch}
                  </p>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[a.status] || ''}`}>
                  {a.status}
                </span>
              </div>
            ))}
          </div>
        </>
      ) : (
        <>
          <div className="flex items-center gap-3">
            <select
              className="border rounded px-3 py-2"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All statuses</option>
              <option>Pending</option>
              <option>Approved</option>
              <option>Rejected</option>
            </select>
          </div>

          {isLoading && <p className="text-gray-500">Loading applications...</p>}
          {error && <p className="text-red-500">Failed to load: {error.message}</p>}

          {!isLoading && !error && (
            <div className="bg-white rounded-lg shadow-sm overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-left text-gray-600">
                  <tr>
                    <th className="px-4 py-3">Applicant</th>
                    <th className="px-4 py-3">Course</th>
                    <th className="px-4 py-3">Dept</th>
                    <th className="px-4 py-3">Batch</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {admissions.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-6 text-center text-gray-400">
                        No applications
                      </td>
                    </tr>
                  )}
                  {admissions.map((a) => (
                    <tr key={a.id} className="border-t hover:bg-gray-50">
                      <td className="px-4 py-2">
                        <p className="font-medium">{a.name}</p>
                        <p className="text-xs text-gray-500">{a.email}</p>
                      </td>
                      <td className="px-4 py-2">{a.course?.name || '—'}</td>
                      <td className="px-4 py-2">{a.department?.name || '—'}</td>
                      <td className="px-4 py-2">{a.batch}</td>
                      <td className="px-4 py-2">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[a.status] || ''}`}>
                          {a.status}
                        </span>
                        {a.admissionNumber && (
                          <p className="text-xs text-gray-400 mt-1">{a.admissionNumber}</p>
                        )}
                      </td>
                      <td className="px-4 py-2 flex gap-3">
                        {a.status === 'Pending' && (
                          <>
                            <button
                              onClick={() => approveMutation.mutate(a.id)}
                              className="text-green-600 hover:text-green-700 text-xs"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => setRejecting(a.id)}
                              className="text-red-600 hover:text-red-700 text-xs"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => deleteMutation.mutate(a.id)}
                          className="text-gray-500 hover:text-red-600 text-xs"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {rejecting && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4">
          <form onSubmit={handleReject} className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md space-y-3">
            <h2 className="text-lg font-semibold">Reject application</h2>
            <textarea
              className="border rounded px-3 py-2 w-full"
              rows={3}
              placeholder="Reason (optional)"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
            />
            <div className="flex gap-3 justify-end">
              <button type="button" className="px-4 py-2 text-gray-600" onClick={() => setRejecting(null)}>
                Cancel
              </button>
              <button className="bg-red-600 text-white rounded px-4 py-2 hover:bg-red-700">
                Reject
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

export default Admissions
