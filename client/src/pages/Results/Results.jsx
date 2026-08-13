import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { getResults, getExams, createResult, deleteResult, exportResults } from '../../api'

function Results() {
  const queryClient = useQueryClient()
  const [form, setForm] = useState({
    student: '',
    exam: '',
    marksObtained: '',
    maxMarks: '',
    grade: '',
  })

  const { data, isLoading, error } = useQuery({
    queryKey: ['results'],
    queryFn: () => getResults({ limit: 20 }).then((r) => r.data),
  })

  const { data: examsData } = useQuery({
    queryKey: ['exams-for-results'],
    queryFn: () => getExams({ limit: 100 }).then((r) => r.data),
  })

  const createMutation = useMutation({
    mutationFn: (payload) => createResult(payload),
    onSuccess: () => {
      toast.success('Result recorded')
      queryClient.invalidateQueries({ queryKey: ['results'] })
      setForm({ student: '', exam: '', marksObtained: '', maxMarks: '', grade: '' })
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
    createMutation.mutate({
      student: form.student,
      exam: form.exam,
      marksObtained: Number(form.marksObtained),
      ...(form.maxMarks !== '' ? { maxMarks: Number(form.maxMarks) } : {}),
      ...(form.grade.trim() ? { grade: form.grade.trim() } : {}),
    })
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
  const exams = examsData?.data || []

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
        <select
          className="border rounded px-3 py-2"
          value={form.exam}
          onChange={(e) => setForm({ ...form, exam: e.target.value })}
          required
        >
          <option value="">Select exam…</option>
          {exams.map((ex) => (
            <option key={ex.id} value={ex.name || ex.id}>
              {ex.name} — {ex.course?.code || 'Course'} (Sem {ex.semester})
            </option>
          ))}
        </select>
        <input
          type="number"
          min="0"
          className="border rounded px-3 py-2"
          placeholder="Marks obtained"
          value={form.marksObtained}
          onChange={(e) => setForm({ ...form, marksObtained: e.target.value })}
          required
        />
        <input
          type="number"
          min="1"
          className="border rounded px-3 py-2"
          placeholder="Max marks (optional)"
          value={form.maxMarks}
          onChange={(e) => setForm({ ...form, maxMarks: e.target.value })}
        />
        <button className="bg-blue-600 text-white rounded px-4 py-2 hover:bg-blue-700">Record</button>
      </form>

      {exams.length === 0 && (
        <p className="text-sm text-amber-600 bg-amber-50 rounded px-3 py-2">
          No exams available yet — create an exam in the Exams page before recording results.
        </p>
      )}

      {isLoading && <p className="text-gray-500">Loading results...</p>}
      {error && <p className="text-red-500">Failed to load: {error.message}</p>}

      {!isLoading && !error && (
        <div className="bg-white rounded-lg shadow-sm overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-600">
              <tr>
                <th className="px-4 py-3">Student</th>
                <th className="px-4 py-3">Course</th>
                <th className="px-4 py-3">Exam</th>
                <th className="px-4 py-3">Semester</th>
                <th className="px-4 py-3">Score</th>
                <th className="px-4 py-3">Grade</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {results.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-gray-400">
                    No results recorded yet
                  </td>
                </tr>
              )}
              {results.map((r) => (
                <tr key={r.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-2">
                    {r.student?.name || '—'}
                    {r.student?.rollNumber && (
                      <span className="text-xs text-gray-500 block">{r.student.rollNumber}</span>
                    )}
                  </td>
                  <td className="px-4 py-2">{r.exam?.course?.code || '—'}</td>
                  <td className="px-4 py-2">{r.exam?.name || '—'}</td>
                  <td className="px-4 py-2">{r.exam?.semester ?? '—'}</td>
                  <td className="px-4 py-2">
                    {r.marksObtained ?? '—'}
                    {r.maxMarks ? ` / ${r.maxMarks}` : ''}
                  </td>
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
