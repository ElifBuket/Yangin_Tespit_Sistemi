import { useState, useEffect } from 'react'
import {
  Activity, Wind, AlertTriangle, Volume2, VolumeX,
  Cpu, TrendingUp, Zap, Shield, Radio, Flame, Sparkles
} from 'lucide-react'
import {
  AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine
} from 'recharts'
import { useAuthStore } from '../store/authStore'
import { getSocket } from '../utils/socket'
import api from '../utils/api'
import toast from 'react-hot-toast'

// Kırmızı-Beyaz Temaya Uygun Custom Tooltip
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const val = payload[0].value
    const level = val >= 3000 ? 'danger' : val >= 1000 ? 'warning' : 'safe'
    const colors = { danger: '#ef4444', warning: '#f59e0b', safe: '#16a34a' }
    return (
      <div style={{
        background: '#ffffff',
        border: `1px solid ${colors[level]}`,
        borderRadius: 12,
        padding: '10px 14px',
        boxShadow: '0 4px 15px rgba(0, 0, 0, 0.05)'
      }}>
        <p style={{ color: '#64748b', fontSize: 11, marginBottom: 4 }}>{label}</p>
        <p style={{ color: colors[level], fontSize: 18, fontWeight: 700, margin: 0 }}>
          {val?.toFixed(0)} <span style={{ fontSize: 11, fontWeight: 400, color: '#64748b' }}>PPM</span>
        </p>
      </div>
    )
  }
  return null
}

const AnimatedValue = ({ value }) => (
  <span className="tabular-nums">{value?.toLocaleString('tr-TR') || 0}</span>
)

