import { io } from 'socket.io-client'

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

let socket = null

export const initSocket = () => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ['polling', 'websocket'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
    })

    socket.on('connect', () => {
      console.log('✅ WebSocket bağlantısı kuruldu:', socket.id)
    })

    socket.on('disconnect', (reason) => {
      console.warn('❌ WebSocket bağlantısı kesildi:', reason)
    })

    socket.on('connect_error', (error) => {
      console.error('🔴 WebSocket bağlantı hatası:', error)
    })
  }

  return socket
}

export const getSocket = () => {
  if (!socket) {
    return initSocket()
  }
  return socket
}

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}
