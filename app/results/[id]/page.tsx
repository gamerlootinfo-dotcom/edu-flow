import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getScoreColor, getScoreBadgeColor, formatTimeSpent } from '@/lib/finance'
import { Check, X, Minus, Trophy, Clock, ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react'
import ResultDetails from '@/components/exam/ResultDetails'
import Navbar from '@/components/Navbar'

export const dynamic = 'force-dynamic'

export default async function ResultPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: testId } = await params
  const supabase = await createClient()

  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', authUser.id)
    .single()

  const { data: result } = await supabase
    .from('student_results')
    .select('*, test:tests(*)')
    .eq('student_id', authUser.id)
    .eq('test_id', testId)
    .single()

  if (!result || !result.is_completed) redirect(`/exam/${testId}`)

  // Get questions with correct answers
  const { data: questions } = await supabase
    .from('questions')
    .select('*')
    .eq('test_id', testId)
    .order('order_number')

  const totalQuestions = questions?.length || 0
  const scoreColor = getScoreColor(result.score_percentage)
  const scoreBadge = getScoreBadgeColor(result.score_percentage)

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={profile} />
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Score Card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 mb-6 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-50 rounded-2xl mb-4">
            <Trophy className="w-9 h-9 text-yellow-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">{result.test?.title}</h1>
          <p className="text-gray-500 text-sm mb-6">İmtahan nəticəniz</p>

          {/* Big Score */}
          <div className={`text-6xl font-bold mb-2 ${scoreColor}`}>
            {result.score_percentage}%
          </div>
          <div className={`inline-block px-3 py-1 rounded-full text-sm font-semibold border mb-6 ${scoreBadge}`}>
            {result.score_percentage >= 80 ? 'Əla' :
             result.score_percentage >= 60 ? 'Yaxşı' :
             result.score_percentage >= 40 ? 'Orta' : 'Zəif'}
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-green-50 rounded-xl p-4">
              <div className="text-2xl font-bold text-green-600">{result.correct_answers_count}</div>
              <div className="text-xs text-green-600 mt-1 flex items-center justify-center gap-1">
                <Check className="w-3 h-3" /> Düzgün
              </div>
            </div>
            <div className="bg-red-50 rounded-xl p-4">
              <div className="text-2xl font-bold text-red-600">{result.wrong_answers_count}</div>
              <div className="text-xs text-red-600 mt-1 flex items-center justify-center gap-1">
                <X className="w-3 h-3" /> Səhv
              </div>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="text-2xl font-bold text-gray-500">{result.blank_answers_count}</div>
              <div className="text-xs text-gray-500 mt-1 flex items-center justify-center gap-1">
                <Minus className="w-3 h-3" /> Boş
              </div>
            </div>
            <div className="bg-blue-50 rounded-xl p-4">
              <div className="text-lg font-bold text-blue-600">{formatTimeSpent(result.spent_time_seconds)}</div>
              <div className="text-xs text-blue-600 mt-1 flex items-center justify-center gap-1">
                <Clock className="w-3 h-3" /> Vaxt
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mb-6">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Kabinetə qayıt
          </Link>
          <Link
            href="/"
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Digər sınaqlar
          </Link>
        </div>

        {/* Detailed Review */}
        <ResultDetails
          questions={questions || []}
          studentAnswers={result.student_answers || {}}
          pdfUrl={result.test?.pdf_url || undefined}
        />
      </div>
    </div>
  )
}
