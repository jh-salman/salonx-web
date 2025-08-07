# Vercel Deployment Guide for SalonX

## 🚀 **Quick Deployment Steps**

### **1. Get Supabase Credentials**

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Settings** → **API**
4. Copy these values:
   - **Project URL**: `https://your-project-id.supabase.co`
   - **anon public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### **2. Deploy to Vercel**

#### **Option A: Vercel Dashboard (Recommended)**

1. **Connect Repository**:
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click **"New Project"**
   - Import your GitHub repository: `jh-salman/salonx-web`

2. **Configure Project**:
   - **Framework Preset**: Vite
   - **Root Directory**: `./` (default)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

3. **Set Environment Variables**:
   - Click **"Environment Variables"**
   - Add these variables:

   ```
   Name: VITE_SUPABASE_URL
   Value: https://your-project-id.supabase.co
   Environment: Production, Preview, Development
   ```

   ```
   Name: VITE_SUPABASE_ANON_KEY
   Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   Environment: Production, Preview, Development
   ```

4. **Deploy**:
   - Click **"Deploy"**
   - Wait for build to complete

#### **Option B: Vercel CLI**

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy from project directory
vercel

# Set environment variables
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY

# Deploy to production
vercel --prod
```

### **3. Environment Variables Reference**

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_SUPABASE_URL` | Your Supabase project URL | `https://abc123.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon public key | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |

### **4. Local Development Setup**

Create a `.env.local` file in your project root:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### **5. Troubleshooting**

#### **Common Issues:**

1. **"Missing Supabase environment variables"**
   - Check if environment variables are set correctly in Vercel
   - Ensure variable names start with `VITE_`

2. **Build fails**
   - Check Vercel build logs
   - Ensure all dependencies are in `package.json`

3. **Authentication not working**
   - Verify Supabase URL and key are correct
   - Check Supabase project settings

#### **Vercel Dashboard Steps:**

1. **Project Settings** → **Environment Variables**
2. **Add Variable**:
   - Name: `VITE_SUPABASE_URL`
   - Value: Your Supabase URL
   - Environment: All (Production, Preview, Development)
3. **Add Variable**:
   - Name: `VITE_SUPABASE_ANON_KEY`
   - Value: Your Supabase anon key
   - Environment: All (Production, Preview, Development)
4. **Save** and **Redeploy**

### **6. Post-Deployment**

After successful deployment:

1. **Test Authentication**: Try signing up/signing in
2. **Test Features**: Create appointments, clients, services
3. **Check Real-time**: Verify real-time updates work
4. **Monitor Logs**: Check Vercel function logs for errors

### **7. Custom Domain (Optional)**

1. Go to **Settings** → **Domains**
2. Add your custom domain
3. Configure DNS settings as instructed

---

## 🔗 **Useful Links**

- [Vercel Documentation](https://vercel.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)

## 📞 **Support**

If you encounter issues:
1. Check Vercel build logs
2. Verify environment variables
3. Test locally with `.env.local`
4. Check Supabase project settings 