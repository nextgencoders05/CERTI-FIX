import React, { useEffect, useState } from 'react'
import DataTable from '../../components/common/DataTable'
import StatusBadge from '../../components/common/StatusBadge'
import { adminAPI } from '../../services/endpoints'

export default function AdminUsersPage() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    adminAPI
      .users()
      .then((res) => setUsers(res.data || []))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const toggleStatus = async (u) => {
    await adminAPI.toggleUserStatus(u.id, !u.is_active)
    load()
  }

  const columns = [
    { key: 'full_name', label: 'Full Name', render: (r) => <span className="font-semibold">{r.full_name}</span> },
    { key: 'email', label: 'Email' },
    { key: 'role', label: 'Role', render: (r) => <span className="capitalize">{r.role.replace('_', ' ')}</span> },
    {
      key: 'is_active',
      label: 'Status',
      render: (r) => <StatusBadge status={r.is_active ? 'verified' : 'suspended'} />,
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (r) => (
        <button
          onClick={() => toggleStatus(r)}
          className="text-xs font-semibold text-blue-600 hover:underline"
        >
          {r.is_active ? 'Deactivate' : 'Activate'}
        </button>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Manage Users</h1>
        <p className="text-sm text-slate-600">View registered users, roles, and account statuses.</p>
      </div>
      <DataTable columns={columns} data={users} loading={loading} searchKeys={['full_name', 'email', 'role']} />
    </div>
  )
}
