import { useEffect, useState } from 'react'
import api from '../../api/axios'
import Layout from '../../components/Layout'
import { gradeColor } from '../../components/utils'

export default function AllResults() {
  const [results,  setResults]  = useState([])
  const [sessions, setSessions] = useState([])
  const [classes,  setClasses]  = useState([])
  const [loading,  setLoading]  = useState(false)
  const [filters,  setFilters]  = useState({ session_id: '', class_id: '' })

  useEffect(() => {
    Promise.all([api.get('/admin/sessions'), api.get('/admin/classes')])
      .then(([s, c]) => { setSessions(s.data); setClasses(c.data) })
  }, [])

  const search = () => {
    if (!filters.session_id) return
    setLoading(true)
    const params = new URLSearchParams()
    if (filters.session_id) params.append('session_id', filters.session_id)
    if (filters.class_id)   params.append('class_id',   filters.class_id)
    api.get(`/admin/results?${params}`)
      .then(r => setResults(r.data))
      .finally(() => setLoading(false))
  }

  const downloadCSV = () => {
    if (!results.length) return
    const headers = ['Student', 'Reg No.', 'Class', 'Subject', 'Year', 'Term', 'CA', 'Exam', 'Total', 'Grade', 'Remark', 'Teacher']
    const rows = results.map(r => [r.student_name, r.reg_number, r.class_name, r.subject_name, r.year, r.term, r.ca_score, r.exam_score, r.total_score, r.grade, r.remark, r.teacher_name || ''])
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url  = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'results.csv'; a.click()
  }

  return (
    <Layout title="All Results" subtitle="View and export results across the school">
      {/* Filters */}
      <div className="card mb-6">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-sm font-medium mb-1">Session *</label>
            <select className="input-field w-52" value={filters.session_id} onChange={e => setFilters(f => ({ ...f, session_id: e.target.value }))}>
              <option value="">Select session...</option>
              {sessions.map(s => <option key={s.id} value={s.id}>{s.year} — {s.term} Term</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Class (optional)</label>
            <select className="input-field w-44" value={filters.class_id} onChange={e => setFilters(f => ({ ...f, class_id: e.target.value }))}>
              <option value="">All classes</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <button className="btn-primary" onClick={search} disabled={!filters.session_id}>Search</button>
          {results.length > 0 && (
            <button className="btn-secondary ml-auto" onClick={downloadCSV}>⬇ Export CSV</button>
          )}
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-700" /></div>
      ) : results.length > 0 ? (
        <div className="card overflow-x-auto">
          <p className="text-sm text-gray-500 mb-4">{results.length} results found</p>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                {['Student', 'Reg No.', 'Class', 'Subject', 'CA', 'Exam', 'Total', 'Grade', 'Remark', 'Teacher'].map(h => (
                  <th key={h} className="pb-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide pr-4">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {results.map(r => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="py-2.5 pr-4 font-medium text-gray-900">{r.student_name}</td>
                  <td className="py-2.5 pr-4 font-mono text-xs text-gray-500">{r.reg_number}</td>
                  <td className="py-2.5 pr-4 text-gray-500">{r.class_name}</td>
                  <td className="py-2.5 pr-4 text-gray-700">{r.subject_name}</td>
                  <td className="py-2.5 pr-4">{r.ca_score}</td>
                  <td className="py-2.5 pr-4">{r.exam_score}</td>
                  <td className="py-2.5 pr-4 font-bold text-gray-900">{r.total_score}</td>
                  <td className="py-2.5 pr-4"><span className={`badge-grade ${gradeColor(r.grade)}`}>{r.grade}</span></td>
                  <td className="py-2.5 pr-4 text-gray-500">{r.remark}</td>
                  <td className="py-2.5 text-gray-400 text-xs">{r.teacher_name || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="card text-center py-14 text-gray-400">
          <p className="text-4xl mb-3">📋</p>
          <p className="font-medium">Select a session above and click Search to view results.</p>
        </div>
      )}
    </Layout>
  )
}
