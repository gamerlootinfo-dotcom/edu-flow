import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Link from 'next/link'
import { CheckCircle, Clock, BookOpen, Plus } from 'lucide-react'
import { formatAZN } from '@/lib/finance'

export const dynamic = 'force-dynamic'

export default async function TeacherTestsPage() {
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) redirect('/auth/login')

  const { data: profile } = await supabase.from('users').select('*').eq('id', authUser.id).single()
  if (!profile || profile.role !== 'teacher') redirect('/')

  const { data: tests } = await supabase
    .from('tests').select('*').eq('teacher_id', authUser.id).order('created_at', { ascending: false })

  const categoryLabel: Record<string, string> = {
    MIQ: 'MİQ', Blok: 'Blok', Buraxilis: 'Buraxılış', Dovlet_Quluqu: 'Dövlət Qulluğu', Diger: 'Digər'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={profile} />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Mənim Sınaqlarım</h1>
          <Link href="/teacher/tests/new" className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700">
            <Plus className="w-4 h-4" /> Yeni Sınaq
          </Link>
        </div>

        {!tests || tests.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center text-gray-400">
            <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm mb-4">Hələ sınaq yaratmamısınız</p>
            <Link href="/teacher/tests/new" className="bg-blue-600 text-white px-5 py-2 rounded-xl text-sm font-medium hover:bg-blue-700">İlk sınağı yarat</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {tests.map(test => (
              <div key={test.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium text-gray-900 truncate">{test.title}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded font-bold ${test.language === 'AZ' ? 'bg-blue-50 text-blue-600' : 'bg-red-50 text-red-600'}`}>
                      {test.language === 'AZ' ? '🇦🇿 AZ' : '🇷🇺 RU'}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs text-gray-400">
                    <span>{categoryLabel[test.category] || test.category}</span>
                    <span>·</span><span>{test.subject}</span>
                    <span>·</span><span>{test.question_count} sual</span>
                    <span>·</span><span>{test.duration_minutes} dəq</span>
                    <span>·</span><span>{test.price > 0 ? `${test.price} ₼` : 'Pulsuz'}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {test.is_approved
                    ? <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2.5 py-1.5 rounded-xl"><CheckCircle className="w-3.5 h-3.5" />Təsdiqləndi</span>
                    : <span className="flex items-center gap-1 text-xs text-orange-500 bg-orange-50 px-2.5 py-1.5 rounded-xl"><Clock className="w-3.5 h-3.5" />Gözləyir</span>
                  }
                  <Link href={`/teacher/tests/${test.id}/questions`} className="text-sm text-blue-600 border border-blue-200 px-3 py-1.5 rounded-xl hover:bg-blue-50">
                    Suallar ({test.question_count})
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
