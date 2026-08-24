import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Navbar from '@/components/Navbar'
import QuestionManager from '@/components/teacher/QuestionManager'
import PdfQuestionManager from '@/components/teacher/PdfQuestionManager'

export const dynamic = 'force-dynamic'

export default async function QuestionsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: testId } = await params
  const supabase = await createClient()

  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) redirect('/auth/login')

  const { data: profile } = await supabase.from('users').select('*').eq('id', authUser.id).single()
  if (!profile || profile.role !== 'teacher') redirect('/')

  const { data: test } = await supabase
    .from('tests')
    .select('*')
    .eq('id', testId)
    .eq('teacher_id', authUser.id)
    .single()

  if (!test) redirect('/teacher/tests')

  const { data: questions } = await supabase
    .from('questions')
    .select('*')
    .eq('test_id', testId)
    .order('order_number')

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={profile} />
      <div className="max-w-7xl mx-auto px-4 py-8">
        {test.pdf_url ? (
          <PdfQuestionManager test={test} questions={questions || []} />
        ) : (
          <QuestionManager test={test} questions={questions || []} />
        )}
      </div>
    </div>
  )
}
