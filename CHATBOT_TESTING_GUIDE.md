# 🧪 Context-Aware Chatbot - Testing Guide

## Quick Test Instructions

### Prerequisites
- ✅ Backend server running on `http://localhost:5000`
- ✅ Frontend accessible
- ✅ At least one user account with publications

---

## Test 1: Basic Context Detection (Self-Registered User)

**Steps:**
1. Register a new user or login as self-registered user
2. Navigate to Publications Dashboard
3. Open the floating chatbot (click chat icon)
4. Check the context banner

**Expected Results:**
- ✅ Context banner shows: "📚 Context: Your Publications"
- ✅ No "All Publications" tab visible
- ✅ Welcome message mentions "your publications"

**Sample Query:**
```
Ask: "How many publications do I have?"
Expected: "👤 Your Publications: You have X publications..."
```

---

## Test 2: Context Switching (Admin User)

**Steps:**
1. Login as super_admin or admin-created user
2. Navigate to Publications Dashboard
3. Verify you see both tabs: "My Publications" and "All Publications"
4. Open the floating chatbot
5. Note the context banner (should say "Your Publications")
6. Ask: "How many publications are there?"
7. Switch to "All Publications" tab
8. Check if context banner updates
9. Ask the same question again

**Expected Results:**

**On "My Publications" Tab:**
- ✅ Context: "Your Publications"
- ✅ Answer: "👤 Your Publications: You have X publications..."

**After Switching to "All Publications" Tab:**
- ✅ Context automatically updates to: "All Faculty Publications"
- ✅ Answer: "📚 All Publications: There are Y publications from Z faculty members..."
- ✅ Y should be >= X (all publications include yours)

---

## Test 3: Real-Time Context Updates

**Steps:**
1. Open chatbot on "My Publications" tab
2. Ask: "Show me a summary"
3. Switch to "All Publications" tab (keep chatbot open)
4. Ask: "Show me a summary" again
5. Switch back to "My Publications"
6. Ask again

**Expected Results:**
- ✅ Each response should have appropriate context prefix
- ✅ Context banner updates immediately on tab switch
- ✅ Different statistics for each context
- ✅ No need to refresh or reopen chatbot

---

## Test 4: Permission Verification

**Steps:**
1. Login as self-registered user
2. Open browser console (F12)
3. Try to manually call API with scope='all':
   ```javascript
   fetch('http://localhost:5000/api/chatbot/query', {
     method: 'POST',
     headers: {
       'Content-Type': 'application/json',
       'Authorization': 'Bearer ' + localStorage.getItem('token')
     },
     body: JSON.stringify({
       query: 'How many publications?',
       scope: 'all'
     })
   }).then(r => r.json()).then(console.log)
   ```

**Expected Results:**
- ✅ Backend should return data only for user's own publications
- ✅ No error should occur
- ✅ Response count should match user's publication count (not all publications)

---

## Test 5: Visual Indicators

**Steps:**
1. Login as admin user
2. Navigate to Publications Dashboard
3. Open chatbot
4. Observe the context banner styling
5. Switch between tabs multiple times

**Expected Results:**
- ✅ Context banner has gradient background (blue to purple)
- ✅ White text on gradient is readable
- ✅ Banner text updates smoothly
- ✅ No visual glitches during tab switch

---

## Test 6: Response Formatting

**Steps:**
1. Ask chatbot: "Give me a detailed summary"
2. Check if the response includes formatting

**Expected Results:**
- ✅ Bold text (using **text**) renders correctly
- ✅ Context prefix appears in bold
- ✅ Line breaks work properly
- ✅ No markdown syntax visible in output

---

## Test 7: Different Query Types

**Test on both tabs:**

| Query | Expected Behavior |
|-------|------------------|
| "How many publications?" | Returns count for current context |
| "What are the top research areas?" | Analyzes publications in current context |
| "Show my latest publication" | Works correctly on both contexts |
| "Publications from 2024" | Filters within current context |
| "Generate statistics" | Stats for current scope only |

**For Each Query:**
1. Ask on "My Publications" tab → Note answer
2. Switch to "All Publications" tab → Ask again → Compare answers
3. Answers should differ based on scope

---

## Test 8: Backend Response Structure

**Steps:**
1. Open browser console
2. Open chatbot and ask a question
3. Check network tab for `/api/chatbot/query` request
4. Examine response

