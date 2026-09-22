import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

export default function Login() {
  const { login } = useAuth()
  const navigate   = useNavigate()
  const [form, setForm]     = useState({ identifier: '', password: '' })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const user = await login(form.identifier, form.password)
      toast.success(`Welcome back, ${user.name}!`)
      if (user.role === 'admin')   return navigate('/admin')
      if (user.role === 'teacher') return navigate('/teacher')
      navigate('/student')
    } catch (err) {
      if (!err.response) {
        toast.error('Cannot reach backend server. If using Render free tier, please wait ~30-50 seconds for it to wake up and try again.', { duration: 7000 })
      } else if (err.response.status === 404) {
        toast.error('Login endpoint not found (404). Ensure VITE_API_URL is set in Vercel project environment variables.', { duration: 7000 })
      } else if (err.response.status === 401) {
        toast.error('Invalid email / registration number or password.')
      } else {
        toast.error(err.response?.data?.message || 'Login failed. Check your credentials.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left branding */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-gradient-to-br from-primary-800 to-primary-900 p-12 text-white">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-3xl">🏫</div>
          <div>
            <span className="text-2xl font-bold block leading-tight">Vanswill School</span>
            <span className="text-sm text-primary-200">Umunachi</span>
          </div>
        </div>
        <div>
          <h2 className="text-4xl font-bold mb-4 leading-tight">
            Academic Excellence<br/>Made Accessible
          </h2>
          <p className="text-primary-200 text-lg leading-relaxed">
            A unified platform for students to check their results, teachers to upload scores, and administrators to manage the school effortlessly.
          </p>
          <div className="mt-10 grid grid-cols-3 gap-4">
            {[['🎓', 'Students', 'View results & progress'], ['👩‍🏫', 'Teachers', 'Upload & manage scores'], ['🔑', 'Admins', 'Full school control']].map(([icon, role, desc]) => (
              <div key={role} className="bg-white/10 rounded-xl p-4">
                <div className="text-2xl mb-2">{icon}</div>
                <p className="font-semibold text-sm">{role}</p>
                <p className="text-xs text-primary-200 mt-1">{desc}</p>
              </div>
            ))}
          </div>
        </div>
        <p className="text-primary-300 text-sm">© {new Date().getFullYear()} Vanswill School Umunachi</p>
      </div>

      {/* Right login form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-slate-50">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <div className="w-12 h-12 bg-primary-700 rounded-2xl flex items-center justify-center text-3xl">🏫</div>
            <div className="text-left">
              <p className="text-xl font-bold text-primary-800 leading-tight">Vanswill School</p>
              <p className="text-sm text-primary-600">Umunachi</p>
            </div>
          </div>

          <div className="card shadow-lg">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Sign in</h1>
            <p className="text-sm text-gray-500 mb-6">Use your email (staff/admin) or registration number (students)</p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email or Registration Number</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. admin@school.com or STU001"
                  value={form.identifier}
                  onChange={e => setForm(f => ({ ...f, identifier: e.target.value }))}
                  required
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                <input
                  type="password"
                  className="input-field"
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  required
                />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base">
                {loading ? 'Signing in...' : 'Sign in →'}
              </button>
            </form>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
              <p className="text-xs font-semibold text-blue-800 mb-2">Demo Credentials</p>
              <div className="space-y-1 text-xs text-blue-700">
                <p>🔑 Admin: <span className="font-mono">admin@school.com</span> / <span className="font-mono">admin123</span></p>
                <p>👩‍🏫 Teacher: <span className="font-mono">john.smith@school.com</span> / <span className="font-mono">teacher123</span></p>
                <p>🎓 Student: <span className="font-mono">STU001</span> / <span className="font-mono">student123</span></p>
              </div>
            </div>

            {!import.meta.env.VITE_API_URL && typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1' && (
              <div className="mt-4 p-3.5 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-900 leading-relaxed">
                <p className="font-semibold flex items-center gap-1.5 mb-1">
                  <span>⚠️</span> Setup Required in Vercel:
                </p>
                <p>
                  Add <code className="bg-amber-100 px-1 py-0.5 rounded font-mono font-semibold">VITE_API_URL</code> in your Vercel Project Settings &gt; Environment Variables pointing to your Render backend URL, then redeploy.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
