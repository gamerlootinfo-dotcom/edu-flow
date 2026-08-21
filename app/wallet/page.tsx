import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Navbar from '@/components/Navbar'
import WalletClient from '@/components/WalletClient'

export const dynamic = 'force-dynamic'

export default async function WalletPage() {
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) redirect('/auth/login')

  const { data: profile } = await supabase.from('users').select('*').eq('id', authUser.id).single()
  if (!profile || profile.role !== 'student') redirect('/')

  const { data: transactions } = await supabase
    .from('wallet_transactions')
    .select('*')
    .eq('user_id', authUser.id)
    .order('created_at', { ascending: false })
    .limit(30)

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={profile} />
      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Cüzdan</h1>
        <WalletClient user={profile} transactions={transactions || []} />
      </div>
    </div>
  )
}
