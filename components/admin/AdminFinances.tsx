'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateCommissionAction } from '@/lib/actions'
import { formatAZN } from '@/lib/finance'
import { Settings, TrendingUp, Loader2, Check } from 'lucide-react'

interface Props {
  commissionRate: string
  purchases: any[]
  totalRevenue: number
  totalPaid: number
}

export default function AdminFinances({ commissionRate: initialRate, purchases, totalRevenue, totalPaid }: Props) {
  const router = useRouter()
  const [rate, setRate] = useState(initialRate)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const fd = new FormData()
    fd.set('commission_rate', rate)
    await updateCommissionAction(fd)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    router.refresh()
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm text-center">
          <div className="text-2xl font-bold text-green-600">{formatAZN(totalRevenue)}</div>
          <div className="text-xs text-gray-500 mt-1">Platform gəliri</div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm text-center">
          <div className="text-2xl font-bold text-blue-600">{formatAZN(totalPaid)}</div>
          <div className="text-xs text-gray-500 mt-1">Ümumi satış</div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm text-center">
          <div className="text-2xl font-bold text-purple-600">{formatAZN(totalPaid - totalRevenue)}</div>
          <div className="text-xs text-gray-500 mt-1">Müəllimlərə ödənilən</div>
        </div>
      </div>

      {/* Commission Rate */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Settings className="w-5 h-5 text-blue-600" />
          Komissiya faizi
        </h2>
        <form onSubmit={handleSave} className="flex gap-3 items-end">
          <div className="flex-1">
            <label className="block text-sm text-gray-600 mb-1.5">Faiz (%)</label>
            <div className="relative">
              <input
                type="number"
                min="0"
                max="50"
                step="1"
                value={rate}
                onChange={e => setRate(e.target.value)}
                className="w-full px-4 py-2.5 pr-8 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">%</span>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              2 ₼ sınaq → Sizə: {(2 * parseFloat(rate || '0') / 100).toFixed(2)} ₼ · Müəllimə: {(2 - 2 * parseFloat(rate || '0') / 100).toFixed(2)} ₼
            </p>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-blue-700 disabled:opacity-60 transition-colors"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
            {saved ? 'Saxlandı!' : 'Saxla'}
          </button>
        </form>
      </div>

      {/* Recent Purchases */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="p-5 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Son Satışlar</h2>
        </div>
        <div className="divide-y divide-gray-50">
          {purchases.length === 0 ? (
            <div className="p-6 text-center text-gray-400 text-sm">Satış yoxdur</div>
          ) : (
            purchases.map(p => (
              <div key={p.id} className="flex items-center gap-4 p-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{p.test?.title}</p>
                  <p className="text-xs text-gray-400">{p.student?.full_name} · {new Date(p.purchased_at).toLocaleDateString('az-AZ')}</p>
                </div>
                <div className="flex gap-4 text-sm text-right flex-shrink-0">
                  <div>
                    <p className="font-semibold text-gray-900">{formatAZN(p.amount_paid)}</p>
                    <p className="text-xs text-gray-400">ödənildi</p>
                  </div>
                  <div>
                    <p className="font-semibold text-green-600">+{formatAZN(p.platform_cut)}</p>
                    <p className="text-xs text-gray-400">sizin pay</p>
                  </div>
                  <div>
                    <p className="font-semibold text-blue-600">+{formatAZN(p.teacher_cut)}</p>
                    <p className="text-xs text-gray-400">müəllim</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
