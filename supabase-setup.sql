-- SUPABASE DATABASE SETUP
-- Run this entire script in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- TABLES
-- ==========================================

-- Clients table
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  website TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  contact_person TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'churned')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Task templates (daily recurring tasks)
CREATE TABLE task_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Task completions (tracks daily completion)
CREATE TABLE task_completions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_template_id UUID REFERENCES task_templates(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  completion_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(task_template_id, completion_date)
);

-- Special tasks (one-off tasks)
CREATE TABLE special_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payments table
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  due_date DATE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue')),
  payment_method TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- INDEXES for better performance
-- ==========================================

CREATE INDEX idx_clients_user_id ON clients(user_id);
CREATE INDEX idx_task_templates_client_id ON task_templates(client_id);
CREATE INDEX idx_task_templates_user_id ON task_templates(user_id);
CREATE INDEX idx_task_completions_date ON task_completions(completion_date);
CREATE INDEX idx_task_completions_user_id ON task_completions(user_id);
CREATE INDEX idx_special_tasks_user_id ON special_tasks(user_id);
CREATE INDEX idx_special_tasks_completed ON special_tasks(completed);
CREATE INDEX idx_payments_client_id ON payments(client_id);
CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_payments_due_date ON payments(due_date);
CREATE INDEX idx_payments_status ON payments(status);

-- ==========================================
-- ROW LEVEL SECURITY (RLS)
-- ==========================================

-- Enable RLS on all tables
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE special_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Policies for clients table
CREATE POLICY "Users can view own clients" 
  ON clients FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own clients" 
  ON clients FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own clients" 
  ON clients FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own clients" 
  ON clients FOR DELETE 
  USING (auth.uid() = user_id);

-- Policies for task_templates
CREATE POLICY "Users can view own templates" 
  ON task_templates FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own templates" 
  ON task_templates FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own templates" 
  ON task_templates FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own templates" 
  ON task_templates FOR DELETE 
  USING (auth.uid() = user_id);

-- Policies for task_completions
CREATE POLICY "Users can view own completions" 
  ON task_completions FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own completions" 
  ON task_completions FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own completions" 
  ON task_completions FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own completions" 
  ON task_completions FOR DELETE 
  USING (auth.uid() = user_id);

-- Policies for special_tasks
CREATE POLICY "Users can view own special tasks" 
  ON special_tasks FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own special tasks" 
  ON special_tasks FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own special tasks" 
  ON special_tasks FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own special tasks" 
  ON special_tasks FOR DELETE 
  USING (auth.uid() = user_id);

-- Policies for payments
CREATE POLICY "Users can view own payments" 
  ON payments FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own payments" 
  ON payments FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own payments" 
  ON payments FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own payments" 
  ON payments FOR DELETE 
  USING (auth.uid() = user_id);

-- ==========================================
-- OPTIONAL: Sample data for testing
-- ==========================================

-- Uncomment below to add sample data (replace YOUR_USER_ID with actual user ID after signup)

/*
-- Get your user ID by running: SELECT id FROM auth.users;

-- Insert sample client
INSERT INTO clients (user_id, name, website, email, status) 
VALUES ('YOUR_USER_ID', 'Sample Company', 'https://example.com', 'contact@example.com', 'active');

-- Get the client ID
-- SELECT id FROM clients WHERE name = 'Sample Company';

-- Insert sample tasks for the client
INSERT INTO task_templates (client_id, user_id, description) 
VALUES 
  ('CLIENT_ID_HERE', 'YOUR_USER_ID', 'Check website analytics'),
  ('CLIENT_ID_HERE', 'YOUR_USER_ID', 'Post on social media'),
  ('CLIENT_ID_HERE', 'YOUR_USER_ID', 'Respond to emails');

-- Insert sample payment
INSERT INTO payments (client_id, user_id, amount, due_date, status) 
VALUES ('CLIENT_ID_HERE', 'YOUR_USER_ID', 10000.00, '2024-12-15', 'pending');
*/
