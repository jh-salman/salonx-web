# Environment Variables Setup

## 🔑 **Required Environment Variables**

### **For Vercel Deployment:**

1. **VITE_SUPABASE_URL**
   - Get from: Supabase Dashboard → Settings → API → Project URL
   - Format: `https://your-project-id.supabase.co`

2. **VITE_SUPABASE_ANON_KEY**
   - Get from: Supabase Dashboard → Settings → API → anon public
   - Format: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

## 🚀 **Quick Setup Steps**

### **Step 1: Get Supabase Credentials**
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Settings** → **API**
4. Copy **Project URL** and **anon public key**

### **Step 2: Set in Vercel**
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add both variables with **All environments** selected

### **Step 3: Deploy**
1. Push changes to GitHub
2. Vercel will auto-deploy
3. Check deployment logs for any errors

## 📝 **Example Values**

```env
VITE_SUPABASE_URL=https://abc123def456.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiYzEyM2RlZjQ1NiIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNjM5NzQ5NjAwLCJleHAiOjE5NTUzMjU2MDB9.example-key
```

## 🔧 **Local Development**

Create `.env.local` file in project root:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

## ⚠️ **Important Notes**

- ✅ Variable names **MUST** start with `VITE_`
- ✅ Set for **All environments** (Production, Preview, Development)
- ✅ Never commit `.env.local` to Git
- ✅ Use **anon public key**, not service role key 