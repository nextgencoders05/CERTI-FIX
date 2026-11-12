import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Award } from 'lucide-react'
import { categoryAPI, certificateAPI, templateAPI } from '../../services/endpoints'

export default function CertificateCreationPage() {
  const navigate = useNavigate()
  const [templates, setTemplates] = useState([])
  const [categories, setCategories] = useState([])
  const [form, setForm] = useState({
    template_id: '',
    category_id: '',
    recipient_name: '',
    recipient_email: '',
    title: '',
    issue_date: new Date().toISOString().slice(0, 10),
    grade_or_score: '',
    description: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([templateAPI.list(), categoryAPI.list()]).then(([t, c]) => {
      setTemplates(t.data || [])
      setCategories(c.data || [])
    })
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await certificateAPI.issue({
        ...form,
        template_id: form.template_id ? Number(form.template_id) : null,
        category_id: form.category_id ? Number(form.category_id) : null,
        recipient_email: form.recipient_email || null,
        grade_or_score: form.grade_or_score || null,
        description: form.description || null,
      })
      navigate('/org/certificates')
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to issue certificate')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Issue Official Certificate</h1>
        <p className="text-sm text-slate-600">Generate a QR-verified PDF certificate with a unique Credential ID.</p>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-4">
        {error && (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
        )}

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Template (Optional)</label>
            <select
              value={form.template_id}
              onChange={(e) => setForm((p) => ({ ...p, template_id: e.target.value }))}
              className="input-field"
            >
              <option value="">Default Classic Navy</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
            <select
              value={form.category_id}
              onChange={(e) => setForm((p) => ({ ...p, category_id: e.target.value }))}
              className="input-field"
            >
              <option value="">Select category...</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Recipient Full Name *</label>
            <input
              required
              value={form.recipient_name}
              onChange={(e) => setForm((p) => ({ ...p, recipient_name: e.target.value }))}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Recipient Email</label>
            <input
              type="email"
              value={form.recipient_email}
              onChange={(e) => setForm((p) => ({ ...p, recipient_email: e.target.value }))}
              className="input-field"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Course / Achievement Title *</label>
          <input
            required
            value={form.title}
            onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
            className="input-field"
          />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Issue Date *</label>
            <input
              type="date"
              required
              value={form.issue_date}
              onChange={(e) => setForm((p) => ({ ...p, issue_date: e.target.value }))}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Grade / Score (Optional)</label>
            <input
              value={form.grade_or_score}
              onChange={(e) => setForm((p) => ({ ...p, grade_or_score: e.target.value }))}
              placeholder="e.g. Distinction (95%)"
              className="input-field"
            />
          </div>
        </div>

        <button type="submit" disabled={loading} className="btn-primary w-full">
          <Award className="h-4 w-4" />
          {loading ? 'Generating Official PDF...' : 'Generate & Issue Certificate'}
        </button>
      </form>
    </div>
  )
}
