'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Test, Question } from '@/lib/types'
import { savePdfAnswerKeyAction, submitTestForApprovalAction } from '@/lib/actions'
import { Loader2, Send, Save, ChevronDown, ChevronUp } from 'lucide-react'

const OPTIONS = ['A', 'B', 'C', 'D', 'E'] as const

interface Props {
  test: Test
  questions: Question[]
}

export default function PdfQuestionManager({ test, questions: initialQuestions }: Props) {
  const router = useRouter()

  // Initialize correct options from existing questions or defaults
  const [questionCount, setQuestionCount] = useState(
    initialQuestions.length > 0 ? initialQuestions.length : 20
  )
  const [answers, setAnswers] = useState<string[]>(() => {
    if (initialQuestions.length > 0) {
      return initialQuestions.map(q => q.correct_option)
    }
    return Array(20).fill('A')
  })

  const [saving, setSaving] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [pdfCollapsed, setPdfCollapsed] = useState(false)

  function handleCountChange(count: number) {
    setQuestionCount(count)
    setAnswers(prev => {
      const next = [...prev]
      if (count > next.length) {
        return [...next, ...Array(count - next.length).fill('A')]
      }
      return next.slice(0, count)
    })
  }

  async function handleSave() {
    setSaving(true)
    setError(null)
    setSuccess(null)
    const result = await savePdfAnswerKeyAction(test.id, answers)
    setSaving(false)
    if (result.error) {
      setError(result.error)
    } else {
      setSuccess('Cavab açarı saxlanıldı!')
      router.refresh()
    }
  }

  async function handleSubmitForApproval() {
    if (answers.length === 0) {
      setError('Ən azı 1 sual əlavə edin')
      return
    }
    // Save first, then submit
    setSaving(true)
    setError(null)
    const saveResult = await savePdfAnswerKeyAction(test.id, answers)
    setSaving(false)
    if (saveResult.error) {
      setError(saveResult.error)
      return
    }

    setSubmitting(true)
    const result = await submitTestForApprovalAction(test.id)
    setSubmitting(false)
    if (result.success) {
      router.push('/teacher/tests')
    } else {
      setError(result.error || 'Xəta baş verdi')
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{test.title}</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-xs px-2 py-0.5 rounded font-semibold ${test.language === 'AZ' ? 'bg-blue-50 text-blue-600' : 'bg-red-50 text-red-600'}`}>
              {test.language === 'AZ' ? '🇦🇿 AZ' : '🇷🇺 RU'}
            </span>
            <span className="text-xs text-gray-400">{test.subject} · {test.category} · {test.duration_minutes} dəq</span>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 bg-gray-800 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-900 transition-colors disabled:opacity-60"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Saxla
          </button>
          {!test.is_approved && (
            <button
              onClick={handleSubmitForApproval}
              disabled={submitting || saving}
              className="flex items-center gap-1.5 bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-60"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Təsdiqə göndər
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="px-4 py-3 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100">{error}</div>
      )}
      {success && (
        <div className="px-4 py-3 bg-green-50 text-green-700 text-sm rounded-xl border border-green-100">✓ {success}</div>
      )}

      {/* Main layout: PDF left, answer key right */}
      <div className="flex flex-col lg:flex-row gap-6">

        {/* PDF Viewer */}
        <div className="flex-1 min-w-0">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <button
              onClick={() => setPdfCollapsed(!pdfCollapsed)}
              className="w-full flex items-center justify-between px-5 py-3 border-b border-gray-100 bg-gray-50 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <span>📄 Sınaq PDF-i</span>
              {pdfCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>
            {!pdfCollapsed && (
              <iframe
                src={`${test.pdf_url}#toolbar=1&navpanes=0`}
                className="w-full"
                style={{ height: '75vh', minHeight: 400 }}
                title="Sınaq PDF"
              />
            )}
          </div>
          {pdfCollapsed && (
            <a
              href={test.pdf_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 mt-2 text-sm text-blue-600 hover:underline"
            >
              📄 PDF-i yeni sekmədə aç
            </a>
          )}
        </div>

        {/* Answer Key Panel */}
        <div className="w-full lg:w-80 flex-shrink-0">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sticky top-4">
            <h2 className="font-semibold text-gray-900 mb-4">🔑 Cavab Açarı</h2>

            {/* Question count */}
            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Sual sayı</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={questionCount}
                  min={1}
                  max={200}
                  onChange={e => handleCountChange(Math.max(1, Math.min(200, parseInt(e.target.value) || 1)))}
                  className="w-24 px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-xs text-gray-400">sual (maks. 200)</span>
              </div>
            </div>

            {/* Quick fill row */}
            <div className="mb-3">
              <p className="text-xs font-medium text-gray-500 mb-1.5">Hamısını:</p>
              <div className="flex gap-1.5">
                {OPTIONS.map(opt => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setAnswers(Array(questionCount).fill(opt))}
                    className="flex-1 py-1 text-xs font-bold rounded-lg border border-gray-200 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-colors"
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            {/* Scrollable answers list */}
            <div className="overflow-y-auto pr-1" style={{ maxHeight: '55vh' }}>
              <div className="space-y-1.5">
                {answers.map((ans, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="w-8 text-xs font-semibold text-gray-400 text-right flex-shrink-0">
                      {idx + 1}.
                    </span>
                    <div className="flex gap-1">
                      {OPTIONS.map(opt => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => {
                            const next = [...answers]
                            next[idx] = opt
                            setAnswers(next)
                          }}
                          className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                            ans === opt
                              ? 'bg-green-500 text-white shadow-sm'
                              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-400 text-center">{questionCount} sual · Düzgün cavabı seçin</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
