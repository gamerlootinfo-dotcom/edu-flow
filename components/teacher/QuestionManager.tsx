'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useLang } from '@/lib/lang-context'
import { addQuestionAction, submitTestForApprovalAction } from '@/lib/actions'
import { Test, Question } from '@/lib/types'
import { Plus, Upload, Image as ImageIcon, Check, X, ChevronDown, ChevronUp, Send, Trash2, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const OPTIONS = ['A', 'B', 'C', 'D', 'E'] as const

interface Props {
  test: Test
  questions: Question[]
}

export default function QuestionManager({ test, questions: initialQuestions }: Props) {
  const { t } = useLang()
  const router = useRouter()
  const [questions, setQuestions] = useState(initialQuestions)
  const [showForm, setShowForm] = useState(questions.length === 0)
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploadingField, setUploadingField] = useState<string | null>(null)

  const [form, setForm] = useState({
    question_text: '',
    question_image_url: '',
    option_a: '', option_b: '', option_c: '', option_d: '', option_e: '',
    correct_option: 'A' as string,
    explanation_text: '',
    explanation_image_url: '',
  })

  const supabase = createClient()

  async function uploadImage(file: File, field: string): Promise<string> {
    setUploadingField(field)
    const ext = file.name.split('.').pop()
    const path = `questions/${test.id}/${Date.now()}.${ext}`
    const { data, error } = await supabase.storage
      .from('question-images')
      .upload(path, file, { upsert: true })

    setUploadingField(null)
    if (error) throw error

    const { data: { publicUrl } } = supabase.storage
      .from('question-images')
      .getPublicUrl(path)
    return publicUrl
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>, field: 'question_image_url' | 'explanation_image_url') {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const url = await uploadImage(file, field)
      setForm(f => ({ ...f, [field]: url }))
    } catch (err) {
      setError('Şəkil yükləmə xətası')
    }
  }

  async function handleAddQuestion(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const fd = new FormData()
    fd.set('test_id', test.id)
    Object.entries(form).forEach(([k, v]) => fd.set(k, v))

    const result = await addQuestionAction(fd)
    setLoading(false)

    if (result.error) {
      setError(result.error)
    } else {
      router.refresh()
      setForm({
        question_text: '', question_image_url: '',
        option_a: '', option_b: '', option_c: '', option_d: '', option_e: '',
        correct_option: 'A',
        explanation_text: '', explanation_image_url: '',
      })
      setShowForm(false)
    }
  }

  async function handleSubmitForApproval() {
    if (questions.length === 0) {
      setError('Ən azı 1 sual əlavə edin')
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
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{test.title}</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-xs px-2 py-0.5 rounded font-semibold ${test.language === 'AZ' ? 'bg-blue-50 text-blue-600' : 'bg-red-50 text-red-600'}`}>
              {test.language === 'AZ' ? '🇦🇿 AZ' : '🇷🇺 RU'}
            </span>
            <span className="text-xs text-gray-400">{test.subject} · {test.category} · {test.duration_minutes} dəq</span>
            <span className="text-xs text-gray-400">· {questions.length} sual</span>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-1.5 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Sual əlavə et
          </button>
          {!test.is_approved && (
            <button
              onClick={handleSubmitForApproval}
              disabled={submitting || questions.length === 0}
              className="flex items-center gap-1.5 bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-60"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Təsdiqə göndər
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100">
          {error}
        </div>
      )}

      {/* Add Question Form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-blue-100 shadow-sm p-6 mb-6">
          <h2 className="font-semibold text-gray-900 mb-5 flex items-center gap-2">
            <Plus className="w-4 h-4 text-blue-600" />
            Yeni Sual #{questions.length + 1}
          </h2>
          <form onSubmit={handleAddQuestion} className="space-y-5">
            {/* Question text */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">{t.teacher.questionText}</label>
              <textarea
                rows={3}
                value={form.question_text}
                onChange={e => setForm(f => ({ ...f, question_text: e.target.value }))}
                placeholder="Sualın mətnini daxil edin... (Şəkil varsa boş buraxa bilərsiniz)"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none transition-all"
              />
            </div>

            {/* Question image */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {t.teacher.questionImage}
                <span className="text-gray-400 font-normal ml-1">(riyaziyyat, fizika, kimya düsturları üçün)</span>
              </label>
              <div className="flex gap-3 items-start">
                <label className="flex items-center gap-2 px-4 py-2.5 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-500 cursor-pointer hover:border-blue-300 hover:bg-blue-50 transition-all">
                  {uploadingField === 'question_image_url' ? (
                    <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                  ) : (
                    <Upload className="w-4 h-4" />
                  )}
                  Şəkil seç
                  <input type="file" accept="image/*" className="hidden" onChange={e => handleImageUpload(e, 'question_image_url')} />
                </label>
                {form.question_image_url && (
                  <div className="relative">
                    <img src={form.question_image_url} alt="Sual" className="h-16 rounded-lg border border-gray-200 object-contain" />
                    <button
                      type="button"
                      onClick={() => setForm(f => ({ ...f, question_image_url: '' }))}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Options */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Cavab variantları *</label>
              <div className="space-y-2.5">
                {OPTIONS.map(opt => (
                  <div key={opt} className="flex gap-2 items-center">
                    <label className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold cursor-pointer flex-shrink-0 transition-all ${
                      form.correct_option === opt
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}>
                      <input
                        type="radio"
                        name="correct_option"
                        value={opt}
                        checked={form.correct_option === opt}
                        onChange={() => setForm(f => ({ ...f, correct_option: opt }))}
                        className="sr-only"
                      />
                      {opt}
                    </label>
                    <input
                      type="text"
                      required
                      value={(form as any)[`option_${opt.toLowerCase()}`]}
                      onChange={e => setForm(f => ({ ...f, [`option_${opt.toLowerCase()}`]: e.target.value }))}
                      placeholder={`Variant ${opt}`}
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    />
                    {form.correct_option === opt && (
                      <span className="text-xs text-green-600 font-medium">✓ Düzgün</span>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-1.5">Düzgün variantı seçmək üçün solda hərf düyməsinə klikləyin</p>
            </div>

            {/* Explanation */}
            <div className="border-t border-gray-100 pt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">{t.teacher.explanationText}</label>
              <textarea
                rows={2}
                value={form.explanation_text}
                onChange={e => setForm(f => ({ ...f, explanation_text: e.target.value }))}
                placeholder="İzah mətni (şagirdlər imtahanı bitirdikdən sonra görəcək)"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none mb-2 transition-all"
              />
              <label className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-500 cursor-pointer hover:border-blue-300 hover:bg-blue-50 transition-all w-fit">
                {uploadingField === 'explanation_image_url' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                İzah şəkli
                <input type="file" accept="image/*" className="hidden" onChange={e => handleImageUpload(e, 'explanation_image_url')} />
              </label>
              {form.explanation_image_url && (
                <img src={form.explanation_image_url} alt="İzah" className="h-12 mt-2 rounded-lg border border-gray-200 object-contain" />
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                Ləğv et
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white py-2.5 rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-60"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Sualı əlavə et
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Questions List */}
      {questions.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center text-gray-400">
          <p className="text-sm">Hələ sual əlavə edilməyib. Yuxarıdakı düyməyə klikləyin.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {questions.map((q, idx) => (
            <div key={q.id} className="bg-white rounded-xl border border-gray-100 p-4 flex items-start gap-3">
              <div className="w-7 h-7 bg-blue-100 text-blue-700 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0">
                {idx + 1}
              </div>
              <div className="flex-1 min-w-0">
                {q.question_image_url && <ImageIcon className="w-4 h-4 text-gray-400 mb-1" />}
                <p className="text-sm text-gray-700 line-clamp-2">{q.question_text || '(Şəkilli sual)'}</p>
                <p className="text-xs text-gray-400 mt-1">Düzgün: <span className="font-semibold text-green-600">{q.correct_option}</span></p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
