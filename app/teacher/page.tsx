import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Link from 'next/link'
import { Plus, TrendingUp, ShoppingBag, Wallet, BookOpen, CheckCircle, Clock, XCircle } from 'lucide-react'
import { formatAZN } from '@/lib/finance'

export const dynamic = 'force-dynamic'

export default async function TeacherDashboardPage() {
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) redirect('/auth/login')

  const { data: profile } = await supabase.from('users').select('*').eq('id', authUser.id).single()
  if (!profile || profile.role !== 'teacher') redirect('/')

  // My tests
  const { data: tests } = await supabase
    .from('tests')
    .select('*')
    .eq('teacher_id', authUser.id)
    .order('created_at', { ascending: false })

  // Sales
  const testIds = tests?.map(t => t.id) || []
  let totalSales = 0
  let salesCount = 0

  if (testIds.length > 0) {
    const { data: purchases } = await supabase
      .from('purchases')
      .select('teacher_cut')
      .in('test_id', testIds)
    salesCount = purchases?.length || 0
    totalSales = purchases?.reduce((a, p) => a + p.teacher_cut, 0) || 0
  }

  const approvedCount = tests?.filter(t => t.is_approved).length || 0
  const pendingCount = tests?.filter(t => !t.is_approved).length || 0

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={profile} />
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Müəllim Paneli</h1>
            <p className="text-gray-500 text-sm">{profile.full_name}</p>
          </div>
          <Link
            href="/teacher/tests/new"
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Yeni Sınaq
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <div className="w-9 h-9 bg-green-50 rounded-xl flex items-center justify-center mb-3">
              <Wallet className="w-5 h-5 text-green-600" />
            </div>
            <div className="text-xl font-bold text-gray-900">{formatAZN(profile.teacher_balance)}</div>
            <div className="text-xs text-gray-500 mt-1">Balansım</div>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center mb-3">
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
            <div className="text-xl font-bold text-gray-900">{formatAZN(totalSales)}</div>
            <div className="text-xs text-gray-500 mt-1">Ümumi qazanc</div>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <div className="w-9 h-9 bg-purple-50 rounded-xl flex items-center justify-center mb-3">
              <ShoppingBag className="w-5 h-5 text-purple-600" />
            </div>
            <div className="text-xl font-bold text-gray-900">{salesCount}</div>
            <div className="text-xs text-gray-500 mt-1">Satış sayı</div>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <div className="w-9 h-9 bg-orange-50 rounded-xl flex items-center justify-center mb-3">
              <BookOpen className="w-5 h-5 text-orange-500" />
            </div>
            <div className="text-xl font-bold text-gray-900">{tests?.length || 0}</div>
            <div className="text-xs text-gray-500 mt-1">Sınaqlarım</div>
          </div>
        </div>

        {/* My Tests */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Sınaqlarım</h2>
            <Link href="/teacher/tests" className="text-sm text-blue-600 hover:underline">Hamısına bax</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {!tests || tests.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">Hələ sınaq yaratmamısınız</p>
              </div>
            ) : (
              tests.slice(0, 5).map(test => (
                <div key={test.id} className="flex items-center gap-4 p-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className="text-sm font-medium text-gray-900 truncate">{test.title}</h3>
                      <span className={`text-xs px-1.5 py-0.5 rounded font-semibold ${test.language === 'AZ' ? 'bg-blue-50 text-blue-600' : 'bg-red-50 text-red-600'}`}>
                        {test.language}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400">{test.subject} · {test.question_count} sual · {test.price > 0 ? `${test.price} ₼` : 'Pulsuz'}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {test.is_approved ? (
                      <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-lg">
                        <CheckCircle className="w-3 h-3" /> Təsdiqləndi
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-orange-500 bg-orange-50 px-2 py-1 rounded-lg">
                        <Clock className="w-3 h-3" /> Gözləyir
                      </span>
                    )}
                    <Link
                      href={`/teacher/tests/${test.id}/questions`}
                      className="text-xs text-blue-600 hover:underline px-2"
                    >
                      Suallar
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
