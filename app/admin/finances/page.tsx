import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Navbar from '@/components/Navbar'
import AdminFinances from '@/components/admin/AdminFinances'

export const dynamic = 'force-dynamic'

export default async function AdminFinancesPage() {
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) redirect('/auth/login')

  const { data: profile } = await supabase.from('users').select('*').eq('id', authUser.id).single()
  if (!profile || profile.role !== 'admin') redirect('/')

  const { data: settings } = await supabase
    .from('platform_settings').select('*').eq('key', 'commission_rate').single()

  const { data: recentPurchases } = await supabase
    .from('purchases')
    .select('*, student:users!student_id(full_name), test:tests(title)')
    .order('purchased_at', { ascending: false })
    .limit(20)

  const totalRevenue = recentPurchases?.reduce((a, p) => a + p.platform_cut, 0) || 0
  const totalPaid = recentPurchases?.reduce((a, p) => a + p.amount_paid, 0) || 0

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={profile} />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Maliyyə</h1>
        <AdminFinances
          commissionRate={settings?.value || '20'}
          purchases={recentPurchases || []}
          totalRevenue={totalRevenue}
          totalPaid={totalPaid}
        />
      </div>
    </div>
  )
}
