import { useEffect, useState } from 'react'
import api from '../../api/axios'
import Layout from '../../components/Layout'
import toast from 'react-hot-toast'

const TERMS = ['1st', '2nd', '3rd']
const YEARS = ['2023/2024', '2024/2025', '2025/2026', '2026/2027', '2027/2028']

export default function ManageSessions() {
  const [sessions, setSessions] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [form,     setForm]     = useState({ year: '2025/2026', term: '1st' })
  const [saving,   setSaving]   = useState(false)

  const load = () => api.get('/admin/sessions').then(r => setSessions(r.data)).finally(() => setLoading(false))
  useEffect(load, [])

  const handleCreate = async (e) => {
    e.preventDefault(); setSaving(true)
    try { await api.post('/admin/sessions', form); toast.success('Session created'); load() }
    catch (err) { toast.error(err.response?.data?.message || 'Failed') }
    finally { setSaving(false) }
  }

  const handleActivate = async (id) => {
    try { await api.put(`/admin/sessions/${id}/activate`); toast.success('Session activated'); load() }
    catch { toast.error('Failed') }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this session? All results for this session will also be deleted.')) return
    try { await api.delete(`/admin/sessions/${id}`); toast.success('Deleted'); load() }
    catch { toast.error('Delete failed') }
  }

  if (loading) return <Layout title="Sessions"><div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-700" /></div></Layout>

  return (
    <Layout title="Academic Sessions" subtitle="Manage academic years and terms">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Create */}
        <div className="card lg:col-span-1 self-start">
          <h2 className="text-base font-bold mb-4">Create New Session</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Academic Year</label>
              <select className="input-field" value={form.year} onChange={e => setForm(f => ({ ...f, year: e.target.value }))}>
                {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Term</label>
              <select className="input-field" value={form.term} onChange={e => setForm(f => ({ ...f, term: e.target.value }))}>
                {TERMS.map(t => <option key={t} value={t}>{t} Term</option>)}
              </select>
            </div>
            <button type="submit" className="btn-primary w-full" disabled={saving}>{saving ? 'Creating...' : 'Create Session'}</button>
          </form>
        </div>

        {/* List */}
        <div className="card lg:col-span-2">
          <h2 className="text-base font-bold mb-4">All Sessions</h2>
          <div className="space-y-3">
            {sessions.length === 0 ? <p className="text-gray-400 text-sm text-center py-4">No sessions yet.</p> : sessions.map(s => (
              <div key={s.id} className={`flex items-center justify-between p-4 rounded-xl border-2 ${s.is_active ? 'border-green-400 bg-green-50' : 'border-gray-100 bg-gray-50'}`}>
                <div>
                  <p className="font-semibold text-gray-900">{s.year} — {s.term} Term</p>
                  {s.is_active ? (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 mt-1">
                      <span className="w-2 h-2 rounded-full bg-green-500 inline-block" /> Active Session
                    </span>
                  ) : (
                    <span className="text-xs text-gray-400">Inactive</span>
                  )}
                </div>
                <div className="flex gap-2">
                  {!s.is_active && (
                    <button className="btn-secondary text-xs py-1.5 px-3" onClick={() => handleActivate(s.id)}>Set Active</button>
                  )}
                  <button className="text-red-400 hover:text-red-600 text-xs font-medium px-2" onClick={() => handleDelete(s.id)}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  )
}
