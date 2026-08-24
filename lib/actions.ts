'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server'

// =============================================
// AUTH ACTIONS
// =============================================

export async function loginAction(formData: FormData) {
  const supabase = await createClient()
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) return { error: error.message }

  // Get user role
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Auth failed' }

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role === 'admin') redirect('/admin')
  if (profile?.role === 'teacher') redirect('/teacher')
  redirect('/dashboard')
}

export async function registerAction(formData: FormData) {
  const supabase = await createClient()
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const fullName = formData.get('full_name') as string
  const phone = formData.get('phone') as string

  const { data, error } = await supabase.auth.signUp({ email, password })
  if (error) return { error: error.message }
  if (!data.user) return { error: 'Registration failed' }

  // Create user profile
  const { error: profileError } = await supabase
    .from('users')
    .insert({
      id: data.user.id,
      email,
      full_name: fullName,
      role: 'student',
      phone: phone || null,
    })

  if (profileError) return { error: profileError.message }

  redirect('/dashboard')
}

export async function logoutAction() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/auth/login')
}

// =============================================
// WALLET ACTIONS
// =============================================

export async function topupWalletAction(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const amount = parseFloat(formData.get('amount') as string)
  if (isNaN(amount) || amount <= 0) return { error: 'Invalid amount' }
  if (amount > 500) return { error: 'Maximum topup is 500 AZN' }

  // Update user balance
  const { error } = await supabase.rpc('topup_balance', {
    p_user_id: user.id,
    p_amount: amount,
  })

  if (error) {
    // Fallback: direct update
    const { data: currentUser } = await supabase
      .from('users')
      .select('balance')
      .eq('id', user.id)
      .single()

    await supabase
      .from('users')
      .update({ balance: (currentUser?.balance || 0) + amount })
      .eq('id', user.id)

    await supabase.from('wallet_transactions').insert({
      user_id: user.id,
      type: 'topup',
      amount,
      description: 'Mock balans artırma',
    })
  }

  revalidatePath('/wallet')
  revalidatePath('/dashboard')
  return { success: true }
}

// =============================================
// PURCHASE ACTIONS
// =============================================

export async function purchaseTestAction(testId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Get test
  const { data: test } = await supabase
    .from('tests')
    .select('*')
    .eq('id', testId)
    .single()
  if (!test) return { error: 'Test not found' }

  // Check already purchased
  const { data: existing } = await supabase
    .from('purchases')
    .select('id')
    .eq('student_id', user.id)
    .eq('test_id', testId)
    .single()
  if (existing) return { error: 'Already purchased' }

  // Free test
  if (test.price === 0) {
    await supabase.from('purchases').insert({
      student_id: user.id,
      test_id: testId,
      amount_paid: 0,
      platform_cut: 0,
      teacher_cut: 0,
    })
    revalidatePath('/dashboard')
    return { success: true }
  }

  // Get student balance
  const { data: profile } = await supabase
    .from('users')
    .select('balance')
    .eq('id', user.id)
    .single()

  if (!profile || profile.balance < test.price) {
    return { error: 'Insufficient balance' }
  }

  // Get commission rate
  const { data: settings } = await supabase
    .from('platform_settings')
    .select('value')
    .eq('key', 'commission_rate')
    .single()

  const commissionRate = parseFloat(settings?.value || '20')
  const platformCut = parseFloat((test.price * commissionRate / 100).toFixed(2))
  const teacherCut = parseFloat((test.price - platformCut).toFixed(2))

  // Deduct from student
  await supabase
    .from('users')
    .update({ balance: profile.balance - test.price })
    .eq('id', user.id)

  // Add to teacher
  const { data: teacher } = await supabase
    .from('users')
    .select('teacher_balance')
    .eq('id', test.teacher_id)
    .single()
  await supabase
    .from('users')
    .update({ teacher_balance: (teacher?.teacher_balance || 0) + teacherCut })
    .eq('id', test.teacher_id)

  // Record purchase
  await supabase.from('purchases').insert({
    student_id: user.id,
    test_id: testId,
    amount_paid: test.price,
    platform_cut: platformCut,
    teacher_cut: teacherCut,
  })

  // Record wallet transactions
  await supabase.from('wallet_transactions').insert([
    {
      user_id: user.id,
      type: 'purchase',
      amount: -test.price,
      description: `Test alındı: ${test.title}`,
    },
    {
      user_id: test.teacher_id,
      type: 'earning',
      amount: teacherCut,
      description: `Test satışı: ${test.title}`,
    },
  ])

  revalidatePath('/dashboard')
  revalidatePath('/wallet')
  return { success: true }
}

