'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { processWithdrawalAction } from '@/lib/actions'
import { CheckCircle, XCircle, Loader2, CreditCard, User } from 'lucide-react'
import { formatAZN } from '@/lib/finance'

interface Props {
  withdrawals: any[]
  isPending: boolean
}

export default function AdminWithdrawalList({ withdrawals, isPending }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)

  async function handleProcess(id: string, status: 'completed' | 'rejected') {
    setLoading(`${id}-${status}`)
    await processWithdrawalAction(id, status)
    router.refresh()
    setLoading(null)
  }

  if (withdrawals.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center text-gray-400 text-sm">
        Sorğu yoxdur
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {withdrawals.map(w => (
        <div
          key={w.id}
          className={`bg-white rounded-2xl border shadow-sm p-5 ${
            isPending ? 'border-orange-100' : w.status === 'completed' ? 'border-green-100' : 'border-gray-100'
          }`}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <User className="w-4 h-4 text-gray-400" />
                <span className="font-medium text-gray-900">{w.teacher?.full_name}</span>
                <span className="text-xs text-gray-400">{w.teacher?.email}</span>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <span className="font-bold text-xl text-gray-900">{formatAZN(w.amount)}</span>
                <div className="flex items-center gap-1.5 text-gray-500">
                  <CreditCard className="w-4 h-4" />
                  <span className="font-mono">{w.card_number}</span>
                </div>
                <span className="text-gray-500">{w.card_holder_name}</span>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                {new Date(w.requested_at).toLocaleDateString('az-AZ', {
                  day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
                })}
              </p>
              {w.admin_note && (
                <p className="text-xs text-gray-500 mt-1">Qeyd: {w.admin_note}</p>
              )}
            </div>

            {isPending ? (
              <div className="flex gap-2 flex-shrink-0">
                <button
                  onClick={() => handleProcess(w.id, 'rejected')}
                  disabled={!!loading}
                  className="flex items-center gap-1.5 text-sm text-red-500 border border-red-200 hover:bg-red-50 px-3 py-2 rounded-xl transition-colors disabled:opacity-60"
                >
                  {loading === `${w.id}-rejected` ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                  Rədd et
                </button>
                <button
                  onClick={() => handleProcess(w.id, 'completed')}
                  disabled={!!loading}
                  className="flex items-center gap-1.5 text-sm text-white bg-green-500 hover:bg-green-600 px-3 py-2 rounded-xl transition-colors disabled:opacity-60"
                >
                  {loading === `${w.id}-completed` ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  Tamamlandı
                </button>
              </div>
            ) : (
              <span className={`px-3 py-1.5 rounded-xl text-xs font-semibold ${
                w.status === 'completed'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-red-100 text-red-600'
              }`}>
                {w.status === 'completed' ? '✓ Tamamlandı' : '✗ Rədd edildi'}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
