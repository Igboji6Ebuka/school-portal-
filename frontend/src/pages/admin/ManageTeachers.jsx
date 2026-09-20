import { useEffect, useState } from 'react'
import api from '../../api/axios'
import Layout from '../../components/Layout'
import { Avatar } from '../../components/utils'
import toast from 'react-hot-toast'

const emptyForm = { name: '', email: '', password: '', phone: '' }

export default function ManageTeachers() {
  const [teachers, setTeachers] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form,     setForm]     = useState(emptyForm)
  const [editId,   setEditId]   = useState(null)
  const [saving,   setSaving]   = useState(false)
  const [search,   setSearch]   = useState('')

  const load = () => {
    api.get('/admin/teachers').then(r => setTeachers(r.data)).finally(() => setLoading(false))
  }
  useEffect(load, [])

  const filtered = teachers.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    (t.email || '').toLowerCase().includes(search.toLowerCase())
  )

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true)
    try {
      if (editId) { await api.put(`/admin/teachers/${editId}`, form); toast.success('Teacher updated') }
      else        { await api.post('/admin/teachers', form);           toast.success('Teacher created') }
      setShowForm(false); setForm(emptyForm); setEditId(null); load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed')
    } finally { setSaving(false) }
  }

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete teacher "${name}"?`)) return
    try { await api.delete(`/admin/teachers/${id}`); toast.success('Deleted'); load() }
    catch { toast.error('Delete failed') }
  }

  const startEdit = (t) => {
    setForm({ name: t.name, email: t.email || '', password: '', phone: t.phone || '' })
    setEditId(t.id); setShowForm(true)
  }

  if (loading) return <Layout title="Teachers"><div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-700" /></div></Layout>

  return (
    <Layout title="Manage Teachers" subtitle={`${teachers.length} teachers registered`}>
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input className="input-field max-w-xs" placeholder="Search by name or email..." value={search} onChange={e => setSearch(e.target.value)} />
        <button className="btn-primary ml-auto" onClick={() => { setShowForm(true); setForm(emptyForm); setEditId(null) }}>+ Add Teacher</button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold mb-4">{editId ? 'Edit Teacher' : 'Add New Teacher'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Full Name *</label>
                <input className="input-field" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email *</label>
                <input className="input-field" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Phone</label>
                <input className="input-field" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{editId ? 'New Password (leave blank to keep)' : 'Password *'}</label>
                <input className="input-field" type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required={!editId} />
              </div>
              <div className="flex gap-3 justify-end">
                <button type="button" className="btn-secondary" onClick={() => { setShowForm(false); setEditId(null) }}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving...' : editId ? 'Update' : 'Create Teacher'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.length === 0 ? (
          <p className="col-span-3 text-center text-gray-400 py-10">No teachers found.</p>
        ) : filtered.map(t => (
          <div key={t.id} className="card flex items-start gap-4">
            <Avatar name={t.name} size="md" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 truncate">{t.name}</p>
              <p className="text-sm text-gray-500 truncate">{t.email}</p>
              {t.phone && <p className="text-xs text-gray-400">{t.phone}</p>}
              <p className="text-xs text-gray-300 mt-1">Joined {new Date(t.created_at).toLocaleDateString()}</p>
              <div className="flex gap-3 mt-3">
                <button className="text-primary-600 hover:underline text-xs font-medium" onClick={() => startEdit(t)}>Edit</button>
                <button className="text-red-500 hover:underline text-xs font-medium" onClick={() => handleDelete(t.id, t.name)}>Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Layout>
  )
}
