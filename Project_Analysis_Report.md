# 📋 Smart Campus AI Interview System — Project Analysis Report

**Project:** Smart Campus AI Interview System  
**Date:** April 21, 2026  
**Analyzed By:** Antigravity AI Code Analyst  
**Repository:** avrsulochana0720/Smart-Campus-AI-Interview-System

---

## 1. Project Overview

The **Smart Campus AI Interview System** is a full-stack AI-powered interview platform designed for campus recruitment. It automates the interview process using AI-generated questions and AI-evaluated answers.

### 1.1 Technology Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| **Frontend Framework** | React + TypeScript | React 18.3.1 |
| **Build Tool** | Vite | 6.3.5 |
| **Styling** | Tailwind CSS + CSS Modules | Mixed |
| **UI Libraries** | Radix UI, MUI, Lucide Icons | Various |
| **Routing** | React Router DOM | 7.14.0 |
| **HTTP Client** | Axios | 1.15.0 |
| **Backend** | Python FastAPI | Latest |
| **Database** | SQLAlchemy + SQLite | Latest |
| **AI Service** | OpenAI GPT-3.5 Turbo | Latest |
| **Auth** | JWT (python-jose) + bcrypt | Latest |

### 1.2 Application Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (React/Vite)                 │
│  Landing → Login/Register → Resume → Job → Interview    │
│     → Instructions → Interview Session → Thank You      │
│              → Dashboard → Placement Head               │
├─────────────────────────────────────────────────────────┤
│                   REST API (Axios)                       │
├─────────────────────────────────────────────────────────┤
│                 BACKEND (FastAPI)                        │
│   Auth (JWT) │ Resume Parser │ Interview CRUD            │
│   Question Generator │ Answer Evaluator                  │
├─────────────────────────────────────────────────────────┤
│               DATABASE (SQLite/SQLAlchemy)               │
│   Users │ Resumes │ Interviews │ InterviewQuestions       │
├─────────────────────────────────────────────────────────┤
│                AI SERVICE (OpenAI API)                   │
│   Question Generation │ Answer Evaluation                │
└─────────────────────────────────────────────────────────┘
```

### 1.3 User Flow

```
Home Page → Register/Login → Upload Resume (PDF/TXT)
   → Select Job Role & Company → Read Instructions
   → AI Interview Session (Speech-to-Text + Text Input)
   → Thank You Page → Dashboard (Reports & History)
