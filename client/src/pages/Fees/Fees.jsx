import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { getFees, getFeeSummary, createFee, recordFeePayment, deleteFee, exportFees } from '../../api'

const METHODS = ['Cash', 'Card', 'Bank Transfer', 'UPI', 'Cheque']

function Fees() {
  const queryClient = useQueryClient()
  const [form, setForm] = useState({
    student: '',
    semester: 1,
    items: [{ itemName: 'Tuition Fee', amount: '' }],
    dueDate: '',
  })
  const [paying, setPaying] = useState(null)
  const [payment, setPayment] = useState({ amount: '', method: 'Cash', reference: '' })

  const { data, isLoading, error } = useQuery({
    queryKey: ['fees'],
    queryFn: () => getFees({ limit: 20 }).then((r) => r.data),
  })

  const { data: summary } = useQuery({
    queryKey: ['feeSummary'],
    queryFn: () => getFeeSummary().then((r) => r.data),
  })

  const createMutation = useMutation({
    mutationFn: (payload) =>
      createFee({ ...payload, items: payload.items.map((i) => ({ itemName: i.itemName, amount: Number(i.amount) })) }),
    onSuccess: () => {
      toast.success('Fee record created')
      queryClient.invalidateQueries({ queryKey: ['fees'] })
      queryClient.invalidateQueries({ queryKey: ['feeSummary'] })
      setForm({ student: '', semester: 1, items: [{ itemName: 'Tuition Fee', amount: '' }], dueDate: '' })
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to create fee record'),
  })

  const payMutation = useMutation({
    mutationFn: ({ id, payload }) => recordFeePayment(id, payload),
    onSuccess: () => {
      toast.success('Payment recorded')
      setPaying(null)
      queryClient.invalidateQueries({ queryKey: ['fees'] })
      queryClient.invalidateQueries({ queryKey: ['feeSummary'] })
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Payment failed'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteFee(id),
    onSuccess: () => {
      toast.success('Fee record deleted')
      queryClient.invalidateQueries({ queryKey: ['fees'] })
      queryClient.invalidateQueries({ queryKey: ['feeSummary'] })
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to delete'),
  })

  const handleCreate = (e) => {
    e.preventDefault()
    createMutation.mutate(form)
  }

  const handleItemChange = (idx, field, value) => {
    const items = form.items.slice()
    items[idx] = { ...items[idx], [field]: value }
    setForm({ ...form, items })
  }

  const handlePay = (e) => {
    e.preventDefault()
    if (!paying) return
    payMutation.mutate({ id: paying, payload: { amount: Number(payment.amount), method: payment.method, reference: payment.reference } })
  }

  const handleExport = async () => {
    try {
      await exportFees()
      toast.success('Fees exported')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Export failed')
    }
  }

  const fees = data?.data || []
  const s = summary?.data || {}

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Fees</h1>
        <button
          onClick={handleExport}
          className="bg-gray-100 hover:bg-gray-200 text-gray-700 rounded px-4 py-2 text-sm"
        >
          Export CSV
        </button>
      </div>

      {!isLoading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow-sm p-4">
            <p className="text-sm text-gray-500">Collected</p>
            <p className="text-2xl font-bold text-green-600">₹{(s.totalCollected ?? 0).toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <p className="text-sm text-gray-500">Outstanding</p>
            <p className="text-2xl font-bold text-red-600">₹{(s.totalOutstanding ?? 0).toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <p className="text-sm text-gray-500">Paid Records</p>
            <p className="text-2xl font-bold">{s.statusCounts?.Paid ?? 0}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleCreate} className="bg-white p-5 rounded-lg shadow-sm space-y-3">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <input
            className="border rounded px-3 py-2"
            placeholder="Roll number"
            value={form.student}
            onChange={(e) => setForm({ ...form, student: e.target.value })}
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
            type="date"
            className="border rounded px-3 py-2"
            value={form.dueDate}
            onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
          />
          <button className="bg-blue-600 text-white rounded px-4 py-2 hover:bg-blue-700">
            Create Fee Record
          </button>
        </div>
        {form.items.map((item, idx) => (
          <div key={idx} className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <input
              className="border rounded px-3 py-2"
              placeholder="Item name"
              value={item.itemName}
              onChange={(e) => handleItemChange(idx, 'itemName', e.target.value)}
            />
            <input
              type="number"
              min="0"
              className="border rounded px-3 py-2"
              placeholder="Amount"
              value={item.amount}
              onChange={(e) => handleItemChange(idx, 'amount', e.target.value)}
            />
            <div className="flex gap-2">
              <button
                type="button"
                className="text-blue-600 text-xs"
                onClick={() => setForm({ ...form, items: [...form.items, { itemName: '', amount: '' }] })}
              >
                + Add item
              </button>
              {form.items.length > 1 && (
                <button
                  type="button"
                  className="text-red-600 text-xs"
                  onClick={() => setForm({ ...form, items: form.items.filter((_, i) => i !== idx) })}
                >
                  Remove
                </button>
              )}
            </div>
          </div>
        ))}
      </form>

      {isLoading && <p className="text-gray-500">Loading fees...</p>}
      {error && <p className="text-red-500">Failed to load: {error.message}</p>}

      {!isLoading && !error && (
        <div className="bg-white rounded-lg shadow-sm overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-600">
              <tr>
                <th className="px-4 py-3">Student</th>
                <th className="px-4 py-3">Sem</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Paid</th>
                <th className="px-4 py-3">Balance</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {fees.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-gray-400">
                    No fee records yet
                  </td>
                </tr>
              )}
              {fees.map((f) => (
                <tr key={f.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-2">{f.student?.name || f.student?.rollNumber || '—'}</td>
                  <td className="px-4 py-2">{f.semester}</td>
                  <td className="px-4 py-2">₹{f.totalAmount?.toLocaleString()}</td>
                  <td className="px-4 py-2 text-green-700">₹{f.amountPaid?.toLocaleString()}</td>
                  <td className="px-4 py-2">₹{(f.balance ?? 0).toLocaleString()}</td>
                  <td className="px-4 py-2">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        f.status === 'Paid'
                          ? 'bg-green-100 text-green-700'
                          : f.status === 'Partially Paid'
                          ? 'bg-yellow-100 text-yellow-700'
                          : f.status === 'Overdue'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {f.status}
                    </span>
                  </td>
                  <td className="px-4 py-2 flex gap-3">
                    {f.balance > 0 && (
                      <button
                        onClick={() => {
                          setPaying(f.id)
                          setPayment({ amount: String(f.balance), method: 'Cash', reference: '' })
                        }}
                        className="text-blue-600 hover:text-blue-700 text-xs"
                      >
                        Record Payment
                      </button>
                    )}
                    <button
                      onClick={() => deleteMutation.mutate(f.id)}
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

      {paying && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4">
          <form onSubmit={handlePay} className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md space-y-3">
            <h2 className="text-lg font-semibold">Record Payment</h2>
            <input
              type="number"
              min="0.01"
              className="border rounded px-3 py-2 w-full"
              placeholder="Amount"
              value={payment.amount}
              onChange={(e) => setPayment({ ...payment, amount: e.target.value })}
              required
            />
            <select
              className="border rounded px-3 py-2 w-full"
              value={payment.method}
              onChange={(e) => setPayment({ ...payment, method: e.target.value })}
            >
              {METHODS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
            <input
              className="border rounded px-3 py-2 w-full"
              placeholder="Reference (optional)"
              value={payment.reference}
              onChange={(e) => setPayment({ ...payment, reference: e.target.value })}
            />
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                className="px-4 py-2 text-gray-600"
                onClick={() => setPaying(null)}
              >
                Cancel
              </button>
              <button className="bg-blue-600 text-white rounded px-4 py-2 hover:bg-blue-700">
                Pay
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

export default Fees
