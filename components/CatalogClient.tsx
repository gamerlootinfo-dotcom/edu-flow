'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Test, TestCategory } from '@/lib/types'
import { useLang } from '@/lib/lang-context'
import { purchaseTestAction } from '@/lib/actions'
import { BookOpen, Clock, CheckCircle, Lock, Wallet, Filter, ChevronDown } from 'lucide-react'

const CATEGORY_COLORS: Record<string, string> = {
  MIQ: 'bg-purple-100 text-purple-700',
  Blok: 'bg-blue-100 text-blue-700',
  Buraxilis: 'bg-green-100 text-green-700',
  Dovlet_Quluqu: 'bg-orange-100 text-orange-700',
  Diger: 'bg-gray-100 text-gray-600',
}

const LANG_COLORS: Record<string, string> = {
  AZ: 'bg-blue-50 text-blue-600 border border-blue-200',
  RU: 'bg-red-50 text-red-600 border border-red-200',
}

interface Props {
  tests: any[]
  categories: string[]
  subjects: string[]
  currentFilters: { category?: string; subject?: string; lang?: string; q?: string }
  userId?: string
  purchasedTestIds: string[]
  userBalance: number
  userRole?: string
}

export default function CatalogClient({
  tests,
  categories,
  subjects,
  currentFilters,
  userId,
  purchasedTestIds,
  userBalance,
  userRole,
}: Props) {
  const { t } = useLang()
  const router = useRouter()
  const [purchasing, setPurchasing] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [filterOpen, setFilterOpen] = useState(false)

  const [localFilters, setLocalFilters] = useState({
    category: currentFilters.category || '',
    subject: currentFilters.subject || '',
    lang: currentFilters.lang || '',
  })

  function applyFilters(newFilters: typeof localFilters) {
    const params = new URLSearchParams()
    if (currentFilters.q) params.set('q', currentFilters.q)
    if (newFilters.category) params.set('category', newFilters.category)
    if (newFilters.subject) params.set('subject', newFilters.subject)
    if (newFilters.lang) params.set('lang', newFilters.lang)
    router.push(`/?${params.toString()}`)
  }

  async function handlePurchase(testId: string) {
    if (!userId) {
      router.push('/auth/login')
      return
    }
    setPurchasing(testId)
    setMessage(null)
    const result = await purchaseTestAction(testId)
    if (result.error) {
      if (result.error === 'Insufficient balance') {
        router.push('/wallet')
      } else {
        setMessage({ type: 'error', text: result.error })
      }
    } else {
      setMessage({ type: 'success', text: 'Sınaq uğurla alındı!' })
      router.refresh()
    }
    setPurchasing(null)
  }

  const categoryLabel: Record<string, string> = {
    MIQ: 'MİQ',
    Blok: 'Blok',
    Buraxilis: 'Buraxılış',
    Dovlet_Quluqu: 'Dövlət Qulluğu',
    Diger: 'Digər',
  }

  return (
    <div>
      {/* Filter Bar */}
      <div className="flex flex-wrap gap-3 mb-6">
        {/* Category filter */}
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-sm font-medium text-gray-600 flex items-center gap-1">
            <Filter className="w-4 h-4" />
          </span>
          <button
            onClick={() => { setLocalFilters(f => ({...f, category: ''})); applyFilters({...localFilters, category: ''}) }}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${!localFilters.category ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-blue-300'}`}
          >
            {t.catalog.allCategories}
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => { const nf = {...localFilters, category: localFilters.category === cat ? '' : cat}; setLocalFilters(nf); applyFilters(nf) }}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${localFilters.category === cat ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-blue-300'}`}
            >
              {categoryLabel[cat] || cat}
            </button>
          ))}
        </div>

        {/* Language filter */}
        <div className="flex gap-2 ml-auto">
          <button
            onClick={() => { const nf = {...localFilters, lang: ''}; setLocalFilters(nf); applyFilters(nf) }}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${!localFilters.lang ? 'bg-gray-700 text-white' : 'bg-white text-gray-600 border border-gray-200'}`}
          >
            {t.catalog.allLangs}
          </button>
          <button
            onClick={() => { const nf = {...localFilters, lang: 'AZ'}; setLocalFilters(nf); applyFilters(nf) }}
            className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${localFilters.lang === 'AZ' ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-600 border border-blue-200'}`}
          >
            🇦🇿 AZ
          </button>
          <button
            onClick={() => { const nf = {...localFilters, lang: 'RU'}; setLocalFilters(nf); applyFilters(nf) }}
            className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${localFilters.lang === 'RU' ? 'bg-red-600 text-white' : 'bg-red-50 text-red-600 border border-red-200'}`}
          >
            🇷🇺 RU
          </button>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`mb-4 px-4 py-3 rounded-xl text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {message.text}
        </div>
      )}

      {/* Test Count */}
      <p className="text-sm text-gray-500 mb-4">{tests.length} sınaq tapıldı</p>

      {/* Test Grid */}
      {tests.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p>{t.catalog.noTests}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tests.map((test) => {
            const isPurchased = purchasedTestIds.includes(test.id)
            const isFree = test.price === 0
            const canAccess = isPurchased || isFree || userRole === 'admin'

            return (
              <div key={test.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                <div className="p-5">
                  {/* Top badges */}
                  <div className="flex items-center justify-between mb-3">
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${CATEGORY_COLORS[test.category] || 'bg-gray-100 text-gray-600'}`}>
                      {categoryLabel[test.category] || test.category}
                    </span>
                    <span className={`px-2 py-0.5 rounded-md text-xs font-bold ${LANG_COLORS[test.language]}`}>
                      {test.language === 'AZ' ? '🇦🇿 AZ' : '🇷🇺 RU'}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="font-semibold text-gray-900 text-sm mb-1 line-clamp-2">{test.title}</h3>
                  <p className="text-xs text-gray-500 mb-3">{test.subject} · {test.teacher?.full_name}</p>

                  {/* Stats */}
                  <div className="flex items-center gap-3 text-xs text-gray-500 mb-4">
                    <span className="flex items-center gap-1">
                      <BookOpen className="w-3.5 h-3.5" />
                      {test.question_count} {t.catalog.questions}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {test.duration_minutes} {t.catalog.minutes}
                    </span>
                  </div>

                  {/* Price + Action */}
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-lg text-gray-900">
                      {isFree ? (
                        <span className="text-green-600 text-sm font-semibold">{t.catalog.free}</span>
                      ) : (
                        <span>{test.price.toFixed(2)} ₼</span>
                      )}
                    </div>

                    {canAccess ? (
                      <Link
                        href={`/exam/${test.id}`}
                        className="flex items-center gap-1.5 bg-green-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-600 transition-colors"
                      >
                        <CheckCircle className="w-4 h-4" />
                        {t.exam.startExam}
                      </Link>
                    ) : !userId ? (
                      <Link
                        href="/auth/login"
                        className="flex items-center gap-1.5 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                      >
                        {t.catalog.buy}
                      </Link>
                    ) : (
                      <button
                        onClick={() => handlePurchase(test.id)}
                        disabled={purchasing === test.id}
                        className="flex items-center gap-1.5 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-60"
                      >
                        {purchasing === test.id ? (
                          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Wallet className="w-4 h-4" />
                        )}
                        {t.catalog.buyWithBalance}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
