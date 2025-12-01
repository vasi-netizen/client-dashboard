# Complete Deployment Guide

This guide will help you deploy your Client Management Dashboard for **100% FREE**.

## Prerequisites
- GitHub account (free)
- Supabase account (free)
- Vercel account (free)

---

## Step 1: Set Up Supabase (5 minutes)

### 1.1 Create Supabase Project
1. Go to [https://supabase.com](https://supabase.com)
2. Click **"Start your project"**
3. Sign in with GitHub
4. Click **"New Project"**
5. Fill in:
   - **Name:** `client-dashboard`
   - **Database Password:** (click generate and save it somewhere safe)
   - **Region:** Choose closest to your location
   - **Pricing Plan:** Free (selected by default)
6. Click **"Create new project"**
7. Wait 2-3 minutes for setup to complete

### 1.2 Set Up Database
1. Once ready, click **"SQL Editor"** in the left sidebar
2. Click **"New Query"**
3. Open the file `supabase-setup.sql` from this project
4. Copy ALL the SQL code
5. Paste into Supabase SQL Editor
6. Click **"Run"** (or press Ctrl/Cmd + Enter)
7. You should see "Success. No rows returned"

### 1.3 Get API Credentials
1. Click the **Settings** icon (⚙️) in the left sidebar
2. Click **"API"** under Project Settings
3. Copy these two values (you'll need them later):
   - **Project URL** (Example: `https://abcdefgh.supabase.co`)
   - **anon public** key (long string under "Project API keys")

### 1.4 Configure Email (Optional but Recommended)
1. Go to **Authentication** → **Email Templates**
2. You can customize the reset password email here
3. For now, the default settings work fine

---

## Step 2: Upload Code to GitHub (3 minutes)

### Option A: Using GitHub Desktop (Easier)
1. Download [GitHub Desktop](https://desktop.github.com/)
2. Install and sign in
3. Click **File** → **Add Local Repository**
4. Select the `client-dashboard` folder
5. Click **"Create Repository"** if prompted
6. Enter repository name: `client-dashboard`
7. Click **"Publish repository"**
8. Uncheck **"Keep this code private"** (or keep it private, both work)
9. Click **"Publish Repository"**

### Option B: Using Git Command Line
```bash
cd client-dashboard
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/client-dashboard.git
git push -u origin main
```

---

## Step 3: Deploy to Vercel (3 minutes)

### 3.1 Connect GitHub to Vercel
1. Go to [https://vercel.com](https://vercel.com)
2. Click **"Sign Up"** (or **"Login"**)
3. Click **"Continue with GitHub"**
4. Authorize Vercel to access your GitHub

### 3.2 Import Project
1. Click **"Add New..."** → **"Project"**
2. Find `client-dashboard` in the list
3. Click **"Import"**

### 3.3 Configure Project
1. **Framework Preset:** Vite (should auto-detect)
2. **Root Directory:** `./` (leave as is)
3. **Build Command:** `npm run build` (auto-filled)
4. **Output Directory:** `dist` (auto-filled)

### 3.4 Add Environment Variables
Click **"Environment Variables"** and add these two:

**Variable 1:**
- **Name:** `VITE_SUPABASE_URL`
- **Value:** Your Supabase Project URL (from Step 1.3)

**Variable 2:**
- **Name:** `VITE_SUPABASE_ANON_KEY`
- **Value:** Your Supabase anon key (from Step 1.3)

### 3.5 Deploy
1. Click **"Deploy"**
2. Wait 2-3 minutes for build to complete
3. You'll see "🎉 Congratulations!" when done

---

## Step 4: Access Your Dashboard

1. Click **"Visit"** or go to `https://your-project-name.vercel.app`
2. You should see the login screen
3. Click **"Don't have an account? Sign up"**
4. Enter your email and create a password
5. Check your email for confirmation link
6. Click the confirmation link
7. Log in to your dashboard!

---

## Step 5: Using the Dashboard

### First Time Setup
1. **Add Your First Client:**
   - Click "Clients" in the sidebar
   - Click "Add Client"
   - Fill in client details
   - Click "Add Client"

2. **Set Up Daily Tasks:**
   - On the client card, click "Manage Tasks"
   - Add tasks like "Check analytics", "Post on social media", etc.
   - Click the + button to add each task

3. **Check Daily Tasks:**
   - Go to "Daily Tasks"
   - You'll see all your tasks for today
   - Click the circle to mark as complete
   - Completed tasks vanish from view

4. **Add Special Tasks:**
   - In "Daily Tasks" tab
   - Use the purple "Special Tasks" box at top
   - These are one-time tasks

5. **Track Payments:**
   - Go to "Payments" tab
   - Click "Add Payment"
   - Enter client, amount, due date
   - View monthly statistics

---

## Customization

### Change Colors
Edit `tailwind.config.js` - modify the `primary` colors:
```javascript
primary: {
  500: '#0ea5e9', // Change this hex code
  600: '#0284c7', // And this one
  // etc.
}
```

### Add Your Logo
Replace the "CM" text in `DashboardLayout.jsx` with:
```jsx
<img src="/your-logo.png" alt="Logo" className="w-10 h-10" />
```

### Custom Domain (Optional - $10/year)
1. Buy domain from Namecheap, Cloudflare, etc.
2. In Vercel, go to **Settings** → **Domains**
3. Add your domain
4. Update DNS records as shown
5. Wait for DNS propagation (few hours)

---

## Updating Your Dashboard

When you want to add features or fix bugs:

1. Make changes to your code locally
2. Push to GitHub:
   ```bash
   git add .
   git commit -m "Description of changes"
   git push
   ```
3. Vercel automatically rebuilds and deploys!

---

## Troubleshooting

### "Failed to fetch" error
- Check that environment variables are set correctly in Vercel
- Make sure Supabase project is not paused

### Can't log in
- Check email for confirmation link
- Make sure you're using the correct email/password

### Tasks not showing
- Make sure you've added task templates in Clients → Manage Tasks
- Refresh the page

### Database errors
- Go to Supabase → SQL Editor
- Run the setup SQL again

---

## Free Tier Limits

### Supabase Free Tier
- ✅ 500MB database storage (thousands of tasks/clients)
- ✅ 1GB file storage
- ✅ 2GB bandwidth/month
- ✅ 50,000 monthly active users
- ✅ Unlimited API requests

### Vercel Free Tier
- ✅ 100GB bandwidth/month
- ✅ Unlimited deployments
- ✅ Automatic HTTPS
- ✅ CDN included

**Both are MORE than enough for personal use!**

---

## Support & Issues

If you encounter any issues:
1. Check browser console (F12) for errors
2. Check Vercel deployment logs
3. Check Supabase logs (Database → Logs)
4. Make sure all environment variables are correct

---

## Next Steps

1. ✅ Set up your clients
2. ✅ Add daily tasks for each client
3. ✅ Start tracking payments
4. ✅ Use daily to stay organized!

**Enjoy your free, professional client management dashboard!** 🎉
