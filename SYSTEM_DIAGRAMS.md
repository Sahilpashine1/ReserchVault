# 📊 Faculty Publications Management System - Diagrams

This document contains the system flowchart and architecture block diagram for the Faculty Publications Management System.

---

## 🔄 System Flowchart

### Overview
This flowchart illustrates the complete user journey through the system, from login to logout, showing different paths based on user roles.

### Flow Description

#### 1. **Entry Point**
- User starts at the **Login/Registration** page
- Authentication is checked via JWT tokens

#### 2. **Role-Based Routing**
After successful authentication, the system checks the user's role and routes them accordingly:

##### **Faculty/User Role** (Default)
- Access: **My Publications Page**
- Available Actions:
  - ➕ Add new publications manually
  - 📤 Upload publications via CSV/Excel files
  - ✏️ Edit existing publications
  - 🗑️ Delete publications
  - 👁️ View all their publications
  - 💬 Chat with Academic Query Assistant

##### **Admin Viewer Role** (Read-Only Admin)
- Access: **All Publications (Read-Only)**
- Available Actions:
  - 👁️ View all faculty publications
  - 🔍 Search across all publications
  - No modification rights

##### **Super Admin Role** (Full Access)
- Access: **Admin Panel**
- Available Actions:
  - 👥 User Management (Create, Update, Delete, Change Roles)
  - 📊 View Activity Logs
  - 📁 Full CRUD access to all publications
  - 📈 System statistics

#### 3. **Activity Logging**
- **All user actions** are automatically logged to the database
- Includes: Login/Logout, Publication CRUD, User Management
- Logged data: User email, role, timestamp, IP address, action details

#### 4. **Exit Point**
- Users can logout from any page
- JWT token is removed, session ends

---

## 🏗️ System Architecture Block Diagram

### Three-Tier Architecture

### **Layer 1: Presentation/Frontend** 
**Technologies**: HTML5, CSS3, Vanilla JavaScript

#### Components:
1. **Login/Register Page** (`index.html`)
   - User authentication interface
   - Form validation
   - JWT token handling

2. **Dashboard Interface** (`dashboard.html`)
   - Notion-style table for publications
   - Add/Edit/Delete forms
   - Real-time search and filtering

3. **Admin Panel** (`admin.html`)
   - User management interface
   - Activity log viewer
   - System statistics

4. **Chatbot UI**
   - Rule-based query interface
   - Suggestion system
   - Response rendering

---

### **Layer 2: Application/Backend**
**Technologies**: Node.js, Express.js, JWT

#### Server Components:
1. **Node.js + Express Server**
   - RESTful API server
   - Request/response handling
   - CORS configuration

2. **JWT Authentication**
   - Token generation on login
   - Token verification middleware
   - Secure password hashing (bcrypt)

3. **Role-Based Access Control (RBAC)**
   - Role verification middleware
   - Permission checks
   - Access denial handling

#### API Routes:
1. **`/api/auth`** - Authentication
   - `POST /register` - User registration
   - `POST /login` - User login
   - `POST /google-login` - Google OAuth

2. **`/api/publications`** - Publication CRUD
   - `GET /` - Fetch publications (role-filtered)
   - `POST /` - Create publication
   - `PUT /:id` - Update publication
   - `DELETE /:id` - Delete publication
   - `POST /upload` - Bulk upload CSV/Excel

3. **`/api/chatbot`** - Query Processing
   - `POST /query` - Process natural language queries
   - `GET /suggestions` - Get query suggestions

4. **`/api/admin`** - User Management
   - `GET /users` - List all users
   - `POST /users` - Create user
   - `PUT /users/:id` - Update user/role
   - `DELETE /users/:id` - Delete user
   - `GET /logs` - View activity logs

#### Core Logic:
1. **Rule-Based Query Engine** (`queryEngine.js`)
   - Intent detection via keyword matching
   - Query processing algorithms
   - Response template generation
   - No AI/LLM - 100% explainable logic

2. **File Parser** (`fileParser.js`)
   - Excel/CSV file reading
   - Column mapping
   - Data validation
   - Error handling

3. **Activity Logger** (`activityLogger.js`)
   - Auto-logging middleware
   - Timestamp generation
   - IP address capture
   - Database insertion

---

### **Layer 3: Data/Database**
**Technology**: MongoDB

#### Collections:

1. **Users Collection**
   ```javascript
   {
     name: String,
     email: String (unique),
     password: String (hashed),
     department: String,
     role: String (user/admin_viewer/super_admin),
     createdAt: Date
   }
   ```

2. **Publications Collection**
   ```javascript
   {
     userId: ObjectId (reference),
     title: String,
     authors: String,
     year: Number,
     journalConference: String,
     keywords: String,
     abstract: String,
     publicationLink: String,
     createdDate: Date
   }
   ```

