import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ExamEngine from '@/components/exam/ExamEngine'

export const dynamic = 'force-dynamic'

export default async function ExamPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: testId } = await params
  const supabase = await createClient()

  // Auth check
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) redirect('/auth/login')

  // Get user profile
  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', authUser.id)
    .single()

  if (!profile || profile.role !== 'student') redirect('/')

  // Check purchase
  const { data: test } = await supabase
    .from('tests')
    .select('*')
    .eq('id', testId)
    .eq('is_approved', true)
    .single()

  if (!test) redirect('/')

  // Check access (purchased or free)
  if (test.price > 0) {
    const { data: purchase } = await supabase
      .from('purchases')
      .select('id')
      .eq('student_id', authUser.id)
      .eq('test_id', testId)
      .single()
    if (!purchase) redirect(`/`)
  }

  // Get or create exam session
  const { data: existingResult } = await supabase
    .from('student_results')
    .select('*')
    .eq('student_id', authUser.id)
    .eq('test_id', testId)
    .single()

  let startTime: number
  let initialAnswers: Record<string, string> = {}
  let isCompleted = false

  if (existingResult?.is_completed) {
    // Already completed → show results
    redirect(`/results/${testId}`)
  } else if (existingResult) {
    startTime = new Date(existingResult.started_at).getTime()
    initialAnswers = existingResult.student_answers || {}
  } else {
    // Create new session
    const now = new Date().toISOString()
    await supabase.from('student_results').insert({
      student_id: authUser.id,
      test_id: testId,
      started_at: now,
      student_answers: {},
    })
    startTime = Date.now()
  }

  // Get questions
  const { data: questions } = await supabase
    .from('questions')
    .select('*')
    .eq('test_id', testId)
    .order('order_number')

  if (!questions || questions.length === 0) redirect('/')

  return (
    <ExamEngine
      testId={testId}
      testTitle={test.title}
      questions={questions}
      durationMinutes={test.duration_minutes}
      startTime={startTime!}
      initialAnswers={initialAnswers}
      isCompleted={isCompleted}
    />
  )
}
