import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Award, CheckCircle2, ClipboardList, Download, Upload, LayoutTemplate } from 'lucide-react'
import { certificateAPI, correctionAPI, ocrAPI } from '../../services/endpoints'
import StatusBadge from '../../components/common/StatusBadge'

export default function UserDashboard() {
  const [uploads, setUploads] = useState([])
  const [requests, setRequests] = useState([])
  const [certs, setCerts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([ocrAPI.listUploads(), correctionAPI.list(), certificateAPI.list()])
      .then(([u, r, c]) => {
        setUploads(u.data || [])
        setRequests(r.data || [])
        setCerts(c.data || [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const stats = [
    { label: 'Uploaded Certificates', value: uploads.length, icon: Upload, color: 'text-blue-600 bg-blue-50' },
    { label: 'Correction Requests', value: requests.length, icon: ClipboardList, color: 'text-violet-600 bg-violet-50' },
    {
      label: 'Approved Re-issues',
      value: requests.filter((r) => r.status === 'approved').length,
      icon: CheckCircle2,
      color: 'text-emerald-600 bg-emerald-50',
    },
    { label: 'My Official Certificates', value: certs.length, icon: Award, color: 'text-indigo-600 bg-indigo-50' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">User Dashboard</h1>
          <p className="text-sm text-slate-600">Upload certificates, inspect AI OCR results, and track official corrections.</p>
        </div>
        <div className="flex flex-wrap gap-2"><Link to="/templates" className="btn-secondary"><LayoutTemplate className="h-4 w-4" /> Templates</Link><Link to="/user/upload" className="btn-primary"><Upload className="h-4 w-4" /> Upload Certificate</Link></div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => {
          const Icon = s.icon
          return (
            <div key={s.label} className="card flex items-center gap-4">
              <div className={`rounded-xl p-3 ${s.color}`}>
                <Icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500">{s.label}</p>
                <p className="text-2xl font-bold text-slate-900">{loading ? '—' : s.value}</p>
              </div>
            </div>
          )
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-slate-900">Recent Correction Requests</h2>
            <Link to="/user/corrections" className="text-xs font-semibold text-blue-600 hover:underline">
              View all
            </Link>
          </div>
          {requests.length === 0 ? (
            <p className="text-sm text-slate-500 py-4">No correction requests submitted yet.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {requests.slice(0, 5).map((r) => (
                <div key={r.id} className="py-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{r.request_code}</p>
                    <p className="text-xs text-slate-500">{r.organization_name}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={r.status} />
                    {r.corrected_certificate_uid && (
                      <a
                        href={certificateAPI.downloadUrl(r.corrected_certificate_uid)}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 hover:text-blue-800"
                        title="Download Corrected PDF"
                      >
                        <Download className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-slate-900">Recent OCR Uploads</h2>
            <Link to="/user/upload" className="text-xs font-semibold text-blue-600 hover:underline">
              Upload new
            </Link>
          </div>
          {uploads.length === 0 ? (
            <p className="text-sm text-slate-500 py-4">No certificates uploaded yet.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {uploads.slice(0, 5).map((u) => (
                <div key={u.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{u.original_filename}</p>
                    <p className="text-xs text-slate-500">Confidence: {u.ocr_confidence ?? 0}%</p>
                  </div>
                  <Link to={`/user/ocr/${u.id}`} className="text-xs font-semibold text-violet-600 hover:underline">
                    View OCR
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
