import React, { useEffect, useState } from 'react'
import DataTable from '../../components/common/DataTable'
import { adminAPI } from '../../services/endpoints'

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminAPI
      .auditLogs()
      .then((res) => setLogs(res.data || []))
      .finally(() => setLoading(false))
  }, [])

  const columns = [
    { key: 'action', label: 'Action', render: (r) => <span className="font-mono text-xs font-semibold text-blue-700">{r.action}</span> },
    { key: 'actor_email', label: 'Actor' },
    { key: 'resource_type', label: 'Resource' },
    { key: 'description', label: 'Details' },
    { key: 'created_at', label: 'Timestamp', render: (r) => new Date(r.created_at).toLocaleString() },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Security Audit Logs</h1>
        <p className="text-sm text-slate-600">Immutable record of authentication, issuance, correction, and admin actions.</p>
      </div>
      <DataTable columns={columns} data={logs} loading={loading} searchKeys={['action', 'actor_email', 'description']} />
    </div>
  )
}
