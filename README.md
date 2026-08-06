# CampusPass 🎓

<div align="center">

![NIT Hamirpur](https://img.shields.io/badge/NIT-Hamirpur-1e4479?style=for-the-badge&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white)
![Socket.io](https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socket.io&logoColor=white)

**A full-stack, production-grade digital outpass management system for NIT Hamirpur hostels.**

*Replacing paper passes with QR codes, real-time tracking, and automated parent notifications.*

</div>

---

## 📖 Overview

**CampusPass** is a secure, real-time digital gate pass system that manages student exits and re-entries at NIT Hamirpur hostels. It replaces the traditional paper-based outpass system with a cryptographically verified QR code workflow, complete with automated email notifications, audit trails, and a live dashboard for wardens and administrators.

### The Problem
- Paper passes are slow, manual, and prone to forgery
- No real-time tracking of student location (Inside/Outside campus)
- Parents have no visibility when students leave campus
- No audit trail or accountability

### The Solution
- Students apply for passes online with departure and return details
- Hostel Wardens digitally approve/reject passes
- Approved passes generate a **cryptographically signed QR code** (HMAC-SHA256)
- Main Gate security scans QR to verify and log **exit and return**
- Parents receive **automatic email alerts** on every gate scan
- All admin actions are logged in an immutable **audit trail**

---

## ✨ Features

### For Students
- 📝 Apply for gate passes with purpose, destination, and dates
- 📱 View QR code for approved passes
- 🔔 Real-time notifications when pass is approved/rejected
- 📋 Full pass history with status tracking
- 👤 Profile with department, hostel, room, and emergency contacts

### For Wardens
- ✅ Approve or reject student pass requests with remarks
- 🏠 Hostel-scoped view (only see students from assigned hostel)
- 📊 Analytics dashboard with pass statistics
- 👥 Student list with real-time Inside/Outside status

### For Main Gate
- 📷 QR code scanner for instant pass verification
- 🔐 HMAC-SHA256 forgery detection
- 🚨 Emergency exit logging (bypasses warden approval)
- 🔍 Search students by roll number, name, or email

### For Admins
- 👤 Approve/reject Warden and Main Gate registrations
- 🏛️ Manage hostels and warden assignments
- 🔒 Suspend, activate, or delete accounts
- 📜 Immutable audit logs for all admin actions
- 🔑 Force-reset passwords for any user

### System-wide
- 🔒 Two-stage student approval (Admin + Warden)
- ⚡ Real-time push notifications via Socket.io
- 📧 Async email queue via BullMQ (non-blocking)
- 🛡️ Redis-backed rate limiting (200 req/15 min per IP)
- 🔄 Pass expiry automation via node-cron
- 📦 Cloudinary CDN for profile photos and ID cards

---

## 🛠️ Tech Stack

### Backend

| Technology | Purpose |
|---|---|
| **Node.js + Express.js** | HTTP server and REST API |
| **PostgreSQL (Supabase)** | Primary relational DB — Users, Passes, Hostels |
| **MongoDB Atlas** | Secondary DB — Audit logs, Gate logs, Notifications |
| **Sequelize ORM** | PostgreSQL model definitions and associations |
| **Redis (Upstash)** | Caching, rate limiting, distributed locks |
| **BullMQ** | Async email job queue backed by Redis |
| **Socket.io** | Real-time WebSocket push notifications |
| **JWT** | Access token (15m) + Refresh token (7d) auth |
| **bcrypt** | Password hashing with salt rounds 10 |
| **Multer + Cloudinary** | File upload for photos and ID cards |
| **Nodemailer + Brevo** | Transactional email delivery |
| **node-cron** | Scheduled pass expiry job |
| **Helmet** | HTTP security headers |

### Frontend

| Technology | Purpose |
|---|---|
| **React 18 + Vite** | Fast UI development and bundling |
| **React Router DOM v6** | Client-side routing |
| **Redux Toolkit** | Global authentication state |
| **Tailwind CSS v3** | Utility-first styling |
| **Framer Motion** | Smooth UI animations |
| **React Hook Form + Zod** | Form state management and validation |
| **qrcode.react** | Client-side QR code generation |
| **Axios** | HTTP client with cookie support |
| **Socket.io Client** | Real-time notification receiver |

---

## 🏗️ System Architecture

```
┌───────────────────────────────────────────────────────────┐
│                    CLIENT (React SPA)                      │
│        React + Vite + Tailwind + Redux + Socket.io         │
└────────────────────────┬──────────────────────────────────┘
                         │ HTTPS REST + WebSocket
┌────────────────────────▼──────────────────────────────────┐
│              SERVER (Node.js / Express)                    │
│  Auth │ Pass │ Gate │ Admin │ Socket.io │ node-cron        │
│       Rate Limiter (Redis) │ BullMQ Worker                │
└───────┬─────────┬──────────┬──────────────┬───────────────┘
        │         │          │              │
  PostgreSQL   MongoDB    Redis(Upstash)  Cloudinary
  (Supabase)   (Atlas)    Cache+Queue     CDN
 Users/Passes Logs/Notifs Distributed   Images/Assets
                           Locks
                               │
                         BullMQ Worker
                               │
                          Brevo SMTP
```

### Request Flow
```
Client → CORS → Rate Limiter (Redis) → JWT Auth → Route Handler → Controller → DB → Response
```

---

## 🗄️ Database Design

### PostgreSQL Tables (Relational)

| Table | Key Columns |
|---|---|
| **Users** | id (UUID), name, email, password, role, status, refreshToken |
| **Students** | userId (FK), rollNumber, hostelId (FK), branch, year, parentEmail, currentLocation |
| **Hostels** | id, name, wardenId (FK) |
| **Wardens** | userId (FK), hostelId (FK) |
| **GatePasses** | studentId (FK), purpose, leaveDate, returnDate, status (8 states), qrToken, exitTime, entryTime |

> **Partial Unique Index:** Only one `Pending` or `Approved` pass per student at a time.

### MongoDB Collections (Document-based)

| Collection | Purpose | TTL |
|---|---|---|
| `AuditLogs` | Admin action history | None |
| `GateLogs` | Every gate scan (exit/return) | **30 days** |
| `Notifications` | Per-user notification inbox | None |

---

## 🔐 Security

| Feature | Implementation |
|---|---|
| Password Hashing | bcrypt salt rounds 10, auto-hashed on save via Sequelize hook |
| Auth Tokens | HttpOnly cookies (not localStorage) — prevents XSS |
| Access Token | JWT, 15-minute expiry |
| Refresh Token | JWT, 7-day expiry, stored in PostgreSQL for revocation |
| QR Anti-Forgery | HMAC-SHA256 signature verified on every gate scan |
| Race Condition | Redis distributed lock (NX + EX:2s) on pass application |
| Rate Limiting | 200 requests / 15 min per IP, backed by Redis |
| HTTP Headers | Helmet.js: CSP, HSTS, X-Frame-Options, X-Content-Type-Options |
| RBAC | Role-based route guards + hostel-scoped controller checks |

**QR Anti-Forgery:**
```
On approval:  qrToken = HMAC_SHA256(passId, JWT_SECRET)
QR encodes:   {passId}:{qrToken}
On scan:      re-compute HMAC and compare → FORGERY DETECTED if mismatch
```

---

## 📡 API Overview

### Auth (`/api/auth`)
```
POST   /auth/register         Register (Student / Warden / Main Gate)
POST   /auth/login            Login by email or roll number
POST   /auth/logout           Clear session cookies
POST   /auth/refresh          Refresh access token
GET    /auth/me               Get current user profile
PUT    /auth/change-password  Change own password
POST   /auth/forgot-password  Send password reset link
POST   /auth/reset-password/:token  Reset password with token
```

### Gate Passes (`/api/pass`)
```
POST   /pass/apply            Apply for a pass (Student)
GET    /pass                  Get passes (role-scoped)
PUT    /pass/:id/approve      Approve + generate QR (Warden/Admin)
PUT    /pass/:id/reject       Reject pass
DELETE /pass/:id              Delete pass
GET    /pass/public/:token    Public QR verification
```

### Gate (`/api/gate`)
```
POST   /gate/verify           Verify QR scan (with Redis cache)
POST   /gate/confirm          Confirm exit/entry (SQL transaction)
POST   /gate/emergency        Log emergency exit
GET    /gate/logs             Today's gate activity
GET    /gate/search           Search student
```

### Admin (`/api/admin`)
```
GET    /admin/pending                 List pending registrations
PUT    /admin/approve/:userId         Approve user
PUT    /admin/reject/:userId          Reject user
GET    /admin/users                   List all users
PUT    /admin/users/:id/status        Suspend / activate
DELETE /admin/users/:id               Delete user
GET    /admin/audit-logs              View last 100 audit logs
```

---

## 🚀 Installation

### Prerequisites
- Node.js v18+
- PostgreSQL / Supabase account
- MongoDB Atlas cluster
- Redis / Upstash account
- Cloudinary account
- Brevo (SMTP) account

### 1. Clone the repository
```bash
git clone https://github.com/aks-110/CampusPass.git
cd CampusPass
```

### 2. Install dependencies
```bash
cd server && npm install
cd ../client && npm install
```

### 3. Configure environment variables

Create `server/.env`:

```env
PORT=5000
NODE_ENV=development

JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret

MONGO_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/campusPass

PG_URI=postgresql://<user>:<pass>@<host>:6543/postgres?pgbouncer=true

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

REDIS_HOST=your-host.upstash.io
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password

SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_password
SENDER_EMAIL=noreply@yourdomain.com

FRONTEND_URL=http://localhost:5173
```

### 4. Seed the first Admin
```bash
cd server
node seedSqlAdmin.js
```

### 5. Start development servers
```bash
# Terminal 1 — Backend
cd server && npm run dev

# Terminal 2 — Frontend
cd client && npm run dev
```

Frontend: `http://localhost:5173` | Backend: `http://localhost:5000`

---

## 📁 Project Structure

```
CampusPass/
├── client/                     # React + Vite frontend
│   ├── src/
│   │   ├── App.jsx             # Routing + session restore
│   │   ├── layouts/            # AuthLayout, MainLayout
│   │   ├── pages/              # 31 role-specific page components
│   │   ├── redux/              # authSlice (Redux Toolkit)
│   │   ├── context/            # SocketContext (Socket.io)
│   │   └── utils/              # axiosInstance
│   └── index.html
│
└── server/                     # Node.js + Express backend
    ├── index.js                # App bootstrap
    ├── config/                 # DB, Redis, Queue, Multer
    ├── models/sql/             # Sequelize models (5 tables)
    ├── models/                 # Mongoose models (3 collections)
    ├── controllers/            # Business logic (6 controllers)
    ├── routes/                 # Express route definitions (7 routes)
    ├── middlewares/            # Auth, Rate Limiter, Audit
    ├── utils/                  # JWT, QR, Cloudinary, Email
    ├── workers/                # BullMQ email worker
    ├── cron/                   # Pass expiry cron job
    └── seedSqlAdmin.js
```

---

## 🔄 Key Workflows

### Pass Application Flow
```
Student applies
→ Redis distributed lock acquired
→ Check for existing active pass
→ GatePass created (Pending)
→ Lock released
→ Warden approves → HMAC QR token generated
→ Socket.io notification to student
→ Gate scans QR → SQL transaction (exit logged)
→ BullMQ queues email for student + parent
```

### Two-Stage Student Approval
```
Student registers
→ User.status = Pending (cannot log in)
→ Student.registrationStatus = Pending (cannot apply for passes)
→ Admin approves → User.status = Active (can log in)
→ Warden approves → Student.registrationStatus = Approved (can apply for passes)
```

---

## 👥 User Roles

| Role | How to Register | Key Capabilities |
|---|---|---|
| **Student** | Self-register + 2-stage approval | Apply for passes, view QR |
| **Warden** | Self-register + Admin approval | Approve/reject passes (hostel-scoped) |
| **Main Gate** | Self-register + Admin approval | Scan QR, log exit/entry, emergency exits |
| **Admin** | Seeded or created by Admin | Full system access, audit logs |

---

## 🏫 Departments (NIT Hamirpur)

Computer Science & Engineering • Civil Engineering • Electrical Engineering • Mechanical Engineering • Electronics & Communication Engineering • Chemical Engineering • Material Science & Engineering • Architecture • Physics & Photonics Science • Chemistry • Mathematics & Scientific Computing • Humanities & Social Sciences • Management Studies • Centre For Energy Studies

---

## 🏠 Hostels (NIT Hamirpur)

**Boys:** Kailash • Himgiri • Udaygiri • Neelkanth • Dhauladhar • Vindhyachal • Shivalik

**Girls:** Ambika • Parvati • Mani-Mahesh • Aravali • Satpura

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m 'Add my feature'`
4. Push to the branch: `git push origin feature/my-feature`
5. Open a Pull Request

---

## 📄 License

This project is licensed under the **ISC License**.

---

<div align="center">
  <strong>Built with ❤️ for NIT Hamirpur 🎓</strong><br/>
  <em>Digitizing campus outpass management — one QR code at a time.</em>
</div>
