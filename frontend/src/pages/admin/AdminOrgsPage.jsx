import React, { useEffect, useState } from 'react'
import { Check, X } from 'lucide-react'
import DataTable from '../../components/common/DataTable'
import StatusBadge from '../../components/common/StatusBadge'
import { adminAPI } from '../../services/endpoints'

export default function AdminOrgsPage() {
  const [orgs, setOrgs] = useState([])
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    adminAPI
      .organizations()
      .then((res) => setOrgs(res.data || []))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const handleVerify = async (id, status) => {
    await adminAPI.verifyOrg(id, { status })
    load()
  }

  const columns = [
    { key: 'name', label: 'Organization', render: (r) => <span className="font-semibold">{r.name}</span> },
    { key: 'contact_email', label: 'Contact Email' },
    { key: 'registration_number', label: 'Reg. No.' },
    { key: 'verification_status', label: 'Status', render: (r) => <StatusBadge status={r.verification_status} /> },
    {
      key: 'actions',
      label: 'Actions',
      render: (r) => (
        <div className="flex items-center gap-2">
          {r.verification_status !== 'verified' && (
            <button
              onClick={() => handleVerify(r.id, 'verified')}
              className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-emerald-700"
            >
              <Check className="h-3.5 w-3.5" /> Verify
            </button>
          )}
          {r.verification_status !== 'rejected' && (
            <button
              onClick={() => handleVerify(r.id, 'rejected')}
              className="inline-flex items-center gap-1 rounded-lg bg-rose-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-rose-700"
            >
              <X className="h-3.5 w-3.5" /> Reject
            </button>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Manage Organizations</h1>
        <p className="text-sm text-slate-600">Verify or reject issuing organizations before they can issue certificates.</p>
      </div>
      <DataTable
        columns={columns}
        data={orgs}
        loading={loading}
        searchKeys={['name', 'contact_email', 'verification_status']}
      />
    </div>
  )
}
