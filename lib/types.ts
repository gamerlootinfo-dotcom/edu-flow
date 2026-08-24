// lib/types.ts
// Full TypeScript types for the AzTest platform

export type Role = 'admin' | 'teacher' | 'student'
export type TestCategory = 'MIQ' | 'Blok' | 'Buraxilis' | 'Dovlet_Quluqu' | 'Diger'
export type TestLanguage = 'AZ' | 'RU'
export type CorrectOption = 'A' | 'B' | 'C' | 'D' | 'E'
export type WithdrawalStatus = 'pending' | 'completed' | 'rejected'
export type WalletTransactionType = 'topup' | 'purchase' | 'earning' | 'withdrawal'

export interface User {
  id: string
  email: string
  full_name: string
  role: Role
  balance: number
  teacher_balance: number
  phone?: string
  created_at: string
}

export interface Test {
  id: string
  teacher_id: string
  title: string
  category: TestCategory
  subject: string
  language: TestLanguage
  price: number
  duration_minutes: number
  question_count: number
  is_approved: boolean
  is_active: boolean
  description?: string
  pdf_url?: string
  created_at: string
  updated_at: string
  // Joined
  teacher?: User
}

export interface Question {
  id: string
  test_id: string
  order_number: number
  question_text?: string
  question_image_url?: string
  option_a: string
  option_b: string
  option_c: string
  option_d: string
  option_e: string
  correct_option: CorrectOption
  explanation_text?: string
  explanation_image_url?: string
  created_at: string
}

export interface Purchase {
  id: string
  student_id: string
  test_id: string
  amount_paid: number
  platform_cut: number
  teacher_cut: number
  purchased_at: string
  // Joined
  test?: Test
}

export interface StudentResult {
  id: string
  student_id: string
  test_id: string
  started_at: string
  completed_at?: string
  correct_answers_count: number
  wrong_answers_count: number
  blank_answers_count: number
  score_percentage: number
  spent_time_seconds: number
  student_answers: Record<string, CorrectOption>
  is_completed: boolean
  // Joined
  test?: Test
}

export interface WithdrawalRequest {
  id: string
  teacher_id: string
  amount: number
  card_number: string
  card_holder_name: string
  status: WithdrawalStatus
  admin_note?: string
  requested_at: string
  processed_at?: string
  // Joined
  teacher?: User
}

export interface WalletTransaction {
  id: string
  user_id: string
  type: WalletTransactionType
  amount: number
  description?: string
  reference_id?: string
  created_at: string
}

export interface PlatformSettings {
  id: string
  key: string
  value: string
  updated_at: string
}

// Finance calculation result
export interface PaymentSplit {
  platformCut: number
  teacherCut: number
}

// Exam session state (for localStorage persistence)
export interface ExamSession {
  testId: string
  startTime: number // Unix timestamp (ms)
  answers: Record<string, CorrectOption>
  currentQuestion: number
  isCompleted: boolean
}

// Dashboard stats
export interface TeacherStats {
  totalTests: number
  totalSales: number
  totalEarnings: number
  pendingWithdrawals: number
}

export interface AdminStats {
  totalRevenue: number
  totalUsers: number
  totalStudents: number
  totalTeachers: number
  totalTests: number
  totalPurchases: number
  pendingTests: number
  pendingWithdrawals: number
}
