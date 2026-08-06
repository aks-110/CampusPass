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

**CampusPass** is a secure, real-time digital gate pass system that manages student exits and re-entries at NIT Hamirpur hostels. It replaces the traditional paper-based outpass system with a cryptographically verified QR code workflow, complete with automated email notifications, audit trails, and live dashboards for wardens and administrators.

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

---

## 🛠️ Tech Stack

### Backend

| Technology | Version | Purpose |
|---|---|---|
| **Node.js + Express.js** | ^5.2.1 | HTTP server and REST API |
| **PostgreSQL (Supabase)** | Cloud | Primary relational DB — Users, Passes, Hostels |
| **MongoDB Atlas** | Cloud | Secondary DB — Audit logs, Gate logs, Notifications |
| **Sequelize ORM** | ^6.37.8 | PostgreSQL model definitions and associations |
| **Redis (Upstash)** | Cloud | Caching, rate limiting, distributed locks |
| **BullMQ** | ^6.0.5 | Async email job queue backed by Redis |
| **Socket.io** | ^4.8.3 | Real-time WebSocket push notifications |
| **JWT (jsonwebtoken)** | ^9.0.3 | Access token (15m) + Refresh token (7d) auth |
| **bcrypt** | ^6.0.0 | Password hashing with salt rounds 10 |
| **Multer + Cloudinary** | ^2.2.0 / ^2.10.0 | File upload for photos and ID cards |
| **Nodemailer + Brevo** | ^9.0.3 | Transactional email delivery |
| **node-cron** | ^4.6.0 | Scheduled pass expiry job |
| **Helmet** | ^8.3.0 | HTTP security headers |

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
| **Lucide React** | Icon library |

---

## 🏗️ System Architecture

```mermaid
graph TB
    subgraph CLIENT["CLIENT (React SPA)"]
        UI["⚛️ React + Vite + Tailwind CSS"]
        Redux["🗃️ Redux Toolkit (Auth State)"]
        SocketC["🔌 Socket.io Client"]
    end

    subgraph SERVER["SERVER (Node.js / Express)"]
        API["🚀 Express REST API :5000"]
        Auth["🛡️ JWT Auth Middleware"]
        Rate["⏱️ Rate Limiter"]
        SocketS["📡 Socket.io Server"]
        Cron["⏰ node-cron (Pass Expiry)"]
        Worker["⚙️ BullMQ Email Worker"]
    end

    subgraph DATA["DATA LAYER"]
        PG[("🐘 PostgreSQL\nSupabase\nUsers · Passes · Hostels")]
        Mongo[("🍃 MongoDB Atlas\nAuditLogs · GateLogs\nNotifications")]
        Redis[("⚡ Redis\nUpstash\nCache · Queue · Locks")]
        Cloud["☁️ Cloudinary\nImages & Assets"]
        Email["📧 Brevo SMTP\nEmail Delivery"]
    end

    UI -->|"HTTPS REST"| API
    UI <-->|"WebSocket"| SocketS
    Redux --> UI
    SocketC --> UI

    API --> Auth
    API --> Rate
    Rate -->|"Token Bucket"| Redis
    Auth --> PG
    API --> PG
    API --> Mongo
    API -->|"Lock / Cache"| Redis
    Worker -->|"Dequeue Jobs"| Redis
    Worker --> Email
    Cron -->|"Mark Expired"| PG
    API -->|"Upload"| Cloud
```

---

## 🗄️ Database Schema

