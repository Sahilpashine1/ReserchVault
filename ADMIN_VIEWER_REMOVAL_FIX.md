# Admin Viewer Role Removal - Fix Summary

## Date: 2026-01-17

## Issues Fixed

### Issue 1: admin_viewer Role Still Visible in UI
**Problem**: The admin panel UI still showed "Admin Viewer" as a role option even though it was removed from the backend.

**Solution**: Removed all references to `admin_viewer` from:
- `frontend/admin.html` - Removed from role filter dropdown, create user modal, and change role modal
- `frontend/js/admin.js` - Removed from access checks, permission descriptions, and role display names
- `frontend/js/table.js` - Removed from admin menu visibility check

### Issue 2: Admin-Created Users Not Seeing All Publications
**Problem**: Users created by Super Admin through the admin panel were not able to see all publications because the `createdByAdmin` flag wasn't being set.

**Solution**: Already fixed in previous update - `backend/routes/admin.js` now sets `createdByAdmin: true` when creating users.

**Root Cause**: The backend server needed to be restarted to pick up the User model changes (added `createdByAdmin` field).

## Files Modified

### Frontend (3 files)
1. **frontend/admin.html**
   - Removed admin_viewer CSS styles (lines 79-82)
   - Removed admin_viewer from role filter dropdown (line 272)
   - Updated create user modal role dropdown (lines 360-367)
   - Removed admin_viewer from change role modal (line 406)
   - Updated help text to reflect new permissions

2. **frontend/js/admin.js**
   - Updated access check to only allow super_admin (line 32)
   - Removed admin_viewer button hiding logic (lines 49-53)
   - Updated admin user count to only count super_admin (line 203)
   - Updated permission descriptions (lines 391-416)
   - Removed admin_viewer from role display names (line 621)

3. **frontend/js/table.js**
   - Updated admin menu visibility to only show for super_admin (line 15)

### Backend
- **Server Restart**: Required to pick up User model changes

## Changes Summary

### Removed
- ❌ `admin_viewer` role from all UI dropdowns
- ❌ `admin_viewer` CSS styles
- ❌ `admin_viewer` access checks
- ❌ `admin_viewer` permission descriptions

### Updated
- ✅ Access checks now only allow `super_admin` for admin panel
- ✅ Role dropdowns now only show `user` and `super_admin`
- ✅ Permission descriptions updated to reflect new system
- ✅ Help text updated to explain new permissions

## New System Behavior

### Role Options (Only 2)
1. **Faculty User** (`user`)
   - If created by admin: Can view all publications
   - If self-registered: Can only view own publications
   - Can only edit/delete own publications
   - Can change own password

2. **Super Admin** (`super_admin`)
   - Full access to everything
   - Can create/edit/delete users
   - Can change user roles
   - Can edit/delete any publication
   - Can view activity logs

### User Creation Flow
1. Super Admin logs into admin panel
2. Clicks "Create New User"
3. Fills in details (name, email, department, password)
4. Selects role: "Faculty User" or "Super Admin"
5. User is created with `createdByAdmin: true`
6. User can now view all publications (if Faculty User) or has full access (if Super Admin)

### Self-Registration Flow
1. User registers via `/register`
2. User is created with `createdByAdmin: false`
3. User can only see their own publications
4. No tabs visible on dashboard

## Testing Checklist

- [x] admin_viewer removed from all UI dropdowns
- [x] Only super_admin can access admin panel
- [x] Create user modal shows only 2 role options
- [x] Change role modal shows only 2 role options
- [x] Permission descriptions updated
- [x] Backend server restarted to pick up model changes
- [ ] Test creating a new user via admin panel
- [ ] Verify new user can see all publications
- [ ] Verify new user can only edit own publications
- [ ] Verify tabs are visible for admin-created users
- [ ] Verify self-registered users don't see tabs

## Next Steps

1. **Test User Creation**: Create a new user via admin panel and verify they can see all publications
2. **Test Tabs**: Verify tabs show for admin-created users and hide for self-registered users
3. **Test Permissions**: Verify users can only edit/delete their own publications
4. **Update Documentation**: Update README.md and ADMIN_GUIDE.md to reflect removed admin_viewer role

## Important Notes

- **Server Restart Required**: The backend server MUST be restarted after User model changes
- **Existing Users**: Any existing users with `admin_viewer` role will need to be updated manually
- **Database Migration**: Consider running a script to update existing users' `createdByAdmin` flag if needed
