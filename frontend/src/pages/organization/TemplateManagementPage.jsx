import React, { useEffect, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { categoryAPI, templateAPI } from '../../services/endpoints'

export default function TemplateManagementPage() {
  const [templates, setTemplates] = useState([])
  const [categories, setCategories] = useState([])
  const [form, setForm] = useState({
    name: '',
    category_id: '',
    header_title: 'CERTIFICATE OF ACHIEVEMENT',
    primary_color: '#1E3A8A',
    accent_color: '#7C3AED',
    signatory_name: '',
    signatory_title: '',
  })
  const [error, setError] = useState('')

  const load = () => {
    Promise.all([templateAPI.list(), categoryAPI.list()]).then(([t, c]) => {
      setTemplates(t.data || [])
      setCategories(c.data || [])
    })
  }

  useEffect(load, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await templateAPI.create({
        ...form,
        category_id: form.category_id ? Number(form.category_id) : null,
      })
      setForm({ ...form, name: '', signatory_name: '', signatory_title: '' })
      load()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create template')
    }
  }

  const handleDelete = async (id) => {
    await templateAPI.remove(id)
    load()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Certificate Templates</h1>
        <p className="text-sm text-slate-600">Configure colors, headers, and authorized signatories for your PDFs.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <form onSubmit={handleCreate} className="card space-y-4 lg:col-span-1">
          <h2 className="text-lg font-semibold text-slate-900">New Template</h2>
          {error && <p className="text-xs text-rose-600">{error}</p>}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Template Name *</label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Category</label>
            <select
              value={form.category_id}
              onChange={(e) => setForm((p) => ({ ...p, category_id: e.target.value }))}
              className="input-field"
            >
              <option value="">Any Category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Header Title</label>
            <input
              value={form.header_title}
              onChange={(e) => setForm((p) => ({ ...p, header_title: e.target.value }))}
              className="input-field"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Primary Color</label>
              <input
                type="color"
                value={form.primary_color}
                onChange={(e) => setForm((p) => ({ ...p, primary_color: e.target.value }))}
                className="h-10 w-full rounded border border-slate-300"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Accent Color</label>
              <input
                type="color"
                value={form.accent_color}
                onChange={(e) => setForm((p) => ({ ...p, accent_color: e.target.value }))}
                className="h-10 w-full rounded border border-slate-300"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Signatory Name</label>
            <input
              value={form.signatory_name}
              onChange={(e) => setForm((p) => ({ ...p, signatory_name: e.target.value }))}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Signatory Title</label>
            <input
              value={form.signatory_title}
              onChange={(e) => setForm((p) => ({ ...p, signatory_title: e.target.value }))}
              className="input-field"
            />
          </div>
          <button type="submit" className="btn-primary w-full">
            <Plus className="h-4 w-4" /> Create Template
          </button>
        </form>

        <div className="lg:col-span-2 grid gap-4 sm:grid-cols-2 content-start">
          {templates.map((t) => (
            <div key={t.id} className="card space-y-3" style={{ borderTop: `4px solid ${t.primary_color}` }}>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-slate-900">{t.name}</h3>
                  <p className="text-xs text-slate-500">{t.header_title}</p>
                </div>
                <button onClick={() => handleDelete(t.id)} className="text-slate-400 hover:text-rose-600">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <p className="text-xs text-slate-600">Signatory: {t.signatory_name || 'Authorized Signatory'}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
