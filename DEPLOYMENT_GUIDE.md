# 🚀 Deployment Guide - Faculty Publications Management System

This guide will help you deploy your application so your team can access it from anywhere.

## 📋 Overview

We'll deploy:
- **Backend**: Render (free tier)
- **Frontend**: Vercel (free tier)
- **Database**: MongoDB Atlas (free tier)

**Total Cost**: $0 (Free!)

---

## 🗂️ Step 1: Prepare MongoDB Atlas (Cloud Database)

### 1.1 Create MongoDB Atlas Account
1. Go to [https://www.mongodb.com/cloud/atlas/register](https://www.mongodb.com/cloud/atlas/register)
2. Sign up for a free account
3. Create a new project (e.g., "Faculty Publications")

### 1.2 Create a Free Cluster
1. Click "Build a Database"
2. Choose **M0 (Free tier)**
3. Select a cloud provider and region (choose closest to your team)
4. Name your cluster (e.g., "faculty-pubs-cluster")
5. Click "Create"

### 1.3 Configure Database Access
1. Go to "Database Access" in left sidebar
2. Click "Add New Database User"
3. Choose "Password" authentication
4. Username: `facultyAdmin` (or your choice)
5. Password: Generate a strong password (SAVE THIS!)
6. Database User Privileges: "Read and write to any database"
7. Click "Add User"

### 1.4 Configure Network Access
1. Go to "Network Access" in left sidebar
2. Click "Add IP Address"
3. Click "Allow Access from Anywhere" (0.0.0.0/0)
4. Click "Confirm"

### 1.5 Get Connection String
1. Go to "Database" in left sidebar
2. Click "Connect" on your cluster
3. Choose "Connect your application"
4. Copy the connection string (looks like):
   ```
   mongodb+srv://facultyAdmin:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
5. Replace `<password>` with your actual password
6. Add database name at the end:
   ```
   mongodb+srv://facultyAdmin:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/faculty_publications?retryWrites=true&w=majority
   ```
7. **SAVE THIS CONNECTION STRING!** You'll need it later.

---

## 🖥️ Step 2: Deploy Backend to Render

### 2.1 Prepare Your Code
1. Make sure you have a GitHub account
2. Create a new repository on GitHub (e.g., "faculty-publications")
3. Push your code to GitHub:
   ```bash
   cd "c:\Users\shubh\OneDrive\Desktop\New folder"
   git init
   git add .
   git commit -m "Initial commit for deployment"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/faculty-publications.git
   git push -u origin main
   ```

### 2.2 Create Render Account
1. Go to [https://render.com](https://render.com)
2. Sign up with GitHub (easier integration)

### 2.3 Create Web Service
1. Click "New +" → "Web Service"
2. Connect your GitHub repository
3. Configure:
   - **Name**: `faculty-publications-api`
   - **Region**: Choose closest to your team
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: Free

### 2.4 Add Environment Variables
Click "Advanced" → "Add Environment Variable" and add these:

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `MONGODB_URI` | Your MongoDB Atlas connection string from Step 1.5 |
| `JWT_SECRET` | Generate a random string (e.g., use [https://randomkeygen.com/](https://randomkeygen.com/)) |
| `SUPER_ADMIN_EMAIL` | Your admin email (e.g., `admin@college.edu`) |
| `PORT` | `5000` |
| `MAX_FILE_SIZE` | `5242880` |

### 2.5 Deploy
1. Click "Create Web Service"
2. Wait 5-10 minutes for deployment
3. Once deployed, you'll get a URL like: `https://faculty-publications-api.onrender.com`
4. **SAVE THIS URL!** This is your backend URL.

### 2.6 Test Backend
Visit: `https://YOUR-BACKEND-URL.onrender.com/api/health`

You should see:
```json
{
  "status": "OK",
  "message": "Faculty Publications Management System API is running",
  "timestamp": "2026-01-17T...",
  "features": {...}
}
```

---

## 🌐 Step 3: Deploy Frontend to Vercel

### 3.1 Update Frontend Configuration
Before deploying, we need to update the frontend to use your deployed backend URL.

**You'll need to update these files** (I'll create a config file for you):
- `frontend/js/auth.js`
- `frontend/js/admin.js`
- `frontend/js/chatbot.js`
- `frontend/js/table.js`

