import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import {
  getSyllabi,
  createSyllabus,
  updateSyllabus,
  deleteSyllabus,
} from '../../api'

const parseUnits = (text) =>
  text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [title, topicsPart = '', hoursPart = '0'] = line
        .split('|')
        .map((s) => s.trim())
      const topics = topicsPart
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)
      return { title, topics, hours: Number(hoursPart) || 0 }
    })

const unitsToText = (units) =>
  (units || [])
    .map((u) => [u.title, (u.topics || []).join(', '), u.hours].join(' | '))
    .join('\n')

const listToText = (items) => (items || []).join('\n')
const textToList = (text) =>
  text
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean)

const emptyForm = {
  course: '',
  recommendedHours: 40,
  programOutcomes: '',
  courseOutcomes: '',
  units: '',
  textbooks: '',
}

function Curriculum() {
  const queryClient = useQueryClient()
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)

  const { data, isLoading, error } = useQuery({
    queryKey: ['curriculum'],
    queryFn: () => getSyllabi({ limit: 50 }).then((r) => r.data),
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['curriculum'] })

  const saveMutation = useMutation({
    mutationFn: (payload) =>
      editingId ? updateSyllabus(editingId, payload) : createSyllabus(payload),
    onSuccess: () => {
      toast.success(editingId ? 'Syllabus updated' : 'Syllabus created')
      setForm(emptyForm)
      setEditingId(null)
      invalidate()
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to save syllabus'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteSyllabus(id),
    onSuccess: () => {
      toast.success('Syllabus deleted')
      invalidate()
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to delete'),
  })

  const handleSave = (e) => {
    e.preventDefault()
    saveMutation.mutate({
      course: form.course,
      recommendedHours: Number(form.recommendedHours),
      programOutcomes: textToList(form.programOutcomes),
      courseOutcomes: textToList(form.courseOutcomes),
      units: parseUnits(form.units),
      textbooks: textToList(form.textbooks),
    })
  }

  const startEdit = (s) => {
    setEditingId(s.id)
    setForm({
      course: s.course?.id || '',
      recommendedHours: s.recommendedHours || 0,
      programOutcomes: listToText(s.programOutcomes),
      courseOutcomes: listToText(s.courseOutcomes),
      units: unitsToText(s.units),
      textbooks: listToText(s.textbooks),
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const syllabi = data?.data || []
  const totalHours = syllabi.reduce((sum, s) => sum + (s.recommendedHours || 0), 0)

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Curriculum</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-4">
          <p className="text-sm text-gray-500">Syllabi</p>
          <p className="text-2xl font-bold">{syllabi.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <p className="text-sm text-gray-500">Recommended hours</p>
          <p className="text-2xl font-bold">{totalHours}</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="bg-white p-5 rounded-lg shadow-sm space-y-3">
        <h2 className="font-semibold">{editingId ? 'Edit syllabus' : 'Add syllabus'}</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <input
            className="border rounded px-3 py-2"
            placeholder="Course ID"
            value={form.course}
            onChange={(e) => setForm({ ...form, course: e.target.value })}
            required
          />
          <input
            type="number"
            min="0"
            className="border rounded px-3 py-2"
            placeholder="Recommended hours"
            value={form.recommendedHours}
            onChange={(e) => setForm({ ...form, recommendedHours: e.target.value })}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <textarea
            className="border rounded px-3 py-2"
            rows={3}
            placeholder="Program outcomes (one per line)"
            value={form.programOutcomes}
            onChange={(e) => setForm({ ...form, programOutcomes: e.target.value })}
          />
          <textarea
            className="border rounded px-3 py-2"
            rows={3}
            placeholder="Course outcomes (one per line)"
            value={form.courseOutcomes}
            onChange={(e) => setForm({ ...form, courseOutcomes: e.target.value })}
          />
        </div>
        <textarea
          className="border rounded px-3 py-2 w-full"
          rows={3}
          placeholder="Units — one per line: Title | topic1, topic2 | hours"
          value={form.units}
          onChange={(e) => setForm({ ...form, units: e.target.value })}
        />
        <textarea
          className="border rounded px-3 py-2 w-full"
          rows={2}
          placeholder="Textbooks (one per line)"
          value={form.textbooks}
          onChange={(e) => setForm({ ...form, textbooks: e.target.value })}
        />
        <div className="flex gap-3">
          <button className="bg-blue-600 text-white rounded px-4 py-2 hover:bg-blue-700">
            {editingId ? 'Update syllabus' : 'Save syllabus'}
          </button>
          {editingId && (
            <button
              type="button"
              className="px-4 py-2 text-gray-600"
              onClick={() => {
                setEditingId(null)
                setForm(emptyForm)
              }}
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      {isLoading && <p className="text-gray-500">Loading syllabi...</p>}
      {error && <p className="text-red-500">Failed to load: {error.message}</p>}

      {!isLoading && !error && (
        <div className="space-y-3">
          {syllabi.length === 0 && (
            <p className="text-gray-400 text-center py-6">No syllabi yet</p>
          )}
          {syllabi.map((s) => (
            <div key={s.id} className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">
                    {s.course?.courseName || '—'}{' '}
                    <span className="text-xs text-gray-500">({s.course?.courseCode || ''})</span>
                  </p>
                  <p className="text-sm text-gray-600">
                    {s.course?.department?.name || '—'} · Sem {s.course?.semester || '—'} ·{' '}
                    {s.course?.credits || 0} credits · {s.recommendedHours || 0}h
                  </p>
                </div>
                <div className="flex gap-3 shrink-0">
                  <button
                    onClick={() => startEdit(s)}
                    className="text-blue-600 hover:text-blue-700 text-xs"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteMutation.mutate(s.id)}
                    className="text-red-600 hover:text-red-700 text-xs"
                  >
                    Delete
                  </button>
                </div>
              </div>
              {s.units?.length > 0 && (
                <ul className="mt-3 space-y-1">
                  {s.units.map((u, i) => (
                    <li key={i} className="text-sm text-gray-700">
                      <span className="font-medium">{u.title}</span>
                      {u.hours > 0 && <span className="text-gray-400"> · {u.hours}h</span>}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Curriculum
