import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { getJobsHealth, runFeeReminders, runReportJob, sendEmailJob } from '../../api'

function Jobs() {
  const queryClient = useQueryClient()
  const [dryRun, setDryRun] = useState(true)
  const [daysOverdue, setDaysOverdue] = useState(30)
  const [email, setEmail] = useState({ to: '', subject: '', text: '' })

  const { data, isLoading } = useQuery({
    queryKey: ['jobsHealth'],
    queryFn: () => getJobsHealth().then((r) => r.data),
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['jobsHealth'] })

  const runMutation = useMutation({
    mutationFn: ({ fn, payload }) => fn(payload),
    onSuccess: (res) => {
      const result = res.data?.data?.job?.result
      toast.success(
        result?.count !== undefined
          ? `Job finished — ${result.count} record(s) processed`
          : 'Job enqueued and completed'
      )
      invalidate()
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Job failed'),
  })

  const handleFeeReminders = (e) => {
    e.preventDefault()
    runMutation.mutate({ fn: () => runFeeReminders({ dryRun, daysOverdue: Number(daysOverdue) }) })
  }

  const handleReport = (type) => {
    runMutation.mutate({ fn: () => runReportJob(type) })
  }

  const handleEmail = (e) => {
    e.preventDefault()
    runMutation.mutate({ fn: () => sendEmailJob(email) })
  }

  const backend = data?.data?.backend

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Background Jobs</h1>

      <div className="bg-white rounded-lg shadow-sm p-4 inline-block">
        <p className="text-sm text-gray-500">Queue backend</p>
        <p className="text-lg font-semibold">
          {isLoading ? '…' : backend === 'redis-bullmq' ? 'Redis (BullMQ)' : 'In-memory (fallback)'}
        </p>
      </div>

      <form onSubmit={handleFeeReminders} className="bg-white p-5 rounded-lg shadow-sm space-y-3">
        <h2 className="font-semibold">Fee payment reminders</h2>
        <p className="text-sm text-gray-600">
          Enqueue a job that emails every student with an outstanding balance due more than the
          overdue window.
        </p>
        <div className="flex flex-wrap items-end gap-4">
          <label className="flex flex-col gap-1 text-sm">
            Days overdue
            <input
              type="number"
              min="1"
              className="border rounded px-3 py-2 w-36"
              value={daysOverdue}
              onChange={(e) => setDaysOverdue(e.target.value)}
            />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={dryRun}
              onChange={(e) => setDryRun(e.target.checked)}
            />
            Dry run (don't send emails)
          </label>
          <button className="bg-blue-600 text-white rounded px-4 py-2 hover:bg-blue-700">
            Run fee reminders
          </button>
        </div>
      </form>

      <form onSubmit={handleEmail} className="bg-white p-5 rounded-lg shadow-sm space-y-3">
        <h2 className="font-semibold">Send test email (job)</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <input
            type="email"
            className="border rounded px-3 py-2"
            placeholder="Recipient email"
            value={email.to}
            onChange={(e) => setEmail({ ...email, to: e.target.value })}
            required
          />
          <input
            className="border rounded px-3 py-2"
            placeholder="Subject"
            value={email.subject}
            onChange={(e) => setEmail({ ...email, subject: e.target.value })}
            required
          />
          <input
            className="border rounded px-3 py-2"
            placeholder="Text"
            value={email.text}
            onChange={(e) => setEmail({ ...email, text: e.target.value })}
          />
        </div>
        <button className="bg-blue-600 text-white rounded px-4 py-2 hover:bg-blue-700">
          Enqueue email
        </button>
      </form>

      <div className="bg-white p-5 rounded-lg shadow-sm space-y-3">
        <h2 className="font-semibold">Reports</h2>
        <p className="text-sm text-gray-600">
          Generate CSV reports as background jobs (written to <code>server/exports/</code>).
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => handleReport('fees')}
            className="bg-gray-800 text-white rounded px-4 py-2 hover:bg-gray-900"
          >
            Generate fee report
          </button>
        </div>
      </div>
    </div>
  )
}

export default Jobs
