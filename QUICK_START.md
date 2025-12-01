# Quick Start Guide

Get your dashboard running in **10 minutes**!

## 🚀 Super Quick Setup

### 1. Supabase Setup (3 min)
```
1. Go to supabase.com → Sign in with GitHub
2. New Project → Name it → Wait for setup
3. SQL Editor → Paste supabase-setup.sql → Run
4. Settings → API → Copy URL and anon key
```

### 2. GitHub Upload (2 min)
```
1. Create new repo on GitHub: client-dashboard
2. Upload all files (or use GitHub Desktop)
```

### 3. Vercel Deploy (3 min)
```
1. Go to vercel.com → Sign in with GitHub
2. Import client-dashboard repo
3. Add environment variables:
   VITE_SUPABASE_URL=your_url
   VITE_SUPABASE_ANON_KEY=your_key
4. Deploy!
```

### 4. Start Using (2 min)
```
1. Visit your-app.vercel.app
2. Sign up with email
3. Add first client
4. Add tasks for client
5. Done! 🎉
```

## 📁 What to Upload to GitHub

Upload these files:
```
✅ src/ (entire folder)
✅ public/ (if exists)
✅ index.html
✅ package.json
✅ vite.config.js
✅ tailwind.config.js
✅ postcss.config.js
✅ .gitignore
✅ README.md
❌ node_modules/ (DO NOT upload)
❌ .env (DO NOT upload - use Vercel environment variables)
```

## 🔑 Environment Variables

Add in Vercel Dashboard (NOT in .env file for deployment):

```
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...long_string_here
```

## 💡 Tips

- ✅ Use GitHub Desktop for easier uploads
- ✅ Keep Supabase password safe
- ✅ Don't share your anon key publicly
- ✅ Bookmark your Vercel URL
- ✅ Add to phone home screen for quick access

## 🎯 Daily Usage

**Every Morning:**
1. Open dashboard
2. See today's pending tasks
3. Complete tasks → they vanish
4. Add special tasks if needed

**Weekly:**
1. Add new clients
2. Update payment statuses
3. Check monthly stats

## 🛠 Local Development (Optional)

If you want to test locally before deploying:

```bash
# Install dependencies
npm install

# Create .env file
cp .env.example .env
# Edit .env and add your Supabase credentials

# Run locally
npm run dev
```

Open http://localhost:3000

## 📱 Mobile Access

Your dashboard works on mobile! Add to home screen:

**iPhone:**
1. Open in Safari
2. Tap Share button
3. "Add to Home Screen"

**Android:**
1. Open in Chrome
2. Tap menu (3 dots)
3. "Add to Home Screen"

## 🆘 Common Issues

**Issue:** Can't see environment variables
**Fix:** Add them in Vercel Dashboard, not in code

**Issue:** Database connection failed
**Fix:** Double-check Supabase URL and key

**Issue:** Changes not showing
**Fix:** Clear browser cache or hard refresh (Ctrl+F5)

## 📊 What You Get

✅ Client management
✅ Daily task tracking
✅ Payment tracking
✅ Monthly statistics
✅ Mobile-friendly
✅ Secure login
✅ Password reset
✅ 100% FREE hosting

---

**Need detailed instructions?** See `DEPLOYMENT.md`

**Questions?** Check `README.md`

**Let's go! 🚀**
