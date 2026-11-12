import React, { useEffect, useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Download, Save, Sparkles } from 'lucide-react'

const DESIGNS = {
  achievement: { name: 'Achievement', title: 'CERTIFICATE OF ACHIEVEMENT', subtitle: 'This certificate is proudly presented to', accent: '#b7791f' },
  course: { name: 'Course Completion', title: 'CERTIFICATE OF COMPLETION', subtitle: 'has successfully completed the course', accent: '#3157a4' },
  participation: { name: 'Participation', title: 'CERTIFICATE OF PARTICIPATION', subtitle: 'is recognized for participating in', accent: '#0f766e' },
  internship: { name: 'Internship', title: 'INTERNSHIP CERTIFICATE', subtitle: 'has successfully completed an internship in', accent: '#6d4bb3' },
  training: { name: 'Training', title: 'TRAINING CERTIFICATE', subtitle: 'has completed the training program', accent: '#b45309' },
  appreciation: { name: 'Appreciation', title: 'CERTIFICATE OF APPRECIATION', subtitle: 'is appreciated for valuable contribution to', accent: '#be4564' },
}
const fresh = (d) => ({ name: '', course: 'Web Development', organization: 'Your Organization', date: new Date().toISOString().slice(0, 10), signatory: 'Authorized by', title: d.title, accent: d.accent })

export default function TemplateDraftEditorPage() {
  const { templateId } = useParams()
  const [params] = useSearchParams()
  const design = useMemo(() => DESIGNS[templateId] || DESIGNS.achievement, [templateId])
  const [form, setForm] = useState(() => fresh(design))
  const [savedMessage, setSavedMessage] = useState('')
  useEffect(() => {
    const draftId = params.get('draft')
    if (!draftId) { setForm(fresh(design)); return }
    try { const all = JSON.parse(localStorage.getItem('certifix-drafts') || '[]'); const found = all.find((x) => x.id === draftId); if (found) setForm(found.form) } catch { /* ignore malformed local draft data */ }
  }, [design, params])
  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }))
  const saveDraft = () => {
    const all = JSON.parse(localStorage.getItem('certifix-drafts') || '[]')
    const id = params.get('draft') || (globalThis.crypto?.randomUUID?.() || `draft-${Date.now()}`)
    const draft = { id, templateId, templateName: design.name, name: form.name || 'Untitled certificate', form, updatedAt: new Date().toISOString() }
    localStorage.setItem('certifix-drafts', JSON.stringify([draft, ...all.filter((x) => x.id !== id)]))
    setSavedMessage('Draft saved in this browser.')
    window.setTimeout(() => setSavedMessage(''), 2500)
  }
  return <div className="min-h-screen bg-slate-50"><div className="mx-auto max-w-7xl px-4 py-7"><Link to="/templates" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-indigo-700"><ArrowLeft className="h-4 w-4" /> Back to templates</Link><div className="mt-5 flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-bold tracking-widest text-indigo-600">TEMPLATE EDITOR</p><h1 className="mt-1 text-3xl font-black text-slate-950">Customize your draft</h1><p className="mt-2 text-sm text-slate-600">Edit the fields and see your design update instantly.</p></div><div className="flex gap-2"><button onClick={saveDraft} className="btn-secondary"><Save className="h-4 w-4" /> Save draft</button><button onClick={() => window.print()} className="btn-primary"><Download className="h-4 w-4" /> Print / Save PDF</button></div></div>
      {savedMessage && <p role="status" className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{savedMessage}</p>}
      <div className="mt-7 grid gap-6 xl:grid-cols-[350px_1fr]"><section className="card h-fit space-y-4 print:hidden"><div className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-violet-600" /><h2 className="font-bold text-slate-900">Edit certificate details</h2></div>
        {[['name','Recipient name'],['course','Course / achievement'],['organization','Organization / event'],['date','Date'],['signatory','Signatory label']].map(([key,label]) => <label key={key} className="block"><span className="mb-1.5 block text-xs font-semibold text-slate-700">{label}</span><input type={key === 'date' ? 'date' : 'text'} value={form[key]} onChange={(e) => update(key,e.target.value)} placeholder={label} className="input-field" /></label>)}
        <label className="block"><span className="mb-1.5 block text-xs font-semibold text-slate-700">Accent color</span><input type="color" value={form.accent} onChange={(e) => update('accent',e.target.value)} className="h-11 w-full cursor-pointer rounded-lg border border-slate-200 bg-white p-1" /></label>
        <p className="rounded-lg bg-amber-50 p-3 text-xs leading-5 text-amber-800">This is a self-created draft template. It is not an official certificate and does not represent institutional approval.</p>
      </section>
      <section className="rounded-2xl border border-slate-200 bg-slate-200/70 p-3 sm:p-6"><div id="certificate-draft" className="mx-auto flex aspect-[1.414/1] w-full max-w-4xl flex-col items-center justify-center bg-[#fffdf7] p-4 text-center shadow-xl sm:p-10" style={{ border: `12px double ${form.accent}` }}><div className="flex h-full w-full flex-col items-center justify-center border px-3 sm:px-8" style={{ borderColor: `${form.accent}66` }}><div className="rounded-full p-2" style={{ color: form.accent }}><Sparkles className="h-6 w-6 sm:h-9 sm:w-9" /></div><p className="mt-2 text-[clamp(10px,2vw,22px)] font-black tracking-[.12em]" style={{ color: form.accent }}>{form.title}</p><div className="my-3 h-px w-1/3" style={{ backgroundColor: form.accent }} /><p className="text-[clamp(8px,1.3vw,14px)] text-slate-500">{design.subtitle}</p><h2 className="mt-3 break-words font-serif text-[clamp(20px,4vw,42px)] font-bold text-slate-800">{form.name || 'Recipient Name'}</h2><p className="mt-3 text-[clamp(9px,1.5vw,16px)] text-slate-600">{form.course || 'Course or achievement'}</p><p className="mt-1 text-[clamp(8px,1.2vw,13px)] text-slate-500">{form.organization || 'Organization / event'}</p><div className="mt-7 flex w-full items-end justify-between px-2 sm:px-8"><div className="text-left"><div className="mb-1 w-20 border-t border-slate-400 sm:w-32"/><p className="text-[8px] text-slate-600 sm:text-xs">{form.date || 'Date'}</p></div><div className="text-right"><div className="mb-1 ml-auto w-20 border-t border-slate-400 sm:w-32"/><p className="text-[8px] text-slate-600 sm:text-xs">{form.signatory || 'Authorized by'}</p></div></div><p className="mt-4 text-[7px] font-semibold tracking-widest text-slate-400 sm:text-[9px]">PERSONAL DRAFT · NOT AN OFFICIAL CREDENTIAL</p></div></div></section></div>
    </div><style>{`@media print { body { background: white !important; } body * { visibility: hidden; } #certificate-draft, #certificate-draft * { visibility: visible; } #certificate-draft { position: absolute; left: 0; top: 0; width: 100vw; max-width: none; box-shadow: none; } @page { size: landscape; margin: 8mm; } }`}</style></div>
}
