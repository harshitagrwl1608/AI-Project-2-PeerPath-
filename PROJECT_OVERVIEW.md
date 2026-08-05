# PeerPath — Complete Project Overview

> **Tagline:** Trade skills, not money. Learn from peers, not strangers.

PeerPath is a campus peer skill-exchange web application where college students can list skills they can teach, find peers with complementary skills, book free 1-hour sessions, chat during those sessions, and build a rated skill profile — all at zero cost.

---

## Table of Contents

1. [Vision & Problem Statement](#1-vision--problem-statement)
2. [Tech Stack](#2-tech-stack)
3. [Project Architecture](#3-project-architecture)
4. [Database Schema](#4-database-schema)
5. [Backend API Reference](#5-backend-api-reference)
6. [Frontend Pages & Components](#6-frontend-pages--components)
7. [Feature Breakdown](#7-feature-breakdown)
8. [User Flows](#8-user-flows)
9. [Admin System](#9-admin-system)
10. [Security & Storage](#10-security--storage)
11. [Deployment](#11-deployment)
12. [Environment Variables](#12-environment-variables)

---

## 1. Vision & Problem Statement

### Who It's For
College students (B.Tech, BCA, B.Sc, Diploma) aged 18–24 across India, piloting in Delhi NCR.

### The Problem
- **No structured peer guidance** — students jump between random YouTube/Udemy sources with no accountability.
- **High dropout rates** — learners quit when stuck with no one to turn to.
- **No zero-cost knowledge exchange** — a student who knows Python and wants to learn video editing has no platform to trade those skills for free.

### The Solution
PeerPath is a skill-barter platform. Students list 2 skills they can teach and 2 they want to learn. The system matches them with compatible peers. They request a free 1-hour session, chat, meet via video link, and rate each other — building a verified skill profile over time.

---

## 2. Tech Stack

### Frontend
| Technology | Version | Role |
|---|---|---|
| **React** | 18.2 | UI framework |
| **Vite** | 5.2 | Build tool & dev server |
| **React Router DOM** | 6.23 | Client-side routing |
| **Tailwind CSS** | 3.4 | Utility-first CSS styling |
| **Lucide React** | 0.378 | Icon library |
| **PostCSS + Autoprefixer** | — | CSS processing |

### Backend
| Technology | Version | Role |
|---|---|---|
| **Node.js** | 20 | Runtime |
| **Express** | 4.19 | HTTP server & routing |
| **pg (node-postgres)** | 8.12 | PostgreSQL client |
| **bcryptjs** | 3.0 | Password hashing |
| **nodemailer** | 8.0 | Email/OTP delivery |
| **multer** | 2.1 | File upload handling (20 MB limit) |
| **cors** | 2.8 | Cross-Origin Resource Sharing |
| **dotenv** | 16.4 | Environment variable management |

### Database
| Technology | Role |
|---|---|
| **PostgreSQL** (hosted on Render) | Primary data store |
| JSONB columns | Storing skill arrays, chat messages, availability |
| UUID primary keys | Sessions & media records |
| BYTEA column | Binary storage for uploaded media files |

### Deployment
| Service | What It Hosts |
|---|---|
| **Render** | Node.js backend (auto-deploy via `render.yaml`) |
| **Vercel** | React frontend (auto-deploy via `vercel.json`) |

### Video Conferencing
| Technology | Role |
|---|---|
| **Jitsi Meet** (`meet.jit.si`) | Free, no-account video sessions generated per session |

---

## 3. Project Architecture

```
PeerPath/
├── backend/                   # Express.js REST API
│   ├── index.js               # App entry point, server bootstrap, auto-cleanup
│   ├── db.js                  # PostgreSQL pool + initDb()
│   ├── init.sql               # Schema definition (auto-runs on start)
│   ├── routes/
│   │   ├── authRoutes.js      # Login, OTP, password management
│   │   ├── userRoutes.js      # User CRUD, discovery feed data
│   │   ├── sessionRoutes.js   # Sessions, chat messages, media upload/download
│   │   ├── notificationRoutes.js  # In-app notifications
│   │   └── reportRoutes.js    # User reporting + admin review
│   ├── migrate_passwords.js   # One-time bcrypt migration script
│   ├── migrate_add_skill.js   # Schema migration for skill field
│   ├── alter_sessions.js      # Schema alter scripts
│   ├── create_media_table.js  # Media table migration
│   └── seed.js                # Sample data seeding
│
├── frontend/                  # React + Vite SPA
│   └── src/
│       ├── App.jsx            # Router setup, route guards
│       ├── context/
│       │   ├── AuthContext.jsx         # Global auth state
│       │   ├── NotificationContext.jsx # Notification polling & state
│       │   └── ToastContext.jsx        # Toast/snackbar notifications
│       ├── pages/
│       │   ├── Login.jsx              # Auth page (login + signup + forgot)
│       │   ├── ProfileSetup.jsx       # Onboarding & profile editing
│       │   ├── DiscoveryFeed.jsx      # Browse & search all users
│       │   ├── MySessions.jsx         # Session management hub
│       │   ├── AdminDashboard.jsx     # Admin control panel
│       │   └── AdminLogin.jsx         # Admin-specific login
│       ├── components/
│       │   ├── layout/                # Navbar/layout wrappers
│       │   ├── ChatModal.jsx          # In-session chat + media sharing
│       │   ├── UserProfileModal.jsx   # View any user's profile
│       │   ├── SkillCard.jsx          # User card shown in discovery feed
│       │   ├── ReportModal.jsx        # Report a user modal
│       │   ├── ChangePasswordModal.jsx# In-app password change
│       │   └── StatusBadge.jsx        # Session status indicator
│       └── services/                  # API call utilities
│
├── render.yaml                # Render deployment config (backend)
├── package.json               # Root-level workspace config
└── prd.md                     # Original Product Requirements Document
```

### Request Flow
```
Browser (React)
    │
    ├── AuthContext  ──────────────────────────────────────────────────┐
    │   (stores email + profile in state)                              │
    │                                                                  ▼
    └── API Calls (fetch)  ──►  Express Backend (Render)  ──►  PostgreSQL (Render)
            x-user-email header used instead of JWT tokens
```

**Authentication pattern:** Rather than JWT tokens, the backend identifies the caller via the `x-user-email` HTTP header set by the frontend after login. Admin routes additionally check that this email equals `admin@gmail.com`.

---

## 4. Database Schema

### `users`
| Column | Type | Description |
|---|---|---|
| `email` | VARCHAR (PK) | Unique identifier, also used as auth key |
| `name` | VARCHAR | Display name |
| `college` | VARCHAR | Institution name |
| `year` | VARCHAR | Academic year (e.g., "2nd") |
| `branch` | VARCHAR | Department/major |
| `skillsTeach` | JSONB | Array of skills the user can teach |
| `skillsLearn` | JSONB | Array of skills the user wants to learn |
| `showEmail` | BOOLEAN | Whether to show email on profile |
| `requestsUsed` | INTEGER | Session requests used (free plan limit) |
| `plan` | VARCHAR | `'free'` or `'pro'` |
| `rating` | NUMERIC | Average rating from all completed sessions |
| `totalSessions` | INTEGER | Total completed + rated sessions |
| `password` | VARCHAR | bcrypt-hashed password |
| `availability` | JSONB | Available days/times (key-value map) |
| `createdAt` | TIMESTAMP | Account creation time |

### `sessions`
| Column | Type | Description |
|---|---|---|
| `id` | UUID (PK) | Auto-generated session ID |
| `requesterEmail` | VARCHAR (FK→users) | User who sent the request |
| `targetUserEmail` | VARCHAR (FK→users) | User who received the request |
| `status` | VARCHAR | `pending` → `confirmed` → `completed` → `rated` (or `declined`) |
| `skill` | VARCHAR | The skill being exchanged |
| `message` | TEXT | Request message from requester |
| `date` | VARCHAR | Scheduled date |
| `time` | VARCHAR | Scheduled time |
| `meetLink` | VARCHAR | Auto-generated Jitsi Meet URL |
| `messages` | JSONB | Array of in-chat messages (capped at 50) |
| `createdAt` | TIMESTAMP | Request creation time |

### `session_media`
| Column | Type | Description |
|---|---|---|
| `id` | UUID (PK) | File record ID |
| `sessionId` | UUID (FK→sessions, CASCADE) | Parent session |
| `senderEmail` | VARCHAR (FK→users) | Who uploaded the file |
| `filename` | VARCHAR | Original filename |
| `mimetype` | VARCHAR | MIME type (image/pdf) |
| `size` | INTEGER | File size in bytes |
| `data` | BYTEA | Raw binary content |
| `uploadedAt` | TIMESTAMP | Upload time |

### `reports`
| Column | Type | Description |
|---|---|---|
| `id` | SERIAL (PK) | Auto-incrementing report ID |
| `reporterEmail` | VARCHAR (FK→users) | Who filed the report |
| `reportedEmail` | VARCHAR (FK→users) | Who is being reported |
| `reason` | TEXT | Reason text |
| `status` | VARCHAR | `pending`, `reviewed`, `dismissed` |
| `createdAt` | TIMESTAMP | Report submission time |

### `auth_otps`
| Column | Type | Description |
|---|---|---|
| `email` | VARCHAR (PK) | Email address requesting OTP |
| `otp` | VARCHAR | 6-digit OTP |
| `expiresAt` | TIMESTAMP | 5-minute expiry window |

### `notifications`
| Column | Type | Description |
|---|---|---|
| `id` | SERIAL (PK) | Notification ID |
| `userEmail` | VARCHAR | Recipient |
| `type` | VARCHAR | `request`, `status_update`, `upcoming` |
| `title` | VARCHAR | Short notification title |
| `message` | TEXT | Full notification body |
| `isRead` | BOOLEAN | Read/unread state |
| `createdAt` | TIMESTAMP | Creation time |

---

## 5. Backend API Reference

### Auth (`/api/auth`)
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/login` | Email + password login; returns user object |
| `POST` | `/request-otp` | Generates & emails a 6-digit OTP (5-min TTL) |
| `POST` | `/verify-otp` | Validates OTP and deletes it on success |
| `POST` | `/change-password` | bcrypt-hashes and saves new password |

### Users (`/api/users`)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | All users (excluding admin) — powers discovery feed |
| `GET` | `/:email` | Single user profile |
| `POST` | `/` | Create or upsert user profile |
| `DELETE` | `/:email` | **Admin only** — remove user + all their sessions |

### Sessions (`/api/sessions`)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/all` | **Admin only** — all sessions platform-wide |
| `GET` | `/` | Sessions for the calling user (requester or target) |
| `GET` | `/:id` | Single session by ID |
| `POST` | `/` | Create session request; auto-generates Jitsi link if date/time set; sends notification |
| `PATCH` | `/:id` | Update status, schedule, rating, messages; triggers peer rating update |
| `PATCH` | `/:id/messages/:msgIndex` | Atomically update one message's status (reschedule accept/decline) |
| `DELETE` | `/:id` | Delete session; sends notification if target declines pending request |
| `POST` | `/:id/messages` | Append a chat message to the session's JSONB array (max 50) |
| `POST` | `/:id/media` | Upload image/PDF (≤20 MB) to `session_media` table |
| `GET` | `/:id/media/:mediaId` | Stream/download uploaded file |

### Reports (`/api/reports`)
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/` | Submit a user report |
| `GET` | `/` | **Admin only** — all reports with user names |
| `PATCH` | `/:id` | **Admin only** — update report status |
| `DELETE` | `/:id` | **Admin only** — delete a report |

### Notifications (`/api/notifications`)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | All notifications for calling user |
| `PATCH` | `/read-all` | Mark all as read |
| `PATCH` | `/:id/read` | Mark single notification as read |

### Health Check
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Returns `{ status: 'ok', database: 'connected' }` |

---

## 6. Frontend Pages & Components

### Pages

#### `/login` — Login Page
- Email + password sign-in
- New user sign-up with OTP email verification
- Forgot password flow (OTP → new password)
- Animated, styled onboarding UI

#### `/setup` — Profile Setup
- Set name, college, year, branch
- Add skills to teach (with custom + preset options)
- Add skills to learn
- Set weekly availability (day/time grid)
- Privacy toggle to show/hide email
- Edit mode for existing profile

#### `/` — Discovery Feed
- Browse all registered users in card grid
- Search by name or skill
- Filter by category (Programming, Design, Music, etc.)
- View any user's full profile in a modal
- Send session request directly from card
- See match score based on complementary skills

#### `/sessions` — My Sessions
- Tabbed view: Pending / Confirmed / Completed / All
- Accept or decline incoming requests (target user)
- Reschedule: propose a new date/time via chat message
- Open chat window for confirmed sessions
- Mark session as complete
- Rate peer (1–5 stars) after completion
- Join session via Jitsi Meet link

#### `/admin` — Admin Dashboard *(admin@gmail.com only)*
- Platform stats (total users, sessions, reports)
- Searchable user list with delete action
- All sessions across the platform
- Report management (review / dismiss)
- Separate admin login page at `/admin-login`

### Components

#### `ChatModal.jsx`
- Full chat UI for confirmed sessions
- Send text messages (stored in JSONB, capped at 50)
- Upload images and PDFs (up to 20 MB) via "+" button
- Preview uploaded images inline; PDFs shown as download link
- Reschedule proposal: sends a special message with accept/decline buttons
- Messages cleared automatically when session is completed or rated

#### `UserProfileModal.jsx`
- Displays full profile: avatar, college, year, branch, skills, availability, rating
- "Send Request" button with skill selector and message field
- "Report" button to flag the user

#### `SkillCard.jsx`
- Compact user card shown in discovery feed
- Shows name, college, top skills, rating, total sessions

#### `ReportModal.jsx`
- Reason text area
- Submits to `/api/reports`

#### `ChangePasswordModal.jsx`
- OTP verification + new password fields
- Calls `/api/auth/request-otp`, `/api/auth/verify-otp`, `/api/auth/change-password`

#### `StatusBadge.jsx`
- Color-coded pill: Pending (yellow), Confirmed (green), Completed (blue), Declined (red), Rated (purple)

### Context Providers

#### `AuthContext`
- Stores `currentUser` (email) and `userProfile` (full user object)
- Provides `login()`, `logout()`, `updateProfile()` helpers
- Persists session in `localStorage`

#### `NotificationContext`
- Polls `/api/notifications` every 30 seconds
- Tracks unread count (shown as badge in navbar)
- Exposes `markRead()` and `markAllRead()`

#### `ToastContext`
- App-wide toast/snackbar notifications
- `showToast(message, type)` — types: `success`, `error`, `info`

---

## 7. Feature Breakdown

### 🔐 Authentication
- **Email + Password login** with bcrypt hashing (salt rounds: 10)
- **OTP-based signup**: user enters email → receives 6-digit OTP → verified → sets password → profile saved
- **Forgot password**: same OTP flow, skips user-creation step
- **In-app password change**: from profile settings with OTP re-verification
- **Admin login**: dedicated `/admin-login` route; email `admin@gmail.com` auto-redirected to dashboard

### 👤 User Profiles
- Name, college, year, branch, skills to teach, skills to learn
- Weekly availability grid (e.g., Mon 10am–12pm)
- Toggle to publicly show/hide email address
- Rating score (auto-calculated average from all rated sessions)
- Total sessions counter (incremented on `rated` status)
- Plan tier: `free` or `pro`

### 🔍 Discovery Feed
- Lists all users (admin excluded) fetched from `/api/users`
- Client-side search by name or any skill keyword
- Filter chips by skill category
- Skill match indicator between viewer and each user

### 📅 Session Lifecycle
```
Requester sends request (pending)
    ↓
Target accepts → status: confirmed  [OR]  Target declines → deleted / status: declined
    ↓
Either party can open Chat window
    ↓
Requester marks session complete → status: completed  (media + messages purged)
    ↓
Either party rates the peer (1–5 stars) → status: rated  (peer's rating recalculated)
```

### 💬 In-Session Chat
- Text messages stored as JSONB array in the `sessions` row
- Max 50 messages stored (oldest evicted automatically)
- File sharing: images and PDFs up to 20 MB stored as BYTEA in `session_media`
- Inline image preview; PDF download link
- Reschedule proposal: special message type shown with ✅/❌ buttons to the other party
- All messages and media are **wiped** when session moves to `completed` or `rated`

### 🎥 Video Sessions
- On session creation with date + time → a unique **Jitsi Meet** URL is generated:
  `https://meet.jit.si/PeerPath-<random-16-byte-hex>`
- URL persisted in `sessions.meetLink`
- Both parties can "Join Stream" at any time from the session card

### 🔔 In-App Notifications
- Automatically created on backend for:
  - New session request received
  - Session accepted
  - Session declined
- Frontend polls every 30 seconds
- Unread count badge shown in navbar
- Mark individual or all as read

### 🚩 User Reporting
- Any user can report another via profile modal
- Reason text submitted to `reports` table
- Admin reviews in dashboard and can mark `reviewed` / `dismissed` or delete

### 🧹 Automated Storage Cleanup
- On server boot + every 24 hours:
  - Sessions older than 14 days are automatically deleted
- On session `completed` or `rated`:
  - All `session_media` records for that session deleted
  - `messages` JSONB array reset to `[]`

---

## 8. User Flows

### New User Signup
```
/login
  ↓ Enter email → "Send OTP"
  ↓ Enter 6-digit OTP from email
  ↓ OTP verified → set password
  ↓ Profile saved → redirect to /setup
/setup
  ↓ Fill name, college, year, branch
  ↓ Add skills to teach & learn
  ↓ Set availability
  ↓ Save → redirect to / (Discovery Feed)
```

### Requesting a Session
```
Discovery Feed → click user card
  ↓ UserProfileModal opens
  ↓ Select skill, write message, pick date/time
  ↓ "Send Request" → POST /api/sessions
  ↓ Target receives notification
  ↓ Target sees session in /sessions under "Pending"
  ↓ Target clicks Accept → PATCH /api/sessions/:id { status: 'confirmed' }
  ↓ Requester gets "Session Accepted!" notification
  ↓ Both can now open Chat & Join Stream
```

### Completing & Rating
```
/sessions → confirmed session card
  ↓ "Mark Complete" → PATCH { status: 'completed' } (media + messages wiped)
  ↓ "Rate Session" → PATCH { status: 'rated', rating: 1-5, peerEmail }
  ↓ Peer's totalSessions +1, rating recalculated
```

---

## 9. Admin System

Accessible only to `admin@gmail.com` via `/admin` (auto-redirect enforced in route guards).

### Capabilities
| Feature | Description |
|---|---|
| **User Management** | View all users, search by name/email, delete user (cascades sessions) |
| **Session Oversight** | View all sessions across the platform with requester/target names |
| **Report Management** | Review submitted reports, update status, delete resolved reports |
| **Platform Stats** | Counts of total users, sessions, pending reports |

### Security
- `isAdmin()` helper in every admin route checks `req.headers['x-user-email'] === 'admin@gmail.com'`
- Frontend route guard redirects any non-admin user away from `/admin`
- Admin is excluded from the discovery feed user list

---

## 10. Security & Storage

### Password Security
- Passwords hashed with **bcrypt** (salt factor: 10) before storage
- Password field stripped from all API responses before sending to client
- OTPs expire after **5 minutes** and are deleted after successful verification

### File Storage
- Media files stored as **BYTEA** directly in PostgreSQL (no external S3/cloud storage)
- 20 MB per file limit enforced by multer
- Files cascade-deleted when parent session is deleted
- Files explicitly purged when session completes or is rated

### Auth Model
- No JWT tokens — uses `x-user-email` header pattern
- Sessions persisted in browser `localStorage` via `AuthContext`
- All sensitive admin routes double-check the email server-side

---

## 11. Deployment

### Backend (Render)
- **Service type:** Web Service (Node.js)
- **Root directory:** `backend/`
- **Build command:** `npm install`
- **Start command:** `npm start` → `node index.js`
- **Node version:** 20
- **Auto-deploys** from `main` branch on push

### Frontend (Vercel)
- **Framework:** Vite (React SPA)
- **Root directory:** `frontend/`
- **Build command:** `npm run build`
- **Output directory:** `dist/`
- **SPA fallback:** `vercel.json` routes all paths to `index.html`

---

## 12. Environment Variables

### Backend (`.env`)
```env
DATABASE_URL=postgresql://user:password@host/dbname   # Render PostgreSQL connection string
PORT=3001                                              # Server port (default 3001)
SMTP_HOST=smtp.gmail.com                              # (Optional) Real SMTP host
SMTP_USER=your@gmail.com                              # (Optional) Gmail user for OTP emails
SMTP_PASS=your-app-password                           # (Optional) Gmail app password
SMTP_PORT=587                                         # (Optional) SMTP port
```

> If `SMTP_USER` / `SMTP_PASS` are not set, the backend uses a **mock email transporter** that logs OTPs to the console and returns them in the API response for prototype testing.

### Frontend (`.env`)
```env
VITE_API_URL=https://your-backend.onrender.com        # Backend base URL
```

---

## Key Design Decisions

| Decision | Rationale |
|---|---|
| `x-user-email` header instead of JWT | Simpler prototype auth; avoids token refresh complexity |
| JSONB for skills & messages | Flexible schema without migrations for arrays |
| BYTEA for media | Avoids needing a separate file storage service (S3, Cloudinary) for prototype |
| Jitsi Meet for video | Zero cost, no account required, no API key needed |
| 14-day session auto-cleanup | Prevents unbounded database growth on free-tier PostgreSQL |
| Mock email transporter fallback | Allows full OTP flow to be demoed without SMTP credentials |
| Chat message cap at 50 | Keeps JSONB column size bounded; oldest messages evicted |

---

*Generated: May 2026 | PeerPath v1.0*
