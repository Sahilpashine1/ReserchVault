# 🧪 RBAC Testing Guide

This guide will help you test the Role-Based Access Control (RBAC) system implementation.

## Prerequisites

1. MongoDB must be running
2. Backend server must be started
3. Configure admin emails in `backend/.env`:
   ```env
   SUPER_ADMIN_EMAIL=admin@college.edu
   ADMIN_VIEWER_EMAILS=viewer@college.edu
   ```

---

## Testing Scenarios

### Scenario 1: Regular User (Faculty) Testing

#### Step 1: Register as Regular User
```bash
POST http://localhost:5000/api/auth/register
Content-Type: application/json

{
  "name": "Dr. John Smith",
  "email": "john.smith@college.edu",
  "password": "password123",
  "department": "Computer Science"
}
```

**Expected Response**:
```json
{
  "message": "User registered successfully",
  "token": "jwt_token_here",
  "user": {
    "id": "...",
    "name": "Dr. John Smith",
    "email": "john.smith@college.edu",
    "department": "Computer Science",
    "role": "user"  ← Should be "user"
  }
}
```

#### Step 2: Login
```bash
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "john.smith@college.edu",
  "password": "password123"
}
```

**Expected**: Token + role="user"

#### Step 3: Check Activity Log (Login event)
- Login event should be logged with user's email, role, timestamp

#### Step 4: Add a Publication
```bash
POST http://localhost:5000/api/publications
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "AI Research Paper",
  "authors": "John Smith",
  "year": 2024,
  "journalConference": "IEEE",
  "keywords": "AI, Machine Learning"
}
```

**Expected**: ✅ Success + activity logged

#### Step 5: Try to Access Admin Endpoint (Should Fail)
```bash
GET http://localhost:5000/api/admin/users
Authorization: Bearer <token>
```

**Expected**: ❌ 403 Forbidden

#### Step 6: View Own Publications
```bash
GET http://localhost:5000/api/publications
Authorization: Bearer <token>
```

**Expected**: ✅ Returns only own publications

---

### Scenario 2: Admin Viewer Testing

#### Step 1: Register as Admin Viewer
```bash
POST http://localhost:5000/api/auth/register
Content-Type: application/json

{
  "name": "Sarah Administrator",
  "email": "viewer@college.edu",
  "password": "password123",
  "department": "Admin"
}
```

**Expected Response**:
```json
{
  "user": {
    "role": "admin_viewer"  ← Should be "admin_viewer"
  }
}
```

#### Step 2: View All Publications
```bash
GET http://localhost:5000/api/publications
Authorization: Bearer <token>
```

**Expected**: ✅ Returns ALL publications from ALL users

#### Step 3: Try to Add Publication (Should Fail)
```bash
POST http://localhost:5000/api/publications
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Test Publication",
  "authors": "Admin Viewer",
  "year": 2024,
  "journalConference": "Test",
  "keywords": "test"
}
```

**Expected**: ❌ 403 "Admin viewers have read-only access"

#### Step 4: Try to Delete Publication (Should Fail)
```bash
DELETE http://localhost:5000/api/publications/<publication_id>
Authorization: Bearer <token>
```

**Expected**: ❌ 403 "Admin viewers have read-only access"

#### Step 5: Try to Access Activity Logs (Should Fail)
```bash
GET http://localhost:5000/api/admin/activity-logs
Authorization: Bearer <token>
```

**Expected**: ❌ 403 Forbidden (only Super Admin can access)

#### Step 6: View System Stats
```bash
GET http://localhost:5000/api/admin/stats
Authorization: Bearer <token>
```

**Expected**: ✅ Success (Admin Viewers can view stats)

---

### Scenario 3: Super Admin Testing

#### Step 1: Register as Super Admin
```bash
POST http://localhost:5000/api/auth/register
Content-Type: application/json

{
  "name": "System Admin",
  "email": "admin@college.edu",
  "password": "admin123",
  "department": "IT"
}
```

