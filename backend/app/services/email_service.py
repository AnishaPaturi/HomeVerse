"""
HomeVerse SMTP Email Service
Sends transactional emails (password reset OTPs, verification, notifications).
"""
import logging
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Optional

from app.core.config import settings

logger = logging.getLogger("homeverse.email")


def get_smtp_sender() -> str:
    """Returns the effective sender email address."""
    if settings.SMTP_FROM_EMAIL:
        return settings.SMTP_FROM_EMAIL
    if settings.SMTP_USER:
        return settings.SMTP_USER
    return "noreply@homeverse.ai"


def send_password_reset_email(to_email: str, code: str) -> bool:
    """
    Sends a 5-digit verification code to the user's email address via SMTP.
    Returns True if sent successfully, False otherwise.
    """
    clean_to = to_email.strip().lower()
    from_email = get_smtp_sender()
    from_header = f"{settings.SMTP_FROM_NAME} <{from_email}>"

    # Check if SMTP credentials are provided
    if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        logger.warning(
            "SMTP is not configured in backend/.env (SMTP_USER or SMTP_PASSWORD missing). "
            f"Cannot dispatch verification email to {clean_to}."
        )
        return False

    subject = f"Your HomeVerse Verification Code: {code}"

    # Plain text version (fallback for basic clients)
    text_content = f"""Hello,

You requested to reset your HomeVerse password.

Your 5-digit verification code is:

    {code}

This code is valid for 10 minutes. Enter it in HomeVerse to proceed with setting your new password.

If you did not request a password reset, please ignore this email. Your HomeVerse account remains secure.

Best regards,
The HomeVerse Spatial OS Team
https://homeverse.ai
"""

    # Rich HTML email matching HomeVerse dark obsidian & emerald brand
    html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your HomeVerse Password</title>
</head>
<body style="margin: 0; padding: 0; background-color: #06090e; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f1f5f9;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #06090e; padding: 40px 15px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 520px; background-color: #0c141e; border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 24px; padding: 36px 32px; box-shadow: 0 20px 50px rgba(0,0,0,0.7);" cellspacing="0" cellpadding="0" border="0">
          
          <!-- Logo Header -->
          <tr>
            <td align="left" style="padding-bottom: 24px; border-bottom: 1px solid rgba(255, 255, 255, 0.08);">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="width: 32px; height: 32px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 10px; text-align: center; vertical-align: middle; font-family: monospace; font-weight: bold; font-size: 13px; color: #06090e;">
                    HV
                  </td>
                  <td style="padding-left: 12px; font-family: monospace; font-size: 14px; font-weight: 800; color: #ffffff; letter-spacing: 0.5px;">
                    HOMEVERSE <span style="font-size: 10px; color: #10b981; background-color: rgba(16, 185, 129, 0.15); padding: 2px 6px; border-radius: 6px; border: 1px solid rgba(16, 185, 129, 0.3);">SPATIAL OS</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Body -->
          <tr>
            <td style="padding-top: 28px; padding-bottom: 8px;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px;">
                Password Reset Verification
              </h1>
              <p style="margin: 12px 0 24px 0; font-size: 14px; line-height: 22px; color: #94a3b8;">
                We received a request to reset your password for your HomeVerse account (<span style="color: #cbd5e1; font-weight: 600;">{clean_to}</span>). Enter the 5-digit verification code below to set a new password:
              </p>
            </td>
          </tr>

          <!-- OTP Code Box -->
          <tr>
            <td align="center" style="padding: 12px 0 24px 0;">
              <div style="background-color: #060a0f; border: 1px solid rgba(16, 185, 129, 0.4); border-radius: 16px; padding: 20px 24px; text-align: center; box-shadow: 0 0 30px rgba(16, 185, 129, 0.15); display: inline-block; width: 85%;">
                <span style="font-family: 'SF Mono', Monaco, Consolas, 'Courier New', monospace; font-size: 34px; font-weight: 800; letter-spacing: 12px; color: #10b981; display: block; margin-left: 12px;">
                  {code}
                </span>
                <span style="font-size: 11px; color: #64748b; font-family: monospace; display: block; margin-top: 8px; text-transform: uppercase; letter-spacing: 1px;">
                  5-Digit Verification Code
                </span>
              </div>
            </td>
          </tr>

          <!-- Expiration Notice -->
          <tr>
            <td style="padding-bottom: 24px; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #94a3b8; font-family: monospace;">
                ⏱ This code expires in <strong style="color: #f1f5f9;">10 minutes</strong>.
              </p>
            </td>
          </tr>

          <!-- Security Notice & Footer -->
          <tr>
            <td style="padding-top: 24px; border-top: 1px solid rgba(255, 255, 255, 0.08); font-size: 12px; line-height: 18px; color: #64748b;">
              <p style="margin: 0 0 10px 0;">
                If you did not make this request, you can safely ignore this email. No changes will be made to your account.
              </p>
              <p style="margin: 0; font-family: monospace; font-size: 11px;">
                © {2026} HomeVerse AI. Spatial Architecture & Indian Budget Operating System.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
"""

    # Assemble MIME message
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = from_header
    msg["To"] = clean_to

    msg.attach(MIMEText(text_content, "plain", "utf-8"))
    msg.attach(MIMEText(html_content, "html", "utf-8"))

    try:
        if settings.SMTP_SSL or settings.SMTP_PORT == 465:
            server = smtplib.SMTP_SSL(settings.SMTP_HOST, settings.SMTP_PORT, timeout=15)
        else:
            server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=15)
            if settings.SMTP_TLS:
                server.starttls()

        server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
        server.send_message(msg)
        server.quit()
        logger.info(f"Verification code successfully sent via SMTP to {clean_to}")
        return True

    except Exception as e:
        logger.error(f"Failed to deliver verification email to {clean_to} via SMTP: {str(e)}")
        return False
