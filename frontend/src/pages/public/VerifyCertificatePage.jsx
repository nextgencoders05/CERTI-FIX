import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { CheckCircle2, Download, Search, ShieldAlert, XCircle } from 'lucide-react'
import { certificateAPI, verifyAPI } from '../../services/endpoints'
import StatusBadge from '../../components/common/StatusBadge'

export default function VerifyCertificatePage() {
  const { uid: routeUid } = useParams()
  const [uid, setUid] = useState(routeUid || '')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const runVerification = async (targetUid) => {
    if (!targetUid?.trim()) return
    setLoading(true)
    setError('')
    try {
      const res = await verifyAPI.verify(targetUid.trim())
      setResult(res.data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Verification failed')
      setResult(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (routeUid) runVerification(routeUid)
  }, [routeUid])

  const handleSubmit = (e) => {
    e.preventDefault()
    runVerification(uid)
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-slate-900">Verify Official Certificate</h1>
        <p className="mt-2 text-slate-600">
          Enter a Certificate ID (e.g., <code className="font-mono text-blue-600">CFX-XXXXXXXXXX</code>) or scan its QR code.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-8 flex gap-3">
        <input
          type="text"
          value={uid}
          onChange={(e) => setUid(e.target.value)}
          placeholder="Enter Certificate ID..."
          className="input-field flex-1"
          required
        />
        <button type="submit" disabled={loading} className="btn-primary">
          <Search className="h-4 w-4" />
          {loading ? 'Checking...' : 'Verify'}
        </button>
      </form>

      {error && (
        <div className="mt-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div>
      )}

      {result && (
        <div className="mt-8 card">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              {result.is_valid ? (
                <CheckCircle2 className="h-9 w-9 text-emerald-600" />
              ) : result.status === 'revoked' ? (
                <ShieldAlert className="h-9 w-9 text-rose-600" />
              ) : (
                <XCircle className="h-9 w-9 text-rose-600" />
              )}
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  {result.is_valid ? 'Certificate Verified' : 'Verification Failed'}
                </h2>
                <p className="text-sm text-slate-600">{result.message}</p>
              </div>
            </div>
            <StatusBadge status={result.status} />
          </div>

          {result.status !== 'not_found' && (
            <div className="mt-6 grid gap-4 border-t border-slate-200 pt-6 sm:grid-cols-2 text-sm">
              <div>
                <p className="text-slate-500">Certificate ID</p>
                <p className="font-mono font-semibold text-slate-900">{result.certificate_uid}</p>
              </div>
              <div>
                <p className="text-slate-500">Recipient Name</p>
                <p className="font-semibold text-slate-900">{result.recipient_name}</p>
              </div>
              <div>
                <p className="text-slate-500">Program / Title</p>
                <p className="font-semibold text-slate-900">{result.title}</p>
              </div>
              <div>
                <p className="text-slate-500">Issuing Organization</p>
                <p className="font-semibold text-slate-900">{result.organization_name}</p>
              </div>
              <div>
                <p className="text-slate-500">Issue Date</p>
                <p className="font-semibold text-slate-900">{result.issue_date}</p>
              </div>
              <div>
                <p className="text-slate-500">Category</p>
                <p className="font-semibold text-slate-900">{result.category_name || 'Standard'}</p>
              </div>
            </div>
          )}

          {result.is_valid && (
            <div className="mt-6 flex justify-end border-t border-slate-200 pt-4">
              <a
                href={certificateAPI.downloadUrl(result.certificate_uid)}
                target="_blank"
                rel="noreferrer"
                className="btn-secondary"
              >
                <Download className="h-4 w-4" />
                Download Official PDF
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
