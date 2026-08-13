import { io } from 'socket.io-client'

// In dev, connect straight to the backend instead of hopping through Vite's
// WebSocket proxy. The proxy tears connections down on page reload / dev-server
// restart and spams `[vite] ws proxy error: write ECONNABORTED`; a direct
// connection avoids the double-hop and survives Vite restarts.
// In production the same-origin path is proxied by nginx (/socket.io).
// Set VITE_SOCKET_URL to override (e.g. a remote or differently-pinned backend).
const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ||
  (import.meta.env.DEV ? 'http://localhost:5000' : '/')

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
