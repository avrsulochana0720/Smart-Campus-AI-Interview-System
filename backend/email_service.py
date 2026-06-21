import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

load_dotenv()

SMTP_SERVER = os.getenv("SMTP_SERVER", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")

def send_email(to_email: str, subject: str, html_body: str):
    if not SMTP_USER or not SMTP_PASSWORD:
        print(f"[EMAIL SERVICE WARNING] SMTP credentials not configured. Email to {to_email} aborted.")
        raise ValueError("SMTP credentials not configured. Please set SMTP_USER and SMTP_PASSWORD in .env")

    msg = MIMEMultipart()
    msg['From'] = SMTP_USER
    msg['To'] = to_email
    msg['Subject'] = subject
    
    msg.attach(MIMEText(html_body, 'html'))
    
    try:
        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(SMTP_USER, SMTP_PASSWORD)
        server.send_message(msg)
        server.quit()
        print(f"[EMAIL SERVICE] Email successfully sent to {to_email}")
        return True
    except Exception as e:
        print(f"[EMAIL SERVICE ERROR] Failed to send email to {to_email}: {e}")
        raise e

def send_otp_email(to_email: str, otp: str):
    subject = "Smart Campus AI Interview System - Verify Your Account"
    body = f"""
    <html>
      <body style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #2563eb;">Verify Your Account</h2>
        <p>Thank you for registering! Please use the following One-Time Password (OTP) to complete your registration:</p>
        <div style="background-color: #f3f4f6; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; border-radius: 8px; margin: 20px 0; color: #1e40af;">
          {otp}
        </div>
        <p>This code will expire in 15 minutes.</p>
        <p style="font-size: 12px; color: #6b7280; margin-top: 40px; border-top: 1px solid #e5e7eb; padding-top: 10px;">
          If you didn't request this, please ignore this email.
        </p>
      </body>
    </html>
    """
    return send_email(to_email, subject, body)

def send_interview_schedule_email(to_email: str, name: str, job_role: str, company: str, scheduled_time: str):
    subject = f"Interview Scheduled: {job_role} at {company}"
    body = f"""
    <html>
      <body style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #2563eb;">Interview Scheduled Successfully!</h2>
        <p>Hi {name},</p>
        <p>Your mock interview for the role of <strong>{job_role}</strong> at <strong>{company}</strong> has been successfully scheduled.</p>
        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0;"><strong>Scheduled Time:</strong> {scheduled_time}</p>
        </div>
        <p>Please make sure you are in a quiet environment and have your webcam and microphone ready before starting the interview.</p>
        <p>Best of luck!</p>
        <p>Smart Campus AI Team</p>
      </body>
    </html>
    """
    return send_email(to_email, subject, body)

def send_report_email(to_email: str, name: str, overall_score: float, tech_score: float, comm_score: float, strengths: str, improvements: str):
    subject = "Your AI Interview Report - Smart Campus"
    body = f"""
    <html>
      <body style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #2563eb;">Interview Complete!</h2>
        <p>Hi {name},</p>
        <p>Great job completing your AI Interview. Here is your evaluation report:</p>
        
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #1e40af;">Scores</h3>
          <ul style="list-style-type: none; padding-left: 0;">
            <li style="margin-bottom: 10px;"><strong>Overall Score:</strong> {overall_score:.1f}/10</li>
            <li style="margin-bottom: 10px;"><strong>Technical Score:</strong> {tech_score:.1f}/10</li>
            <li style="margin-bottom: 10px;"><strong>Communication:</strong> {comm_score:.1f}/10</li>
          </ul>
        </div>
        
        <div style="margin: 20px 0;">
          <h3 style="color: #1e40af;">AI Feedback</h3>
          <p><strong>Strengths:</strong></p>
          <p>{strengths}</p>
          <p><strong>Areas for Improvement:</strong></p>
          <p>{improvements}</p>
        </div>
        
        <p style="font-size: 12px; color: #6b7280; margin-top: 40px; border-top: 1px solid #e5e7eb; padding-top: 10px;">
          Smart Campus AI Interview System
        </p>
      </body>
    </html>
    """
    return send_email(to_email, subject, body)

def send_candidate_report_email(interview_id: int, db):
    """
    Sends the AI Interview report email to the candidate.
    Tracks delivery status in the database.
    """
    from models import User, Interview, InterviewReport
    
    interview = db.query(Interview).filter(Interview.id == interview_id).first()
    if not interview:
        raise ValueError(f"Interview {interview_id} not found")
        
    user = db.query(User).filter(User.id == interview.user_id).first()
    if not user:
        raise ValueError(f"User for interview {interview_id} not found")
        
    report = db.query(InterviewReport).filter(InterviewReport.interview_id == interview_id).first()
    if not report:
        raise ValueError(f"Report for interview {interview_id} not found")
        
    # Check if SMTP configuration is present
    if not SMTP_USER or not SMTP_PASSWORD:
        print(f"[EMAIL SERVICE WARNING] SMTP credentials not configured. Skipping email to {user.email}.")
        report.email_delivery_status = "smtp_missing"
        report.email_delivery_error = "SMTP credentials missing in configuration"
        db.commit()
        raise ValueError("SMTP credentials not configured. Please set SMTP_USER and SMTP_PASSWORD in .env")

    subject = f"Your AI Interview Report - {interview.job_role} at {interview.company}"
    
    # Calculate readiness score
    final_score = int(report.final_interview_score or report.hiring_readiness_score or report.average_score or 0)
    
    # Secure download link
    report_link = interview.report_url if interview.report_url else f"http://localhost:8000/download-report/{interview_id}"
    
    # Build HTML email body
    html_body = f"""
    <html>
      <body style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #1E293B; max-width: 600px; margin: 0 auto; padding: 20px; line-height: 1.5;">
        <h2 style="color: #0F172A; border-bottom: 2px solid #E2E8F0; padding-bottom: 10px; margin-bottom: 20px;">AI Interview Evaluation Report</h2>
        <p>Hi <strong>{user.name}</strong>,</p>
        <p>Congratulations on completing your interview for the <strong>{interview.job_role}</strong> position at <strong>{interview.company}</strong>!</p>
        
        <div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; padding: 18px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #475569; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">Overall Performance</h3>
          <p style="font-size: 32px; font-weight: bold; color: #059669; margin: 5px 0;">{final_score}%</p>
          <p style="margin: 0; font-size: 14px; color: #334155;"><strong>Recommendation:</strong> {report.recommendation}</p>
        </div>
        
        <div style="margin: 20px 0;">
          <h3 style="color: #0F172A; font-size: 14px; margin-bottom: 8px;">Interview Summary</h3>
          <p style="font-size: 13.5px; color: #475569; margin-top: 0; text-align: justify;">
            {report.narrative_summary}
          </p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="{report_link}" target="_blank" style="background-color: #0F172A; color: #FFFFFF; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 14px; display: inline-block;">
            Download Complete PDF Report
          </a>
        </div>
        
        <p style="font-size: 12px; color: #64748B; margin-top: 40px; border-top: 1px solid #E2E8F0; padding-top: 15px; text-align: center;">
          This is an automated message sent by the Smart Campus AI Interview System.
        </p>
      </body>
    </html>
    """
    
    try:
        send_email(user.email, subject, html_body)
        report.email_delivery_status = "sent"
        report.email_delivery_error = None
        db.commit()
        return True
    except Exception as e:
        report.email_delivery_status = "failed"
        report.email_delivery_error = str(e)
        db.commit()
        raise e
