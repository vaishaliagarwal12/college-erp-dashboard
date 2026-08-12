import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import {
  getWorkloads,
  getWorkloadSummary,
  createWorkload,
  deleteWorkload,
} from '../../api'
const ROLE_STYLES = {
  Primary: 'bg-blue-100 text-blue-700',
  Secondary: 'bg-purple-100 text-purple-700',
}

const emptyForm = {
  faculty: '',
  course: '',
  department: '',
  semester: 1,
  academicYear: '',
  section: '',
  teachingHoursPerWeek: 4,
  role: 'Primary',
}

function Workload() {
  const queryClient = useQueryClient()
  const [form, setForm] = useState(emptyForm)

  const { data: listData, isLoading } = useQuery({
    queryKey: ['workloads'],
    queryFn: () => getWorkloads({ limit: 50 }).then((r) => r.data),
  })

  const { data: summaryData } = useQuery({
    queryKey: ['workloadSummary'],
    queryFn: () => getWorkloadSummary().then((r) => r.data),
  })

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['workloads'] })
    queryClient.invalidateQueries({ queryKey: ['workloadSummary'] })
  }

  const createMutation = useMutation({
    mutationFn: (payload) => createWorkload({ ...payload, semester: Number(payload.semester), teachingHoursPerWeek: Number(payload.teachingHoursPerWeek) }),
    onSuccess: () => {
      toast.success('Allocation created')
      setForm(emptyForm)
      invalidate()
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to create allocation'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteWorkload(id),
    onSuccess: () => {
      toast.success('Allocation removed')
      invalidate()
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to remove allocation'),
  })

  const handleCreate = (e) => {
    e.preventDefault()
    createMutation.mutate(form)
  }

  const allocations = listData?.data || []
  const summary = summaryData?.data || {}
  const totalHours = allocations.reduce((sum, a) => sum + (a.teachingHoursPerWeek || 0), 0)
  const byFaculty = summary.byFaculty || []

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Faculty Workload</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-4">
          <p className="text-sm text-gray-500">Allocations</p>
          <p className="text-2xl font-bold">{allocations.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <p className="text-sm text-gray-500">Weekly hours</p>
          <p className="text-2xl font-bold">{totalHours}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <p className="text-sm text-gray-500">Faculties assigned</p>
          <p className="text-2xl font-bold">{byFaculty.length}</p>
        </div>
      </div>

      <form onSubmit={handleCreate} className="bg-white p-5 rounded-lg shadow-sm space-y-3">
        <h2 className="font-semibold">Allocate teaching load</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <input
            className="border rounded px-3 py-2"
            placeholder="Faculty ID"
            value={form.faculty}
            onChange={(e) => setForm({ ...form, faculty: e.target.value })}
            required
          />
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
            className="border rounded px-3 py-2"
            placeholder="Academic year (e.g. 2026-2027)"
            value={form.academicYear}
            onChange={(e) => setForm({ ...form, academicYear: e.target.value })}
            required
          />
          <input
            className="border rounded px-3 py-2"
            placeholder="Section (e.g. A)"
            value={form.section}
            onChange={(e) => setForm({ ...form, section: e.target.value })}
            required
          />
          <input
            type="number"
            min="0"
            className="border rounded px-3 py-2"
            placeholder="Hours per week"
            value={form.teachingHoursPerWeek}
            onChange={(e) => setForm({ ...form, teachingHoursPerWeek: e.target.value })}
          />
          <select
            className="border rounded px-3 py-2"
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
          >
            <option>Primary</option>
            <option>Secondary</option>
          </select>
        </div>
        <button className="bg-blue-600 text-white rounded px-4 py-2 hover:bg-blue-700">
          Create allocation
        </button>
      </form>

      {byFaculty.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-600">
              <tr>
                <th className="px-4 py-3">Faculty</th>
                <th className="px-4 py-3">Employee ID</th>
                <th className="px-4 py-3">Department</th>
                <th className="px-4 py-3">Courses</th>
                <th className="px-4 py-3">Hours / week</th>
              </tr>
            </thead>
            <tbody>
              {byFaculty.map((f) => (
                <tr key={f.facultyId} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-2 font-medium">{f.facultyName}</td>
                  <td className="px-4 py-2">{f.employeeId}</td>
                  <td className="px-4 py-2">{f.departmentName}</td>
                  <td className="px-4 py-2">{f.courses}</td>
                  <td className="px-4 py-2">{f.totalHours}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-600">
            <tr>
              <th className="px-4 py-3">Faculty</th>
              <th className="px-4 py-3">Course</th>
              <th className="px-4 py-3">Dept</th>
              <th className="px-4 py-3">Term</th>
              <th className="px-4 py-3">Section</th>
              <th className="px-4 py-3">Hours</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-center text-gray-400">
                  Loading allocations...
                </td>
              </tr>
            )}
            {!isLoading && allocations.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-center text-gray-400">
                  No allocations yet
                </td>
              </tr>
            )}
            {allocations.map((a) => (
              <tr key={a.id} className="border-t hover:bg-gray-50">
                <td className="px-4 py-2">
                  <p className="font-medium">{a.faculty?.name || '—'}</p>
                  <p className="text-xs text-gray-500">{a.faculty?.employeeId || ''}</p>
                </td>
                <td className="px-4 py-2">
                  {a.course?.courseName || '—'}
                  <p className="text-xs text-gray-500">{a.course?.courseCode || ''}</p>
                </td>
                <td className="px-4 py-2">{a.department?.name || '—'}</td>
                <td className="px-4 py-2">
                  Sem {a.semester} · {a.academicYear}
                </td>
                <td className="px-4 py-2">{a.section}</td>
                <td className="px-4 py-2">{a.teachingHoursPerWeek}</td>
                <td className="px-4 py-2">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_STYLES[a.role] || ''}`}>
                    {a.role}
                  </span>
                </td>
                <td className="px-4 py-2">
                  <button
                    onClick={() => deleteMutation.mutate(a.id)}
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
    </div>
  )
}

export default Workload
