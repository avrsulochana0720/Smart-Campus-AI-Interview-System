# Database Schema Documentation

## Overview
The Smart Campus AI Interview System uses MySQL database with SQLAlchemy ORM. This document describes all tables, relationships, and the new InterviewReport table.

---

## Database Structure

```
┌──────────────────────────────────────┐
│            DATABASE                  │
│   smart_campus_interview             │
└──────────────────────────────────────┘
         │
    ┌────┴────┬──────────┬──────────┬─────────────────┐
    │          │          │          │                 │
    ▼          ▼          ▼          ▼                 ▼
┌────────┐ ┌────────┐ ┌──────────┐ ┌──────────────┐ ┌──────────────┐
│ users  │ │resumes │ │interviews│ │interview_    │ │interview_    │
│        │ │        │ │          │ │questions     │ │reports (NEW) │
└────────┘ └────────┘ └──────────┘ └──────────────┘ └──────────────┘
```

---

## Table: users

**Purpose**: Store user account information and authentication details.

**Fields**:

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY, AUTO_INCREMENT | Unique user identifier |
| name | VARCHAR(255) | NOT NULL | Full name of user |
| email | VARCHAR(255) | UNIQUE, NOT NULL, INDEX | Email address (unique) |
| password | VARCHAR(255) | NOT NULL | Hashed password (pbkdf2_sha256) |
| profile_image | VARCHAR(255) | NULLABLE | URL to user's profile photo |

**Example Data**:
```
id | name      | email              | password                            | profile_image
1  | John Doe  | john@example.com   | $pbkdf2-sha256$260000$...           | http://localhost:8000/uploads/...
2  | Jane Smith| jane@example.com   | $pbkdf2-sha256$260000$...           | NULL
```

---

## Table: resumes

**Purpose**: Store uploaded resume files and extracted resume text.

**Fields**:

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY, AUTO_INCREMENT | Unique resume identifier |
| user_id | INTEGER | FOREIGN KEY → users(id) | User who uploaded the resume |
| resume_text | LONGTEXT | NULLABLE | Extracted text from PDF/file |
| uploaded_at | DATETIME | DEFAULT: utcnow | Timestamp of upload |

**Example Data**:
```
id | user_id | resume_text                                    | uploaded_at
1  | 1       | "John Doe\n10+ years experience in...\n..."     | 2024-05-13 08:30:00
2  | 2       | "Jane Smith\nSoftware Engineer at TechCorp\n..." | 2024-05-13 08:45:00
```

---

## Table: interviews

**Purpose**: Store interview session information for each user.

**Fields**:

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY, AUTO_INCREMENT | Unique interview identifier |
| user_id | INTEGER | FOREIGN KEY → users(id) | User taking the interview |
| resume_id | INTEGER | FOREIGN KEY → resumes(id), NULLABLE | Associated resume |
| job_role | VARCHAR(255) | NOT NULL | Position being interviewed for |
| company | VARCHAR(255) | NOT NULL | Company conducting interview |
| status | VARCHAR(50) | DEFAULT: "in_progress" | Current status (in_progress, completed, failed) |
| summary | LONGTEXT | NULLABLE | Interview summary (legacy field) |
| created_at | DATETIME | DEFAULT: utcnow | Timestamp of interview creation |

**Example Data**:
```
id | user_id | resume_id | job_role           | company   | status      | created_at
1  | 1       | 1         | Software Engineer  | TechCorp  | completed   | 2024-05-13 09:00:00
2  | 2       | 2         | Backend Developer  | TechCorp  | completed   | 2024-05-13 09:15:00
```

**Status Values**:
- `in_progress`: Interview is being conducted
- `completed`: Interview finished and report generated
- `failed`: Interview failed or incomplete

---

## Table: interview_questions

**Purpose**: Store individual interview questions, answers, and scoring for each question.

