# 📋 Project Requirements - Faculty Publications Management System

## 5. Project Requirements

This document outlines the complete requirements for developing and deploying the Faculty Publications Management System.

---

## 🖥️ 1. Hardware Requirements

### Development Environment (Minimum)
| Component | Specification | Purpose |
|-----------|--------------|---------|
| **Processor** | Intel Core i3 / AMD Ryzen 3 (or equivalent) | Code compilation and development |
| **RAM** | 4 GB minimum (8 GB recommended) | Running MongoDB, Node.js, and IDE simultaneously |
| **Storage** | 10 GB free disk space | Project files, dependencies, database storage |
| **Display** | 1366 x 768 resolution minimum | UI development and testing |
| **Network Card** | Ethernet or WiFi adapter | Internet access for packages and deployment |

### Development Environment (Recommended)
| Component | Specification | Purpose |
|-----------|--------------|---------|
| **Processor** | Intel Core i5 / AMD Ryzen 5 or better | Faster development and testing |
| **RAM** | 8-16 GB | Smooth multitasking |
| **Storage** | 256 GB SSD | Fast read/write operations |
| **Display** | 1920 x 1080 (Full HD) | Better UI design experience |

### Production Server (For Local Deployment)
| Component | Specification | Purpose |
|-----------|--------------|---------|
| **Server/PC** | Any modern computer | Host the application |
| **RAM** | 2 GB minimum | Run backend and database |
| **Storage** | 20-50 GB | Database growth over time |
| **Network** | Stable internet/LAN connection | Remote access for faculty |

### Cloud Deployment (No Hardware Needed)
✅ **Zero hardware cost** - Uses cloud services (Render, Vercel, MongoDB Atlas)

---

## 💻 2. Software Requirements

### A. Operating System
| OS | Version | Status |
|----|---------|--------|
| **Windows** | 10 / 11 | ✅ Fully Supported |
| **macOS** | 10.14 or later | ✅ Fully Supported |
| **Linux** | Ubuntu 18.04+ / Debian / Fedora | ✅ Fully Supported |

### B. Runtime Environment
| Software | Version | Purpose | Cost |
|----------|---------|---------|------|
| **Node.js** | v14.x or higher (LTS recommended) | JavaScript runtime for backend | **FREE** |
| **npm** | v6.x or higher (comes with Node.js) | Package manager | **FREE** |
| **MongoDB** | v4.4 or higher | Database system | **FREE** |

✅ **Installation Links**:
- Node.js: https://nodejs.org/
- MongoDB: https://www.mongodb.com/try/download/community

### C. Development Tools

#### Essential (Required)
| Tool | Purpose | Cost |
|------|---------|------|
| **Code Editor** (VS Code / Sublime / Atom) | Writing and editing code | **FREE** |
| **Git** | Version control | **FREE** |
| **Web Browser** (Chrome / Firefox / Edge) | Testing and debugging | **FREE** |
| **Postman** or **Thunder Client** | API testing | **FREE** |

#### Optional (Recommended)
| Tool | Purpose | Cost |
|------|---------|------|
| **MongoDB Compass** | Database GUI | **FREE** |
| **Nodemon** | Auto-restart server on changes | **FREE** |
| **GitHub Desktop** | Visual Git interface | **FREE** |

### D. Libraries & Frameworks (NPM Packages)

#### Backend Dependencies
```json
{
  "express": "^4.18.2",           // Web framework
  "mongoose": "^7.0.0",           // MongoDB ODM
  "bcryptjs": "^2.4.3",           // Password hashing
  "jsonwebtoken": "^9.0.0",       // JWT authentication
  "cors": "^2.8.5",               // Cross-origin requests
  "dotenv": "^16.0.3",            // Environment variables
  "multer": "^1.4.5-lts.1",       // File upload handling
  "xlsx": "^0.18.5",              // Excel file parsing
  "csv-parser": "^3.0.0",         // CSV file parsing
  "express-validator": "^7.0.1"   // Input validation
}
```

#### Dev Dependencies
```json
{
  "nodemon": "^2.0.22"            // Auto-restart server
}
```

💰 **Total Cost**: **₹0 (FREE)** - All packages are open-source

### E. Web Technologies
| Technology | Purpose | Knowledge Required |
|------------|---------|-------------------|
| **HTML5** | Structure and markup | Basic |
| **CSS3** | Styling and design | Basic-Intermediate |
| **JavaScript (ES6+)** | Frontend logic | Intermediate |
| **Node.js** | Backend development | Intermediate |
| **MongoDB** | Database management | Basic |
| **RESTful APIs** | Client-server communication | Intermediate |

