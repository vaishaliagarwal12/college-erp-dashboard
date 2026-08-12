import { io } from 'socket.io-client'

let socket = null

export const connectNotificationSocket = (token) => {
  if (socket) return socket
  socket = io('/', {
    auth: { token },
    transports: ['websocket', 'polling'],
  })
  return socket
}

export const disconnectNotificationSocket = () => {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}

export const getSocket = () => socket
