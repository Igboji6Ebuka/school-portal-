import { useEffect, useState } from 'react'
import api from '../../api/axios'
import Layout from '../../components/Layout'
import toast from 'react-hot-toast'

export default function ManageClasses() {
  const [classes,   setClasses]   = useState([])
  const [subjects,  setSubjects]  = useState([])
  const [loading,   setLoading]   = useState(true)
  const [newClass,  setNewClass]  = useState('')
  const [selClass,  setSelClass]  = useState(null)
  const [newSubject, setNewSubject] = useState('')
  const [saving,    setSaving]    = useState(false)

  const load = () => {
    Promise.all([api.get('/admin/classes'), api.get('/admin/subjects')])
      .then(([c, s]) => { setClasses(c.data); setSubjects(s.data) })
      .finally(() => setLoading(false))
  }
  useEffect(load, [])

  const addClass = async (e) => {
    e.preventDefault(); if (!newClass.trim()) return; setSaving(true)
    try { await api.post('/admin/classes', { name: newClass.trim() }); toast.success('Class added'); setNewClass(''); load() }
    catch (err) { toast.error(err.response?.data?.message || 'Failed') }
    finally { setSaving(false) }
  }

  const deleteClass = async (id, name) => {
    if (!confirm(`Delete class "${name}"? All subjects & results will be removed.`)) return
    try { await api.delete(`/admin/classes/${id}`); toast.success('Deleted'); setSelClass(null); load() }
    catch { toast.error('Delete failed') }
  }

  const addSubject = async (e) => {
    e.preventDefault(); if (!newSubject.trim() || !selClass) return; setSaving(true)
    try { await api.post('/admin/subjects', { name: newSubject.trim(), class_id: selClass.id }); toast.success('Subject added'); setNewSubject(''); load() }
    catch (err) { toast.error(err.response?.data?.message || 'Failed') }
    finally { setSaving(false) }
  }

  const deleteSubject = async (id) => {
    if (!confirm('Delete this subject?')) return
    try { await api.delete(`/admin/subjects/${id}`); toast.success('Subject deleted'); load() }
    catch { toast.error('Failed') }
  }

  if (loading) return <Layout title="Classes & Subjects"><div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-700" /></div></Layout>

  const classSubjects = selClass ? subjects.filter(s => s.class_id === selClass.id) : []

  return (
    <Layout title="Classes & Subjects" subtitle="Manage class groups and their subjects">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Classes */}
        <div className="card">
          <h2 className="text-base font-bold mb-4">Classes</h2>
          <form onSubmit={addClass} className="flex gap-2 mb-4">
            <input className="input-field" placeholder="New class name (e.g. JSS 1A)" value={newClass} onChange={e => setNewClass(e.target.value)} />
            <button className="btn-primary whitespace-nowrap" type="submit" disabled={saving}>+ Add</button>
          </form>
          <ul className="divide-y divide-gray-100">
            {classes.map(c => (
              <li
                key={c.id}
                className={`flex items-center justify-between py-3 px-2 rounded-lg cursor-pointer transition-colors ${selClass?.id === c.id ? 'bg-primary-50 border border-primary-200' : 'hover:bg-gray-50'}`}
                onClick={() => setSelClass(c)}
              >
                <div>
                  <span className="font-medium text-gray-900">{c.name}</span>
                  <span className="ml-2 text-xs text-gray-400">{c.student_count} students</span>
                </div>
                <button className="text-red-400 hover:text-red-600 text-xs" onClick={(e) => { e.stopPropagation(); deleteClass(c.id, c.name) }}>Delete</button>
              </li>
            ))}
            {classes.length === 0 && <p className="text-gray-400 text-sm py-4 text-center">No classes yet.</p>}
          </ul>
        </div>

        {/* Subjects */}
        <div className="card">
          <h2 className="text-base font-bold mb-1">
            {selClass ? `Subjects — ${selClass.name}` : 'Subjects'}
          </h2>
          {!selClass ? (
            <p className="text-gray-400 text-sm mt-3">Click a class on the left to manage its subjects.</p>
          ) : (
            <>
              <form onSubmit={addSubject} className="flex gap-2 mb-4 mt-4">
                <input className="input-field" placeholder="New subject name" value={newSubject} onChange={e => setNewSubject(e.target.value)} />
                <button className="btn-primary whitespace-nowrap" type="submit" disabled={saving}>+ Add</button>
              </form>
              <ul className="divide-y divide-gray-100">
                {classSubjects.map(s => (
                  <li key={s.id} className="flex items-center justify-between py-3 px-2 hover:bg-gray-50 rounded-lg">
                    <span className="text-gray-800">{s.name}</span>
                    <button className="text-red-400 hover:text-red-600 text-xs" onClick={() => deleteSubject(s.id)}>Remove</button>
                  </li>
                ))}
                {classSubjects.length === 0 && <p className="text-gray-400 text-sm py-4 text-center">No subjects for this class.</p>}
              </ul>
            </>
          )}
        </div>
      </div>
    </Layout>
  )
}
