import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { getResults, createResult, deleteResult, exportResults } from '../../api'

function Results() {
  const queryClient = useQueryClient()
  const [form, setForm] = useState({
    student: '',
    course: '',
    examType: 'Midterm',
    score: '',
    grade: '',
    semester: 1,
  })

  const { data, isLoading, error } = useQuery({
    queryKey: ['results'],
    queryFn: () => getResults({ limit: 20 }).then((r) => r.data),
  })

  const createMutation = useMutation({
    mutationFn: (payload) => createResult(payload),
    onSuccess: () => {
      toast.success('Result recorded')
      queryClient.invalidateQueries({ queryKey: ['results'] })
      setForm({ student: '', course: '', examType: 'Midterm', score: '', grade: '', semester: 1 })
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to record result'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteResult(id),
    onSuccess: () => {
      toast.success('Result deleted')
      queryClient.invalidateQueries({ queryKey: ['results'] })
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to delete result'),
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    createMutation.mutate({ ...form, score: Number(form.score), semester: Number(form.semester) })
  }

  const handleExport = async () => {
    try {
      await exportResults()
      toast.success('Results exported')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Export failed')
    }
  }

  const results = data?.data || []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Results</h1>
        <button
          onClick={handleExport}
          className="bg-gray-100 hover:bg-gray-200 text-gray-700 rounded px-4 py-2 text-sm"
        >
          Export CSV
        </button>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-5 rounded-lg shadow-sm grid grid-cols-2 md:grid-cols-4 gap-3">
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
          type="number"
          min="0"
          className="border rounded px-3 py-2"
          placeholder="Score"
          value={form.score}
          onChange={(e) => setForm({ ...form, score: e.target.value })}
          required
        />
        <input
          className="border rounded px-3 py-2"
          placeholder="Grade (optional)"
          value={form.grade}
          onChange={(e) => setForm({ ...form, grade: e.target.value })}
        />
        <button className="bg-blue-600 text-white rounded px-4 py-2 hover:bg-blue-700">Record</button>
      </form>

      {isLoading && <p className="text-gray-500">Loading results...</p>}
      {error && <p className="text-red-500">Failed to load: {error.message}</p>}

      {!isLoading && !error && (
        <div className="bg-white rounded-lg shadow-sm overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-600">
              <tr>
                <th className="px-4 py-3">Student</th>
                <th className="px-4 py-3">Course</th>
                <th className="px-4 py-3">Semester</th>
                <th className="px-4 py-3">Score</th>
                <th className="px-4 py-3">Grade</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {results.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-gray-400">
                    No results recorded yet
                  </td>
                </tr>
              )}
              {results.map((r) => (
                <tr key={r.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-2">{r.student?.name || r.student?.rollNumber || '—'}</td>
                  <td className="px-4 py-2">{r.course?.code || r.course || '—'}</td>
                  <td className="px-4 py-2">{r.semester}</td>
                  <td className="px-4 py-2">{r.score}</td>
                  <td className="px-4 py-2">{r.grade || '—'}</td>
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

export default Results
