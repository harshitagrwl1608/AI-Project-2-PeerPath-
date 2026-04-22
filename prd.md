# PeerPath — Product Requirements Document (PRD)
*Version:* 1.0  
*Team:* 4 members  
*Hackathon:* Antigravity  
*Date:* April 2026  

---

## 1. Project Overview

*Project Name:* PeerPath  
*Tagline:* Trade skills, not money. Learn from peers, not strangers.  
*Type:* Web Application (Mobile-first)  
*Target Users:* College students across India

---

## 2. Problem Statement

College students face three critical learning problems:

- *No structured guidance* — Students consume random tutorials from YouTube, Udemy, books and websites simultaneously which creates confusion about which source to trust and which concept to prioritise.
- *Language/course switching* — Students frequently switch between programming languages and courses. When they get stuck, they quit instead of pushing through.
- *No peer-to-peer learning system* — There is no platform where a student who knows Python can teach it to someone who knows video editing in return, creating a zero-cost knowledge exchange.

These problems result in slow learning, wasted time, and high dropout rates from self-learning journeys.

---

## 3. Proposed Solution

SkillBridge is a campus peer skill-exchange platform where college students:

1. List skills they can *teach*
2. List skills they want to *learn*
3. Get *matched* with compatible peers
4. Book free *1-hour sessions* with each other
5. Rate the session and build a *verified skill profile*

No money changes hands. Just skill for skill.

---

## 4. Target Users

| User Type | Description |
|-----------|-------------|
| Primary | College students (B.Tech, BCA, BCA, B.Sc) aged 18–24 |
| Secondary | Diploma students and recent graduates |
| Geography | India (Delhi NCR for pilot) |

---

## 5. Core Features

### 5.1 Free Plan (0 cost)
- Register with college email (Google login)
- Create profile with name, college, year, branch
- List up to 2 skills to teach
- List up to 2 skills to learn
- Browse discovery feed of other students
- Send up to *5 session requests* per month
- Rate completed sessions

### 5.2 Pro Plan (₹49/month)
- Everything in Free
- Unlimited session requests
- Unlimited skills listed
- *In-app chat* with matched peers
- *Verified Pro badge* on profile
- Priority placement in discovery feed
- Session history and progress tracking

---

## 6. User Flow


Register (Google login)
    ↓
Complete Profile
(name, college, year, branch)
    ↓
Add skills you teach + skills you want to learn
    ↓
Browse Discovery Feed
(filter by skill category)
    ↓
Send Session Request to a peer
    ↓
Peer accepts → Session confirmed
    ↓
1-hour skill exchange session (online/offline)
    ↓
Both users rate each other (1–5 stars)
    ↓
Rating added to profile → builds credibility


---

## 7. Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Frontend | React.js + Tailwind CSS | Fast UI, beginner friendly |
| Backend / Database | Firebase Firestore | No server needed, real-time, free tier |
| Authentication | Firebase Auth (Google) | One-click login with college Gmail |
| Hosting | Firebase Hosting / Vercel | Free, one-command deploy |
| Payments (Pro) | Razorpay | India-first, easy integration |

---

## 8. Database Structure (Firebase Firestore)


users/
  {userId}/
    name: "Rahul Sharma"
    college: "Delhi University"
    year: "3rd"
    branch: "CSE"
    plan: "free" | "pro"
    requestsUsed: 3
    skillsTeach: ["React", "Python"]
    skillsLearn: ["Guitar", "Video Editing"]
    rating: 4.8
    totalSessions: 5

sessions/
  {sessionId}/
    requesterId: userId
    receiverId: userId
    skill: "React"
    status: "pending" | "confirmed" | "completed"
    scheduledAt: timestamp
    rating: 4 | 5


---

## 9. Screen List

| Screen | Description |
|--------|-------------|
| 1. Onboarding / Login | Google sign-in with college email |
| 2. Profile Setup | Name, college, year, branch, skills |
| 3. Discovery Feed | Browse student cards, filter by skill |
| 4. Student Profile View | View another student's skills and ratings |
| 5. Session Request | Send a session request with a message |
| 6. My Sessions | Upcoming and past sessions |
| 7. Rating Screen | Rate a completed session |
| 8. My Profile | Edit skills, view stats |
| 9. Upgrade / Pricing | Free vs Pro comparison and payment |

---

## 10. Monetisation Strategy

| Plan | Price | Limits |
|------|-------|--------|
| Free | ₹0/month | 5 requests, 2 skills listed, no chat |
| Pro | ₹49/month | Unlimited requests, unlimited skills, chat, badge |

*Why ₹49?* It is less than a meal in a college canteen. The price point removes friction for conversion while generating sustainable revenue.

*Upgrade triggers built into the app:*
- Progress bar showing "3 of 5 requests used" on home screen
- Lock icon on Pro users' cards visible to free users
- Nudge banner on profile when 1 request remains

---

## 11. Team Division of Work

| Member | Responsibility |
|--------|---------------|
| Member 1 | Auth screens (login, onboarding, profile setup) |
| Member 2 | Discovery feed, skill cards, filter chips |
| Member 3 | Session request flow, my sessions page, rating screen |
| Member 4 | Firebase setup, database, connecting frontend to backend + pitch deck |

---

## 12. MVP Scope (for Hackathon)

Build only these for the demo:
- [ ] Google login
- [ ] Profile setup with skills
- [ ] Discovery feed (at least 3–4 dummy users pre-loaded)
- [ ] Send session request button
- [ ] My sessions page
- [ ] Pricing / upgrade page (static, no real payment needed for demo)

---

## 13. Unique Selling Points (for Pitch)

1. *Zero cost learning* — No money involved, purely skill barter
2. *Hyper-local* — Campus-first, not a global platform
3. *Solves real confusion* — Structured peer guidance instead of random YouTube hopping
4. *Freemium model* — Sustainable business at ₹49/mo, accessible to every student
5. *Builds credibility* — Rated skill profiles act as a lightweight portfolio