// =============================================
// EXAM ACTIONS
// =============================================

export async function submitExamAction(
  testId: string,
  answers: Record<string, string>,
  spentSeconds: number
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Get questions
  const { data: questions } = await supabase
    .from('questions')
    .select('id, correct_option')
    .eq('test_id', testId)

  if (!questions) return { error: 'Questions not found' }

  let correct = 0
  let wrong = 0
  let blank = 0

  questions.forEach(q => {
    const answer = answers[q.id]
    if (!answer) blank++
    else if (answer === q.correct_option) correct++
    else wrong++
  })

  const total = questions.length
  const scorePercentage = total > 0 ? parseFloat(((correct / total) * 100).toFixed(2)) : 0

  const { error } = await supabase
    .from('student_results')
    .upsert({
      student_id: user.id,
      test_id: testId,
      correct_answers_count: correct,
      wrong_answers_count: wrong,
      blank_answers_count: blank,
      score_percentage: scorePercentage,
      spent_time_seconds: spentSeconds,
      student_answers: answers,
      is_completed: true,
      completed_at: new Date().toISOString(),
    })

  if (error) return { error: error.message }

  revalidatePath(`/results/${testId}`)
  return { success: true, correct, wrong, blank, scorePercentage }
}

// =============================================
// TEACHER ACTIONS
// =============================================

export async function createTestAction(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: inserted, error } = await supabase
    .from('tests')
    .insert({
      teacher_id: user.id,
      title: formData.get('title') as string,
      category: formData.get('category') as string,
      subject: formData.get('subject') as string,
      language: formData.get('language') as string,
      price: parseFloat(formData.get('price') as string) || 0,
      duration_minutes: parseInt(formData.get('duration_minutes') as string) || 90,
      description: formData.get('description') as string || null,
      pdf_url: formData.get('pdf_url') as string || null,
    })
    .select('id')
    .single()

  if (error) return { error: error.message }

  revalidatePath('/teacher/tests')
  return { success: true, testId: inserted.id }
}

export async function addQuestionAction(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const testId = formData.get('test_id') as string

  // Verify teacher owns the test
  const { data: test } = await supabase
    .from('tests')
    .select('teacher_id')
    .eq('id', testId)
    .single()
  if (!test || test.teacher_id !== user.id) return { error: 'Unauthorized' }

  // Get current order number
  const { count } = await supabase
    .from('questions')
    .select('*', { count: 'exact', head: true })
    .eq('test_id', testId)

  const { error } = await supabase.from('questions').insert({
    test_id: testId,
    order_number: (count || 0) + 1,
    question_text: formData.get('question_text') as string || null,
    question_image_url: formData.get('question_image_url') as string || null,
    option_a: formData.get('option_a') as string,
    option_b: formData.get('option_b') as string,
    option_c: formData.get('option_c') as string,
    option_d: formData.get('option_d') as string,
    option_e: formData.get('option_e') as string,
    correct_option: formData.get('correct_option') as string,
    explanation_text: formData.get('explanation_text') as string || null,
    explanation_image_url: formData.get('explanation_image_url') as string || null,
  })

  if (error) return { error: error.message }

  revalidatePath(`/teacher/tests/${testId}/questions`)
  return { success: true }
}

export async function savePdfAnswerKeyAction(testId: string, correctOptions: string[]) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Verify teacher owns the test
  const { data: test } = await supabase
    .from('tests')
    .select('teacher_id')
    .eq('id', testId)
    .single()
  if (!test || test.teacher_id !== user.id) return { error: 'Unauthorized' }

  // Delete existing questions
  await supabase.from('questions').delete().eq('test_id', testId)

  // Re-insert all questions with placeholder text and correct options
  const rows = correctOptions.map((correct_option, idx) => ({
    test_id: testId,
    order_number: idx + 1,
    question_text: null,
    question_image_url: null,
    option_a: 'A',
    option_b: 'B',
    option_c: 'C',
    option_d: 'D',
    option_e: 'E',
    correct_option,
    explanation_text: null,
    explanation_image_url: null,
  }))

  const { error } = await supabase.from('questions').insert(rows)
  if (error) return { error: error.message }

  revalidatePath(`/teacher/tests/${testId}/questions`)
  return { success: true }
}

