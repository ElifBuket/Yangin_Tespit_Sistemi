import { useState, useEffect } from 'react'
import { AlertTriangle, Loader2, Save, X, User, Mail, MapPin } from 'lucide-react'
import api from '../../utils/api'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

const AdminFaults = () => {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('pending')
  const [selectedReport, setSelectedReport] = useState(null)
  const [updateData, setUpdateData] = useState({
    status: '',
    adminNotes: '',
  })

  useEffect(() => {
    fetchReports()
  }, [filter])

  const fetchReports = async () => {
    try {
      const params = filter !== 'all' ? `?status=${filter}` : ''
      const response = await api.get(`/api/admin/fault-reports${params}`)
      setReports(response.data.data)
    } catch (error) {
      console.error('Fetch reports error:', error)
      toast.error('Talepler yüklenirken hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = async (e) => {
    e.preventDefault()
    
    try {
      await api.put(`/api/admin/fault-reports/${selectedReport._id}`, updateData)
      toast.success('Arıza bildirimi güncellendi')
      setSelectedReport(null)
      fetchReports()
    } catch (error) {
      console.error('Update report error:', error)
      toast.error('Güncelleme sırasında bir hata oluştu')
    }
  }

  const openReport = (report) => {
    setSelectedReport(report)
    setUpdateData({
      status: report.status,
      adminNotes: report.adminNotes || '',
    })
  }

  const statusColors = {
    pending: 'bg-amber-50 text-amber-600 border border-amber-200',
    in_progress: 'bg-blue-50 text-blue-600 border border-blue-200',
    resolved: 'bg-green-50 text-green-600 border border-green-200',
    closed: 'bg-slate-100 text-slate-500 border border-slate-200',
  }

  const priorityColors = {
    low: 'bg-slate-100 text-slate-500 border border-slate-200',
    medium: 'bg-amber-50 text-amber-600 border border-amber-200',
    high: 'bg-orange-50 text-orange-600 border border-orange-200',
    critical: 'bg-red-50 text-red-600 border border-red-200',
  }

  const statusLabels = {
    all: 'Tümü',
    pending: 'Beklemede',
    in_progress: 'İşlemde',
    resolved: 'Çözüldü',
    closed: 'Kapatıldı'
  }

  const priorityLabels = {
    low: 'Düşük',
    medium: 'Orta',
    high: 'Yüksek',
    critical: 'Kritik',
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96 bg-slate-50">
        <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6 bg-slate-50 min-h-screen text-slate-800">
      
      {/* Üst Başlık Alanı */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Arıza Yönetimi</h1>
        <p className="text-slate-500 text-sm mt-0.5 font-medium">Kullanıcı arıza bildirimlerini yönetin</p>
      </div>

      {/* Durum Filtreleme Buton Barı */}
      <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-sm flex flex-wrap gap-2">
        {['all', 'pending', 'in_progress', 'resolved', 'closed'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              filter === status
                ? 'text-white shadow-sm shadow-red-500/10'
                : 'text-slate-500 bg-slate-50 hover:bg-slate-100 border border-slate-200'
            }`}
            style={filter === status ? { background: 'linear-gradient(135deg, #ef4444, #b91c1c)' } : {}}
          >
            {statusLabels[status]}
          </button>
        ))}
      </div>

      {/* Talepler Listesi */}
      <div className="space-y-4">
        {reports.map((report) => (
          <div 
            key={report._id} 
            className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm transition-all hover:shadow-md cursor-pointer hover:border-red-300"
            onClick={() => openReport(report)}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1 pr-4">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <h3 className="font-bold text-slate-800 text-base">{report.title}</h3>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${statusColors[report.status]}`}>
                    {statusLabels[report.status]}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${priorityColors[report.priority]}`}>
                    {priorityLabels[report.priority]}
                  </span>
                </div>
                <p className="text-sm text-slate-500 font-medium">{report.description}</p>
              </div>
            </div>

            {/* Alt Bilgi Satırı */}
            <div className="flex flex-wrap items-center gap-2.5 text-xs font-semibold text-slate-400 border-t border-slate-50 pt-3">
              <span className="text-slate-700 font-bold bg-slate-100 px-2 py-0.5 border border-slate-200 rounded-md">
                {report.user?.name}
              </span>
              <span>•</span>
              <span className="text-slate-500 font-mono text-[11px]">{report.user?.email}</span>
              <span>•</span>
              <span>{format(new Date(report.createdAt), 'dd/MM/yyyy HH:mm')}</span>
              {report.deviceId && (
                <>
                  <span>•</span>
                  <span className="font-mono bg-slate-50 px-2 py-0.5 border border-slate-100 rounded text-slate-500">{report.deviceId}</span>
                </>
              )}
            </div>

            {report.adminNotes && (
              <div className="mt-3 p-3 bg-red-50/60 rounded-xl border-l-4 border-red-500 text-xs">
                <p className="font-bold text-red-600 uppercase tracking-wider mb-0.5">Mevcut Çözüm Notu:</p>
                <p className="text-slate-700 font-semibold">{report.adminNotes}</p>
              </div>
            )}
          </div>
        ))}

        {/* Görseldeki "Arıza Bildirimi Yok" Boş Durum Tasarımı (Kırmızı-Beyaz Uyarlandı) */}
        {reports.length === 0 && (
          <div className="bg-white border border-slate-200 rounded-3xl text-center py-20 shadow-sm">
            <div className="w-16 h-16 bg-red-50 border border-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-bounce duration-1000">
              <AlertTriangle className="w-7 h-7 text-red-500" />
            </div>
            <h3 className="text-lg font-black text-slate-800 mb-1 tracking-tight">Arıza bildirimi yok</h3>
            <p className="text-slate-400 text-sm font-semibold max-w-xs mx-auto">Bu filtreye veya kritere uygun herhangi bir aktif arıza bildirimi bulunmuyor.</p>
          </div>
        )}
      </div>

      {/* Detay ve Güncelleme Modalı (Aydınlık Mod) */}
      {selectedReport && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full p-6 shadow-xl max-h-[90vh] overflow-y-auto relative animate-in fade-in zoom-in-95 duration-150">
            
            <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">Arıza Detayı</h2>
              <button 
                onClick={() => setSelectedReport(null)} 
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-5">
              {/* Talep İçeriği */}
              <div className="bg-slate-50 p-4 border border-slate-100 rounded-xl">
                <h3 className="font-bold text-slate-800 text-base mb-1">{selectedReport.title}</h3>
                <p className="text-sm text-slate-500 font-medium leading-relaxed">{selectedReport.description}</p>
              </div>

              {/* Kullanıcı Bilgileri Paneli */}
              <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-red-500" /> Kullanıcı Bilgileri
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-semibold text-slate-600">
                  <p><span className="text-slate-400 font-medium">Ad Soyad:</span> <span className="text-slate-800 font-bold">{selectedReport.user?.name}</span></p>
                  <p><span className="text-slate-400 font-medium">E-posta:</span> <span className="text-slate-700 font-mono">{selectedReport.user?.email}</span></p>
                  <p className="sm:col-span-2 flex items-start gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-300 flex-shrink-0 mt-0.5" />
                    <span>
                      <span className="text-slate-400 font-medium">Adres:</span> {selectedReport.user?.address?.street}, {selectedReport.user?.address?.city}
                    </span>
                  </p>
                </div>
              </div>

              {/* Güncelleme Formu */}
              <form onSubmit={handleUpdate} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Talep Durumu</label>
                  <select
                    value={updateData.status}
                    onChange={(e) => setUpdateData({ ...updateData, status: e.target.value })}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:border-red-500 focus:bg-white transition-all"
                  >
                    <option value="pending">Beklemede</option>
                    <option value="in_progress">İşlemde</option>
                    <option value="resolved">Çözüldü</option>
                    <option value="closed">Kapatıldı</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Çözüm / Admin Notu</label>
                  <textarea
                    value={updateData.adminNotes}
                    onChange={(e) => setUpdateData({ ...updateData, adminNotes: e.target.value })}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-red-500 focus:bg-white transition-all min-h-[100px]"
                    placeholder="Kullanıcıya görünecek çözüm notlarını buraya ekleyin..."
                  />
                </div>

                {/* Güncelle Butonu */}
                <button 
                  type="submit" 
                  className="w-full flex items-center justify-center gap-2 text-sm font-bold text-white py-2.5 rounded-xl hover:opacity-90 transition-all shadow-sm"
                  style={{ background: 'linear-gradient(135deg, #ef4444, #b91c1c)' }}
                >
                  <Save className="w-4 h-4" />
                  Durumu Güncelle
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminFaults