# Faculty Publications Management System - Implementation Plan

## Project Overview
A full-stack web application for managing faculty publications with a Notion-style interface and rule-based academic query assistant.

## Architecture

### Frontend
- **Technology**: HTML5, CSS3, Vanilla JavaScript, Bootstrap 5
- **Components**:
  - Login/Dashboard page
  - Publications table (spreadsheet-style, sortable, filterable)
  - Manual entry form/modal
  - Excel/CSV upload modal
  - Chatbot panel (fixed right sidebar)
  - Responsive design

### Backend
- **Technology**: Node.js, Express.js
- **Features**:
  - RESTful API endpoints
  - File upload handling (multer)
  - Excel/CSV parsing (xlsx, csv-parser)
  - JWT authentication
  - Rule-based query engine

### Database
- **Technology**: MongoDB
- **Collections**:
  - users (authentication)
  - publications (main data)

## Implementation Steps

### Phase 1: Backend Setup
1. Initialize Node.js project
2. Set up Express server
3. Configure MongoDB connection
4. Create data models (User, Publication)
5. Implement authentication (JWT)

### Phase 2: Core API Endpoints
1. POST /api/auth/register
2. POST /api/auth/login
3. GET /api/publications (with filtering, sorting)
4. POST /api/publications (manual entry)
5. PUT /api/publications/:id
6. DELETE /api/publications/:id
7. POST /api/upload/excel (file upload + parsing)
8. POST /api/chatbot/query

### Phase 3: Chatbot Query Engine
**Rule-Based Algorithm** (No AI/LLM):
1. Intent detection (keyword matching)
2. Query classification
3. Data filtering and aggregation
4. Response template generation
5. Dynamic summary generation

**Supported Intents**:
- Publication summary
- Research areas identification
- Time-based filtering
- Journal analysis
- Link validation
- Statistics generation

### Phase 4: Frontend Development
1. Create login page
2. Build publications table (CRUD operations)
3. Implement inline editing
4. Add sorting/filtering/search
5. Create upload modal
6. Build chatbot UI panel
7. Integrate API calls

### Phase 5: Testing & Refinement
1. Test all API endpoints
2. Test file upload with various formats
3. Test chatbot queries
4. Validate UI responsiveness
5. Performance optimization

## Key Features

### 1. Publications Table Columns
- Title
- Authors
- Year
- Journal/Conference
- Keywords (comma-separated)
- Abstract
- Publication Link
- Created Date

### 2. Chatbot Query Types
- **Summary**: "Give me a summary of my publications"
- **Research Areas**: "What are my main research areas?"
- **Time Filter**: "How many papers after 2022?"
- **Journal Analysis**: "List journals where I published most"
- **Link Access**: "Open my latest publication link"
- **Validation**: "Show publications without links"

### 3. Dynamic Summary Algorithm
```
1. Count total publications
2. Extract all keywords -> frequency analysis
3. Identify top 3-5 research areas
4. Analyze publication timeline
5. Calculate recent activity (last 3 years weighted higher)
6. Generate template-based summary:
   "[Name] has published [X] research papers focusing on [areas].
    Recent work emphasizes [recent trends]. Primary publication 
    venues include [top journals]."
```

## File Structure
```
faculty-publications/
├── backend/
│   ├── config/
│   │   └── db.js
│   ├── models/
│   │   ├── User.js
│   │   └── Publication.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── publications.js
│   │   └── chatbot.js
│   ├── middleware/
│   │   └── auth.js
│   ├── utils/
│   │   ├── queryEngine.js
│   │   └── fileParser.js
│   ├── uploads/
│   ├── server.js
│   └── package.json
├── frontend/
│   ├── css/
│   │   └── style.css
│   ├── js/
│   │   ├── auth.js
│   │   ├── table.js
│   │   └── chatbot.js
│   ├── index.html (login)
│   ├── dashboard.html
│   └── assets/
└── README.md
```

## Academic Standards
- ✅ Explainable algorithm (no black-box AI)
- ✅ Domain-specific logic
- ✅ Professional academic UI
- ✅ Complete documentation
- ✅ Ready for demonstration
- ✅ Viva-ready with clear architecture

## Timeline
1. Setup & Backend: 30%
2. API Development: 25%
3. Chatbot Engine: 20%
4. Frontend: 20%
5. Testing: 5%

## Success Criteria
- [ ] Table displays all publications
- [ ] Excel upload works correctly
- [ ] Chatbot responds accurately to all query types
- [ ] Clean, responsive UI
- [ ] All CRUD operations functional
- [ ] No external AI dependencies
- [ ] Code is well-documented
