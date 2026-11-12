import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileUp, ShieldAlert } from 'lucide-react'
import { ocrAPI } from '../../services/endpoints'

export default function CertificateUploadPage() {
  const navigate = useNavigate()
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleUpload = async (e) => {
    e.preventDefault()
    if (!file) return
    setError('')
    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await ocrAPI.upload(formData)
      navigate(`/user/ocr/${res.data.id}`)
    } catch (err) {
      setError(err.response?.data?.detail || 'Upload or OCR processing failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Upload Certificate for AI OCR</h1>
        <p className="text-sm text-slate-600">
          Supported formats: PDF, PNG, JPG, JPEG (max 10 MB). Stored privately and never exposed publicly.
        </p>
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex gap-3 text-sm text-amber-800">
        <ShieldAlert className="h-5 w-5 shrink-0 text-amber-600" />
        <p>
          Automated OCR extraction helps pre-fill correction requests. OCR results are not proof of authenticity;
          only the issuing organization can verify and re-issue official certificates.
        </p>
      </div>

      <form onSubmit={handleUpload} className="card space-y-5">
        {error && (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
        )}

        <label className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50/70 p-10 text-center cursor-pointer hover:border-blue-500 transition">
          <FileUp className="h-10 w-10 text-blue-600 mb-3" />
          <span className="text-sm font-semibold text-slate-900">
            {file ? file.name : 'Click to select a certificate file'}
          </span>
          <span className="mt-1 text-xs text-slate-500">PDF, PNG, or JPEG up to 10 MB</span>
          <input
            type="file"
            accept=".pdf,.png,.jpg,.jpeg"
            className="hidden"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
        </label>

        <button type="submit" disabled={!file || loading} className="btn-primary w-full">
          {loading ? 'Running OpenCV & Tesseract OCR...' : 'Upload & Extract Text'}
        </button>
      </form>
    </div>
  )
}
