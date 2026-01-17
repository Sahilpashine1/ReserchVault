# View Modal Edit Button Fix

## Date: 2026-01-17

## Issue
When viewing publication details in the modal, the "Edit" button was always visible, even for publications that the user doesn't own. This allowed admin-created users to potentially edit other users' publications from the view modal.

## Expected Behavior
- **Own Publications**: Edit button should be visible
- **Other Users' Publications**: Edit button should be hidden (view-only mode)
- **Super Admin**: Edit button should be visible for all publications

## Solution
Updated the `viewPublication()` function in `frontend/js/table.js` to conditionally show/hide the Edit button based on the `canEditPublication()` function.

## Code Changes

### File: `frontend/js/table.js`

**Function**: `viewPublication(id)`

**Added Code**:
```javascript
// Show/hide edit button based on permissions
const editButton = document.getElementById('editFromViewBtn');
if (canEditPublication(pub)) {
    editButton.style.display = 'inline-block';
} else {
    editButton.style.display = 'none';
}
```

**Location**: After the modal content is populated, before showing the modal

## How It Works

### Permission Check Flow:

1. **User clicks "View Details" (👁️) button** on any publication

2. **`viewPublication(id)` function is called**
   - Finds the publication by ID
   - Populates the modal with publication details

3. **Permission check using `canEditPublication(pub)`**:
   - **Super Admin**: Returns `true` (can edit any publication)
   - **Regular User**: 
     - Own publication → Returns `true`
     - Other's publication → Returns `false`

4. **Edit button visibility**:
   - `true` → Button is shown (`display: inline-block`)
   - `false` → Button is hidden (`display: none`)

5. **Modal is displayed** with appropriate buttons

## User Experience

### Scenario 1: Viewing Own Publication
```
┌─────────────────────────────────────────┐
│  📖 Publication Details            ✕    │
├─────────────────────────────────────────┤
│                                         │
│  [Publication details displayed]        │
│                                         │
├─────────────────────────────────────────┤
│              [Close]  [Edit]  ← Visible │
└─────────────────────────────────────────┘
```

### Scenario 2: Viewing Other User's Publication (Admin-Created User)
```
┌─────────────────────────────────────────┐
│  📖 Publication Details            ✕    │
├─────────────────────────────────────────┤
│                                         │
│  [Publication details displayed]        │
│                                         │
├─────────────────────────────────────────┤
│              [Close]          ← No Edit │
└─────────────────────────────────────────┘
```

### Scenario 3: Super Admin Viewing Any Publication
```
┌─────────────────────────────────────────┐
│  📖 Publication Details            ✕    │
├─────────────────────────────────────────┤
│                                         │
│  [Publication details displayed]        │
│                                         │
├─────────────────────────────────────────┤
│              [Close]  [Edit]  ← Visible │
└─────────────────────────────────────────┘
```

## Permission Matrix

| User Type | Own Publication | Other's Publication |
|-----------|----------------|---------------------|
| **Self-Registered User** | Edit button visible | N/A (can't see others) |
| **Admin-Created User** | Edit button visible | Edit button HIDDEN ✅ |
| **Super Admin** | Edit button visible | Edit button visible |

## Related Functions

### `canEditPublication(pub)`
**Location**: `frontend/js/table.js`

**Logic**:
```javascript
function canEditPublication(pub) {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    // Super admin can edit any publication
    if (user.role === 'super_admin') {
        return true;
    }
    // Regular users can only edit their own publications
    return pub.userId === currentUserId || pub.userId?._id === currentUserId;
}
```

## Testing Checklist

### Test as Admin-Created User:
- [ ] View own publication → Edit button visible
- [ ] Click Edit → Opens edit modal
- [ ] View another user's publication → Edit button HIDDEN
- [ ] Only Close button visible for others' publications

### Test as Super Admin:
- [ ] View any publication → Edit button always visible
- [ ] Can edit any publication from view modal

### Test as Self-Registered User:
- [ ] View own publication → Edit button visible
- [ ] No tabs visible (can't see others' publications)

## Security Notes

1. **Frontend Protection**: Edit button is hidden via JavaScript
2. **Backend Protection**: API endpoint still validates ownership
   - Even if someone bypasses frontend, backend will reject unauthorized edits
3. **Consistent with Table Actions**: Same logic as edit/delete buttons in table
4. **No Data Exposure**: Viewing details doesn't expose edit capabilities

## Files Modified

1. **frontend/js/table.js**
   - Updated `viewPublication()` function
   - Added edit button visibility logic

## Benefits

✅ **Improved UX**: Users don't see edit options they can't use  
✅ **Clear Permissions**: Visual indication of read-only vs editable  
✅ **Consistent Behavior**: Matches table row action buttons  
✅ **Security**: Prevents confusion about edit capabilities  
✅ **Professional**: Clean, permission-aware interface  

## Related Features

- **Table Edit/Delete Buttons**: Already conditionally shown based on `canEditPublication()`
- **Backend API Protection**: `PUT /api/publications/:id` validates ownership
- **Role-Based Access Control**: Uses `createdByAdmin` flag for permissions

## Summary

The view modal now correctly shows/hides the Edit button based on user permissions:
- **Own publications**: Can view AND edit
- **Others' publications**: Can view ONLY (read-only mode)
- **Super Admin**: Can view and edit ALL publications

This provides a clear, secure, and user-friendly experience that matches the permission model throughout the application.
