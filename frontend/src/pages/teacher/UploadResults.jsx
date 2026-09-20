import { useEffect, useState, useRef } from 'react'
import api from '../../api/axios'
import Layout from '../../components/Layout'
import { Avatar, gradeColor } from '../../components/utils'
import toast from 'react-hot-toast'

export default function UploadResults() {
  const [classes,   setClasses]   = useState([])
  const [subjects,  setSubjects]  = useState([])
  const [sessions,  setSessions]  = useState([])
  const [students,  setStudents]  = useState([])
  const [scores,    setScores]    = useState({})   // { student_id: { ca, exam } }
  const [existing,  setExisting]  = useState([])
  const [sel,       setSel]       = useState({ class_id: '', subject_id: '', session_id: '' })
  const [loading,   setLoading]   = useState(true)
  const [saving,    setSaving]    = useState(false)
  const [tab,       setTab]       = useState('form') // 'form' | 'csv'
  const [csvFile,   setCsvFile]   = useState(null)
  const [csvErrors, setCsvErrors] = useState([])
  const fileRef = useRef()

  useEffect(() => {
    Promise.all([api.get('/teacher/classes'), api.get('/teacher/sessions')])
      .then(([c, s]) => { setClasses(c.data); setSessions(s.data) })
      .finally(() => setLoading(false))
  }, [])

  // Load subjects when class changes
  useEffect(() => {
    if (!sel.class_id) { setSubjects([]); return }
    api.get(`/teacher/subjects?class_id=${sel.class_id}`).then(r => setSubjects(r.data))
  }, [sel.class_id])

  // Load students + existing results when class+subject+session all set
  useEffect(() => {
    if (!sel.class_id || !sel.subject_id || !sel.session_id) {
      setStudents([]); setScores({}); setExisting([]); return
    }
    Promise.all([
      api.get(`/teacher/students?class_id=${sel.class_id}`),
      api.get(`/teacher/results?session_id=${sel.session_id}&subject_id=${sel.subject_id}`),
    ]).then(([st, res]) => {
      setStudents(st.data)
      setExisting(res.data)
      // Pre-populate scores from existing results
      const init = {}
      res.data.forEach(r => { init[r.student_id] = { ca: r.ca_score, exam: r.exam_score } })
      // Fill blanks for students not yet in results
      st.data.forEach(s => { if (!init[s.id]) init[s.id] = { ca: '', exam: '' } })
      setScores(init)
    })
  }, [sel.class_id, sel.subject_id, sel.session_id])

  const setScore = (studentId, field, value) => {
    setScores(prev => ({ ...prev, [studentId]: { ...prev[studentId], [field]: value } }))
  }

  const handleFormSubmit = async (e) => {
    e.preventDefault()
    const results = students.map(s => ({
      student_id: s.id,
      ca_score:   parseFloat(scores[s.id]?.ca)   || 0,
      exam_score: parseFloat(scores[s.id]?.exam) || 0,
    }))
    setSaving(true)
    try {
      await api.post('/teacher/results', { subject_id: sel.subject_id, session_id: sel.session_id, results })
      toast.success('Results saved successfully!')
      // Refresh existing
      const res = await api.get(`/teacher/results?session_id=${sel.session_id}&subject_id=${sel.subject_id}`)
      setExisting(res.data)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed')
    } finally { setSaving(false) }
  }

  const handleCsvSubmit = async (e) => {
    e.preventDefault()
    if (!csvFile || !sel.subject_id || !sel.session_id) {
      toast.error('Please select subject, session and a CSV file')
      return
    }
    const fd = new FormData()
    fd.append('file', csvFile)
    fd.append('subject_id', sel.subject_id)
    fd.append('session_id', sel.session_id)
    setSaving(true)
    try {
      const res = await api.post('/teacher/results/csv', fd)
      toast.success(res.data.message)
      setCsvErrors(res.data.errors || [])
      setCsvFile(null)
      if (fileRef.current) fileRef.current.value = ''
    } catch (err) {
      toast.error(err.response?.data?.message || 'CSV upload failed')
    } finally { setSaving(false) }
  }

  if (loading) return <Layout title="Upload Results"><div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-700" /></div></Layout>

  const isSelComplete = sel.class_id && sel.subject_id && sel.session_id

  return (
    <Layout title="Upload Results" subtitle="Enter or upload student scores for a class and subject">
      {/* Selection */}
      <div className="card mb-6">
        <h2 className="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wide">1. Select Class / Subject / Session</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Class</label>
            <select className="input-field" value={sel.class_id} onChange={e => setSel(s => ({ ...s, class_id: e.target.value, subject_id: '' }))}>
              <option value="">-- Select class --</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Subject</label>
            <select className="input-field" value={sel.subject_id} onChange={e => setSel(s => ({ ...s, subject_id: e.target.value }))} disabled={!sel.class_id}>
              <option value="">-- Select subject --</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Session / Term</label>
            <select className="input-field" value={sel.session_id} onChange={e => setSel(s => ({ ...s, session_id: e.target.value }))}>
              <option value="">-- Select session --</option>
              {sessions.map(s => <option key={s.id} value={s.id}>{s.year} — {s.term} Term</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Upload method tabs */}
      {isSelComplete && (
        <div className="card">
          <div className="flex gap-1 mb-6 bg-gray-100 rounded-lg p-1 w-fit">
            <button onClick={() => setTab('form')} className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${tab === 'form' ? 'bg-white shadow text-primary-700' : 'text-gray-500 hover:text-gray-700'}`}>
              📝 Form Entry
            </button>
            <button onClick={() => setTab('csv')} className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${tab === 'csv' ? 'bg-white shadow text-primary-700' : 'text-gray-500 hover:text-gray-700'}`}>
              📂 CSV Upload
            </button>
          </div>

          {tab === 'form' ? (
            <form onSubmit={handleFormSubmit}>
              <h2 className="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wide">
                2. Enter Scores — {students.length} Students
              </h2>
              {students.length === 0 ? (
                <p className="text-gray-400 text-sm py-4">No students found in this class.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="pb-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide pr-4">Student</th>
                        <th className="pb-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide pr-4">Reg No.</th>
                        <th className="pb-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide pr-4">CA Score <span className="text-gray-300">(max 30)</span></th>
                        <th className="pb-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide pr-4">Exam Score <span className="text-gray-300">(max 70)</span></th>
                        <th className="pb-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {students.map(s => {
                        const ca   = parseFloat(scores[s.id]?.ca)   || 0
                        const exam = parseFloat(scores[s.id]?.exam) || 0
                        const total = ca + exam
                        const ex = existing.find(e => e.student_id === s.id || e.reg_number === s.reg_number)
                        return (
                          <tr key={s.id} className="hover:bg-gray-50">
                            <td className="py-3 pr-4">
                              <div className="flex items-center gap-3">
                                <Avatar src={s.photo_path} name={s.name} size="sm" />
                                <span className="font-medium text-gray-900">{s.name}</span>
                                {ex && <span className="text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded">Has result</span>}
                              </div>
                            </td>
                            <td className="py-3 pr-4 font-mono text-xs text-gray-500">{s.reg_number}</td>
                            <td className="py-3 pr-4">
                              <input
                                type="number" min="0" max="30" step="0.5"
                                className="input-field w-24"
                                value={scores[s.id]?.ca ?? ''}
                                onChange={e => setScore(s.id, 'ca', e.target.value)}
                                placeholder="0"
                              />
                            </td>
                            <td className="py-3 pr-4">
                              <input
                                type="number" min="0" max="70" step="0.5"
                                className="input-field w-24"
                                value={scores[s.id]?.exam ?? ''}
                                onChange={e => setScore(s.id, 'exam', e.target.value)}
                                placeholder="0"
                              />
                            </td>
                            <td className="py-3">
                              <span className={`font-bold text-base ${total >= 50 ? 'text-green-600' : total >= 40 ? 'text-orange-500' : 'text-red-500'}`}>
                                {ca + exam}
                              </span>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                  <div className="mt-6 flex justify-end">
                    <button type="submit" className="btn-primary px-8" disabled={saving}>
                      {saving ? 'Saving...' : '💾 Save All Results'}
                    </button>
                  </div>
                </div>
              )}
            </form>
          ) : (
            <form onSubmit={handleCsvSubmit}>
              <h2 className="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wide">2. Upload CSV File</h2>
              <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center mb-4">
                <p className="text-4xl mb-3">📂</p>
                <p className="text-gray-500 text-sm mb-3">Select a CSV file with columns: <code className="bg-gray-100 px-1 rounded">reg_number, ca_score, exam_score</code></p>
                <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={e => setCsvFile(e.target.files[0])} />
                <button type="button" className="btn-secondary" onClick={() => fileRef.current.click()}>Choose CSV file</button>
                {csvFile && <p className="mt-2 text-sm text-primary-600 font-medium">✓ {csvFile.name}</p>}
              </div>
              {csvErrors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                  <p className="text-red-700 font-semibold text-sm mb-2">Errors in CSV:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    {csvErrors.map((e, i) => <li key={i} className="text-red-600 text-sm">{e}</li>)}
                  </ul>
                </div>
              )}
              <div className="flex justify-end">
                <button type="submit" className="btn-primary px-8" disabled={saving || !csvFile}>
                  {saving ? 'Uploading...' : '⬆️ Upload CSV'}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {!isSelComplete && (
        <div className="card text-center py-14 text-gray-400">
          <p className="text-4xl mb-3">☝️</p>
          <p className="font-medium">Select a class, subject, and session above to begin.</p>
        </div>
      )}
    </Layout>
  )
}