3. **Activity Logs Collection**
   ```javascript
   {
     userId: ObjectId (reference),
     userEmail: String,
     userRole: String,
     action: String,
     entityType: String,
     entityId: ObjectId,
     timestamp: Date,
     ipAddress: String,
     details: Object
   }
   ```

---

## 🔄 Data Flow

### User Registration/Login Flow:
```
User Input → Frontend Validation → API Request → Backend Validation → 
Password Hashing → Database Storage → JWT Token Generation → 
Frontend Storage (localStorage) → Dashboard Redirect
```

### Publication Management Flow:
```
User Action (Add/Edit/Delete) → Frontend Form → API Request → 
JWT Verification → Role Check → Database Operation → 
Activity Logging → Response to Frontend → UI Update
```

### Chatbot Query Flow:
```
User Query → Chatbot UI → API Request → Query Engine → 
Intent Detection → Keyword Matching → Database Retrieval → 
Algorithm Processing (Frequency Analysis, Filtering) → 
Template-based Response → Frontend Display
```

### File Upload Flow:
```
User Selects File → Frontend Upload → Multer Middleware → 
File Parser → Column Mapping → Validation → 
Bulk Database Insert → Activity Logging → 
Upload Report → UI Refresh
```

---

## 🔐 Security Architecture

### Authentication Layer:
1. **Password Security**: bcrypt hashing with salt rounds
2. **Token Management**: JWT with expiration
3. **Protected Routes**: Middleware verification on all API endpoints

### Authorization Layer:
1. **Role Verification**: Check user role before action
2. **Data Isolation**: Users see only their publications (except admins)
3. **Admin Privileges**: Elevated access with audit logging

### Audit Layer:
1. **Activity Logging**: All actions recorded
2. **Timestamp Tracking**: Every action has precise time
3. **IP Logging**: Track access locations
4. **Super Admin Oversight**: Full system visibility

---

## 📁 External Integrations

### File Uploads:
- **Supported Formats**: CSV, XLS, XLSX
- **Max Size**: 5MB
- **Processing**: Server-side parsing with validation
- **Storage**: Temporary upload folder, then database

### Future Integrations:
- Google Scholar API (for auto-import)
- ORCID integration
- Export to PDF/Word
- Email notifications

---

## 🎯 Key Design Decisions

### 1. **Rule-Based vs AI**
- ✅ Chose: **Rule-based query engine**
- Reason: Explainability, no external dependencies, academic requirement
- Algorithm: Keyword matching + frequency analysis + templates

### 2. **Monolithic vs Microservices**
- ✅ Chose: **Monolithic architecture**
- Reason: Simpler deployment, sufficient for scale, easier maintenance

### 3. **SQL vs NoSQL**
- ✅ Chose: **MongoDB (NoSQL)**
- Reason: Flexible schema, JSON-native, easier for changing requirements

### 4. **Session vs Token Auth**
- ✅ Chose: **JWT Tokens**
- Reason: Stateless, scalable, works with deployed frontend/backend separation

### 5. **Frontend Framework**
- ✅ Chose: **Vanilla JavaScript**
- Reason: No build process, faster loading, educational clarity

---

## 📊 System Metrics

### Performance Targets:
- **Page Load**: < 2 seconds
- **API Response**: < 500ms
- **File Upload**: < 5 seconds (for 1000 rows)
- **Search**: Real-time (< 100ms)

### Scalability:
- **Users**: Supports up to 1000 faculty members
- **Publications**: Unlimited (MongoDB scales horizontally)
- **Concurrent Users**: 50+ simultaneous users

### Security:
- **Authentication**: JWT expiration (24 hours)
- **Password**: Minimum 6 characters (customizable)
- **Logging**: 100% action coverage

---

## 🚀 Deployment Architecture

### Local Development:
```
Frontend: http://localhost:5000 (served by Express)
Backend: http://localhost:5000/api
Database: mongodb://localhost:27017
```

### Cloud Deployment:
```
Frontend: Vercel (https://your-app.vercel.app)
Backend: Render (https://your-api.onrender.com)
Database: MongoDB Atlas (Cloud cluster)
```

---

## 📝 Summary

This Faculty Publications Management System uses a **clean three-tier architecture** with:
- **Frontend**: Modern, responsive UI with vanilla JavaScript
- **Backend**: RESTful Node.js API with comprehensive middleware
- **Database**: MongoDB for flexible, scalable data storage

The system supports **three distinct user roles** with appropriate access controls, maintains **complete audit logs**, and uses **100% explainable rule-based algorithms** for query processing.

**Built for**: Academic institutions requiring transparent, maintainable publication management.
**Ready for**: College demos, vivas, and real-world faculty use.

---

**Document Created**: 2026-01-23  
**Version**: 1.0  
**For**: Synopsis and Project Documentation
