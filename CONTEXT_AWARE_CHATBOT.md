# Context-Aware Chatbot Implementation

## Overview
The chatbot has been enhanced to be **context-aware**, meaning it adapts its responses based on whether the user is viewing their own publications or all faculty publications.

## Features

### 1. **Dynamic Context Detection**
- The chatbot automatically detects which tab is active on the Publications Dashboard:
  - **My Publications**: Queries only the current user's publications
  - **All Publications**: Queries all publications in the system (for authorized users)

### 2. **Visual Context Indicator**
- A context banner displays at the top of the chatbot showing:
  - 📚 "Your Publications" when viewing own publications
  - 📚 "All Faculty Publications" when viewing all publications

### 3. **Automatic Updates**
- When users switch tabs, the chatbot context updates automatically
- Welcome messages adapt based on current context
- All queries are scoped to the appropriate publication set

### 4. **Permission-Aware**
- Respects user permissions (super_admin and admin-created users can query all publications)
- Automatically falls back to user's own publications if they lack permissions

## How It Works

### Backend Changes (`backend/routes/chatbot.js`)

```javascript
// Endpoint now accepts a 'scope' parameter
router.post('/query', auth, async (req, res) => {
    const { query, scope } = req.body; // scope: 'my' or 'all'
    
    // Fetch appropriate publications based on scope and permissions
    if (scope === 'all' && user has permission) {
        publications = all publications
    } else {
        publications = user's own publications
    }
    
    // Process query and return context-prefixed response
});
```

**Response Format:**
```json
{
    "success": true,
    "query": "Show publications from 2024",
    "response": "📚 **All Publications**: Found 15 publications from 2024...",
    "scope": "all",
    "publicationsCount": 150,
    "timestamp": "2026-01-22T..."
}
```

### Frontend Changes

#### 1. **Floating Chatbot (`frontend/js/floating-chatbot.js`)**

**New Properties:**
- `currentScope`: Tracks current context ('my' or 'all')

**New Methods:**
- `updateContext()`: Updates chatbot context based on current tab
- `formatResponse()`: Formats markdown-style responses

**Enhanced Features:**
- Context indicator in the chatbot UI
- Dynamic welcome messages
- Automatic scope detection

#### 2. **Table Management (`frontend/js/table.js`)**

**Updated `switchTab()` function:**
```javascript
function switchTab(tab) {
    // ... existing code ...
    
    // Notify chatbot of context change
    if (typeof FloatingChatbot !== 'undefined') {
        FloatingChatbot.updateContext();
    }
}
```

## User Experience

### Scenario 1: Regular User (Self-Registered)
1. User sees only their own publications
2. Chatbot context shows: "Your Publications"
3. Queries like "How many publications?" return count of their own publications
4. No "All Publications" tab visible

### Scenario 2: Admin-Created User
1. User can toggle between "My Publications" and "All Publications" tabs
2. **On "My Publications" tab:**
   - Chatbot shows: "👤 **Your Publications**: You have 5 publications..."
   - Queries are scoped to their own work
3. **On "All Publications" tab:**
   - Chatbot shows: "📚 **All Publications**: There are 50 publications in total..."
   - Queries cover all faculty publications

### Scenario 3: Super Admin
- Same as Scenario 2, plus full edit/delete permissions across all publications

## Example Queries

### When on "My Publications" tab:
```
User: "Show me a summary"
Bot: 👤 **Your Publications**: You have 8 publications spanning from 2020 to 2024...

User: "What are my top research areas?"
Bot: 👤 **Your Publications**: Your top research areas are Machine Learning (4 papers)...
```

### When on "All Publications" tab:
```
User: "Show me a summary"
Bot: 📚 **All Publications**: The system contains 45 publications from 12 faculty members...

User: "What are the top research areas?"
Bot: 📚 **All Publications**: The most researched areas are Artificial Intelligence (15 papers)...
```

## Technical Implementation Details

### Context Flow
```
User switches tab → switchTab() called → FloatingChatbot.updateContext() → 
Updates context label → User asks question → 
Chatbot sends query with scope → Backend filters publications → 
Returns scoped response → Bot displays with context prefix
```

### Permission Checking
1. **Frontend**: Determines if user can see "All Publications" tab
2. **Backend**: Double-checks permissions before querying all publications
3. **Fallback**: If user lacks permission but requests 'all', backend returns only their publications

### Synchronization
- `currentTab` variable in `table.js` is global and accessible to `floating-chatbot.js`
- Context updates happen automatically on tab switch
- No manual refresh needed

## Benefits

1. **✅ Better UX**: Users always know what dataset the chatbot is querying
2. **✅ Clear Context**: Visual indicators prevent confusion
3. **✅ Permission-Safe**: Respects access controls
4. **✅ Smart Responses**: Responses are prefixed with context for clarity
5. **✅ Seamless Integration**: Works with existing tab functionality

## Testing

### Test Case 1: Context Switch
1. Open Publications Dashboard
2. Ask chatbot: "How many publications?"
3. Switch to "All Publications" tab
4. Ask same question again
5. **Expected**: Different answers based on scope

### Test Case 2: Permission Check
1. Register a new user (self-registration)
2. Try accessing chatbot
3. **Expected**: Only queries own publications, no tab switching option

### Test Case 3: Real-time Update
1. Switch between tabs multiple times
2. Observe context label in chatbot
3. **Expected**: Label updates immediately without refresh

## Future Enhancements

- [ ] Add filter options (by year, by research area) in chatbot
- [ ] Show publication count in context label
- [ ] Add "Switch Context" button directly in chatbot
- [ ] Cache queries per context for faster responses
- [ ] Add context-specific quicksuggestions

## Migration Notes

### For Existing Deployments
1. No database changes required
2. Update backend routes file
3. Update frontend JavaScript files
4. Restart server
5. Clear browser cache for users

### Backward Compatibility
- Old API calls without `scope` parameter still work (defaults to 'my')
- Existing chatbot queries continue to function normally
