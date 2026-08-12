import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { getAttendance, createAttendance, deleteAttendance } from '../../api'

const STATUSES = ['Present', 'Absent', 'Late', 'On Leave']
const PERIODS = ['1', '2', '3', '4', '5', '6', '7', '8']

function Attendance() {
  const queryClient = useQueryClient()
  const [form, setForm] = useState({
    student: '',
    course: '',
    date: new Date().toISOString().slice(0, 10),
    period: '1',
    status: 'Present',
  })

  const { data, isLoading, error } = useQuery({
    queryKey: ['attendance'],
    queryFn: () => getAttendance({ limit: 20 }).then((r) => r.data),
  })

  const markMutation = useMutation({
    mutationFn: (payload) => createAttendance(payload),
    onSuccess: () => {
      toast.success('Attendance marked')
      queryClient.invalidateQueries({ queryKey: ['attendance'] })
      setForm((f) => ({ ...f, student: '', course: '' }))
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to mark attendance'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteAttendance(id),
    onSuccess: () => {
      toast.success('Record deleted')
      queryClient.invalidateQueries({ queryKey: ['attendance'] })
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to delete'),
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    markMutation.mutate(form)
  }

  const records = data?.data || []

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Attendance</h1>

      <form
        onSubmit={handleSubmit}
        className="bg-white p-5 rounded-lg shadow-sm grid grid-cols-2 md:grid-cols-5 gap-3"
      >
        <input
          className="border rounded px-3 py-2"
          placeholder="Roll number"
          value={form.student}
          onChange={(e) => setForm({ ...form, student: e.target.value })}
          required
        />
        <input
          className="border rounded px-3 py-2"
          placeholder="Course code"
          value={form.course}
          onChange={(e) => setForm({ ...form, course: e.target.value })}
          required
        />
        <input
          type="date"
          className="border rounded px-3 py-2"
          value={form.date}
          onChange={(e) => setForm({ ...form, date: e.target.value })}
        />
        <select
          className="border rounded px-3 py-2"
          value={form.period}
          onChange={(e) => setForm({ ...form, period: e.target.value })}
        >
          {PERIODS.map((p) => (
            <option key={p} value={p}>
              Period {p}
            </option>
          ))}
        </select>
        <select
          className="border rounded px-3 py-2"
          value={form.status}
          onChange={(e) => setForm({ ...form, status: e.target.value })}
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <button className="col-span-2 md:col-span-1 bg-blue-600 text-white rounded px-4 py-2 hover:bg-blue-700">
          Mark
        </button>
      </form>

      {isLoading && <p className="text-gray-500">Loading attendance...</p>}
      {error && <p className="text-red-500">Failed to load: {error.message}</p>}

      {!isLoading && !error && (
        <div className="bg-white rounded-lg shadow-sm overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-600">
              <tr>
                <th className="px-4 py-3">Student</th>
                <th className="px-4 py-3">Roll</th>
                <th className="px-4 py-3">Course</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Period</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {records.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-gray-400">
                    No attendance records yet
                  </td>
                </tr>
              )}
              {records.map((r) => (
                <tr key={r.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-2">{r.student?.name || '—'}</td>
                  <td className="px-4 py-2">{r.student?.rollNumber || '—'}</td>
                  <td className="px-4 py-2">{r.course?.code || '—'}</td>
                  <td className="px-4 py-2">{new Date(r.date).toLocaleDateString()}</td>
                  <td className="px-4 py-2">{r.period}</td>
                  <td className="px-4 py-2">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        r.status === 'Present'
                          ? 'bg-green-100 text-green-700'
                          : r.status === 'Absent'
                          ? 'bg-red-100 text-red-700'
                          : r.status === 'Late'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {r.status}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <button
                      onClick={() => deleteMutation.mutate(r.id)}
                      className="text-red-600 hover:text-red-700 text-xs"
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
    </div>
  )
}

export default Attendance