### F. Chatbot & Query Processing Technology

⚠️ **IMPORTANT: NO AI/LLM/Machine Learning Used**

This system uses **100% Rule-Based, Explainable Algorithms** for the Academic Query Assistant chatbot.

#### Algorithm Type
| Technology | Description | Cost |
|------------|-------------|------|
| **Rule-Based Query Engine** | Custom-built keyword matching and pattern recognition | **FREE** (Custom code) |
| **Frequency Analysis** | Statistical counting and sorting algorithms | **FREE** (Built-in JavaScript) |
| **Template-Based Generation** | Pre-defined response templates | **FREE** (Custom code) |

#### Why NO AI/LLM?
| Reason | Explanation |
|--------|-------------|
| **✅ Explainability** | Every response can be traced to specific rules and logic |
| **✅ Academic Requirement** | Project requires transparent, non-black-box algorithms |
| **✅ No External Dependencies** | No API calls to OpenAI, Google, etc. |
| **✅ Zero Cost** | No API usage fees or subscriptions |
| **✅ Data Privacy** | All data stays within the system |
| **✅ Viva-Ready** | Can explain exact algorithm steps |

#### Processing Pipeline
```
User Query → Keyword Extraction → Intent Detection → 
Data Retrieval (MongoDB) → Algorithm Processing → 
Template Selection → Response Generation → Display
```

#### Core Algorithms Used

**1. Intent Detection Algorithm**
- **Technology**: String matching + RegEx
- **Libraries**: Native JavaScript (String methods, includes(), match())
- **Cost**: FREE
- **How it works**: Matches keywords like "summary", "research areas", "year", "journal" to determine user intent

**2. Frequency Analysis Algorithm**
- **Technology**: HashMap/Object counting
- **Libraries**: Native JavaScript (Map, Object, Array methods)
- **Cost**: FREE
- **How it works**: Counts keyword occurrences, sorts by frequency, calculates percentages

**3. Temporal Analysis Algorithm**
- **Technology**: Date filtering and grouping
- **Libraries**: Native JavaScript (Date object, filter(), reduce())
- **Cost**: FREE
- **How it works**: Filters publications by year ranges, calculates trends

**4. Aggregation Algorithm**
- **Technology**: Array reduction and grouping
- **Libraries**: Native JavaScript (reduce(), groupBy patterns)
- **Cost**: FREE
- **How it works**: Groups publications by venue, author, year, etc.

**5. Response Generation Algorithm**
- **Technology**: Template strings with dynamic insertion
- **Libraries**: Native JavaScript (Template literals)
- **Cost**: FREE
- **How it works**: Fills pre-written sentence templates with calculated data

#### Example Query Processing

**User Query**: "Give me a summary of my publications"

**Step-by-Step Processing**:
1. **Keyword Extraction**: ["summary", "publications"]
2. **Intent Detected**: GENERATE_SUMMARY
3. **Data Retrieval**: Fetch all user's publications from MongoDB
4. **Algorithms Applied**:
   - Count total publications
   - Extract and count all keywords (frequency analysis)
   - Group publications by year (temporal analysis)
   - Identify most common journals (aggregation)
5. **Template Selection**: Summary template chosen
6. **Response Generation**: 
   ```
   📊 Faculty Publication Summary
   Total Publications: 15 papers (2018 - 2024)
   Primary Research Areas: machine learning (40%), 
   deep learning (33%), computer vision (27%)
   Recent Activity: 8 publications in the last 3 years
   ```

#### Technologies Used for Chatbot
| Component | Technology | Library/Framework | Cost |
|-----------|------------|-------------------|------|
| **Query Parsing** | JavaScript String Methods | Native | **FREE** |
| **Intent Detection** | Keyword Matching + RegEx | Native | **FREE** |
| **Data Processing** | Array/Object Manipulation | Native JS (map, filter, reduce) | **FREE** |
| **Frequency Analysis** | Counting Algorithms | Native JS (Map, Object) | **FREE** |
| **Response Templates** | Template Literals | ES6 Template Strings | **FREE** |
| **Frontend UI** | Vanilla JavaScript | DOM Manipulation | **FREE** |

#### Supported Query Types
| Query Category | Example | Algorithm Used |
|----------------|---------|----------------|
| **Summary** | "Give me a summary" | Aggregation + Frequency + Templates |
| **Research Areas** | "What are my research areas?" | Keyword Frequency Analysis |
| **Temporal** | "Papers after 2020" | Date Filtering + Sorting |
| **Venue Analysis** | "Top journals I published in" | Grouping + Counting + Sorting |
| **Links** | "Show my latest publication link" | Sorting (by date) + Filtering |
| **Filtering** | "Publications without links" | Boolean Filtering |

