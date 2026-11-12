import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, MessageCircle, Send, ShieldCheck, WandSparkles } from 'lucide-react'
import { correctionAPI, ocrAPI, orgAPI } from '../../services/endpoints'

export default function CertificateCorrectionPage() {
  const { uploadId } = useParams()
  const navigate = useNavigate()
  const [orgs, setOrgs] = useState([])
  const [originalName, setOriginalName] = useState('')
  const [quickInstruction, setQuickInstruction] = useState('')
  const [quickMessage, setQuickMessage] = useState('')
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
        const detectedName = f.recipient_name || ''
        setOriginalName(detectedName)
        setForm((prev) => ({
          ...prev,
          claimed_certificate_uid: f.certificate_id || '',
          recipient_name: detectedName,
          title: f.course_or_title || '',
          issue_date: f.issue_date || '',
        }))
      })
      .catch(() => setError('We could not load the certificate details. Please go back and upload it again.'))
  }, [uploadId])

  // A lightweight, predictable command helper. It only fills the request form;
  // it never edits the uploaded certificate or its QR code.
  const applyQuickInstruction = () => {
    const instruction = quickInstruction.trim()
    if (!instruction) return
    const patterns = [
      /(?:change|correct|update|replace)\s+(?:the\s+)?name\s+(?:from\s+.+?\s+)?to\s+(.+?)\s*[.!]?$/i,
      /(?:name\s*[:=-]\s*)(.+?)\s*[.!]?$/i,
    ]
    const match = patterns.map((pattern) => instruction.match(pattern)).find(Boolean)
    if (!match?.[1]?.trim()) {
      setQuickMessage('Try: “Change name from Mani to Neha” or “Change name to Neha”.')
      return
    }
    const requestedName = match[1].trim().replace(/[.!?]+$/, '')
    setForm((prev) => ({ ...prev, recipient_name: requestedName }))
    setQuickMessage(`Requested name set to “${requestedName}”. Please review it below before submitting.`)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.organization_id) return setError('Please select the organization that issued your certificate.')
    if (!form.recipient_name.trim() || !form.title.trim()) return setError('Please complete the corrected name and certificate title.')
    setLoading(true)
    try {
      await correctionAPI.submit({
        organization_id: Number(form.organization_id),
        uploaded_certificate_id: Number(uploadId),
        claimed_certificate_uid: form.claimed_certificate_uid || null,
        requested_changes: {
          recipient_name: form.recipient_name.trim(),
          title: form.title.trim(),
          issue_date: form.issue_date,
        },
        reason: form.reason,
        supporting_notes: form.supporting_notes || null,
      })
      navigate('/user/corrections')
    } catch (err) {
      setError(err.response?.data?.detail || 'We could not submit your request. Please check the details and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-5 sm:space-y-6">
      <button type="button" onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-indigo-700">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <header className="rounded-2xl bg-gradient-to-br from-indigo-700 via-blue-700 to-violet-700 p-5 text-white shadow-sm sm:p-7">
        <div className="flex items-center gap-2 text-sm font-semibold text-indigo-100"><ShieldCheck className="h-4 w-4" /> CERTIFICATE SUPPORT</div>
        <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">Request a certificate correction</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-blue-100">Tell us what needs fixing. We’ll send your request to the organization that issued the certificate.</p>
        <div className="mt-5 grid grid-cols-3 gap-2 text-center text-xs sm:max-w-lg">
          <div className="rounded-xl bg-white/10 px-2 py-3"><span className="block text-lg font-bold">1</span>Review details</div>
          <div className="rounded-xl bg-white/10 px-2 py-3"><span className="block text-lg font-bold">2</span>Submit request</div>
          <div className="rounded-xl bg-white/10 px-2 py-3"><span className="block text-lg font-bold">3</span>Issuer reviews</div>
        </div>
      </header>

      <section className="card space-y-3">
        <div className="flex items-start gap-3">
          <span className="rounded-xl bg-violet-100 p-2 text-violet-700"><MessageCircle className="h-5 w-5" /></span>
          <div className="min-w-0 flex-1">
            <h2 className="font-bold text-slate-900">Quick change assistant</h2>
            <p className="mt-1 text-sm leading-5 text-slate-600">Type what you want corrected in everyday language. We’ll fill the form for you to review.</p>
          </div>
        </div>
        {originalName && <p className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">Name detected on upload: <strong className="text-slate-900">{originalName}</strong></p>}
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            value={quickInstruction}
            onChange={(e) => { setQuickInstruction(e.target.value); setQuickMessage('') }}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); applyQuickInstruction() } }}
            placeholder="Example: Change name from Mani to Neha"
            aria-label="Describe the correction you need"
            className="input-field min-w-0 flex-1"
          />
          <button type="button" onClick={applyQuickInstruction} className="btn-primary shrink-0"><WandSparkles className="h-4 w-4" /> Apply to form</button>
        </div>
        {quickMessage && <p role="status" className="text-sm text-indigo-700">{quickMessage}</p>}
      </section>

      <form onSubmit={handleSubmit} className="card space-y-5">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Review your correction details</h2>
          <p className="mt-1 text-sm text-slate-500">Check every field carefully before sending your request.</p>
        </div>
        {error && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

        <div>
          <label htmlFor="issuer" className="mb-1.5 block text-sm font-semibold text-slate-700">Issuing organization <span className="text-rose-600">*</span></label>
          <select id="issuer" required value={form.organization_id} onChange={(e) => setForm((p) => ({ ...p, organization_id: e.target.value }))} className="input-field">
            <option value="">Choose the organization that issued your certificate</option>
            {orgs.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
          </select>
          {!orgs.length && <p className="mt-1.5 text-xs text-amber-700">No verified organizations are currently listed. Please try again later or contact support.</p>}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="certificate-id" className="mb-1.5 block text-sm font-semibold text-slate-700">Certificate ID <span className="font-normal text-slate-400">(if available)</span></label>
            <input id="certificate-id" value={form.claimed_certificate_uid} onChange={(e) => setForm((p) => ({ ...p, claimed_certificate_uid: e.target.value }))} placeholder="CFX-..." className="input-field" />
          </div>
          <div>
            <label htmlFor="issue-date" className="mb-1.5 block text-sm font-semibold text-slate-700">Correct issue date</label>
            <input id="issue-date" type="date" value={form.issue_date} onChange={(e) => setForm((p) => ({ ...p, issue_date: e.target.value }))} className="input-field" />
          </div>
        </div>

        <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-4">
          <div className="mb-3 flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-indigo-700" /><h3 className="text-sm font-bold text-slate-800">Requested information</h3></div>
          <label htmlFor="recipient-name" className="mb-1.5 block text-sm font-semibold text-slate-700">Correct name <span className="text-rose-600">*</span></label>
          <input id="recipient-name" required value={form.recipient_name} onChange={(e) => setForm((p) => ({ ...p, recipient_name: e.target.value }))} placeholder="Enter the correct full name" className="input-field bg-white" />
          <label htmlFor="certificate-title" className="mb-1.5 mt-4 block text-sm font-semibold text-slate-700">Correct course / certificate title <span className="text-rose-600">*</span></label>
          <input id="certificate-title" required value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} placeholder="Enter the correct title" className="input-field bg-white" />
        </div>

        <div>
          <label htmlFor="reason" className="mb-1.5 block text-sm font-semibold text-slate-700">Why does this need correction? <span className="text-rose-600">*</span></label>
          <textarea id="reason" required rows={3} minLength={5} value={form.reason} onChange={(e) => setForm((p) => ({ ...p, reason: e.target.value }))} placeholder="Example: My name is misspelled on the certificate. Please correct it to match my official records." className="input-field resize-y" />
        </div>
        <div>
          <label htmlFor="notes" className="mb-1.5 block text-sm font-semibold text-slate-700">Additional notes <span className="font-normal text-slate-400">(optional)</span></label>
          <textarea id="notes" rows={2} value={form.supporting_notes} onChange={(e) => setForm((p) => ({ ...p, supporting_notes: e.target.value }))} placeholder="Add any helpful details for the issuing organization." className="input-field resize-y" />
        </div>

        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-900">
          <strong>Important:</strong> Your uploaded original certificate, its existing design, font, and QR code are not edited by this request. The issuing organization reviews the details and, if approved, creates an official corrected re-issue using its authorized certificate template and verification data.
        </div>
        <button type="submit" disabled={loading || !orgs.length} className="btn-primary w-full py-3">
          <Send className="h-4 w-4" /> {loading ? 'Sending your request…' : 'Submit correction request'}
        </button>
      </form>
    </div>
  )
}
