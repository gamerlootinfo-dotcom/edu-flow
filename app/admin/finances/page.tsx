import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Navbar from '@/components/Navbar'
import AdminFinances from '@/components/admin/AdminFinances'
import { connectDB } from '@/lib/mongodb'
import { User, Purchase, PlatformSettings } from '@/lib/models'

export const dynamic = 'force-dynamic'

export default async function AdminFinancesPage() {
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) redirect('/auth/login')

  await connectDB()

  const mongoUser = await User.findOne({ supabaseId: authUser.id }).lean()
  if (!mongoUser || mongoUser.role !== 'admin') redirect('/')

  const [settings, recentPurchasesRaw] = await Promise.all([
    PlatformSettings.findOne({ key: 'commission_rate' }).lean(),
    Purchase.find({})
      .populate('student_id', 'full_name')
      .populate('test_id', 'title')
      .sort({ purchased_at: -1 })
      .limit(20)
      .lean(),
  ])

  // Normalize for client component
  const recentPurchases = recentPurchasesRaw.map(p => {
    const student = p.student_id as any
    const test = p.test_id as any
    return {
      id: String(p._id),
      student_id: String(student?._id || p.student_id),
      test_id: String(test?._id || p.test_id),
      amount_paid: p.amount_paid,
      platform_cut: p.platform_cut,
      teacher_cut: p.teacher_cut,
      purchased_at: p.purchased_at?.toISOString() || '',
      student: student ? { full_name: student.full_name } : undefined,
      test: test ? { title: test.title } : undefined,
    }
  })

  const totalRevenue = recentPurchases.reduce((a, p) => a + p.platform_cut, 0)
  const totalPaid = recentPurchases.reduce((a, p) => a + p.amount_paid, 0)

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
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Maliyyə</h1>
        <AdminFinances
          commissionRate={settings?.value || '20'}
          purchases={recentPurchases}
          totalRevenue={totalRevenue}
          totalPaid={totalPaid}
        />
      </div>
    </div>
  )
}

