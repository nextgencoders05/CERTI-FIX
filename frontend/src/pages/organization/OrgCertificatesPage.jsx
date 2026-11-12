import React, { useEffect, useState } from 'react'
import { Download, ExternalLink, ShieldOff } from 'lucide-react'
import { Link } from 'react-router-dom'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import DataTable from '../../components/common/DataTable'
import StatusBadge from '../../components/common/StatusBadge'
import { certificateAPI } from '../../services/endpoints'

export default function OrgCertificatesPage() {
  const [certs, setCerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [revokeTarget, setRevokeTarget] = useState(null)

  const load = () => {
    setLoading(true)
    certificateAPI
      .list()
      .then((res) => setCerts(res.data || []))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const handleRevoke = async () => {
    if (!revokeTarget) return
    await certificateAPI.revoke(revokeTarget, 'Revoked by issuing organization')
    setRevokeTarget(null)
    load()
  }

  const columns = [
    { key: 'certificate_uid', label: 'Certificate ID', render: (r) => <span className="font-mono font-semibold">{r.certificate_uid}</span> },
    { key: 'recipient_name', label: 'Recipient' },
    { key: 'title', label: 'Title' },
    { key: 'issue_date', label: 'Issue Date' },
    {
      key: 'status',
      label: 'Status',
      render: (r) => <StatusBadge status={r.is_revoked ? 'revoked' : 'valid'} />,
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (r) => (
        <div className="flex items-center gap-3">
          <a
            href={certificateAPI.downloadUrl(r.certificate_uid)}
            target="_blank"
            rel="noreferrer"
            className="text-blue-600 hover:text-blue-800"
            title="Download PDF"
          >
            <Download className="h-4 w-4" />
          </a>
          <Link to={`/verify/${r.certificate_uid}`} className="text-violet-600 hover:text-violet-800" title="Verify">
            <ExternalLink className="h-4 w-4" />
          </Link>
          {!r.is_revoked && (
            <button
              onClick={() => setRevokeTarget(r.certificate_uid)}
              className="text-rose-600 hover:text-rose-800"
              title="Revoke"
            >
              <ShieldOff className="h-4 w-4" />
            </button>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Issued Certificate Records</h1>
        <p className="text-sm text-slate-600">All official certificates and approved correction re-issues.</p>
      </div>

      <DataTable
        columns={columns}
        data={certs}
        loading={loading}
        searchKeys={['certificate_uid', 'recipient_name', 'title']}
      />

      <ConfirmDialog
        open={Boolean(revokeTarget)}
        title="Revoke Official Certificate?"
        message={`Revoking ${revokeTarget} will mark it as invalid on all public verification checks.`}
        confirmLabel="Revoke Certificate"
        danger
        onConfirm={handleRevoke}
        onCancel={() => setRevokeTarget(null)}
      />
    </div>
  )
}
