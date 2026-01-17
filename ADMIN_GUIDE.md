# 🔐 Administrator Guide - Role-Based Access Control

## Overview

The Faculty Publications Management System now includes a comprehensive Role-Based Access Control (RBAC) system with three distinct user roles and complete activity logging for audit and monitoring purposes.

---

## 🎭 User Roles

### 1. **User (Faculty)** - Default Role

**Description**: Regular faculty members who manage their own publications.

**Access Level**: Own data only

**Permissions**:
- ✅ View own publications
- ✅ Add new publications (manual entry)
- ✅ Edit own publications
- ✅ Delete own publications
- ✅ Upload Excel/CSV files (for own data)
- ✅ Use chatbot to query own publications

**Restrictions**:
- ❌ Cannot view other users' publications
- ❌ Cannot access admin features
- ❌ Cannot view activity logs
- ❌ Cannot manage user accounts

**How to Get This Role**: 
Any user who registers with an email that is NOT configured as an admin email automatically gets the "user" role.

---

### 2. **Admin Viewer** - Read-Only Admin

**Description**: Administrative staff with read-only access to all faculty data.

**Access Level**: All data (read-only)

**Permissions**:
- ✅ View all faculty profiles
- ✅ View all publications from all users
- ✅ Search across all faculty data
- ✅ Filter and sort all publications
- ✅ View system statistics

**Restrictions**:
- ❌ Cannot add publications
- ❌ Cannot edit any data
- ❌ Cannot delete any data
- ❌ Cannot upload files
- ❌ Cannot manage user accounts
- ❌ Cannot access activity logs

**How to Get This Role**: 
Add the email to the `ADMIN_VIEWER_EMAILS` environment variable in `.env` file (comma-separated list).

**Example**:
```env
ADMIN_VIEWER_EMAILS=viewer1@college.edu,viewer2@college.edu,staff@college.edu
```

---

### 3. **Super Admin** - Full System Access

**Description**: System administrator with complete control over the system.

**Access Level**: Full system access

**Permissions**:
- ✅ View all faculty profiles and publications
- ✅ Add publications for any user
- ✅ Edit any publication
- ✅ Delete any publication
- ✅ Upload Excel/CSV for any user
- ✅ **User Management**:
  - Create new users
  - Edit user information
  - Change user roles
  - Activate/deactivate users
  - Delete users
- ✅ **Activity Log Access**:
  - View all activity logs
  - Filter logs by user, role, date, action
  - Export logs to CSV
- ✅ View system statistics and analytics

**Restrictions**:
- ⚠️ Cannot delete own account
- ⚠️ Cannot deactivate own account

**How to Get This Role**: 
Set the email in the `SUPER_ADMIN_EMAIL` environment variable in `.env` file (single email only).

**Example**:
```env
SUPER_ADMIN_EMAIL=admin@college.edu
```

---

## ⚙️ Configuration Guide

### Environment Setup

1. Open the `.env` file in the `backend` folder
2. Configure admin emails:

```env
# Role-Based Access Control Configuration

# Super Admin (Full system access)
SUPER_ADMIN_EMAIL=admin@college.edu

# Admin Viewers (Read-only access - comma-separated)
ADMIN_VIEWER_EMAILS=viewer1@college.edu,viewer2@college.edu
```

3. Save the file and restart the server

### Role Assignment Rules

- **Email-Based Auto-Assignment**: Roles are automatically assigned based on email when users register or login
- **Super Admin**: Exact match with `SUPER_ADMIN_EMAIL`
- **Admin Viewer**: Included in `ADMIN_VIEWER_EMAILS` list
- **User (Faculty)**: All other emails (default role)

### Changing Roles

**Option 1: Through Environment Variables** (Recommended)
- Update `.env` file
- Restart server
- User's role updates on next login

**Option 2: Through Super Admin Dashboard**
- Login as Super Admin
- Go to User Management
- Click "Change Role" for any user
- Select new role from dropdown
- Role changes immediately

---

## 📊 Activity Logging

### What is Logged?

Every action in the system is automatically logged with the following information:

**Authentication Events**:
- Login (timestamp, IP, user agent)
- Logout (timestamp, session duration)

