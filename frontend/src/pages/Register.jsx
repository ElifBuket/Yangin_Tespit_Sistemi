import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Flame, Mail, Lock, User, MapPin, Loader2, ArrowRight } from 'lucide-react'
import api from '../utils/api'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'

const Register = () => {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', confirmPassword: '',
    address: { street: '', city: '', zipCode: '' },
  })
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    if (name.startsWith('address.')) {
      const f = name.split('.')[1]
      setFormData({ ...formData, address: { ...formData.address, [f]: value } })
    } else {
      setFormData({ ...formData, [name]: value })
    }
  }

  const validatePassword = () => {
    const e = []
    if (formData.password.length < 6) e.push('En az 6 karakter')
    if (!/[A-Z]/.test(formData.password)) e.push('Büyük harf')
    if (!/[a-z]/.test(formData.password)) e.push('Küçük harf')
    if (!/\d/.test(formData.password)) e.push('Rakam')
    return e
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    const errs = validatePassword()
    if (errs.length) { toast.error(`Şifre: ${errs.join(', ')}`); return }
    if (formData.password !== formData.confirmPassword) { toast.error('Şifreler eşleşmiyor'); return }
    setLoading(true)
    try {
      const { confirmPassword, ...data } = formData
      await api.post('/api/auth/register', data)
      toast.success('Doğrulama kodu gönderildi')
      setStep(2)
    } catch (err) { 
      console.error(err) 
      toast.error(err.response?.data?.message || 'Kayıt sırasında bir hata oluştu')
    } finally { 
      setLoading(false) 
    }
  }

  const handleVerifyOTP = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await api.post('/api/auth/verify-email', { email: formData.email, otp })
      const { user, token, refreshToken } = res.data.data
      useAuthStore.getState().setAuth(user, token, refreshToken)
      toast.success('Hesabınız doğrulandı!')
      navigate('/dashboard')
    } catch (err) { 
      console.error(err) 
      toast.error(err.response?.data?.message || 'Geçersiz veya hatalı doğrulama kodu')
    } finally { 
      setLoading(false) 
    }
  }

  const pwChecks = [
    { ok: formData.password.length >= 6, label: 'En az 6 karakter' },
    { ok: /[A-Z]/.test(formData.password), label: 'Büyük harf' },
    { ok: /[a-z]/.test(formData.password), label: 'Küçük harf' },
    { ok: /\d/.test(formData.password), label: 'Rakam' },
  ]

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-4 py-8 text-slate-800 font-sans">
      <div className="w-full max-w-md space-y-6">
        
        {/* Üst Logo ve Marka Alanı */}
        <div className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 rounded-2xl flex items-center justify-center shadow-md shadow-red-500/10"
            style={{ background: 'linear-gradient(135deg, #ef4444, #b91c1c)' }}
          >
            <Flame className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-3">PyroGuard</h1>
          <p className="text-red-600 text-xs font-bold uppercase tracking-wider">
            {step === 1 ? 'Yeni hesap oluşturun' : 'E-postanızı doğrulayın'}
          </p>
        </div>

        {/* Kayıt Kartı */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-8 shadow-xl shadow-slate-100/50 max-h-[85vh] overflow-y-auto custom-scrollbar">
          
          {step === 1 ? (
            /* 1. ADIM: KAYIT FORMU */
            <form onSubmit={handleRegister} className="space-y-4">
              {/* Ad Soyad */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-2">
                  <User className="w-4 h-4 text-slate-400" /> Ad Soyad
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-red-500 focus:bg-white transition-all" placeholder="Ad Soyad" required />
                </div>
              </div>

              {/* E-posta */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-slate-400" /> E-posta Adresi
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-red-500 focus:bg-white transition-all" placeholder="ornek@email.com" required />
                </div>
              </div>

              {/* Şifre */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-slate-400" /> Şifre
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input type="password" name="password" value={formData.password} onChange={handleChange} className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-red-500 focus:bg-white transition-all" placeholder="••••••••" required />
                </div>
                {/* Şifre Güçlülük Göstergeleri */}
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {pwChecks.map((c) => (
                    <span key={c.label} className={`text-[10px] font-bold px-2 py-0.5 rounded-full border transition-all ${
                      c.ok ? 'bg-green-50 text-green-600 border-green-100' : 'bg-slate-50 text-slate-400 border-slate-200'
                    }`}>
                      {c.ok ? '✓' : '○'} {c.label}
                    </span>
                  ))}
                </div>
              </div>

              {/* Şifre Tekrar */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-slate-400" /> Şifre Tekrar
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-red-500 focus:bg-white transition-all" placeholder="••••••••" required />
                </div>
                {formData.confirmPassword && (
                  <p className={`mt-1.5 text-xs font-bold pl-1 ${formData.password === formData.confirmPassword ? 'text-green-600' : 'text-red-500'}`}>
                    {formData.password === formData.confirmPassword ? '✓ Şifreler eşleşiyor' : '✗ Şifreler eşleşmiyor'}
                  </p>
                )}
              </div>

              {/* Adres Bölümü */}
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-red-500" /> Adres Bilgileri
                </h3>
                <input type="text" name="address.street" value={formData.address.street} onChange={handleChange} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-red-500 focus:bg-white transition-all" placeholder="Sokak / Cadde" required />
                <div className="grid grid-cols-2 gap-3">
                  <input type="text" name="address.city" value={formData.address.city} onChange={handleChange} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-red-500 focus:bg-white transition-all" placeholder="Şehir" required />
                  <input type="text" name="address.zipCode" value={formData.address.zipCode} onChange={handleChange} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-red-500 focus:bg-white transition-all" placeholder="Posta Kodu" pattern="[0-9]{5}" maxLength={5} required />
                </div>
              </div>

              <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 text-sm font-bold text-white py-3 rounded-xl transition-all shadow-md shadow-red-500/10 hover:opacity-95 active:scale-[0.99] disabled:opacity-60 pt-2.5" style={{ background: 'linear-gradient(135deg, #ef4444, #b91c1c)' }}>
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Kayıt yapılıyor...</> : <><span className="mt-0.5">Kayıt Ol</span><ArrowRight className="w-4 h-4" /></>}
              </button>
            </form>
          ) : (
            /* 2. ADIM: OTP DOĞRULAMA FORMU */
            <form onSubmit={handleVerifyOTP} className="space-y-5">
              <div className="text-center">
                <div className="w-12 h-12 bg-red-50 border border-red-100 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-sm">
                  <Mail className="w-5 h-5 text-red-500" />
                </div>
                <p className="text-slate-500 text-xs font-semibold">
                  <span className="text-slate-800 font-bold">{formData.email}</span> adresine doğrulama kodu gönderdik.
                </p>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 text-center">Doğrulama Kodu</label>
                <input type="text" value={otp} onChange={(e) => setOtp(e.target.value)} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-center text-2xl font-black font-mono tracking-widest text-slate-800 placeholder-slate-300 focus:outline-none focus:border-red-500 focus:bg-white transition-all" placeholder="000000" maxLength={6} required />
              </div>
              <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 text-sm font-bold text-white py-3 rounded-xl transition-all shadow-md shadow-red-500/10 hover:opacity-95 active:scale-[0.99] disabled:opacity-60" style={{ background: 'linear-gradient(135deg, #ef4444, #b91c1c)' }}>
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Doğrulanıyor...</> : 'Hesabı Doğrula'}
              </button>
              <div className="text-center">
                <button type="button" onClick={() => api.post('/api/auth/resend-otp', { email: formData.email, purpose: 'email_verification' }).then(() => toast.success('Kod tekrar gönderildi'))} className="text-xs font-bold text-red-500 hover:text-red-700 transition-colors">
                  Kodu tekrar gönder
                </button>
              </div>
            </form>
          )}

          {/* Alt Giriş Linki */}
          <div className="mt-6 pt-4 border-t border-slate-100 text-center">
            <p className="text-xs font-semibold text-slate-400">
              Zaten hesabınız var mı?{' '}
              <Link to="/login" className="text-red-500 hover:text-red-700 font-bold transition-colors ml-0.5">Giriş yapın</Link>
            </p>
          </div>

        </div>
      </div>
    </div>
  )
}

export default Register