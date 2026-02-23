# Role-Based Access Control Update Summary

## Date: 2026-01-17

## Overview
Completely redesigned the role-based access control system to eliminate the "admin_viewer" role and implement a new permission model based on how users are created.

## Key Changes

### 1. User Model Updates (`backend/models/User.js`)
- **Removed**: `admin_viewer` from role enum
- **Added**: `createdByAdmin` boolean field
  - `true` = User created by Super Admin (can view all publications)
  - `false` = Self-registered user (can only view own publications)
- **Roles now**: Only `user` and `super_admin`

### 2. Publications Access Control (`backend/routes/publications.js`)

#### GET /api/publications
- **Self-registered users** (`createdByAdmin=false`): Can ONLY see their own publications
- **Admin-created users** (`createdByAdmin=true`): Can see ALL publications OR filter to own via `?own=true`
- **Super Admin**: Can see everything

#### POST, PUT, DELETE /api/publications
- **All users** can add publications
- **Users** can only edit/delete their OWN publications
- **Super Admin** can edit/delete ANY publication

### 3. Admin Routes Updates (`backend/routes/admin.js`)
- **POST /api/admin/users**: Now sets `createdByAdmin=true` for all users created by admin
- **PUT /api/admin/users/:id/role**: Removed `admin_viewer` from valid roles

### 4. Profile Routes (`backend/routes/profile.js`)
- **Added**: `PUT /api/profile/password` endpoint
  - Allows users to change their password
  - Requires current password verification
  - Minimum 6 characters for new password
  - Logs password change activity

### 5. Frontend Updates

#### Dashboard HTML (`frontend/dashboard.html`)
- **Added**: Tab system for "My Publications" and "All Publications"
- Tabs show publication counts
- Tabs are hidden for self-registered users

#### Dashboard JavaScript (`frontend/js/table.js`)
- **New variables**:
  - `allPublications`: Stores all publications
  - `myPublications`: Stores user's own publications
  - `currentTab`: Tracks active tab ('my' or 'all')
  - `canViewAllPublications`: Permission flag
  - `currentUserId`: Current user ID

- **New functions**:
  - `switchTab(tab)`: Switches between My/All publications
  - `canEditPublication(pub)`: Checks if user can edit a publication

- **Updated**:
  - `loadPublications()`: Fetches both own and all publications, manages tab visibility
  - `renderPublications()`: Conditionally shows edit/delete buttons based on ownership

#### Styles (`frontend/css/style.css`)
- **Added**: Tab button styles with active state, hover effects, and gradient

## User Types & Permissions

### Type 1: Self-Registered Users
- **How created**: User registers themselves via `/register`
- **createdByAdmin**: `false`
- **Can see**: ONLY their own publications
- **Can edit/delete**: ONLY their own publications
- **Tabs visible**: NO
- **Can change password**: YES

### Type 2: Admin-Created Users
- **How created**: Super Admin creates via admin panel
- **createdByAdmin**: `true`
- **Can see**: ALL publications (with tabs to filter)
- **Can edit/delete**: ONLY their own publications
- **Tabs visible**: YES ("My Publications" & "All Publications")
- **Can change password**: YES

### Type 3: Super Admin
- **How created**: Email matches `SUPER_ADMIN_EMAIL` in `.env`
- **createdByAdmin**: N/A (always has full access)
- **Can see**: ALL publications
- **Can edit/delete**: ANY publication
- **Tabs visible**: YES
- **Can change password**: YES

## Security Improvements

1. ✅ **Eliminated admin_viewer role** - Simplified permission model
2. ✅ **Ownership-based editing** - Users can only edit their own publications
3. ✅ **Backend enforcement** - All permissions checked server-side
4. ✅ **Frontend UI adaptation** - Edit/delete buttons hidden for non-owned publications
5. ✅ **Password change** - Users can update their own passwords securely
6. ✅ **Activity logging** - All password changes logged

## API Response Changes

### GET /api/publications
Now returns:
```json
{
  "success": true,
  "count": 10,
  "publications": [...],
  "userRole": "user",
  "currentUserId": "123abc",
  "createdByAdmin": true
}
```

The `createdByAdmin` flag tells the frontend whether to show tabs.

## Migration Notes

### Existing Users
- All existing users will have `createdByAdmin=false` by default
- They will only see their own publications
- Super Admin can update users if needed

### To Give a User Access to All Publications
1. Super Admin logs in
2. Goes to Admin Panel
3. Deletes the self-registered user account (if exists)
4. Creates a new account with same email via "Create User"
5. New account will have `createdByAdmin=true`

## Testing Checklist

- [ ] Self-registered user can only see own publications
- [ ] Self-registered user cannot see tabs
- [ ] Admin-created user can see tabs
- [ ] Admin-created user can switch between My/All publications
- [ ] Users can only edit/delete own publications
- [ ] Super Admin can edit/delete any publication
- [ ] Password change works for all user types
- [ ] Edit/delete buttons hidden for non-owned publications in "All Publications" tab
- [ ] View button always visible for all publications

## Files Modified

### Backend
1. `backend/models/User.js`
2. `backend/routes/publications.js`
3. `backend/routes/admin.js`
4. `backend/routes/profile.js`

### Frontend
1. `frontend/dashboard.html`
2. `frontend/js/table.js`
3. `frontend/css/style.css`

## Next Steps

1. Test all scenarios with different user types
2. Update documentation (README.md, ADMIN_GUIDE.md)
3. Add password change UI to profile page
4. Consider adding bulk user import for admin
