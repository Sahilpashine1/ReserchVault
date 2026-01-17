# 🗄️ Data Storage Guide - Faculty Publications System

## Storage Overview

All data for the Faculty Publications Management System is stored in **MongoDB** (NoSQL database) with temporary file uploads stored on the file system.

---

## 📍 Storage Locations

### 1. MongoDB Database

**Connection String**: `mongodb://localhost:27017/faculty_publications`

**Database Name**: `faculty_publications`

**Default MongoDB Data Location** (Windows):
```
C:\Program Files\MongoDB\Server\<version>\data\db\
```

### 2. Uploaded Files (Temporary)

**Location**: 
```
c:\Users\shubh\OneDrive\Desktop\New folder\backend\uploads\
```

**Note**: Files are automatically deleted after processing

---

## 📚 Database Collections

### Collection 1: `users`

**Purpose**: Store all user accounts

**Schema**:
```javascript
{
  _id: ObjectId,              // Auto-generated unique ID
  name: String,                // User's full name
  email: String,               // Unique email (login credential)
  password: String,            // Bcrypt hashed password
  department: String,          // Department/Faculty
  role: String,                // "user" | "admin_viewer" | "super_admin"
  isActive: Boolean,           // true/false (can user login?)
  lastLogin: Date,             // Last login timestamp
  createdAt: Date              // Account creation date
}
```

**Indexes**:
- `email` - Unique index (no duplicate emails)
- `role` - For quick role-based queries

**Sample Document**:
```json
{
  "_id": ObjectId("65a7f1234567890abcdef123"),
  "name": "Dr. Sarah Johnson",
  "email": "sarah@college.edu",
  "password": "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy",
  "department": "Computer Science",
  "role": "user",
  "isActive": true,
  "lastLogin": ISODate("2026-01-16T17:00:00.000Z"),
  "createdAt": ISODate("2026-01-10T10:30:00.000Z")
}
```

---

### Collection 2: `publications`

**Purpose**: Store all research publications

**Schema**:
```javascript
{
  _id: ObjectId,              // Auto-generated unique ID
  userId: ObjectId,            // Reference to users collection
  title: String,               // Publication title
  authors: String,             // Comma-separated author names
  year: Number,                // Publication year
  journalConference: String,   // Where it was published
  keywords: String,            // Comma-separated keywords
  abstract: String,            // Publication abstract/summary
  publicationLink: String,     // URL to publication
  createdDate: Date            // When added to system
}
```

**Indexes**:
- `userId` - For filtering by user
- `year` - For temporal queries
- Text index on `title`, `keywords`, `abstract` - For search

**Sample Document**:
```json
{
  "_id": ObjectId("65a7f1234567890abcdef456"),
  "userId": ObjectId("65a7f1234567890abcdef123"),
  "title": "Deep Learning Applications in Healthcare",
  "authors": "Sarah Johnson, Michael Chen, Emma Davis",
  "year": 2024,
  "journalConference": "IEEE Transactions on Medical Imaging",
  "keywords": "Deep Learning, Healthcare, Medical Imaging, AI",
  "abstract": "This paper explores the applications of deep learning...",
  "publicationLink": "https://doi.org/10.1109/TMI.2024.123456",
  "createdDate": ISODate("2026-01-16T14:20:00.000Z")
}
```

---

### Collection 3: `activitylogs` ⭐ NEW

**Purpose**: Audit trail of all system actions

**Schema**:
```javascript
{
  _id: ObjectId,              // Auto-generated unique ID
  userId: ObjectId,            // Who performed the action
  userEmail: String,           // User's email
  userRole: String,            // User's role at time of action
  action: String,              // Type of action
  entityType: String,          // What was affected
  entityId: ObjectId,          // ID of affected entity
  entityDetails: Object,       // Specific action details
  timestamp: Date,             // When it happened
  ipAddress: String,           // User's IP address
  userAgent: String,           // Browser/client info
  metadata: Object             // Additional context
}
```

**Action Types**:
- `login` - User logged in
- `logout` - User logged out
- `view` - Viewed a record
- `add` - Created a new record
- `edit` - Updated a record
- `delete` - Deleted a record
- `upload` - Uploaded a file
- `user_create` - Admin created a user
- `user_update` - Admin updated a user
- `role_change` - Admin changed user role
- `user_delete` - Admin deleted a user

**Indexes**:
- `userId, timestamp` - Compound index
- `action, timestamp` - For filtering by action
- `userRole, timestamp` - For filtering by role

**Sample Documents**:

**Login Event**:
```json
{
  "_id": ObjectId("65a7f1234567890abcdef789"),
  "userId": ObjectId("65a7f1234567890abcdef123"),
  "userEmail": "sarah@college.edu",
  "userRole": "user",
  "action": "login",
  "entityType": "system",
  "entityId": null,
  "entityDetails": {},
  "timestamp": ISODate("2026-01-16T17:00:00.000Z"),
  "ipAddress": "192.168.1.100",
  "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)...",
  "metadata": {
    "loginTime": ISODate("2026-01-16T17:00:00.000Z")
  }
}
```

