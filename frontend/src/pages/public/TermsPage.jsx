import React from 'react'

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6 space-y-6">
      <h1 className="text-3xl font-bold text-slate-900">Terms &amp; Conditions</h1>
      <p className="text-sm text-slate-500">Last Updated: November 2026</p>
      <div className="card space-y-4 text-sm text-slate-700 leading-relaxed">
        <p>
          <strong>1. Authorized Issuance Only:</strong> Only verified issuing organizations may generate, approve,
          or re-issue official certificates on CertiFix AI.
        </p>
        <p>
          <strong>2. No Unauthorized Document Alteration:</strong> CertiFix AI strictly prohibits unauthorized editing
          of certificates. All corrections require formal submission, issuer review, and re-issuance with a new
          verifiable Certificate ID.
        </p>
        <p>
          <strong>3. Account Responsibility:</strong> Organizations and public users are responsible for safeguarding
          their credentials and submitting accurate verification information.
        </p>
      </div>
    </div>
  )
}
