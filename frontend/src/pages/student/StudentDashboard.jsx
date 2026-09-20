import { useEffect, useState } from 'react'
import api from '../../api/axios'
import Layout from '../../components/Layout'
import { Avatar, gradeColor } from '../../components/utils'

export default function StudentDashboard() {
  const [profile,   setProfile]   = useState(null)
  const [sessions,  setSessions]  = useState([])
  const [results,   setResults]   = useState(null)
  const [selSess,   setSelSess]   = useState('')
  const [loading,   setLoading]   = useState(true)
  const [resLoading, setResLoading] = useState(false)

  useEffect(() => {
    Promise.all([api.get('/student/profile'), api.get('/student/sessions')])
      .then(([p, s]) => {
        setProfile(p.data)
        setSessions(s.data)
        // Auto-select active or most recent session
        if (s.data.length > 0) {
          const active = s.data.find(x => x.is_active) || s.data[0]
          setSelSess(active.id)
        }
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!selSess) return
    setResLoading(true)
    api.get(`/student/results?session_id=${selSess}`)
      .then(r => setResults(r.data))
      .finally(() => setResLoading(false))
  }, [selSess])

  const printResult = () => window.print()

  if (loading) return (
    <Layout title="My Results">
      <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-violet-700" /></div>
    </Layout>
  )

  const hasFailed   = results?.results?.some(r => r.grade === 'F9')
  const passedAll   = results && !hasFailed && results.results.length > 0
  const positionStr = results?.summary?.position
    ? `${results.summary.position}${['st','nd','rd'][results.summary.position - 1] || 'th'} in Class`
    : null

  return (
    <Layout title="My Results" subtitle={profile?.class_name ? `Class: ${profile.class_name}` : 'Student Result Portal'}>
      {/* Student Profile Card */}
      <div className="card mb-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="relative">
            <Avatar src={profile?.photo_path} name={profile?.name} size="xl" />
            {passedAll && (
              <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow">
                PASS
              </span>
            )}
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h2 className="text-2xl font-bold text-gray-900">{profile?.name}</h2>
            <p className="text-gray-500 mt-0.5">
              Reg. No: <span className="font-mono font-semibold text-gray-700">{profile?.reg_number}</span>
            </p>
            <p className="text-gray-500">Class: <span className="font-semibold">{profile?.class_name || '—'}</span></p>
            {profile?.email && <p className="text-gray-400 text-sm">{profile.email}</p>}
            <div className="flex flex-wrap gap-2 mt-4 justify-center sm:justify-start">
              {results?.summary && (
                <>
                  <span className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">
                    Avg: {results.summary.average}%
                  </span>
                  <span className="px-3 py-1.5 bg-purple-50 text-purple-700 rounded-full text-sm font-medium">
                    Total: {results.summary.totalScore}
                  </span>
                  {positionStr && (
                    <span className="px-3 py-1.5 bg-yellow-50 text-yellow-700 rounded-full text-sm font-medium">
                      🏆 {positionStr}
                    </span>
                  )}
                  {results.summary.failed > 0 && (
                    <span className="px-3 py-1.5 bg-red-50 text-red-700 rounded-full text-sm font-medium">
                      ⚠️ {results.summary.failed} Failed
                    </span>
                  )}
                </>
              )}
            </div>
          </div>
          <button onClick={printResult} className="btn-secondary self-start print:hidden">🖨️ Print</button>
        </div>
      </div>

      {/* Session Selector */}
      {sessions.length > 0 && (
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          <label className="text-sm font-semibold text-gray-700">Select Term:</label>
          <div className="flex flex-wrap gap-2">
            {sessions.map(s => (
              <button
                key={s.id}
                onClick={() => setSelSess(s.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium border-2 transition-all ${
                  selSess === s.id
                    ? 'bg-violet-700 text-white border-violet-700'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-violet-300'
                }`}
              >
                {s.year} — {s.term} Term
                {s.is_active && <span className="ml-1.5 text-xs opacity-75">(Current)</span>}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Results Table */}
      {resLoading ? (
        <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-700" /></div>
      ) : results?.results?.length > 0 ? (
        <div className="card print:shadow-none print:border-0">

          {/* ── PRINT HEADER (full school letterhead with passport photo) ── */}
          <div className="hidden print:block print:mb-6">
            <div className="flex items-center gap-4 border-b-4 border-blue-800 pb-4 mb-4">
              <div className="text-5xl">🏫</div>
              <div className="flex-1">
                <h1 className="text-2xl font-extrabold text-blue-900 uppercase tracking-wide leading-tight">
                  Vanswill School Umunachi
                </h1>
                <p className="text-sm text-gray-500 mt-0.5">Academic Result Sheet</p>
              </div>
              {profile?.photo_path ? (
                <img src={profile.photo_path} alt={profile?.name} className="w-24 h-28 object-cover border-2 border-blue-800 rounded" />
              ) : (
                <div className="w-24 h-28 border-2 border-blue-800 rounded bg-blue-50 flex items-center justify-center">
                  <span className="text-3xl font-bold text-blue-800">
                    {(profile?.name || '?').split(' ').slice(0, 2).map(w => w[0]).join('')}
                  </span>
                </div>
              )}
            </div>
            <div className="grid grid-cols-3 gap-4 text-sm mb-4">
              <div><span className="text-gray-400 uppercase text-xs">Name</span><p className="font-bold text-gray-900">{profile?.name}</p></div>
              <div><span className="text-gray-400 uppercase text-xs">Reg. Number</span><p className="font-bold font-mono text-gray-900">{profile?.reg_number}</p></div>
              <div><span className="text-gray-400 uppercase text-xs">Class</span><p className="font-bold text-gray-900">{profile?.class_name}</p></div>
              <div><span className="text-gray-400 uppercase text-xs">Session</span><p className="font-bold text-gray-900">{results?.session?.year}</p></div>
              <div><span className="text-gray-400 uppercase text-xs">Term</span><p className="font-bold text-gray-900">{results?.session?.term} Term</p></div>
              <div>
                <span className="text-gray-400 uppercase text-xs">Status</span>
                <p className={`font-bold ${passedAll ? 'text-green-700' : 'text-red-600'}`}>
                  {passedAll ? '✔ PASSED' : 'FAILED SOME SUBJECTS'}
                </p>
              </div>
            </div>
          </div>

          {/* ── SCREEN HEADER (styled card with photo) ─────────────────── */}
          <div className="flex items-center gap-4 mb-5 p-4 bg-gradient-to-r from-violet-50 to-blue-50 rounded-xl border border-violet-100 print:hidden">
            <Avatar src={profile?.photo_path} name={profile?.name} size="lg" />
            <div className="flex-1 min-w-0">
              <p className="font-bold text-gray-900 text-lg leading-tight">{profile?.name}</p>
              <p className="text-sm text-gray-500">
                <span className="font-mono font-semibold">{profile?.reg_number}</span>
                {profile?.class_name && <span> · {profile.class_name}</span>}
              </p>
              <p className="text-sm text-gray-500">{results?.session?.year} — {results?.session?.term} Term</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-violet-500 font-semibold mb-2">Vanswill School Umunachi</p>
              <span className={`px-3 py-1.5 rounded-full text-sm font-bold ${passedAll ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {passedAll ? '✅ PASSED' : hasFailed ? '❌ FAILED SOME' : '—'}
              </span>
            </div>
          </div>

          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-gray-200">
                {['Subject', 'CA (30)', 'Exam (70)', 'Total (100)', 'Grade', 'Remark'].map(h => (
                  <th key={h} className="pb-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wide pr-6">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {results.results.map((r, i) => (
                <tr key={i} className={r.grade === 'F9' ? 'bg-red-50' : 'hover:bg-gray-50'}>
                  <td className="py-3.5 pr-6 font-semibold text-gray-900">{r.subject_name}</td>
                  <td className="py-3.5 pr-6 text-gray-600">{r.ca_score}</td>
                  <td className="py-3.5 pr-6 text-gray-600">{r.exam_score}</td>
                  <td className="py-3.5 pr-6 font-bold text-xl text-gray-900">{r.total_score}</td>
                  <td className="py-3.5 pr-6">
                    <span className={`badge-grade text-sm px-3 py-1 ${gradeColor(r.grade)}`}>{r.grade}</span>
                  </td>
                  <td className="py-3.5 text-gray-500">{r.remark}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t-2 border-gray-200">
              <tr className="bg-gray-50">
                <td className="py-3 pr-6 font-bold text-gray-700">TOTAL / AVERAGE</td>
                <td className="py-3 pr-6"></td>
                <td className="py-3 pr-6"></td>
                <td className="py-3 pr-6 font-bold text-lg text-primary-700">{results.summary.totalScore} / {results.summary.average}%</td>
                <td className="py-3 pr-6"></td>
                <td className="py-3 font-semibold text-gray-500">{positionStr || ''}</td>
              </tr>
            </tfoot>
          </table>

          {/* Grade key */}
          <div className="mt-6 pt-4 border-t border-gray-100 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { g: 'A1', label: '75–100 Excellent' },
              { g: 'B2–B3', label: '65–74 Very Good / Good' },
              { g: 'C4–C6', label: '50–64 Credit' },
              { g: 'F9', label: '0–39 Fail' },
            ].map(({ g, label }) => (
              <div key={g} className="text-xs text-gray-400">
                <span className={`badge-grade ${gradeColor(g)} mr-1.5`}>{g}</span>{label}
              </div>
            ))}
          </div>

          {/* Print signature footer */}
          <div className="hidden print:grid print:grid-cols-3 print:gap-8 print:mt-10 print:pt-6 print:border-t-2 print:border-gray-300">
            <div className="text-center">
              <div className="border-b border-gray-400 mb-1 pb-8" />
              <p className="text-xs text-gray-500">Class Teacher's Signature</p>
            </div>
            <div className="text-center">
              <div className="border-b border-gray-400 mb-1 pb-8" />
              <p className="text-xs text-gray-500">Head Teacher's Signature</p>
            </div>
            <div className="text-center">
              <div className="border-b border-gray-400 mb-1 pb-8" />
              <p className="text-xs text-gray-500">School Stamp</p>
            </div>
          </div>
          <p className="hidden print:block print:text-center print:text-xs print:text-gray-400 print:mt-4">
            Vanswill School Umunachi — Result Portal · Printed {new Date().toLocaleDateString()}
          </p>
        </div>
      ) : selSess ? (
        <div className="card text-center py-14 text-gray-400">
          <p className="text-4xl mb-3">📭</p>
          <p className="font-medium">No results available for this term yet.</p>
          <p className="text-sm mt-1">Check back after your teacher uploads results.</p>
        </div>
      ) : (
        <div className="card text-center py-14 text-gray-400">
          <p className="text-4xl mb-3">📋</p>
          <p className="font-medium">No result sessions available yet.</p>
        </div>
      )}
    </Layout>
  )
}
