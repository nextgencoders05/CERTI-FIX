import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Award, BookOpen, BriefcaseBusiness, CheckCircle2, FileText, FolderOpen, GraduationCap, Sparkles } from 'lucide-react'

const TEMPLATES = [
  { id: 'achievement', name: 'Achievement', category: 'Awards', title: 'CERTIFICATE OF ACHIEVEMENT', subtitle: 'This certificate is proudly presented to', accent: '#b7791f', tone: 'gold', icon: Award },
  { id: 'course', name: 'Course Completion', category: 'Education', title: 'CERTIFICATE OF COMPLETION', subtitle: 'has successfully completed the course', accent: '#3157a4', tone: 'blue', icon: GraduationCap },
  { id: 'participation', name: 'Participation', category: 'Events', title: 'CERTIFICATE OF PARTICIPATION', subtitle: 'is recognized for participating in', accent: '#0f766e', tone: 'teal', icon: BookOpen },
  { id: 'internship', name: 'Internship', category: 'Career', title: 'INTERNSHIP CERTIFICATE', subtitle: 'has successfully completed an internship in', accent: '#6d4bb3', tone: 'violet', icon: BriefcaseBusiness },
  { id: 'training', name: 'Training', category: 'Career', title: 'TRAINING CERTIFICATE', subtitle: 'has completed the training program', accent: '#b45309', tone: 'orange', icon: FileText },
  { id: 'appreciation', name: 'Appreciation', category: 'Awards', title: 'CERTIFICATE OF APPRECIATION', subtitle: 'is appreciated for valuable contribution to', accent: '#be4564', tone: 'rose', icon: Sparkles },
]

function MiniCertificate({ template }) {
  return <div className="aspect-[1.414/1] rounded-lg bg-[#fffdf7] p-3 shadow-inner sm:p-4" style={{ border: `5px double ${template.accent}` }}><div className="flex h-full flex-col items-center justify-center border border-current/20 px-2 text-center" style={{ color: template.accent }}><Award className="h-5 w-5 sm:h-7 sm:w-7" /><p className="mt-2 text-[8px] font-black tracking-[.18em] sm:text-[10px]">{template.title}</p><div className="my-2 h-px w-1/2 bg-current/40" /><p className="text-[7px] text-slate-500 sm:text-[9px]">{template.subtitle}</p><p className="mt-2 font-serif text-sm font-bold text-slate-800 sm:text-lg">Your Name</p><p className="mt-2 text-[6px] tracking-widest sm:text-[8px]">DATE __________</p></div></div>
}

export default function TemplateGalleryPage() {
  const [saved, setSaved] = useState([])
  useEffect(() => { try { setSaved(JSON.parse(localStorage.getItem('certifix-drafts') || '[]')) } catch { setSaved([]) } }, [])
  return <div className="min-h-screen bg-slate-50"><section className="border-b border-slate-200 bg-white px-4 py-12 sm:py-16"><div className="mx-auto max-w-6xl"><p className="text-xs font-bold tracking-[.2em] text-violet-600">CERTIFICATE STUDIO</p><h1 className="mt-3 text-3xl font-black text-slate-950 sm:text-4xl">Choose your template</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">Start with a design and personalize the text, colors, and details. Templates create personal drafts and are not official credentials.</p></div></section>
    <main className="mx-auto max-w-6xl space-y-12 px-4 py-10">
      <section><div className="mb-5 flex items-center justify-between"><div><h2 className="text-xl font-bold text-slate-900">Explore templates</h2><p className="mt-1 text-sm text-slate-500">Choose a style to open the editor</p></div><span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-700">{TEMPLATES.length} designs</span></div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{TEMPLATES.map((t) => <article key={t.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"><MiniCertificate template={t} /><div className="mt-4 flex items-start justify-between"><div><p className="text-xs font-semibold text-violet-600">{t.category}</p><h3 className="mt-1 font-bold text-slate-900">{t.name}</h3></div><span className="rounded-xl bg-slate-100 p-2 text-slate-600"><t.icon className="h-5 w-5" /></span></div><Link to={`/templates/edit/${t.id}`} className="btn-primary mt-4 w-full">Customize template <ArrowRight className="h-4 w-4" /></Link></article>)}</div>
      </section>
      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6"><div className="flex items-center gap-3"><span className="rounded-xl bg-indigo-50 p-2 text-indigo-700"><FolderOpen className="h-5 w-5" /></span><div><h2 className="font-bold text-slate-900">My saved drafts</h2><p className="text-xs text-slate-500">Drafts saved in this browser</p></div></div>{saved.length ? <div className="mt-4 divide-y divide-slate-100">{saved.map((d) => <div key={d.id} className="flex items-center justify-between gap-3 py-3"><div><p className="text-sm font-semibold text-slate-800">{d.name || 'Untitled certificate'}</p><p className="text-xs text-slate-500">{d.templateName} · {new Date(d.updatedAt).toLocaleDateString()}</p></div><Link to={`/templates/edit/${d.templateId}?draft=${d.id}`} className="text-sm font-semibold text-indigo-700">Open draft</Link></div>)}</div> : <p className="mt-4 text-sm text-slate-500">No drafts saved yet. Choose a template above to create your first draft.</p>}</section>
      <p className="flex items-start gap-2 text-xs leading-5 text-slate-500"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /> Personal template drafts are for design and practice. They must not be presented as certificates issued or approved by an institution.</p>
    </main>
  </div>
}