**Publication Events**:
- View (which publication was viewed)
- Add (full details of new publication)
- Edit (what fields were changed)
- Delete (which publication was deleted)
- Upload (file name, number of records)

**Administrative Events**:
- User created (who created, new user email)
- User updated (what was changed)
- Role changed (old role → new role)
- User deleted (who deleted whom)
- Activity logs viewed (who accessed logs)
- Activity logs exported (date range, record count)

### Log Entry Format

Each log entry contains:
```javascript
{
  timestamp: "2026-01-16T21:47:28+05:30",
  userEmail: "faculty@college.edu",
  userRole: "user",
  action: "add",
  entityType: "publication",
  entityId: "507f1f77bcf86cd799439011",
  entityDetails: {
    title: "Research Paper Title",
    created: true
  },
  ipAddress: "192.168.1.100",
  userAgent: "Mozilla/5.0...",
  metadata: {
    path: "/api/publications",
    method: "POST"
  }
}
```

### Accessing Activity Logs (Super Admin Only)

1. Login as Super Admin
2. Navigate to "Activity Logs" section
3. Use filters to find specific logs:
   - **User Filter**: Search by email
   - **Role Filter**: user | admin_viewer | super_admin
   - **Action Filter**: login | logout | view | add | edit | delete | upload
   - **Date Range**: Select start and end dates
4. View results in table format
5. Export to CSV if needed

---

## 👥 User Management (Super Admin Only)

### Viewing All Users

**Endpoint**: `/api/admin/users`

**Access**: Super Admin Dashboard → User Management

**Features**:
- View all registered users
- See user details (name, email, department, role, status)
- Filter by role or active status
- Search by name, email, or department
- View publication count per user

### Creating a New User

1. Go to User Management
2. Click "Add New User"
3. Fill in:
   - Name
   - Email
   - Password
   - Department
   - Role (optional - auto-assigned by email if not specified)
4. Click "Create User"

**API Endpoint**: `POST /api/admin/users`

### Editing User Information

1. Find user in User Management table
2. Click "Edit" button
3. Modify:
   - Name
   - Email
   - Department
   - Password (optional)
4. Click "Update User"

**API Endpoint**: `PUT /api/admin/users/:id`

### Changing User Roles

1. Find user in User Management table
2. Click "Change Role"
3. Select new role:
   - User (Faculty)
   - Admin Viewer
   - Super Admin
4. Confirm change

**API Endpoint**: `PUT /api/admin/users/:id/role`

**Note**: Role change is logged in activity logs.

### Activating/Deactivating Users

1. Find user in User Management table
2. Click "Deactivate" or "Activate"
3. Confirm action

**Effect**:
- Deactivated users cannot login
- Existing sessions are invalidated
- Data remains in system
- Can be reactivated anytime

**API Endpoint**: `PUT /api/admin/users/:id/status`

### Deleting Users

1. Find user in User Management table
2. Click "Delete User"
3. Confirm deletion (⚠️ This is permanent!)

**Effect**:
- User account is permanently deleted
- All user's publications are deleted
- Action is logged
- Cannot delete your own account

**API Endpoint**: `DELETE /api/admin/users/:id`

---

## 📈 System Statistics (Admin & Super Admin)

Access system-wide statistics:

**User Statistics**:
- Total users
- Active users
- Users by role breakdown

**Publication Statistics**:
- Total publications
- Publications by year
- Top publishing faculty

**Activity Statistics** (Super Admin only):
- Actions in last 24 hours
- Breakdown by action type
- Most active users

**API Endpoint**: `GET /api/admin/stats`

---

## 🔒 Security Features

### Access Control
- Every API endpoint checks user authentication
- Role-based middleware on all protected routes
- 403 Forbidden returned for unauthorized access
- Data isolation enforced at database query level

### Activity Monitoring
- All actions automatically logged
- Immutable log entries (cannot be edited)
- Timestamp and IP tracking
- User agent logging for security analysis

### Password Security
- Bcrypt hashing with 10 salt rounds
- Passwords never stored in plain text
- Passwords not returned in API responses

### Session Management
- JWT tokens with 7-day expiry
- Token required for all authenticated requests
- Last login time tracked
- Logout endpoints clear client tokens

---

## 📋 API Endpoints Reference