### 3.2 Create Vercel Account
1. Go to [https://vercel.com/signup](https://vercel.com/signup)
2. Sign up with GitHub

### 3.3 Deploy Frontend
1. Click "Add New..." → "Project"
2. Import your GitHub repository
3. Configure:
   - **Framework Preset**: Other
   - **Root Directory**: `frontend`
   - **Build Command**: Leave empty
   - **Output Directory**: Leave empty
4. Click "Deploy"
5. Wait 2-3 minutes
6. You'll get a URL like: `https://faculty-publications.vercel.app`

---

## 🔧 Step 4: Update Frontend API URLs

After deployment, you need to update your frontend to point to the deployed backend.

### Option A: Using Environment Variable (Recommended)
I'll create a config file that automatically detects the environment.

### Option B: Manual Update
Replace all instances of `http://localhost:5000` with your Render backend URL in:
- `frontend/js/auth.js`
- `frontend/js/admin.js`
- `frontend/js/chatbot.js`
- `frontend/js/table.js`

---

## ✅ Step 5: Verify Deployment

### 5.1 Test Backend
Visit: `https://YOUR-BACKEND-URL.onrender.com/api/health`

### 5.2 Test Frontend
1. Visit your Vercel URL: `https://YOUR-FRONTEND-URL.vercel.app`
2. Try to register a new user
3. Try to login
4. Add a publication
5. Test all features

### 5.3 Share with Team
Send your team the Vercel URL. They can access it from anywhere!

---

## 🔒 Security Checklist

- [ ] Changed `JWT_SECRET` to a strong random string
- [ ] MongoDB user has a strong password
- [ ] Updated `SUPER_ADMIN_EMAIL` to your actual email
- [ ] Tested all features on deployed version
- [ ] Verified CORS is working properly

---

## 📝 Important Notes

### Free Tier Limitations

**Render (Backend):**
- Spins down after 15 minutes of inactivity
- First request after inactivity may take 30-60 seconds
- 750 hours/month free (enough for development)

**MongoDB Atlas:**
- 512 MB storage (plenty for your project)
- Shared cluster (may be slower than local)

**Vercel (Frontend):**
- Unlimited bandwidth
- Fast global CDN
- No sleep time

### Keeping Backend Awake
If you want to prevent the backend from sleeping, you can:
1. Use a service like [UptimeRobot](https://uptimerobot.com/) to ping your backend every 5 minutes
2. Upgrade to Render paid tier ($7/month)

---

## 🆘 Troubleshooting

### Backend won't start
- Check Render logs for errors
- Verify all environment variables are set correctly
- Make sure MongoDB connection string is correct

### Frontend can't connect to backend
- Check browser console for CORS errors
- Verify backend URL is correct in frontend code
- Make sure backend is running (visit `/api/health`)

### Database connection failed
- Verify MongoDB Atlas IP whitelist includes 0.0.0.0/0
- Check connection string format
- Verify database user credentials

---

## 🔄 Updating Your Deployment

### Update Backend
1. Push changes to GitHub
2. Render will auto-deploy (if auto-deploy is enabled)
3. Or manually click "Deploy latest commit" in Render dashboard

### Update Frontend
1. Push changes to GitHub
2. Vercel will auto-deploy
3. Changes live in ~2 minutes

---

## 💰 Cost Breakdown

| Service | Free Tier | Paid Tier (if needed) |
|---------|-----------|----------------------|
| MongoDB Atlas | 512 MB | $0.08/GB/month |
| Render | 750 hrs/month | $7/month (no sleep) |
| Vercel | Unlimited | $20/month (pro features) |

**For your project**: Free tier is sufficient!

---

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review Render/Vercel logs
3. Test backend health endpoint
4. Verify environment variables

---

## 🎉 Next Steps

After successful deployment:
1. Share the Vercel URL with your team
2. Create the first Super Admin account
3. Add team members via Admin Panel
4. Start using the system!

**Your deployed URLs:**
- Frontend: `https://YOUR-APP.vercel.app`
- Backend API: `https://YOUR-API.onrender.com`
- Database: MongoDB Atlas (cloud)

---

**Good luck with your deployment! 🚀**
