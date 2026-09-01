import os
import smtplib
from email.message import EmailMessage

from dotenv import load_dotenv

load_dotenv()

email_user = os.getenv("MAIL_USERNAME")
email_password = os.getenv("MAIL_PASSWORD")

print("Gmail:", email_user)
print("App password loaded:", bool(email_password))

if not email_user or not email_password:
    print("ERROR: Gmail credentials are missing.")
    raise SystemExit


message = EmailMessage()

message["Subject"] = "MyNotes & Tasks - SMTP Test"

message["From"] = email_user

message["To"] = email_user

message.set_content(
    """
This is a test email from the
MyNotes & Tasks Flask application.

If you received this email,
Gmail SMTP is working correctly.
"""
)


try:

    print("Connecting to Gmail SMTP...")

    with smtplib.SMTP(
        "smtp.gmail.com",
        587,
        timeout=20
    ) as server:

        print("Starting TLS...")

        server.starttls()

        print("Logging into Gmail...")

        server.login(
            email_user,
            email_password
        )

        print("Sending email...")

        server.send_message(
            message
        )

    print("")
    print("================================")
    print("EMAIL SENT SUCCESSFULLY")
    print("================================")

except Exception as error:

    print("")
    print("================================")
    print("EMAIL FAILED")
    print("================================")
    print(type(error).__name__)
    print(error)