'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createWithdrawalRequestAction } from '@/lib/actions'
import { formatAZN } from '@/lib/finance'
import { CreditCard, Loader2, Clock, CheckCircle, XCircle } from 'lucide-react'

interface Props {
  balance: number
  withdrawals: any[]
}

export default function TeacherWithdrawClient({ balance, withdrawals }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [form, setForm] = useState({ amount: '', card_number: '', card_holder_name: '' })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const amount = parseFloat(form.amount)
    if (amount > balance) { setError('Balansınız kifayət etmir'); return }
    if (amount < 1) { setError('Minimum 1 AZN'); return }
    setLoading(true)
    setError(null)
    const fd = new FormData()
    fd.set('amount', form.amount)
    fd.set('card_number', form.card_number)
    fd.set('card_holder_name', form.card_holder_name)
    const result = await createWithdrawalRequestAction(fd)
    setLoading(false)
    if (result.error) {
      setError(result.error)
    } else {
      setSuccess(true)
      setForm({ amount: '', card_number: '', card_holder_name: '' })
      router.refresh()
    }
  }

  const hasPending = withdrawals.some(w => w.status === 'pending')

  return (
    <div className="space-y-6">
      {/* Request Form */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-blue-600" />
          Pul Çıxarışı Sorğusu
        </h2>

        {hasPending && (
          <div className="bg-orange-50 text-orange-700 text-sm px-4 py-3 rounded-xl mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Gözləyən sorğunuz var. Admin tamamlayana qədər yeni sorğu göndərilmir.
          </div>
        )}

        {success && (
          <div className="bg-green-50 text-green-700 text-sm px-4 py-3 rounded-xl mb-4 flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            Sorğunuz göndərildi! Admin tezliklə ödəniş edəcək.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Məbləğ (AZN)</label>
            <div className="relative">
              <input
                type="number"
                min="1"
                max={balance}
                step="0.01"
                required
                disabled={hasPending}
                value={form.amount}
                onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                placeholder={`Maks: ${balance.toFixed(2)} ₼`}
                className="w-full px-4 py-2.5 pr-8 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-400"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">₼</span>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Kart nömrəsi</label>
            <input
              type="text"
              required
              disabled={hasPending}
              value={form.card_number}
              onChange={e => setForm(f => ({ ...f, card_number: e.target.value }))}
              placeholder="4169 7388 XXXX XXXX"
              maxLength={19}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Kart sahibinin adı</label>
            <input
              type="text"
              required
              disabled={hasPending}
              value={form.card_holder_name}
              onChange={e => setForm(f => ({ ...f, card_holder_name: e.target.value }))}
              placeholder="ƏLİ ƏLİYEV"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm uppercase focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
            />
          </div>

          {error && <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl">{error}</div>}

          <button
            type="submit"
            disabled={loading || hasPending || balance < 1}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-xl font-medium hover:bg-blue-700 disabled:opacity-60 transition-colors"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Sorğu göndər
          </button>
        </form>
      </div>

      {/* History */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="p-5 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Çıxarış Tarixçəsi</h2>
        </div>
        <div className="divide-y divide-gray-50">
          {withdrawals.length === 0 ? (
            <p className="p-6 text-center text-sm text-gray-400">Tarixçə yoxdur</p>
          ) : (
            withdrawals.map(w => (
              <div key={w.id} className="flex items-center gap-4 p-4">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  w.status === 'completed' ? 'bg-green-50' : w.status === 'rejected' ? 'bg-red-50' : 'bg-orange-50'
                }`}>
                  {w.status === 'completed' ? <CheckCircle className="w-4 h-4 text-green-600" />
                    : w.status === 'rejected' ? <XCircle className="w-4 h-4 text-red-500" />
                    : <Clock className="w-4 h-4 text-orange-500" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm">{formatAZN(w.amount)}</p>
                  <p className="text-xs text-gray-400">{w.card_number} · {new Date(w.requested_at).toLocaleDateString('az-AZ')}</p>
                  {w.admin_note && <p className="text-xs text-gray-500 mt-0.5">Qeyd: {w.admin_note}</p>}
                </div>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-xl ${
                  w.status === 'completed' ? 'bg-green-100 text-green-700'
                  : w.status === 'rejected' ? 'bg-red-100 text-red-600'
                  : 'bg-orange-100 text-orange-600'
                }`}>
                  {w.status === 'completed' ? 'Tamamlandı' : w.status === 'rejected' ? 'Rədd edildi' : 'Gözləyir'}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
