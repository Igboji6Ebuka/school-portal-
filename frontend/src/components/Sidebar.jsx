import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

const navLinks = {
  admin: [
    { to: '/admin',           label: 'Dashboard',  icon: '📊' },
    { to: '/admin/students',  label: 'Students',   icon: '🎓' },
    { to: '/admin/teachers',  label: 'Teachers',   icon: '👩‍🏫' },
    { to: '/admin/classes',   label: 'Classes',    icon: '🏫' },
    { to: '/admin/sessions',  label: 'Sessions',   icon: '📅' },
    { to: '/admin/results',   label: 'Results',    icon: '📋' },
  ],
  teacher: [
    { to: '/teacher',        label: 'Dashboard', icon: '📊' },
    { to: '/teacher/upload', label: 'Upload Results', icon: '⬆️' },
  ],
  student: [
    { to: '/student', label: 'My Results', icon: '📋' },
  ],
}

export default function Sidebar() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const links = navLinks[user?.role] || []

  const handleLogout = () => {
    logout()
    toast.success('Logged out successfully')
    navigate('/login')
  }

  const roleColor = {
    admin: 'from-primary-800 to-primary-900',
    teacher: 'from-emerald-700 to-emerald-900',
    student: 'from-violet-700 to-violet-900',
  }[user?.role] || 'from-primary-800 to-primary-900'

  return (
    <aside className={`w-64 min-h-screen bg-gradient-to-b ${roleColor} flex flex-col text-white`}>
      {/* Logo */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-xl">🏫</div>
          <div>
            <p className="font-bold text-base leading-tight">Vanswill School</p>
            <p className="text-xs text-white/70 leading-tight">Umunachi</p>
            <p className="text-xs text-white/50 capitalize">{user?.role} Panel</p>
          </div>
        </div>
      </div>

      {/* User Info */}
      <div className="px-6 py-4 border-b border-white/10">
        <p className="text-sm font-semibold truncate">{user?.name}</p>
        <p className="text-xs text-white/60">{user?.email || user?.reg_number}</p>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {links.map((link) => {
          const isActive = location.pathname === link.to
          return (
            <Link
              key={link.to}
              to={link.to}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-white/20 text-white shadow-sm'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              }`}
            >
              <span>{link.icon}</span>
              <span>{link.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-white/10">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/70 hover:bg-white/10 hover:text-white transition-all"
        >
          <span>🚪</span>
          <span>Logout</span>
        </button>
      </div>
    </aside>
  )
}