```mermaid
erDiagram
    USERS {
        uuid id PK
        string name
        string email
        string password
        enum role "Student|Warden|Main Gate|Admin"
        enum status "Pending|Active|Suspended|Deleted|Rejected"
        string photo
        string phone
        string assignedLocation
        text refreshToken
        string resetPasswordToken
        date resetPasswordExpires
    }

    STUDENTS {
        uuid id PK
        uuid userId FK
        string rollNumber
        uuid hostelId FK
        string roomNo
        string branch
        string year
        string gender
        string parentName
        string parentEmail
        string parentPhone
        string idCard
        enum registrationStatus "Pending|Approved|Rejected"
        enum currentLocation "Inside|Outside"
    }

    HOSTELS {
        uuid id PK
        string name
        uuid wardenId FK
    }

    WARDENS {
        uuid id PK
        uuid userId FK
        uuid hostelId FK
    }

    GATEPASSES {
        uuid id PK
        uuid studentId FK
        string purpose
        string destination
        date leaveDate
        date returnDate
        enum status "Draft|Pending|Approved|Rejected|Cancelled|Expired|Completed|Overdue"
        string qrToken
        uuid approvedBy FK
        date exitTime
        date entryTime
        string exitGate
        string entryGate
    }

    USERS ||--o| STUDENTS : "has profile"
    USERS ||--o| WARDENS : "has profile"
    USERS ||--o{ GATEPASSES : "applies"
    HOSTELS ||--o{ STUDENTS : "houses"
    HOSTELS ||--o{ WARDENS : "managed by"
    WARDENS }o--|| HOSTELS : "assigned to"
```

---

## 🔄 Pass Application Flow

```mermaid
sequenceDiagram
    autonumber
    actor S as Student
    participant API as Express API
    participant Redis as Redis
    participant PG as PostgreSQL
    participant WS as Socket.io
    participant Q as BullMQ Queue
    actor W as Warden

    S->>API: POST /api/pass/apply
    API->>Redis: SET lock:applyPass:{userId} NX EX 2
    Redis-->>API: OK (lock acquired)
    API->>PG: SELECT active pass for student
    PG-->>API: No active pass
    API->>PG: INSERT GatePass (status=Pending)
    PG-->>API: Pass created
    API->>Redis: DEL lock (release)
    API-->>S: 201 Created

    Note over W,PG: Later — Warden reviews request
    W->>API: PUT /api/pass/:id/approve
    API->>PG: UPDATE status=Approved
    API->>PG: SET qrToken = HMAC_SHA256(passId, secret)
    API->>WS: io.to(studentId).emit("notification")
    API->>Q: emailQueue.add("send-email", {...})
    WS-->>S: 🔔 Real-time toast notification
    Q-->>S: 📧 Approval email delivered
```

---

## 🚪 Gate Verification Flow

```mermaid
sequenceDiagram
    autonumber
    actor G as Gate Officer
    participant API as Express API
    participant Redis as Redis Cache
    participant PG as PostgreSQL
    participant Mongo as MongoDB
    participant Q as BullMQ Queue

    G->>API: POST /api/gate/verify {qrPayload, action}
    API->>API: Extract passId + signature from QR
    API->>Redis: GET pass:cache:{passId}

    alt Cache HIT
        Redis-->>API: Cached pass + studentProfile
    else Cache MISS
        API->>PG: SELECT GatePass JOIN User JOIN Student
        PG-->>API: Pass + Student data
        API->>Redis: SET pass:cache:{passId} EX 3600
    end

    API->>API: HMAC_SHA256(passId) === qrToken ?
    alt Signature VALID
        API-->>G: 200 Verified — student details shown
    else Signature INVALID
        API-->>G: 403 FORGERY DETECTED
    end

    G->>API: POST /api/gate/confirm {passId, action}
    Note over API,PG: Atomic SQL Transaction
    API->>PG: BEGIN TRANSACTION
    API->>PG: UPDATE GatePass exitTime / entryTime
    API->>PG: UPDATE Student currentLocation
    API->>PG: COMMIT
    API->>Redis: DEL pass:cache:{passId}
    API->>Mongo: INSERT GateLog document
    API->>Q: Queue student email
    API->>Q: Queue parent email
    API-->>G: 200 Gate scan logged
```

---

## 🔐 Authentication Flow