**Expected Response**:
```json
{
  "user": {
    "role": "super_admin"  ← Should be "super_admin"
  }
}
```

#### Step 2: View All Users
```bash
GET http://localhost:5000/api/admin/users
Authorization: Bearer <token>
```

**Expected**: ✅ List of all users

#### Step 3: Create a New User
```bash
POST http://localhost:5000/api/admin/users
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Test Faculty",
  "email": "test@college.edu",
  "password": "test123",
  "department": "Testing",
  "role": "user"
}
```

**Expected**: ✅ User created + action logged

#### Step 4: Change User Role
```bash
PUT http://localhost:5000/api/admin/users/<user_id>/role
Authorization: Bearer <token>
Content-Type: application/json

{
  "role": "admin_viewer"
}
```

**Expected**: ✅ Role changed + action logged

#### Step 5: View Activity Logs
```bash
GET http://localhost:5000/api/admin/activity-logs
Authorization: Bearer <token>
```

**Expected**: ✅ Returns all activity logs

#### Step 6: Filter Activity Logs
```bash
GET http://localhost:5000/api/admin/activity-logs?action=login&startDate=2026-01-16
Authorization: Bearer <token>
```

**Expected**: ✅ Filtered results

#### Step 7: Export Activity Logs
```bash
GET http://localhost:5000/api/admin/activity-logs/export
Authorization: Bearer <token>
```

**Expected**: ✅ CSV file download

#### Step 8: Deactivate a User
```bash
PUT http://localhost:5000/api/admin/users/<user_id>/status
Authorization: Bearer <token>
Content-Type: application/json

{
  "isActive": false
}
```

**Expected**: ✅ User deactivated + logged

#### Step 9: Delete a User
```bash
DELETE http://localhost:5000/api/admin/users/<user_id>
Authorization: Bearer <token>
```

**Expected**: ✅ User deleted + all publications deleted + logged

#### Step 10: View All Publications from All Users
```bash
GET http://localhost:5000/api/publications
Authorization: Bearer <token>
```

**Expected**: ✅ Returns ALL publications

#### Step 11: Add Publication for Any User
```bash
POST http://localhost:5000/api/publications
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Admin Created Publication",
  "authors": "Various",
  "year": 2024,
  "journalConference": "Admin Test",
  "keywords": "test"
}
```

**Expected**: ✅ Publication created + logged

---

## Testing with Postman/Thunder Client

### Collection Setup

1. Create a new collection: "RBAC Testing"
2. Add environment variables:
   - `base_url`: http://localhost:5000
   - `user_token`: (set after login)
   - `admin_viewer_token`: (set after login)
   - `super_admin_token`: (set after login)

### Request Examples

#### Register User
```
POST {{base_url}}/api/auth/register
Body: {
  "name": "Test User",
  "email": "test@example.com",
  "password": "test123",
  "department": "Test"
}
```

#### Login
```
POST {{base_url}}/api/auth/login
Body: {
  "email": "test@example.com",
  "password": "test123"
}
```

#### Get Current User Info
```
GET {{base_url}}/api/auth/me
Headers: Authorization: Bearer {{user_token}}
```

#### View Publications
```
GET {{base_url}}/api/publications
Headers: Authorization: Bearer {{user_token}}
```

#### Admin - View All Users
```
GET {{base_url}}/api/admin/users
Headers: Authorization: Bearer {{super_admin_token}}
```

#### Admin - View Activity Logs
```
GET {{base_url}}/api/admin/activity-logs?page=1&limit=20
Headers: Authorization: Bearer {{super_admin_token}}
```

---

## Verification Checklist

