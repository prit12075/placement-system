# PlaceMe — College Placement Management System

> A comprehensive DBMS Project for managing college placements with a modern, intuitive interface.

![Version](https://img.shields.io/badge/version-2.0.0-blue)
![Status](https://img.shields.io/badge/status-Active-brightgreen)
![License](https://img.shields.io/badge/license-MIT-blue)

---

## 📋 Project Overview

**PlaceMe** is a full-stack web application designed to manage college placement drives, student applications, and placement records. It demonstrates advanced database management concepts including normalization, foreign keys, transactions, complex queries, and more.

### Key Features

✨ **Student Management**
- Register with profile (department, CGPA, skills)
- View placement opportunities
- Track application status in real-time
- Manage placement records

🏢 **Company Management**
- Register recruiting companies
- Create and manage placement drives
- View student applications
- Accept/reject candidates

📊 **Placement Drives**
- Schedule drives with eligibility criteria (CGPA, department)
- Auto-filter eligible students
- Track application status pipeline
- Real-time statistics

📈 **Analytics & Reporting**
- Department-wise placement statistics
- Average package analysis
- Placement rate visualization
- Trend analytics

🔐 **Security**
- JWT authentication
- Role-based access control
- Password encryption
- SQL injection prevention

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────┐
│         Frontend (React.js + Vite)      │
│  Beautiful, responsive, modern UI       │
└────────────────────┬────────────────────┘
                     │ REST API (JSON)
┌────────────────────▼────────────────────┐
│      Backend (Node.js + Express)        │
│  Routes, business logic, validation     │
└────────────────────┬────────────────────┘
                     │ SQL Queries
┌────────────────────▼────────────────────┐
│   Database (SQLite / MySQL)             │
│   5 tables, normalized BCNF schema      │
└─────────────────────────────────────────┘
```

---

## 📊 Database Schema

### Entity Relationship Diagram

```
┌──────────────┐         ┌──────────────┐
│  COMPANIES   │────────▶│    DRIVES    │
│  (1 → N)     │         │              │
└──────────────┘         └──────┬───────┘
                                │
                    ┌───────────┼───────────┐
                    │           │           │
                    ▼ (N:M)     ▼ (1:N)     ▼ (1:N)
            ┌──────────────┐  ┌──────────────────┐
            │ APPLICATIONS │  │    PLACEMENTS    │
            │ (Junction)   │  │  (Records)       │
            └──────────────┘  └──────────────────┘
                    ▲                  ▲
                    │                  │
                    └──────┬───────────┘
                           │ (N:1)
                    ┌──────▼────────┐
                    │   STUDENTS    │
                    │  (Profiles)   │
                    └───────────────┘
```

### Tables Overview

| Table | Purpose | Records |
|-------|---------|---------|
| **COMPANIES** | Recruiting company profiles | 6+ |
| **STUDENTS** | Student profiles with CGPA, skills | 15+ |
| **DRIVES** | Placement drive details | 6+ |
| **APPLICATIONS** | Student applications to drives | 20+ |
| **PLACEMENTS** | Successful placement records | 7+ |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v22.5+ (with built-in SQLite support)
- **npm** or **yarn**
- **Git**

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/your-username/placement-system.git
cd placement-system

# 2. Install dependencies
npm install

# 3. Install client dependencies
cd client && npm install && cd ..

# 4. Start the development server (concurrent mode)
npm run dev

# Or start individually:
npm run server   # Terminal 1: Node.js backend on http://localhost:5000
npm run client   # Terminal 2: React frontend on http://localhost:5173
```

### Database Seeding

```bash
# Seed the database with sample data
npm run seed
```

This creates:
- 6 companies (Google, Microsoft, Amazon, TCS, Infosys, Accenture)
- 15 students across different departments
- 6 placement drives
- 20+ applications
- 7 placements

---

## 📁 Project Structure

```
placement-system/
├── server/
│   ├── config/
│   │   └── db.js              # Database connection & config
│   ├── middleware/
│   │   └── auth.js            # JWT authentication
│   ├── routes/
│   │   ├── admin.js           # Admin operations
│   │   ├── auth.js            # Authentication endpoints
│   │   └── student.js         # Student endpoints
│   ├── server.js              # Express app setup
│   └── seed.js                # Database seeding script
│
├── client/
│   ├── src/
│   │   ├── components/        # Reusable React components
│   │   ├── pages/             # Page components
│   │   ├── hooks/             # Custom React hooks
│   │   ├── context/           # Context API state
│   │   ├── layouts/           # Layout wrappers
│   │   ├── index.css          # Tailwind & custom styles
│   │   ├── main.jsx           # Entry point
│   │   └── App.jsx            # Root component
│   ├── index.html             # HTML template
│   ├── vite.config.js         # Vite configuration
│   └── package.json           # Client dependencies
│
├── package.json               # Root package config
├── README.md                  # This file
└── DBMS_REPORT_PROMPT.md      # Report generation prompt
```

---

## 🔌 API Endpoints

### Authentication
```
POST   /api/auth/register    # Register new user
POST   /api/auth/login       # Login and get JWT token
POST   /api/auth/logout      # Logout (client-side)
```

### Students
```
GET    /api/students         # Get all students (admin)
GET    /api/students/:id     # Get student profile with applications
POST   /api/students         # Create new student
PUT    /api/students/:id     # Update student profile
DELETE /api/students/:id     # Delete student
```

### Companies
```
GET    /api/companies        # Get all companies
POST   /api/companies        # Create company
PUT    /api/companies/:id    # Update company
DELETE /api/companies/:id    # Delete company
```

### Drives
```
GET    /api/drives           # Get all drives (with statistics)
GET    /api/drives/:id       # Get drive details
POST   /api/drives           # Create new drive
PUT    /api/drives/:id       # Update drive
DELETE /api/drives/:id       # Delete drive
GET    /api/drives/:id/eligible  # Get eligible students
```

### Applications
```
GET    /api/applications     # Get all applications
POST   /api/applications     # Apply to a drive
PUT    /api/applications/:id # Update application status
DELETE /api/applications/:id # Cancel application
```

### Placements
```
GET    /api/placements       # Get all placements
POST   /api/placements       # Record a placement
DELETE /api/placements/:id   # Remove placement record
```

### Analytics
```
GET    /api/analytics/dashboard  # Dashboard statistics
GET    /api/analytics/summary    # Placement summary
GET    /api/analytics/export     # Export data (CSV)
```

---

## 💾 Database Details

### Normalization

✅ **BCNF (Boyce-Codd Normal Form) Achieved**

- All tables have no partial dependencies
- No transitive dependencies
- Each table has a unique primary key
- All non-key attributes dependent on the entire primary key
- No update anomalies

### Key Constraints

**Primary Keys**: Each table has auto-incrementing integer primary key

**Foreign Keys**: 
- `Drives.company_id` → `Companies.company_id`
- `Applications.student_id` → `Students.student_id`
- `Applications.drive_id` → `Drives.drive_id`
- `Placements.student_id` → `Students.student_id`
- `Placements.drive_id` → `Drives.drive_id`

**Unique Constraints**:
- `Companies.name` (no duplicate companies)
- `Students.email` (unique email per student)
- `(Applications.student_id, Applications.drive_id)` (no duplicate applications)
- `Placements.student_id` (one placement per student)

**Check Constraints**:
- CGPA: 0 ≤ CGPA ≤ 10
- Package values: ≥ 0
- Academic year: 1-4

### Complex Queries

```sql
-- View: Placement Summary by Department
CREATE VIEW placement_summary AS
SELECT s.department,
       COUNT(DISTINCT s.student_id) AS total_students,
       COUNT(DISTINCT p.student_id) AS placed_students,
       ROUND(AVG(p.package), 2) AS avg_package,
       ROUND(COUNT(DISTINCT p.student_id) / COUNT(DISTINCT s.student_id) * 100, 2) AS placement_rate
FROM students s
LEFT JOIN placements p ON s.student_id = p.student_id
GROUP BY s.department;

-- Multi-table JOIN: Student Applications
SELECT s.name, d.title, c.name AS company, 
       a.status, p.package
FROM students s
JOIN applications a ON s.student_id = a.student_id
JOIN drives d ON a.drive_id = d.drive_id
JOIN companies c ON d.company_id = c.company_id
LEFT JOIN placements p ON p.student_id = s.student_id
ORDER BY s.name;
```

---

## 🎨 UI/UX

### Design System

**Color Palette**:
- Primary Blue: `#2563EB`
- Dark Blue: `#0C2F5C`
- Light Blue: `#EFF6FF`
- Success Green: `#059669`
- Warning Orange: `#D97706`

**Typography**:
- Headings: Space Grotesk (700, 600, 500 weights)
- Body: Inter (400, 500, 600 weights)

**Components**:
- Modern cards with subtle shadows
- Smooth transitions and animations
- Responsive grid layouts
- Data tables with sorting
- Form validation with error messages
- Toast notifications
- Loading states

---

## 🧪 Testing

```bash
# Run tests (if configured)
npm test

# Run linting
npm run lint

# Build for production
npm run build
```

---

## 📚 DBMS Concepts Demonstrated

✅ **Schema Design**
- Normalization to BCNF
- Entity-Relationship modeling
- Referential integrity

✅ **Data Integrity**
- Primary key constraints
- Foreign key relationships
- Unique constraints
- Check constraints
- Cascade delete rules

✅ **Query Operations**
- SELECT with complex WHERE clauses
- JOINs (INNER, LEFT, SELF)
- Subqueries and nested queries
- Aggregation functions (COUNT, AVG, MAX)
- GROUP BY with HAVING

✅ **Advanced Features**
- Views for aggregated data
- Indexes for query optimization
- Transactions with COMMIT/ROLLBACK
- Window functions (optional)

✅ **Security**
- Prepared statements (SQL injection prevention)
- Authentication & authorization
- Password hashing
- JWT tokens

---

## 📝 DBMS Project Report

Generate a comprehensive project report with:

```bash
# Copy the prompt from DBMS_REPORT_PROMPT.md
# Then in Claude Chat, paste the entire prompt
# It will generate a professional Word document with:
# - Cover page with institute logo
# - Executive summary
# - Database schema diagram
# - Table specifications
# - SQL queries
# - Performance analysis
# - Test cases
# - Conclusion
```

**Report includes**:
- Professional formatting
- Proper fonts (Inter & Space Grotesk)
- Color theme (#2563EB primary)
- All DBMS concepts explained
- SQL query examples
- Normalization details
- Constraint specifications
- ER diagrams

---

## 🤝 Contributing

This is an educational project. Contributions welcome!

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License — see `LICENSE` file for details.

---

## 👨‍💼 Project Team

**Created as a DBMS Project for:**
- [Your Name]
- [Your College Name]
- [Academic Year 2024-2025]

**Submitted to**: [Professor/Teacher Name]

---

## 📞 Support

For questions or issues:
- 📧 Email: [your-email@college.edu]
- 💬 GitHub Issues: [Create an issue](https://github.com/your-username/placement-system/issues)

---

## 🎓 Learning Resources

- **Database Normalization**: [Khan Academy - Database Normalization](https://www.khanacademy.org/)
- **SQL Tutorial**: [W3Schools SQL](https://www.w3schools.com/sql/)
- **ER Diagram Guide**: [Lucidchart ER Diagrams](https://www.lucidchart.com/)
- **Node.js & Express**: [Express.js Official Docs](https://expressjs.com/)
- **React Documentation**: [React Official Docs](https://react.dev/)

---

## ⭐ Show Your Support

If this project helped you, give it a star! ⭐

---

**Made with ❤️ for learning DBMS concepts**

