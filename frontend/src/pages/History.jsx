import { useState, useEffect } from 'react'
import { Calendar, Wind, Loader2 } from 'lucide-react'
import api from '../utils/api'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

const History = () => {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    deviceId: '',
    startDate: '',
    endDate: '',
    limit: 100,
  })

  useEffect(() => {
    fetchHistory()
  }, [])

  const fetchHistory = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters.deviceId) params.append('deviceId', filters.deviceId)
      if (filters.startDate) params.append('startDate', filters.startDate)
      if (filters.endDate) params.append('endDate', filters.endDate)
      params.append('limit', filters.limit)

      const response = await api.get(`/api/user/sensor-data?${params}`)
      setData(response.data.data)
    } catch (error) {
      console.error('Fetch history error:', error)
      toast.error('Veriler yüklenirken hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  const validateDate = (dateString) => {
    if (!dateString) return true;
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateString)) return false;
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date);
  };

  const handleFilter = (e) => {
    e.preventDefault()
    
    if (filters.startDate && !validateDate(filters.startDate)) {
      toast.error('Başlangıç tarihi geçersiz format (YYYY-MM-DD)');
      return;
    }
    if (filters.endDate && !validateDate(filters.endDate)) {
      toast.error('Bitiş tarihi geçersiz format (YYYY-MM-DD)');
      return;
    }
    
    if (filters.startDate && filters.endDate) {
      const start = new Date(filters.startDate);
      const end = new Date(filters.endDate);
      if (start > end) {
        toast.error('Başlangıç tarihi bitiş tarihinden sonra olamaz');
        return;
      }
    }
    
    fetchHistory()
  }

  const getGasLevelColor = (level) => {
    switch (level) {
      case 'danger': return 'bg-red-50 text-red-600 border border-red-100'
      case 'warning': return 'bg-amber-50 text-amber-600 border border-amber-100'
      case 'safe': return 'bg-green-50 text-green-600 border border-green-100'
      default: return 'bg-slate-100 text-slate-500 border border-slate-200'
    }
  }

  const getGasLevelText = (level) => {
    switch (level) {
      case 'danger': return 'TEHLİKE'
      case 'warning': return 'UYARI'
      case 'safe': return 'GÜVENLİ'
      default: return '-'
    }
  }

  return (
    <div className="space-y-6 bg-slate-50 min-h-screen text-slate-800">
      
      {/* Üst Başlık Alanı — PyroGuard ile Uyumlu Hale Getirildi */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Geçmiş Kayıtlar</h1>
        <p className="text-slate-500 text-sm mt-0.5 font-medium">Sensör ve erken yangın tespit loglarınızı görüntüleyin</p>
      </div>

      {/* Filtreleme Paneli */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <form onSubmit={handleFilter} className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Cihaz</label>
            <select
              value={filters.deviceId}
              onChange={(e) => setFilters({ ...filters, deviceId: e.target.value })}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:border-red-500 focus:bg-white transition-all"
            >
              <option value="">Tümü</option>
              <option value="esp32_rfid">ESP32-RFID</option>
              <option value="esp32_env">ESP32-ENV (Yangın Sensörü)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Başlangıç</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:border-red-500 focus:bg-white transition-all"
              max={new Date().toISOString().split('T')[0]}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Bitiş</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:border-red-500 focus:bg-white transition-all"
              max={new Date().toISOString().split('T')[0]}
            />
          </div>

          {/* Kırmızı Tonlu Filtreleme Butonu */}
          <div className="flex items-end">
            <button 
              type="submit" 
              className="w-full text-sm font-bold text-white py-2.5 rounded-xl hover:opacity-90 transition-all shadow-sm"
              style={{ background: 'linear-gradient(135deg, #ef4444, #b91c1c)' }}
            >
              Filtrele
            </button>
          </div>
        </form>
      </div>

      {/* Veri Tablosu */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm overflow-x-auto">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-12 h-12 animate-spin text-red-500" />
          </div>
        ) : data.length > 0 ? (
          <table className="w-full text-sm text-slate-700">
            <thead className="border-b border-slate-100">
              <tr className="text-left text-slate-400 text-xs uppercase tracking-wider font-bold">
                <th className="pb-3 font-bold">Zaman</th>
                <th className="pb-3 font-bold">Cihaz</th>
                <th className="pb-3 font-bold">Yoğunluk (PPM)</th>
                <th className="pb-3 font-bold">Risk Seviyesi</th>
                <th className="pb-3 font-bold">Durum</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-semibold text-sm">
              {data.map((item) => (
                <tr key={item._id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 text-slate-600 font-medium">{format(new Date(item.timestamp), 'dd/MM/yyyy HH:mm:ss')}</td>
                  <td className="py-3.5">
                    <span className="text-slate-700 font-mono text-xs">{item.deviceId}</span>
                  </td>
                  <td className="py-3.5">
                    <span className="font-mono bg-slate-50 px-2 py-0.5 border border-slate-100 rounded text-slate-900">{item.gasPPM ? item.gasPPM.toFixed(0) : '-'}</span>
                  </td>
                  <td className="py-3.5">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${getGasLevelColor(item.gasLevel)}`}>
                      {getGasLevelText(item.gasLevel)}
                    </span>
                  </td>
                  <td className="py-3.5">
                    {item.gasDetected ? (
                      <span className="px-2.5 py-1 bg-red-100 text-red-600 border border-red-200 rounded-full text-xs font-bold animate-pulse">
                        TEHLİKE ALGILANDI
                      </span>
                    ) : (
                      <span className="text-slate-400 font-medium text-xs">Normal</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-center py-12 text-slate-400 font-medium">
            <Wind className="w-12 h-12 mx-auto mb-3 opacity-30 text-red-500" />
            <p className="text-slate-500 font-bold">Kayıt bulunamadı</p>
            <p className="text-xs text-slate-400 mt-1">Belirtilen kriterlere uygun geçmiş aktivite logu mevcut değil.</p>
          </div>
        )}
      </div>

      {/* Alt Bilgi Kartı */}
      {data.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center justify-between"
          style={{ borderLeft: '4px solid #ef4444' }}>
          <p className="text-xs font-bold text-slate-600">
            <span className="text-red-600">{data.length}</span> adet log kaydı başarıyla listelendi. 
            {data.length >= filters.limit && ' Daha eski verileri incelemek için limit sınırını yükseltebilirsiniz.'}
          </p>
        </div>
      )}
    </div>
  )
}

export default History