### User (Faculty) Role
- [ ] Registers with role="user"
- [ ] Can view only own publications
- [ ] Can add publications
- [ ] Can edit own publications
- [ ] Can delete own publications
- [ ] Cannot access /api/admin/* endpoints
- [ ] Login is logged
- [ ] Actions (add/edit/delete) are logged

### Admin Viewer Role
- [ ] Registers with role="admin_viewer"
- [ ] Can view ALL publications
- [ ] Can view system stats
- [ ] Cannot add publications (gets 403)
- [ ] Cannot edit publications (gets 403)
- [ ] Cannot delete publications (gets 403)
- [ ] Cannot access activity logs (gets 403)
- [ ] Cannot manage users (gets 403)

### Super Admin Role
- [ ] Registers with role="super_admin"
- [ ] Can view all users
- [ ] Can create new users
- [ ] Can update user info
- [ ] Can change user roles
- [ ] Can deactivate/activate users
- [ ] Can delete users
- [ ] Can view activity logs
- [ ] Can filter activity logs
- [ ] Can export activity logs as CSV
- [ ] Can view all publications
- [ ] Can add/edit/delete any publication
- [ ] All admin actions are logged

### Activity Logging
- [ ] Login events have timestamp, IP, user email
- [ ] Logout events are logged
- [ ] Publication add/edit/delete are logged
- [ ] User management actions are logged
- [ ] Role changes are logged
- [ ] Logs include entity details
- [ ] Logs are only accessible to Super Admin

---

## Database Verification

### Check Collections

```javascript
// MongoDB Shell commands

// 1. Check users collection
db.users.find({}, { password: 0 }).pretty()

// 2. Verify roles
db.users.aggregate([
  { $group: { _id: "$role", count: { $sum: 1 } } }
])

// 3. Check activity logs
db.activitylogs.find().sort({ timestamp: -1 }).limit(10).pretty()

// 4. Check logs by action type
db.activitylogs.aggregate([
  { $group: { _id: "$action", count: { $sum: 1 } } }
])

// 5. Check logs for specific user
db.activitylogs.find({ userEmail: "admin@college.edu" }).pretty()

// 6. Publications with user info
db.publications.find().limit(5).pretty()
```

---

## Common Issues & Solutions

### Issue 1: User not getting correct role
**Cause**: Email doesn't match .env configuration  
**Solution**: 
- Check email spelling in .env
- Ensure no extra spaces
- Restart server after .env changes

### Issue 2: 401 Unauthorized
**Cause**: Token missing or expired  
**Solution**: 
- Login again to get fresh token
- Include "Bearer " prefix in Authorization header

### Issue 3: 403 Forbidden
**Cause**: User doesn't have required role  
**Solution**: 
- Check user role with GET /api/auth/me
- Verify endpoint permissions
- Use correct role account for testing

### Issue 4: Activity logs empty
**Cause**: Database not recording logs  
**Solution**: 
- Check MongoDB connection
- Verify ActivityLog model is loaded
- Check console for logging errors

---

## Expected Activity Log Entries

After complete testing, you should see logs like:

```javascript
// Login event
{
  userEmail: "admin@college.edu",
  userRole: "super_admin",
  action: "login",
  entityType: "system",
  timestamp: ISODate("2026-01-16T16:17:28.000Z"),
  ipAddress: "::1"
}

// Publication add event
{
  userEmail: "john.smith@college.edu",
  userRole: "user",
  action: "add",
  entityType: "publication",
  entityDetails: {
    title: "AI Research Paper",
    created: true
  },
  timestamp: ISODate("2026-01-16T16:20:15.000Z")
}

// Role change event
{
  userEmail: "admin@college.edu",
  userRole: "super_admin",
  action: "role_change",
  entityType: "user",
  entityDetails: {
    targetUserEmail: "test@college.edu",
    oldRole: "user",
    newRole: "admin_viewer"
  },
  timestamp: ISODate("2026-01-16T16:25:00.000Z")
}
```

---

## Success Criteria

✅ All three roles behave as expected  
✅ Role-based access control works on all endpoints  
✅ Activity logging captures all actions  
✅ Logs contain complete information  
✅ Super Admin can manage users  
✅ Admin Viewer has read-only access  
✅ Regular users see only own data  
✅ No unauthorized access possible  

---

**Testing Duration**: ~30-45 minutes  
**Status**: Ready for Testing  
**Last Updated**: January 16, 2026
