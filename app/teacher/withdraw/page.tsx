import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Navbar from '@/components/Navbar'
import TeacherWithdrawClient from '@/components/teacher/TeacherWithdrawClient'
import { formatAZN } from '@/lib/finance'

export const dynamic = 'force-dynamic'

export default async function TeacherWithdrawPage() {
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) redirect('/auth/login')

  const { data: profile } = await supabase.from('users').select('*').eq('id', authUser.id).single()
  if (!profile || profile.role !== 'teacher') redirect('/')

  const { data: withdrawals } = await supabase
    .from('withdrawal_requests')
    .select('*')
    .eq('teacher_id', authUser.id)
    .order('requested_at', { ascending: false })

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={profile} />
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Pul Çıxarışı</h1>
        <p className="text-gray-500 text-sm mb-8">Mövcud balans: <strong className="text-gray-900">{formatAZN(profile.teacher_balance)}</strong></p>
        <TeacherWithdrawClient balance={profile.teacher_balance} withdrawals={withdrawals || []} />
      </div>
    </div>
  )
}
