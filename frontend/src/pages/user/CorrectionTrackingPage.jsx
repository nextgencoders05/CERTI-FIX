import React, { useEffect, useState } from 'react'
import { Download } from 'lucide-react'
import DataTable from '../../components/common/DataTable'
import StatusBadge from '../../components/common/StatusBadge'
import { certificateAPI, correctionAPI } from '../../services/endpoints'

export default function CorrectionTrackingPage() {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    correctionAPI
      .list()
      .then((res) => setRequests(res.data || []))
      .finally(() => setLoading(false))
  }, [])

  const columns = [
    { key: 'request_code', label: 'Request ID', render: (r) => <span className="font-mono font-semibold">{r.request_code}</span> },
    { key: 'organization_name', label: 'Organization' },
    {
      key: 'requested_changes',
      label: 'Requested Changes',
      render: (r) => (
        <span className="text-xs text-slate-600">
          {r.requested_changes?.recipient_name} — {r.requested_changes?.title}
        </span>
      ),
    },
    { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
    {
      key: 'reviewer_notes',
      label: 'Reviewer Notes',
      render: (r) => <span className="text-xs text-slate-500">{r.reviewer_notes || '—'}</span>,
    },
    {
      key: 'actions',
      label: 'Official PDF',
      render: (r) =>
        r.corrected_certificate_uid ? (
          <a
            href={certificateAPI.downloadUrl(r.corrected_certificate_uid)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:underline"
          >
            <Download className="h-3.5 w-3.5" /> {r.corrected_certificate_uid}
          </a>
        ) : (
          <span className="text-xs text-slate-400">Pending</span>
        ),
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Correction Request Tracking</h1>
        <p className="text-sm text-slate-600">Monitor review status and download approved corrected certificates.</p>
      </div>
      <DataTable
        columns={columns}
        data={requests}
        loading={loading}
        searchKeys={['request_code', 'organization_name', 'status']}
        searchPlaceholder="Search by request ID or organization..."
      />
    </div>
  )
}
