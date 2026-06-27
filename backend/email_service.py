"""
email_service.py — SMTP email delivery with development mode fallback.

Development mode (ENVIRONMENT != 'production'):
  - If SMTP credentials are missing, OTP is printed to console.
  - Registration is NOT blocked.
  - send_otp_email() returns an EmailResult with dev_mode=True.

Production mode (ENVIRONMENT == 'production'):
  - SMTP credentials are required.
  - send_otp_email() raises on failure.
"""
import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv
from dataclasses import dataclass

load_dotenv()

SMTP_SERVER = os.getenv("SMTP_SERVER", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
ENVIRONMENT = os.getenv("ENVIRONMENT", "development").lower()


@dataclass
class EmailResult:
    """Result of an email send attempt."""
    success: bool
    dev_mode: bool = False
    message: str = ""


def is_smtp_configured() -> bool:
    """Check if all SMTP credentials are present."""
    return bool(SMTP_SERVER and SMTP_PORT and SMTP_USER and SMTP_PASSWORD)


def is_production() -> bool:
    """Check if running in production mode."""
    return ENVIRONMENT == "production"


def validate_smtp_config():
    """
    Validate SMTP configuration at startup.
    Prints clear PASS/FAIL messages for each variable.
    Called once during application startup.
    """
    print("\n" + "=" * 60)
    print("  SMTP CONFIGURATION CHECK")
    print("=" * 60)

    checks = {
        "SMTP_SERVER": SMTP_SERVER,
        "SMTP_PORT": str(SMTP_PORT),
        "SMTP_USER": SMTP_USER,
        "SMTP_PASSWORD": "***" if SMTP_PASSWORD else "",
    }

    all_ok = True
    for key, value in checks.items():
        if value and value != "***":
            print(f"  [OK] {key}: {value} ... PASS")
        elif value == "***":
            print(f"  [OK] {key}: ******** ... PASS")
        else:
            print(f"  [X]  {key}: (empty) ... FAIL")
            all_ok = False

    print(f"  ENVIRONMENT: {ENVIRONMENT}")

    if all_ok:
        print(f"\n  [OK] SMTP fully configured. Emails will be delivered via {SMTP_SERVER}:{SMTP_PORT}")
    elif is_production():
        print(f"\n  [X]  WARNING: SMTP NOT configured in PRODUCTION mode!")
        print(f"       Email delivery will FAIL. Set SMTP_USER and SMTP_PASSWORD in .env")
    else:
        print(f"\n  [WARN] SMTP NOT configured (development mode).")
        print(f"         OTPs will be printed to console instead of emailed.")
        print(f"         To enable email delivery, set SMTP_USER and SMTP_PASSWORD in .env")

    print("=" * 60 + "\n")
    return all_ok


def send_email(to_email: str, subject: str, html_body: str):
    """
    Send an email via SMTP. Raises on failure.
    Callers should check is_smtp_configured() before calling if they want
    to handle the missing-credentials case gracefully.
    """
    if not SMTP_USER or not SMTP_PASSWORD:
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
    except smtplib.SMTPAuthenticationError as e:
        print(f"[EMAIL SERVICE ERROR] SMTP authentication failed for {SMTP_USER}: {e}")
        raise
    except smtplib.SMTPConnectError as e:
        print(f"[EMAIL SERVICE ERROR] Could not connect to {SMTP_SERVER}:{SMTP_PORT}: {e}")
        raise
    except smtplib.SMTPException as e:
        print(f"[EMAIL SERVICE ERROR] SMTP error sending to {to_email}: {e}")
        raise
    except Exception as e:
        print(f"[EMAIL SERVICE ERROR] Unexpected error sending to {to_email}: {e}")
        raise


def send_otp_email(to_email: str, otp: str) -> EmailResult:
    """
    Send OTP verification email.
    
    In development mode without SMTP:
      - Prints OTP to console
      - Returns EmailResult(success=True, dev_mode=True)
    
    In production mode without SMTP:
      - Raises ValueError
    
    With SMTP configured:
      - Sends email normally
      - Returns EmailResult(success=True, dev_mode=False)
    """
    if not is_smtp_configured():
        if is_production():
            print(f"[EMAIL SERVICE ERROR] SMTP not configured in production. Cannot send OTP to {to_email}")
            raise ValueError("Email service is not configured. Unable to send verification email.")

        # Development mode fallback — print OTP to console
        print("\n" + "=" * 50)
        print("  [DEV MODE] EMAIL SERVICE NOT CONFIGURED")
        print("=" * 50)
        print(f"  OTP generated for {to_email}")
        print(f"  OTP: {otp}")
        print("=" * 50 + "\n")
        return EmailResult(
            success=True,
            dev_mode=True,
            message="Email service is not configured. Check backend console for OTP."
        )

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
    try:
        send_email(to_email, subject, body)
        return EmailResult(success=True, dev_mode=False, message="OTP sent to your email.")
    except Exception as e:
        print(f"[EMAIL SERVICE ERROR] Failed to send OTP to {to_email}: {e}")
        if is_production():
            raise
        # Development mode — fall back to console
        print("\n" + "=" * 50)
        print("  [DEV MODE] SMTP SEND FAILED — FALLBACK TO CONSOLE")
        print("=" * 50)
        print(f"  OTP generated for {to_email}")
        print(f"  OTP: {otp}")
        print(f"  SMTP Error: {e}")
        print("=" * 50 + "\n")
        return EmailResult(
            success=True,
            dev_mode=True,
            message="Email delivery failed. Check backend console for OTP."
        )


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
    import os
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

    # 4. Report Handling: If PDF already exists, reuse it. Otherwise generate it.
    if not interview.report_path or not os.path.exists(interview.report_path):
        from report_generator import generate_pdf_report
        try:
            pdf_path, pdf_url = generate_pdf_report(interview_id, db)
            interview.report_path = pdf_path
            interview.report_url = pdf_url
            db.commit()
            db.refresh(interview)
        except Exception as pdf_exc:
            print(f"[EMAIL SERVICE ERROR] Failed to generate PDF on-the-fly: {pdf_exc}")

    # Set status to pending initially
    report.email_delivery_status = "pending"
    db.commit()

    # Check if SMTP configuration is present
    if not is_smtp_configured():
        err_msg = "SMTP credentials missing in configuration"
        print(f"[EMAIL SERVICE WARNING] {err_msg}. Skipping report email to {user.email}.")
        report.email_delivery_status = "failed"
        report.email_delivery_error = err_msg
        db.commit()
        raise ValueError(err_msg)

    # 3. Email Content calculations & normalization
    def normalize_score(score):
        if score is None:
            return 0
        if score > 0 and score <= 10:
            return round(score * 10)
        return round(score)

    tech_pct = normalize_score(report.technical_score)
    hr_pct = normalize_score(report.hr_score)
    readiness_pct = normalize_score(report.hiring_readiness_score or report.final_interview_score)

    date_str = interview.created_at.strftime("%Y-%m-%d %H:%M:%S") if interview.created_at else "N/A"
    subject = f"Your AI Interview Report - {interview.job_role} at {interview.company}"

    # Secure download link
    report_link = interview.report_url if interview.report_url else f"http://localhost:8000/download-report/{interview_id}"

    # Build HTML email body with a highly professional design
    html_body = f"""
    <html>
      <body style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #1E293B; max-width: 600px; margin: 0 auto; padding: 20px; line-height: 1.6; background-color: #F8FAFC;">
        <div style="background-color: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 12px; padding: 32px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
          <h2 style="color: #0F172A; border-bottom: 2px solid #F1F5F9; padding-bottom: 16px; margin-top: 0; margin-bottom: 24px; font-size: 22px; font-weight: 800; text-align: center;">AI Interview Evaluation Report</h2>
          
          <p style="font-size: 15px; color: #334155; margin-bottom: 20px;">Hi <strong>{user.name}</strong>,</p>
          <p style="font-size: 15px; color: #334155; margin-bottom: 24px;">Thank you for completing your mock interview. Below are the key metrics and analysis generated by our AI evaluation system.</p>
          
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 14px; text-align: left;">
            <tr style="border-bottom: 1px solid #F1F5F9;">
              <th style="padding: 10px 0; color: #64748B; font-weight: 600; width: 140px;">Candidate Name</th>
              <td style="padding: 10px 0; color: #0F172A; font-weight: 700;">{user.name}</td>
            </tr>
            <tr style="border-bottom: 1px solid #F1F5F9;">
              <th style="padding: 10px 0; color: #64748B; font-weight: 600;">Job Role</th>
              <td style="padding: 10px 0; color: #0F172A; font-weight: 600;">{interview.job_role}</td>
            </tr>
            <tr style="border-bottom: 1px solid #F1F5F9;">
              <th style="padding: 10px 0; color: #64748B; font-weight: 600;">Company</th>
              <td style="padding: 10px 0; color: #0F172A; font-weight: 600;">{interview.company}</td>
            </tr>
            <tr style="border-bottom: 1px solid #F1F5F9;">
              <th style="padding: 10px 0; color: #64748B; font-weight: 600;">Interview Date</th>
              <td style="padding: 10px 0; color: #0F172A;">{date_str}</td>
            </tr>
          </table>

          <div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; padding: 20px; border-radius: 8px; margin: 24px 0; text-align: center;">
            <h3 style="margin-top: 0; color: #64748B; font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 700; margin-bottom: 12px;">Hiring Readiness Score</h3>
            <p style="font-size: 40px; font-weight: 800; color: #059669; margin: 0 0 10px 0;">{readiness_pct}%</p>
            <p style="margin: 0; font-size: 14px; color: #334155; line-height: 1.4;"><strong>AI Recommendation:</strong> {report.recommendation}</p>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin: 24px 0;">
            <div style="background-color: #FFFFFF; border: 1px solid #E2E8F0; padding: 16px; border-radius: 8px; text-align: center; display: inline-block; width: 44%; margin-right: 4%;">
              <h4 style="margin: 0 0 6px 0; color: #64748B; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">Technical Score</h4>
              <p style="margin: 0; font-size: 20px; font-weight: 700; color: #0F172A;">{tech_pct}%</p>
            </div>
            <div style="background-color: #FFFFFF; border: 1px solid #E2E8F0; padding: 16px; border-radius: 8px; text-align: center; display: inline-block; width: 44%;">
              <h4 style="margin: 0 0 6px 0; color: #64748B; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">HR Score</h4>
              <p style="margin: 0; font-size: 20px; font-weight: 700; color: #0F172A;">{hr_pct}%</p>
            </div>
          </div>
          
          <div style="margin: 24px 0;">
            <h3 style="color: #0F172A; font-size: 15px; font-weight: 700; margin-top: 0; margin-bottom: 8px;">Narrative Summary</h3>
            <p style="font-size: 14px; color: #475569; margin-top: 0; text-align: justify; line-height: 1.6;">
              {report.narrative_summary}
            </p>
          </div>
          
          <div style="text-align: center; margin: 32px 0 16px 0;">
            <a href="{report_link}" target="_blank" style="background-color: #0F172A; color: #FFFFFF; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 700; font-size: 14px; display: inline-block; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              Download Complete PDF Report
            </a>
          </div>
          
          <p style="font-size: 11px; color: #94A3B8; margin-top: 32px; border-top: 1px solid #F1F5F9; padding-top: 16px; text-align: center;">
            This is an automated message sent by the Smart Campus AI Interview System. Please do not reply directly to this email.
          </p>
        </div>
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
