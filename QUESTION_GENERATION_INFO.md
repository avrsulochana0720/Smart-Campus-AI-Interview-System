# Interview Question Generation Summary

## Questions Generated Per Interview

### Interview Start Flow:
1. **Technical Questions**: 5 questions
2. **HR Questions**: 5 questions
3. **TOTAL**: 10 questions per interview

---

## Generation Details

### Technical Phase (5 Questions)
Default fallback questions if AI generation fails:
```
1. Explain the core architecture of a project you built
2. How do you ensure code quality and performance?
3. Describe a complex technical problem you solved
4. What are the trade-offs of using [technology]?
5. How would you optimize a slow database query?
```

### HR Phase (5 Questions)
Default fallback questions if AI generation fails:
```
1. Tell me about yourself and why you want to join [company]
2. What is your biggest professional achievement?
3. How do you handle conflict in a team environment?
4. Describe a time you showed leadership in a project
5. Where do you see yourself in five years?
```

---

## Generation Logic (main.py - /generate-questions endpoint)

**Line 463:** 
```python
def generate_questions(request: GenerateQuestionsRequest, ...)
    """Generate 5 HR or 5 Technical questions using question_agent with performance logging."""
```

**Key Points:**
- Each call to `/generate-questions` generates **5 questions** for the specified phase (HR or Technical)
- Questions are personalized based on:
  - Resume content
  - Job role
  - Company name
  - Extracted skills
  - RAG context (from knowledge base)
  
- Questions are stored in database table: `interview_questions`
- Each question has:
  - `question_id` (unique)
  - `question_text`
  - `question_type` (hr or technical)
  - `interview_id` (linked to interview)
  - `expected_answer` (AI-generated ideal answer)

---

## Interview Workflow (Backend: main.py)

### When Interview is Created (`/create-interview`):
```
1. Interview record created in database
   ↓
2. Background task: _pre_generate_interview_content() spawned
   ↓
   a) Resume analysis (background)
   ↓
   b) Create 5 technical question PLACEHOLDERS immediately
      - Using fallback templates personalized with resume skills
   ↓
   c) Create 5 HR question PLACEHOLDERS immediately
      - Using fallback templates personalized with company/role
   ↓
   d) Background tasks spawn to improve Question 1 (tech) and HR Question 1
      - These get replaced with AI-generated versions if available
```

### When User Starts Interview:
```
1. Frontend calls GET /get-question/{interview_id}
   ↓
2. Backend returns first unanswered question (with optional AI-improved version)
   ↓
3. User answers questions one by one via /submit-answer
```

---

## Question Timeline

- **Immediately on `/create-interview`**: 5 Tech + 5 HR = **10 questions stored in DB**
- **Before user answers**: Questions 1-2 (Tech) and Question 1 (HR) may be improved with AI
- **Fallback**: If AI fails, default questions are used

---

## Key Code References

1. **Interview Creation** (line 411): `/create-interview` endpoint
2. **Pre-generation** (line 321): `_pre_generate_interview_content()` function
   - Creates 5 technical questions (index 0-4)
   - Creates 5 HR questions (index 5-9)
3. **Question Retrieval** (line 553): `/get-question/{interview_id}` endpoint
4. **Question Generation** (line 458): `/generate-questions` endpoint

---

## Total Interview Questions: 10 (5 Technical + 5 HR)

**ALL 10 QUESTIONS ARE CREATED INSTANTLY WHEN INTERVIEW STARTS**
(User doesn't wait for question generation during the interview)