**Fields**:

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY, AUTO_INCREMENT | Unique question identifier |
| interview_id | INTEGER | FOREIGN KEY → interviews(id) | Associated interview |
| question | LONGTEXT | NOT NULL | The interview question text |
| question_type | VARCHAR(50) | DEFAULT: "technical" | Type: 'hr', 'technical', 'behavioral' |
| answer | LONGTEXT | NULLABLE | Candidate's answer text |
| score | INTEGER | NULLABLE | Score given for answer (0-10) |
| feedback | LONGTEXT | NULLABLE | AI feedback on the answer |
| order_index | INTEGER | DEFAULT: 0 | Question sequence number |
| created_at | DATETIME | DEFAULT: utcnow | Timestamp of question creation |
| updated_at | DATETIME | DEFAULT: utcnow, ONUPDATE: utcnow | Timestamp of last update |

**Example Data**:
```
id | interview_id | question                          | question_type | answer              | score | feedback
1  | 1            | "Tell me about your experience"   | hr            | "I have 10 years..." | 8     | "Good depth"
2  | 1            | "Design a system..."              | technical     | "I would use..."    | 7     | "Sound approach"
3  | 1            | "What are your strengths?"        | hr            | "Attention to..."   | 9     | "Great answer"
```

---

## Table: interview_reports ⭐ (NEW)

**Purpose**: Store AI-generated interview performance reports.

**Fields**:

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY, AUTO_INCREMENT | Unique report identifier |
| interview_id | INTEGER | FOREIGN KEY → interviews(id), UNIQUE | Associated interview (one report per interview) |
| narrative_summary | LONGTEXT | NULLABLE | Comprehensive AI-generated report text |
| average_score | INTEGER | NULLABLE | Average score across all questions (0-10) |
| total_questions | INTEGER | NULLABLE | Total number of questions in interview |
| answered_questions | INTEGER | NULLABLE | Number of questions that were answered |
| status | VARCHAR(20) | DEFAULT: "pending" | Report status: 'pending', 'completed', 'failed' |
| generated_at | DATETIME | DEFAULT: utcnow | Timestamp when report was generated |

**Example Data**:
```
id | interview_id | narrative_summary           | average_score | total_questions | answered_questions | status    | generated_at
1  | 1            | "The candidate demonstrated..." | 8            | 10              | 10                 | completed | 2024-05-13 10:30:00
2  | 2            | "Strong technical background..." | 7            | 10              | 9                  | completed | 2024-05-13 10:45:00
```

**Status Values**:
- `pending`: Report generation started but not completed
- `completed`: Report successfully generated and saved
- `failed`: Report generation failed (with error)

---

## Relationships

### users → resumes (1:N)
One user can have multiple resumes.
```sql
SELECT r.* FROM resumes r
WHERE r.user_id = 1;
```

### users → interviews (1:N)
One user can have multiple interviews.
```sql
SELECT i.* FROM interviews i
WHERE i.user_id = 1;
```

### resumes → interviews (1:N)
One resume can be used in multiple interviews.
```sql
SELECT i.* FROM interviews i
WHERE i.resume_id = 1;
```

### interviews → interview_questions (1:N)
One interview has multiple questions.
```sql
SELECT q.* FROM interview_questions q
WHERE q.interview_id = 1
ORDER BY q.order_index;
```

### interviews → interview_reports (1:1)
One interview has exactly one report.
```sql
SELECT r.* FROM interview_reports r
WHERE r.interview_id = 1;
```

---

## Key Queries

### Get All Questions for an Interview
```sql
SELECT * FROM interview_questions
WHERE interview_id = 1
ORDER BY order_index ASC;
```

### Get All Answered Questions with Scores
```sql
SELECT 
  id,
  question,
  answer,
  score,
  feedback
FROM interview_questions
WHERE interview_id = 1 AND answer IS NOT NULL
ORDER BY order_index ASC;
```

### Calculate Average Score for Interview
```sql
SELECT 
  AVG(score) as average_score,
  COUNT(*) as total_questions,
  SUM(CASE WHEN answer IS NOT NULL THEN 1 ELSE 0 END) as answered_questions
FROM interview_questions
WHERE interview_id = 1;
```

### Get Interview Report
```sql
SELECT * FROM interview_reports
WHERE interview_id = 1;
```

