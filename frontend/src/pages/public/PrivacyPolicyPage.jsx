import React from 'react'

export default function PrivacyPolicyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6 space-y-6">
      <h1 className="text-3xl font-bold text-slate-900">Privacy Policy</h1>
      <p className="text-sm text-slate-500">Effective Date: November 2026</p>
      <div className="card space-y-4 text-sm text-slate-700 leading-relaxed">
        <p>
          <strong>1. Private Document Storage:</strong> Uploaded certificates are stored in private, non-public
          storage directories. CertiFix AI never exposes uploaded user documents through public URLs.
        </p>
        <p>
          <strong>2. AI/OCR Processing:</strong> Uploaded files are processed solely to extract text fields for
          user review and official correction requests. Automated OCR output is never treated as proof of authenticity.
        </p>
        <p>
          <strong>3. Retention Policy:</strong> Uploaded correction source documents are retained for 90 days by
          default or until the associated correction workflow is completed and archived.
        </p>
        <p>
          <strong>4. Auditability:</strong> Verification queries and administrative actions are logged for security
          and compliance monitoring.
        </p>
      </div>
    </div>
  )
}
