import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { verifyEmail } from '../../api'

function VerifyEmail() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''
  const [status, setStatus] = useState('verifying') // verifying | success | error
  const [message, setMessage] = useState('')

  useEffect(() => {
    const run = async () => {
      if (!token) {
        setStatus('error')
        setMessage('Missing verification token. Check the link in your email.')
        return
      }
      try {
        const res = await verifyEmail({ token })
        setStatus('success')
        setMessage(res.data.message || 'Email verified successfully')
        toast.success(res.data.message || 'Email verified successfully')
      } catch (err) {
        setStatus('error')
        setMessage(err.response?.data?.message || 'Verification failed. Please try again.')
      }
    }
    run()
  }, [token])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white rounded-xl shadow-md p-8 w-full max-w-sm text-center">
        <h1 className="text-2xl font-bold mb-4">Email Verification</h1>
        {status === 'verifying' && <p className="text-gray-500">Verifying your email...</p>}
        {status === 'success' && (
          <>
            <p className="text-green-600 font-medium mb-6">{message}</p>
            <button
              onClick={() => navigate('/login')}
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
            >
              Go to login
            </button>
          </>
        )}
        {status === 'error' && (
          <>
            <p className="text-red-600 font-medium mb-6">{message}</p>
            <Link
              to="/login"
              className="block w-full border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50"
            >
              Back to login
            </Link>
          </>
        )}
      </div>
    </div>
  )
}

export default VerifyEmail