### Get Interview with User and Report
```sql
SELECT 
  u.id as user_id,
  u.name as user_name,
  u.email,
  i.id as interview_id,
  i.job_role,
  i.company,
  i.status,
  i.created_at,
  ir.id as report_id,
  ir.narrative_summary,
  ir.average_score,
  ir.total_questions,
  ir.answered_questions,
  ir.status as report_status,
  ir.generated_at
FROM users u
JOIN interviews i ON u.id = i.user_id
LEFT JOIN interview_reports ir ON i.id = ir.interview_id
WHERE i.id = 1;
```

### Get All Reports for a User
```sql
SELECT 
  i.id as interview_id,
  i.job_role,
  i.company,
  i.created_at,
  ir.average_score,
  ir.total_questions,
  ir.answered_questions,
  ir.generated_at
FROM interviews i
LEFT JOIN interview_reports ir ON i.id = ir.interview_id
WHERE i.user_id = 1
ORDER BY i.created_at DESC;
```

### Find Interviews Without Reports
```sql
SELECT i.* FROM interviews i
WHERE i.id NOT IN (
  SELECT interview_id FROM interview_reports
  WHERE interview_id IS NOT NULL
)
AND i.status = 'completed';
```

### Get Report Generation Statistics
```sql
SELECT 
  COUNT(*) as total_reports,
  COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
  COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed,
  AVG(average_score) as avg_score,
  MIN(generated_at) as first_report,
  MAX(generated_at) as last_report
FROM interview_reports
WHERE generated_at >= DATE_SUB(NOW(), INTERVAL 7 DAY);
```

---

## Indexes

For performance optimization:

```sql
-- User lookups
CREATE INDEX idx_users_email ON users(email);

-- Resume lookups
CREATE INDEX idx_resumes_user_id ON resumes(user_id);

-- Interview lookups
CREATE INDEX idx_interviews_user_id ON interviews(user_id);
CREATE INDEX idx_interviews_status ON interviews(status);
CREATE INDEX idx_interviews_created_at ON interviews(created_at);

-- Question lookups
CREATE INDEX idx_questions_interview_id ON interview_questions(interview_id);
CREATE INDEX idx_questions_order ON interview_questions(interview_id, order_index);

-- Report lookups
CREATE INDEX idx_reports_interview_id ON interview_reports(interview_id);
CREATE INDEX idx_reports_generated_at ON interview_reports(generated_at);
CREATE INDEX idx_reports_status ON interview_reports(status);
```

---

## Data Types Reference

| Type | Size | Usage |
|------|------|-------|
| INTEGER | 4 bytes | IDs, scores, counts |
| VARCHAR(255) | 0-255 bytes | Names, emails, strings |
| LONGTEXT | 0-4GB | Large text (resume, answers, reports) |
| DATETIME | 8 bytes | Timestamps |

---

## Default Values and Constraints

| Table | Column | Default | NOT NULL | UNIQUE |
|-------|--------|---------|----------|--------|
| users | id | AUTO_INCREMENT | ✓ | ✓ |
| users | email | - | ✓ | ✓ |
| interviews | status | 'in_progress' | ✓ | - |
| interviews | created_at | CURRENT_TIMESTAMP | ✓ | - |
| interview_questions | question_type | 'technical' | ✓ | - |
| interview_questions | order_index | 0 | ✓ | - |
| interview_reports | status | 'pending' | ✓ | - |
| interview_reports | generated_at | CURRENT_TIMESTAMP | ✓ | - |
| interview_reports | interview_id | - | ✓ | ✓ |

---

## Backup and Maintenance

### Backup Database
```bash
mysqldump -u root -p smart_campus_interview > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Restore Database
```bash
mysql -u root -p smart_campus_interview < backup_20240513_103000.sql
```

### Check Table Statistics
```sql
SHOW TABLE STATUS FROM smart_campus_interview;
```

### Optimize Tables
```sql
OPTIMIZE TABLE users, resumes, interviews, interview_questions, interview_reports;
```

---

## Environment Configuration

**Database Connection String**:
```
mysql+pymysql://DB_USER:DB_PASSWORD@DB_HOST:DB_PORT/DB_NAME
```

**Environment Variables** (.env file):
```
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=smart_campus_interview
```

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2024-05-13 | Added InterviewReport table and model |
| 0.9 | 2024-05-10 | Initial schema with users, resumes, interviews, questions |

---

**Last Updated**: May 13, 2026