```mermaid
sequenceDiagram
    autonumber
    actor C as Client
    participant API as Express API
    participant PG as PostgreSQL

    C->>API: POST /api/auth/login {identifier, password}
    API->>PG: Find User by email OR rollNumber
    PG-->>API: User record
    API->>API: bcrypt.compare(password, hash)
    API->>API: Check User.status (Pending/Suspended → reject)
    API->>API: Check Student.registrationStatus (if role=Student)
    API->>API: jwt.sign(accessToken, 15m)
    API->>API: jwt.sign(refreshToken, 7d)
    API->>PG: UPDATE User SET refreshToken
    API-->>C: HttpOnly Cookie: accessToken (15m)
    API-->>C: HttpOnly Cookie: refreshToken (7d)
    API-->>C: 200 + user profile JSON

    Note over C,API: Every subsequent request
    C->>API: GET /api/* (cookie sent automatically)
    API->>API: verifyAccessToken from cookie
    API->>API: Decode {id, role} → proceed
    API-->>C: Protected response

    Note over C,API: When accessToken expires
    C->>API: POST /api/auth/refresh (refreshToken cookie)
    API->>PG: Find user by refreshToken
    API->>API: jwt.verify(refreshToken)
    API->>API: Issue new accessToken + refreshToken pair
    API->>PG: UPDATE new refreshToken in DB
    API-->>C: New HttpOnly cookies set
```

---

## 🔁 Pass Lifecycle

```mermaid
stateDiagram-v2
    [*] --> Pending : Student applies

    Pending --> Approved : Warden approves\n+ HMAC QR generated
    Pending --> Rejected : Warden rejects
    Pending --> Cancelled : Student cancels

    Approved --> Completed : Student exits + returns\n(Gate confirms both scans)
    Approved --> Expired : returnDate passes\n(node-cron detects)
    Approved --> Cancelled : Student cancels before exit

    Expired --> Overdue : Student still Outside\nafter expiry (cron)
    Overdue --> Completed : Student returns late\n(Gate allows return)

    Completed --> [*]
    Rejected --> [*]
    Cancelled --> [*]
```

---

## 👥 Role Hierarchy & Permissions

```mermaid
graph TD
    Admin["👑 Admin\nFull system access"]
    Warden["🏠 Warden\nHostel-scoped access"]
    Gate["🚪 Main Gate\nGate operations"]
    Student["🎓 Student\nSelf-service"]

    Admin -->|"Can approve/reject"| Warden
    Admin -->|"Can approve/reject"| Gate
    Admin -->|"Can approve/reject"| Student
    Warden -->|"Approves passes for"| Student

    subgraph AdminActions["Admin Actions"]
        A1["Approve all registrations"]
        A2["Manage hostels & wardens"]
        A3["Suspend / delete accounts"]
        A4["View audit logs"]
        A5["Reset any password"]
    end

    subgraph WardenActions["Warden Actions"]
        W1["Approve/reject passes (own hostel)"]
        W2["View hostel student list"]
        W3["View analytics dashboard"]
    end

    subgraph GateActions["Gate Actions"]
        G1["Scan QR code (verify)"]
        G2["Confirm exit / return"]
        G3["Emergency exit logging"]
        G4["Search any student"]
    end

    subgraph StudentActions["Student Actions"]
        S1["Apply for gate pass"]
        S2["View approved QR code"]
        S3["Track pass history"]
        S4["Manage profile"]
    end
```

---

## 🔐 Security Architecture

```mermaid
graph LR
    subgraph Client["🌐 Browser"]
        Cookie["HttpOnly Cookies\naccessToken (15m)\nrefreshToken (7d)"]
    end

    subgraph Layers["Security Layers"]
        L1["1️⃣ CORS\nOrigin whitelist"]
        L2["2️⃣ Rate Limiter\n200 req / 15 min / IP\nRedis-backed"]
        L3["3️⃣ JWT Verify\nDecode id + role"]
        L4["4️⃣ RBAC\nRole check\nScope check"]
        L5["5️⃣ Controller\nBusiness rules"]
    end

    subgraph QR["QR Anti-Forgery"]
        QR1["On Approval:\nqrToken = HMAC_SHA256\n(passId, JWT_SECRET)"]
        QR2["On Scan:\nre-compute HMAC\ncompare signatures"]
        QR3["Mismatch?\nFORGERY DETECTED 🚨"]
    end

    subgraph Lock["Race Condition Prevention"]
        R1["SET lock:applyPass:userId\nNX EX 2 (Redis)"]
        R2["Duplicate request?\n429 Too Many Requests"]
    end

    Cookie --> L1
    L1 --> L2
    L2 --> L3
    L3 --> L4
    L4 --> L5
    QR1 --> QR2
    QR2 --> QR3
    R1 --> R2
```