**Publication Add Event**:
```json
{
  "_id": ObjectId("65a7f1234567890abcdef790"),
  "userId": ObjectId("65a7f1234567890abcdef123"),
  "userEmail": "sarah@college.edu",
  "userRole": "user",
  "action": "add",
  "entityType": "publication",
  "entityId": ObjectId("65a7f1234567890abcdef456"),
  "entityDetails": {
    "title": "Deep Learning Applications in Healthcare",
    "created": true
  },
  "timestamp": ISODate("2026-01-16T17:05:30.000Z"),
  "ipAddress": "192.168.1.100",
  "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)...",
  "metadata": {
    "path": "/api/publications",
    "method": "POST"
  }
}
```

**Role Change Event** (Admin action):
```json
{
  "_id": ObjectId("65a7f1234567890abcdef791"),
  "userId": ObjectId("65a7f1234567890abcdef999"),
  "userEmail": "admin@college.edu",
  "userRole": "super_admin",
  "action": "role_change",
  "entityType": "user",
  "entityId": ObjectId("65a7f1234567890abcdef123"),
  "entityDetails": {
    "targetUserEmail": "sarah@college.edu",
    "targetUserName": "Dr. Sarah Johnson",
    "oldRole": "user",
    "newRole": "admin_viewer",
    "changedBy": "admin@college.edu"
  },
  "timestamp": ISODate("2026-01-16T18:00:00.000Z"),
  "ipAddress": "192.168.1.50",
  "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)...",
  "metadata": {
    "managementAction": "role_change"
  }
}
```

---

## 🔍 How to Access Your Data

### Method 1: MongoDB Compass (GUI - Easiest)

1. **Download**: https://www.mongodb.com/try/download/compass
2. **Install** and open MongoDB Compass
3. **Connect**: 
   - Connection String: `mongodb://localhost:27017`
   - Click "Connect"
4. **Browse**:
   - Click on `faculty_publications` database
   - Click on any collection (`users`, `publications`, `activitylogs`)
   - View, search, filter, sort data visually

**Screenshot**: You'll see all your data in a nice table format!

---

### Method 2: MongoDB Shell (Command Line)

```bash
# Open MongoDB Shell
mongosh

# Switch to your database
use faculty_publications

# === USERS ===
# View all users (without passwords)
db.users.find({}, { password: 0 }).pretty()

# Count users
db.users.countDocuments()

# Find user by email
db.users.findOne({ email: "sarah@college.edu" })

# Count users by role
db.users.aggregate([
  { $group: { _id: "$role", count: { $sum: 1 } } }
])

# Find all Super Admins
db.users.find({ role: "super_admin" })

# === PUBLICATIONS ===
# View all publications
db.publications.find().pretty()

# Count publications
db.publications.countDocuments()

# Find publications by specific user
db.publications.find({ userId: ObjectId("user_id_here") })

# Find publications from 2024
db.publications.find({ year: 2024 })

# Search publications by keyword
db.publications.find({ 
  $or: [
    { title: /machine learning/i },
    { keywords: /machine learning/i }
  ]
})

# === ACTIVITY LOGS ===
# View recent activity (last 10)
db.activitylogs.find().sort({ timestamp: -1 }).limit(10).pretty()

# Count total logs
db.activitylogs.countDocuments()

# Find all login events
db.activitylogs.find({ action: "login" })

# Find all actions by specific user
db.activitylogs.find({ userEmail: "sarah@college.edu" })

# Find logs from today
db.activitylogs.find({
  timestamp: {
    $gte: ISODate("2026-01-16T00:00:00Z"),
    $lt: ISODate("2026-01-17T00:00:00Z")
  }
})

# Count actions by type
db.activitylogs.aggregate([
  { $group: { _id: "$action", count: { $sum: 1 } } },
  { $sort: { count: -1 } }
])

# Find all admin actions
db.activitylogs.find({ userRole: "super_admin" })
```

---

### Method 3: Via Application API (Super Admin)

**Using Postman/Thunder Client**:

```http
### Get all users
GET http://localhost:5000/api/admin/users
Authorization: Bearer <super_admin_token>

### Get all publications
GET http://localhost:5000/api/admin/publications
Authorization: Bearer <super_admin_token>

### Get activity logs
GET http://localhost:5000/api/admin/activity-logs
Authorization: Bearer <super_admin_token>

### Get activity logs with filters
GET http://localhost:5000/api/admin/activity-logs?action=login&userEmail=sarah@college.edu
Authorization: Bearer <super_admin_token>
```

---

## 💾 Data Backup & Export

### Backup Entire Database

```bash
# Export all collections
mongodump --db faculty_publications --out C:\backup\mongodb\

# Creates folder structure:
# C:\backup\mongodb\faculty_publications\
#   ├── users.bson
#   ├── users.metadata.json
#   ├── publications.bson
#   ├── publications.metadata.json
#   ├── activitylogs.bson
#   └── activitylogs.metadata.json
```

