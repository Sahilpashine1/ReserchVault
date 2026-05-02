# 📚 ResearchVault: Faculty Publications Management System

![GitHub repo size](https://img.shields.io/github/repo-size/Sahilpashine1/ReserchVault?style=flat-square)
![GitHub open issues](https://img.shields.io/github/issues/Sahilpashine1/ReserchVault?style=flat-square)
![GitHub stars](https://img.shields.io/github/stars/Sahilpashine1/ReserchVault?style=flat-square)
![GitHub license](https://img.shields.io/github/license/Sahilpashine1/ReserchVault?style=flat-square)

**College Project by [Sahilpashine1](https://github.com/Sahilpashine1)**

A full-stack web application for faculty members to manage, store, and query their research publications using a Notion-style table interface and an intelligent rule-based Academic Query Assistant.

[**Explore the Repository on GitHub**](https://github.com/Sahilpashine1/ReserchVault) \| [**Report Bug**](https://github.com/Sahilpashine1/ReserchVault/issues) \| [**Request Feature**](https://github.com/Sahilpashine1/ReserchVault/issues)

## 🎯 Project Overview

This system enables faculty members to:
- **Store & Manage** publications in a clean spreadsheet-style interface
- **Upload** Excel/CSV files for bulk import
- **Query** their publications using an explainable, rule-based chatbot
- **Analyze** research output with dynamic summaries and insights

### 🔐 NEW: Role-Based Access Control & Activity Logging

This system now includes comprehensive security and monitoring features:
- **Three User Roles**: User (Faculty), Admin Viewer, Super Admin
- **Activity Logging**: Complete audit trail of all user actions
- **User Management**: Full admin dashboard for user administration
- **Access Control**: Role-based permissions on all endpoints

### ⚠️ Important: NO AI/LLM Used
This system uses **100% explainable, rule-based algorithms** for query processing. No black-box AI, no external APIs, just transparent logic based on:
- Keyword matching and frequency analysis
- Intent detection through pattern recognition
- Template-based response generation
- Statistical aggregation and filtering

## ✨ Key Features

### 1. **Notion-Inspired Table Interface**
- Clean, minimalist academic design
- Inline editing capabilities
- Real-time search and filtering
- Multi-column sorting
- Responsive design for all devices

### 2. **Dual Data Entry Methods**
#### Option A: Manual Entry
- User-friendly form with validation
- Instant table updates
- Edit/delete functionality

#### Option B: Excel/CSV Upload
- Drag-and-drop file upload
- Automatic column mapping
- Data validation with error reporting
- Bulk import with progress tracking

### 3. **Academic Query Assistant (Chatbot)**
A rule-based chatbot that answers queries using explainable logic:

**Supported Queries:**
- "Give me a summary of my publications"
- "What are my main research areas?"
- "How many papers after 2022?"
- "List journals where I published most"
- "Open my latest publication link"
- "Show publications without links"

**Algorithm Workflow:**
1. Intent Detection → Keyword matching
2. Data Retrieval → Database query
3. Processing → Frequency analysis, filtering, aggregation
4. Response Generation → Template-based formatting

### 4. **Dynamic Summary Generation**
On-demand summary creation using:
- Publication count analysis
- Keyword frequency ranking
- Temporal distribution analysis
- Venue popularity calculation
- Professional academic sentence templates

### 5. **🔐 Role-Based Access Control (RBAC)**
Three-tier access control system:

#### User (Faculty) - Default Role
- Access only own publications
- Full CRUD on own data
- Cannot access admin features

#### Admin Viewer - Read-Only Admin
- View all faculty profiles and publications
- Search across all data
- Cannot add, edit, or delete data
- No access to activity logs

#### Super Admin - Full System Access
- User management (create, update, delete, change roles)
- View activity/audit logs
- Filter and export logs
- Full CRUD on all publications
- System statistics and analytics

### 6. **📊 Activity & Audit Logging**
Comprehensive monitoring of all system actions:
- **Authentication Events**: Login, logout with timestamps
- **Publication Events**: View, add, edit, delete, upload
- **User Management Events**: Create, update, role changes
- **Log Details**: User email, role, timestamp, IP address, entity details
- **Filtering**: By user, role, date range, action type
- **Export**: CSV export for audit compliance
- **Access**: Super Admin only

## 🛠️ Technology Stack

### Backend
- **Framework**: Node.js + Express.js
- **Database**: MongoDB
- **Authentication**: JWT (JSON Web Tokens)
- **File Processing**: Multer, XLSX, CSV-Parser
- **Security**: bcryptjs, CORS

### Frontend
- **Core**: HTML5, CSS3, Vanilla JavaScript
- **Fonts**: Google Fonts (Inter, Playfair Display)
- **Design**: Modern gradient UI with smooth animations
- **Responsive**: Mobile-first approach

## 📁 Project Structure

```
faculty-publications/
├── backend/
│   ├── config/
│   │ └── db.js              # MongoDB connection
│   ├── models/
│   │   ├── User.js            # User schema (with roles)
│   │   ├── Publication.js     # Publication schema
│   │   └── ActivityLog.js     # Activity logging schema ⭐ NEW
│   ├── routes/
│   │   ├── auth.js            # Authentication routes
│   │   ├── publications.js    # CRUD operations (role-based)
│   │   ├── chatbot.js         # Query processing
│   │   └── admin.js           # User management & logs ⭐ NEW
│   ├── middleware/
│   │   ├── auth.js            # JWT verification
│   │   ├── authorize.js       # Role checking ⭐ NEW
│   │   └── activityLogger.js  # Activity logging ⭐ NEW
│   ├── utils/
│   │   ├── queryEngine.js     # Rule-based query engine
│   │   ├── fileParser.js      # Excel/CSV parser
│   │   └── roleChecker.js     # Role assignment logic ⭐ NEW
│   ├── uploads/               # Temporary file storage
│   ├── server.js              # Main server file
│   ├── package.json
│   └── .env                   # Environment variables (admin emails)
├── frontend/
│   ├── css/
│   │   └── style.css          # All styles
│   ├── js/
│   │   ├── auth.js            # Authentication logic
│   │   ├── table.js           # Table management
│   │   └── chatbot.js         # Chatbot interface
│   ├── index.html             # Login/Register page
│   └── dashboard.html         # Main application
├── README.md
├── ADMIN_GUIDE.md                    # Administrator documentation ⭐ NEW
├── IMPLEMENTATION_PLAN_RBAC.md       # RBAC implementation plan ⭐ NEW
├── RBAC_IMPLEMENTATION_SUMMARY.md    # Implementation summary ⭐ NEW
└── RBAC_TESTING_GUIDE.md             # Testing guide ⭐ NEW
```

## 🚀 Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (running locally or MongoDB Atlas)
- npm or yarn

### Step 1: Install Backend Dependencies
```bash
cd backend
npm install
```

### Step 2: Configure Environment
Edit `backend/.env`:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/faculty_publications
JWT_SECRET=your_secret_key_here

# 🔐 Role-Based Access Control Configuration
# IMPORTANT: First Super Admin must be configured here
# After that, Super Admin can create/promote other admin users via Admin Panel
SUPER_ADMIN_EMAIL=admin@college.edu
```

**⚠️ IMPORTANT - New Role Assignment Workflow (Secure)**:

1. **All New Registrations** → Automatically assigned **"user"** (Faculty) role
   - No one can self-assign admin privileges
   - Most secure approach
   
2. **First Super Admin** → Must register with email matching `SUPER_ADMIN_EMAIL` in `.env`
   - Example: If `.env` has `SUPER_ADMIN_EMAIL=admin@college.edu`
   - Register with that email = automatic Super Admin role
   
3. **Creating Admin Accounts** → Only Super Admin can create/promote:
   - Super Admin logs into **Admin Panel** (admin.html)
   - Can create new users and assign any role
   - Can promote existing users to Admin Viewer or Super Admin
   - All changes are logged in Activity Logs

4. **Requesting Admin Access** → Users follow this workflow:
   - User registers normally (gets "user" role)
   - User contacts Super Admin requesting admin access
   - Super Admin verifies and changes role via Admin Panel
   - User logs in again with new permissions


### Step 3: Start MongoDB
Make sure MongoDB is running on your system:
```bash
# Windows (if installed as service)
net start MongoDB

# Or using mongod directly
mongod
```

### Step 4: Start Backend Server
```bash
cd backend
npm start
# or for development with auto-reload:
npm run dev
```

You should see:
```
✅ MongoDB Connected Successfully
╔════════════════════════════════════════════════╗
║   Faculty Publications Management System      ║
║   Server running on port 5000                 ║
╚════════════════════════════════════════════════╝
```

### Step 5: Access the Application
Open your browser and navigate to:
```
http://localhost:5000
```

## 📊 Database Schema

### Publication Collection
```javascript
{
  userId: ObjectId,           // Reference to User
  title: String,              // Publication title
  authors: String,            // Author names (comma-separated)
  year: Number,               // Publication year
  journalConference: String,  // Venue name
  keywords: String,           // Keywords (comma-separated)
  abstract: String,           // Abstract text
  publicationLink: String,    // URL to publication
  createdDate: Date          // Auto-generated timestamp
}
```

### User Collection
```javascript
{
  name: String,
  email: String,             // Unique
  password: String,          // Hashed
  department: String,
  createdAt: Date
}
```

## 📋 Excel/CSV Template

When uploading files, use these **exact column headers** (case-insensitive):

| Title | Authors | Year | Journal/Conference | Keywords | Abstract | Link |
|-------|---------|------|--------------------|----------|----------|------|
| Sample Title | Author 1, Author 2 | 2023 | IEEE Conference | AI, ML | Abstract text... | https://... |

**Required Columns**: Title, Authors, Year, Journal/Conference, Keywords  
**Optional Columns**: Abstract, Link

## 🤖 Chatbot Query Engine Algorithm

### Intent Detection
```javascript
Keywords → Intent Mapping
"summary" → generateSummary()
"research area" → identifyResearchAreas()
"after", "year" → filterByTime()
"journal", "venue" → analyzeJournals()
```

### Summary Generation Algorithm
1. **Count Publications**: Total papers
2. **Extract Keywords**: Split by comma, normalize
3. **Frequency Analysis**: Count keyword occurrences
4. **Temporal Analysis**: Recent vs older papers
5. **Venue Analysis**: Most published journals
6. **Template Generation**: Professional sentences

Example Output:
```
📊 Faculty Publication Summary

Total Publications: 15 papers (2018 - 2024)

Primary Research Areas: machine learning (40%), 
deep learning (33%), computer vision (27%)

Recent Activity: 8 publications in the last 3 years, 
indicating active research productivity.

Key Publication Venues: IEEE Transactions on Neural Networks 
and ACM Computing Surveys.
```

## 🎨 UI Design Philosophy

### Color Palette
- **Primary**: Navy Blue (#1e3a5f) - Academic authority
- **Accent**: Teal (#14b8a6) - Modern innovation
- **Gold**: (#d4af37) - Excellence highlighting

### Typography
- **Headers**: Playfair Display (serif) - Traditional academic
- **Body**: Inter (sans-serif) - Modern readability

### Animations
- Smooth transitions (250ms ease-in-out)
- Fade-in effects for modals
- Hover states for interactivity
- Message slide-in animations

## 🧪 Testing Guide

### Test Scenario 1: User Registration
1. Go to http://localhost:5000
2. Click "Create one now"
3. Fill in: Name, Email, Department, Password
4. Click "Create Account"
5. ✅ Should redirect to dashboard

### Test Scenario 2: Manual Publication Entry
1. Click "➕ Add Publication"
2. Fill in all required fields
3. Click "Save Publication"
4. ✅ Should appear in table immediately

### Test Scenario 3: Excel Upload
1. Create Excel file with template columns
2. Click "📤 Upload Excel/CSV"
3. Drag and drop or browse for file
4. ✅ See upload progress and results

### Test Scenario 4: Chatbot Queries
1. Click "💬 Academic Assistant"
2. Type: "Give me a summary of my publications"
3. ✅ Receive formatted summary with statistics
4. Try other queries (research areas, year filters, etc.)

### Test Scenario 5: Search & Filter
1. Type in search box: "machine learning"
2. ✅ Table filters in real-time
3. Change sort dropdown
4. ✅ Table reorders

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Publications
- `GET /api/publications` - Get all user's publications
- `POST /api/publications` - Create new publication
- `PUT /api/publications/:id` - Update publication
- `DELETE /api/publications/:id` - Delete publication
- `POST /api/publications/upload` - Upload Excel/CSV

### Chatbot
- `POST /api/chatbot/query` - Process query
- `GET /api/chatbot/suggestions` - Get suggested queries

## 🔒 Security Features

- ✅ Password hashing with bcryptjs
- ✅ JWT token authentication
- ✅ Protected API routes
- ✅ Input validation and sanitization
- ✅ XSS prevention
- ✅ CORS configuration
- ✅ File type validation
- ✅ File size limits (5MB)

## 🎓 Academic Standards Compliance

✅ **Explainable Algorithm**: All logic is transparent and documented  
✅ **Domain-Specific**: Tailored for academic publication management  
✅ **No External AI**: 100% rule-based processing  
✅ **Professional UI**: Clean, academic design  
✅ **Well-Documented**: Comprehensive code comments  
✅ **Demonstration-Ready**: Easy setup and clear features  
✅ **Viva-Ready**: Clear architectural decisions

## 📝 Sample Queries & Expected Responses

| Query | Response Type |
|-------|---------------|
| "Give me a summary of my publications" | Comprehensive overview with statistics |
| "What are my main research areas?" | Ranked list of keywords with percentages |
| "How many papers after 2020?" | Filtered list with count |
| "List journals where I published most" | Journal frequency analysis |
| "Show my latest publication link" | Most recent paper with link |
| "Show publications without links" | List of papers missing URLs |

## 🐛 Troubleshooting

### MongoDB Connection Error
```
Error: MongoDB connection failed
Solution: Ensure MongoDB is running on port 27017
```

### Port Already in Use
```
Error: Port 5000 is already in use
Solution: Change PORT in .env file or kill process using port 5000
```

### File Upload Fails
```
Error: File upload failed
Solution: Check file format (.xlsx, .xls, .csv) and size (<5MB)
```

### Chatbot Not Responding
```
Error: Connection error
Solution: Ensure backend server is running on port 5000
```

## 🌐 Deployment (Team Access from Anywhere)

### For Local Network Only
If your team is on the same WiFi, you can run the backend on `0.0.0.0` instead of `localhost`.

### For Remote Team Access (Recommended)
If your team is **not on the same WiFi**, you need to deploy to the cloud:

#### 📚 Deployment Guides Available:
- **`TEAM_ACCESS_SETUP.md`** - Start here! Overview of what you need
- **`DEPLOYMENT_QUICKSTART.md`** - 30-minute fast track guide
- **`DEPLOYMENT_GUIDE.md`** - Complete step-by-step instructions
- **`DEPLOYMENT_CHECKLIST.md`** - Track your deployment progress

#### ☁️ Recommended Stack (All FREE):
| Component | Service | Cost |
|-----------|---------|------|
| Database | MongoDB Atlas | Free (512 MB) |
| Backend API | Render | Free (750 hrs/month) |
| Frontend | Vercel | Free (Unlimited) |

#### 🎯 After Deployment:
- Frontend URL: `https://your-app.vercel.app`
- Backend API: `https://your-api.onrender.com`
- Team can access from anywhere with internet!

#### 📖 Quick Start:
1. Read `TEAM_ACCESS_SETUP.md` for overview
2. Follow `DEPLOYMENT_GUIDE.md` for step-by-step instructions
3. Use `DEPLOYMENT_CHECKLIST.md` to track progress
4. Share the Vercel URL with your team!

**Time Required**: ~30-45 minutes for first deployment

---

## 🚀 Future Enhancements

- [ ] Export publications to PDF/Word
- [ ] Citation format generation (APA, MLA, Chicago)
- [ ] Collaboration features (share with colleagues)
- [ ] Publication impact metrics
- [ ] Advanced visualization (charts, graphs)
- [ ] Email notifications
- [ ] Dark mode toggle

## 👨‍💻 Developer Notes

### Adding New Query Intents
1. Add keywords to `detectIntent()` in `queryEngine.js`
2. Create handler function
3. Add to switch case in `processQuery()`
4. Test with sample data

### Adding New Table Columns
1. Update `Publication` model in `backend/models/Publication.js`
2. Modify table HTML in `dashboard.html`
3. Update form in modal
4. Adjust `renderPublications()` in `table.js`

## 📄 License

This project is created for academic purposes as part of a college project.

## 🙏 Acknowledgments

- Modern web design principles
- Academic research management best practices
- Open-source community for tools and libraries

---

## 💡 Quick Start Commands

```bash
# Start MongoDB
net start MongoDB

# Start Backend (in backend folder)
npm start

# Access Application
Open http://localhost:5000
```

---

**Built with ❤️ for Faculty Members**
**Ready for College Demo & Viva** ✨
