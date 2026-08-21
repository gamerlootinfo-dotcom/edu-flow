import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Link from 'next/link'
import { approveTestAction, rejectTestAction } from '@/lib/actions'
import { CheckCircle, XCircle, BookOpen, Clock, Globe, User } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/server'
import AdminTestActions from '@/components/admin/AdminTestActions'

export const dynamic = 'force-dynamic'

export default async function AdminTestsPage() {
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) redirect('/auth/login')

  const { data: profile } = await supabase.from('users').select('*').eq('id', authUser.id).single()
  if (!profile || profile.role !== 'admin') redirect('/')

  const { data: tests } = await supabase
    .from('tests')
    .select('*, teacher:users!teacher_id(full_name, email)')
    .order('created_at', { ascending: false })

  const pending = tests?.filter(t => !t.is_approved) || []
  const approved = tests?.filter(t => t.is_approved) || []

  const categoryLabel: Record<string, string> = {
    MIQ: 'MİQ', Blok: 'Blok', Buraxilis: 'Buraxılış', Dovlet_Quluqu: 'Dövlət Qulluğu', Diger: 'Digər'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={profile} />
      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Test Təsdiqi</h1>

        {/* Pending */}
        <div className="mb-8">
          <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <span className="w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center text-white text-xs">{pending.length}</span>
            Təsdiq gözləyən
          </h2>
          {pending.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center text-gray-400 text-sm">Gözləyən sınaq yoxdur</div>
          ) : (
            <div className="space-y-3">
              {pending.map(test => (
                <div key={test.id} className="bg-white rounded-2xl border border-orange-100 shadow-sm p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-gray-900">{test.title}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded font-semibold ${test.language === 'AZ' ? 'bg-blue-50 text-blue-600' : 'bg-red-50 text-red-600'}`}>
                          {test.language === 'AZ' ? '🇦🇿 AZ' : '🇷🇺 RU'}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                        <span>{categoryLabel[test.category] || test.category}</span>
                        <span>·</span>
                        <span>{test.subject}</span>
                        <span>·</span>
                        <span className="flex items-center gap-0.5"><BookOpen className="w-3 h-3" /> {test.question_count} sual</span>
                        <span>·</span>
                        <span className="flex items-center gap-0.5"><Clock className="w-3 h-3" /> {test.duration_minutes} dəq</span>
                        <span>·</span>
                        <span>{test.price > 0 ? `${test.price} ₼` : 'Pulsuz'}</span>
                        <span>·</span>
                        <span className="flex items-center gap-0.5"><User className="w-3 h-3" /> {test.teacher?.full_name}</span>
                      </div>
                    </div>
                    <AdminTestActions testId={test.id} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Approved */}
        <div>
          <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <span className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center text-white text-xs">{approved.length}</span>
            Təsdiqlənmiş
          </h2>
          <div className="space-y-2">
            {approved.map(test => (
              <div key={test.id} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-4">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="font-medium text-sm text-gray-900 truncate">{test.title}</span>
                  <span className={`ml-2 text-xs px-1.5 py-0.5 rounded font-semibold ${test.language === 'AZ' ? 'bg-blue-50 text-blue-600' : 'bg-red-50 text-red-600'}`}>
                    {test.language}
                  </span>
                  <p className="text-xs text-gray-400 mt-0.5">{test.subject} · {test.teacher?.full_name}</p>
                </div>
                <AdminTestActions testId={test.id} isApproved={true} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
