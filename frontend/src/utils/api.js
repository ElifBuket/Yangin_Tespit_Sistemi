import axios from 'axios'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor - Token ekle
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor - Hata yönetimi
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    const status = error.response?.status

    // Hangi endpoint?
    const url = originalRequest?.url || ''
    const isLoginRequest = url.includes('/api/auth/login')
    const isRegisterRequest = url.includes('/api/auth/register')
    const isRefreshRequest = url.includes('/api/auth/refresh-token')

    const isAuthRequest = isLoginRequest || isRegisterRequest || isRefreshRequest

    // 401 ise ve auth endpoint DEĞİL ise → refresh dene
    if (status === 401 && !originalRequest._retry && !isAuthRequest) {
      originalRequest._retry = true

      try {
        const refreshToken = useAuthStore.getState().refreshToken
        const response = await axios.post(`${API_URL}/api/auth/refresh-token`, {
          refreshToken,
        })

        const { token: newToken, refreshToken: newRefreshToken } = response.data.data
        
        useAuthStore.getState().setAuth(
          useAuthStore.getState().user,
          newToken,
          newRefreshToken
        )

        originalRequest.headers.Authorization = `Bearer ${newToken}`
        return api(originalRequest)
      } catch (refreshError) {
        useAuthStore.getState().logout()
        window.location.href = '/login'
        toast.error('Oturum süreniz doldu. Lütfen tekrar giriş yapın.')
        return Promise.reject(refreshError)
      }
    }

    // Diğer hatalar (login dahil)
    console.log('🔴 API INTERCEPTOR HATA:', status, error.response?.data)
    const message = error.response?.data?.message || 'Bir hata oluştu'

    // Login sayfasında toast gösterme!
    if (!isLoginRequest) {
      toast.error(message, {
        duration: 6000,
        style: {
          background: '#dc2626',
          color: '#fff',
          fontSize: '14px',
          fontWeight: '500'
        }
      })
    }

    return Promise.reject(error)
  }
)

  

export default api
