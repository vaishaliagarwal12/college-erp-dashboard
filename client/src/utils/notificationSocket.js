import { io } from 'socket.io-client'

// In dev, connect straight to the local backend instead of hopping through
// Vite's WebSocket proxy (which spams `write ECONNABORTED` on reload/restart).
// In production (Vercel build), default to the deployed backend on Render.
// Set VITE_SOCKET_URL to override (e.g. a remote or differently-pinned backend).
const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ||
  (import.meta.env.DEV
    ? 'http://localhost:5000'
    : 'https://college-erp-dashboard.onrender.com')

let socket = null

export const connectNotificationSocket = (token) => {
  if (socket) return socket
  socket = io(SOCKET_URL, {
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