```

### 1.4 Database Schema

| Table | Key Columns |
|-------|-------------|
| **users** | id, name, email, password (hashed) |
| **resumes** | id, user_id (FK), resume_text, uploaded_at |
| **interviews** | id, user_id (FK), resume_id (FK), job_role, company, status, created_at |
| **interview_questions** | id, interview_id (FK), question, answer, score, feedback, order_index |

---

## 2. File Structure

```
app/
├── backend/
│   ├── main.py              # FastAPI server (637 lines) — All API endpoints
│   ├── models.py            # SQLAlchemy models (44 lines)
│   ├── database.py          # DB engine & session config (26 lines)
│   ├── ai_service.py        # OpenAI integration (316 lines)
│   ├── requirements.txt     # Python dependencies
│   ├── test_ai_questions.py # AI question tests
│   └── test_all_apis.py     # API integration tests
├── src/
│   ├── App.tsx              # Router & route definitions
│   ├── main.tsx             # Entry point with BrowserRouter
│   ├── utils/api.ts         # Axios instance & API functions
│   ├── app/
│   │   ├── components/
│   │   │   ├── Hero.tsx         # Landing page hero section
│   │   │   ├── Navbar.tsx       # Navigation bar
│   │   │   ├── Features.tsx     # Features section
│   │   │   ├── CTA.tsx          # Call to action
│   │   │   ├── FooterNew.tsx    # Footer component
│   │   │   └── interview/page.tsx  # Alternate interview component (unused)
│   │   ├── login/page.tsx       # Login page
│   │   ├── register/page.tsx    # Registration page
│   │   ├── resume/page.tsx      # Resume upload page
│   │   ├── job/page.tsx         # Job role & company selection
│   │   ├── instructions/page.tsx# Pre-interview instructions
│   │   ├── interview/interview.tsx # Main interview session
│   │   ├── thank/page.tsx       # Thank you page
│   │   ├── dashboard/page.tsx   # User dashboard
│   │   └── placement-head/page.tsx # Admin/TPO dashboard
│   └── styles/                  # CSS Modules & global styles (17 files)
├── package.json
├── vite.config.ts
└── tsconfig.json
```

---

## 3. Bugs Found & Fixed

### 3.1 Critical Bugs (7 Found, 6 Fixed)

| # | Bug Description | File | Status |
|---|----------------|------|--------|
| 1 | **Broken API Route** — Backend had `@app.post("/rview")` but frontend calls `/create-interview`. Interview creation was completely non-functional. | `backend/main.py:261` | ✅ Fixed |
| 2 | **react/react-dom missing from dependencies** — Listed as optional peerDependencies, causing potential install failures. | `package.json` | ✅ Fixed |
| 3 | **Stale Closure in Speech Recognition** — `setAnswer(answers[currentQuestionIndex] + finalTranscript)` used stale array reference, overwriting previous transcription. | `interview.tsx:152` | ✅ Fixed |
| 4 | **submitAnswer Response Type Mismatch** — API returns `next_question` as a string, but code set it directly as `currentQuestion` (object), causing `.question` and `.question_id` to be `undefined`. | `interview.tsx:69-76` | ✅ Fixed |
| 5 | **Broken JSX — Missing `</div>` + Extra `</div>`** — Reports section had (a) a missing closing tag for a progress bar container and (b) an orphan `</div>` that broke the entire fragment. | `dashboard/page.tsx:389,433` | ✅ Fixed |
| 6 | **Hero Modals Don't Call Real API** — Register/Login modals in Hero component just did `console.log` and navigated without saving data to the backend. | `Hero.tsx:25-53` | ✅ Fixed |
| 7 | **`datetime.utcnow` Deprecated** — Used as column default in Python 3.12+. | `models.py` | ⚠️ Noted |

### 3.2 Significant Issues (10 Found, 4 Fixed)

| # | Issue Description | File | Status |
|---|------------------|------|--------|
| 8 | **Hardcoded JWT Secret Key** — `SECRET_KEY = "your-secret-key-here"` in production code. | `main.py:19` | ⚠️ Noted |
| 9 | **Hardcoded OpenAI API Key Fallback** — Invalid placeholder string used as default. | `ai_service.py:7` | ⚠️ Noted |
| 10 | **Excessive DEBUG console.log Statements** — ~30+ debug print statements in API client and backend. | `api.ts`, `main.py` | ✅ Fixed (frontend) |
| 11 | **No Auth Guard / Route Protection** — All pages accessible without login. No `ProtectedRoute` component. | `App.tsx` | ⚠️ Noted |
| 12 | **Dashboard Uses Hardcoded Mock Data** — Shows "John Doe", "85%" etc. instead of real user data. | `dashboard/page.tsx` | ⚠️ Noted |
| 13 | **Placement Head Page Not Routable** — Component existed but had no route in App.tsx. | `App.tsx` | ✅ Fixed |
| 14 | **Resume Page Navigates on Failure** — Navigated to `/job` even when upload failed, with a "for testing" comment. | `resume/page.tsx:41-43` | ✅ Fixed |
| 15 | **Duplicate Interview Component** — Two separate interview components exist; one is orphaned. | `components/interview/` | ⚠️ Noted |
| 16 | **`on_event("startup")` Deprecated** — Should use FastAPI lifespan context manager. | `main.py:139` | ⚠️ Noted |
| 17 | **`python-multipart` Missing** — Required for FastAPI file uploads but not in requirements.txt. | `requirements.txt` | ✅ Fixed |

### 3.3 Minor Issues (9 Found, 2 Fixed)

| # | Issue Description | File | Status |
|---|------------------|------|--------|
| 18 | **Typo: "etheral" → "ethereal"** | `Hero.tsx:106` | ✅ Fixed |
| 19 | **Copyright Year Hardcoded to 2024** | Multiple files | ⚠️ Noted |
| 20 | **`via.placeholder.com` Used for Profile Image** — Shows broken image. | `dashboard/page.tsx:217` | ⚠️ Noted |
| 21 | **No 404 Page** — Invalid routes showed blank page. | `App.tsx` | ✅ Fixed |
| 22 | **`@types/react-dom` version mismatch** — v19 types with React 18 runtime. | `package.json` | ⚠️ Noted |
| 23 | **Save Draft button has no handler** | `interview.tsx:384` | ⚠️ Noted |
| 24 | **Logout button has no handler** | `thank/page.tsx`, `interview.tsx` | ⚠️ Noted |
| 25 | **Interview timer is cosmetic only** — Counts down but has no functional impact. | `interview.tsx` | ⚠️ Noted |
| 26 | **`declarative_base()` deprecated** — Should use `sqlalchemy.orm.DeclarativeBase`. | `database.py:17` | ⚠️ Noted |

---

## 4. Detailed Changes Made

### 4.1 Backend — `main.py`

**Route Fix:**
```diff
- @app.post("/rview")
+ @app.post("/create-interview")
```
*Impact: Interview creation endpoint was completely unreachable from the frontend.*

### 4.2 Backend — `requirements.txt`

**Added Missing Dependency:**
```diff
  openai
