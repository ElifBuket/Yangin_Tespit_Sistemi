import { useState, useEffect } from 'react'
import { AlertTriangle, Plus, Loader2, X } from 'lucide-react'
import api from '../utils/api'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

const FaultReports = () => {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'other',
    priority: 'medium',
    deviceId: '',
  })

  useEffect(() => {
    fetchReports()
  }, [])

  const fetchReports = async () => {
    try {
      const response = await api.get('/api/user/fault-reports')
      setReports(response.data.data)
    } catch (error) {
      console.error('Fetch reports error:', error)
    } finally {
      setLoading(false)
    }
  }

  const quickTemplates = [
    {
      title: 'Cihaz sayımı arttırmak istiyorum',
      description: 'Mevcut cihazlarıma ek olarak yeni cihaz eklemek istiyorum. Lütfen benimle iletişime geçin.',
      category: 'other',
      priority: 'medium'
    },
    {
      title: 'RFID kartımı kaybettim',
      description: 'MASTER RFID kartımı kaybettim. Yeni kart tanımlaması yapılması gerekiyor.',
      category: 'other',
      priority: 'high'
    },
    {
      title: 'Cihaz çevrimdışı',
      description: 'Cihazım sürekli çevrimdışı görünüyor. Bağlantı sorunu olabilir.',
      category: 'device_offline',
      priority: 'high'
    },
    {
      title: 'Yanlış alarm alıyorum',
      description: 'Hareket olmadığı halde sürekli alarm maili alıyorum. Hassasiyet ayarı gerekebilir.',
      category: 'false_alarm',
      priority: 'medium'
    }
  ];

  const useTemplate = (template) => {
    setFormData({
      ...formData,
      title: template.title,
      description: template.description,
      category: template.category,
      priority: template.priority
    });
    toast.success('Şablon uygulandı');
  };

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      await api.post('/api/user/fault-report', formData)
      toast.success('Arıza bildirimi gönderildi')
      setShowModal(false)
      setFormData({ title: '', description: '', category: 'other', priority: 'medium', deviceId: '' })
      fetchReports()
    } catch (error) {
      console.error('Submit report error:', error)
    }
  }

  const statusLabels = {
    pending: 'Beklemede',
    in_progress: 'İşlemde',
    resolved: 'Çözüldü',
    closed: 'Kapatıldı',
  };

  // Aydınlık mod durum rozeti renkleri
  const statusColors = {
    pending: 'bg-amber-50 text-amber-600 border border-amber-200',
    in_progress: 'bg-blue-50 text-blue-600 border border-blue-200',
    resolved: 'bg-green-50 text-green-600 border border-green-200',
    closed: 'bg-slate-100 text-slate-500 border border-slate-200',
  }
  
  const priorityLabels = {
    low: 'Düşük',
    medium: 'Orta',
    high: 'Yüksek',
    critical: 'Kritik',
  };

  const categoryLabels = {
    device_offline: 'Cihaz Çevrimdışı',
    sensor_error: 'Sensör Hatası',
    false_alarm: 'Yanlış Alarm',
    connection_issue: 'Bağlantı Sorunu',
    other: 'Diğer',
  };

  // Aydınlık mod öncelik rozeti renkleri
  const priorityColors = {
    low: 'bg-slate-100 text-slate-500 border border-slate-200',
    medium: 'bg-amber-50 text-amber-600 border border-amber-200',
    high: 'bg-orange-50 text-orange-600 border border-orange-200',
    critical: 'bg-red-50 text-red-600 border border-red-200',
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
      
      {/* Üst Başlık Alnı */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Arıza Bildirimleri</h1>
          <p className="text-slate-500 text-sm mt-0.5 font-medium">Sorunlarınızı bildirin</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 text-sm font-bold text-white px-4 py-2.5 rounded-xl transition-all shadow-sm hover:opacity-90"
          style={{ background: 'linear-gradient(135deg, #ef4444, #b91c1c)' }}
        >
          <Plus className="w-5 h-5" />
          Arıza Bildir
        </button>
      </div>

      {/* Bildirim Kartları Listesi */}
      <div className="space-y-4">
        {reports.map((report) => (
          <div key={report._id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm transition-all hover:shadow-md">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1 pr-4">
                <h3 className="font-bold text-slate-800 text-base">{report.title}</h3>
                <p className="text-sm text-slate-500 mt-1 font-medium">{report.description}</p>
              </div>
              <div className="flex gap-2 text-xs font-bold">
                <span className={`px-2.5 py-1 rounded-full ${statusColors[report.status]}`}>
                  {statusLabels[report.status]}
                </span>
                <span className={`px-2.5 py-1 rounded-full ${priorityColors[report.priority]}`}>
                  {priorityLabels[report.priority]}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs font-semibold text-slate-400 border-t border-slate-50 pt-3">
              <span>{format(new Date(report.createdAt), 'dd/MM/yyyy HH:mm')}</span>
              <span>•</span>
              <span className="text-slate-500">{categoryLabels[report.category]}</span>
              {report.deviceId && (
                <>
                  <span>•</span>
                  <span className="font-mono bg-slate-50 px-2 py-0.5 border border-slate-100 rounded text-slate-600">{report.deviceId}</span>
                </>
              )}
            </div>

            {/* Admin Notu — Yumuşak kırmızı panel ile dikkat çekici hale getirildi */}
            {report.adminNotes && (
              <div className="mt-4 p-3 bg-red-50/60 rounded-xl border-l-4 border-red-500">
                <p className="text-xs font-bold text-red-600 uppercase tracking-wider mb-0.5">Admin Notu:</p>
                <p className="text-sm text-slate-700 font-semibold">{report.adminNotes}</p>
              </div>
            )}
          </div>
        ))}

        {/* Boş Durum Tasarımı */}
        {reports.length === 0 && (
          <div className="bg-white border border-slate-200 rounded-2xl text-center py-14 shadow-sm">
            <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <h3 className="font-bold text-slate-800 mb-1">Henüz arıza bildirimi yok</h3>
            <p className="text-slate-400 text-sm mb-4 font-medium">Bir sorun yaşadığınızda buradan bildirebilirsiniz</p>
            <button 
              onClick={() => setShowModal(true)} 
              className="inline-flex items-center gap-2 text-sm font-bold text-white px-4 py-2 rounded-xl shadow-sm hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #ef4444, #b91c1c)' }}
            >
              <Plus className="w-4 h-4" /> Arıza Bildir
            </button>
          </div>
        )}
      </div>

      {/* Arıza Bildirim Modalı (Aydınlık Mod) */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full p-6 shadow-xl max-h-[90vh] overflow-y-auto relative animate-in fade-in zoom-in-95 duration-150">
            
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-slate-900">Arıza Bildir</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-50 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            {/* Hızlı Şablonlar — Kırmızı aydınlık tasarıma uyarlandı */}
            <div className="mb-6">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">Hızlı Şablonlar:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {quickTemplates.map((template, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => useTemplate(template)}
                    className="text-left p-3 bg-slate-50 hover:bg-red-50/40 border border-slate-200 hover:border-red-200 rounded-xl text-sm transition-all shadow-sm"
                  >
                    <p className="font-bold text-red-600 text-xs">{template.title}</p>
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Başlık</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-red-500 focus:bg-white transition-all"
                  placeholder="Kısa ve net bir başlık"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Açıklama</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-red-500 focus:bg-white transition-all min-h-[100px]"
                  placeholder="Yaşadığınız sorunu buraya detaylıca yazın..."
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Kategori</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:border-red-500 focus:bg-white transition-all"
                  >
                    <option value="device_offline">Cihaz Çevrimdışı</option>
                    <option value="sensor_error">Sensör Hatası</option>
                    <option value="false_alarm">Yanlış Alarm</option>
                    <option value="connection_issue">Bağlantı Sorunu</option>
                    <option value="other">Diğer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Öncelik Seviyesi</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:border-red-500 focus:bg-white transition-all"
                  >
                    <option value="low">Düşük</option>
                    <option value="medium">Orta</option>
                    <option value="high">Yüksek</option>
                    <option value="critical">Kritik</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Cihaz ID (Opsiyonel)</label>
                <input
                  type="text"
                  value={formData.deviceId}
                  onChange={(e) => setFormData({ ...formData, deviceId: e.target.value })}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-red-500 focus:bg-white transition-all"
                  placeholder="örn: esp32_rfid"
                />
              </div>

              {/* Form Aksiyon Butonları */}
              <div className="flex gap-3 pt-2">
                <button 
                  type="submit" 
                  className="flex-1 text-sm font-bold text-white py-2.5 rounded-xl hover:opacity-90 transition-all shadow-sm"
                  style={{ background: 'linear-gradient(135deg, #ef4444, #b91c1c)' }}
                >
                  Talebi Gönder
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 text-sm font-bold text-slate-500 bg-slate-100 border border-slate-200 py-2.5 rounded-xl hover:bg-slate-200/70 transition-all"
                >
                  İptal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default FaultReports