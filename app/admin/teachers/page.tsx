import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Navbar from '@/components/Navbar'
import AdminTeacherManager from '@/components/admin/AdminTeacherManager'

export const dynamic = 'force-dynamic'

export default async function AdminTeachersPage() {
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) redirect('/auth/login')

  const { data: profile } = await supabase.from('users').select('*').eq('id', authUser.id).single()
  if (!profile || profile.role !== 'admin') redirect('/')

  const { data: teachers } = await supabase
    .from('users')
    .select('*')
    .eq('role', 'teacher')
    .order('created_at', { ascending: false })

  // Get test counts per teacher
  const teacherIds = teachers?.map(t => t.id) || []
  const testCounts: Record<string, number> = {}
  if (teacherIds.length > 0) {
    const { data: tests } = await supabase
      .from('tests')
      .select('teacher_id')
      .in('teacher_id', teacherIds)
    tests?.forEach(t => {
      testCounts[t.teacher_id] = (testCounts[t.teacher_id] || 0) + 1
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={profile} />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Müəllimlər</h1>
        <AdminTeacherManager teachers={teachers || []} testCounts={testCounts} />
      </div>
    </div>
  )
}
