import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import { BookOpen, Clock, CheckCircle2, Trophy } from 'lucide-react'
import { getScoreColor } from '@/lib/finance'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('users').select('*').eq('id', authUser.id).single()
  if (!profile || profile.role !== 'student') redirect('/')

  // Purchased tests
  const { data: purchases } = await supabase
    .from('purchases')
    .select('*, test:tests(*)')
    .eq('student_id', authUser.id)
    .order('purchased_at', { ascending: false })

  // Results
  const { data: results } = await supabase
    .from('student_results')
    .select('*, test:tests(title)')
    .eq('student_id', authUser.id)
    .eq('is_completed', true)
    .order('completed_at', { ascending: false })

  const testIds = purchases?.map(p => p.test_id) || []
  const completedIds = results?.map(r => r.test_id) || []

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={profile} />
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Xoş gəldiniz, {profile.full_name.split(' ')[0]}! 👋</h1>
          <p className="text-gray-500 text-sm mt-1">Mənim sınaqlarım</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <div className="text-2xl font-bold text-blue-600">{purchases?.length || 0}</div>
            <div className="text-xs text-gray-500 mt-1">Alınmış sınaq</div>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <div className="text-2xl font-bold text-green-600">{results?.length || 0}</div>
            <div className="text-xs text-gray-500 mt-1">Tamamlanan</div>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <div className="text-2xl font-bold text-purple-600">
              {results && results.length > 0
                ? Math.round(results.reduce((a, r) => a + r.score_percentage, 0) / results.length)
                : 0}%
            </div>
            <div className="text-xs text-gray-500 mt-1">Orta bal</div>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <div className="text-2xl font-bold text-orange-500">{profile.balance.toFixed(2)} ₼</div>
            <div className="text-xs text-gray-500 mt-1">Balans</div>
          </div>
        </div>

        {/* My Tests */}
        <h2 className="font-semibold text-gray-900 mb-4">Mənim Sınaqlarım</h2>
        {!purchases || purchases.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
            <BookOpen className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">Hələ heç bir sınaq almamısınız</p>
            <Link href="/" className="inline-block mt-4 bg-blue-600 text-white px-5 py-2 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors">
              Sınaqları kəşf et
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {purchases.map(p => {
              const result = results?.find(r => r.test_id === p.test_id)
              const isCompleted = !!result?.is_completed
              return (
                <div key={p.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <span className="inline-block text-xs px-2 py-0.5 rounded-lg bg-blue-50 text-blue-600 font-medium mb-1">
                        {p.test?.language === 'AZ' ? '🇦🇿 AZ' : '🇷🇺 RU'}
                      </span>
                      <h3 className="font-medium text-gray-900 text-sm line-clamp-2">{p.test?.title}</h3>
                    </div>
                    {isCompleted && (
                      <span className={`text-lg font-bold ml-2 ${getScoreColor(result!.score_percentage)}`}>
                        {result!.score_percentage}%
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-xs text-gray-400 mb-4">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {p.test?.duration_minutes} dəq
                    </span>
                    <span className="flex items-center gap-1">
                      <BookOpen className="w-3.5 h-3.5" />
                      {p.test?.question_count} sual
                    </span>
                  </div>

                  {isCompleted ? (
                    <Link
                      href={`/results/${p.test_id}`}
                      className="flex items-center justify-center gap-2 w-full py-2 rounded-xl bg-green-50 text-green-700 text-sm font-medium border border-green-200 hover:bg-green-100 transition-colors"
                    >
                      <Trophy className="w-4 h-4" />
                      Nəticəyə bax
                    </Link>
                  ) : (
                    <Link
                      href={`/exam/${p.test_id}`}
                      className="flex items-center justify-center gap-2 w-full py-2 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
                    >
                      Sınağa başla →
                    </Link>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
