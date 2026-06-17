import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Flame, Mail, Lock, Loader2, ArrowRight } from 'lucide-react'
import api from '../utils/api'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'

const Login = () => {
  const navigate = useNavigate()
  const setAuth = useAuthStore((state) => state.setAuth)

  const [formData, setFormData] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const response = await api.post('/api/auth/login', formData)
      const { user, token, refreshToken } = response.data.data
      setAuth(user, token, refreshToken)
      toast.success('Giriş başarılı')
      navigate('/dashboard')
    } catch (error) {
      const status = error.response?.status
      let msg = 'Giriş başarısız. Lütfen tekrar deneyin.'
      if (status === 401) msg = 'E-posta veya şifre hatalı.'
      else if (error.response?.data?.message) msg = error.response.data.message
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-4 text-slate-800 font-sans">
      <div className="w-full max-w-md space-y-6">
        
        {/* Üst Logo ve Yangın Tespit Marka Alanı */}
        <div className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 rounded-2xl flex items-center justify-center shadow-md shadow-red-500/10"
            style={{ background: 'linear-gradient(135deg, #ef4444, #b91c1c)' }}
          >
            <Flame className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-3">PyroGuard</h1>
          <p className="text-red-600 text-xs font-bold uppercase tracking-wider">Erken Yangın Tespit Sistemi</p>
        </div>

        {/* Giriş Kartı */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-8 shadow-xl shadow-slate-100/50">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-800">Hesabınıza giriş yapın</h2>
            <p className="text-slate-400 text-xs font-medium mt-0.5">Yangın güvenlik panelini canlı takip etmek için bilgilerinizi girin.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3.5 text-red-600 text-xs font-bold animate-pulse">
                {error}
              </div>
            )}

            {/* E-posta Alanı */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                <Mail className="w-4 h-4 text-slate-400" />
                E-posta Adresi
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-red-500 focus:bg-white transition-all"
                  placeholder="ornek@email.com"
                  required
                />
              </div>
            </div>

            {/* Şifre Alanı */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                  <Lock className="w-4 h-4 text-slate-400" />
                  Şifre
                </label>
                <Link 
                  to="/forgot-password" 
                  className="text-xs font-bold text-red-500 hover:text-red-700 transition-colors"
                >
                  Şifremi unuttum
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-red-500 focus:bg-white transition-all"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {/* Giriş Butonu */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 text-sm font-bold text-white py-3 rounded-xl transition-all shadow-md shadow-red-500/10 hover:opacity-95 active:scale-[0.99] disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg, #ef4444, #b91c1c)' }}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Bağlanıyor...
                </>
              ) : (
                <>
                  Sisteme Giriş Yap
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-100 text-center">
            <p className="text-xs font-semibold text-slate-400">
              Hesabınız yok mu?{' '}
              <Link 
                to="/register" 
                className="text-red-500 hover:text-red-700 font-bold transition-colors ml-0.5"
              >
                Kayıt olun
              </Link>
            </p>
          </div>

        </div>
      </div>
    </div>
  )
}

export default Login