import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../api/axios'
import Layout from '../../components/Layout'
import { useAuth } from '../../context/AuthContext'
import StatCard from '../../components/StatCard'

export default function TeacherDashboard() {
  const { user }  = useAuth()
  const [classes,  setClasses]  = useState([])
  const [sessions, setSessions] = useState([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    Promise.all([api.get('/teacher/classes'), api.get('/teacher/sessions')])
      .then(([c, s]) => { setClasses(c.data); setSessions(s.data) })
      .finally(() => setLoading(false))
  }, [])

  const activeSession = sessions.find(s => s.is_active)

  if (loading) return <Layout title="Teacher Dashboard"><div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-700" /></div></Layout>

  return (
    <Layout title="Teacher Dashboard" subtitle={`Welcome back, ${user?.name}`}>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
        <StatCard label="Available Classes"  value={classes.length}  icon="🏫" color="blue" />
        <StatCard label="Total Sessions"     value={sessions.length} icon="📅" color="green" />
        <StatCard
          label="Active Session"
          value={activeSession ? `${activeSession.year} ${activeSession.term}` : 'None'}
          icon="✅"
          color={activeSession ? 'teal' : 'red'}
          sub={activeSession ? 'Term' : 'Contact admin'}
        />
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-base font-bold mb-3">Quick Actions</h2>
          <p className="text-sm text-gray-500 mb-4">Upload student scores for a class, subject, and term.</p>
          <Link to="/teacher/upload" className="btn-primary inline-flex items-center gap-2">
            ⬆️ Upload Results
          </Link>
        </div>

        <div className="card">
          <h2 className="text-base font-bold mb-3">Available Classes</h2>
          {classes.length === 0 ? (
            <p className="text-gray-400 text-sm">No classes found. Contact admin.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {classes.map(c => (
                <span key={c.id} className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium border border-blue-100">
                  {c.name}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="card lg:col-span-2">
          <h2 className="text-base font-bold mb-3">CSV Upload Format</h2>
          <p className="text-sm text-gray-500 mb-3">When uploading results via CSV, use this column format:</p>
          <pre className="bg-gray-900 text-green-400 rounded-lg p-4 text-sm overflow-x-auto">
{`reg_number,ca_score,exam_score
STU001,25,60
STU002,28,55
STU003,20,48`}
          </pre>
          <p className="text-xs text-gray-400 mt-2">CA Score max: 30 | Exam Score max: 70 | Values are capped automatically.</p>
        </div>
      </div>
    </Layout>
  )
}
