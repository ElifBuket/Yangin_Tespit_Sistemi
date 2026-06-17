import { useState, useEffect } from 'react'
import { Users, Cpu, AlertTriangle, Activity, Loader2, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import api from '../../utils/api'

const AdminDashboard = () => {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchStats() }, [])

  const fetchStats = async () => {
    try {
      const res = await api.get('/api/admin/stats')
      setStats(res.data.data)
    } catch (e) { 
      console.error(e) 
    } finally { 
      setLoading(false) 
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-96 bg-slate-50">
      <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  // Üst istatistik kartları: Zıt renk konsepti (Kırmızı Arka Plan - Beyaz Yazı) için uyarlandı
  const statCards = [
    { label: 'Toplam Kullanıcı', value: stats?.users?.total || 0, sub: `${stats?.users?.activeLastWeek || 0} aktif (7g)`, icon: Users },
    { label: 'Toplam Cihaz', value: stats?.devices?.total || 0, sub: `${stats?.devices?.online || 0} çevrimiçi`, icon: Cpu },
    { label: 'Destek Talepleri', value: stats?.faultReports?.total || 0, sub: `${stats?.faultReports?.pending || 0} beklemede`, icon: AlertTriangle },
    { label: 'Ölçüm (24s)', value: stats?.measurements?.last24h || 0, sub: 'Son 24 saat', icon: Activity },
  ]

  return (
    <div className="space-y-6 bg-slate-50 min-h-screen text-slate-800">
      
      {/* Üst Başlık Alanı */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Yönetici Paneli</h1>
        <p className="text-slate-500 text-sm mt-0.5 font-medium">Sistem genel durumu ve acil durum kontrolü</p>
      </div>

      {/* İSTATİSTİK KARTLARI — Kırmızı Arka Plan, Beyaz Yazı */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s, idx) => (
          <div 
            key={idx} 
            className="rounded-2xl p-5 text-white shadow-md shadow-red-900/5 border border-red-700/10 transform transition-all hover:scale-[1.01]"
            style={{ background: 'linear-gradient(135deg, #ef4444, #b91c1c)' }}
          >
            <div className="flex items-start justify-between mb-3">
              <p className="text-xs font-bold uppercase tracking-widest text-red-100 opacity-90">{s.label}</p>
              <div className="w-8 h-8 bg-white/15 border border-white/20 rounded-xl flex items-center justify-center">
                <s.icon className="w-4 h-4 text-white" />
              </div>
            </div>
            <p className="text-3xl font-black tracking-tight mb-1">{s.value}</p>
            <p className="text-xs font-medium text-red-100/80 font-mono">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* ALT SEÇENEKLER: HIZLI ERİŞİM VE SİSTEM ÖZETİ (Aydınlık Kart Yapısı) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Hızlı Erişim Paneli */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">Hızlı Erişim</h2>
          <div className="space-y-2">
            {[
              { to: '/admin/users', icon: Users, label: 'Kullanıcı Yönetimi', color: 'text-red-500' },
              { to: '/admin/faults', icon: AlertTriangle, label: 'Destek Talepleri', color: 'text-red-500' },
            ].map((item) => (
              <Link 
                key={item.to} 
                to={item.to} 
                className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 bg-slate-50 hover:bg-red-50/50 hover:border-red-200 text-slate-700 hover:text-red-600 transition-all font-semibold text-sm group"
              >
                <div className="flex items-center gap-3">
                  <item.icon className={`w-4 h-4 ${item.color}`} />
                  <span>{item.label}</span>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-red-500 transition-colors" />
              </Link>
            ))}
          </div>
        </div>

        {/* Sistem Özeti Alanı */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">Sistem Özeti</h2>
          <div className="space-y-3.5 text-sm font-semibold">
            
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
              <span className="text-slate-400 font-medium">Çevrimiçi Cihazlar</span>
              <span className="font-mono text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-md border border-slate-200">
                <span className="text-red-600 font-bold">{stats?.devices?.online || 0}</span> / {stats?.devices?.total || 0}
              </span>
            </div>

            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
              <span className="text-slate-400 font-medium">Bekleyen Talepler</span>
              <span className="font-mono text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-md border border-amber-100 font-bold">
                {stats?.faultReports?.pending || 0} talep
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-medium">Aktif Kullanıcılar</span>
              <span className="font-mono text-red-600 bg-red-50 px-2.5 py-0.5 rounded-md border border-red-100 font-bold">
                {stats?.users?.activeLastWeek || 0} kullanıcı
              </span>
            </div>

          </div>
        </div>

      </div>
    </div>
  )
}

export default AdminDashboard