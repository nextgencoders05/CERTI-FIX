import React, { useEffect, useState } from 'react'
import { Check, X } from 'lucide-react'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import DataTable from '../../components/common/DataTable'
import StatusBadge from '../../components/common/StatusBadge'
import { correctionAPI } from '../../services/endpoints'

export default function OrgCorrectionReviewPage() {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [pendingAction, setPendingAction] = useState(null)

  const load = () => {
    setLoading(true)
    correctionAPI
      .list()
      .then((res) => setRequests(res.data || []))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const handleConfirm = async () => {
    if (!pendingAction) return
    await correctionAPI.decide(pendingAction.id, {
      decision: pendingAction.decision,
      reviewer_notes:
        pendingAction.decision === 'approved'
          ? 'Verified and approved by issuing organization.'
          : 'Rejected after verification check.',
    })
    setPendingAction(null)
    load()
  }

  const columns = [
    { key: 'request_code', label: 'Request ID', render: (r) => <span className="font-mono font-semibold">{r.request_code}</span> },
    { key: 'requester_name', label: 'Requester' },
    {
      key: 'requested_changes',
      label: 'Requested Correction',
      render: (r) => (
        <div className="text-xs">
          <p className="font-semibold text-slate-900">{r.requested_changes?.recipient_name}</p>
          <p className="text-slate-500">{r.requested_changes?.title}</p>
        </div>
      ),
    },
    { key: 'reason', label: 'Reason', render: (r) => <span className="text-xs text-slate-600">{r.reason}</span> },
    { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
    {
      key: 'actions',
      label: 'Decision',
      render: (r) =>
        r.status === 'pending' ? (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPendingAction({ id: r.id, code: r.request_code, decision: 'approved' })}
              className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
            >
              <Check className="h-3.5 w-3.5" /> Approve
            </button>
            <button
              onClick={() => setPendingAction({ id: r.id, code: r.request_code, decision: 'rejected' })}
              className="inline-flex items-center gap-1 rounded-lg bg-rose-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-rose-700"
            >
              <X className="h-3.5 w-3.5" /> Reject
            </button>
          </div>
        ) : (
          <span className="text-xs font-mono text-slate-500">{r.corrected_certificate_uid || 'Closed'}</span>
        ),
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Correction Requests Review</h1>
        <p className="text-sm text-slate-600">
          Approving a request automatically generates a new official PDF certificate with a fresh Credential ID.
        </p>
      </div>

      <DataTable
        columns={columns}
        data={requests}
        loading={loading}
        searchKeys={['request_code', 'requester_name', 'status']}
      />

      <ConfirmDialog
        open={Boolean(pendingAction)}
        title={pendingAction?.decision === 'approved' ? 'Approve & Re-issue Certificate?' : 'Reject Correction Request?'}
        message={`Are you sure you want to ${pendingAction?.decision} request ${pendingAction?.code}?`}
        confirmLabel={pendingAction?.decision === 'approved' ? 'Approve & Issue PDF' : 'Reject Request'}
        danger={pendingAction?.decision === 'rejected'}
        onConfirm={handleConfirm}
        onCancel={() => setPendingAction(null)}
      />
    </div>
  )
}
