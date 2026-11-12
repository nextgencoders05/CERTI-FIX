import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Award, FileCheck, FileUp, FolderOpen, Lock, ScanText, ShieldCheck, Sparkles, LayoutTemplate } from 'lucide-react'

const FEATURES = [
  { icon: ScanText, title: 'AI text recognition', desc: 'Extract certificate details from uploaded images and PDFs to help prepare accurate correction requests.' },
  { icon: FileCheck, title: 'Authorized corrections', desc: 'Send correction requests to the verified organization that issued the original certificate.' },
  { icon: Lock, title: 'Private by design', desc: 'Keep uploaded files in private storage with role-based access and audit trails.' },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <section className="relative overflow-hidden bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-100 via-white to-white px-4 pb-16 pt-16 sm:pt-24">
        <div className="mx-auto max-w-6xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-white/80 px-4 py-2 text-xs font-semibold text-indigo-700 shadow-sm"><Sparkles className="h-4 w-4" /> Your certificate workspace</span>
          <h1 className="mx-auto mt-6 max-w-4xl text-4xl font-black tracking-tight text-slate-950 sm:text-6xl">Make certificate tasks <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">simple.</span></h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">Upload a certificate to review its details and request an official correction, or start a fresh design using a personal certificate template.</p>
          <div className="mx-auto mt-12 grid max-w-4xl gap-5 text-left md:grid-cols-2">
            <Link to="/login" className="group rounded-3xl border border-indigo-100 bg-white p-6 shadow-lg shadow-indigo-100/60 transition hover:-translate-y-1 hover:border-indigo-300 hover:shadow-xl sm:p-8">
              <div className="flex items-center justify-between"><span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 text-white"><FileUp className="h-7 w-7" /></span><ArrowRight className="h-5 w-5 text-slate-400 transition group-hover:translate-x-1 group-hover:text-indigo-600" /></div>
              <h2 className="mt-6 text-2xl font-bold text-slate-900">Upload Certificate</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">Upload an existing PDF or photo, preview it, extract text with OCR, and prepare a correction request.</p>
              <span className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-indigo-700">Upload a file <ArrowRight className="h-4 w-4" /></span>
            </Link>
            <Link to="/templates" className="group rounded-3xl border border-violet-100 bg-gradient-to-br from-white to-violet-50 p-6 shadow-lg shadow-violet-100/60 transition hover:-translate-y-1 hover:border-violet-300 hover:shadow-xl sm:p-8">
              <div className="flex items-center justify-between"><span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-600 text-white"><LayoutTemplate className="h-7 w-7" /></span><ArrowRight className="h-5 w-5 text-slate-400 transition group-hover:translate-x-1 group-hover:text-violet-600" /></div>
              <h2 className="mt-6 text-2xl font-bold text-slate-900">Certificate Templates</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">Choose a design, type your own details, customize the look, and save or print your personal draft.</p>
              <span className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-violet-700">Explore templates <ArrowRight className="h-4 w-4" /></span>
            </Link>
          </div>
          <p className="mt-5 text-xs text-slate-500">Official certificates can only be corrected and re-issued by their authorized issuing organization.</p>
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
        <div className="mx-auto max-w-2xl text-center"><p className="text-sm font-bold uppercase tracking-widest text-indigo-600">Why CertiFix AI</p><h2 className="mt-3 text-3xl font-bold text-slate-900">A clearer way to manage certificates</h2><p className="mt-3 text-slate-600">Tools for reviewing existing documents and creating personal, clearly labelled drafts.</p></div>
        <div className="mt-10 grid gap-5 md:grid-cols-3">{FEATURES.map(({icon: Icon,title,desc}) => <article key={title} className="rounded-2xl border border-slate-200 bg-white p-6"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700"><Icon className="h-5 w-5" /></span><h3 className="mt-4 font-bold text-slate-900">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{desc}</p></article>)}</div>
        <div className="mt-10 flex flex-wrap justify-center gap-3"><Link to="/verify" className="btn-secondary">Verify a certificate</Link><Link to="/register" className="btn-primary">Create an account</Link></div>
      </section>
    </div>
  )
}
