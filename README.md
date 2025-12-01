# Client Management Dashboard

A modern, colorful client management dashboard built with React, Supabase, and Tailwind CSS. Completely free to host using Vercel and Supabase.

## Features

### ✅ Daily Task Management
- Auto-generate daily tasks for each client
- Mark tasks as complete/pending
- Tasks vanish from home screen when completed
- Add/delete/manage tasks per client
- Special one-off tasks

### 👥 Client Management
- Add/edit/delete clients
- Store client website, contact info, status
- Manage daily task templates per client
- Client categorization (active, paused, churned)

### 💰 Payment Tracking
- Track monthly income per client
- Upcoming vs paid payments
- Monthly revenue statistics
- Payment method tracking
- Overdue payment alerts

### 🔐 Security
- Password-protected login
- Email-based password reset
- Supabase authentication
- Row-level security

## Tech Stack

- **Frontend:** React 18 + Vite
- **Styling:** Tailwind CSS
- **Backend:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth
- **Hosting:** Vercel (Free)
- **Icons:** Lucide React

## Setup Instructions

### 1. Create Supabase Project (FREE)

1. Go to [https://supabase.com](https://supabase.com)
2. Click "Start your project"
3. Sign in with GitHub
4. Click "New Project"
5. Fill in:
   - Project name: `client-dashboard`
   - Database password: (generate strong password)
   - Region: Choose closest to you
6. Click "Create new project"
7. Wait for database to finish setting up

### 2. Set Up Database Tables

Once your project is ready, go to **SQL Editor** in Supabase and run this SQL:

\`\`\`sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Clients table
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  website TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  contact_person TEXT,
  status TEXT DEFAULT 'active',
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
  status TEXT DEFAULT 'pending',
  payment_method TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE special_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Policies for clients
CREATE POLICY "Users can view own clients" ON clients FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own clients" ON clients FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own clients" ON clients FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own clients" ON clients FOR DELETE USING (auth.uid() = user_id);

-- Policies for task_templates
CREATE POLICY "Users can view own templates" ON task_templates FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own templates" ON task_templates FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own templates" ON task_templates FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own templates" ON task_templates FOR DELETE USING (auth.uid() = user_id);

-- Policies for task_completions
CREATE POLICY "Users can view own completions" ON task_completions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own completions" ON task_completions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own completions" ON task_completions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own completions" ON task_completions FOR DELETE USING (auth.uid() = user_id);

-- Policies for special_tasks
CREATE POLICY "Users can view own special tasks" ON special_tasks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own special tasks" ON special_tasks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own special tasks" ON special_tasks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own special tasks" ON special_tasks FOR DELETE USING (auth.uid() = user_id);

-- Policies for payments
CREATE POLICY "Users can view own payments" ON payments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own payments" ON payments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own payments" ON payments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own payments" ON payments FOR DELETE USING (auth.uid() = user_id);
\`\`\`

### 3. Get Supabase Credentials

1. In Supabase, go to **Project Settings** (gear icon)
2. Click **API** in the left sidebar
3. Copy these values:
   - **Project URL** (starts with https://...)
   - **anon public** key (long string)

### 4. Clone and Configure

1. Clone this repository or download ZIP
2. Open terminal in the project folder
3. Create `.env` file:

\`\`\`bash
cp .env.example .env
\`\`\`

4. Edit `.env` and paste your Supabase credentials:

\`\`\`
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
\`\`\`

### 5. Install Dependencies

\`\`\`bash
npm install
\`\`\`

### 6. Run Locally (Optional)

\`\`\`bash
npm run dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000)

### 7. Deploy to Vercel (FREE)

#### Option A: Using Vercel CLI

\`\`\`bash
npm install -g vercel
vercel login
vercel
\`\`\`

#### Option B: Using Vercel Dashboard

1. Push your code to GitHub
2. Go to [https://vercel.com](https://vercel.com)
3. Click "Import Project"
4. Select your GitHub repository
5. Add Environment Variables:
   - `VITE_SUPABASE_URL`: Your Supabase URL
   - `VITE_SUPABASE_ANON_KEY`: Your Supabase anon key
6. Click "Deploy"

Your dashboard will be live at: `https://your-project.vercel.app`

### 8. Configure Email (Optional)

For password reset emails to work:

1. Go to Supabase Dashboard → Authentication → Email Templates
2. Customize "Reset Password" template
3. Set up custom SMTP (or use Supabase default)

## Usage

1. **Sign Up:** Create your account
2. **Add Clients:** Go to Clients tab, add your first client
3. **Set Up Tasks:** For each client, click "Manage Tasks" and add daily tasks
4. **Daily Routine:** Check Daily Tasks tab each morning, mark tasks complete
5. **Track Payments:** Add payment records in Payments tab

## Project Structure

\`\`\`
client-dashboard/
├── src/
│   ├── components/
│   │   ├── Login.jsx          # Authentication UI
│   │   └── DashboardLayout.jsx # Main layout wrapper
│   ├── pages/
│   │   ├── DailyTasks.jsx     # Daily task management
│   │   ├── Clients.jsx        # Client management
│   │   └── Payments.jsx       # Payment tracking
│   ├── lib/
│   │   └── supabase.js        # Supabase client config
│   ├── hooks/
│   │   └── useAuth.js         # Authentication hook
│   ├── App.jsx                # Main app component
│   ├── main.jsx               # Entry point
│   └── index.css              # Tailwind styles
├── public/
├── index.html
├── package.json
├── vite.config.js
└── tailwind.config.js
\`\`\`

## Features in Detail

### Daily Tasks
- Tasks are templates that reset daily
- Mark complete → disappears from view
- Next day → all tasks reappear as pending
- History tracked in database

### Client Management
- Store all client information
- Custom task templates per client
- Easy add/edit/delete

### Payments
- Monthly view with statistics
- Filter by month
- Status tracking (pending/paid/overdue)
- Payment method recording

## Cost Breakdown

- **Hosting:** $0/month (Vercel free tier)
- **Database:** $0/month (Supabase free tier - 500MB)
- **Authentication:** $0/month (Supabase includes)
- **Domain:** $0 (use Vercel subdomain) or ~$10/year for custom domain

**Total: $0/month** ✅

## Support

For issues or questions:
1. Check Supabase logs for database errors
2. Check browser console for frontend errors
3. Ensure environment variables are set correctly

## License

MIT - Feel free to use and modify!
