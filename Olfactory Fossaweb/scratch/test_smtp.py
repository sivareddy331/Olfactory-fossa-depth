import os
import smtplib
from dotenv import load_dotenv

load_dotenv(r'c:\programs\Olfactory Fossaweb\.env')

email = os.environ.get('MAIL_USERNAME')
password = os.environ.get('MAIL_PASSWORD')

print(f"Attempting to log in as: {email}")
if password:
    print(f"Password length: {len(password)}")
else:
    print("NO PASSWORD FOUND IN .ENV")

try:
    print("Connecting to smtp.gmail.com on port 587...")
    server = smtplib.SMTP('smtp.gmail.com', 587)
    server.set_debuglevel(1)
    server.ehlo()
    server.starttls()
    server.ehlo()
    print("Logging in...")
    server.login(email, password)
    print("LOGIN SUCCESSFUL! Configuration is perfectly fine.")
    server.quit()
except Exception as e:
    print(f"\n\nERROR CONNECTING TO GMAIL: {e}")
