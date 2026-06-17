import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import {
  LayoutDashboard, Cpu, History, AlertTriangle,
  User, LogOut, Users, BarChart3, Flame, ChevronRight
} from 'lucide-react'
import toast from 'react-hot-toast'

const Layout = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()

  const handleLogout = () => {
    logout()
    toast.success('Çıkış yapıldı')
    navigate('/login')
  }

  const isAdmin = user?.role === 'admin'

  const userNavItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/devices', icon: Cpu, label: 'Cihazlar' },
    { path: '/history', icon: History, label: 'Geçmiş' },
    { path: '/fault-reports', icon: AlertTriangle, label: 'Destek' },
    { path: '/profile', icon: User, label: 'Hesabım' },
  ]

  const adminNavItems = [
    { path: '/admin', icon: BarChart3, label: 'Genel Bakış' },
    { path: '/admin/users', icon: Users, label: 'Kullanıcılar' },
    { path: '/admin/faults', icon: AlertTriangle, label: 'Talepler' },
  ]

  const navItems = isAdmin ? adminNavItems : userNavItems

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Sidebar — Kırmızı/Beyaz Aydınlık Moda Uyarlandı */}
      <aside className="fixed left-0 top-0 h-full w-64 flex flex-col z-20"
        style={{ background: '#ffffff', borderRight: '1px solid #e2e8f0' }}>

        {/* Logo */}

<div className="p-5 mb-2">
  <div className="flex items-center gap-3">
    <div className="relative w-10 h-10 rounded-xl flex items-center justify-center"
      style={{ background: 'linear-gradient(135deg, #ef4444, #b91c1c)' }}>
      <Flame className="w-5 h-5 text-white" />
    </div>
    <div>
      <h1 className="text-base font-bold text-slate-900 leading-tight tracking-tight">PyroGuard</h1>
      <p className="text-xs font-bold" style={{ color: '#ef4444' }}>
        {isAdmin ? 'Yönetici Paneli' : 'Yangın Takip Sistemi'}
      </p>
    </div>
  </div>
</div>

        {/* Nav label */}
        <p className="px-5 text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">
          {isAdmin ? 'Yönetim' : 'Menü'}
        </p>

        {/* Navigation */}
        <nav className="flex-1 px-3 space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`group flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200 text-sm font-semibold ${
                  isActive
                    ? 'text-red-600'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                }`}
                style={isActive ? {
                  background: 'linear-gradient(135deg, rgba(239,68,68,0.08), rgba(239,68,68,0.02))',
                  border: '1px solid rgba(239,68,68,0.15)',
                } : {}}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200 ${
                    isActive
                      ? 'bg-red-100'
                      : 'bg-slate-100 group-hover:bg-slate-200/70'
                  }`}>
                    <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-red-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
                  </div>
                  <span>{item.label}</span>
                </div>
                {isActive && <ChevronRight className="w-3.5 h-3.5 text-red-500" />}
              </Link>
            )
          })}
        </nav>

        {/* User Info */}
        <div className="p-3 mx-3 mb-3 rounded-2xl" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
          <div className="flex items-center gap-3 mb-3">
            <div className="relative w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, rgba(239,68,68,0.15), rgba(239,68,68,0.05))', border: '1px solid rgba(239,68,68,0.2)' }}>
              <span className="text-red-600 font-bold text-sm">
                {user?.name?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-800 truncate">{user?.name}</p>
              <p className="text-xs text-slate-400 font-medium truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-red-600 hover:bg-red-50 transition-all duration-200"
            style={{ background: '#ffffff', border: '1px solid #e2e8f0' }}
          >
            <LogOut className="w-3.5 h-3.5" />
            Çıkış Yap
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 flex-1 min-h-screen">
        <div className="p-6 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

export default Layout