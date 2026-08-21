-- ============================================
-- AzTest Platform - Initial Database Schema
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- PLATFORM SETTINGS
-- ============================================
CREATE TABLE platform_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Default commission: 20%
INSERT INTO platform_settings (key, value) VALUES ('commission_rate', '20');

-- ============================================
-- USERS
-- ============================================
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'teacher', 'student')),
  balance DECIMAL(10,2) DEFAULT 0.00,
  teacher_balance DECIMAL(10,2) DEFAULT 0.00,  -- Müəllim qazancı
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TESTS
-- ============================================
CREATE TABLE tests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  teacher_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('MIQ', 'Blok', 'Buraxilis', 'Dovlet_Quluqu', 'Diger')),
  subject TEXT NOT NULL,
  language TEXT NOT NULL CHECK (language IN ('AZ', 'RU')) DEFAULT 'AZ',
  price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  duration_minutes INTEGER NOT NULL DEFAULT 90,
  question_count INTEGER DEFAULT 0,
  is_approved BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- QUESTIONS
-- ============================================
CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  test_id UUID NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
  order_number INTEGER NOT NULL DEFAULT 1,
  question_text TEXT,
  question_image_url TEXT,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  option_c TEXT NOT NULL,
  option_d TEXT NOT NULL,
  option_e TEXT NOT NULL,
  correct_option TEXT NOT NULL CHECK (correct_option IN ('A', 'B', 'C', 'D', 'E')),
  explanation_text TEXT,
  explanation_image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PURCHASES
-- ============================================
CREATE TABLE purchases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  test_id UUID NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
  amount_paid DECIMAL(10,2) NOT NULL,
  platform_cut DECIMAL(10,2) NOT NULL,
  teacher_cut DECIMAL(10,2) NOT NULL,
  purchased_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, test_id)
);

-- ============================================
-- STUDENT RESULTS
-- ============================================
CREATE TABLE student_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  test_id UUID NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  correct_answers_count INTEGER DEFAULT 0,
  wrong_answers_count INTEGER DEFAULT 0,
  blank_answers_count INTEGER DEFAULT 0,
  score_percentage DECIMAL(5,2) DEFAULT 0.00,
  spent_time_seconds INTEGER DEFAULT 0,
  student_answers JSONB DEFAULT '{}',  -- {"question_id": "A", ...}
  is_completed BOOLEAN DEFAULT FALSE,
  UNIQUE(student_id, test_id)
);

-- ============================================
-- WITHDRAWAL REQUESTS (Müəllim pul çıxarışı)
-- ============================================
CREATE TABLE withdrawal_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  teacher_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  card_number TEXT NOT NULL,
  card_holder_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'rejected')),
  admin_note TEXT,
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

-- ============================================
-- WALLET TRANSACTIONS (Balans tarixçəsi)
-- ============================================
CREATE TABLE wallet_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('topup', 'purchase', 'earning', 'withdrawal')),
  amount DECIMAL(10,2) NOT NULL,
  description TEXT,
  reference_id UUID,  -- purchase_id or withdrawal_id
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_tests_teacher_id ON tests(teacher_id);
CREATE INDEX idx_tests_category ON tests(category);
CREATE INDEX idx_tests_subject ON tests(subject);
CREATE INDEX idx_tests_language ON tests(language);
CREATE INDEX idx_tests_is_approved ON tests(is_approved);
CREATE INDEX idx_questions_test_id ON questions(test_id);
CREATE INDEX idx_purchases_student_id ON purchases(student_id);
CREATE INDEX idx_purchases_test_id ON purchases(test_id);
CREATE INDEX idx_student_results_student_id ON student_results(student_id);
CREATE INDEX idx_student_results_test_id ON student_results(test_id);
CREATE INDEX idx_wallet_transactions_user_id ON wallet_transactions(user_id);
CREATE INDEX idx_withdrawal_requests_teacher_id ON withdrawal_requests(teacher_id);
CREATE INDEX idx_withdrawal_requests_status ON withdrawal_requests(status);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Update question_count on questions insert/delete
CREATE OR REPLACE FUNCTION update_test_question_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE tests SET question_count = question_count + 1 WHERE id = NEW.test_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE tests SET question_count = question_count - 1 WHERE id = OLD.test_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_question_count
AFTER INSERT OR DELETE ON questions
FOR EACH ROW EXECUTE FUNCTION update_test_question_count();

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_tests_updated_at
BEFORE UPDATE ON tests
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawal_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- USERS policies
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (id = auth.uid() OR get_user_role() = 'admin');

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Admin can insert users" ON users
  FOR INSERT WITH CHECK (get_user_role() = 'admin' OR auth.uid() IS NOT NULL);

-- TESTS policies
CREATE POLICY "Anyone can view approved tests" ON tests
  FOR SELECT USING (is_approved = TRUE AND is_active = TRUE OR teacher_id = auth.uid() OR get_user_role() = 'admin');

CREATE POLICY "Teachers can insert own tests" ON tests
  FOR INSERT WITH CHECK (teacher_id = auth.uid() AND get_user_role() = 'teacher');

CREATE POLICY "Teachers can update own tests" ON tests
  FOR UPDATE USING (teacher_id = auth.uid() OR get_user_role() = 'admin');

CREATE POLICY "Admin can approve tests" ON tests
  FOR UPDATE USING (get_user_role() = 'admin');

-- QUESTIONS policies
CREATE POLICY "Students can view questions of purchased tests" ON questions
  FOR SELECT USING (
    get_user_role() = 'admin'
    OR EXISTS (SELECT 1 FROM tests WHERE tests.id = questions.test_id AND tests.teacher_id = auth.uid())
    OR EXISTS (SELECT 1 FROM purchases WHERE purchases.test_id = questions.test_id AND purchases.student_id = auth.uid())
  );

CREATE POLICY "Teachers can manage own test questions" ON questions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM tests WHERE tests.id = questions.test_id AND tests.teacher_id = auth.uid())
    OR get_user_role() = 'admin'
  );

-- PURCHASES policies
CREATE POLICY "Students can view own purchases" ON purchases
  FOR SELECT USING (student_id = auth.uid() OR get_user_role() IN ('admin', 'teacher'));

CREATE POLICY "Students can insert purchases" ON purchases
  FOR INSERT WITH CHECK (student_id = auth.uid());

-- STUDENT RESULTS policies
CREATE POLICY "Students can manage own results" ON student_results
  FOR ALL USING (student_id = auth.uid() OR get_user_role() IN ('admin', 'teacher'));

-- WITHDRAWAL REQUESTS policies
CREATE POLICY "Teachers can manage own withdrawals" ON withdrawal_requests
  FOR ALL USING (teacher_id = auth.uid() OR get_user_role() = 'admin');

-- WALLET TRANSACTIONS policies
CREATE POLICY "Users can view own transactions" ON wallet_transactions
  FOR SELECT USING (user_id = auth.uid() OR get_user_role() = 'admin');

CREATE POLICY "System can insert transactions" ON wallet_transactions
  FOR INSERT WITH CHECK (user_id = auth.uid() OR get_user_role() = 'admin');

-- PLATFORM SETTINGS policies
CREATE POLICY "Anyone can view settings" ON platform_settings
  FOR SELECT USING (TRUE);

CREATE POLICY "Only admin can modify settings" ON platform_settings
  FOR ALL USING (get_user_role() = 'admin');
