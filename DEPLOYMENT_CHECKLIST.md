# 📋 Deployment Checklist

Use this checklist to ensure you complete all deployment steps correctly.

## ✅ Pre-Deployment

- [ ] Read `DEPLOYMENT_GUIDE.md` completely
- [ ] Have a GitHub account
- [ ] Code is working locally
- [ ] All features tested locally

---

## ✅ MongoDB Atlas Setup

- [ ] Created MongoDB Atlas account
- [ ] Created free M0 cluster
- [ ] Created database user with strong password
- [ ] Saved database username and password
- [ ] Configured network access (0.0.0.0/0)
- [ ] Copied and saved connection string
- [ ] Replaced `<password>` in connection string
- [ ] Added database name to connection string
- [ ] Tested connection (optional)

**MongoDB Connection String:**
```
mongodb+srv://USERNAME:PASSWORD@cluster.xxxxx.mongodb.net/faculty_publications?retryWrites=true&w=majority
```

---

## ✅ GitHub Setup

- [ ] Created GitHub repository
- [ ] Initialized git in project folder
- [ ] Added all files to git
- [ ] Committed changes
- [ ] Pushed to GitHub main branch

**Commands:**
```bash
git init
git add .
git commit -m "Initial commit for deployment"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/REPO_NAME.git
git push -u origin main
```

---

## ✅ Backend Deployment (Render)

- [ ] Created Render account
- [ ] Connected GitHub repository
- [ ] Created new Web Service
- [ ] Configured service settings:
  - [ ] Name: `faculty-publications-api`
  - [ ] Root Directory: `backend`
  - [ ] Build Command: `npm install`
  - [ ] Start Command: `npm start`
  - [ ] Instance Type: Free
- [ ] Added environment variables:
  - [ ] `NODE_ENV` = `production`
  - [ ] `MONGODB_URI` = (your MongoDB Atlas connection string)
  - [ ] `JWT_SECRET` = (strong random string)
  - [ ] `SUPER_ADMIN_EMAIL` = (your admin email)
  - [ ] `PORT` = `5000`
  - [ ] `MAX_FILE_SIZE` = `5242880`
- [ ] Deployed successfully
- [ ] Saved backend URL
- [ ] Tested `/api/health` endpoint

**Backend URL:** `https://_____________________.onrender.com`

---

## ✅ Frontend Configuration

- [ ] Created `frontend/js/config.js` file
- [ ] Updated `production` URL in config.js with Render backend URL
- [ ] Added `<script src="js/config.js"></script>` to all HTML files
- [ ] Updated all JS files to use `API_BASE_URL` instead of hardcoded URLs
- [ ] Committed and pushed changes to GitHub

---

## ✅ Frontend Deployment (Vercel)

- [ ] Created Vercel account
- [ ] Connected GitHub repository
- [ ] Created new project
- [ ] Configured project settings:
  - [ ] Root Directory: `frontend`
  - [ ] Framework: Other
- [ ] Deployed successfully
- [ ] Saved frontend URL
- [ ] Tested frontend loads correctly

**Frontend URL:** `https://_____________________.vercel.app`

---

## ✅ Post-Deployment Testing

- [ ] Backend health check works
- [ ] Frontend loads without errors
- [ ] Can register new user
- [ ] Can login successfully
- [ ] Can add publication manually
- [ ] Can upload CSV file
- [ ] Can edit publication
- [ ] Can delete publication
- [ ] Can view dashboard
- [ ] Chatbot works
- [ ] Super Admin can access admin panel
- [ ] Activity logs are recorded

---

## ✅ Security Verification

- [ ] Changed `JWT_SECRET` from default
- [ ] MongoDB user has strong password
- [ ] Updated `SUPER_ADMIN_EMAIL` to real email
- [ ] No sensitive data in GitHub repository
- [ ] `.env` file is in `.gitignore`
- [ ] CORS is working properly

---

## ✅ Team Access

- [ ] Shared frontend URL with team
- [ ] Created Super Admin account
- [ ] Tested access from different network
- [ ] Verified team members can register
- [ ] Documented login credentials for team

---

## ✅ Documentation

- [ ] Updated README.md with deployment URLs
- [ ] Documented environment variables
- [ ] Created user guide for team
- [ ] Noted any known issues

---

## 📝 Deployment Information

Fill this out after successful deployment:

| Item | Value |
|------|-------|
| **Frontend URL** | https://_________________________ |
| **Backend URL** | https://_________________________ |
| **Database** | MongoDB Atlas |
| **Deployment Date** | _________________________ |
| **Super Admin Email** | _________________________ |
| **GitHub Repository** | https://github.com/_____________ |

---

## 🔄 Future Updates

To update your deployed application:

1. Make changes locally
2. Test thoroughly
3. Commit and push to GitHub:
   ```bash
   git add .
   git commit -m "Description of changes"
   git push
   ```
4. Render and Vercel will auto-deploy (if enabled)
5. Verify changes on deployed URLs

---

## 🆘 If Something Goes Wrong

1. Check Render logs (Backend issues)
2. Check Vercel logs (Frontend issues)
3. Check browser console (Frontend errors)
4. Verify environment variables
5. Test `/api/health` endpoint
6. Review `DEPLOYMENT_GUIDE.md` troubleshooting section

---

**Status:** 
- [ ] Deployment In Progress
- [ ] Deployment Complete
- [ ] Team Notified
- [ ] All Features Verified

**Notes:**
_____________________________________
_____________________________________
_____________________________________
