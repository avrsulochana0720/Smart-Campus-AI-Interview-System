# API Quick Reference Guide

## Overview
Two new endpoints have been added to handle interview performance report generation and retrieval.

---

## Endpoint 1: Generate Report

### POST /generate-report/{interview_id}

Generate a comprehensive interview performance report from saved answers.

**URL Parameters:**
- `interview_id` (integer, required): The ID of the interview

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json (optional)
```

**Example Request:**
```bash
curl -X POST http://localhost:8000/generate-report/5 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Success Response (200 OK):**
```json
{
  "message": "Report generated and saved successfully",
  "report_id": 1,
  "interview_id": 5,
  "narrative_summary": "The candidate demonstrated strong technical fundamentals and excellent problem-solving abilities. They showed good understanding of system design principles and provided well-reasoned answers to complex scenarios. Areas for improvement include deeper knowledge of advanced algorithms and more hands-on experience with certain technologies mentioned in the job description.",
  "average_score": 7,
  "total_questions": 10,
  "answered_questions": 9,
  "status": "completed",
  "generated_at": "2024-05-13T10:30:45.123456"
}
```

**Error Responses:**

404 - Interview Not Found:
```json
{
  "detail": "Interview not found"
}
```

404 - No Questions Found:
```json
{
  "detail": "No questions found for this interview"
}
```

403 - Access Denied:
```json
{
  "detail": "You don't have access to this interview"
}
```

500 - Report Generation Failed:
```json
{
  "detail": "Report generation failed: <error_message>"
}
```

**Processing Time:**
- ~5-15 seconds (depends on number of questions and Ollama/Qwen model speed)

---

## Endpoint 2: Fetch Report

### GET /get-report/{interview_id}

Retrieve a previously generated interview performance report from the database.

**URL Parameters:**
- `interview_id` (integer, required): The ID of the interview

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Example Request:**
```bash
curl http://localhost:8000/get-report/5 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Success Response (200 OK):**
```json
{
  "report_id": 1,
  "interview_id": 5,
  "job_role": "Software Engineer",
  "company": "TechCorp",
  "narrative_summary": "The candidate demonstrated strong technical fundamentals...",
  "average_score": 7,
  "total_questions": 10,
  "answered_questions": 9,
  "status": "completed",
  "generated_at": "2024-05-13T10:30:45.123456",
  "interview_created_at": "2024-05-13T09:00:00.000000"
}
```

**Error Responses:**

404 - Interview Not Found:
```json
{
  "detail": "Interview not found"
}
```

404 - Report Not Found:
```json
{
  "detail": "Report not found. Generate a report first using /generate-report endpoint."
}
```

403 - Access Denied:
```json
{
  "detail": "You don't have access to this interview"
}
```

---

## TypeScript / Frontend Implementation

### Using Fetch API

```typescript
// Generate report
async function generateReport(interviewId: number, token: string) {
  const response = await fetch(
    `http://localhost:8000/generate-report/${interviewId}`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );

  if (!response.ok) {
    throw new Error(`Report generation failed: ${response.statusText}`);
  }

  return await response.json();
}

// Fetch existing report
async function fetchReport(interviewId: number, token: string) {
  const response = await fetch(
    `http://localhost:8000/get-report/${interviewId}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch report: ${response.statusText}`);
  }

  return await response.json();
}

// Usage
const token = localStorage.getItem('token');
const interviewId = 5;

try {
  // Generate report after interview completion
  const report = await generateReport(interviewId, token);
  console.log('Report generated:', report.narrative_summary);
  
  // Display report to user
  displayReport(report);
} catch (error) {
  console.error('Error:', error);
  alert('Failed to generate report. Please try again.');
}
```

### Using Axios

```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000',
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  }
});

// Generate report
async function generateReport(interviewId: number) {
  const response = await api.post(`/generate-report/${interviewId}`);
  return response.data;
}

// Fetch report
async function fetchReport(interviewId: number) {
  const response = await api.get(`/get-report/${interviewId}`);
  return response.data;
}

// Usage
try {
  const report = await generateReport(interviewId);
  console.log(report.narrative_summary);
} catch (error) {
  console.error('Error:', error.response.data.detail);
}
```

---

## Integration Points

### In Interview Completion Flow

```typescript
// After last answer is submitted and interview is marked complete

