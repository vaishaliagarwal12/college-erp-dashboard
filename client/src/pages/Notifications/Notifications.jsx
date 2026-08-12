import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import {
  getNotifications,
  createNotification,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
} from '../../api'

const TYPES = ['Info', 'Success', 'Warning', 'Alert']

const TYPE_STYLES = {
  Info: 'bg-blue-100 text-blue-700',
  Success: 'bg-green-100 text-green-700',
  Warning: 'bg-yellow-100 text-yellow-700',
  Alert: 'bg-red-100 text-red-700',
}

function Notifications() {
  const queryClient = useQueryClient()
  const [form, setForm] = useState({ recipient: '', title: '', message: '', type: 'Info', link: '' })

  const { data, isLoading, error } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => getNotifications({ limit: 20 }).then((r) => r.data),
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['notifications'] })

  const createMutation = useMutation({
    mutationFn: (payload) => createNotification(payload),
    onSuccess: () => {
      toast.success('Notification sent')
      invalidate()
      setForm({ recipient: '', title: '', message: '', type: 'Info', link: '' })
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to send notification'),
  })

  const readMutation = useMutation({
    mutationFn: (id) => markNotificationRead(id),
    onSuccess: invalidate,
  })

  const readAllMutation = useMutation({
    mutationFn: () => markAllNotificationsRead(),
    onSuccess: () => {
      toast.success('All marked as read')
      invalidate()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteNotification(id),
    onSuccess: () => {
      toast.success('Notification deleted')
      invalidate()
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to delete'),
  })

  const handleCreate = (e) => {
    e.preventDefault()
    createMutation.mutate(form)
  }

  const notifications = data?.data || []

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Notifications</h1>

      <form onSubmit={handleCreate} className="bg-white p-5 rounded-lg shadow-sm grid grid-cols-2 md:grid-cols-4 gap-3">
        <input
          className="border rounded px-3 py-2"
          placeholder="Recipient (email or id)"
          value={form.recipient}
          onChange={(e) => setForm({ ...form, recipient: e.target.value })}
          required
        />
        <input
          className="border rounded px-3 py-2"
          placeholder="Title"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          required
        />
        <input
          className="border rounded px-3 py-2"
          placeholder="Message"
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
        />
        <select
          className="border rounded px-3 py-2"
          value={form.type}
          onChange={(e) => setForm({ ...form, type: e.target.value })}
        >
          {TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <button className="col-span-2 md:col-span-1 bg-blue-600 text-white rounded px-4 py-2 hover:bg-blue-700">
          Send
        </button>
      </form>

      <div className="flex justify-end">
        <button
          onClick={() => readAllMutation.mutate()}
          className="text-blue-600 hover:text-blue-700 text-sm"
        >
          Mark all as read
        </button>
      </div>

      {isLoading && <p className="text-gray-500">Loading notifications...</p>}
      {error && <p className="text-red-500">Failed to load: {error.message}</p>}

      {!isLoading && !error && (
        <div className="space-y-3">
          {notifications.length === 0 && (
            <p className="text-gray-400 text-center py-8">No notifications</p>
          )}
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`bg-white rounded-lg shadow-sm p-4 flex items-start gap-3 ${
                n.read ? 'opacity-60' : ''
              }`}
            >
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium mt-0.5 ${TYPE_STYLES[n.type] || TYPE_STYLES.Info}`}>
                {n.type}
              </span>
              <div className="flex-1">
                <p className="font-medium">{n.title}</p>
                {n.message && <p className="text-sm text-gray-600">{n.message}</p>}
                <p className="text-xs text-gray-400 mt-1">{new Date(n.createdAt).toLocaleString()}</p>
                {n.link && (
                  <a href={n.link} className="text-xs text-blue-600 hover:underline">
                    {n.link}
                  </a>
                )}
              </div>
              <div className="flex gap-3 text-xs">
                {!n.read && (
                  <button
                    onClick={() => readMutation.mutate(n.id)}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    Mark read
                  </button>
                )}
                <button
                  onClick={() => deleteMutation.mutate(n.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Notifications
