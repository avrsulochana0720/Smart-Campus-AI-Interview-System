# Testing Guide - Interview Report Generation

## Prerequisites

Before testing, ensure:
- Backend server is running (`uvicorn main:app --reload`)
- Ollama is running with Qwen model (`ollama serve`)
- MySQL database is running
- User is authenticated (has valid JWT token)
- Interview has been created with answers submitted

---

## Getting a Valid JWT Token

First, register and login to get a token:

### Step 1: Register User
```bash
curl -X POST http://localhost:8000/register \
  -F "name=Test User" \
  -F "email=test@example.com" \
  -F "password=password123"
```

### Step 2: Login to Get Token
```bash
curl -X POST http://localhost:8000/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

Response:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

Save the `access_token` value - you'll use it for all subsequent requests.

---

## Complete End-to-End Test Flow

### Step 1: Upload Resume
```bash
TOKEN="your_access_token_here"

curl -X POST http://localhost:8000/upload-resume \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@/path/to/resume.pdf"
```

Response will include `resume_id`.

### Step 2: Create Interview
```bash
curl -X POST http://localhost:8000/create-interview \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "job_role": "Software Engineer",
    "company": "TechCorp",
    "resume_id": 1
  }'
```

Response:
```json
{
  "interview_id": 5,
  "job_role": "Software Engineer",
  "company": "TechCorp",
  "resume_id": 1,
  "created_at": "2024-05-13T09:00:00",
  "message": "Interview created successfully"
}
```

Save the `interview_id` (e.g., 5).

### Step 3: Generate Technical Questions
```bash
INTERVIEW_ID=5

curl -X POST http://localhost:8000/generate-questions \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "interview_id": '$INTERVIEW_ID',
    "phase": "technical"
  }'
```

Response will include list of generated questions with IDs.

### Step 4: Submit Technical Answers
For each question, submit an answer:

```bash
curl -X POST http://localhost:8000/submit-answer \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "interview_id": 5,
    "question_id": 1,
    "answer": "I would design the system with a microservices architecture...",
    "job_role": "Software Engineer",
    "company": "TechCorp"
  }'
```

Repeat for all questions.

### Step 5: Generate HR Questions
```bash
curl -X POST http://localhost:8000/generate-questions \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "interview_id": 5,
    "phase": "hr"
  }'
```

### Step 6: Submit HR Answers
Submit answers for all HR questions (same as Step 4, just different question_ids).

### Step 7: Generate Report (NEW)
```bash
curl -X POST http://localhost:8000/generate-report/5 \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Output** (after 5-15 seconds):
```json
{
  "message": "Report generated and saved successfully",
  "report_id": 1,
  "interview_id": 5,
  "narrative_summary": "The candidate demonstrated strong technical fundamentals...",
  "average_score": 7,
  "total_questions": 10,
  "answered_questions": 9,
  "status": "completed",
  "generated_at": "2024-05-13T10:30:45.123456"
}
```

### Step 8: Fetch Report (NEW)
```bash
curl http://localhost:8000/get-report/5 \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Output**:
```json
{
  "report_id": 1,
  "interview_id": 5,
  "job_role": "Software Engineer",
  "company": "TechCorp",
  "narrative_summary": "The candidate demonstrated...",
  "average_score": 7,
  "total_questions": 10,
  "answered_questions": 9,
  "status": "completed",
  "generated_at": "2024-05-13T10:30:45.123456",
  "interview_created_at": "2024-05-13T09:00:00"
}
```

---

## Testing Individual Components

### Test 1: Generate Report
```bash
TOKEN="your_token"
INTERVIEW_ID=5

# Generate report for interview
curl -X POST http://localhost:8000/generate-report/$INTERVIEW_ID \
  -H "Authorization: Bearer $TOKEN"
```

**Checks**:
- [ ] Returns 200 status code
- [ ] Response includes `narrative_summary`
- [ ] Response includes `average_score`
- [ ] Status is "completed"
- [ ] Takes 5-15 seconds

---

### Test 2: Fetch Report
```bash
TOKEN="your_token"
INTERVIEW_ID=5

# Fetch existing report
curl http://localhost:8000/get-report/$INTERVIEW_ID \
  -H "Authorization: Bearer $TOKEN"
```

**Checks**:
- [ ] Returns 200 status code
- [ ] Response includes full report
- [ ] Returns same report as generated
- [ ] Executes quickly (< 1 second)

---

### Test 3: Idempotency (Generate Twice)
```bash
TOKEN="your_token"
INTERVIEW_ID=5

# Generate report first time
curl -X POST http://localhost:8000/generate-report/$INTERVIEW_ID \
  -H "Authorization: Bearer $TOKEN" > report1.json

# Generate report second time
curl -X POST http://localhost:8000/generate-report/$INTERVIEW_ID \
  -H "Authorization: Bearer $TOKEN" > report2.json

# Compare files
diff report1.json report2.json
```

**Checks**:
- [ ] Both calls return 200
- [ ] Both return same report_id
- [ ] Both return identical narrative_summary
- [ ] Second call is much faster (returns cached)

---

### Test 4: Access Control
```bash
TOKEN="other_user_token"  # Token from different user
INTERVIEW_ID=5            # Interview from first user

