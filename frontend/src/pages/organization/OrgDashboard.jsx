import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Award, CheckCircle2, Clock, FilePlus2, FileText } from 'lucide-react'
import { certificateAPI, correctionAPI, orgAPI, templateAPI } from '../../services/endpoints'
import StatusBadge from '../../components/common/StatusBadge'

export default function OrgDashboard() {
  const [org, setOrg] = useState(null)
  const [certs, setCerts] = useState([])
  const [templates, setTemplates] = useState([])
  const [corrections, setCorrections] = useState([])

  useEffect(() => {
    Promise.all([orgAPI.getMyOrg(), certificateAPI.list(), templateAPI.list(), correctionAPI.list()])
      .then(([o, c, t, r]) => {
        setOrg(o.data)
        setCerts(c.data || [])
        setTemplates(t.data || [])
        setCorrections(r.data || [])
      })
      .catch(() => {})
  }, [])

  const pendingCorrections = corrections.filter((c) => c.status === 'pending').length

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">{org?.name || 'Organization Dashboard'}</h1>
            {org && <StatusBadge status={org.verification_status} />}
          </div>
          <p className="text-sm text-slate-600">Manage templates, issue official certificates, and review correction requests.</p>
        </div>
        {org?.verification_status === 'verified' && (
          <Link to="/org/issue" className="btn-primary">
            <FilePlus2 className="h-4 w-4" /> Issue Certificate
          </Link>
        )}
      </div>

      {org && org.verification_status !== 'verified' && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Your organization is currently <strong>{org.verification_status}</strong>. Once a Super Admin verifies your
          organization, you can create templates, issue certificates, and approve corrections.
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Issued Certificates', value: certs.length, icon: Award, color: 'text-blue-600 bg-blue-50' },
          { label: 'Active Templates', value: templates.length, icon: FileText, color: 'text-violet-600 bg-violet-50' },
          { label: 'Pending Corrections', value: pendingCorrections, icon: Clock, color: 'text-amber-600 bg-amber-50' },
          {
            label: 'Total Correction Requests',
            value: corrections.length,
            icon: CheckCircle2,
            color: 'text-emerald-600 bg-emerald-50',
          },
        ].map((s) => {
          const Icon = s.icon
          return (
            <div key={s.label} className="card flex items-center gap-4">
              <div className={`rounded-xl p-3 ${s.color}`}>
                <Icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500">{s.label}</p>
                <p className="text-2xl font-bold text-slate-900">{s.value}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