---

## ⚡ Async Architecture

```mermaid
graph LR
    subgraph Sync["⚡ Synchronous (In Request)"]
        DB["PostgreSQL\nDB Write"]
        Cache["Redis\nCache Update"]
        WS["Socket.io\nPush Notification"]
    end

    subgraph Async["🔄 Asynchronous (Background)"]
        Queue["BullMQ\nEmailQueue\n(Redis-backed)"]
        Worker["Email Worker\n(emailWorker.js)"]
        SMTP["Brevo SMTP\nEmail Delivered"]
    end

    subgraph Scheduled["⏰ Scheduled"]
        Cron["node-cron\nPass Expiry Job"]
        PG2["PostgreSQL\nMark Overdue/Expired"]
    end

    Controller --> DB
    Controller --> Cache
    Controller --> WS
    Controller -->|"Non-blocking add"| Queue
    Queue -->|"Job dequeued"| Worker
    Worker --> SMTP

    Cron -->|"Every N minutes"| PG2
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
├── client/                         # React + Vite frontend
│   ├── src/
│   │   ├── App.jsx                 # Routing + session restore
│   │   ├── layouts/
│   │   │   ├── AuthLayout.jsx      # Login/Register shell (hero + logo from Cloudinary)
│   │   │   └── MainLayout.jsx      # Protected app shell (sidebar + topbar)
│   │   ├── pages/                  # 31 role-specific page components
│   │   │   ├── Register.jsx        # Multi-step registration wizard
│   │   │   ├── StudentDashboard.jsx
│   │   │   ├── WardenPending.jsx   # Approval queue
│   │   │   ├── MainGateDashboard.jsx
│   │   │   ├── AdminDashboard.jsx
│   │   │   ├── VerifyPass.jsx      # Public QR viewer (no auth required)
│   │   │   └── ...
│   │   ├── redux/authSlice.js
│   │   ├── context/SocketContext.jsx
│   │   └── utils/axiosInstance.js
│   └── index.html
│
└── server/                         # Node.js + Express backend
    ├── index.js                    # App bootstrap + Socket.io + cron
    ├── config/
    │   ├── db.js                   # MongoDB connection
    │   ├── pg.js                   # PostgreSQL (Sequelize) connection
    │   ├── redis.js                # Redis client (cache + locks)
    │   ├── queue.js                # BullMQ EmailQueue
    │   └── multer.js               # Multer file upload config
    ├── models/
    │   ├── sql/                    # Sequelize models (5 tables)
    │   │   ├── User.js
    │   │   ├── Student.js
    │   │   ├── Pass.js
    │   │   ├── Hostel.js
    │   │   ├── Warden.js
    │   │   └── associations.js
    │   ├── AuditLog.js             # MongoDB — admin audit trail
    │   ├── GateLog.js              # MongoDB — gate scans (30d TTL)
    │   └── Notification.js         # MongoDB — per-user inbox
    ├── controllers/
    │   ├── authController.js       # Register, login, tokens, password reset
    │   ├── passController.js       # Apply, approve, reject, QR generation
    │   ├── gateController.js       # Verify QR, confirm scan, emergency exit
    │   ├── adminController.js      # User management, audit logs
    │   └── reportController.js     # Analytics aggregation
    ├── routes/                     # 7 Express route files
    ├── middlewares/
    │   ├── authMiddleware.js       # JWT protect + RBAC authorize
    │   ├── rateLimiter.js          # Redis-backed custom rate limiter
    │   └── auditMiddleware.js
    ├── utils/
    │   ├── jwtUtils.js             # Sign + verify access/refresh tokens
    │   ├── qrUtils.js              # HMAC-SHA256 QR signing/verification
    │   ├── cloudinary.js           # Cloudinary upload helper
    │   └── emailService.js         # Nodemailer + Brevo SMTP
    ├── workers/emailWorker.js      # BullMQ async email processor
    ├── cron/passExpiry.js          # node-cron pass expiry scheduler
    └── seedSqlAdmin.js             # Seed initial admin account
```

