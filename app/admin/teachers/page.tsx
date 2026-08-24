import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Navbar from '@/components/Navbar'
import AdminTeacherManager from '@/components/admin/AdminTeacherManager'
import { connectDB } from '@/lib/mongodb'
import { User, Test } from '@/lib/models'

export const dynamic = 'force-dynamic'

export default async function AdminTeachersPage() {
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) redirect('/auth/login')

  await connectDB()

  const mongoUser = await User.findOne({ supabaseId: authUser.id }).lean()
  if (!mongoUser || mongoUser.role !== 'admin') redirect('/')

  const teachersRaw = await User.find({ role: 'teacher' })
    .sort({ created_at: -1 })
    .lean()

  // Get test counts per teacher
  const teacherIds = teachersRaw.map(t => t._id)
  const testAgg = await Test.aggregate([
    { $match: { teacher_id: { $in: teacherIds } } },
    { $group: { _id: '$teacher_id', count: { $sum: 1 } } },
  ])

  const testCounts: Record<string, number> = {}
  testAgg.forEach(a => {
    testCounts[String(a._id)] = a.count
  })

  // Normalize teachers for client component
  const teachers = teachersRaw.map(t => ({
    id: String(t._id),
    supabaseId: t.supabaseId,
    email: t.email,
    full_name: t.full_name,
    role: t.role,
    balance: t.balance,
    teacher_balance: t.teacher_balance,
    phone: t.phone,
    created_at: t.created_at?.toISOString() || '',
  }))

  // Remap testCounts keys to string
  const testCountsNorm: Record<string, number> = {}
  Object.keys(testCounts).forEach(k => {
    testCountsNorm[k] = testCounts[k]
  })

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
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Müəllimlər</h1>
        <AdminTeacherManager teachers={teachers} testCounts={testCountsNorm} />
      </div>
    </div>
  )
}

