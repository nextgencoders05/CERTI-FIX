import React, { useState } from 'react'
import { Save } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { userAPI } from '../../services/endpoints'

export default function UserProfilePage() {
  const { user, refreshUser } = useAuth()
  const [fullName, setFullName] = useState(user?.full_name || '')
  const [phone, setPhone] = useState(user?.phone || '')
  const [saved, setSaved] = useState(false)

  const handleSave = async (e) => {
    e.preventDefault()
    await userAPI.updateProfile({ full_name: fullName, phone })
    await refreshUser()
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">My Profile</h1>
      <form onSubmit={handleSave} className="card space-y-4">
        {saved && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-700">
            Profile updated successfully.
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
          <input disabled value={user?.email || ''} className="input-field bg-slate-100" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
          <input required value={fullName} onChange={(e) => setFullName(e.target.value)} className="input-field" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} className="input-field" />
        </div>
        <button type="submit" className="btn-primary">
          <Save className="h-4 w-4" /> Save Changes
        </button>
      </form>
    </div>
  )
}
