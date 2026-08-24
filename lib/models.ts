import mongoose, { Schema, models, model, Document, Types } from 'mongoose'

// =============================================
// USER MODEL
// =============================================
export interface IUser extends Document {
  _id: Types.ObjectId
  supabaseId: string   // Supabase auth.uid() — bağlantı üçün saxlanılır
  email: string
  full_name: string
  role: 'admin' | 'teacher' | 'student'
  balance: number
  teacher_balance: number
  phone?: string
  created_at: Date
}

const UserSchema = new Schema<IUser>({
  supabaseId: { type: String, required: true, unique: true, index: true },
  email: { type: String, required: true, unique: true },
  full_name: { type: String, required: true },
  role: { type: String, enum: ['admin', 'teacher', 'student'], required: true, default: 'student' },
  balance: { type: Number, default: 0 },
  teacher_balance: { type: Number, default: 0 },
  phone: { type: String },
  created_at: { type: Date, default: Date.now },
})

export const User = models.User || model<IUser>('User', UserSchema)

// =============================================
// TEST MODEL
// =============================================
export interface ITest extends Document {
  _id: Types.ObjectId
  teacher_id: Types.ObjectId
  title: string
  category: 'MIQ' | 'Blok' | 'Buraxilis' | 'Dovlet_Quluqu' | 'Diger'
  subject: string
  language: 'AZ' | 'RU'
  price: number
  duration_minutes: number
  question_count: number
  is_approved: boolean
  is_active: boolean
  description?: string
  pdf_url?: string
  created_at: Date
  updated_at: Date
}

const TestSchema = new Schema<ITest>({
  teacher_id: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, required: true },
  category: { type: String, enum: ['MIQ', 'Blok', 'Buraxilis', 'Dovlet_Quluqu', 'Diger'], required: true },
  subject: { type: String, required: true },
  language: { type: String, enum: ['AZ', 'RU'], required: true, default: 'AZ' },
  price: { type: Number, default: 0 },
  duration_minutes: { type: Number, default: 90 },
  question_count: { type: Number, default: 0 },
  is_approved: { type: Boolean, default: false, index: true },
  is_active: { type: Boolean, default: true },
  description: { type: String },
  pdf_url: { type: String },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
})

TestSchema.pre('save', function (next) {
  this.updated_at = new Date()
  next()
})

export const Test = models.Test || model<ITest>('Test', TestSchema)

// =============================================
// QUESTION MODEL
// =============================================
export interface IQuestion extends Document {
  _id: Types.ObjectId
  test_id: Types.ObjectId
  order_number: number
  question_text?: string
  question_image_url?: string
  option_a: string
  option_b: string
  option_c: string
  option_d: string
  option_e: string
  correct_option: 'A' | 'B' | 'C' | 'D' | 'E'
  explanation_text?: string
  explanation_image_url?: string
  created_at: Date
}

const QuestionSchema = new Schema<IQuestion>({
  test_id: { type: Schema.Types.ObjectId, ref: 'Test', required: true, index: true },
  order_number: { type: Number, default: 1 },
  question_text: { type: String },
  question_image_url: { type: String },
  option_a: { type: String, required: true },
  option_b: { type: String, required: true },
  option_c: { type: String, required: true },
  option_d: { type: String, required: true },
  option_e: { type: String, required: true },
  correct_option: { type: String, enum: ['A', 'B', 'C', 'D', 'E'], required: true },
  explanation_text: { type: String },
  explanation_image_url: { type: String },
  created_at: { type: Date, default: Date.now },
})

export const Question = models.Question || model<IQuestion>('Question', QuestionSchema)

// =============================================
// PURCHASE MODEL
// =============================================
export interface IPurchase extends Document {
  _id: Types.ObjectId
  student_id: Types.ObjectId
  test_id: Types.ObjectId
  amount_paid: number
  platform_cut: number
  teacher_cut: number
  purchased_at: Date
}

