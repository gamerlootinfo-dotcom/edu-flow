import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { BookOpen, Clock, FileQuestion, Star, ChevronRight, Search, Filter } from 'lucide-react'
import { Test, TestCategory, TestLanguage } from '@/lib/types'
import Navbar from '@/components/Navbar'
import CatalogClient from '@/components/CatalogClient'

export const dynamic = 'force-dynamic'

const CATEGORIES: TestCategory[] = ['MIQ', 'Blok', 'Buraxilis', 'Dovlet_Quluqu', 'Diger']
const SUBJECTS = ['Riyaziyyat', 'Fizika', 'Kimya', 'Biologiya', 'Tarix', 'Coğrafiya', 'Azərbaycan dili', 'İngilis dili', 'Rus dili', 'Ədəbiyyat', 'Həndəsə', 'İnformatika', 'Digər']

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; subject?: string; lang?: string; q?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()

  // Get user
  const { data: { user: authUser } } = await supabase.auth.getUser()
  let profile = null
  let purchasedTestIds: string[] = []

  if (authUser) {
    const { data } = await supabase.from('users').select('*').eq('id', authUser.id).single()
    profile = data

    // Get purchased tests
    const { data: purchases } = await supabase
      .from('purchases')
      .select('test_id')
      .eq('student_id', authUser.id)
    purchasedTestIds = purchases?.map(p => p.test_id) || []
  }

  // Build query
  let query = supabase
    .from('tests')
    .select('*, teacher:users!teacher_id(full_name)')
    .eq('is_approved', true)
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (params.category) query = query.eq('category', params.category)
  if (params.subject) query = query.eq('subject', params.subject)
  if (params.lang) query = query.eq('language', params.lang)
  if (params.q) query = query.ilike('title', `%${params.q}%`)

  const { data: tests } = await query

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={profile} />

      {/* Hero */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-16 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            İmtahana Hazırlaşın
          </h1>
          <p className="text-blue-100 text-lg mb-8">
            MİQ, Blok, Buraxılış və Dövlət Qulluğu sınaqları
          </p>
          {/* Search */}
          <form className="max-w-xl mx-auto flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                name="q"
                defaultValue={params.q}
                placeholder="Sınaq axtar..."
                className="w-full pl-10 pr-4 py-3 rounded-xl text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
              />
            </div>
            <button
              type="submit"
              className="bg-white text-blue-600 px-5 py-3 rounded-xl font-medium hover:bg-blue-50 transition-colors text-sm"
            >
              Axtar
            </button>
          </form>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <CatalogClient
          tests={tests || []}
          categories={CATEGORIES}
          subjects={SUBJECTS}
          currentFilters={params}
          userId={authUser?.id}
          purchasedTestIds={purchasedTestIds}
          userBalance={profile?.balance || 0}
          userRole={profile?.role}
        />
      </div>
    </div>
  )
}
