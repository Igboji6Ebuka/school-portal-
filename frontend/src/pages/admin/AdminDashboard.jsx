import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../api/axios'
import Layout from '../../components/Layout'
import StatCard from '../../components/StatCard'
import { gradeColor } from '../../components/utils'

export default function AdminDashboard() {
  const [stats, setStats]   = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/admin/stats')
      .then(r => setStats(r.data))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <Layout title="Admin Dashboard">
      <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-700" /></div>
    </Layout>
  )

  return (
    <Layout title="Admin Dashboard" subtitle={stats?.activeSession ? `Active Session: ${stats.activeSession.year} — ${stats.activeSession.term} Term` : 'No active session set'}>
      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 mb-8">
        <StatCard label="Total Students"  value={stats.totalStudents}  icon="🎓" color="blue" />
        <StatCard label="Total Teachers"  value={stats.totalTeachers}  icon="👩‍🏫" color="green" />
        <StatCard label="Total Classes"   value={stats.totalClasses}   icon="🏫" color="purple" />
        <StatCard label="Total Subjects"  value={stats.totalSubjects}  icon="📚" color="teal" />
        <StatCard label="Results Uploaded" value={stats.totalResults}  icon="📋" color="orange" />
        <div className="card flex items-center justify-between col-span-1">
          <div>
            <p className="text-sm text-gray-500 font-medium mb-1">Quick Actions</p>
            <div className="flex flex-wrap gap-2 mt-2">
              <Link to="/admin/students"  className="btn-primary text-xs py-1.5 px-3">+ Student</Link>
              <Link to="/admin/teachers"  className="btn-secondary text-xs py-1.5 px-3">+ Teacher</Link>
              <Link to="/admin/sessions"  className="btn-secondary text-xs py-1.5 px-3">+ Session</Link>
            </div>
          </div>
          <span className="text-4xl">⚡</span>
        </div>
      </div>

      {/* Recent Results */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Recent Results Uploaded</h2>
          <Link to="/admin/results" className="text-sm text-primary-600 hover:underline font-medium">View all →</Link>
        </div>
        {stats.recentResults.length === 0 ? (
          <p className="text-gray-400 text-sm py-4 text-center">No results uploaded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  {['Student', 'Reg No.', 'Class', 'Subject', 'CA', 'Exam', 'Total', 'Grade'].map(h => (
                    <th key={h} className="pb-3 text-left font-semibold text-gray-500 text-xs uppercase tracking-wide pr-4">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {stats.recentResults.map(r => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="py-3 pr-4 font-medium text-gray-900">{r.student_name}</td>
                    <td className="py-3 pr-4 text-gray-500 font-mono text-xs">{r.reg_number}</td>
                    <td className="py-3 pr-4 text-gray-500">{r.class_name}</td>
                    <td className="py-3 pr-4 text-gray-700">{r.subject_name}</td>
                    <td className="py-3 pr-4">{r.ca_score}</td>
                    <td className="py-3 pr-4">{r.exam_score}</td>
                    <td className="py-3 pr-4 font-semibold">{r.total}</td>
                    <td className="py-3">
                      <span className={`badge-grade ${gradeColor(r.grade)}`}>{r.grade}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  )
}
