# Login Pages Comparison

## 📍 Two Separate Login Pages

### 1. **Regular User Login** (Faculty Members)
**URL:** `http://localhost:5000/index.html` or `http://localhost:5000`

**Design:**
- 📚 Light, academic theme with teal/blue gradients
- Clean and friendly interface
- "Faculty Publications" branding
- Registration option available
- Link to admin login at bottom

**Features:**
- User registration (all new users get "user" role)
- Standard login
- Redirects to: `dashboard.html`

**Who uses this:**
- Faculty members
- Researchers
- Regular users

---

### 2. **Admin Login** (System Administrators)
**URL:** `http://localhost:5000/admin-login.html`

**Design:**
- 🔐 Dark, professional theme with purple gradients
- Security-focused interface
- "ADMIN ACCESS" badge
- Moving grid background animation
- Security notice warning
- Admin features list
- No registration option

**Features:**
- Admin-only login
- Role verification (must be admin_viewer or super_admin)
- Security warnings
- Redirects to: `admin.html`

**Who uses this:**
- Super Admins
- Admin Viewers
- System Administrators

---

## 🎨 Visual Differences

| Feature | User Login | Admin Login |
|---------|------------|-------------|
| **Background** | Light gradient (teal/blue) | Dark gradient (navy/purple) |
| **Card Style** | Clean white card | Frosted glass with glow |
| **Icon** | 📚 Books | 🔐 Lock |
| **Badge** | None | "ADMIN ACCESS" badge |
| **Animation** | Subtle | Moving grid background |
| **Color Scheme** | Academic blue/teal | Professional purple/navy |
| **Registration** | Available | Not available |
| **Security Notice** | None | Yellow warning box |
| **Bottom Link** | Admin login link | Back to faculty login |

---

## 🔐 Security Features

### Admin Login Page:
✅ Role verification after login (rejects non-admin users)  
✅ Security notice displayed  
✅ All login attempts logged  
✅ Auto-redirect if already logged in as admin  
✅ Different URL for separation  

---

## 📝 Usage Instructions

### For Regular Users:
1. Go to `http://localhost:5000`
2. Login or register
3. Access personal dashboard

### For Administrators:
1. Go to `http://localhost:5000/admin-login.html`
2. Login with admin credentials
3. Access admin panel with user management

### Cross-Navigation:
- From user login → Click "Admin Login" link at bottom
- From admin login → Click "Back to Faculty Login" link at bottom

---

## 🚀 Testing Both Pages

**Regular User Login:**
- Any email that's NOT `admin@college.edu`
- Creates account with "user" role
- Goes to dashboard

**Admin Login:**
- Email: `admin@college.edu` (or any user promoted to admin)
- Must have admin_viewer or super_admin role
- Goes to admin panel
- Non-admin users are rejected with error message
