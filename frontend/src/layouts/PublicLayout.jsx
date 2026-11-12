import React from 'react'
import { Link, Outlet } from 'react-router-dom'
import { ShieldCheck } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function PublicLayout() {
  const { user } = useAuth()
  const dashboardPath =
    user?.role === 'super_admin'
      ? '/admin/dashboard'
      : user?.role === 'organization'
      ? '/org/dashboard'
      : '/user/dashboard'

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-violet-600 text-white shadow-sm">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <span className="text-lg font-bold tracking-tight text-slate-900">
              CertiFix <span className="text-violet-600">AI</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <Link to="/templates" className="hover:text-blue-600 transition">Templates</Link>
            <Link to="/verify" className="hover:text-blue-600 transition">Verify Certificate</Link>
            <Link to="/contact" className="hover:text-blue-600 transition">Contact</Link>
            <Link to="/privacy" className="hover:text-blue-600 transition">Privacy</Link>
            <Link to="/terms" className="hover:text-blue-600 transition">Terms</Link>
          </nav>

          <div className="flex items-center gap-3">
            {user ? (
              <Link to={dashboardPath} className="btn-primary">
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link to="/login" className="btn-secondary">Sign In</Link>
                <Link to="/register" className="btn-primary">Get Started</Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-slate-200 bg-slate-50 py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-500">
          <p>© {new Date().getFullYear()} CertiFix AI. Official Certificate Management & Authorized Correction Platform.</p>
          <div className="flex items-center gap-6">
            <Link to="/verify" className="hover:text-slate-900">Verify</Link>
            <Link to="/privacy" className="hover:text-slate-900">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-slate-900">Terms & Conditions</Link>
            <Link to="/contact" className="hover:text-slate-900">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
