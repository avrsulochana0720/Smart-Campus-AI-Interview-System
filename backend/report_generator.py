import os
import json
from datetime import datetime
from sqlalchemy.orm import Session
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, KeepTogether
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT

from models import User, Interview, Resume, InterviewQuestion, Answer, InterviewReport

# Make sure reports directory exists
os.makedirs("reports", exist_ok=True)

def generate_pdf_report(interview_id: int, db: Session) -> tuple:
    """
    Generates a PDF report for the given interview_id and saves it.
    Returns (pdf_path, pdf_url).
    """
    # 1. Fetch data from DB
    interview = db.query(Interview).filter(Interview.id == interview_id).first()
    if not interview:
        raise ValueError(f"Interview {interview_id} not found.")

    user = db.query(User).filter(User.id == interview.user_id).first()
    if not user:
        raise ValueError(f"User for interview {interview_id} not found.")

    # Try to find user's resume
    resume = None
    if interview.resume_id:
        resume = db.query(Resume).filter(Resume.id == interview.resume_id).first()
    if not resume:
        resume = db.query(Resume).filter(Resume.user_id == user.id).order_by(Resume.uploaded_at.desc()).first()

    report = db.query(InterviewReport).filter(InterviewReport.interview_id == interview_id).first()
    if not report:
        raise ValueError(f"Report for interview {interview_id} not found. Please generate report data first.")

    questions = db.query(InterviewQuestion).filter(
        InterviewQuestion.interview_id == interview_id
    ).order_by(InterviewQuestion.order_index.asc()).all()

    # Calculate duration
    duration_minutes = 10
    if questions:
        last_ans = db.query(Answer).filter(Answer.question_id == questions[-1].id).first()
        if last_ans and last_ans.created_at and interview.created_at:
            duration_minutes = max(1, int((last_ans.created_at - interview.created_at).total_seconds() / 60))

    # Compile QA review details
    qa_details = []
    for q in questions:
        ans = db.query(Answer).filter(Answer.question_id == q.id).first()
        qa_details.append({
            "question": q.question,
            "answer": ans.answer_text if ans else "Not answered",
            "score": ans.score if ans and ans.score is not None else 0,
            "feedback": ans.feedback if ans and ans.feedback else "No feedback available.",
            "type": q.question_type or "technical"
        })

    # PDF File Setup
    pdf_filename = f"report_{interview_id}.pdf"
    pdf_path = os.path.join("reports", pdf_filename)
    
    # Configure document template
    doc = SimpleDocTemplate(
        pdf_path,
        pagesize=letter,
        rightMargin=40,
        leftMargin=40,
        topMargin=40,
        bottomMargin=40
    )

    story = []
    styles = getSampleStyleSheet()

    # Define color palette
    c_primary = colors.HexColor("#0F172A")    # Deep slate
    c_secondary = colors.HexColor("#475569")  # Slate gray
    c_accent_green = colors.HexColor("#059669") # Emerald
    c_accent_red = colors.HexColor("#EF4444")   # Rose
    c_bg_light = colors.HexColor("#F8FAFC")    # Cool white
    c_border = colors.HexColor("#E2E8F0")      # Divider gray

    # Custom Paragraph Styles
    style_title = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=20,
        textColor=c_primary,
        spaceAfter=4,
        alignment=TA_LEFT
    )
    style_subtitle = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10,
        textColor=c_accent_green,
        spaceAfter=15,
        alignment=TA_LEFT
    )
    style_h2 = ParagraphStyle(
        'SectionHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=12,
        textColor=c_primary,
        spaceBefore=14,
        spaceAfter=6
    )
    style_body = ParagraphStyle(
        'BodyTextCustom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        textColor=colors.HexColor("#1E293B"),
        leading=13.5,
        spaceAfter=5
    )
    style_body_bold = ParagraphStyle(
        'BodyTextBold',
        parent=style_body,
        fontName='Helvetica-Bold'
    )
    style_meta_label = ParagraphStyle(
        'MetaLabel',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        textColor=c_secondary
    )
    style_meta_val = ParagraphStyle(
        'MetaVal',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        textColor=c_primary
    )
    style_score_big_num = ParagraphStyle(
        'ScoreBigNum',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=28,
        textColor=c_accent_green,
        alignment=TA_CENTER
    )
    style_score_big_label = ParagraphStyle(
        'ScoreBigLabel',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        textColor=c_secondary,
        alignment=TA_CENTER
    )

    # 1. Header Banner
    story.append(Paragraph("SmartCampus AI Interview System", style_title))
    story.append(Paragraph("CANDIDATE INTERVIEW & EVALUATION REPORT", style_subtitle))
    
    # 2. Candidate & Interview Details Table (Two Columns)
    details_data = [
        [
            Paragraph("Candidate Details", style_h2),
            Paragraph("Interview Details", style_h2)
        ],
        [
            Paragraph("<b>Name:</b> " + (user.name or "N/A"), style_body),
            Paragraph("<b>Company:</b> " + (interview.company or "N/A"), style_body)
        ],
        [
            Paragraph("<b>Email:</b> " + (user.email or "N/A"), style_body),
            Paragraph("<b>Job Role:</b> " + (interview.job_role or "N/A"), style_body)
        ],
        [
            Paragraph("<b>Department:</b> " + (user.department or "N/A"), style_body),
            Paragraph("<b>Mode:</b> " + (interview.mode or "Practice"), style_body)
        ],
        [
            Paragraph("<b>Date:</b> " + interview.created_at.strftime("%B %d, %Y %I:%M %p"), style_body),
            Paragraph("<b>Duration:</b> " + f"{duration_minutes} mins", style_body)
        ]
    ]
    
    details_table = Table(details_data, colWidths=[260, 260])
    details_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2),
        ('TOPPADDING', (0,0), (-1,-1), 2),
        ('LEFTPADDING', (0,0), (-1,-1), 0),
        ('RIGHTPADDING', (0,0), (-1,-1), 0),
    ]))
    story.append(details_table)
    story.append(Spacer(1, 15))

    # 3. Overall Performance Section
    story.append(Paragraph("Overall Performance Summary", style_h2))
    
    final_score = int(report.final_interview_score or report.hiring_readiness_score or report.average_score or 0)
    recommendation = report.recommendation or "No recommendation provided."
    summary_text = report.narrative_summary or "No executive summary available."
    
    score_breakdown_p = (
        f"<b>Overall Score:</b> {final_score}%<br/>"
        f"<b>Technical Score:</b> {int(report.technical_score or 0)}%<br/>"
        f"<b>Behavioral (HR) Score:</b> {int(report.hr_score or 0)}%<br/>"
        f"<b>Confidence:</b> {int(report.confidence_score or 0)}%"
    )
    
    performance_data = [
        [
            Paragraph(f"{final_score}%", style_score_big_num),
            Paragraph(f"<b>Recommendation:</b><br/>{recommendation}", style_body),
            Paragraph(score_breakdown_p, style_body)
        ],
        [
            Paragraph("OVERALL SCORE", style_score_big_label),
            "",
            ""
        ]
    ]
    
    perf_table = Table(performance_data, colWidths=[120, 200, 200])
    perf_table.setStyle(TableStyle([
        ('SPAN', (0,0), (0,0)),
        ('SPAN', (0,1), (0,1)),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('BACKGROUND', (0,0), (-1,-1), c_bg_light),
        ('BOX', (0,0), (-1,-1), 1, c_border),
        ('PADDING', (0,0), (-1,-1), 12),
        ('ALIGN', (0,0), (0,1), 'CENTER'),
    ]))
    story.append(perf_table)
    story.append(Spacer(1, 10))
    
    # Executive Narrative Summary
    story.append(Paragraph("<b>Executive Summary:</b>", style_body_bold))
    story.append(Paragraph(summary_text, style_body))
    story.append(Spacer(1, 15))

    # 4. Technical Evaluation Factors & Communication Evaluation
    story.append(Paragraph("Detailed Competency Evaluation", style_h2))
    
    competency_headers = [
        Paragraph("<b>Technical Competency</b>", style_body_bold),
        Paragraph("<b>Score</b>", style_body_bold),
        Paragraph("<b>Communication & HR Competency</b>", style_body_bold),
        Paragraph("<b>Score</b>", style_body_bold)
    ]
    
    competency_rows = [
        [
            Paragraph("Accuracy & Technical Correctness", style_body),
            Paragraph(f"{int(report.tech_accuracy_avg or 0)}%", style_body),
            Paragraph("Communication Clarity", style_body),
            Paragraph(f"{int(report.hr_communication_skills_avg or report.tech_communication_avg or 0)}%", style_body)
        ],
        [
            Paragraph("Concept Understanding", style_body),
            Paragraph(f"{int(report.tech_concept_understanding_avg or 0)}%", style_body),
            Paragraph("Confidence Level", style_body),
            Paragraph(f"{int(report.hr_confidence_avg or 0)}%", style_body)
        ],
        [
            Paragraph("Problem Solving", style_body),
            Paragraph(f"{int(report.tech_problem_solving_avg or 0)}%", style_body),
            Paragraph("Professionalism", style_body),
            Paragraph(f"{int(report.hr_professionalism_avg or 0)}%", style_body)
        ],
        [
            Paragraph("Communication (Tech Context)", style_body),
            Paragraph(f"{int(report.tech_communication_avg or 0)}%", style_body),
            Paragraph("Adaptability", style_body),
            Paragraph(f"{int(report.hr_adaptability_avg or 0)}%", style_body)
        ],
        [
            Paragraph("Code Quality & Standards", style_body),
            Paragraph(f"{int(report.tech_code_quality_avg or 0)}%", style_body),
            Paragraph("Team Collaboration", style_body),
            Paragraph(f"{int(report.hr_team_collaboration_avg or 0)}%", style_body)
        ]
    ]
    
    comp_table_data = [competency_headers] + competency_rows
    comp_table = Table(comp_table_data, colWidths=[180, 50, 240, 50])
    comp_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('LINEBELOW', (0,0), (-1,0), 1, c_secondary),
        ('LINEBELOW', (0,1), (-1,-1), 0.5, c_border),
        ('BACKGROUND', (0,0), (-1,0), c_bg_light),
    ]))
    story.append(comp_table)
    story.append(Spacer(1, 15))

    # 5. Resume Analysis Section
    resume_skills = "N/A"
    resume_details = "No resume uploaded or analyzed."
    if resume:
        if resume.skills_extracted:
            try:
                skills_list = json.loads(resume.skills_extracted)
                if isinstance(skills_list, list):
                    resume_skills = ", ".join(skills_list)
                else:
                    resume_skills = str(resume.skills_extracted)
            except Exception:
                resume_skills = str(resume.skills_extracted)
        if resume.ai_analysis:
            resume_details = resume.ai_analysis

    resume_elements = [
        Paragraph("Resume & Skills Analysis", style_h2),
        Paragraph(f"<b>Extracted Skills:</b> {resume_skills}", style_body),
        Paragraph("<b>Resume Evaluation Summary:</b>", style_body_bold),
        Paragraph(resume_details, style_body)
    ]
    story.append(KeepTogether(resume_elements))
    story.append(Spacer(1, 15))

    # 6. Strengths & Weaknesses (Side-by-side or stacked)
    strengths_text = report.strengths or "None identified."
    weaknesses_text = report.weaknesses or "None identified."
    
    # Split by bullets if list, otherwise format cleanly
    strengths_bullets = strengths_text.split("\n")
    strengths_html = "<br/>".join([f"&bull; {bullet.strip().lstrip('-*• ')}" for bullet in strengths_bullets if bullet.strip()])
    
    weaknesses_bullets = weaknesses_text.split("\n")
    weaknesses_html = "<br/>".join([f"&bull; {bullet.strip().lstrip('-*• ')}" for bullet in weaknesses_bullets if bullet.strip()])

    sw_data = [
        [
            Paragraph("Key Strengths", style_h2),
            Paragraph("Areas for Improvement (Weaknesses)", style_h2)
        ],
        [
            Paragraph(strengths_html, style_body),
            Paragraph(weaknesses_html, style_body)
        ]
    ]
    
    sw_table = Table(sw_data, colWidths=[255, 265])
    sw_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 0),
        ('RIGHTPADDING', (0,0), (-1,-1), 10),
    ]))
    story.append(KeepTogether([sw_table]))
    story.append(Spacer(1, 15))

    # 7. Question-by-Question Review
    story.append(Paragraph("Question-by-Question Review", style_h2))
    
    for idx, qa in enumerate(qa_details):
        q_elements = []
        q_header_text = f"<b>Question {idx+1} ({qa['type'].upper()}): {qa['question']}</b>"
        q_score_text = f"<b>Score: {qa['score']}/10</b>"
        
        # Header block for the question
        header_table = Table([[Paragraph(q_header_text, style_body_bold), Paragraph(q_score_text, style_body_bold)]], colWidths=[420, 100])
        header_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), c_bg_light),
            ('ALIGN', (1,0), (1,0), 'RIGHT'),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('PADDING', (0,0), (-1,-1), 6),
            ('BOX', (0,0), (-1,-1), 0.5, c_border),
        ]))
        q_elements.append(header_table)
        q_elements.append(Spacer(1, 4))
        
        # Answer block
        q_elements.append(Paragraph(f"<b>Candidate Answer:</b> {qa['answer']}", style_body))
        q_elements.append(Spacer(1, 2))
        
        # Feedback block (shaded block)
        fb_text = Paragraph(f"<b>Feedback:</b> {qa['feedback']}", style_body)
        fb_table = Table([[fb_text]], colWidths=[520])
        
        fb_bg = colors.HexColor("#FEF2F2") if qa['score'] < 6 else colors.HexColor("#F0FDF4")
        fb_border = colors.HexColor("#FEE2E2") if qa['score'] < 6 else colors.HexColor("#DCFCE7")
        
        fb_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), fb_bg),
            ('PADDING', (0,0), (-1,-1), 8),
            ('BOX', (0,0), (-1,-1), 0.5, fb_border),
        ]))
        
        q_elements.append(fb_table)
        q_elements.append(Spacer(1, 12))
        
        story.append(KeepTogether(q_elements))

    # Build the document
    doc.build(story)
    
    # Construct base URL and relative/absolute links
    backend_base_url = os.getenv("BACKEND_URL", "http://localhost:8000")
    pdf_url = f"{backend_base_url}/download-report/{interview_id}"
    
    return pdf_path, pdf_url