---

## 📡 API Reference

### Auth (`/api/auth`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | Public | Register (Student / Warden / Main Gate) |
| POST | `/auth/login` | Public | Login by email or roll number |
| POST | `/auth/logout` | Cookie | Clear session cookies |
| POST | `/auth/refresh` | Cookie | Issue new access token |
| GET | `/auth/me` | Protected | Get current user profile |
| PUT | `/auth/change-password` | Protected | Change own password |
| PUT | `/auth/update-profile` | Protected | Update phone/profile |
| POST | `/auth/forgot-password` | Public | Send password reset link |
| POST | `/auth/reset-password/:token` | Public | Reset password with token |

### Gate Passes (`/api/pass`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/pass/apply` | Student | Apply for a gate pass |
| GET | `/pass` | All roles | Get passes (role-scoped) |
| PUT | `/pass/:id/approve` | Warden/Admin | Approve + generate QR token |
| PUT | `/pass/:id/reject` | Warden/Admin | Reject with remarks |
| DELETE | `/pass/:id` | Student/Admin | Delete pass |
| GET | `/pass/public/:token` | Public | Verify QR token (public) |

### Gate Operations (`/api/gate`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/gate/verify` | Main Gate | Verify QR (with Redis cache) |
| POST | `/gate/confirm` | Main Gate | Confirm exit/entry (SQL transaction) |
| POST | `/gate/emergency` | Main Gate | Create emergency pass + exit |
| GET | `/gate/logs` | Main Gate/Admin | Today's gate activity log |
| GET | `/gate/search` | Main Gate | Search student by roll/name/email |

### Admin (`/api/admin`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/admin/pending` | Admin/Warden | List pending registrations |
| PUT | `/admin/approve/:userId` | Admin/Warden | Approve user |
| PUT | `/admin/reject/:userId` | Admin/Warden | Reject user |
| POST | `/admin/create-admin` | Admin | Create admin account |
| GET | `/admin/users` | Admin/Warden | List all users |
| PUT | `/admin/users/:id/status` | Admin | Suspend / activate user |
| DELETE | `/admin/users/:id` | Admin | Hard delete user |
| PUT | `/admin/users/:id/reset-password` | Admin | Reset user password |
| GET | `/admin/audit-logs` | Admin | Last 100 audit log entries |

---

## 👥 User Roles

| Role | Registration | Key Capabilities |
|---|---|---|
| **Student** | Self-register + 2-stage approval | Apply for passes, view QR |
| **Warden** | Self-register + Admin approval | Approve/reject passes (hostel-scoped) |
| **Main Gate** | Self-register + Admin approval | Scan QR, log exit/entry, emergency exits |
| **Admin** | Seeded or created by Admin | Full system access, audit logs |

### Two-Stage Student Approval
```
Student registers
  → User.status = Pending      (cannot log in)
  → Student.registrationStatus = Pending  (cannot apply for passes)
  → Admin approves  → User.status = Active
  → Warden approves → Student.registrationStatus = Approved
  → Student can now log in and apply for passes ✅
```

---

## 🏫 NIT Hamirpur Departments

> Computer Science & Engineering · Civil Engineering · Electrical Engineering · Mechanical Engineering · Electronics & Communication Engineering · Chemical Engineering · Material Science & Engineering · Architecture · Physics & Photonics Science · Chemistry · Mathematics & Scientific Computing · Humanities & Social Sciences · Management Studies · Centre For Energy Studies

## 🏠 NIT Hamirpur Hostels

> **Boys:** Kailash · Himgiri · Udaygiri · Neelkanth · Dhauladhar · Vindhyachal · Shivalik
>
> **Girls:** Ambika · Parvati · Mani-Mahesh · Aravali · Satpura

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