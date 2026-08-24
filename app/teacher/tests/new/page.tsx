'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLang } from '@/lib/lang-context'
import { createTestAction } from '@/lib/actions'
import { Loader2, BookOpen, Clock, DollarSign, Globe, FileText, Upload, X } from 'lucide-react'

const CATEGORIES = [
  { value: 'MIQ', label: 'MİQ' },
  { value: 'Blok', label: 'Blok' },
  { value: 'Buraxilis', label: 'Buraxılış' },
  { value: 'Dovlet_Quluqu', label: 'Dövlət Qulluğu' },
  { value: 'Diger', label: 'Digər' },
]

const SUBJECTS = [
  'Riyaziyyat', 'Fizika', 'Kimya', 'Biologiya', 'Tarix',
  'Coğrafiya', 'Azərbaycan dili', 'İngilis dili', 'Rus dili',
  'Ədəbiyyat', 'Həndəsə', 'İnformatika', 'Digər',
]

async function uploadPdfToCloudinary(file: File): Promise<string> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!

  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', uploadPreset)
  formData.append('resource_type', 'raw')

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/raw/upload`,
    { method: 'POST', body: formData }
  )

  if (!res.ok) throw new Error('PDF yüklənmədi')
  const data = await res.json()
  return data.secure_url as string
}

export default function NewTestPage() {
  const { t } = useLang()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [uploadingPdf, setUploadingPdf] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const fd = new FormData(e.currentTarget)

    // Upload PDF to Cloudinary first if provided
    if (pdfFile) {
      try {
        setUploadingPdf(true)
        const pdfUrl = await uploadPdfToCloudinary(pdfFile)
        fd.set('pdf_url', pdfUrl)
        setUploadingPdf(false)
      } catch (err) {
        setError('PDF yüklənərkən xəta baş verdi. Yenidən cəhd edin.')
        setLoading(false)
        setUploadingPdf(false)
        return
      }
    }

    const result = await createTestAction(fd)
    setLoading(false)
    if (result.error) {
      setError(result.error)
    } else {
      router.push(`/teacher/tests/${result.testId}/questions`)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">{t.teacher.createTest}</h1>
        <p className="text-gray-500 text-sm mt-1">Yeni sınağın əsas məlumatlarını doldurun</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              {t.teacher.testTitle} *
            </label>
            <input
              type="text"
              name="title"
              required
              placeholder="MİQ Riyaziyyat — Sınaq 1"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>

          {/* Category + Language */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {t.teacher.category} *
              </label>
              <select
                name="category"
                required
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white transition-all"
              >
                {CATEGORIES.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1">
                <Globe className="w-3.5 h-3.5" />
                {t.teacher.language} *
              </label>
              <div className="flex gap-2">
                <label className="flex-1">
                  <input type="radio" name="language" value="AZ" defaultChecked className="sr-only peer" />
                  <div className="peer-checked:bg-blue-600 peer-checked:text-white peer-checked:border-blue-600 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border-2 border-gray-200 text-sm font-semibold cursor-pointer transition-all">
                    🇦🇿 AZ
                  </div>
                </label>
                <label className="flex-1">
                  <input type="radio" name="language" value="RU" className="sr-only peer" />
                  <div className="peer-checked:bg-red-500 peer-checked:text-white peer-checked:border-red-500 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border-2 border-gray-200 text-sm font-semibold cursor-pointer transition-all">
                    🇷🇺 RU
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              {t.teacher.subject} *
            </label>
            <select
              name="subject"
              required
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white transition-all"
            >
              {SUBJECTS.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Duration + Price */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {t.teacher.duration} *
              </label>
              <input
                type="number"
                name="duration_minutes"
                required
                min="10"
                max="300"
                defaultValue="90"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5" />
                {t.teacher.price} (0 = pulsuz)
              </label>
              <input
                type="number"
                name="price"
                min="0"
                max="100"
                step="0.5"
                defaultValue="0"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              {t.teacher.description}
            </label>
            <textarea
              name="description"
              rows={3}
              placeholder="Sınaq haqqında qısa məlumat..."
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none"
            />
          </div>

          {/* PDF Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-red-500" />
              Sınaq PDF faylı *
            </label>
            <p className="text-xs text-gray-400 mb-2">
              Müəllimlər sualları PDF kimi yükləyir. Şagirdlər imtahan zamanı PDF-i sol tərəfdə görəcək, cavabları isə sağ tərəfdə işarələyəcək.
            </p>

            {pdfFile ? (
              <div className="flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl">
                <FileText className="w-5 h-5 text-red-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{pdfFile.name}</p>
                  <p className="text-xs text-gray-400">{(pdfFile.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
                <button
                  type="button"
                  onClick={() => setPdfFile(null)}
                  className="p-1 rounded-full hover:bg-red-100 text-red-400"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-red-300 hover:bg-red-50 transition-all">
                <Upload className="w-6 h-6 text-gray-400 mb-2" />
                <span className="text-sm text-gray-500">PDF seç və ya bura sürükle</span>
                <span className="text-xs text-gray-400 mt-1">Maks. 20 MB</span>
                <input
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={e => {
                    const file = e.target.files?.[0]
                    if (file) setPdfFile(file)
                  }}
                />
              </label>
            )}
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl border border-red-100">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              {t.common.cancel}
            </button>
            <button
              type="submit"
              disabled={loading || !pdfFile}
              className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-60"
            >
              {(loading || uploadingPdf) && <Loader2 className="w-4 h-4 animate-spin" />}
              {uploadingPdf ? 'PDF yüklənir...' : 'Davam et → Cavab açarı'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
