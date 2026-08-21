// lib/finance.ts
// Commission calculation and payment splitting logic

import { PaymentSplit } from './types'

/**
 * Splits a payment between the platform and the teacher.
 * @param amount - Total amount paid by student (AZN)
 * @param commissionRate - Platform commission percentage (e.g., 20 for 20%)
 */
export function splitPayment(amount: number, commissionRate: number): PaymentSplit {
  const platformCut = parseFloat((amount * (commissionRate / 100)).toFixed(2))
  const teacherCut = parseFloat((amount - platformCut).toFixed(2))
  return { platformCut, teacherCut }
}

/**
 * Format AZN currency
 */
export function formatAZN(amount: number): string {
  return `${amount.toFixed(2)} ₼`
}

/**
 * Format seconds to MM:SS
 */
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

/**
 * Format seconds to human readable
 */
export function formatTimeSpent(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  if (mins === 0) return `${secs}s`
  return `${mins}m ${secs}s`
}

/**
 * Calculate score percentage
 */
export function calculateScore(correct: number, total: number): number {
  if (total === 0) return 0
  return parseFloat(((correct / total) * 100).toFixed(2))
}

/**
 * Get score color based on percentage
 */
export function getScoreColor(percentage: number): string {
  if (percentage >= 80) return 'text-green-600'
  if (percentage >= 60) return 'text-yellow-600'
  if (percentage >= 40) return 'text-orange-500'
  return 'text-red-600'
}

/**
 * Get score badge color
 */
export function getScoreBadgeColor(percentage: number): string {
  if (percentage >= 80) return 'bg-green-100 text-green-800 border-green-200'
  if (percentage >= 60) return 'bg-yellow-100 text-yellow-800 border-yellow-200'
  if (percentage >= 40) return 'bg-orange-100 text-orange-800 border-orange-200'
  return 'bg-red-100 text-red-800 border-red-200'
}
