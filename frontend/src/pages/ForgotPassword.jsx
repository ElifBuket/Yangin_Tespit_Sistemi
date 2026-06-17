import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Flame, Mail, Lock, Loader2, ArrowLeft } from 'lucide-react'
import api from '../utils/api'
import toast from 'react-hot-toast'

const ForgotPassword = () => {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const pwChecks = [
    { ok: newPassword.length >= 6, label: 'En az 6 karakter' },
    { ok: /[A-Z]/.test(newPassword), label: 'Büyük harf' },
    { ok: /[a-z]/.test(newPassword), label: 'Küçük harf' },
    { ok: /\d/.test(newPassword), label: 'Rakam' },
  ]

  const handleSendOTP = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.post('/api/auth/forgot-password', { email })
      toast.success('Sıfırlama kodu gönderildi')
      setStep(2)
    } catch (e) { 
      console.error(e) 
      toast.error('Kod gönderilemedi. E-posta adresinizi kontrol edin.')
    } finally { 
      setLoading(false) 
    }
  }

  const handleReset = async (e) => {
    e.preventDefault()
    if (pwChecks.some(c => !c.ok)) { toast.error('Şifre kurallarını karşılayın'); return }
    if (newPassword !== confirmPassword) { toast.error('Şifreler eşleşmiyor'); return }
    setLoading(true)
    try {
      await api.post('/api/auth/reset-password', { email, otp, newPassword })
      toast.success('Şifre başarıyla güncellendi')
      navigate('/login')
    } catch (e) { 
      console.error(e) 
      toast.error('Şifre güncellenirken hata oluştu. Kodu kontrol edin.')
    } finally { 
      setLoading(false) 
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-4 text-slate-800 font-sans">
      <div className="w-full max-w-md space-y-6">
        
        {/* Üst Logo ve PyroGuard Markalama Alanı */}
        <div className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 rounded-2xl flex items-center justify-center shadow-md shadow-red-500/10"
            style={{ background: 'linear-gradient(135deg, #ef4444, #b91c1c)' }}
          >
            <Flame className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-3">PyroGuard</h1>
          <p className="text-red-600 text-xs font-bold uppercase tracking-wider">Erken Yangın Tespit Sistemi</p>
        </div>

        {/* Form Kartı */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-8 shadow-xl shadow-slate-100/50">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-800">Şifre Sıfırla</h2>
            <p className="text-slate-400 text-xs font-medium mt-0.5">
              {step === 1 ? 'Sistem erişiminizi kurtarmak için kayıtlı e-posta adresinizi girin.' : 'Doğrulama kodunu girerek yeni güvenli şifrenizi belirleyin.'}
            </p>
          </div>

          {step === 1 ? (
            /* 1. ADIM: E-POSTA GİRİŞİ */
            <form onSubmit={handleSendOTP} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-slate-400" />
                  E-posta Adresi
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-red-500 focus:bg-white transition-all" 
                    placeholder="ornek@email.com" 
                    required 
                  />
                </div>
              </div>
              
              <button 
                type="submit" 
                disabled={loading} 
                className="w-full flex items-center justify-center gap-2 text-sm font-bold text-white py-3 rounded-xl transition-all shadow-md shadow-red-500/10 hover:opacity-95 active:scale-[0.99] disabled:opacity-60"
                style={{ background: 'linear-gradient(135deg, #ef4444, #b91c1c)' }}
              >
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Gönderiliyor...</> : 'Kod Gönder'}
              </button>
            </form>
          ) : (
            /* 2. ADIM: OTP VE YENİ ŞİFRE BELİRLEME */
            <form onSubmit={handleReset} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 text-center">Doğrulama Kodu</label>
                <input 
                  type="text" 
                  value={otp} 
                  onChange={(e) => setOtp(e.target.value)} 
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-center text-2xl font-black font-mono tracking-widest text-slate-800 placeholder-slate-300 focus:outline-none focus:border-red-500 focus:bg-white transition-all" 
                  placeholder="000000" 
                  maxLength={6} 
                  required 
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-slate-400" />
                  Yeni Şifre
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="password" 
                    value={newPassword} 
                    onChange={(e) => setNewPassword(e.target.value)} 
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-red-500 focus:bg-white transition-all" 
                    placeholder="••••••••" 
                    required 
                  />
                </div>
                
                {/* Şifre Güçlülük Rozetleri */}
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {pwChecks.map((c) => (
                    <span 
                      key={c.label} 
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border transition-all ${
                        c.ok 
                          ? 'bg-green-50 text-green-600 border-green-100' 
                          : 'bg-slate-50 text-slate-400 border-slate-200'
                      }`}
                    >
                      {c.ok ? '✓' : '○'} {c.label}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-slate-400" />
                  Şifre Tekrar
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="password" 
                    value={confirmPassword} 
                    onChange={(e) => setConfirmPassword(e.target.value)} 
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-red-500 focus:bg-white transition-all" 
                    placeholder="••••••••" 
                    required 
                  />
                </div>
                {confirmPassword && (
                  <p className={`mt-1.5 text-xs font-bold pl-1 ${newPassword === confirmPassword ? 'text-green-600' : 'text-red-500'}`}>
                    {newPassword === confirmPassword ? '✓ Şifreler eşleşiyor' : '✗ Şifreler eşleşmiyor'}
                  </p>
                )}
              </div>

              <button 
                type="submit" 
                disabled={loading} 
                className="w-full flex items-center justify-center gap-2 text-sm font-bold text-white py-3 rounded-xl transition-all shadow-md shadow-red-500/10 hover:opacity-95 active:scale-[0.99] disabled:opacity-60"
                style={{ background: 'linear-gradient(135deg, #ef4444, #b91c1c)' }}
              >
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Güncelleniyor...</> : 'Şifreyi Güncelle'}
              </button>
            </form>
          )}

          {/* Giriş Sayfasına Dönüş */}
          <div className="mt-6 pt-5 border-t border-slate-100 text-center">
            <Link 
              to="/login" 
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-red-600 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Giriş sayfasına dön
            </Link>
          </div>

        </div>
      </div>
    </div>
  )
}

export default ForgotPassword