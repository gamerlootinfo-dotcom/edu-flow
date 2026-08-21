'use client'

import { useState } from 'react'
import { useLang } from '@/lib/lang-context'
import { topupWalletAction } from '@/lib/actions'
import { Wallet, Plus, ArrowUpRight, ArrowDownRight, Loader2, CreditCard } from 'lucide-react'
import { WalletTransaction, User } from '@/lib/types'

interface Props {
  user: User
  transactions: WalletTransaction[]
}

const QUICK_AMOUNTS = [5, 10, 20, 50]

export default function WalletClient({ user, transactions }: Props) {
  const { t } = useLang()
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  async function handleTopup(e: React.FormEvent) {
    e.preventDefault()
    const val = parseFloat(amount)
    if (!val || val <= 0) return
    setLoading(true)
    setMessage(null)
    const fd = new FormData()
    fd.set('amount', val.toString())
    const res = await topupWalletAction(fd)
    setLoading(false)
    if (res.success) {
      setMessage({ type: 'success', text: `${val.toFixed(2)} ₼ balansınıza əlavə edildi!` })
      setAmount('')
    } else {
      setMessage({ type: 'error', text: res.error || 'Xəta baş verdi' })
    }
  }

  const txIcon = (type: string) => {
    if (type === 'topup') return <ArrowUpRight className="w-4 h-4 text-green-600" />
    if (type === 'earning') return <ArrowUpRight className="w-4 h-4 text-green-600" />
    return <ArrowDownRight className="w-4 h-4 text-red-500" />
  }

  const txColor = (type: string) => {
    if (type === 'topup' || type === 'earning') return 'text-green-600'
    return 'text-red-600'
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Balance Card */}
      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-8 text-white">
        <div className="flex items-center gap-3 mb-4">
          <Wallet className="w-6 h-6 text-blue-200" />
          <span className="text-blue-200 text-sm font-medium">{t.wallet.balance}</span>
        </div>
        <div className="text-4xl font-bold">{user.balance.toFixed(2)} ₼</div>
        <p className="text-blue-200 text-xs mt-2">Azərbaycan Manatı</p>
      </div>

      {/* Top-up Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-blue-600" />
          {t.wallet.topup}
          <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-normal">Mock</span>
        </h2>

        {/* Quick amounts */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          {QUICK_AMOUNTS.map(a => (
            <button
              key={a}
              onClick={() => setAmount(a.toString())}
              className={`py-2 rounded-xl text-sm font-semibold border-2 transition-all ${
                amount === a.toString()
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300'
              }`}
            >
              {a} ₼
            </button>
          ))}
        </div>

        <form onSubmit={handleTopup} className="space-y-3">
          <div className="relative">
            <input
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="Məbləği daxil edin..."
              min="1"
              max="500"
              step="0.01"
              className="w-full px-4 py-3 pr-12 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-semibold">₼</span>
          </div>

          {message && (
            <div className={`px-4 py-3 rounded-xl text-sm ${
              message.type === 'success'
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-red-50 text-red-600 border border-red-100'
            }`}>
              {message.text}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !amount}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            {t.wallet.topupBtn}
          </button>
        </form>

        <p className="text-xs text-gray-400 mt-3 text-center">
          Bu demo versiyasıdır. Real ödəniş üçün Payriff/Epoint inteqrasiyası tezliklə əlavə olunacaq.
        </p>
      </div>

      {/* Transaction History */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="font-semibold text-gray-900 mb-4">{t.wallet.history}</h2>
        {transactions.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-6">{t.wallet.noHistory}</p>
        ) : (
          <div className="space-y-3">
            {transactions.map(tx => (
              <div key={tx.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  tx.type === 'topup' || tx.type === 'earning' ? 'bg-green-50' : 'bg-red-50'
                }`}>
                  {txIcon(tx.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700 truncate">{tx.description || tx.type}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(tx.created_at).toLocaleDateString('az-AZ')}
                  </p>
                </div>
                <span className={`text-sm font-semibold ${txColor(tx.type)}`}>
                  {tx.amount > 0 ? '+' : ''}{tx.amount.toFixed(2)} ₼
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
