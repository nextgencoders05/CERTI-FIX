import React from 'react'
import { Link } from 'react-router-dom'
import {
  Award,
  Building2,
  CheckCircle2,
  FileCheck,
  Lock,
  QrCode,
  ScanText,
  ShieldCheck,
} from 'lucide-react'

const FEATURES = [
  {
    icon: ScanText,
    title: 'AI-Powered OCR Extraction',
    desc: 'Upload PDF or image certificates and automatically extract recipient names, IDs, dates, and issuing organizations with Tesseract + OpenCV.',
  },
  {
    icon: FileCheck,
    title: 'Authorized Correction Workflow',
    desc: 'Submit structured correction requests directly to verified issuing organizations. Only authorized issuers can approve and re-issue official PDFs.',
  },
  {
    icon: QrCode,
    title: 'QR & Instant Public Verification',
    desc: 'Every official certificate includes a unique ID and embedded QR code for instant authenticity and revocation checks.',
  },
  {
    icon: Building2,
    title: 'Organization Templates & Branding',
    desc: 'Verified institutions design custom certificate templates, upload official logos, and issue tamper-evident PDFs at scale.',
  },
  {
    icon: Lock,
    title: 'Private Storage & Audit Trails',
    desc: 'Uploaded files stay in private storage with zero public URL exposure, backed by role-based access control and immutable audit logs.',
  },
  {
    icon: Award,
    title: '8+ Certificate Categories',
    desc: 'Supports Internship, Course Completion, Experience, Workshop, Training, Achievement, Participation, and admin-extensible categories.',
  },
]

export default function LandingPage() {
  return (
    <div>
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-50/70 via-white to-white py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-1.5 text-xs font-semibold text-blue-700">
            <ShieldCheck className="h-4 w-4" />
            Trusted AI Certificate Management & Correction Platform
          </span>
          <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-6xl">
            Issue, Verify &amp; Correct Certificates{' '}
            <span className="bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
              With Official Authority
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-600">
            CertiFix AI pairs intelligent OCR field recognition with strict issuer-only approval workflows,
            generating QR-verified official PDFs without ever allowing unauthorized document edits.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link to="/register" className="btn-primary px-6 py-3 text-base">
              Start Free Account
            </Link>
            <Link to="/verify" className="btn-secondary px-6 py-3 text-base">
              <CheckCircle2 className="h-5 w-5 text-blue-600" />
              Verify a Certificate
            </Link>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-24 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold text-slate-900">Built for Recipients, Issuers &amp; Administrators</h2>
            <p className="mt-3 text-slate-600">
              End-to-end credential lifecycle management from AI OCR intake to authorized PDF re-issuance.
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => {
              const Icon = f.icon
              return (
                <div key={f.title} className="card hover:border-blue-300 transition">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-50 to-violet-100 text-blue-600">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-slate-900">{f.title}</h3>
                  <p className="mt-2 text-sm text-slate-600 leading-relaxed">{f.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>
    </div>
  )
}
