'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { approveTestAction, rejectTestAction } from '@/lib/actions'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'

interface Props {
  testId: string
  isApproved?: boolean
}

export default function AdminTestActions({ testId, isApproved = false }: Props) {
  const [loading, setLoading] = useState<'approve' | 'reject' | null>(null)
  const router = useRouter()

  async function handleApprove() {
    setLoading('approve')
    await approveTestAction(testId)
    router.refresh()
    setLoading(null)
  }

  async function handleReject() {
    setLoading('reject')
    await rejectTestAction(testId)
    router.refresh()
    setLoading(null)
  }

  if (isApproved) {
    return (
      <button
        onClick={handleReject}
        disabled={loading === 'reject'}
        className="flex items-center gap-1 text-xs text-red-500 hover:bg-red-50 px-2 py-1.5 rounded-lg transition-colors"
      >
        {loading === 'reject' ? <Loader2 className="w-3 h-3 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
        Geri al
      </button>
    )
  }

  return (
    <div className="flex gap-2 flex-shrink-0">
      <button
        onClick={handleReject}
        disabled={!!loading}
        className="flex items-center gap-1.5 text-sm text-red-500 border border-red-200 hover:bg-red-50 px-3 py-2 rounded-xl transition-colors disabled:opacity-60"
      >
        {loading === 'reject' ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
        Rədd et
      </button>
      <button
        onClick={handleApprove}
        disabled={!!loading}
        className="flex items-center gap-1.5 text-sm text-white bg-green-500 hover:bg-green-600 px-3 py-2 rounded-xl transition-colors disabled:opacity-60"
      >
        {loading === 'approve' ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
        Təsdiqlə
      </button>
    </div>
  )
}
