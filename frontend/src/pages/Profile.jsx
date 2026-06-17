import { useState } from 'react'
import { User, MapPin, Mail, Save, Loader2 } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import api from '../utils/api'
import toast from 'react-hot-toast'

const Profile = () => {
  const { user, updateUser } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: user?.name || '',
    address: {
      street: user?.address?.street || '',
      city: user?.address?.city || '',
      zipCode: user?.address?.zipCode || '',
    },
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    
    if (name.startsWith('address.')) {
      const addressField = name.split('.')[1]
      setFormData({
        ...formData,
        address: { ...formData.address, [addressField]: value }
      })
    } else {
      setFormData({ ...formData, [name]: value })
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await api.put('/api/user/profile', formData)
      updateUser(response.data.data)
      toast.success('Profil başarıyla güncellendi')
    } catch (error) {
      console.error('Update profile error:', error)
      toast.error('Profil güncellenirken bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 bg-slate-50 min-h-screen text-slate-800">
      
      {/* Üst Başlık Alanı */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Profil</h1>
        <p className="text-slate-500 text-sm mt-0.5 font-medium">Hesap bilgilerinizi yönetin</p>
      </div>

      {/* Profil Kartı — Aydınlık ve Beyaz Zemin */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        
        {/* Üst Kullanıcı Bilgi Bölümü */}
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-100">
          <div className="w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm"
            style={{ background: 'linear-gradient(135deg, #ef4444, #b91c1c)' }}>
            <span className="text-2xl font-black text-white">
              {user?.name?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">{user?.name}</h2>
            <p className="text-xs font-semibold text-slate-400 mt-0.5">{user?.email}</p>
            <span className={`inline-block mt-2 px-3 py-0.5 rounded-full text-xs font-bold border ${
              user?.role === 'admin'
                ? 'bg-purple-50 text-purple-600 border-purple-200'
                : 'bg-red-50 text-red-600 border-red-100'
            }`}>
              {user?.role === 'admin' ? 'Yönetici' : 'Kullanıcı'}
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Ad Soyad Girişi */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
              <User className="w-4 h-4 text-slate-400" />
              Ad Soyad
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-red-500 focus:bg-white transition-all"
              required
            />
          </div>

          {/* E-posta (Sadece Okunabilir - Değiştirilemez) */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
              <Mail className="w-4 h-4 text-slate-400" />
              E-posta Adresi
            </label>
            <input
              type="email"
              value={user?.email || ''}
              className="w-full px-3 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-sm font-semibold text-slate-400 cursor-not-allowed"
              disabled
            />
            <p className="text-xs text-slate-400 font-medium mt-1.5 ml-1">E-posta adresi güvenlik nedeniyle değiştirilemez.</p>
          </div>

          {/* Adres Bilgileri Grubu */}
          <div className="space-y-4 pt-5 border-t border-slate-100">
            <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-red-500" />
              Adres Bilgileri
            </h3>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Sokak / Cadde / Mahalle</label>
              <input
                type="text"
                name="address.street"
                value={formData.address.street}
                onChange={handleChange}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-red-500 focus:bg-white transition-all"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Şehir</label>
                <input
                  type="text"
                  name="address.city"
                  value={formData.address.city}
                  onChange={handleChange}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-red-500 focus:bg-white transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Posta Kodu</label>
                <input
                  type="text"
                  name="address.zipCode"
                  value={formData.address.zipCode}
                  onChange={handleChange}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-red-500 focus:bg-white transition-all"
                  pattern="[0-9]{5}"
                  maxLength={5}
                  required
                />
              </div>
            </div>
          </div>

          {/* Kırmızı Renkli Güncelleme Butonu */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 text-sm font-bold text-white py-2.5 rounded-xl transition-all shadow-sm hover:opacity-90 disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg, #ef4444, #b91c1c)' }}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Kaydediliyor...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Değişiklikleri Kaydet
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}

export default Profile