### Export as JSON (Human-Readable)

```bash
# Export users to JSON
mongoexport --db faculty_publications --collection users --out users.json --jsonArray

# Export publications to JSON
mongoexport --db faculty_publications --collection publications --out publications.json --jsonArray

# Export activity logs to JSON
mongoexport --db faculty_publications --collection activitylogs --out activitylogs.json --jsonArray
```

### Export as CSV

```bash
# Export users to CSV
mongoexport --db faculty_publications --collection users --type=csv --fields=name,email,department,role,isActive --out users.csv

# Export publications to CSV
mongoexport --db faculty_publications --collection publications --type=csv --fields=title,authors,year,journalConference,keywords --out publications.csv
```

---

## 🔄 Restore Data

### Restore from Backup

```bash
# Restore entire database
mongorestore --db faculty_publications C:\backup\mongodb\faculty_publications\

# Restore specific collection
mongorestore --db faculty_publications --collection users C:\backup\mongodb\faculty_publications\users.bson
```

### Import from JSON

```bash
# Import users from JSON
mongoimport --db faculty_publications --collection users --file users.json --jsonArray

# Import publications from JSON
mongoimport --db faculty_publications --collection publications --file publications.json --jsonArray
```

---

## 📊 Database Statistics

### Check Database Size

```javascript
// In MongoDB Shell
use faculty_publications

// Database stats
db.stats()

// Collection stats
db.users.stats()
db.publications.stats()
db.activitylogs.stats()

// Index information
db.users.getIndexes()
db.publications.getIndexes()
db.activitylogs.getIndexes()
```

### Sample Output:
```json
{
  "db": "faculty_publications",
  "collections": 3,
  "views": 0,
  "objects": 150,  // Total documents
  "dataSize": 524288,  // ~512 KB
  "storageSize": 1048576,  // ~1 MB
  "indexes": 6,
  "indexSize": 131072,  // ~128 KB
  "ok": 1
}
```

---

## 🗑️ Data Cleanup

### Delete Old Activity Logs (Keep Last 90 Days)

```javascript
// Delete logs older than 90 days
const ninetyDaysAgo = new Date();
ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

db.activitylogs.deleteMany({
  timestamp: { $lt: ninetyDaysAgo }
})
```

### Delete Specific User's Data

```javascript
// Find user ID
const user = db.users.findOne({ email: "user@example.com" })

// Delete user's publications
db.publications.deleteMany({ userId: user._id })

// Delete user's activity logs
db.activitylogs.deleteMany({ userId: user._id })

// Delete user
db.users.deleteOne({ _id: user._id })
```

---

## 🔒 Data Security

### Current Security Measures:

1. **Passwords**: Stored as bcrypt hashes (never plain text)
2. **JWT Tokens**: Stored client-side (not in database)
3. **Activity Logs**: Immutable (cannot be edited)
4. **Access Control**: Role-based (enforced at API level)

### Recommendations:

1. **Regular Backups**: Daily or weekly backups
2. **Secure MongoDB**: 
   - Enable authentication
   - Use SSL/TLS connections
   - Restrict network access
3. **Audit Logs**: Review activity logs regularly
4. **Data Retention**: Archive old logs (keep 90-180 days)

---

## 📍 Quick Reference

| Data Type | Storage Location | Access Method |
|-----------|------------------|---------------|
| User Accounts | MongoDB: `users` collection | API, MongoDB Compass, Shell |
| Publications | MongoDB: `publications` collection | API, MongoDB Compass, Shell |
| Activity Logs | MongoDB: `activitylogs` collection | API (Super Admin), Compass, Shell |
| Uploaded Files | File System: `backend/uploads/` | Direct file access (temporary) |
| Configuration | File: `backend/.env` | Text editor |
| JWT Tokens | Client-side (browser localStorage) | Frontend JavaScript |

---

## 🆘 Troubleshooting

### "Can't connect to MongoDB"
```bash
# Check if MongoDB is running
Get-Service MongoDB

# Start MongoDB
net start MongoDB

# Or manually
mongod
```

### "Database not found"
```javascript
// MongoDB creates databases automatically
// Just insert data and it will be created
use faculty_publications
db.users.insertOne({ name: "Test" })
```

### "Cannot see data in Compass"
1. Make sure you're connected to `localhost:27017`
2. Select `faculty_publications` database
3. Refresh the collections view

---

## 📞 Summary

All your data is stored in:

1. **MongoDB Database**: `faculty_publications`
   - `users` - 👥 All user accounts
   - `publications` - 📚 All research papers
   - `activitylogs` - 📊 All system activity

2. **File System**: `backend/uploads/`
   - Temporary Excel/CSV uploads

**Best Way to View**: Download **MongoDB Compass** for a visual interface!

---

**Last Updated**: January 16, 2026  
**MongoDB Version**: Compatible with 4.x, 5.x, 6.x, 7.x  
**Database**: `faculty_publications`
