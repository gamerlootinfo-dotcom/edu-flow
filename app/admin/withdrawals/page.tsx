import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Navbar from '@/components/Navbar'
import AdminWithdrawalList from '@/components/admin/AdminWithdrawalList'
import { connectDB } from '@/lib/mongodb'
import { User, Withdrawal } from '@/lib/models'

export const dynamic = 'force-dynamic'

export default async function AdminWithdrawalsPage() {
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) redirect('/auth/login')

  await connectDB()

  const mongoUser = await User.findOne({ supabaseId: authUser.id }).lean()
  if (!mongoUser || mongoUser.role !== 'admin') redirect('/')

  const withdrawals = await Withdrawal.find({})
    .populate('teacher_id', 'full_name email')
    .sort({ requested_at: -1 })
    .lean()

  // Normalize for client component
  const normalized = withdrawals.map(w => {
    const teacher = w.teacher_id as any
    return {
      id: String(w._id),
      teacher_id: String(teacher?._id || w.teacher_id),
      amount: w.amount,
      card_number: w.card_number,
      card_holder_name: w.card_holder_name,
      status: w.status,
      admin_note: w.admin_note,
      requested_at: w.requested_at?.toISOString() || '',
      processed_at: w.processed_at?.toISOString(),
      teacher: teacher ? { full_name: teacher.full_name, email: teacher.email } : undefined,
    }
  })

  const pending = normalized.filter(w => w.status === 'pending')
  const done = normalized.filter(w => w.status !== 'pending')

  const profile = {
    id: authUser.id,
    email: mongoUser.email,
    full_name: mongoUser.full_name,
    role: mongoUser.role,
    balance: mongoUser.balance,
  }

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

