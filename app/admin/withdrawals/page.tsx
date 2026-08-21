import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Navbar from '@/components/Navbar'
import AdminWithdrawalList from '@/components/admin/AdminWithdrawalList'
import { formatAZN } from '@/lib/finance'

export const dynamic = 'force-dynamic'

export default async function AdminWithdrawalsPage() {
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) redirect('/auth/login')

  const { data: profile } = await supabase.from('users').select('*').eq('id', authUser.id).single()
  if (!profile || profile.role !== 'admin') redirect('/')

  const { data: withdrawals } = await supabase
    .from('withdrawal_requests')
    .select('*, teacher:users!teacher_id(full_name, email)')
    .order('requested_at', { ascending: false })

  const pending = withdrawals?.filter(w => w.status === 'pending') || []
  const done = withdrawals?.filter(w => w.status !== 'pending') || []

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={profile} />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Pul Çıxarışı Sorğuları</h1>

        <div className="mb-6">
          <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <span className="w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center text-white text-xs">{pending.length}</span>
            Gözləyən sorğular
          </h2>
          <AdminWithdrawalList withdrawals={pending} isPending={true} />
        </div>

        <div>
          <h2 className="font-semibold text-gray-900 mb-3">Tamamlanan / Rədd edilən</h2>
          <AdminWithdrawalList withdrawals={done} isPending={false} />
        </div>
      </div>
    </div>
  )
}
