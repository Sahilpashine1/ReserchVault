# 🔐 Role-Based Access Control & Activity Logging Implementation Plan

## Overview
This document outlines the implementation of a comprehensive role-based access control (RBAC) system with activity/audit logging for the Faculty Publications Management System.

## Roles Specification

### 1. **User (Faculty)** - Default Role
- **Access**: Own publications only
- **Permissions**:
  - ✅ View own publications
  - ✅ Add new publications
  - ✅ Edit own publications
  - ✅ Delete own publications
  - ✅ Upload Excel/CSV for own data
  - ✅ Query chatbot for own data
- **Restrictions**:
  - ❌ Cannot view other users' data
  - ❌ Cannot access admin features
  - ❌ Cannot view activity logs

### 2. **Admin Viewer** - Read-Only Admin
- **Access**: All faculty data (read-only)
- **Permissions**:
  - ✅ View all faculty profiles
  - ✅ View all publications (all users)
  - ✅ Search across all faculty data
  - ✅ Filter and sort all data
- **Restrictions**:
  - ❌ Cannot add publications
  - ❌ Cannot edit any data
  - ❌ Cannot delete any data
  - ❌ Cannot upload files
  - ❌ Cannot access activity logs
  - ❌ Cannot manage users

### 3. **Super Admin** - Full System Access
- **Access**: Complete system control
- **Permissions**:
  - ✅ View all faculty profiles and publications
  - ✅ Add publications for any user
  - ✅ Edit any publication
  - ✅ Delete any publication
  - ✅ Upload Excel/CSV for any user
  - ✅ Manage user accounts (create, update, delete, change roles)
  - ✅ Access activity/audit logs
  - ✅ Filter logs by user, role, date, action type
  - ✅ Export logs
- **Special Features**:
  - User management dashboard
  - Activity log viewer
  - System analytics

## Implementation Components

### Backend Changes

#### 1. **Models**

##### Updated User Model
```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  department: String,
  role: String (enum: ['user', 'admin_viewer', 'super_admin']),
  isActive: Boolean,
  createdAt: Date,
  lastLogin: Date
}
```

##### New ActivityLog Model
```javascript
{
  userId: ObjectId,
  userEmail: String,
  userRole: String,
  action: String (enum: ['login', 'logout', 'view', 'add', 'edit', 'delete', 'upload']),
  entityType: String (enum: ['publication', 'user', 'system']),
  entityId: ObjectId,
  entityDetails: Object,
  timestamp: Date,
  ipAddress: String,
  metadata: Object
}
```

#### 2. **Middleware**

##### Authorization Middleware (role-checking)
- `requireRole(['super_admin'])` - Super admin only
- `requireRole(['super_admin', 'admin_viewer'])` - Any admin
- `requireRole(['user'])` - Regular users

##### Activity Logging Middleware
- Auto-log all actions
- Capture request details
- Store in ActivityLog collection

#### 3. **Routes**

##### New Admin Routes (`/api/admin`)
- `GET /users` - List all users (Super Admin only)
- `GET /users/:id` - Get user details
- `POST /users` - Create user (Super Admin only)
- `PUT /users/:id` - Update user
- `PUT /users/:id/role` - Change user role (Super Admin only)
- `DELETE /users/:id` - Delete user (Super Admin only)
- `GET /activity-logs` - Get activity logs (Super Admin only)
- `GET /activity-logs/export` - Export logs (Super Admin only)
- `GET /stats` - System statistics

##### Updated Publication Routes
- Add role-based filtering
- Add activity logging to all actions
- Super admin can query all publications
- Admin viewer can view all (read-only)
- Users can only access own publications

##### Updated Auth Routes
- Add login time tracking
- Add logout endpoint
- Create activity log on login/logout

#### 4. **Configuration**

##### Environment Variables (.env)
```
SUPER_ADMIN_EMAIL=admin@college.edu
ADMIN_VIEWER_EMAILS=viewer1@college.edu,viewer2@college.edu
```

##### Role Assignment Logic
- Check email on registration/login
- Auto-assign roles based on email match
- Default role: 'user' (faculty)

### Frontend Changes

#### 1. **Role-Based UI**

##### Dashboard Navigation
- **User**: Standard publication table + chatbot
- **Admin Viewer**: All faculty view (read-only) + search
- **Super Admin**: Full admin panel + user management + logs

##### New Pages/Components

###### Admin Dashboard (`admin-dashboard.html`)
- User management table
- Activity log viewer
- System statistics cards
- Role assignment interface

###### User Management Component
- List all users with filters
- Add/edit user modal
- Role assignment dropdown
- Activate/deactivate users

###### Activity Log Viewer
- Filterable table
- Date range picker
- User filter
- Action type filter
- Export button

#### 2. **UI Access Control**

##### Show/Hide Based on Role
```javascript
// Frontend role checking
if (userRole === 'super_admin') {
  showAdminPanel();
  showUserManagement();
  showActivityLogs();
} else if (userRole === 'admin_viewer') {
  showAllFacultyView();
  hideEditButtons();
} else {
  showOwnDataOnly();
}
```

#### 3. **Updated Components**

##### Login Page
- Display role after login
- Redirect based on role

##### Publication Table
- Show all faculty (admin roles)
- Show own only (user role)
- Disable actions (admin viewer)

##### Header/Navigation
- Role badge
- Conditional menu items

## Activity Logging Specifications

### Logged Events

#### Authentication Events
- **Login**: User email, timestamp, IP
- **Logout**: User email, duration

#### Publication Events
- **View**: Publication title, owner
- **Add**: Full publication details
- **Edit**: Changed fields (before/after)
- **Delete**: Deleted publication details
- **Upload**: File name, record count