#### Technical Implementation Files
| File | Purpose | Technology |
|------|---------|------------|
| **`backend/utils/queryEngine.js`** | Core query processing logic | Node.js, JavaScript algorithms |
| **`frontend/js/chatbot.js`** | Chatbot UI and interaction | Vanilla JavaScript |
| **`backend/routes/chatbot.js`** | API endpoints for queries | Express.js |

#### Academic Compliance
✅ **100% Transparent**: Every step is documented and explainable  
✅ **No Black Box**: All logic is visible in source code  
✅ **No External AI**: No calls to OpenAI, Google AI, or any LLM service  
✅ **Reproducible**: Same query always produces same result  
✅ **Testable**: Can verify algorithm correctness manually  
✅ **Educational**: Perfect for academic demonstration and viva  

#### Advantages of Rule-Based Approach
| Advantage | Benefit |
|-----------|---------|
| **Predictable** | Always produces consistent, expected results |
| **Fast** | No API latency or processing delays |
| **Private** | Data never leaves the system |
| **Free** | No usage costs or rate limits |
| **Explainable** | Can show exact logic in viva/presentation |
| **Reliable** | No dependency on external service availability |

💰 **Total Cost for Chatbot Technology**: **₹0 (FREE)** - Pure algorithmic implementation

---

## 🌐 3. Communication & Network Requirements

### A. Internet Connectivity
| Purpose | Bandwidth | Requirement |
|---------|-----------|-------------|
| **Development** | 2-5 Mbps | Download packages, documentation |
| **Cloud Deployment** | 5-10 Mbps | Upload code, deploy services |
| **Production (Local)** | 1-2 Mbps per user | LAN/WiFi access for faculty |
| **Production (Cloud)** | N/A | Users access via internet |

### B. Network Infrastructure
| Component | Specification | Purpose |
|-----------|--------------|---------|
| **Router/WiFi** | Standard home/office router | Local network access |
| **Domain Name** (Optional) | Custom domain | Professional deployment |
| **SSL Certificate** | Let's Encrypt (Free) | HTTPS encryption |

### C. Communication Tools (For Development Team)
| Tool | Purpose | Cost |
|------|---------|------|
| **Slack / Microsoft Teams** | Team communication | **FREE** |
| **GitHub** | Code collaboration | **FREE** |
| **Email** | Stakeholder communication | **FREE** |
| **Google Meet / Zoom** | Video meetings | **FREE** (limited) |

---

## 💰 4. Budget Breakdown

### Option A: Local Deployment (Free)
| Item | Cost | Notes |
|------|------|-------|
| Hardware | ₹0 | Use existing computer |
| Software & Tools | ₹0 | All open-source |
| MongoDB (Local) | ₹0 | Community edition |
| Node.js & npm | ₹0 | Open-source |
| Internet | ₹300-500/month | Existing connection |
| **Total Setup Cost** | **₹0** | One-time |
| **Monthly Cost** | **₹300-500** | Internet only |

### Option B: Cloud Deployment (Free Tier)
| Service | Free Tier Limits | Cost | Upgrade Cost |
|---------|-----------------|------|--------------|
| **MongoDB Atlas** | 512 MB storage | **FREE** | $9/month (10GB) |
| **Render** (Backend) | 750 hrs/month | **FREE** | $7/month (always-on) |
| **Vercel** (Frontend) | Unlimited deployments | **FREE** | $20/month (Pro) |
| **Domain Name** (Optional) | N/A | ₹99-500/year | Optional |
| **SSL Certificate** | Let's Encrypt | **FREE** | Included |
| **Total Setup Cost** | **₹0** | For 1 year |
| **Monthly Cost** | **₹0** | Free tier sufficient |

### Option C: Paid Cloud Deployment (Production)
| Service | Specification | Monthly Cost (USD) | Monthly Cost (INR) |
|---------|--------------|-------------------|-------------------|
| **MongoDB Atlas** | 2 GB storage | $9 | ₹750 |
| **Render** | Always-on instance | $7 | ₹580 |
| **Vercel** | Pro plan (optional) | $20 | ₹1,650 |
| **Domain** | .com/.in domain | $1/month (yearly) | ₹80 |
| **Total** |  | **$37/month** | **₹3,060/month** |

