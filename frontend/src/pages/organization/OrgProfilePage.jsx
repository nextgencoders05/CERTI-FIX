import React, { useEffect, useState } from 'react'
import { Save, Upload } from 'lucide-react'
import { orgAPI } from '../../services/endpoints'

export default function OrgProfilePage() {
  const [org, setOrg] = useState(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    orgAPI.getMyOrg().then((res) => setOrg(res.data))
  }, [])

  const handleSave = async (e) => {
    e.preventDefault()
    const res = await orgAPI.updateMyOrg(org)
    setOrg(res.data)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const fd = new FormData()
    fd.append('file', file)
    const res = await orgAPI.uploadLogo(fd)
    setOrg(res.data)
  }

  if (!org) return <div className="py-12 text-center text-slate-500">Loading organization profile...</div>

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Organization Profile &amp; Branding</h1>
      <form onSubmit={handleSave} className="card space-y-4">
        {saved && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-700">
            Organization profile updated.
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Organization Name</label>
          <input
            required
            value={org.name || ''}
            onChange={(e) => setOrg((p) => ({ ...p, name: e.target.value }))}
            className="input-field"
          />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Contact Email</label>
            <input
              required
              value={org.contact_email || ''}
              onChange={(e) => setOrg((p) => ({ ...p, contact_email: e.target.value }))}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Website</label>
            <input
              value={org.website || ''}
              onChange={(e) => setOrg((p) => ({ ...p, website: e.target.value }))}
              className="input-field"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Official Logo (PNG/JPG)</label>
          <label className="inline-flex items-center gap-2 btn-secondary cursor-pointer">
            <Upload className="h-4 w-4" />
            {org.has_logo ? 'Replace Organization Logo' : 'Upload Organization Logo'}
            <input type="file" accept=".png,.jpg,.jpeg" className="hidden" onChange={handleLogoUpload} />
          </label>
        </div>
        <button type="submit" className="btn-primary">
          <Save className="h-4 w-4" /> Save Organization Details
        </button>
      </form>
    </div>
  )
}
