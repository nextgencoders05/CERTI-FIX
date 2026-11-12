import React, { useEffect, useState } from 'react'
import { Award, Building2, CheckCircle2, ClipboardList, Users } from 'lucide-react'
import { adminAPI } from '../../services/endpoints'

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)

  useEffect(() => {
    adminAPI.stats().then((res) => setStats(res.data)).catch(() => {})
  }, [])

  const cards = [
    { label: 'Total Users', value: stats?.total_users ?? '—', icon: Users, color: 'text-blue-600 bg-blue-50' },
    {
      label: 'Verified Organizations',
      value: stats ? `${stats.verified_organizations} / ${stats.total_organizations}` : '—',
      icon: Building2,
      color: 'text-violet-600 bg-violet-50',
    },
    { label: 'Issued Certificates', value: stats?.total_certificates ?? '—', icon: Award, color: 'text-emerald-600 bg-emerald-50' },
    {
      label: 'Pending Corrections',
      value: stats?.pending_correction_requests ?? '—',
      icon: ClipboardList,
      color: 'text-amber-600 bg-amber-50',
    },
    {
      label: 'Public Verifications',
      value: stats?.total_verifications ?? '—',
      icon: CheckCircle2,
      color: 'text-indigo-600 bg-indigo-50',
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Super Admin Dashboard</h1>
        <p className="text-sm text-slate-600">Platform-wide activity, organization verification, and governance.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => {
          const Icon = c.icon
          return (
            <div key={c.label} className="card flex items-center gap-4">
              <div className={`rounded-xl p-3 ${c.color}`}>
                <Icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500">{c.label}</p>
                <p className="text-2xl font-bold text-slate-900">{c.value}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
