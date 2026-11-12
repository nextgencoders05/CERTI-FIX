import React, { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  Award,
  Bell,
  Building2,
  CheckCircle2,
  ClipboardList,
  FileCheck,
  FilePlus2,
  FileText,
  FolderKanban,
  LayoutDashboard,
  LogOut,
  Menu,
  ScanText,
  ShieldAlert,
  ShieldCheck,
  Upload,
  User,
  Users,
  X,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { notificationAPI } from '../services/endpoints'

const NAV_BY_ROLE = {
  public_user: [
    { to: '/user/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/user/upload', label: 'Upload & OCR', icon: Upload },
    { to: '/templates', label: 'Templates & Drafts', icon: FileText },
    { to: '/user/corrections', label: 'Correction Tracking', icon: ClipboardList },
    { to: '/verify', label: 'Verify Certificate', icon: CheckCircle2 },
    { to: '/user/profile', label: 'My Profile', icon: User },
  ],
  organization: [
    { to: '/org/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/org/issue', label: 'Issue Certificate', icon: FilePlus2 },
    { to: '/org/certificates', label: 'Issued Records', icon: Award },
    { to: '/org/templates', label: 'Templates', icon: FileText },
    { to: '/org/corrections', label: 'Correction Requests', icon: FileCheck },
    { to: '/org/profile', label: 'Organization Profile', icon: Building2 },
  ],
  super_admin: [
    { to: '/admin/dashboard', label: 'Platform Overview', icon: LayoutDashboard },
    { to: '/admin/organizations', label: 'Organizations', icon: Building2 },
    { to: '/admin/users', label: 'Users', icon: Users },
    { to: '/admin/categories', label: 'Categories', icon: FolderKanban },
    { to: '/admin/requests', label: 'All Requests', icon: ClipboardList },
    { to: '/admin/audit-logs', label: 'Audit Logs', icon: ShieldAlert },
  ],
}

export default function DashboardLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [notifOpen, setNotifOpen] = useState(false)

  const navItems = NAV_BY_ROLE[user?.role] || []
  const unreadCount = notifications.filter((n) => !n.is_read).length

  useEffect(() => {
    notificationAPI
      .list()
      .then((res) => setNotifications(res.data || []))
      .catch(() => {})
  }, [])

  const handleMarkAllRead = async () => {
    await notificationAPI.markAllRead()
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen flex bg-slate-50">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 transform border-r border-slate-200 bg-white transition-transform lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-slate-200 px-5">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-violet-600 text-white">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <span className="text-base font-bold text-slate-900">
              CertiFix <span className="text-violet-600">AI</span>
            </span>
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-slate-500">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm font-medium transition ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-50 to-violet-50 text-blue-700 border border-blue-100'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`
                }
              >
                <Icon className="h-4 w-4 shrink-0" />
                {item.label}
              </NavLink>
            )
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 border-t border-slate-200 p-4 bg-white">
          <div className="mb-3 px-2">
            <p className="text-sm font-semibold text-slate-900 truncate">{user?.full_name}</p>
            <p className="text-xs text-slate-500 truncate">{user?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50 transition"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-slate-600">
              <Menu className="h-6 w-6" />
            </button>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 capitalize">
              <ScanText className="h-3.5 w-3.5" />
              {(user?.role || '').replace('_', ' ')}
            </span>
          </div>

          <div className="relative">
            <button
              onClick={() => setNotifOpen((v) => !v)}
              className="relative rounded-lg p-2 text-slate-600 hover:bg-slate-100"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-violet-600 text-[10px] font-bold text-white">
                  {unreadCount}
                </span>
              )}
            </button>

            {notifOpen && (
              <div className="absolute right-0 mt-2 w-80 rounded-xl border border-slate-200 bg-white p-3 shadow-lg z-50">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="text-sm font-semibold text-slate-900">Notifications</span>
                  {unreadCount > 0 && (
                    <button onClick={handleMarkAllRead} className="text-xs font-medium text-blue-600 hover:underline">
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-64 overflow-y-auto divide-y divide-slate-100">
                  {notifications.length === 0 ? (
                    <p className="py-6 text-center text-xs text-slate-500">No notifications yet.</p>
                  ) : (
                    notifications.map((n) => (
                      <div key={n.id} className={`py-2.5 text-xs ${n.is_read ? 'opacity-65' : ''}`}>
                        <p className="font-semibold text-slate-900">{n.title}</p>
                        <p className="text-slate-600 mt-0.5">{n.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
