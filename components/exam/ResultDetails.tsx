'use client'

import { useState } from 'react'
import { Question } from '@/lib/types'
import { Check, X, Minus, ChevronDown, ChevronUp, Image as ImageIcon } from 'lucide-react'

interface Props {
  questions: Question[]
  studentAnswers: Record<string, string>
}

const OPTION_LABELS = ['A', 'B', 'C', 'D', 'E'] as const

export default function ResultDetails({ questions, studentAnswers }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  return (
    <div className="space-y-3">
      <h2 className="font-semibold text-gray-900 mb-4">Sualların Təhlili</h2>
      {questions.map((q, idx) => {
        const studentAnswer = studentAnswers[q.id]
        const isCorrect = studentAnswer === q.correct_option
        const isBlank = !studentAnswer
        const isExpanded = expandedId === q.id

        const statusIcon = isBlank ? <Minus className="w-4 h-4 text-gray-400" />
          : isCorrect ? <Check className="w-4 h-4 text-green-600" />
          : <X className="w-4 h-4 text-red-600" />

        const statusBg = isBlank ? 'bg-gray-50 border-gray-100'
          : isCorrect ? 'bg-green-50 border-green-100'
          : 'bg-red-50 border-red-100'

        const options: Record<string, string> = {
          A: q.option_a,
          B: q.option_b,
          C: q.option_c,
          D: q.option_d,
          E: q.option_e,
        }

        return (
          <div
            key={q.id}
            className={`rounded-xl border ${statusBg} overflow-hidden`}
          >
            <button
              onClick={() => setExpandedId(isExpanded ? null : q.id)}
              className="w-full flex items-center gap-3 p-4 text-left hover:opacity-90 transition-opacity"
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                isBlank ? 'bg-gray-200' : isCorrect ? 'bg-green-100' : 'bg-red-100'
              }`}>
                {statusIcon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700">{idx + 1}. sual</span>
                  {studentAnswer && (
                    <span className={`text-xs px-1.5 py-0.5 rounded font-semibold ${
                      isCorrect ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'
                    }`}>
                      {studentAnswer}
                    </span>
                  )}
                  {!isBlank && !isCorrect && (
                    <span className="text-xs px-1.5 py-0.5 rounded font-semibold bg-green-200 text-green-800">
                      ✓ {q.correct_option}
                    </span>
                  )}
                </div>
                {q.question_text && (
                  <p className="text-xs text-gray-500 truncate mt-0.5">{q.question_text}</p>
                )}
                {q.question_image_url && !q.question_text && (
                  <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                    <ImageIcon className="w-3 h-3" /> Şəkilli sual
                  </p>
                )}
              </div>
              {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />}
            </button>

            {isExpanded && (
              <div className="px-4 pb-4 pt-0 border-t border-current border-opacity-10">
                {/* Question image */}
                {q.question_image_url && (
                  <img src={q.question_image_url} alt="Sual" className="max-w-full rounded-lg mb-3 border border-gray-200" />
                )}
                {q.question_text && (
                  <p className="text-sm text-gray-700 mb-3 leading-relaxed">{q.question_text}</p>
                )}

                {/* Options */}
                <div className="space-y-2 mb-4">
                  {OPTION_LABELS.map(opt => (
                    <div
                      key={opt}
                      className={`flex items-start gap-2 p-2.5 rounded-lg text-sm ${
                        opt === q.correct_option
                          ? 'bg-green-100 text-green-800 font-medium'
                          : opt === studentAnswer && !isCorrect
                          ? 'bg-red-100 text-red-700 line-through'
                          : 'text-gray-600'
                      }`}
                    >
                      <span className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                        opt === q.correct_option ? 'bg-green-500 text-white'
                        : opt === studentAnswer ? 'bg-red-400 text-white'
                        : 'bg-gray-200 text-gray-600'
                      }`}>{opt}</span>
                      {options[opt]}
                    </div>
                  ))}
                </div>

                {/* Explanation */}
                {(q.explanation_text || q.explanation_image_url) && (
                  <div className="bg-blue-50 rounded-xl p-3 border border-blue-100">
                    <p className="text-xs font-semibold text-blue-700 mb-2">💡 İzah</p>
                    {q.explanation_image_url && (
                      <img src={q.explanation_image_url} alt="İzah" className="max-w-full rounded-lg mb-2" />
                    )}
                    {q.explanation_text && (
                      <p className="text-sm text-blue-800">{q.explanation_text}</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
