'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useLang } from '@/lib/lang-context'
import { Question, CorrectOption, ExamSession } from '@/lib/types'
import { submitExamAction } from '@/lib/actions'
import { formatTime } from '@/lib/finance'
import { Clock, Maximize, Minimize, ChevronLeft, ChevronRight, AlertTriangle, Check, FileText, ListChecks, ExternalLink } from 'lucide-react'

interface ExamEngineProps {
  testId: string
  testTitle: string
  questions: Question[]
  durationMinutes: number
  startTime: number
  initialAnswers: Record<string, CorrectOption>
  isCompleted: boolean
  pdfUrl?: string
}

const OPTION_KEYS: CorrectOption[] = ['A', 'B', 'C', 'D', 'E']

export default function ExamEngine({
  testId,
  testTitle,
  questions,
  durationMinutes,
  startTime,
  initialAnswers,
  isCompleted: initialCompleted,
  pdfUrl,
}: ExamEngineProps) {
  const { t } = useLang()
  const router = useRouter()
  const totalSeconds = durationMinutes * 60

  const [answers, setAnswers] = useState<Record<string, CorrectOption>>(initialAnswers)
  const [currentIdx, setCurrentIdx] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [timeLeft, setTimeLeft] = useState(() => {
    const elapsed = Math.floor((Date.now() - startTime) / 1000)
    return Math.max(0, totalSeconds - elapsed)
  })
  // PDF mode: tab state for mobile
  const [mobileTab, setMobileTab] = useState<'pdf' | 'answers'>('pdf')

  const containerRef = useRef<HTMLDivElement>(null)
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null)

  const saveToLocalStorage = useCallback(() => {
    const session: ExamSession = {
      testId,
      startTime,
      answers,
      currentQuestion: currentIdx,
      isCompleted: false,
    }
    localStorage.setItem(`exam_session_${testId}`, JSON.stringify(session))
  }, [testId, startTime, answers, currentIdx])

  useEffect(() => {
    const stored = localStorage.getItem(`exam_session_${testId}`)
    if (stored) {
      const session: ExamSession = JSON.parse(stored)
      if (session.testId === testId) {
        setAnswers(prev => ({ ...session.answers, ...prev }))
        setCurrentIdx(session.currentQuestion || 0)
      }
    }
  }, [testId])

  useEffect(() => {
    if (timeLeft <= 0) { handleSubmit(); return }
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000)
      const remaining = Math.max(0, totalSeconds - elapsed)
      setTimeLeft(remaining)
      if (remaining <= 0) { clearInterval(interval); handleSubmit() }
    }, 1000)
    return () => clearInterval(interval)
  }, [startTime, totalSeconds])

  useEffect(() => {
    saveTimerRef.current = setInterval(saveToLocalStorage, 10000)
    return () => { if (saveTimerRef.current) clearInterval(saveTimerRef.current) }
  }, [saveToLocalStorage])

  useEffect(() => { saveToLocalStorage() }, [answers, currentIdx])

  const toggleFullscreen = async () => {
    if (!isFullscreen) {
      await containerRef.current?.requestFullscreen()
      setIsFullscreen(true)
    } else {
      await document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', handler)
    return () => document.removeEventListener('fullscreenchange', handler)
  }, [])

  const handleAnswer = (questionId: string, option: CorrectOption) => {
    setAnswers(prev => ({ ...prev, [questionId]: option }))
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    setShowConfirm(false)
    const spentSeconds = totalSeconds - timeLeft
    const result = await submitExamAction(testId, answers, spentSeconds)
    if (result.success) {
      localStorage.removeItem(`exam_session_${testId}`)
      if (document.fullscreenElement) await document.exitFullscreen()
      router.push(`/results/${testId}`)
    } else {
      setSubmitting(false)
    }
  }

  const currentQ = questions[currentIdx]
  const answeredCount = Object.keys(answers).length
  const timerWarning = timeLeft < 300

  // ─── PDF MODE ───────────────────────────────────────────────
  if (pdfUrl) {
    return (
      <div ref={containerRef} className="min-h-screen bg-gray-50 flex flex-col exam-fullscreen">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-10 gap-3">
          <div className="flex-1 min-w-0">
            <h1 className="font-semibold text-gray-900 text-sm truncate">{testTitle}</h1>
            <p className="text-xs text-gray-500">{answeredCount}/{questions.length} cavablandı</p>
          </div>

          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl font-mono font-bold text-base ${timerWarning ? 'bg-red-50 text-red-600 animate-pulse' : 'bg-blue-50 text-blue-700'}`}>
            <Clock className="w-4 h-4" />
            {formatTime(timeLeft)}
          </div>

          <div className="flex items-center gap-2">
            <button onClick={toggleFullscreen} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hidden md:block">
              {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
            </button>
            <button
              onClick={() => setShowConfirm(true)}
              disabled={submitting}
              className="bg-red-500 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-red-600 transition-colors disabled:opacity-60"
            >
              {t.exam.finishExam}
            </button>
          </div>
        </div>

        {/* Mobile Tabs */}
        <div className="flex md:hidden border-b border-gray-200 bg-white">
          <button
            onClick={() => setMobileTab('pdf')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium transition-colors ${mobileTab === 'pdf' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
          >
            <FileText className="w-4 h-4" /> PDF
          </button>
          <button
            onClick={() => setMobileTab('answers')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium transition-colors ${mobileTab === 'answers' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
          >
            <ListChecks className="w-4 h-4" /> Cavablar
            {answeredCount > 0 && (
              <span className="ml-1 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">{answeredCount}</span>
            )}
          </button>
        </div>

        {/* Desktop: split view | Mobile: tab view */}
        <div className="flex flex-1 overflow-hidden">

          {/* PDF Viewer */}
          <div className={`flex-1 overflow-hidden ${mobileTab === 'pdf' ? 'block' : 'hidden'} md:block`}>
            <div className="h-full flex flex-col">
              <div className="flex items-center justify-between px-3 py-2 bg-gray-100 border-b border-gray-200">
                <span className="text-xs text-gray-500 flex items-center gap-1"><FileText className="w-3.5 h-3.5" /> Sınaq sənədi</span>
                <a href={pdfUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                  <ExternalLink className="w-3 h-3" /> Tam ekranda aç
                </a>
              </div>
              <iframe
                src={`${pdfUrl}#toolbar=1&navpanes=0`}
                className="flex-1 w-full"
                style={{ minHeight: 0 }}
                title="Sınaq PDF"
              />
            </div>
          </div>

          {/* Bubble Sheet Panel */}
          <div className={`w-full md:w-72 lg:w-80 flex-shrink-0 border-l border-gray-200 bg-white overflow-y-auto ${mobileTab === 'answers' ? 'block' : 'hidden'} md:block`}>
            <div className="p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase mb-3">Cavab vərəqi</p>

              {/* Quick stats */}
              <div className="flex gap-2 mb-4">
                <div className="flex-1 bg-green-50 rounded-xl p-2.5 text-center">
                  <div className="text-lg font-bold text-green-600">{answeredCount}</div>
                  <div className="text-xs text-green-600">Cavablandı</div>
                </div>
                <div className="flex-1 bg-gray-50 rounded-xl p-2.5 text-center">
                  <div className="text-lg font-bold text-gray-500">{questions.length - answeredCount}</div>
                  <div className="text-xs text-gray-500">Qalıb</div>
                </div>
              </div>

              {/* Bubble sheet */}
              <div className="space-y-1.5">
                {questions.map((q, idx) => (
                  <div key={q.id} className="flex items-center gap-2">
                    <span className="w-7 text-xs font-semibold text-gray-400 text-right flex-shrink-0">{idx + 1}.</span>
                    <div className="flex gap-1">
                      {OPTION_KEYS.map(opt => (
                        <button
                          key={opt}
                          onClick={() => handleAnswer(q.id, opt)}
                          className={`w-8 h-8 rounded-full text-xs font-bold transition-all ${
                            answers[q.id] === opt
                              ? 'bg-blue-600 text-white shadow-sm scale-110'
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
          </div>
        </div>

        {/* Confirm Dialog */}
        {showConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-orange-500" />
                </div>
                <h3 className="font-semibold text-gray-900">İmtahanı bitir</h3>
              </div>
              <p className="text-sm text-gray-600 mb-2">{t.exam.confirmFinish}</p>
              <div className="flex items-center gap-2 mb-4 text-sm">
                <span className="text-green-600 font-medium">✓ {answeredCount} cavablandı</span>
                <span className="text-gray-400">·</span>
                <span className="text-gray-500">{questions.length - answeredCount} cavabsız</span>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowConfirm(false)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">
                  {t.exam.no}
                </button>
                <button onClick={handleSubmit} disabled={submitting} className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-medium hover:bg-red-600 disabled:opacity-60">
                  {submitting ? 'Göndərilir...' : t.exam.yes}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // ─── CLASSIC MODE ─────────────────────────────────────────────
  const OPTIONS: { key: CorrectOption; label: string }[] = [
    { key: 'A', label: currentQ?.option_a },
    { key: 'B', label: currentQ?.option_b },
    { key: 'C', label: currentQ?.option_c },
    { key: 'D', label: currentQ?.option_d },
    { key: 'E', label: currentQ?.option_e },
  ]

  return (
    <div ref={containerRef} className="min-h-screen bg-white flex flex-col exam-fullscreen">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex-1 min-w-0">
          <h1 className="font-semibold text-gray-900 text-sm truncate">{testTitle}</h1>
          <p className="text-xs text-gray-500">{answeredCount}/{questions.length} cavablandı</p>
        </div>

        <div className={`flex items-center gap-2 px-4 py-2 rounded-xl font-mono font-bold text-lg ${timerWarning ? 'bg-red-50 text-red-600 animate-pulse' : 'bg-blue-50 text-blue-700'}`}>
          <Clock className="w-5 h-5" />
          {formatTime(timeLeft)}
        </div>

        <div className="flex items-center gap-2 ml-4">
          <button onClick={toggleFullscreen} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
            {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
          </button>
          <button
            onClick={() => setShowConfirm(true)}
            disabled={submitting}
            className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-600 transition-colors disabled:opacity-60"
          >
            {t.exam.finishExam}
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Question navigation sidebar */}
        <div className="w-64 border-r border-gray-100 bg-gray-50 p-4 overflow-y-auto hidden md:block">
          <p className="text-xs font-semibold text-gray-500 uppercase mb-3">Suallar</p>
          <div className="grid grid-cols-5 gap-1.5">
            {questions.map((q, idx) => (
              <button
                key={q.id}
                onClick={() => setCurrentIdx(idx)}
                className={`question-nav-btn ${idx === currentIdx ? 'current' : answers[q.id] ? 'answered' : 'unanswered'}`}
              >
                {idx + 1}
              </button>
            ))}
          </div>
          <div className="mt-4 space-y-2 text-xs text-gray-500">
            <div className="flex items-center gap-2"><div className="w-4 h-4 bg-blue-500 rounded-sm" /><span>Cavablandı ({answeredCount})</span></div>
            <div className="flex items-center gap-2"><div className="w-4 h-4 bg-gray-200 rounded-sm" /><span>Cavablanmadı ({questions.length - answeredCount})</span></div>
          </div>
        </div>

        {/* Main question area */}
        <div className="flex-1 overflow-y-auto">
          {currentQ && (
            <div className="max-w-3xl mx-auto p-6">
              <div className="flex items-center justify-between mb-6">
                <span className="text-sm font-semibold text-gray-500">
                  {t.exam.question} {currentIdx + 1} {t.exam.of} {questions.length}
                </span>
                {answers[currentQ.id] && (
                  <span className="flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">
                    <Check className="w-3 h-3" /> {t.exam.answered}
                  </span>
                )}
              </div>

              <div className="mb-6">
                {currentQ.question_image_url && (
                  <img src={currentQ.question_image_url} alt="Sual şəkli" className="max-w-full rounded-xl mb-4 border border-gray-100" />
                )}
                {currentQ.question_text && (
                  <p className="text-gray-900 text-base leading-relaxed">{currentQ.question_text}</p>
                )}
              </div>

              <div className="space-y-3">
                {OPTIONS.map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => handleAnswer(currentQ.id, key)}
                    className={`answer-option w-full text-left ${answers[currentQ.id] === key ? 'selected' : ''}`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0 ${answers[currentQ.id] === key ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'}`}>
                      {key}
                    </div>
                    <span className="text-sm text-gray-700">{label}</span>
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-between mt-8">
                <button
                  onClick={() => setCurrentIdx(i => Math.max(0, i - 1))}
                  disabled={currentIdx === 0}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" /> {t.exam.prev}
                </button>
                <button
                  onClick={() => setCurrentIdx(i => Math.min(questions.length - 1, i + 1))}
                  disabled={currentIdx === questions.length - 1}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-40 transition-colors"
                >
                  {t.exam.next} <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Confirm Dialog */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-orange-500" />
              </div>
              <h3 className="font-semibold text-gray-900">İmtahanı bitir</h3>
            </div>
            <p className="text-sm text-gray-600 mb-2">{t.exam.confirmFinish}</p>
            <div className="flex items-center gap-2 mb-4 text-sm">
              <span className="text-green-600 font-medium">✓ {answeredCount} cavablandı</span>
              <span className="text-gray-400">·</span>
              <span className="text-gray-500">{questions.length - answeredCount} cavabsız</span>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowConfirm(false)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">
                {t.exam.no}
              </button>
              <button onClick={handleSubmit} disabled={submitting} className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-medium hover:bg-red-600 disabled:opacity-60">
                {submitting ? 'Göndərilir...' : t.exam.yes}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
