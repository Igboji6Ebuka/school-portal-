import { useEffect, useState, useRef } from 'react'
import api from '../../api/axios'
import Layout from '../../components/Layout'
import { Avatar } from '../../components/utils'
import toast from 'react-hot-toast'

const emptyForm = { name: '', reg_number: '', password: '', class_id: '', email: '', phone: '' }

export default function ManageStudents() {
  const [students, setStudents]   = useState([])
  const [classes,  setClasses]    = useState([])
  const [loading,  setLoading]    = useState(true)
  const [search,   setSearch]     = useState('')
  const [showForm, setShowForm]   = useState(false)
  const [form,     setForm]       = useState(emptyForm)
  const [editId,   setEditId]     = useState(null)
  const [saving,   setSaving]     = useState(false)
  const [photoTarget, setPhotoTarget] = useState(null)
  const fileRef = useRef()

  const load = () => {
    Promise.all([api.get('/admin/students'), api.get('/admin/classes')])
      .then(([s, c]) => { setStudents(s.data); setClasses(c.data) })
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const filtered = students.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.reg_number || '').toLowerCase().includes(search.toLowerCase()) ||
    (s.class_name || '').toLowerCase().includes(search.toLowerCase())
  )

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (editId) {
        await api.put(`/admin/students/${editId}`, form)
        toast.success('Student updated')
      } else {
        await api.post('/admin/students', form)
        toast.success('Student created')
      }
      setShowForm(false); setForm(emptyForm); setEditId(null); load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed')
    } finally { setSaving(false) }
  }

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete student "${name}"? This also deletes their results.`)) return
    try {
      await api.delete(`/admin/students/${id}`)
      toast.success('Student deleted'); load()
    } catch { toast.error('Delete failed') }
  }

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0]
    if (!file || !photoTarget) return
    const fd = new FormData(); fd.append('photo', file)
    try {
      await api.post(`/admin/students/${photoTarget}/photo`, fd)
      toast.success('Photo updated'); load()
    } catch { toast.error('Photo upload failed') }
    setPhotoTarget(null)
    e.target.value = ''
  }

  const startEdit = (s) => {
    setForm({ name: s.name, reg_number: s.reg_number || '', password: '', class_id: s.class_id || '', email: s.email || '', phone: s.phone || '' })
    setEditId(s.id); setShowForm(true)
  }

  if (loading) return <Layout title="Students"><div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-700" /></div></Layout>

  return (
    <Layout title="Manage Students" subtitle={`${students.length} students registered`}>
      <input type="file" ref={fileRef} className="hidden" accept="image/*" onChange={handlePhotoUpload} />

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input
          className="input-field max-w-xs"
          placeholder="Search by name, reg no. or class..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <button className="btn-primary ml-auto" onClick={() => { setShowForm(true); setForm(emptyForm); setEditId(null) }}>
          + Add Student
        </button>
      </div>

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6">
            <h2 className="text-lg font-bold mb-4">{editId ? 'Edit Student' : 'Add New Student'}</h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1">Full Name *</label>
                <input className="input-field" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Reg. Number *</label>
                <input className="input-field" value={form.reg_number} onChange={e => setForm(f => ({ ...f, reg_number: e.target.value }))} required placeholder="e.g. STU001" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Class</label>
                <select className="input-field" value={form.class_id} onChange={e => setForm(f => ({ ...f, class_id: e.target.value }))}>
                  <option value="">-- Select class --</option>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input className="input-field" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Phone</label>
                <input className="input-field" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1">{editId ? 'New Password (leave blank to keep)' : 'Password *'}</label>
                <input className="input-field" type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required={!editId} placeholder="Password" />
              </div>
              <div className="col-span-2 flex gap-3 justify-end mt-2">
                <button type="button" className="btn-secondary" onClick={() => { setShowForm(false); setEditId(null) }}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving...' : editId ? 'Update' : 'Create Student'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              {['Photo', 'Name', 'Reg. No.', 'Class', 'Email', 'Joined', 'Actions'].map(h => (
                <th key={h} className="pb-3 text-left font-semibold text-gray-500 text-xs uppercase tracking-wide pr-4">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.length === 0 ? (
              <tr><td colSpan={7} className="py-8 text-center text-gray-400">No students found.</td></tr>
            ) : filtered.map(s => (
              <tr key={s.id} className="hover:bg-gray-50">
                <td className="py-3 pr-4">
                  <button
                    title="Click to change photo"
                    onClick={() => { setPhotoTarget(s.id); fileRef.current.click() }}
                    className="hover:opacity-80 transition-opacity cursor-pointer"
                  >
                    <Avatar src={s.photo_path} name={s.name} size="md" />
                  </button>
                </td>
                <td className="py-3 pr-4 font-medium text-gray-900">{s.name}</td>
                <td className="py-3 pr-4 font-mono text-xs text-gray-600 bg-gray-50 rounded px-1">{s.reg_number}</td>
                <td className="py-3 pr-4 text-gray-500">{s.class_name || '—'}</td>
                <td className="py-3 pr-4 text-gray-500">{s.email || '—'}</td>
                <td className="py-3 pr-4 text-gray-400 text-xs">{new Date(s.created_at).toLocaleDateString()}</td>
                <td className="py-3">
                  <div className="flex gap-2">
                    <button className="text-primary-600 hover:underline text-xs font-medium" onClick={() => startEdit(s)}>Edit</button>
                    <button className="text-red-500 hover:underline text-xs font-medium" onClick={() => handleDelete(s.id, s.name)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Layout>
  )
}
