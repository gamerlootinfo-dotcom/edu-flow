'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useLang } from '@/lib/lang-context'
import { registerAction } from '@/lib/actions'
import { BookOpen, Eye, EyeOff, Loader2 } from 'lucide-react'

export default function RegisterPage() {
  const { t } = useLang()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)

  async function handleSubmit(formData: FormData) {
    const password = formData.get('password') as string
    if (password.length < 6) {
      setError('Şifrə ən az 6 simvol olmalıdır')
      return
    }
    setLoading(true)
    setError(null)
    const result = await registerAction(formData)
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-600 rounded-2xl mb-4 shadow-lg">
            <BookOpen className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">AzTest</h1>
          <p className="text-gray-500 text-sm mt-1">Test Hazırlıq Platforması</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">{t.auth.registerTitle}</h2>

          <form action={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {t.auth.fullName}
              </label>
              <input
                type="text"
                name="full_name"
                required
                placeholder="Əli Əliyev"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {t.auth.email}
              </label>
              <input
                type="email"
                name="email"
                required
                placeholder="example@gmail.com"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {t.auth.phone}
              </label>
              <input
                type="tel"
                name="phone"
                placeholder="+994 50 123 45 67"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {t.auth.password}
              </label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  name="password"
                  required
                  minLength={6}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 pr-10 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-1">Minimum 6 simvol</p>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl border border-red-100">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-2.5 rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {t.auth.registerBtn}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            {t.auth.hasAccount}{' '}
            <Link href="/auth/login" className="text-blue-600 font-medium hover:underline">
              {t.auth.loginBtn}
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
