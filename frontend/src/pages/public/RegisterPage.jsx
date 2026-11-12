import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Building2, User } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { authAPI } from '../../services/endpoints'

export default function RegisterPage() {
  const { loginSuccess } = useAuth()
  const navigate = useNavigate()
  const [accountType, setAccountType] = useState('public_user')
  const [form, setForm] = useState({
    email: '',
    full_name: '',
    password: '',
    phone: '',
    organization_name: '',
    contact_email: '',
    registration_number: '',
    website: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res =
        accountType === 'public_user'
          ? await authAPI.registerUser({
              email: form.email,
              full_name: form.full_name,
              password: form.password,
              phone: form.phone || undefined,
            })
          : await authAPI.registerOrg({
              email: form.email,
              full_name: form.full_name,
              password: form.password,
              organization_name: form.organization_name,
              contact_email: form.contact_email || form.email,
              registration_number: form.registration_number || undefined,
              website: form.website || undefined,
            })

      loginSuccess(res.data.access_token, res.data.user)
      navigate(accountType === 'organization' ? '/org/dashboard' : '/user/dashboard')
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed. Please check your details.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-[85vh] items-center justify-center px-4 py-12 bg-slate-50">
      <div className="card w-full max-w-lg">
        <h1 className="text-2xl font-bold text-slate-900 text-center">Create your CertiFix AI account</h1>
        <p className="mt-1.5 text-sm text-slate-600 text-center">Choose your account type to get started</p>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setAccountType('public_user')}
            className={`flex items-center justify-center gap-2 rounded-xl border p-3 text-sm font-semibold transition ${
              accountType === 'public_user'
                ? 'border-blue-600 bg-blue-50 text-blue-700'
                : 'border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <User className="h-4 w-4" /> Public User
          </button>
          <button
            type="button"
            onClick={() => setAccountType('organization')}
            className={`flex items-center justify-center gap-2 rounded-xl border p-3 text-sm font-semibold transition ${
              accountType === 'organization'
                ? 'border-violet-600 bg-violet-50 text-violet-700'
                : 'border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Building2 className="h-4 w-4" /> Organization
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
              <input name="full_name" required value={form.full_name} onChange={handleChange} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
              <input name="email" type="email" required value={form.email} onChange={handleChange} className="input-field" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password (min 8 chars)</label>
            <input
              name="password"
              type="password"
              minLength={8}
              required
              value={form.password}
              onChange={handleChange}
              className="input-field"
            />
          </div>

          {accountType === 'organization' && (
            <div className="space-y-4 border-t border-slate-200 pt-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Organization Name</label>
                <input
                  name="organization_name"
                  required
                  value={form.organization_name}
                  onChange={handleChange}
                  className="input-field"
                />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Official Contact Email</label>
                  <input
                    name="contact_email"
                    type="email"
                    required
                    value={form.contact_email}
                    onChange={handleChange}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Registration Number</label>
                  <input
                    name="registration_number"
                    value={form.registration_number}
                    onChange={handleChange}
                    className="input-field"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Website</label>
                <input
                  name="website"
                  placeholder="https://example.edu"
                  value={form.website}
                  onChange={handleChange}
                  className="input-field"
                />
              </div>
            </div>
          )}

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600">
          Already registered?{' '}
          <Link to="/login" className="font-semibold text-blue-600 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