### Budget Summary
| Deployment Type | Setup Cost | Monthly Cost | Best For |
|----------------|------------|--------------|----------|
| **Local Only** | ₹0 | ₹300-500 | Single campus, no remote access |
| **Cloud Free** | ₹0 | ₹0 | College project, small team |
| **Cloud Paid** | ₹500-1000 | ₹3,000-5,000 | Production, large institution |

💡 **Recommendation**: Start with **Cloud Free Tier** - upgrade only when needed.

---

## 🏢 5. Facilities Required

### A. Development Facility
| Facility | Requirement | Purpose |
|----------|-------------|---------|
| **Workspace** | Desk with chair, power outlet | Developer workstation |
| **Lighting** | Adequate room lighting | Reduce eye strain |
| **Cooling** | Fan/AC (summer) | Computer cooling |
| **Power Backup** (Optional) | UPS/Inverter | Prevent data loss |

### B. Software Development Lab (Academic Setting)
| Facility | Specification | Purpose |
|----------|--------------|---------|
| **Computers** | 10-20 workstations | Student development |
| **Server Room** (Optional) | Climate-controlled | Host production server |
| **Projector/Display** | For presentations | Demo and viva |
| **Whiteboard** | Planning and diagrams | System design |

### C. Deployment Facility

#### Local Deployment
| Facility | Requirement | Purpose |
|----------|-------------|---------|
| **Dedicated PC/Server** | Always-on computer | Host application 24/7 |
| **Static IP** (Optional) | From ISP | Remote access |
| **Network Setup** | Router, LAN cables | Connect users |
| **Backup System** | External HDD/Cloud | Data backup |

#### Cloud Deployment
| Facility | Requirement | Purpose |
|----------|-------------|---------|
| **Internet Connection** | Stable 5+ Mbps | Deploy and monitor |
| **Email Account** | For service signups | Cloud service accounts |
| **Credit Card** (Optional) | For paid tiers | Premium features |

---

## 👥 6. Human Resources

### Development Team (Minimum)
| Role | Count | Responsibilities |
|------|-------|------------------|
| **Full-Stack Developer** | 1 | Backend + Frontend + Database |
| **UI/UX Designer** (Optional) | 1 | Interface design |
| **Project Guide** | 1 | Guidance and review |

### Development Team (Recommended)
| Role | Count | Responsibilities |
|------|-------|------------------|
| **Backend Developer** | 1 | Node.js API development |
| **Frontend Developer** | 1 | UI/UX implementation |
| **Database Administrator** | 1 | MongoDB management |
| **Tester** | 1 | Testing and QA |
| **Project Manager** | 1 | Coordination and planning |

### Skill Requirements
| Team Member | Skills Required |
|------------|----------------|
| **Developer** | JavaScript, Node.js, MongoDB, HTML/CSS, REST APIs |
| **Tester** | Manual testing, API testing (Postman) |
| **Designer** | CSS, UI design principles, color theory |

---

## 📚 7. Documentation & Training Requirements

### Development Phase
| Document | Purpose | Format |
|----------|---------|--------|
| **README.md** | Project overview | Markdown |
| **API Documentation** | Endpoint reference | Markdown/Postman |
| **User Guide** | Faculty instructions | PDF/Markdown |
| **Admin Guide** | Admin panel usage | PDF/Markdown |

### Deployment Phase
| Document | Purpose | Format |
|----------|---------|--------|
| **Deployment Guide** | Setup instructions | Markdown |
| **Troubleshooting Guide** | Common issues | Markdown |
| **Maintenance Manual** | Updates and backups | PDF |

### Training Materials
| Material | Audience | Duration |
|----------|----------|----------|
| **Faculty Training** | End users | 30-60 minutes |
| **Admin Training** | Super admins | 1-2 hours |
| **Developer Handover** | Future maintainers | 2-4 hours |

---

## 🔒 8. Security & Compliance Requirements

### Software Security
| Requirement | Implementation | Cost |
|-------------|----------------|------|
| **HTTPS/SSL** | Let's Encrypt | **FREE** |
| **Password Hashing** | bcryptjs library | **FREE** |
| **JWT Authentication** | jsonwebtoken library | **FREE** |
| **Input Validation** | express-validator | **FREE** |
| **CORS Protection** | CORS middleware | **FREE** |

### Data Security
| Requirement | Solution | Cost |
|-------------|----------|------|
| **Database Backup** | MongoDB Atlas auto-backup | **FREE** (Atlas) |
| **Data Encryption** | MongoDB encryption at rest | Included |
| **Access Control** | Role-based permissions | Built-in |
| **Activity Logging** | Custom audit logs | Built-in |

