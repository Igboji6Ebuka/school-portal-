import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'

// Pages
import Login from './pages/Login'
import AdminDashboard   from './pages/admin/AdminDashboard'
import ManageStudents   from './pages/admin/ManageStudents'
import ManageTeachers   from './pages/admin/ManageTeachers'
import ManageClasses    from './pages/admin/ManageClasses'
import ManageSessions   from './pages/admin/ManageSessions'
import AllResults       from './pages/admin/AllResults'
import TeacherDashboard from './pages/teacher/TeacherDashboard'
import UploadResults    from './pages/teacher/UploadResults'
import StudentDashboard from './pages/student/StudentDashboard'

function PrivateRoute({ children, roles }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-700" /></div>
  if (!user) return <Navigate to="/login" replace />
  if (roles && !roles.includes(user.role)) return <Navigate to="/login" replace />
  return children
}

function RoleRedirect() {
  const { user, loading } = useAuth()
  if (loading) return null
  if (!user) return <Navigate to="/login" replace />
  if (user.role === 'admin')   return <Navigate to="/admin" replace />
  if (user.role === 'teacher') return <Navigate to="/teacher" replace />
  return <Navigate to="/student" replace />
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<RoleRedirect />} />
          <Route path="/login" element={<Login />} />

          {/* Admin */}
          <Route path="/admin" element={<PrivateRoute roles={['admin']}><AdminDashboard /></PrivateRoute>} />
          <Route path="/admin/students"  element={<PrivateRoute roles={['admin']}><ManageStudents /></PrivateRoute>} />
          <Route path="/admin/teachers"  element={<PrivateRoute roles={['admin']}><ManageTeachers /></PrivateRoute>} />
          <Route path="/admin/classes"   element={<PrivateRoute roles={['admin']}><ManageClasses /></PrivateRoute>} />
          <Route path="/admin/sessions"  element={<PrivateRoute roles={['admin']}><ManageSessions /></PrivateRoute>} />
          <Route path="/admin/results"   element={<PrivateRoute roles={['admin']}><AllResults /></PrivateRoute>} />

          {/* Teacher */}
          <Route path="/teacher"        element={<PrivateRoute roles={['teacher']}><TeacherDashboard /></PrivateRoute>} />
          <Route path="/teacher/upload" element={<PrivateRoute roles={['teacher']}><UploadResults /></PrivateRoute>} />

          {/* Student */}
          <Route path="/student" element={<PrivateRoute roles={['student']}><StudentDashboard /></PrivateRoute>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
