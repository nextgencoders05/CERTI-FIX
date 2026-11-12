import React, { useState } from 'react'
import { CheckCircle2, Mail, Send } from 'lucide-react'

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', message: '' })

  const handleSubmit = (e) => {
    e.preventDefault()
    setSubmitted(true)
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-14 sm:px-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-slate-900">Contact Support</h1>
        <p className="mt-2 text-slate-600">Questions about organization onboarding or certificate verification?</p>
      </div>

      <div className="mt-8 card">
        {submitted ? (
          <div className="py-8 text-center space-y-3">
            <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600" />
            <h2 className="text-lg font-semibold text-slate-900">Message Received</h2>
            <p className="text-sm text-slate-600">
              Thank you, {form.name}. Our support team will respond to {form.email} shortly.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Your Name</label>
              <input
                required
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Message</label>
              <textarea
                rows={4}
                required
                value={form.message}
                onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))}
                className="input-field"
              />
            </div>
            <button type="submit" className="btn-primary w-full">
              <Send className="h-4 w-4" /> Send Inquiry
            </button>
          </form>
        )}
        <div className="mt-6 border-t border-slate-200 pt-4 flex items-center justify-center gap-2 text-xs text-slate-500">
          <Mail className="h-4 w-4" /> support@certifix.ai
        </div>
      </div>
    </div>
  )
}
