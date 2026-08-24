'use client'

import { useState } from 'react'
import { Question } from '@/lib/types'
import { Check, X, Minus, FileText, ExternalLink } from 'lucide-react'

interface Props {
  questions: Question[]
  studentAnswers: Record<string, string>
  pdfUrl?: string
}

const OPTION_LABELS = ['A', 'B', 'C', 'D', 'E'] as const

export default function ResultDetails({ questions, studentAnswers, pdfUrl }: Props) {
  const [mobileTab, setMobileTab] = useState<'pdf' | 'results'>('results')

  const ResultsList = () => (
    <div className="space-y-2">
      {questions.map((q, idx) => {
        const studentAnswer = studentAnswers[q.id]
        const isCorrect = studentAnswer === q.correct_option
        const isBlank = !studentAnswer

        const statusIcon = isBlank
          ? <Minus className="w-4 h-4 text-gray-400" />
          : isCorrect
          ? <Check className="w-4 h-4 text-green-600" />
          : <X className="w-4 h-4 text-red-600" />

        const rowBg = isBlank
          ? 'bg-gray-50 border-gray-100'
          : isCorrect
          ? 'bg-green-50 border-green-100'
          : 'bg-red-50 border-red-100'

        return (
          <div key={q.id} className={`rounded-xl border ${rowBg} p-3`}>
            <div className="flex items-center gap-3">
              {/* Status icon */}
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${isBlank ? 'bg-gray-200' : isCorrect ? 'bg-green-100' : 'bg-red-100'}`}>
                {statusIcon}
              </div>

              {/* Question number */}
              <span className="text-sm font-semibold text-gray-700 w-12 flex-shrink-0">{idx + 1}. sual</span>

              {/* Bubbles */}
              <div className="flex gap-1 flex-wrap">
                {OPTION_LABELS.map(opt => {
                  const isStudentChoice = opt === studentAnswer
                  const isCorrectOpt = opt === q.correct_option
                  return (
                    <span
                      key={opt}
                      className={`w-8 h-8 rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0 ${
                        isCorrectOpt
                          ? 'bg-green-500 text-white'
                          : isStudentChoice && !isCorrect
                          ? 'bg-red-400 text-white'
                          : 'bg-white border border-gray-200 text-gray-400'
                      }`}
                    >
                      {opt}
                    </span>
                  )
                })}
              </div>

              {/* Answer summary */}
              <div className="ml-auto text-right text-xs flex-shrink-0">
                {isBlank ? (
                  <span className="text-gray-400">Boş</span>
                ) : isCorrect ? (
                  <span className="text-green-600 font-semibold">Düzgün</span>
                ) : (
                  <div>
                    <span className="text-red-500 line-through mr-1">{studentAnswer}</span>
                    <span className="text-green-600 font-semibold">→ {q.correct_option}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )

  // ─── PDF MODE ─────────────────────────────────────────────────
  if (pdfUrl) {
    return (
      <div>
        <h2 className="font-semibold text-gray-900 mb-4">Sualların Təhlili</h2>

        {/* Mobile Tabs */}
        <div className="flex md:hidden border border-gray-200 rounded-xl overflow-hidden mb-4">
          <button
            onClick={() => setMobileTab('results')}
            className={`flex-1 py-2.5 text-sm font-medium flex items-center justify-center gap-1.5 transition-colors ${mobileTab === 'results' ? 'bg-blue-600 text-white' : 'text-gray-600 bg-white'}`}
          >
            <Check className="w-4 h-4" /> Nəticələr
          </button>
          <button
            onClick={() => setMobileTab('pdf')}
            className={`flex-1 py-2.5 text-sm font-medium flex items-center justify-center gap-1.5 transition-colors ${mobileTab === 'pdf' ? 'bg-blue-600 text-white' : 'text-gray-600 bg-white'}`}
          >
            <FileText className="w-4 h-4" /> PDF
          </button>
        </div>

        {/* Desktop: split / Mobile: tabs */}
        <div className="flex flex-col md:flex-row gap-6">

          {/* Results list */}
          <div className={`flex-1 min-w-0 ${mobileTab === 'results' ? 'block' : 'hidden'} md:block`}>
            <ResultsList />
          </div>

          {/* PDF Viewer */}
          <div className={`w-full md:w-2/5 lg:w-1/2 flex-shrink-0 ${mobileTab === 'pdf' ? 'block' : 'hidden'} md:block`}>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden sticky top-4">
              <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 border-b border-gray-100">
                <span className="text-xs font-medium text-gray-500 flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5" /> Sınaq sənədi
                </span>
                <a href={pdfUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                  <ExternalLink className="w-3 h-3" /> Yeni sekmədə aç
                </a>
              </div>
              <iframe
                src={`${pdfUrl}#toolbar=1&navpanes=0`}
                className="w-full"
                style={{ height: '70vh', minHeight: 400 }}
                title="Sınaq PDF"
              />
            </div>
          </div>

        </div>
      </div>
    )
  }

  // ─── CLASSIC MODE ────────────────────────────────────────────
  return (
    <div className="space-y-3">
      <h2 className="font-semibold text-gray-900 mb-4">Sualların Təhlili</h2>
      <ResultsList />
    </div>
  )
}
