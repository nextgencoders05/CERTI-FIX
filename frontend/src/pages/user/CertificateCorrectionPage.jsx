import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Send } from 'lucide-react'
import { correctionAPI, ocrAPI, orgAPI } from '../../services/endpoints'

export default function CertificateCorrectionPage() {
  const { uploadId } = useParams()
  const navigate = useNavigate()
  const [orgs, setOrgs] = useState([])
  const [form, setForm] = useState({
    organization_id: '',
    claimed_certificate_uid: '',
    recipient_name: '',
    title: '',
    issue_date: '',
    reason: '',
    supporting_notes: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([orgAPI.listVerified(), ocrAPI.getUpload(uploadId)])
      .then(([orgRes, ocrRes]) => {
        setOrgs(orgRes.data || [])
        const f = ocrRes.data?.ocr_extracted_fields || {}
        setForm((prev) => ({
          ...prev,
          claimed_certificate_uid: f.certificate_id || '',
          recipient_name: f.recipient_name || '',
          title: f.course_or_title || '',
          issue_date: f.issue_date || '',
        }))
      })
      .catch(() => {})
  }, [uploadId])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await correctionAPI.submit({
        organization_id: Number(form.organization_id),
        uploaded_certificate_id: Number(uploadId),
        claimed_certificate_uid: form.claimed_certificate_uid || null,
        requested_changes: {
          recipient_name: form.recipient_name,
          title: form.title,
          issue_date: form.issue_date,
        },
        reason: form.reason,
        supporting_notes: form.supporting_notes || null,
      })
      navigate('/user/corrections')
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to submit correction request')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Submit Certificate Correction Request</h1>
        <p className="text-sm text-slate-600">
          Review the OCR-extracted values, enter the exact corrections needed, and route to the issuing organization.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-4">
        {error && (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Issuing Organization *</label>
          <select
            required
            value={form.organization_id}
            onChange={(e) => setForm((p) => ({ ...p, organization_id: e.target.value }))}
            className="input-field"
          >
            <option value="">Select verified organization...</option>
            {orgs.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Original Certificate ID</label>
            <input
              value={form.claimed_certificate_uid}
              onChange={(e) => setForm((p) => ({ ...p, claimed_certificate_uid: e.target.value }))}
              placeholder="CFX-..."
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Corrected Issue Date (YYYY-MM-DD)</label>
            <input
              type="date"
              value={form.issue_date}
              onChange={(e) => setForm((p) => ({ ...p, issue_date: e.target.value }))}
              className="input-field"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Corrected Recipient Name *</label>
          <input
            required
            value={form.recipient_name}
            onChange={(e) => setForm((p) => ({ ...p, recipient_name: e.target.value }))}
            className="input-field"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Corrected Course / Certificate Title *</label>
          <input
            required
            value={form.title}
            onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
            className="input-field"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Reason for Correction *</label>
          <textarea
            required
            rows={3}
            minLength={5}
            value={form.reason}
            onChange={(e) => setForm((p) => ({ ...p, reason: e.target.value }))}
            placeholder="Explain what needs to be corrected (e.g., spelling error in recipient name)."
            className="input-field"
          />
        </div>

        <button type="submit" disabled={loading} className="btn-primary w-full">
          <Send className="h-4 w-4" />
          {loading ? 'Submitting...' : 'Submit Official Correction Request'}
        </button>
      </form>
    </div>
  )
}