**Expected Response Structure:**
```json
{
  "success": true,
  "query": "How many publications?",
  "response": "👤 Your Publications: You have 8 publications...",
  "data": { /* query results */ },
  "scope": "my",
  "publicationsCount": 8,
  "timestamp": "2026-01-22T..."
}
```

**Verify:**
- ✅ `scope` field matches current tab
- ✅ `publicationsCount` is correct
- ✅ `response` has appropriate prefix
- ✅ `data` contains relevant information

---

## Test 9: Edge Cases

### Empty Publications
**Steps:**
1. Create new user with no publications
2. Open chatbot
3. Ask: "Show my publications"

**Expected:**
- ✅ Chatbot responds appropriately (e.g., "You have no publications yet")
- ✅ No errors in console

### Switching Mid-Query
**Steps:**
1. Ask a question
2. While waiting for response, switch tabs
3. Observe behavior

**Expected:**
- ✅ Response appears with context from when query was sent
- ✅ No race conditions or errors

### Rapid Tab Switching
**Steps:**
1. Rapidly click between tabs 5-10 times
2. Check context label
3. Ask a question

**Expected:**
- ✅ Context settles on current tab
- ✅ No visual glitches
- ✅ Query works correctly

---

## Test 10: Suggestions

**Steps:**
1. Open fresh chatbot (clear all messages)
2. Check suggestion chips
3. Click each suggestion on both tabs

**Expected Results:**
- ✅ Suggestions work on both "My Publications" and "All Publications"
- ✅ Responses adapt to current context
- ✅ Generic suggestions (not "my publications")

---

## Common Issues & Solutions

### ❌ Context Not Updating
**Problem:** Context label doesn't change when switching tabs
**Solution:** 
- Check if `FloatingChatbot.updateContext()` is called in `switchTab()`
- Verify `currentTab` variable is global and accessible
- Clear browser cache and refresh

### ❌ Wrong Publication Count
**Problem:** Chatbot returns wrong number of publications
**Solution:**
- Check backend permission logic
- Verify `scope` parameter is being sent correctly
- Check user role and `createdByAdmin` flag

### ❌ No Context Prefix
**Problem:** Responses don't have "👤 Your Publications:" prefix
**Solution:**
- Verify backend is adding prefix
- Check `formatResponse()` function
- Ensure `scope` is being sent to backend

### ❌ Permission Error
**Problem:** Regular user sees all publications
**Solution:**
- Check backend permission checking
- Verify user.role and user.createdByAdmin
- Review backend query filter

---

## Automated Test Script (Optional)

```javascript
// Run in browser console while on Publications Dashboard
async function testChatbotContexts() {
    const token = localStorage.getItem('token');
    
    // Test 'my' scope
    const myResponse = await fetch('http://localhost:5000/api/chatbot/query', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            query: 'How many publications?',
            scope: 'my'
        })
    }).then(r => r.json());
    
    console.log('MY PUBLICATIONS:', myResponse);
    
    // Test 'all' scope
    const allResponse = await fetch('http://localhost:5000/api/chatbot/query', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            query: 'How many publications?',
            scope: 'all'
        })
    }).then(r => r.json());
    
    console.log('ALL PUBLICATIONS:', allResponse);
    
    // Comparison
    console.log('\n=== COMPARISON ===');
    console.log('My Count:', myResponse.publicationsCount);
    console.log('All Count:', allResponse.publicationsCount);
    console.log('Test Passed:', allResponse.publicationsCount >= myResponse.publicationsCount);
}

// Run test
testChatbotContexts();
```

---

## Success Criteria

All tests pass if:

✅ Context label updates automatically when switching tabs  
✅ Responses are prefixed with appropriate context  
✅ Publication counts differ between "My" and "All" contexts  
✅ Permissions are properly enforced  
✅ No console errors occur  
✅ Visual elements render correctly  
✅ Backend returns correct scope in response  
✅ Chatbot works for both admin and regular users  

---

## Reporting Issues

If you find any issues:

1. **Note the issue**: What happened vs. what should happen
2. **Browser console**: Check for JavaScript errors
3. **Network tab**: Check API request/response
4. **User type**: What role is the user (super_admin, regular, etc.)
5. **Steps to reproduce**: Exact steps that caused the issue

---

**Status After Testing:** 🎯

- [ ] All basic tests passed
- [ ] Context switching works perfectly
- [ ] Permission checks verified
- [ ] Ready for production use

Good luck with testing! 🚀
