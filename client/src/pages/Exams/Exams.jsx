import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { getExams, createExam, deleteExam } from '../../api'

const TYPES = ['Quiz', 'Midterm', 'Final', 'Practical', 'Assignment']

function Exams() {
  const queryClient = useQueryClient()
  const [form, setForm] = useState({
    examName: '',
    examType: 'Midterm',
    course: '',
    semester: 1,
    date: '',
    maxMarks: 100,
  })

  const { data, isLoading, error } = useQuery({
    queryKey: ['exams'],
    queryFn: () => getExams({ limit: 20 }).then((r) => r.data),
  })

  const createMutation = useMutation({
    mutationFn: (payload) => createExam(payload),
    onSuccess: () => {
      toast.success('Exam created')
      queryClient.invalidateQueries({ queryKey: ['exams'] })
      setForm({
        examName: '',
        examType: 'Midterm',
        course: '',
        semester: 1,
        date: '',
        maxMarks: 100,
      })
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to create exam'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteExam(id),
    onSuccess: () => {
      toast.success('Exam deleted')
      queryClient.invalidateQueries({ queryKey: ['exams'] })
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to delete exam'),
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    createMutation.mutate(form)
  }

  const exams = data?.data || []

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Exams</h1>

      <form onSubmit={handleSubmit} className="bg-white p-5 rounded-lg shadow-sm grid grid-cols-2 md:grid-cols-4 gap-3">
        <input
          className="border rounded px-3 py-2"
          placeholder="Exam name"
          value={form.examName}
          onChange={(e) => setForm({ ...form, examName: e.target.value })}
          required
        />
        <select
          className="border rounded px-3 py-2"
          value={form.examType}
          onChange={(e) => setForm({ ...form, examType: e.target.value })}
        >
          {TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <input
          className="border rounded px-3 py-2"
          placeholder="Course code"
          value={form.course}
          onChange={(e) => setForm({ ...form, course: e.target.value })}
          required
        />
        <input
          type="number"
          min="1"
          max="8"
          className="border rounded px-3 py-2"
          placeholder="Semester"
          value={form.semester}
          onChange={(e) => setForm({ ...form, semester: Number(e.target.value) })}
        />
        <input
          type="date"
          className="border rounded px-3 py-2"
          value={form.date}
          onChange={(e) => setForm({ ...form, date: e.target.value })}
        />
        <input
          type="number"
          min="1"
          className="border rounded px-3 py-2"
          placeholder="Max marks"
          value={form.maxMarks}
          onChange={(e) => setForm({ ...form, maxMarks: Number(e.target.value) })}
        />
        <button className="bg-blue-600 text-white rounded px-4 py-2 hover:bg-blue-700">Create</button>
      </form>

      {isLoading && <p className="text-gray-500">Loading exams...</p>}
      {error && <p className="text-red-500">Failed to load: {error.message}</p>}

      {!isLoading && !error && (
        <div className="bg-white rounded-lg shadow-sm overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-600">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Course</th>
                <th className="px-4 py-3">Semester</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Max Marks</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {exams.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-gray-400">
                    No exams scheduled yet
                  </td>
                </tr>
              )}
              {exams.map((ex) => (
                <tr key={ex.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-2">{ex.examName}</td>
                  <td className="px-4 py-2">{ex.examType}</td>
                  <td className="px-4 py-2">{ex.course?.code || ex.course || '—'}</td>
                  <td className="px-4 py-2">{ex.semester}</td>
                  <td className="px-4 py-2">
                    {ex.date ? new Date(ex.date).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-4 py-2">{ex.maxMarks}</td>
                  <td className="px-4 py-2">
                    <button
                      onClick={() => deleteMutation.mutate(ex.id)}
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

export default Exams