const Dashboard = () => {
  const { user } = useAuthStore()
  const [devices, setDevices] = useState([])
  const [realtimeData, setRealtimeData] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [systemStatus, setSystemStatus] = useState('stopped')
  const [lastUpdate, setLastUpdate] = useState(null)
  
  // ⭐ PYROGUARD AI STATE
  const [aiData, setAiData] = useState({ sourceType: 'Analiz Bekleniyor...', isFalseAlarm: false })

  useEffect(() => {
    fetchData()
    const socket = getSocket()

    socket.on('gas_update', (data) => {
      if (!data) return;
      setLastUpdate(new Date())
      
      // ⭐ PYROGUARD AI SET: Soketten gelen yapay zeka çıktısını güvenli şekilde state'e yaz
      if (data.ai_source_type) {
        setAiData({
          sourceType: data.ai_source_type,
          isFalseAlarm: !!data.ai_is_false_alarm
        })
      }

      // Hata Toleranslı PPM Yakalama (Büyük/Küçük harf esnekliği sağlandı)
      const incomingPPM = typeof data.gasPPM !== 'undefined' ? data.gasPPM : (data.gas_ppm || 0);
      const safePPM = Math.max(0, incomingPPM); 

      setRealtimeData((prev) => {
        const newData = [...prev, {
          ...data,
          time: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          ppm: safePPM
        }]
        return newData.slice(-25)
      })

      setDevices((prev) =>
        prev.map((d) =>
          d.deviceId === data.deviceId
            ? { 
                ...d, 
                buzzerActive: typeof data.buzzerActive !== 'undefined' ? data.buzzerActive : d.buzzerActive, 
                gasLevel: data.gasLevel || data.gas_level || 'safe' 
              }
            : d
        )
      )
    })

    socket.on('system_status', (data) => {
      setSystemStatus(data.status)
      toast(data.status === 'started' ? '🔴 Sistem aktif edildi' : '⚪ Sistem durduruldu')
    })

    socket.on('device_status', (data) => {
      setDevices((prev) =>
        prev.map((d) =>
          d.deviceId === data.deviceId ? { ...d, status: data.status } : d
        )
      )
    })

    socket.on('buzzer_muted', () => {
      setDevices((prev) => prev.map(d => ({ ...d, buzzerActive: false })))
    })

    return () => {
      socket.off('gas_update')
      socket.off('system_status')
      socket.off('device_status')
      socket.off('buzzer_muted')
    }
  }, [])

  const fetchData = async () => {
    try {
      const [devicesRes, statsRes] = await Promise.all([
        api.get('/api/user/devices'),
        api.get('/api/user/stats?period=24h'),
      ])
      setDevices(devicesRes.data.data || [])
      setStats(statsRes.data.data || {})
      const anyStarted = devicesRes.data.data?.some(d => d.systemStatus === 'started')
      setSystemStatus(anyStarted ? 'started' : 'stopped')
    } catch {
      toast.error('Veriler yüklenemedi')
      setDevices([])
      setStats({})
    } finally {
      setLoading(false)
    }
  }

  const getGasColor = (level) => {
    if (level === 'danger') return '#ef4444'
    if (level === 'warning') return '#f59e0b'
    return '#16a34a'
  }

  const getGasLabel = (level) => {
    if (level === 'danger') return 'TEHLİKE'
    if (level === 'warning') return 'UYARI'
    if (level === 'safe') return 'GÜVENLİ'
    return 'GÜVENLİ'
  }

  const latestPPM = realtimeData.length > 0 ? realtimeData[realtimeData.length - 1]?.ppm : 0
  const currentLevel = latestPPM >= 3000 ? 'danger' : latestPPM >= 1000 ? 'warning' : 'safe'

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="text-center space-y-4">
          <div className="relative w-16 h-16 mx-auto">
            <div className="absolute inset-0 rounded-full border-2 border-red-500/20" />
            <div className="absolute inset-0 rounded-full border-2 border-red-500 border-t-transparent animate-spin" />
            <div className="absolute inset-3 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(239,68,68,0.1)' }}>
              <Flame className="w-5 h-5 text-red-500" />
            </div>
          </div>
          <p className="text-slate-500 text-sm font-medium">Sistem yükleniyor...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 bg-slate-50 p-6 min-h-screen text-slate-800">

      {/* ── HEADER ── */}
      <div className="fade-in-up flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-1.5 h-6 rounded-full" style={{ background: 'linear-gradient(to bottom, #ef4444, #b91c1c)' }} />
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
          </div>
          <p className="text-slate-500 text-sm ml-3.5">Hoş geldiniz, <span className="text-slate-800 font-semibold">{user?.name}</span></p>
        </div>

        <div className="flex items-center gap-3">
          {lastUpdate && (
            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
              <Radio className="w-3 h-3 text-red-500 animate-pulse" />
              {lastUpdate.toLocaleTimeString('tr-TR')}
            </div>
          )}
          <div className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-500`} style={{
            background: systemStatus === 'started' ? 'linear-gradient(135deg, rgba(239,68,68,0.1), rgba(239,68,68,0.02))' : '#ffffff',
            border: systemStatus === 'started' ? '1px solid rgba(239,68,68,0.3)' : '1px solid #e2e8f0',
            color: systemStatus === 'started' ? '#dc2626' : '#64748b'
          }}>
            <span className={`w-2 h-2 rounded-full ${systemStatus === 'started' ? 'bg-red-500 animate-pulse' : 'bg-slate-300'}`} />
            {systemStatus === 'started' ? 'Sistem Aktif' : 'Sistem Kapalı'}
          </div>
        </div>
      </div>

      {/* ── STAT CARDS ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Toplam Ölçüm', value: stats?.totalMeasurements || 0, icon: Activity, delay: 'fade-in-up-1', border: 'border-slate-200', iconColor: 'text-red-500', glow: 'rgba(239,68,68,0.03)' },
          { label: 'Ort. Gaz (PPM)', value: stats?.avgGasPPM || 0, icon: Wind, delay: 'fade-in-up-2', border: 'border-slate-200', iconColor: 'text-slate-600', glow: 'rgba(100,116,139,0.03)' },
          { label: 'Gaz Algılama', value: stats?.gasDetections || 0, icon: AlertTriangle, delay: 'fade-in-up-3', border: 'border-slate-200', iconColor: 'text-amber-600', glow: 'rgba(245,158,11,0.03)' },
          { label: 'Kritik Durum', value: stats?.dangerCount || 0, icon: Zap, delay: 'fade-in-up-4', border: 'border-red-200', iconColor: 'text-red-600', glow: 'rgba(239,68,68,0.06)' },
        ].map((s) => (
          <div key={s.label} className={`border ${s.border} ${s.delay} p-5 rounded-2xl shadow-sm`} style={{ background: `linear-gradient(135deg, ${s.glow}, #ffffff)` }}>
            <div className="flex items-start justify-between mb-4">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <s.icon className={`w-4 h-4 ${s.iconColor}`} />
              </div>
              <TrendingUp className="w-3.5 h-3.5 text-slate-300" />
            </div>
            <p className="text-3xl font-bold text-slate-900 mb-1">
              <AnimatedValue value={s.value} />
            </p>
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">{s.label}</p>
          </div>
        ))}
      </div>

      {/* ── ÜST ROW: CANLI GRAFİK + ANLIK ÖLÇÜM (YAN YANA ORANTILI) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 fade-in-up-2">
        
        {/* Canlı Gaz Grafiği (Sol Taraf - 2/3 Genişlik) */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)' }}>
                <Activity className="w-3.5 h-3.5 text-red-500" />
              </div>
              Canlı Gaz Grafiği
            </h2>
            <div className="flex items-center gap-4 text-xs font-semibold text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 rounded" style={{ background: '#f59e0b' }} />
                Uyarı (1000)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 rounded" style={{ background: '#ef4444' }} />
                Tehlike (3000)
              </span>
            </div>
          </div>

          {realtimeData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={realtimeData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="gasGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ef4444" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="time" stroke="transparent" tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 500 }} tickLine={false} axisLine={false} />
                <YAxis stroke="transparent" tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 500 }} tickLine={false} axisLine={false} width={40} />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine y={1000} stroke="#f59e0b" strokeDasharray="6 3" strokeOpacity={0.7} strokeWidth={1} />
                <ReferenceLine y={3000} stroke="#ef4444" strokeDasharray="6 3" strokeOpacity={0.7} strokeWidth={1} />
                <Area type="monotone" dataKey="ppm" stroke="#ef4444" strokeWidth={2.5} fill="url(#gasGradient)" dot={false} activeDot={{ r: 5, fill: '#ef4444', stroke: '#ffffff', strokeWidth: 2, style: { filter: 'drop-shadow(0 2px 4px rgba(239,68,68,0.3))' } }} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center py-14 text-slate-400">
              <Wind className="w-12 h-12 opacity-20 mb-2" />
              <p className="text-sm font-semibold text-slate-500">Canlı veri bekleniyor</p>
              <p className="text-xs text-slate-400 mt-0.5">ESP32 cihazı bağlandığında grafik kırmızı dalgalarla akacaktır</p>
            </div>
          )}
        </div>

        {/* Live PPM Gauge (Sağ Taraf - 1/3 Genişlik) */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center" style={{ background: currentLevel === 'danger' ? 'linear-gradient(135deg, rgba(239,68,68,0.05), #ffffff)' : '#ffffff' }}>
          <p className="text-xs text-slate-400 uppercase tracking-widest font-bold mb-3">Anlık Ölçüm</p>

          <div className="relative mb-3">
            <div className="w-28 h-28 rounded-full flex items-center justify-center" style={{ background: currentLevel ? `radial-gradient(circle, ${getGasColor(currentLevel)}10, transparent 70%)` : '#f8fafc', border: `2px solid ${currentLevel ? getGasColor(currentLevel) : '#e2e8f0'}`, boxShadow: currentLevel ? `0 0 20px ${getGasColor(currentLevel)}15` : 'none' }}>
              <div>
                <p className="text-3xl font-black text-slate-900 leading-none">
                  {latestPPM !== null ? latestPPM.toFixed(0) : '0'}
                </p>
                <p className="text-xs text-slate-400 font-bold mt-1">PPM</p>
              </div>
            </div>
            {currentLevel === 'danger' && (
              <div className="absolute inset-0 rounded-full animate-ping opacity-20" style={{ border: `2px solid #ef4444` }} />
            )}
          </div>

          <span className="text-xs font-bold px-4 py-1 rounded-full" style={{ background: `${getGasColor(currentLevel)}15`, color: getGasColor(currentLevel) }}>
            {getGasLabel(currentLevel)}
          </span>

          <div className="w-full mt-4 space-y-1.5 border-t border-slate-100 pt-3">
            {[
              { label: 'Güvenli', max: 999, color: '#16a34a' },
              { label: 'Uyarı', max: 2999, color: '#f59e0b' },
              { label: 'Tehlike', max: 5000, color: '#ef4444' },
            ].map((t) => (
              <div key={t.label} className="flex items-center gap-2 text-xs font-medium">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: t.color }} />
                <span className="text-slate-500 flex-1 text-left">{t.label}</span>
                <span className="text-slate-600 font-mono">≤{t.max}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ── ⭐ ORTA ROW: PYROGUARD AI KAYNAK SINIFLANDIRMA KARTI ── */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm fade-in-up-2">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)' }}>
              <Sparkles className="w-3.5 h-3.5 text-red-500" />
            </div>
            PyroGuard AI Spektrum Analizi
          </h2>
          <span className="px-2 py-0.5 bg-red-50 text-red-600 rounded-md text-[10px] font-black border border-red-100 uppercase tracking-wider">
            Real-Time Signal Classifier
          </span>
        </div>
        
        <div className="flex items-center gap-3 mt-2">
          <span className={`inline-flex items-center gap-1.5 text-sm font-black px-4 py-2 rounded-xl border transition-all duration-300 ${
            aiData.isFalseAlarm 
              ? 'bg-amber-50 text-amber-600 border-amber-200 animate-pulse' 
              : latestPPM >= 1000 
                ? 'bg-red-50 text-red-600 border-red-200' 
                : 'bg-slate-50 text-slate-600 border-slate-200'
          }`}>
            <span className={`w-2 h-2 rounded-full ${aiData.isFalseAlarm ? 'bg-amber-500' : latestPPM >= 1000 ? 'bg-red-500' : 'bg-slate-400'}`} />
            Kaynak Tespiti: {aiData.sourceType}
          </span>
        </div>

        <p className="text-xs text-slate-400 mt-3 font-semibold leading-relaxed">
          Yapay zeka katmanı, sensörden akan ham gaz sinyallerinin son 15 saniyedeki <span className="font-bold text-slate-600">türevsel artış ivmesini ve sönümlenme hızını (Decay Rate)</span> asenkron analiz ederek dumanın kimyasal niteliğini sınıflandırır.
        </p>
        
        {/* Deodorant veya Parfüm Algılandığında Tetiklenecek Akıllı Bilgilendirme Bandı */}
        {aiData.isFalseAlarm && (
          <div className="mt-4 p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-amber-800 text-xs font-bold leading-relaxed shadow-sm">
            💡 AI GÜVENLİK KATMANI: Ani gaz dalgalanması uçucu kozmetik sprey (Deodorant/Parfüm) olarak ayırt edildi. Yanlış alarm (False Alarm) durumunu filtrelemek amacıyla sistem komuta merkezi tarafından harici buzzer tetiklemeleri geçici olarak sessize alındı.
          </div>
        )}
      </div>

      {/* ── ALT ROW: CİHAZ DURUMU ── */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm fade-in-up-3">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)' }}>
              <Cpu className="w-3.5 h-3.5 text-red-500" />
            </div>
            Cihaz Durumu
          </h2>
          <span className="text-xs text-slate-400 font-medium">{devices.length} cihaz aktif</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {devices.length === 0 && (
            <div className="text-center py-6 col-span-2">
              <Cpu className="w-10 h-10 mx-auto mb-2 text-slate-300" />
              <p className="text-slate-400 text-sm">Kayıtlı cihaz bulunamadı</p>
            </div>
          )}
          {devices.map((device) => {
            const isOnline = device.status === 'online'
            const gasColor = getGasColor(device.gasLevel)
            return (
              <div key={device._id} className="p-4 rounded-xl border border-slate-100 shadow-sm transition-all bg-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: isOnline ? 'rgba(239,68,68,0.05)' : '#edf2f7', border: isOnline ? '1px solid rgba(239,68,68,0.15)' : '1px solid #e2e8f0' }}>
                        <Shield className={`w-4 h-4 ${isOnline ? 'text-red-500' : 'text-slate-400'}`} />
                      </div>
                      <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${isOnline ? 'bg-red-500' : 'bg-slate-300'}`} />
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 text-sm">{device.name}</p>
                      <p className="text-xs text-slate-400 font-mono">{device.deviceId}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs font-semibold">
                    <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${isOnline ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-500'}`}>
                      {isOnline ? 'Çevrimiçi' : 'Çevrimdışı'}
                    </span>
                    {device.gasLevel && (
                      <span className="px-2.5 py-1 rounded-full" style={{ background: device.gasLevel === 'danger' ? '#fef2f2' : device.gasLevel === 'warning' ? '#fffbeb' : '#f0fdf4', color: gasColor }}>
                        {getGasLabel(device.gasLevel)}
                      </span>
                    )}
                    {device.buzzerActive ? (
                      <span className="bg-red-600 text-white px-2.5 py-1 rounded-full flex items-center gap-1 animate-pulse">
                        <Volume2 className="w-3 h-3" /> Alarm
                      </span>
                    ) : (
                      <span className="bg-slate-100 text-slate-400 px-2.5 py-1 rounded-full flex items-center gap-1">
                        <VolumeX className="w-3 h-3" /> Sessiz
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── ALERT BANNER ── */}
      {stats?.dangerCount > 0 && (
        <div className="fade-in-up rounded-2xl p-4 flex items-center gap-4 bg-white border border-red-200 shadow-sm" style={{ background: 'linear-gradient(135deg, rgba(239,68,68,0.02), #ffffff)' }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-red-50 border border-red-100">
            <AlertTriangle className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <p className="text-sm font-bold text-red-600">Son 24 saatte kritik gaz seviyesi tespit edildi</p>
            <p className="text-xs text-slate-400 mt-0.5 font-medium">
              {stats.dangerCount} kritik olay · {stats.gasDetections} toplam algılama
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default Dashboard