def get_or_create_pdf_report(interview_id: int, db: Session) -> tuple:
    """
    Checks if report PDF already exists on disk.
    If yes, returns (pdf_path, pdf_url).
    If no, generates it using generate_pdf_report and updates database.
    """
    interview = db.query(Interview).filter(Interview.id == interview_id).first()
    if not interview:
        raise ValueError(f"Interview {interview_id} not found.")
        
    expected_filename = f"report_{interview_id}.pdf"
    expected_path = os.path.join("reports", expected_filename)
    
    backend_base_url = os.getenv("BACKEND_URL", "http://localhost:8000")
    expected_url = f"{backend_base_url}/download-report/{interview_id}"
    
    # Check if file exists on disk
    if os.path.exists(expected_path):
        # Update database columns if they are not already set
        if not interview.report_path or not interview.report_url:
            interview.report_path = expected_path
            interview.report_url = expected_url
            db.commit()
        return expected_path, expected_url
        
    # File does not exist, check if report database record is completed
    report = db.query(InterviewReport).filter(InterviewReport.interview_id == interview_id).first()
    if not report or report.status != "completed":
        raise ValueError(f"Interview report data for interview {interview_id} is not fully analyzed or complete yet.")
        
    # Generate the PDF
    pdf_path, pdf_url = generate_pdf_report(interview_id, db)
    
    # Save to interview record
    interview.report_path = pdf_path
    interview.report_url = pdf_url
    db.commit()
    
    return pdf_path, pdf_url
