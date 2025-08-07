# Vercel Deployment Troubleshooting Guide

## 🚨 **Common Deployment Errors & Solutions**

### **1. FUNCTION_INVOCATION_FAILED (500)**
**Cause**: Server-side function errors
**Solution**:
- Check environment variables are set correctly
- Ensure Supabase credentials are valid
- Check build logs for specific errors

### **2. DEPLOYMENT_BLOCKED (403)**
**Cause**: Repository access issues
**Solution**:
- Ensure Vercel has access to your GitHub repository
- Check repository permissions
- Reconnect GitHub account in Vercel

### **3. BUILD_FAILED**
**Cause**: Build process errors
**Solution**:
```bash
# Test build locally first
npm run build

# Check for missing dependencies
npm install

# Clear cache and rebuild
rm -rf node_modules package-lock.json
npm install
npm run build
```

### **4. ENVIRONMENT_VARIABLES_MISSING**
**Cause**: Missing required env vars
**Solution**:
1. Go to Vercel Dashboard → Project Settings → Environment Variables
2. Add these variables:
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```
3. Set for **All environments** (Production, Preview, Development)

## 🔧 **Quick Fix Steps**

### **Step 1: Verify Local Build**
```bash
# Test build locally
npm run build

# If successful, proceed to deployment
```

### **Step 2: Check Environment Variables**
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Verify both variables are set:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

### **Step 3: Redeploy**
1. Push changes to GitHub
2. Vercel will auto-deploy
3. Check deployment logs

## 📋 **Vercel Configuration**

### **vercel.json** (Already created)
```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ]
}
```

### **package.json** (Updated)
```json
{
  "scripts": {
    "build": "vite build",
    "vercel-build": "vite build"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
```

## 🛠️ **Manual Deployment Steps**

### **Option 1: Vercel Dashboard**
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"New Project"**
3. Import from GitHub: `jh-salman/salonx-web`
4. Configure:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Add environment variables
6. Deploy

### **Option 2: Vercel CLI**
```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# Set environment variables
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY

# Deploy to production
vercel --prod
```

## 🔍 **Debugging Steps**

### **1. Check Build Logs**
- Go to Vercel Dashboard → Deployments
- Click on failed deployment
- Check **Build Logs** for specific errors

### **2. Test Environment Variables**
```javascript
// Add this to your App.jsx temporarily
console.log('SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL)
console.log('SUPABASE_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY?.substring(0, 20) + '...')
```

### **3. Verify Supabase Connection**
```javascript
// Test in browser console
import { createClient } from '@supabase/supabase-js'
const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY)
console.log('Supabase client:', supabase)
```

## 📞 **Common Issues & Solutions**

### **Issue: "Missing Supabase environment variables"**
**Solution**:
- Check environment variables in Vercel
- Ensure variable names start with `VITE_`
- Redeploy after adding variables

### **Issue: "Build failed - Module not found"**
**Solution**:
- Check all dependencies are in `package.json`
- Run `npm install` locally
- Clear Vercel cache and redeploy

### **Issue: "Authentication not working"**
**Solution**:
- Verify Supabase URL and key are correct
- Check Supabase project settings
- Ensure RLS policies are configured

### **Issue: "404 Not Found"**
**Solution**:
- Check `vercel.json` routing configuration
- Ensure `index.html` is in `dist` folder
- Verify build output directory

## 🚀 **Success Checklist**

- ✅ Local build works (`npm run build`)
- ✅ Environment variables set in Vercel
- ✅ Supabase credentials are correct
- ✅ Repository is connected to Vercel
- ✅ Build command is `npm run build`
- ✅ Output directory is `dist`
- ✅ All dependencies are in `package.json`

## 📞 **Support**

If issues persist:
1. Check Vercel build logs
2. Test locally with `.env.local`
3. Verify Supabase project settings
4. Contact Vercel support if needed 