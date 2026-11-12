import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileUp, ShieldAlert, FileText, Image as ImageIcon, X, Eye } from 'lucide-react'
import { ocrAPI } from '../../services/endpoints'

export default function CertificateUploadPage() {
  const navigate = useNavigate()
  const [file, setFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const chooseFile = (next) => {
    setError('')
    if (!next) return
    const allowed = ['application/pdf', 'image/png', 'image/jpeg']
    if (!allowed.includes(next.type)) return setError('Please choose a PDF, PNG, or JPG file.')
    if (next.size > 10 * 1024 * 1024) return setError('The file must be 10 MB or smaller.')
    setFile(next)
  }
  useEffect(() => {
    if (!file) { setPreviewUrl(''); return }
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [file])
  const handleUpload = async (e) => {
    e.preventDefault()
    if (!file) return
    setError(''); setLoading(true)
    try {
      const formData = new FormData(); formData.append('file', file)
      const res = await ocrAPI.upload(formData)
      navigate(`/user/ocr/${res.data.id}`)
    } catch (err) { setError(err.response?.data?.detail || 'Upload or OCR processing failed. Please try again.') }
    finally { setLoading(false) }
  }
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div><p className="text-sm font-semibold text-indigo-600">UPLOAD WORKSPACE</p><h1 className="mt-1 text-3xl font-bold text-slate-900">Upload your certificate</h1><p className="mt-2 text-sm text-slate-600">Choose a certificate image or PDF. Preview it before sending it for text recognition.</p></div>
      <div className="grid gap-6 lg:grid-cols-5">
        <form onSubmit={handleUpload} className="card space-y-5 lg:col-span-2">
          <div onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); chooseFile(e.dataTransfer.files?.[0]) }} className="rounded-2xl border-2 border-dashed border-indigo-200 bg-indigo-50/50 p-8 text-center transition hover:border-indigo-400">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-indigo-600 shadow-sm"><FileUp className="h-7 w-7" /></span>
            <h2 className="mt-4 font-bold text-slate-900">Drag & drop your file</h2><p className="mt-1 text-xs text-slate-500">or browse from your device</p>
            <label className="btn-secondary mt-4 cursor-pointer">Choose file<input type="file" accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg" className="hidden" onChange={(e) => chooseFile(e.target.files?.[0])} /></label>
            <p className="mt-4 text-[11px] text-slate-500">PDF, PNG, JPG · Maximum 10 MB</p>
          </div>
          {file && <div className="flex items-center gap-3 rounded-xl border border-slate-200 p-3"><span className="rounded-lg bg-slate-100 p-2 text-slate-600">{file.type === 'application/pdf' ? <FileText className="h-5 w-5" /> : <ImageIcon className="h-5 w-5" />}</span><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-slate-800">{file.name}</p><p className="text-xs text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p></div><button type="button" onClick={() => setFile(null)} aria-label="Remove file" className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600"><X className="h-4 w-4" /></button></div>}
          {error && <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
          <div className="rounded-xl bg-amber-50 p-3 text-xs leading-5 text-amber-800"><ShieldAlert className="mb-1 inline h-4 w-4" /> OCR is for reviewing information and preparing correction requests. Only the issuing organization can approve and re-issue an official certificate.</div>
          <button type="submit" disabled={!file || loading} className="btn-primary w-full">{loading ? 'Uploading & extracting text…' : 'Upload & extract text'}</button>
        </form>
        <section className="card min-h-[360px] lg:col-span-3"><div className="mb-4 flex items-center justify-between"><div><h2 className="font-bold text-slate-900">Certificate preview</h2><p className="text-xs text-slate-500">A local preview before upload</p></div><Eye className="h-5 w-5 text-slate-400" /></div>
          {previewUrl ? (file?.type === 'application/pdf' ? <iframe title="Certificate PDF preview" src={previewUrl} className="h-[520px] w-full rounded-xl border border-slate-200" /> : <div className="flex min-h-[460px] items-center justify-center rounded-xl bg-slate-100 p-3"><img src={previewUrl} alt="Uploaded certificate preview" className="max-h-[500px] max-w-full rounded-lg object-contain shadow" /></div>) : <div className="flex min-h-[460px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 text-center"><FileText className="h-12 w-12 text-slate-300" /><p className="mt-3 text-sm font-semibold text-slate-600">Your preview will appear here</p><p className="mt-1 text-xs text-slate-400">Select a PDF or image to get started</p></div>}
        </section>
      </div>
    </div>
  )
}
