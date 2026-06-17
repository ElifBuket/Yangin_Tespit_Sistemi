import { useState, useEffect } from 'react'
import { Cpu, Wifi, WifiOff, Clock } from 'lucide-react'
import api from '../utils/api'
import { format } from 'date-fns'

const Devices = () => {
  const [devices, setDevices] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { 
    fetchDevices() 
  }, [])

  const fetchDevices = async () => {
    try {
      const res = await api.get('/api/user/devices')
      setDevices(res.data.data)
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

  return (
    <div className="space-y-6 bg-slate-50 min-h-screen text-slate-800">
      
      {/* Üst Başlık Alanı */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Cihazlar</h1>
        <p className="text-slate-500 text-sm mt-0.5 font-medium">ESP32 cihazlarınızı yönetin</p>
      </div>

      {/* Cihaz Kartları Listesi */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {devices.map((device) => {
          const isOnline = device.status === 'online'
          return (
            <div 
              key={device._id} 
              className="rounded-2xl p-5 text-white shadow-md shadow-red-900/10 border border-red-700/10 transform transition-all hover:scale-[1.01]"
              style={{ background: 'linear-gradient(135deg, #ef4444, #b91c1c)' }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  {/* Mikroçip İkonu */}
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/15 border border-white/20 shadow-sm">
                    <Cpu className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-black text-white text-sm tracking-wide">{device.name}</h3>
                    <p className="text-xs text-red-100/70 font-mono mt-0.5">{device.deviceId}</p>
                  </div>
                </div>
                
                {/* Durum Rozeti */}
                <span className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-bold bg-white/15 border border-white/10 text-white">
                  {isOnline ? <Wifi className="w-3 h-3 text-white animate-pulse" /> : <WifiOff className="w-3 h-3 text-red-200" />}
                  {isOnline ? 'Çevrimiçi' : 'Çevrimdışı'}
                </span>
              </div>

              {/* Detay Alanları */}
              <div className="space-y-2.5 text-xs font-bold border-t border-white/10 pt-3">
                <div className="flex justify-between items-center">
                  <span className="text-red-100/70 font-medium">Cihaz Tipi</span>
                  <span className="text-white font-mono bg-white/15 px-2 py-0.5 rounded-md border border-white/5">{device.type}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-red-100/70 font-medium">Sistem Durumu</span>
                  <span className="text-white font-black">
                    {device.systemStatus === 'started' ? '● Aktif' : '○ Kapalı'}
                  </span>
                </div>
                {device.lastSeen && (
                  <div className="flex justify-between items-center">
                    <span className="text-red-100/70 font-medium flex items-center gap-1">
                      <Clock className="w-3 h-3 text-red-200" /> Son Görülme
                    </span>
                    <span className="text-white font-mono">{format(new Date(device.lastSeen), 'HH:mm:ss')}</span>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Boş Durum Tasarımı (Hiç cihaz yoksa) */}
      {devices.length === 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl text-center py-14 shadow-sm">
          <Cpu className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <h3 className="font-bold text-slate-800 mb-1">Henüz cihaz yok</h3>
          <p className="text-slate-400 text-sm font-medium">Sistemde tanımlı ESP32 cihazı bulunamadı.</p>
        </div>
      )}
    </div>
  )
}

export default Devices