const handleInterviewCompletion = async () => {
  try {
    // Generate report from saved answers
    const reportResponse = await fetch(
      `http://localhost:8000/generate-report/${interviewId}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    const report = await reportResponse.json();
    
    // Update state with report
    setGeneratedReport(report);
    
    // Navigate to report display or update UI
    displayReportUI(report);
  } catch (error) {
    console.error('Failed to generate report:', error);
  }
};
```

### In Report Display Page

```typescript
// When loading report display page

useEffect(() => {
  const fetchAndDisplayReport = async () => {
    try {
      const reportResponse = await fetch(
        `http://localhost:8000/get-report/${interviewId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      const report = await reportResponse.json();
      setReport(report);
    } catch (error) {
      console.error('Failed to fetch report:', error);
      setError('Could not load report. Please try again.');
    }
  };

  fetchAndDisplayReport();
}, [interviewId, token]);
```

---

## Common Scenarios

### Scenario 1: Complete Interview and Show Report
```
1. Create Interview
2. Generate HR Questions
3. Submit HR Answers
4. Generate Technical Questions
5. Submit Technical Answers
6. Call POST /generate-report/{interview_id}
7. Receive report and display to user
8. Save report_id in database (optional)
```

### Scenario 2: View Report Later
```
1. Get interview_id from query params or database
2. Call GET /get-report/{interview_id}
3. Display report from response
```

### Scenario 3: Re-generate Report
```
1. Call GET /get-report/{interview_id}
2. If exists and recent: display existing report
3. If doesn't exist: call POST /generate-report/{interview_id}
4. Display new or existing report
```

---

## Response Field Descriptions

### Report Response Fields

| Field | Type | Description |
|-------|------|-------------|
| report_id | integer | Unique ID of the report record |
| interview_id | integer | ID of the interview |
| job_role | string | Job position interviewed for |
| company | string | Company conducting interview |
| narrative_summary | string | AI-generated comprehensive report |
| average_score | integer | Average score (0-10) |
| total_questions | integer | Total questions asked |
| answered_questions | integer | Number of questions answered |
| status | string | 'completed', 'pending', or 'failed' |
| generated_at | string | ISO timestamp of report generation |
| interview_created_at | string | ISO timestamp of interview creation |

---

## Error Handling Best Practices

```typescript
async function generateAndDisplayReport(interviewId: number, token: string) {
  try {
    const response = await fetch(
      `http://localhost:8000/generate-report/${interviewId}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    // Check if response is OK
    if (!response.ok) {
      const error = await response.json();
      
      if (response.status === 404) {
        throw new Error('Interview not found or has no answers');
      } else if (response.status === 403) {
        throw new Error('You do not have access to this interview');
      } else if (response.status === 500) {
        throw new Error('Failed to generate report. Please try again.');
      } else {
        throw new Error(error.detail || 'Unknown error occurred');
      }
    }

    // Success
    const report = await response.json();
    return report;

  } catch (error) {
    console.error('Report generation error:', error);
    // Display user-friendly error message
    showErrorNotification(error.message);
    throw error;
  }
}
```

---

## Validation Checklist

Before using in production:

- [ ] JWT token is valid and not expired
- [ ] interview_id is a valid integer
- [ ] User is authenticated (has valid token)
- [ ] User owns the interview
- [ ] All answers have been submitted before generating report
- [ ] Qwen/Ollama model is running
- [ ] Database connection is active
- [ ] InterviewReport table exists in database

---

## Troubleshooting

### Report generation taking too long
- Check if Ollama/Qwen process is running
- Check network latency
- Check system resources (CPU, memory)

### "Report not found" error
- Make sure report has been generated (POST /generate-report called first)
- Check interview_id is correct
- Verify user owns the interview

### "You don't have access" error
- Check JWT token is valid
- Verify token is from correct user
- Ensure interview belongs to authenticated user

### 500 Server Error
- Check backend logs for detailed error message
- Verify Qwen model is loaded in Ollama
- Check database connection
- Restart backend if necessary

---

**Last Updated**: May 13, 2026