const PurchaseSchema = new Schema<IPurchase>({
  student_id: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  test_id: { type: Schema.Types.ObjectId, ref: 'Test', required: true, index: true },
  amount_paid: { type: Number, required: true },
  platform_cut: { type: Number, required: true },
  teacher_cut: { type: Number, required: true },
  purchased_at: { type: Date, default: Date.now },
})

PurchaseSchema.index({ student_id: 1, test_id: 1 }, { unique: true })

export const Purchase = models.Purchase || model<IPurchase>('Purchase', PurchaseSchema)

// =============================================
// STUDENT RESULT MODEL
// =============================================
export interface IStudentResult extends Document {
  _id: Types.ObjectId
  student_id: Types.ObjectId
  test_id: Types.ObjectId
  started_at: Date
  completed_at?: Date
  correct_answers_count: number
  wrong_answers_count: number
  blank_answers_count: number
  score_percentage: number
  spent_time_seconds: number
  student_answers: Record<string, string>
  is_completed: boolean
}

const StudentResultSchema = new Schema<IStudentResult>({
  student_id: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  test_id: { type: Schema.Types.ObjectId, ref: 'Test', required: true, index: true },
  started_at: { type: Date, default: Date.now },
  completed_at: { type: Date },
  correct_answers_count: { type: Number, default: 0 },
  wrong_answers_count: { type: Number, default: 0 },
  blank_answers_count: { type: Number, default: 0 },
  score_percentage: { type: Number, default: 0 },
  spent_time_seconds: { type: Number, default: 0 },
  student_answers: { type: Schema.Types.Mixed, default: {} },
  is_completed: { type: Boolean, default: false },
})

StudentResultSchema.index({ student_id: 1, test_id: 1 }, { unique: true })

export const StudentResult = models.StudentResult || model<IStudentResult>('StudentResult', StudentResultSchema)

// =============================================
// WITHDRAWAL REQUEST MODEL
// =============================================
export interface IWithdrawal extends Document {
  _id: Types.ObjectId
  teacher_id: Types.ObjectId
  amount: number
  card_number: string
  card_holder_name: string
  status: 'pending' | 'completed' | 'rejected'
  admin_note?: string
  requested_at: Date
  processed_at?: Date
}

const WithdrawalSchema = new Schema<IWithdrawal>({
  teacher_id: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  amount: { type: Number, required: true },
  card_number: { type: String, required: true },
  card_holder_name: { type: String, required: true },
  status: { type: String, enum: ['pending', 'completed', 'rejected'], default: 'pending', index: true },
  admin_note: { type: String },
  requested_at: { type: Date, default: Date.now },
  processed_at: { type: Date },
})

export const Withdrawal = models.Withdrawal || model<IWithdrawal>('Withdrawal', WithdrawalSchema)

// =============================================
// WALLET TRANSACTION MODEL
// =============================================
export interface IWalletTx extends Document {
  _id: Types.ObjectId
  user_id: Types.ObjectId
  type: 'topup' | 'purchase' | 'earning' | 'withdrawal'
  amount: number
  description?: string
  reference_id?: Types.ObjectId
  created_at: Date
}

const WalletTxSchema = new Schema<IWalletTx>({
  user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: { type: String, enum: ['topup', 'purchase', 'earning', 'withdrawal'], required: true },
  amount: { type: Number, required: true },
  description: { type: String },
  reference_id: { type: Schema.Types.ObjectId },
  created_at: { type: Date, default: Date.now },
})

export const WalletTx = models.WalletTx || model<IWalletTx>('WalletTx', WalletTxSchema)

// =============================================
// PLATFORM SETTINGS MODEL
// =============================================
export interface IPlatformSettings extends Document {
  key: string
  value: string
  updated_at: Date
}

const PlatformSettingsSchema = new Schema<IPlatformSettings>({
  key: { type: String, required: true, unique: true },
  value: { type: String, required: true },
  updated_at: { type: Date, default: Date.now },
})

export const PlatformSettings = models.PlatformSettings || model<IPlatformSettings>('PlatformSettings', PlatformSettingsSchema)