# Try to access report from different user
curl -X GET http://localhost:8000/get-report/$INTERVIEW_ID \
  -H "Authorization: Bearer $TOKEN"
```

**Expected**:
```json
{
  "detail": "You don't have access to this interview"
}
```

**Checks**:
- [ ] Returns 403 status code
- [ ] Error message is appropriate
- [ ] Other user cannot access report

---

### Test 5: Missing Report
```bash
TOKEN="your_token"
INTERVIEW_ID=999  # Non-existent interview

# Try to fetch non-existent report
curl http://localhost:8000/get-report/$INTERVIEW_ID \
  -H "Authorization: Bearer $TOKEN"
```

**Expected**:
```json
{
  "detail": "Interview not found"
}
```

**Checks**:
- [ ] Returns 404 status code
- [ ] Error message is clear

---

### Test 6: Database Verification
```sql
-- Connect to MySQL database
mysql -u root -p smart_campus_interview

-- Check if InterviewReport table exists
SHOW TABLES;

-- View generated report
SELECT * FROM interview_reports;

-- Verify report data
SELECT 
  ir.id,
  ir.interview_id,
  ir.status,
  ir.average_score,
  ir.total_questions,
  ir.answered_questions,
  ir.generated_at
FROM interview_reports ir
ORDER BY ir.generated_at DESC
LIMIT 5;

-- Verify interview status was updated
SELECT id, status FROM interviews WHERE id = 5;
```

**Checks**:
- [ ] InterviewReport table exists
- [ ] Report records are created
- [ ] Scores are calculated correctly
- [ ] Interview status is "completed"

---

## Using Postman

### Create Collection

1. **New Collection**: "Interview Report Tests"

2. **Create Request 1: Generate Report**
   - **Method**: POST
   - **URL**: `http://localhost:8000/generate-report/5`
   - **Auth**: Bearer Token
   - **Token**: `{{token}}`
   - **Tests Tab**:
     ```javascript
     pm.test("Status code is 200", function() {
       pm.response.to.have.status(200);
     });
     
     pm.test("Response has narrative_summary", function() {
       var jsonData = pm.response.json();
       pm.expect(jsonData).to.have.property("narrative_summary");
     });
     
     pm.test("Status is completed", function() {
       var jsonData = pm.response.json();
       pm.expect(jsonData.status).to.equal("completed");
     });
     ```

3. **Create Request 2: Fetch Report**
   - **Method**: GET
   - **URL**: `http://localhost:8000/get-report/5`
   - **Auth**: Bearer Token
   - **Tests Tab**:
     ```javascript
     pm.test("Status code is 200", function() {
       pm.response.to.have.status(200);
     });
     
     pm.test("Response includes report details", function() {
       var jsonData = pm.response.json();
       pm.expect(jsonData).to.have.property("report_id");
       pm.expect(jsonData).to.have.property("interview_id");
       pm.expect(jsonData).to.have.property("narrative_summary");
       pm.expect(jsonData).to.have.property("average_score");
     });
     ```

4. **Run Collection**: Click "Run" to execute all tests

---

## Performance Testing

### Measure Report Generation Time
```bash
time curl -X POST http://localhost:8000/generate-report/5 \
  -H "Authorization: Bearer $TOKEN" \
  > /dev/null
```

Expected: 5-15 seconds

### Measure Report Fetch Time
```bash
time curl http://localhost:8000/get-report/5 \
  -H "Authorization: Bearer $TOKEN" \
  > /dev/null
```

Expected: < 1 second (cached)

---

## Troubleshooting Test Failures

### Error: "401 Invalid or expired token"
- Solution: Get fresh JWT token from login endpoint
- Check token hasn't expired

### Error: "404 Interview not found"
- Solution: Create interview first using /create-interview
- Use correct interview_id

### Error: "404 No questions found for this interview"
- Solution: Generate questions first using /generate-questions
- Submit at least one answer

### Error: "500 Report generation failed"
- Check Ollama is running: `ollama serve`
- Check Qwen model is loaded: `ollama pull qwen:latest`
- Check system resources (CPU, memory)
- Check database connection
- Look at backend console output for error details

### Report takes too long to generate
- Check Ollama/Qwen process CPU usage
- Reduce number of questions being processed
- Check network latency
- Increase system resources

---

## Continuous Integration Testing

### GitHub Actions Example
```yaml
name: API Tests

on: [push]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v2
      
      - name: Start backend
        run: cd backend && python -m uvicorn main:app &
      
      - name: Wait for backend
        run: sleep 5
      
      - name: Run tests
        run: |
          cd tests
          ./run_report_tests.sh
```

---

## Success Checklist

After completing all tests:

- [ ] Report generation returns 200 and full report
- [ ] Report fetch returns 200 and full report
- [ ] Idempotency works (same report twice)
- [ ] Access control prevents unauthorized access
- [ ] Missing interview returns 404
- [ ] Database table has report record
- [ ] Interview status updated to "completed"
- [ ] Performance is acceptable (5-15 seconds for generation)
- [ ] No UI changes are visible
- [ ] Question generation still works

---

**Test Date**: ___________  
**Tested By**: ___________  
**Status**: ☐ PASS ☐ FAIL

---

**Last Updated**: May 13, 2026
