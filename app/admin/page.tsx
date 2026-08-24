import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { formatAZN } from '@/lib/finance'
import { Users, BookOpen, ShoppingBag, TrendingUp, Clock, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { connectDB } from '@/lib/mongodb'
import { User, Test, Purchase, Withdrawal, PlatformSettings } from '@/lib/models'

export const dynamic = 'force-dynamic'

export default async function AdminDashboardPage() {
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) redirect('/auth/login')

  await connectDB()

  const mongoUser = await User.findOne({ supabaseId: authUser.id }).lean()
  if (!mongoUser || mongoUser.role !== 'admin') redirect('/')

  const [
    totalUsers,
    totalStudents,
    totalTeachers,
    totalTests,
    pendingTests,
    totalPurchases,
    purchases,
    pendingWithdrawals,
    settings,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: 'student' }),
    User.countDocuments({ role: 'teacher' }),
    Test.countDocuments(),
    Test.countDocuments({ is_approved: false }),
    Purchase.countDocuments(),
    Purchase.find({}, 'platform_cut').lean(),
    Withdrawal.countDocuments({ status: 'pending' }),
    PlatformSettings.findOne({ key: 'commission_rate' }).lean(),
  ])

  const totalRevenue = purchases.reduce((a, p) => a + p.platform_cut, 0)
  const commissionRate = settings?.value || '20'

  // Build profile object for Navbar
  const profile = {
    id: authUser.id,
    email: mongoUser.email,
    full_name: mongoUser.full_name,
    role: mongoUser.role,
    balance: mongoUser.balance,
    teacher_balance: mongoUser.teacher_balance,
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={profile} />
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Admin Paneli</h1>
          <div className="flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-xl text-sm font-medium">
            Komissiya: {commissionRate}%
          </div>
        </div>

        {/* Alerts */}
        {(pendingTests > 0 || pendingWithdrawals > 0) && (
          <div className="flex flex-wrap gap-3 mb-6">
            {pendingTests > 0 && (
              <Link href="/admin/tests" className="flex items-center gap-2 bg-orange-50 text-orange-700 border border-orange-200 px-4 py-2.5 rounded-xl text-sm hover:bg-orange-100 transition-colors">
                <AlertCircle className="w-4 h-4" />
                {pendingTests} sınaq təsdiq gözləyir
              </Link>
            )}
            {pendingWithdrawals > 0 && (
              <Link href="/admin/withdrawals" className="flex items-center gap-2 bg-red-50 text-red-700 border border-red-200 px-4 py-2.5 rounded-xl text-sm hover:bg-red-100 transition-colors">
                <AlertCircle className="w-4 h-4" />
                {pendingWithdrawals} çıxarış sorğusu gözləyir
              </Link>
            )}
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <div className="w-9 h-9 bg-green-50 rounded-xl flex items-center justify-center mb-3">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <div className="text-xl font-bold text-gray-900">{formatAZN(totalRevenue)}</div>
            <div className="text-xs text-gray-500 mt-1">Platform gəliri</div>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center mb-3">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div className="text-xl font-bold text-gray-900">{totalUsers}</div>
            <div className="text-xs text-gray-500 mt-1">{totalStudents} şagird · {totalTeachers} müəllim</div>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <div className="w-9 h-9 bg-purple-50 rounded-xl flex items-center justify-center mb-3">
              <BookOpen className="w-5 h-5 text-purple-600" />
            </div>
            <div className="text-xl font-bold text-gray-900">{totalTests}</div>
            <div className="text-xs text-gray-500 mt-1">Ümumi sınaq</div>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <div className="w-9 h-9 bg-orange-50 rounded-xl flex items-center justify-center mb-3">
              <ShoppingBag className="w-5 h-5 text-orange-500" />
            </div>
            <div className="text-xl font-bold text-gray-900">{totalPurchases}</div>
            <div className="text-xs text-gray-500 mt-1">Ümumi satış</div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { href: '/admin/teachers', label: 'Müəllimlər', icon: Users, color: 'blue' },
            { href: '/admin/tests', label: 'Test Təsdiqi', icon: BookOpen, color: 'orange', badge: pendingTests },
            { href: '/admin/finances', label: 'Maliyyə', icon: TrendingUp, color: 'green' },
            { href: '/admin/withdrawals', label: 'Çıxarışlar', icon: Clock, color: 'red', badge: pendingWithdrawals },
          ].map(({ href, label, icon: Icon, color, badge }) => (
            <Link
              key={href}
              href={href}
              className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md transition-shadow flex flex-col items-center gap-2 text-center"
            >
              <div className={`w-10 h-10 bg-${color}-50 rounded-xl flex items-center justify-center relative`}>
                <Icon className={`w-5 h-5 text-${color}-600`} />
                {badge ? (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center font-bold">
                    {badge}
                  </span>
                ) : null}
              </div>
              <span className="text-sm font-medium text-gray-700">{label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
