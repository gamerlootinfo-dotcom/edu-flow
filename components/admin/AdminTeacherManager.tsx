'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createTeacherAction } from '@/lib/actions'
import { User, Plus, Eye, EyeOff, Loader2, Copy, CheckCheck, BookOpen } from 'lucide-react'
import { formatAZN } from '@/lib/finance'

function generatePassword(len = 10) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#'
  return Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

interface Props {
  teachers: any[]
  testCounts: Record<string, number>
}

export default function AdminTeacherManager({ teachers, testCounts }: Props) {
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<{ name: string; email: string; password: string } | null>(null)
  const [showPass, setShowPass] = useState(false)
  const [copied, setCopied] = useState(false)

  const [form, setForm] = useState({
    full_name: '',
    email: '',
    password: generatePassword(),
  })

  function regeneratePassword() {
    setForm(f => ({ ...f, password: generatePassword() }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const fd = new FormData()
    fd.set('full_name', form.full_name)
    fd.set('email', form.email)
    fd.set('password', form.password)
    const result = await createTeacherAction(fd)
    setLoading(false)
    if (result.error) {
      setError(result.error)
    } else {
      setSuccess({ name: form.full_name, email: form.email, password: form.password })
      setForm({ full_name: '', email: '', password: generatePassword() })
      setShowForm(false)
      router.refresh()
    }
  }

  function copyCredentials() {
    if (!success) return
    navigator.clipboard.writeText(`Email: ${success.email}\nŞifrə: ${success.password}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div>
      {/* Success Banner */}
      {success && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-2xl p-5">
          <h3 className="font-semibold text-green-800 mb-2">✅ Müəllim hesabı yaradıldı!</h3>
          <p className="text-sm text-green-700 mb-1"><strong>Ad:</strong> {success.name}</p>
          <p className="text-sm text-green-700 mb-1"><strong>Email:</strong> {success.email}</p>
          <p className="text-sm text-green-700 mb-3"><strong>Şifrə:</strong> <code className="bg-green-100 px-2 py-0.5 rounded font-mono">{success.password}</code></p>
          <p className="text-xs text-green-600 mb-3">⚠️ Bu məlumatları müəllimə göndərin. Şifrəni gizli saxlayın!</p>
          <button
            onClick={copyCredentials}
            className="flex items-center gap-2 text-sm bg-green-600 text-white px-4 py-2 rounded-xl hover:bg-green-700 transition-colors"
          >
            {copied ? <CheckCheck className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Kopyalandı!' : 'Kopyala'}
          </button>
        </div>
      )}

      {/* Add Teacher Form */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm mb-6">
        <button
          onClick={() => setShowForm(!showForm)}
          className="w-full flex items-center justify-between p-5"
        >
          <span className="font-semibold text-gray-900 flex items-center gap-2">
            <Plus className="w-5 h-5 text-blue-600" />
            Yeni Müəllim Əlavə Et
          </span>
          <span className="text-gray-400 text-sm">{showForm ? '▲' : '▼'}</span>
        </button>

        {showForm && (
          <div className="px-5 pb-5 border-t border-gray-100">
            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Ad Soyad *</label>
                  <input
                    type="text"
                    required
                    value={form.full_name}
                    onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                    placeholder="Müəllimin adı"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">E-poçt *</label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="teacher@example.com"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Müvəqqəti Şifrə</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type={showPass ? 'text' : 'password'}
                      value={form.password}
                      onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                      className="w-full px-4 py-2.5 pr-10 border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={regeneratePassword}
                    className="px-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50"
                  >
                    Yenilə
                  </button>
                </div>
              </div>

              {error && <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl">{error}</div>}

              <button
                type="submit"
                disabled={loading}
                className="flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-blue-700 disabled:opacity-60"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Müəllim yarat
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Teachers List */}
      <h2 className="font-semibold text-gray-900 mb-3">Müəllimlər ({teachers.length})</h2>
      {teachers.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-gray-400 text-sm">
          Hələ müəllim yoxdur
        </div>
      ) : (
        <div className="space-y-2">
          {teachers.map(teacher => (
            <div key={teacher.id} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-4">
              <div className="w-9 h-9 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                {teacher.full_name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 text-sm">{teacher.full_name}</p>
                <p className="text-xs text-gray-400">{teacher.email}</p>
              </div>
              <div className="flex items-center gap-3 text-right">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{formatAZN(teacher.teacher_balance)}</p>
                  <p className="text-xs text-gray-400">balans</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{testCounts[teacher.id] || 0}</p>
                  <p className="text-xs text-gray-400 flex items-center gap-0.5"><BookOpen className="w-3 h-3" /> sınaq</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