+ python-multipart
```
*Impact: FastAPI file upload (`UploadFile`) requires this package to parse multipart form data.*

### 4.3 Frontend — `package.json`

**Moved react/react-dom to dependencies:**
```diff
- "vaul": "1.1.2"
+ "vaul": "1.1.2",
+ "react": "^18.3.1",
+ "react-dom": "^18.3.1"
```
*Impact: Ensures React is always installed as a direct dependency, not optional.*

### 4.4 Frontend — `interview.tsx`

**Fixed stale closure in speech recognition:**
```diff
- newAnswers[currentQuestionIndex] = newAnswers[currentQuestionIndex] + finalTranscript;
+ newAnswers[currentQuestionIndex] = (newAnswers[currentQuestionIndex] || '') + finalTranscript;
...
- setAnswer(answers[currentQuestionIndex] + finalTranscript);
+ setAnswer(prev => prev + finalTranscript);
```
*Impact: Speech-to-text now properly appends text instead of overwriting with stale data.*

**Fixed submitAnswer response handling:**
```diff
- if (result.next_question) {
-   setCurrentQuestion(result.next_question);  // BUG: string, not object
+ if (result.is_complete) {
+   setIsCompleted(true);
+ } else if (result.next_question && result.question_id) {
+   setCurrentQuestion({
+     question_id: result.question_id,
+     question: result.next_question,
+   });
```
*Impact: Next question now renders correctly with proper question_id for subsequent submissions.*

### 4.5 Frontend — `dashboard/page.tsx`

**Fixed broken JSX nesting (2 issues):**
1. Added missing `</div>` for progress bar container
2. Removed orphan `</div>` that broke the Reports fragment

*Impact: Dashboard Reports section now renders without crashing.*

### 4.6 Frontend — `Hero.tsx`

**Wired modals to real API:**
```diff
- const handleRegister = (e: React.FormEvent) => {
-   console.log('Register:', registerData);
-   alert('Registration successful!');
-   navigate('/resume');
+ const handleRegister = async (e: React.FormEvent) => {
+   await authAPI.register('User', registerData.email, registerData.password);
+   navigate('/login');
```
*Impact: Users registering from the landing page modal are now actually saved to the database.*

### 4.7 Frontend — `resume/page.tsx`

**Don't navigate on upload failure:**
```diff
- } catch (err) {
-   setError("Upload failed, but continuing to next page...");
- } finally {
-   navigate("/job");  // Always navigated!
+ } catch (err: any) {
+   setError(errorMessage);
+   setUploading(false);
```
*Impact: Users now see a proper error message when upload fails instead of silently continuing.*

### 4.8 Frontend — `App.tsx`

**Added missing routes:**
```diff
+ <Route path="/placement-head" element={<PlacementHead />} />
+ <Route path="*" element={<div>404 - Page not found</div>} />
```
*Impact: Placement Head dashboard is now accessible; invalid URLs show 404 instead of blank page.*

### 4.9 Frontend — `api.ts`

**Cleaned up debug logging:**
Removed ~25 `console.log('DEBUG ...')` statements throughout the API client, keeping only essential error logging.

*Impact: Browser console is no longer flooded with debug messages in production.*

---

## 5. Security Observations

| Priority | Issue | Recommendation |
|----------|-------|----------------|
| 🔴 HIGH | JWT secret key is hardcoded as `"your-secret-key-here"` | Use environment variable: `os.getenv("JWT_SECRET_KEY")` |
| 🔴 HIGH | OpenAI API key has invalid fallback string | Remove fallback; require env variable |
| 🟡 MEDIUM | CORS allows all origins (`"*"`) | Restrict to frontend URL in production |
| 🟡 MEDIUM | No rate limiting on auth endpoints | Add rate limiting for login/register |
| 🟡 MEDIUM | No route protection / auth guard | Implement `ProtectedRoute` wrapper |
| 🟢 LOW | Token stored in localStorage | Consider HttpOnly cookies for XSS protection |

---

## 6. Performance & Code Quality

### 6.1 Strengths
- Clean separation of frontend/backend
- Proper use of CSS Modules for scoped styling
- JWT-based authentication with interceptors
- AI fallback to template-based questions when OpenAI is unavailable
- Proper Pydantic validation on all request models
- Good error handling in backend endpoints with try/catch

### 6.2 Areas for Improvement
- **State Management**: No global state solution (Redux/Zustand/Context) — user data is not shared across components
- **Dashboard Data**: Mostly hardcoded mock data instead of fetching real user profile and stats
- **Error Boundaries**: No React error boundaries for graceful failure handling
- **Testing**: Test files exist but no test runner configured in package.json
- **TypeScript Strictness**: Some `any` types used (e.g., speech recognition events)
- **Duplicate Code**: Two interview components with overlapping functionality
- **Accessibility**: No ARIA labels, focus management, or keyboard navigation

---

## 7. Summary

| Category | Count |
|----------|-------|
| **Total Bugs/Issues Found** | 26 |
| **Critical Bugs Fixed** | 6 |
| **Significant Issues Fixed** | 4 |
| **Minor Issues Fixed** | 2 |
| **Remaining (Noted)** | 14 |
| **Build Status** | ✅ Passing |

### Key Fixes Applied:
1. ✅ Backend `/create-interview` route was broken (`/rview`)
2. ✅ React/ReactDOM moved to proper dependencies
3. ✅ Speech-to-text stale closure bug fixed
4. ✅ Interview next-question response handling fixed
5. ✅ Dashboard JSX nesting crash fixed
6. ✅ Hero register/login wired to real API
7. ✅ Resume upload no longer silently fails
8. ✅ Placement Head dashboard route added
9. ✅ 404 catch-all page added
10. ✅ `python-multipart` dependency added
11. ✅ Debug console.log statements cleaned up
12. ✅ Typo "etheral" → "ethereal" fixed

---

*Report generated on April 21, 2026 by Antigravity AI Code Analyst*