export async function submitTestForApprovalAction(testId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Verify teacher owns the test and has at least 1 question
  const { data: test } = await supabase
    .from('tests')
    .select('teacher_id, question_count')
    .eq('id', testId)
    .single()

  if (!test || test.teacher_id !== user.id) return { error: 'Unauthorized' }
  if ((test.question_count || 0) < 1) return { error: 'Add at least 1 question' }

  revalidatePath('/teacher/tests')
  revalidatePath('/admin/tests')
  return { success: true }
}


export async function createWithdrawalRequestAction(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const amount = parseFloat(formData.get('amount') as string)
  const { data: profile } = await supabase
    .from('users')
    .select('teacher_balance')
    .eq('id', user.id)
    .single()

  if (!profile || profile.teacher_balance < amount) {
    return { error: 'Insufficient balance' }
  }

  const { error } = await supabase.from('withdrawal_requests').insert({
    teacher_id: user.id,
    amount,
    card_number: formData.get('card_number') as string,
    card_holder_name: formData.get('card_holder_name') as string,
    status: 'pending',
  })

  if (error) return { error: error.message }

  revalidatePath('/teacher/withdraw')
  return { success: true }
}

// =============================================
// ADMIN ACTIONS
// =============================================

export async function createTeacherAction(formData: FormData) {
  const supabaseAdmin = await createAdminClient()

  const email = formData.get('email') as string
  const fullName = formData.get('full_name') as string
  const password = formData.get('password') as string

  // Create auth user
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (error) return { error: error.message }
  if (!data.user) return { error: 'User creation failed' }

  // Create profile
  const { error: profileError } = await supabaseAdmin
    .from('users')
    .insert({
      id: data.user.id,
      email,
      full_name: fullName,
      role: 'teacher',
    })

  if (profileError) return { error: profileError.message }

  revalidatePath('/admin/teachers')
  return { success: true }
}

export async function approveTestAction(testId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('tests')
    .update({ is_approved: true })
    .eq('id', testId)

  if (error) return { error: error.message }

  revalidatePath('/admin/tests')
  return { success: true }
}

export async function rejectTestAction(testId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('tests')
    .update({ is_approved: false, is_active: false })
    .eq('id', testId)

  if (error) return { error: error.message }

  revalidatePath('/admin/tests')
  return { success: true }
}

export async function updateCommissionAction(formData: FormData) {
  const supabase = await createClient()
  const rate = formData.get('commission_rate') as string

  const { error } = await supabase
    .from('platform_settings')
    .update({ value: rate })
    .eq('key', 'commission_rate')

  if (error) return { error: error.message }

  revalidatePath('/admin')
  return { success: true }
}

export async function processWithdrawalAction(
  withdrawalId: string,
  status: 'completed' | 'rejected',
  note?: string
) {
  const supabase = await createClient()

  const { data: withdrawal } = await supabase
    .from('withdrawal_requests')
    .select('teacher_id, amount, status')
    .eq('id', withdrawalId)
    .single()

  if (!withdrawal || withdrawal.status !== 'pending') {
    return { error: 'Invalid withdrawal request' }
  }

  const { error } = await supabase
    .from('withdrawal_requests')
    .update({ status, admin_note: note, processed_at: new Date().toISOString() })
    .eq('id', withdrawalId)

  if (error) return { error: error.message }

  // If completed → deduct from teacher balance
  if (status === 'completed') {
    const { data: teacher } = await supabase
      .from('users')
      .select('teacher_balance')
      .eq('id', withdrawal.teacher_id)
      .single()

    await supabase
      .from('users')
      .update({ teacher_balance: Math.max(0, (teacher?.teacher_balance || 0) - withdrawal.amount) })
      .eq('id', withdrawal.teacher_id)

    await supabase.from('wallet_transactions').insert({
      user_id: withdrawal.teacher_id,
      type: 'withdrawal',
      amount: -withdrawal.amount,
      description: 'Pul çıxarışı tamamlandı',
    })
  }

  revalidatePath('/admin/withdrawals')
  revalidatePath('/teacher/withdraw')
  return { success: true }
}
