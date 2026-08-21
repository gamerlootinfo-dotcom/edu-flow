'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useLang } from '@/lib/lang-context'
import { logoutAction } from '@/lib/actions'
import { User } from '@/lib/types'
import { BookOpen, LayoutDashboard, Wallet, FileText, LogOut, Menu, X, ChevronDown, GraduationCap, Shield } from 'lucide-react'

interface NavbarProps {
  user?: User | null
}

export default function Navbar({ user }: NavbarProps) {
  const { lang, setLang, t } = useLang()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const router = useRouter()

  const handleLogout = async () => {
    setLoggingOut(true)
    await logoutAction()
  }

  const studentLinks = [
    { href: '/tests', label: t.nav.catalog, icon: BookOpen },
    { href: '/dashboard', label: t.nav.myTests, icon: FileText },
    { href: '/wallet', label: t.nav.wallet, icon: Wallet },
  ]

  const teacherLinks = [
    { href: '/teacher', label: t.nav.dashboard, icon: LayoutDashboard },
    { href: '/teacher/tests', label: t.nav.myTests, icon: FileText },
    { href: '/teacher/withdraw', label: t.teacher.withdraw, icon: Wallet },
  ]

  const adminLinks = [
    { href: '/admin', label: t.nav.dashboard, icon: Shield },
    { href: '/admin/teachers', label: t.admin.manageTeachers, icon: GraduationCap },
    { href: '/admin/tests', label: t.admin.approveTests, icon: FileText },
  ]

  const links = user?.role === 'student' ? studentLinks
    : user?.role === 'teacher' ? teacherLinks
    : user?.role === 'admin' ? adminLinks
    : []

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl text-gray-900">AzTest</span>
            </Link>
          </div>

          {/* Desktop Nav Links */}
          {user && (
            <div className="hidden md:flex items-center gap-1">
              {links.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </Link>
              ))}
            </div>
          )}

          {/* Right Side */}
          <div className="flex items-center gap-2">
            {/* Language Toggle */}
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setLang('AZ')}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                  lang === 'AZ'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                AZ
              </button>
              <button
                onClick={() => setLang('RU')}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                  lang === 'RU'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                RU
              </button>
            </div>

            {user ? (
              <>
                {/* Balance (student only) */}
                {user.role === 'student' && (
                  <Link href="/wallet" className="hidden sm:flex items-center gap-1 bg-green-50 text-green-700 px-3 py-1.5 rounded-lg text-sm font-medium border border-green-200 hover:bg-green-100 transition-colors">
                    <Wallet className="w-3.5 h-3.5" />
                    {user.balance.toFixed(2)} ₼
                  </Link>
                )}

                {/* User menu */}
                <div className="hidden md:flex items-center gap-2">
                  <span className="text-sm text-gray-600 font-medium">
                    {user.full_name.split(' ')[0]}
                  </span>
                  <button
                    onClick={handleLogout}
                    disabled={loggingOut}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    {t.nav.logout}
                  </button>
                </div>

                {/* Mobile menu button */}
                <button
                  onClick={() => setMobileOpen(!mobileOpen)}
                  className="md:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100"
                >
                  {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/auth/login"
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900"
                >
                  {t.nav.login}
                </Link>
                <Link
                  href="/auth/register"
                  className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {t.nav.register}
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && user && (
        <div className="md:hidden bg-white border-t border-gray-200 py-2 px-4">
          <div className="space-y-1">
            {links.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-600"
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            ))}
            {user.role === 'student' && (
              <div className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-green-700">
                <Wallet className="w-4 h-4" />
                {user.balance.toFixed(2)} ₼
              </div>
            )}
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50"
            >
              <LogOut className="w-4 h-4" />
              {t.nav.logout}
            </button>
          </div>
        </div>
      )}
    </nav>
  )
}
