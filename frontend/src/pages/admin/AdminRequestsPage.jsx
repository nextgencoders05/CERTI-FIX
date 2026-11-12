import React, { useEffect, useState } from 'react'
import DataTable from '../../components/common/DataTable'
import StatusBadge from '../../components/common/StatusBadge'
import { correctionAPI } from '../../services/endpoints'

export default function AdminRequestsPage() {
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
    { key: 'requester_name', label: 'Requester' },
    { key: 'organization_name', label: 'Target Organization' },
    { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
    { key: 'corrected_certificate_uid', label: 'Re-issued ID', render: (r) => <span className="font-mono text-xs">{r.corrected_certificate_uid || '—'}</span> },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">All Correction Requests</h1>
        <p className="text-sm text-slate-600">Platform-wide visibility into correction requests.</p>
      </div>
      <DataTable columns={columns} data={requests} loading={loading} searchKeys={['request_code', 'requester_name', 'organization_name']} />
    </div>
  )
}