### Admin Routes

#### User Management
```
GET    /api/admin/users              # List all users
GET    /api/admin/users/:id          # Get user details
POST   /api/admin/users              # Create new user
PUT    /api/admin/users/:id          # Update user
PUT    /api/admin/users/:id/role     # Change user role
PUT    /api/admin/users/:id/status   # Activate/deactivate
DELETE /api/admin/users/:id          # Delete user
```

#### Activity Logs
```
GET    /api/admin/activity-logs        # Get activity logs
GET    /api/admin/activity-logs/export # Export logs as CSV
```

#### Statistics
```
GET    /api/admin/stats                 # System statistics
GET    /api/admin/publications          # All publications (all users)
```

### Authentication Routes
```
POST   /api/auth/register               # Register new user
POST   /api/auth/login                  # Login
POST   /api/auth/logout                 # Logout
GET    /api/auth/me                     # Get current user info
```

### Publication Routes
```
GET    /api/publications                # Get publications (role-based)
GET    /api/publications/:id            # Get single publication
POST   /api/publications                # Create publication
PUT    /api/publications/:id            # Update publication
DELETE /api/publications/:id            # Delete publication
POST   /api/publications/upload         # Upload Excel/CSV
```

---

## 🧪 Testing the RBAC System

### Test Scenario 1: User (Faculty) Access

1. Register with email: `faculty@college.edu`
2. Login → Role should be "User"
3. Add a publication → ✅ Should work
4. Try to access `/api/admin/users` → ❌ Should get 403 Forbidden
5. View publications → ✅ Should see only own publications

### Test Scenario 2: Admin Viewer Access

1. Add email to `ADMIN_VIEWER_EMAILS` in `.env`
2. Register with that email
3. Login → Role should be "Admin Viewer"
4. View publications → ✅ Should see ALL publications
5. Try to add publication → ❌ Should get "Read-only access" error
6. Try to delete publication → ❌ Should get "Read-only access" error
7. Try to access activity logs → ❌ Should get 403 Forbidden

### Test Scenario 3: Super Admin Access

1. Set `SUPER_ADMIN_EMAIL` in `.env`
2. Register with that email
3. Login → Role should be "Super Admin"
4. View all publications → ✅ Should work
5. Create/Edit/Delete any publication → ✅ Should work
6. Access User Management → ✅ Should work
7. View Activity Logs → ✅ Should work
8. Export logs → ✅ Should work

---

## ⚠️ Important Notes

### Role Changes
- Changing email in `.env` requires server restart
- Role changes through dashboard are immediate
- Users must re-login after role change for frontend updates

### Data Safety
- User deletion is PERMANENT
- Always backup database before bulk deletions
- Activity logs are kept even if user is deleted

### Performance
- Activity logging is asynchronous (doesn't slow down requests)
- Use date filters when viewing logs to improve performance
- Export large log datasets as CSV for analysis

### Best Practices
1. Use strong, unique passwords for admin accounts
2. Regularly review activity logs for anomalies
3. Keep admin emails confidential
4. Use institutional email addresses for role assignment
5. Document role changes in your institution's records

---

## 🆘 Troubleshooting

### Problem: User not getting admin role
**Solution**: 
- Check email matches exactly in `.env` (case-insensitive)
- Restart server after `.env` changes
- Check for typos or extra spaces in email

### Problem: Cannot access admin features
**Solution**:
- Verify user has correct role: `GET /api/auth/me`
- Check token is valid and not expired
- Ensure server has latest `.env` configuration

### Problem: Activity logs not appearing
**Solution**:
- Check database connection
- Verify MongoDB is running
- Check console for logging errors
- Ensure actions are being performed by authenticated users

### Problem: "Read-only access" error for admin viewer
**Solution**:
- This is expected behavior
- Admin viewers can only VIEW data
- Use Super Admin account for modifications

---

## 📞 Support

For technical issues or questions:
1. Check this guide first
2. Review activity logs for error details
3. Check server console for error messages
4. Verify database connectivity
5. Ensure all environment variables are set

---

**Last Updated**: January 2026  
**Version**: 1.0.0  
**System**: Faculty Publications Management with RBAC

---

**Security Note**: Keep this document confidential and accessible only to authorized administrators.
