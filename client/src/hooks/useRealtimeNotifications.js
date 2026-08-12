import { useEffect } from 'react'
import toast from 'react-hot-toast'
import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../context/AuthContext'
import { connectNotificationSocket, disconnectNotificationSocket } from '../utils/notificationSocket'

export default function useRealtimeNotifications() {
  const { token } = useAuth()
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!token) return undefined

    const socket = connectNotificationSocket(token)

    const handler = (notification) => {
      toast(`${notification.title}${notification.message ? ` — ${notification.message}` : ''}`, { duration: 5000 })
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['unreadCount'] })
    }

    socket.on('notification:new', handler)

    return () => {
      socket.off('notification:new', handler)
      disconnectNotificationSocket()
    }
  }, [token, queryClient])
}
