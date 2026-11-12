import React, { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowRight, ScanText, ShieldAlert } from 'lucide-react'
import { ocrAPI } from '../../services/endpoints'
import StatusBadge from '../../components/common/StatusBadge'

export default function OCRResultsPage() {
  const { uploadId } = useParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    ocrAPI
      .getUpload(uploadId)
      .then((res) => setData(res.data))
      .catch((err) => setError(err.response?.data?.detail || 'Failed to load OCR results'))
      .finally(() => setLoading(false))
  }, [uploadId])

  if (loading) return <div className="py-12 text-center text-slate-500">Loading OCR results...</div>
  if (error) return <div className="card text-rose-600">{error}</div>
  if (!data) return null

  const fields = data.ocr_extracted_fields || {}

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">OCR Recognition Results</h1>
          <p className="text-sm text-slate-600">File: {data.original_filename}</p>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={data.ocr_status} />
          <Link to={`/user/correction/new/${data.id}`} className="btn-primary">
            Request Correction <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex gap-3 text-sm text-amber-800">
        <ShieldAlert className="h-5 w-5 shrink-0 text-amber-600" />
        <p>{fields.disclaimer || 'OCR results are automated extractions and do not constitute proof of authenticity.'}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <ScanText className="h-5 w-5 text-blue-600" /> Extracted Fields
            </h2>
            <span className="text-xs font-semibold text-violet-700 bg-violet-50 px-2.5 py-1 rounded-full">
              Confidence: {data.ocr_confidence ?? 0}%
            </span>
          </div>

          <dl className="divide-y divide-slate-100 text-sm">
            {[
              ['Certificate ID', fields.certificate_id],
              ['Recipient Name', fields.recipient_name],
              ['Course / Title', fields.course_or_title],
              ['Issue Date', fields.issue_date],
              ['Organization', fields.organization_name],
              ['Suggested Category', fields.category_guess],
            ].map(([label, val]) => (
              <div key={label} className="py-3 flex justify-between gap-4">
                <dt className="text-slate-500">{label}</dt>
                <dd className="font-semibold text-slate-900 text-right">{val || 'Not detected'}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="card space-y-3">
          <h2 className="text-lg font-semibold text-slate-900">Raw OCR Text</h2>
          <pre className="max-h-80 overflow-y-auto rounded-lg bg-slate-900 p-4 text-xs text-slate-100 whitespace-pre-wrap font-mono">
            {data.ocr_raw_text || 'No text extracted.'}
          </pre>
        </div>
      </div>
    </div>
  )
}
