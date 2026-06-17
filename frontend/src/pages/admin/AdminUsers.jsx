import { useState, useEffect } from 'react'
import { Users, MapPin, Mail, Loader2, Search, X, Cpu, AlertTriangle } from 'lucide-react'
import api from '../../utils/api'
import { format } from 'date-fns'

const AdminUsers = () => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedUser, setSelectedUser] = useState(null)

  useEffect(() => {
    fetchUsers()
  }, [search])

  const fetchUsers = async () => {
    try {
      const params = search ? `?search=${search}` : ''
      const response = await api.get(`/api/admin/users${params}`)
      setUsers(response.data.data)
    } catch (error) {
      console.error('Fetch users error:', error)
    } finally {
      setLoading(false)
    }
  }

  const viewUserDetails = async (userId) => {
    try {
      const response = await api.get(`/api/admin/users/${userId}`)
      setSelectedUser(response.data.data)
    } catch (error) {
      console.error('Fetch user details error:', error)
    }
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
      
      {/* Üst Başlık */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Kullanıcı Yönetimi</h1>
        <p className="text-slate-500 text-sm mt-0.5 font-medium">Tüm kullanıcıları görüntüleyin ve yönetin</p>
      </div>

      {/* Arama Çubuğu Panel — Temiz beyaz tasarıma uyarlandı */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-red-500 focus:bg-white transition-all"
            placeholder="Kullanıcı ara (ad, email)"
          />
        </div>
      </div>

      {/* Kullanıcı Listesi Tablosu */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm overflow-x-auto">
        <table className="w-full text-sm text-slate-700">
          <thead className="border-b border-slate-100">
            <tr className="text-left text-slate-400 text-xs uppercase tracking-wider font-bold">
              <th className="pb-3 font-bold">Kullanıcı</th>
              <th className="pb-3 font-bold">Email</th>
              <th className="pb-3 font-bold">Adres</th>
              <th className="pb-3 font-bold">Rol</th>
              <th className="pb-3 font-bold">Kayıt Tarihi</th>
              <th className="pb-3 font-bold">İşlem</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-semibold text-sm">
            {users.map((user) => (
              <tr key={user._id} className="hover:bg-slate-50/70 transition-colors">
                <td className="py-3.5">
                  <div className="flex items-center gap-3">
                    {/* Kırmızı dairesel profil ikonu */}
                    <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm"
                      style={{ background: 'linear-gradient(135deg, #ef4444, #b91c1c)' }}
                    >
                      <span className="font-black text-white text-sm">
                        {user.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="font-bold text-slate-800">{user.name}</span>
                  </div>
                </td>
                <td className="py-3.5 text-slate-600 font-medium">{user.email}</td>
                <td className="py-3.5">
                  <div className="flex items-center gap-1.5 text-slate-400 font-medium">
                    <MapPin className="w-3.5 h-3.5 text-slate-300" />
                    <span>{user.address?.city || 'Belirtilmemiş'}</span>
                  </div>
                </td>
                <td className="py-3.5">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                    user.role === 'admin'
                      ? 'bg-purple-50 text-purple-600 border-purple-100'
                      : 'bg-red-50 text-red-600 border-red-100'
                  }`}>
                    {user.role === 'admin' ? 'Yönetici' : 'Kullanıcı'}
                  </span>
                </td>
                <td className="py-3.5 text-slate-400 font-medium">
                  {format(new Date(user.createdAt), 'dd/MM/yyyy')}
                </td>
                <td className="py-3.5">
                  <button
                    onClick={() => viewUserDetails(user._id)}
                    className="text-red-500 hover:text-red-700 font-bold text-sm transition-colors"
                  >
                    Detay
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Kullanıcı Detay Modalı — Tamamen Aydınlık Tasarım */}
      {selectedUser && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full p-6 shadow-xl max-h-[90vh] overflow-y-auto relative animate-in fade-in zoom-in-95 duration-150">
            
            <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">Kullanıcı Detayları</h2>
              <button
                onClick={() => setSelectedUser(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Temel Bilgiler */}
              <div>
                <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                  <Users className="w-4 h-4 text-red-500" />
                  Kullanıcı Bilgileri
                </h3>
                <div className="space-y-2.5 text-xs font-semibold bg-slate-50 p-4 border border-slate-100 rounded-xl">
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-medium">Ad Soyad:</span>
                    <span className="text-slate-800 font-bold">{selectedUser.user.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-medium">E-posta:</span>
                    <span className="text-slate-700 font-mono">{selectedUser.user.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-medium">Sistem Rolü:</span>
                    <span className="text-slate-800 capitalize">{selectedUser.user.role}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-medium">Evcil Hayvan Modu:</span>
                    <span className={`font-bold ${selectedUser.user.petMode ? 'text-red-500' : 'text-slate-400'}`}>
                      {selectedUser.user.petMode ? 'Açık' : 'Kapalı'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Adres Bilgileri */}
              <div>
                <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-red-500" />
                  Adres Bilgileri
                </h3>
                <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl text-xs font-semibold text-slate-600 leading-relaxed">
                  <p>{selectedUser.user.address.street}</p>
                  <p>{selectedUser.user.address.city}, {selectedUser.user.address.zipCode}</p>
                  <p className="text-slate-400">{selectedUser.user.address.country}</p>
                </div>
              </div>

              {/* Cihazlar Listesi */}
              <div>
                <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-1.5">
                  <Cpu className="w-4 h-4 text-slate-400" />
                  Cihazlar ({selectedUser.user.devices?.length || 0})
                </h3>
                <div className="space-y-2">
                  {selectedUser.user.devices?.map((device) => (
                    <div key={device._id} className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between text-xs font-semibold">
                      <div>
                        <p className="font-bold text-slate-800">{device.name}</p>
                        <p className="text-slate-400 font-mono mt-0.5">{device.deviceId}</p>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full font-bold border ${
                        device.status === 'online'
                          ? 'bg-red-50 text-red-600 border-red-100'
                          : 'bg-slate-100 text-slate-500 border border-slate-200'
                      }`}>
                        {device.status === 'online' ? 'Çevrimiçi' : 'Çevrimdışı'}
                      </span>
                    </div>
                  ))}
                  {(!selectedUser.user.devices || selectedUser.user.devices.length === 0) && (
                    <p className="text-xs font-medium text-slate-400 italic pl-1">Kayıtlı cihaz bulunmuyor.</p>
                  )}
                </div>
              </div>

              {/* Son Arıza Bildirimleri */}
              <div>
                <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-slate-400" />
                  Son Arıza Bildirimleri ({selectedUser.faultReports?.length || 0})
                </h3>
                <div className="space-y-2">
                  {selectedUser.faultReports?.slice(0, 5).map((report) => (
                    <div key={report._id} className="p-3 bg-white border border-slate-200 rounded-xl flex justify-between items-center text-xs">
                      <div>
                        <p className="font-bold text-slate-800">{report.title}</p>
                        <p className="text-slate-400 font-medium mt-1">
                          {format(new Date(report.createdAt), 'dd/MM/yyyy HH:mm')}
                        </p>
                      </div>
                      <span className="font-bold bg-slate-50 px-2 py-0.5 border border-slate-100 rounded text-slate-500 uppercase">
                        {report.status}
                      </span>
                    </div>
                  ))}
                  {(!selectedUser.faultReports || selectedUser.faultReports.length === 0) && (
                    <p className="text-xs font-medium text-slate-400 italic pl-1">Bildirilmiş bir arıza kaydı bulunmuyor.</p>
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  )
}

export default AdminUsers