### Compliance (Academic Setting)
| Aspect | Requirement | Status |
|--------|-------------|--------|
| **Data Privacy** | User consent for data storage | ✅ Implemented |
| **Access Logs** | Activity tracking | ✅ Implemented |
| **Role Separation** | RBAC system | ✅ Implemented |
| **Backup Policy** | Regular backups | ✅ Recommended |

---

## ⏱️ 9. Time Requirements

### Development Timeline
| Phase | Duration | Activities |
|-------|----------|-----------|
| **Planning & Design** | 1-2 weeks | Requirements, architecture, UI mockups |
| **Backend Development** | 2-3 weeks | API, database, authentication |
| **Frontend Development** | 2-3 weeks | UI, forms, tables, chatbot |
| **Integration** | 1 week | Connect frontend to backend |
| **Testing** | 1-2 weeks | Unit, integration, user testing |
| **Deployment** | 2-3 days | Cloud setup and configuration |
| **Documentation** | 1 week | Guides, manuals, README |
| **Total** | **8-12 weeks** | Complete project |

### Maintenance Timeline
| Activity | Frequency | Duration |
|----------|-----------|----------|
| **Bug Fixes** | As needed | 1-4 hours |
| **Feature Updates** | Monthly | 4-8 hours |
| **Security Patches** | Quarterly | 2-4 hours |
| **Backup Verification** | Weekly | 30 minutes |
| **User Support** | Daily | 30-60 minutes |

---

## 📊 10. Testing Requirements

### Testing Environment
| Component | Requirement | Purpose |
|-----------|-------------|---------|
| **Test Database** | Separate MongoDB instance | Avoid production data corruption |
| **Test Users** | 10-20 dummy accounts | Role-based testing |
| **Sample Data** | 50-100 publications | Performance testing |
| **Multiple Browsers** | Chrome, Firefox, Safari, Edge | Cross-browser testing |
| **Mobile Devices** | Smartphone, Tablet | Responsive testing |

### Testing Tools
| Tool | Purpose | Cost |
|------|---------|------|
| **Postman** | API endpoint testing | **FREE** |
| **Browser DevTools** | Frontend debugging | **FREE** |
| **MongoDB Compass** | Database queries | **FREE** |
| **Lighthouse** | Performance analysis | **FREE** |

---

## 📦 11. Backup & Recovery Requirements

### Backup Strategy
| Data Type | Frequency | Storage | Retention |
|-----------|-----------|---------|-----------|
| **Database** | Daily (automated) | MongoDB Atlas cloud | 30 days |
| **Code** | Every commit | GitHub | Unlimited |
| **User Files** | Weekly | External storage | 90 days |
| **Logs** | Monthly archive | Cloud/Local | 1 year |

### Recovery Plan
| Scenario | Recovery Method | RTO (Recovery Time) |
|----------|----------------|---------------------|
| **Server Crash** | Redeploy from GitHub | 30-60 minutes |
| **Database Loss** | Restore from Atlas backup | 1-2 hours |
| **Code Corruption** | Git revert | 10-20 minutes |

---

## 🎯 Summary

### ✅ Total Requirements Checklist

#### Hardware ✅ (₹0 - Use Existing)
- [x] Computer with 4GB+ RAM
- [x] Internet connection
- [x] Display (1366x768+)

#### Software ✅ (₹0 - All Free)
- [x] Node.js v14+
- [x] MongoDB v4.4+
- [x] Code Editor (VS Code)
- [x] Git
- [x] Web Browser

#### Services ✅ (₹0 - Free Tier)
- [x] MongoDB Atlas
- [x] Render (Backend hosting)
- [x] Vercel (Frontend hosting)
- [x] GitHub (Code repository)

#### Communication ✅ (₹300-500/month)
- [x] Internet connection
- [x] Email account

#### Facilities ✅ (₹0 - Basic Setup)
- [x] Workspace with power
- [x] Adequate lighting

---

## 💰 Final Budget Summary

### For College Project (Our Setup)
| Category | Cost |
|----------|------|
| **Hardware** | ₹0 (Use existing computer) |
| **Software** | ₹0 (All open-source) |
| **Cloud Services** | ₹0 (Free tier) |
| **Internet** | ₹300-500/month (existing) |
| **Total Setup Cost** | **₹0** |
| **Monthly Running Cost** | **₹0-500** |

### ⭐ **Grand Total: ₹0 Initial Investment**

---

**This project can be completed with ZERO additional budget using free, open-source tools and cloud services!** 🎉

---

**Document Created**: 2026-01-23  
**Version**: 1.0  
**For**: Project Synopsis and Documentation  
**Status**: Complete and Ready for Submission