#### Admin Events
- **User Created**: New user email
- **User Updated**: Changed fields
- **Role Changed**: Old role → New role
- **User Deleted**: Deleted user email

### Log Entry Format
```javascript
{
  timestamp: "2026-01-16T21:47:28+05:30",
  user: "faculty@college.edu",
  role: "super_admin",
  action: "edit",
  entity: "publication",
  entityId: "507f1f77bcf86cd799439011",
  details: {
    publicationTitle: "AI Research Paper",
    fieldsChanged: ["title", "keywords"]
  },
  ipAddress: "192.168.1.1"
}
```

### Log Filtering & Search

#### Filter Options
- **By User**: Email search/select
- **By Role**: user | admin_viewer | super_admin
- **By Action**: login | logout | view | add | edit | delete | upload
- **By Date Range**: Start date - End date
- **By Entity Type**: publication | user | system

#### Export Options
- CSV format
- JSON format
- Date range selection

## Security Considerations

### 1. Authorization Checks
- Verify role on every protected route
- Use middleware for consistent checks
- Return 403 Forbidden for unauthorized access

### 2. Data Isolation
- Users can only query own data
- Admins have explicit role checks
- Database queries filtered by userId (for users)

### 3. Activity Log Protection
- Only Super Admin can access
- Logs are immutable (no editing)
- Store for audit compliance

### 4. Role Assignment Security
- Only Super Admin can change roles
- Email-based auto-assignment on first login
- Configuration via environment variables

## Implementation Phases

### Phase 1: Backend Foundation ✅
1. Update User model with role field
2. Create ActivityLog model
3. Create authorization middleware
4. Create activity logging middleware

### Phase 2: Admin Routes ✅
5. Create admin routes for user management
6. Create admin routes for activity logs
7. Update publication routes with role checks
8. Add activity logging to all routes

### Phase 3: Auth Enhancement ✅
9. Update registration with role assignment
10. Update login with last login tracking
11. Create logout endpoint
12. Add login/logout activity logging

### Phase 4: Frontend - Admin UI ✅
13. Create admin dashboard page
14. Create user management component
15. Create activity log viewer
16. Add role-based navigation

### Phase 5: Frontend - Access Control ✅
17. Update publication table for role-based access
18. Disable edit buttons for admin_viewer
19. Add role badge to header
20. Implement conditional rendering

### Phase 6: Testing & Documentation ✅
21. Test all three roles thoroughly
22. Document role permissions
23. Create admin user guide
24. Update README with RBAC info

## Testing Checklist

### User (Faculty) Role
- [ ] Can register and login
- [ ] Can view only own publications
- [ ] Can add new publication
- [ ] Can edit own publication
- [ ] Can delete own publication
- [ ] Can upload Excel/CSV
- [ ] Cannot see other users' data
- [ ] Cannot access admin panel

### Admin Viewer Role
- [ ] Can login with configured email
- [ ] Can view all faculty profiles
- [ ] Can view all publications
- [ ] Can search across all data
- [ ] Cannot add publications
- [ ] Cannot edit any data
- [ ] Cannot delete any data
- [ ] Cannot access activity logs
- [ ] All action buttons are hidden

### Super Admin Role
- [ ] Can login with super admin email
- [ ] Can view all users and publications
- [ ] Can add/edit/delete any publication
- [ ] Can create new users
- [ ] Can change user roles
- [ ] Can delete users
- [ ] Can access activity logs
- [ ] Can filter logs by all criteria
- [ ] Can export activity logs
- [ ] All actions are logged

### Activity Logging
- [ ] Login events are logged
- [ ] Logout events are logged
- [ ] View actions are logged
- [ ] Add actions are logged
- [ ] Edit actions are logged (with changes)
- [ ] Delete actions are logged
- [ ] Upload actions are logged
- [ ] User management actions are logged
- [ ] Logs include all required fields
- [ ] Logs are immutable

## Files to Create/Modify

### New Files
- `backend/models/ActivityLog.js`
- `backend/middleware/authorize.js`
- `backend/middleware/activityLogger.js`
- `backend/routes/admin.js`
- `backend/utils/roleChecker.js`
- `frontend/admin-dashboard.html`
- `frontend/js/admin.js`
- `frontend/js/activityLogs.js`
- `frontend/js/userManagement.js`
- `ADMIN_GUIDE.md`

### Modified Files
- `backend/models/User.js` - Add role field
- `backend/routes/auth.js` - Add role assignment
- `backend/routes/publications.js` - Add role checks & logging
- `backend/server.js` - Register new routes
- `frontend/dashboard.html` - Add role-based navigation
- `frontend/js/auth.js` - Handle role after login
- `frontend/js/table.js` - Role-based access control
- `frontend/css/style.css` - Admin UI styles
- `README.md` - Document RBAC
- `.env` - Add admin email configuration

## Timeline Estimate

- **Backend Implementation**: 4-5 hours
- **Frontend Implementation**: 3-4 hours
- **Testing**: 2-3 hours
- **Documentation**: 1-2 hours
- **Total**: 10-14 hours

## Success Criteria

✅ Three distinct roles working correctly  
✅ Role-based access control enforced on all routes  
✅ Activity logging capturing all required events  
✅ Super Admin can view and filter activity logs  
✅ Admin Viewer has read-only access to all data  
✅ Users can only access their own data  
✅ All actions properly logged with metadata  
✅ UI adapts based on user role  
✅ Comprehensive testing completed  
✅ Documentation updated

---

**Ready to implement! 🚀**
