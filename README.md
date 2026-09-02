# 📝 MyNotes & Tasks

> A full-stack personal productivity workspace for managing notes, tasks, checklists, reminders, activity history, and Google Calendar integration.

<p align="center">

  <img src="https://img.shields.io/badge/Python-3.x-blue?style=for-the-badge&logo=python" alt="Python">
  <img src="https://img.shields.io/badge/Flask-3.x-black?style=for-the-badge&logo=flask" alt="Flask">
  <img src="https://img.shields.io/badge/MongoDB-Atlas-green?style=for-the-badge&logo=mongodb" alt="MongoDB">
  <img src="https://img.shields.io/badge/Google%20Calendar-OAuth%202.0-red?style=for-the-badge&logo=googlecalendar" alt="Google Calendar">
  <img src="https://img.shields.io/badge/HTML5-orange?style=for-the-badge&logo=html5" alt="HTML5">
  <img src="https://img.shields.io/badge/CSS3-blue?style=for-the-badge&logo=css3" alt="CSS3">
  <img src="https://img.shields.io/badge/JavaScript-yellow?style=for-the-badge&logo=javascript" alt="JavaScript">

</p>

---

## 📌 Overview

**MyNotes & Tasks** is a web-based productivity application designed to keep personal notes, tasks, checklists, reminders, and activity history inside one workspace.

### Core capabilities

- 🔐 User authentication
- 📧 Email verification
- 🔑 Password reset
- 🔒 Secure password hashing
- 📝 Notes management
- 📌 Pinned notes
- 🔎 Note search
- 🗂️ Note categories
- ↕️ Note sorting
- 📊 Note statistics
- ☑️ Task management
- 📋 Checklists
- 🚦 Task priorities
- 📅 Due dates and times
- 🔔 Email reminders
- 📆 Google Calendar integration
- 🔔 Google Calendar reminders
- 👤 Profile management
- 🖼️ Profile photo management
- 🌍 User timezone support
- 📜 Activity logs
- 📊 Dashboard statistics
- 📱 Responsive interface
- ☁️ MongoDB Atlas storage
- 🚀 Render deployment

---

# ✨ Features

## 🔐 Authentication

The application provides a complete authentication system.

- User signup
- User login
- User logout
- Session-based authentication
- Email verification
- Resend verification
- Password reset
- Change password
- Password strength validation
- Protected application routes

### Password requirements

Passwords require:

- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number

Passwords are stored as secure hashes rather than plain text.

---

# 📧 Email Verification

New accounts can require email verification.

The application sends verification emails through Gmail SMTP.

Verification links are time-limited.

```env
VERIFICATION_EXPIRY_MINUTES=15
```

---

# 🔑 Password Reset

The password recovery workflow is:

```text
User
 │
 ▼
Forgot Password
 │
 ▼
Enter Email
 │
 ▼
Generate Secure Reset Token
 │
 ▼
Send Email
 │
 ▼
User Opens Reset Link
 │
 ▼
Set New Password
 │
 ▼
Password Updated
```

Reset tokens are configured with an expiration period.

```env
RESET_EXPIRY_MINUTES=15
```

---

# 📝 Notes Management

Users can create and manage personal notes.

### Note features

- Create note
- View note
- Edit note
- Delete note
- Search notes
- Filter notes
- Sort notes
- Pin/unpin notes
- Categorize notes
- Character counter
- Note statistics

### Categories

```text
Personal
Work
Study
Ideas
```

---

# 🔎 Note Search

The Notes page provides dynamic note searching.

Users can search by information contained in their notes, including titles and content.

---

# 🗂️ Note Filtering

Notes can be filtered by:

```text
All
Work
Personal
Study
Ideas
```

---

# ↕️ Note Sorting

Supported sorting options include:

```text
Recently Updated
Newest
Oldest
Title A-Z
Pinned First
```

---

# 📌 Pinned Notes

Important notes can be pinned and unpinned.

The Notes page also displays the number of pinned notes.

---

# ☑️ Task Management

Tasks can contain:

```text
Task title
Description
Priority
Category
Due date
Due time
Reminder
Completion status
```

---

# 🚦 Task Priorities

Tasks support priority levels such as:

```text
High
Medium
Low
```

---

# 📅 Due Dates & Times

Tasks support both due dates and due times.

Example:

```text
Task:
Complete project documentation

Date:
05 September 2026

Time:
5:50 PM
```

---

# 🔔 Email Reminders

The application supports email-based reminders.

```text
Task
 │
 ▼
Due Date / Time
 │
 ▼
Reminder Logic
 │
 ▼
Gmail SMTP
 │
 ▼
User Email
```

---

# 📆 Google Calendar Integration

MyNotes & Tasks supports Google Calendar integration through Google OAuth 2.0.

The connection flow is:

```text
MyNotes Profile
       │
       ▼
Connect Google Calendar
       │
       ▼
Google OAuth
       │
       ▼
User Grants Permission
       │
       ▼
OAuth Callback
       │
       ▼
Access + Refresh Credentials
       │
       ▼
Stored for the User
       │
       ▼
Google Calendar Connected
```

---

# 🔐 Google OAuth

Google Calendar authentication uses OAuth 2.0.

The application uses the Calendar Events scope:

```text
https://www.googleapis.com/auth/calendar.events
```

The OAuth callback is:

```text
/api/google/callback
```

---

# 🔔 Google Calendar Reminders

Google Calendar events can be configured with multiple popup reminders.

For a task due at:

```text
5:50 PM
```

the configured reminders are:

```text
5:40 PM → 🔔 10 minutes before
5:45 PM → 🔔 5 minutes before
5:50 PM → 🔔 Exact due time
```

The Calendar API event configuration is:

```python
"reminders": {
    "useDefault": False,
    "overrides": [
        {
            "method": "popup",
            "minutes": 10
        },
        {
            "method": "popup",
            "minutes": 5
        },
        {
            "method": "popup",
            "minutes": 0
        }
    ]
}
```

> Notification delivery can still depend on Google Calendar and the user's device notification/background settings.

---

# 🌍 Timezone Support

The application supports user-specific timezones.

Example:

```text
Asia/Kolkata
```

Calendar event times should be constructed using the selected timezone:

```python
start_dt = datetime.fromisoformat(
    f"{due_date}T{due_time}:00"
).replace(
    tzinfo=ZoneInfo(timezone_name)
)
```

This helps ensure that a task's due time is interpreted in the user's selected timezone.

---

# 🔄 Google Calendar Synchronization

The intended synchronization flow is:

```text
                 MyNotes Task
                      │
                      ▼
             Google Connected?
                /          \
              NO            YES
              │              │
              ▼              ▼
        Normal Task    Google Calendar
                            │
                            ▼
                       Create Event
                            │
                            ▼
                   Save Event ID
```

When a task is edited:

```text
Edit Task
   │
   ▼
Existing Google Event ID?
   │
   ▼
Update Google Calendar Event
```

When a task is deleted:

```text
Delete Task
   │
   ▼
Find Google Event ID
   │
   ▼
Delete Google Calendar Event
```

---

# 👤 Profile Management

Users can manage:

```text
Name
Username
Email
Phone
Bio
Timezone
Date format
Theme
Profile photo
```

---

# 🖼️ Profile Photo

Users can upload or remove a profile photo.

The application validates:

- File type
- File size
- Image format

When no profile photo is available, user initials can be displayed.

---

# 📊 Dashboard

The dashboard provides an overview of the user's workspace.

Typical information includes:

```text
Total Notes
Total Tasks
Completed Tasks
Pending Tasks
Upcoming Tasks
Recent Activity
```

---

# 📜 Activity Logs

The application records important workspace activity, such as:

```text
Account activity
Note creation
Note updates
Note deletion
Task creation
Task updates
Task completion
Google Calendar connection
Google Calendar disconnection
```

---

# 🗄️ Database

The application uses **MongoDB Atlas** for cloud storage.

The database stores application information such as:

```text
Users
Notes
Tasks
Activity Logs
Google Calendar information
```

User-specific queries are used so that workspace data belongs to the authenticated user.

---

# 🏗️ Project Architecture

```text
MyNotes & Tasks
│
├── app.py
├── requirements.txt
├── .gitignore
│
├── static/
│   ├── css/
│   │   └── style.css
│   │
│   └── js/
│       ├── api.js
│       ├── dashboard.js
│       ├── notes.js
│       └── ...
│
└── templates/
    ├── index.html
    ├── login.html
    ├── signup.html
    ├── dashboard.html
    ├── notes.html
    ├── tasks.html
    ├── upcoming.html
    ├── logs.html
    └── profile.html
```

---

# 🧩 Technology Stack

## Backend

```text
Python
Flask
Flask-PyMongo
PyMongo
Werkzeug
Gunicorn
```

## Frontend

```text
HTML5
CSS3
JavaScript
Jinja2
```

## Database

```text
MongoDB Atlas
```

## Authentication

```text
Flask Sessions
Password Hashing
Email Verification
Password Reset
```

## Email

```text
Resend
Flask-Mail
```
- 📧 Email Service: Resend API — migrated from direct Gmail SMTP for more reliable cloud deployment and transactional email delivery

## Google Integration

```text
Google OAuth 2.0
Google Calendar API
google-auth
google-auth-oauthlib
google-api-python-client
```

## Deployment

```text
Render
Gunicorn
```

---

# 📦 Requirements

Current major dependencies:

```text
Flask==3.1.0
Flask-PyMongo==2.3.0
pymongo==4.10.1
python-dotenv==1.0.1
Flask-Mail==0.10.0
Werkzeug==3.1.3

google-auth==2.40.3
google-auth-oauthlib==1.2.2
google-api-python-client==2.177.0

gunicorn==23.0.0
```

Install them with:

```bash
pip install -r requirements.txt
```

---

# 🚀 Local Installation

## 1. Clone the repository

```bash
git clone https://github.com/Aluval/MyNotesTasks.git
cd MyNotesTasks
```

---

# 🐍 2. Create Virtual Environment

### Windows

```bash
python -m venv venv
venv\Scripts\activate
```

### Linux/macOS

```bash
python3 -m venv venv
source venv/bin/activate
```

---

# 📦 3. Install Dependencies

```bash
pip install -r requirements.txt
```

---

# 🔐 4. Configure Environment Variables

Create a local `.env` file.

Example:

```env
# Flask
SECRET_KEY=your_secure_secret_key

# MongoDB
MONGO_URI=your_mongodb_connection_string

# Gmail SMTP
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your_email@gmail.com
MAIL_PASSWORD=your_gmail_app_password
MAIL_FROM_NAME=MyNotes & Tasks

# Application
APP_BASE_URL=http://127.0.0.1:5000

# Verification
VERIFICATION_EXPIRY_MINUTES=15

# Password Reset
RESET_EXPIRY_MINUTES=15

# Flask Port
PORT=5000
```

---

# ⚠️ Security

**Never commit secrets to GitHub.**

The `.env` file should be ignored:

```gitignore
.env
venv/
.venv/
__pycache__/
*.pyc
credentials/
```

Never commit:

```text
.env
client_secret.json
MongoDB passwords
SMTP passwords
API keys
Secret keys
OAuth refresh tokens
OAuth credentials
```

For production, secrets should be configured through the deployment platform's environment variables/secrets.

---

# 🔒 Google OAuth Secrets

Do not publicly expose Google OAuth client secrets.

If the application uses environment-based Google OAuth configuration, keep the configuration in the deployment environment.

Do not commit:

```text
credentials/client_secret.json
```

to the repository.

---

# ▶️ Run Locally

Start the Flask application:

```bash
python app.py
```

The application normally runs at:

```text
http://127.0.0.1:5000
```

---

# ☁️ Render Deployment

The application can be deployed as a Python Web Service.

### Build Command

```bash
pip install -r requirements.txt
```

### Start Command

```bash
gunicorn app:app
```

---

# 🌐 Production Configuration

Set the production application URL:

```env
APP_BASE_URL=https://your-domain.onrender.com
```

Do not use:

```env
APP_BASE_URL=http://127.0.0.1:5000
```

for production OAuth.

---

# 🔗 Google OAuth Redirect URI

The production Google OAuth redirect URI must exactly match the URI configured in Google Cloud.

Example:

```text
https://your-domain.onrender.com/api/google/callback
```

The following values must correspond:

```text
Application URL
        ↓
APP_BASE_URL
        ↓
Google OAuth Redirect URI
        ↓
Flask Callback Route
```

---

# 🔄 API Architecture

Examples of application endpoints:

```text
/api/auth/me
/api/auth/login
/api/auth/logout
/api/auth/change-password

/api/profile
/api/profile/photo

/api/notes
/api/notes/<id>

/api/tasks
/api/tasks/<id>

/api/dashboard/stats

/api/google/connect
/api/google/callback
/api/google/status
/api/google/disconnect
```

---

# 🧠 Frontend Architecture

```text
Browser
   │
   ▼
HTML / CSS / JavaScript
   │
   ▼
API Helper
   │
   ▼
Flask API
   │
   ├── Authentication
   ├── Notes
   ├── Tasks
   ├── Profile
   ├── Reminders
   └── Google Calendar
   │
   ▼
MongoDB Atlas / External APIs
```

---

# 🛡️ Security Design

## Password Security

```text
Password
   ↓
Secure Password Hash
   ↓
MongoDB
```

The original password is not stored.

## Session Authentication

```text
Login
  ↓
Authenticated Session
  ↓
Dashboard
  ↓
Notes / Tasks / Profile
```

## User Data Isolation

Database operations should always be scoped to the authenticated user's identity.

Conceptually:

```python
{
    "user_id": current_user_id
}
```

---

# 📧 Gmail Configuration

For Gmail SMTP, use an appropriate Gmail App Password where required rather than exposing the normal account password.

Example:

```env
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your_email@gmail.com
MAIL_PASSWORD=your_app_password
```

---

# 🧪 Testing Checklist

## Authentication

```text
[ ] Signup
[ ] Email verification
[ ] Resend verification
[ ] Login
[ ] Logout
[ ] Forgot password
[ ] Reset password
[ ] Change password
```

## Notes

```text
[ ] Create note
[ ] View note
[ ] Edit note
[ ] Delete note
[ ] Search note
[ ] Filter note
[ ] Sort note
[ ] Pin note
[ ] Unpin note
```

## Tasks

```text
[ ] Create task
[ ] Edit task
[ ] Delete task
[ ] Complete task
[ ] Reopen task
[ ] Set priority
[ ] Set due date
[ ] Set due time
[ ] Configure reminder
```

## Google Calendar

```text
[ ] Connect Google Calendar
[ ] OAuth authorization
[ ] OAuth callback
[ ] Calendar status
[ ] Create Calendar event
[ ] 10-minute reminder
[ ] 5-minute reminder
[ ] Exact due-time reminder
[ ] Update Calendar event
[ ] Delete Calendar event
[ ] Disconnect Calendar
```

---

# 🐛 Troubleshooting

## Google OAuth redirect URI mismatch

If Google displays:

```text
Error 400: redirect_uri_mismatch
```

check that the redirect URI in Google Cloud exactly matches the URI generated by the application.

Example:

```text
https://your-domain.onrender.com/api/google/callback
```

---

## Google OAuth code verifier missing

If the application returns:

```text
Google OAuth code verifier is missing.
```

make sure the PKCE verifier is generated during the connect request and persisted until the callback.

The callback must be able to retrieve the verifier associated with the OAuth state.

---

## MongoDB connection error

Check:

```env
MONGO_URI=...
```

Also verify that MongoDB Atlas allows connections from the deployment environment.

---

## Gmail email not sending

Check:

```env
MAIL_HOST
MAIL_PORT
MAIL_USERNAME
MAIL_PASSWORD
```

Also verify the Gmail account's SMTP authentication configuration.

---

## JavaScript not updating after deployment

Try:

```text
Browser
   ↓
Hard Refresh
   ↓
Clear cached JavaScript
   ↓
Test again
```

Check:

```text
Developer Tools → Console
```

and:

```text
Developer Tools → Network
```

---

# 📊 Overall Application Flow

```text
                    ┌───────────────────┐
                    │      Browser      │
                    │    HTML/CSS/JS    │
                    └─────────┬─────────┘
                              │
                              ▼
                    ┌───────────────────┐
                    │   Flask Backend   │
                    │      app.py       │
                    └───────┬───┬───────┘
                            │   │
                ┌───────────┘   └────────────┐
                ▼                            ▼
       ┌─────────────────┐          ┌─────────────────┐
       │  MongoDB Atlas  │          │ External APIs   │
       │                 │          │                 │
       │ Users           │          │ Gmail SMTP      │
       │ Notes           │          │ Google Calendar │
       │ Tasks           │          │ Google OAuth    │
       │ Activity Logs   │          │                 │
       └─────────────────┘          └─────────────────┘
```

---

# 🗃️ Data Model Concept

## User

```text
User
├── id
├── name
├── username
├── email
├── password_hash
├── email_verified
├── phone
├── bio
├── timezone
├── date_format
├── theme
├── profile_photo
├── created_at
├── updated_at
└── google_calendar
```

## Note

```text
Note
├── id
├── user_id
├── title
├── content
├── category
├── pinned
├── created_at
└── updated_at
```

## Task

```text
Task
├── id
├── user_id
├── title
├── description
├── priority
├── category
├── completed
├── due_date
├── due_time
├── reminder
├── created_at
├── updated_at
└── google_calendar_event_id
```

## Activity Log

```text
ActivityLog
├── id
├── user_id
├── action
├── entity_type
├── entity_name
├── description
└── created_at
```

---

# 📱 Responsive Design

The interface is designed for:

```text
Desktop
Laptop
Tablet
Mobile
```

The application includes responsive navigation with a mobile sidebar and overlay.

---

# 🎯 Project Goals

1. Provide a simple personal productivity workspace.
2. Keep notes and tasks in one application.
3. Provide secure account authentication.
4. Support task scheduling.
5. Provide reminder functionality.
6. Integrate Google Calendar.
7. Maintain activity history.
8. Provide cloud-based storage.
9. Provide a responsive interface.
10. Provide a deployable production architecture.

---

# 🚀 Future Improvements

```text
[ ] Recurring tasks
[ ] Multiple Google Calendars
[ ] Calendar event color selection
[ ] Custom reminder intervals
[ ] Browser notifications
[ ] Push notifications
[ ] Dark/light theme refinement
[ ] Advanced task filtering
[ ] Drag-and-drop task ordering
[ ] Note attachments
[ ] File uploads
[ ] Rich text editor
[ ] Markdown notes
[ ] Task labels
[ ] Calendar view
[ ] Analytics dashboard
[ ] Backup/export
[ ] Import/export notes
[ ] Progressive Web App support
[ ] Mobile application

[ ] MCP integration
[ ] MyNotes MCP Server
[ ] MCP tools for Notes
[ ] MCP tools for Tasks
[ ] MCP tools for Google Calendar
[ ] MCP tools for Activity Logs
[ ] MCP-based productivity assistant
[ ] AI task creation through MCP
[ ] AI note search through MCP
[ ] AI task updates through MCP
[ ] AI calendar scheduling through MCP
[ ] AI-powered productivity automation
```

## 🔮 Future: MCP Integration

```
MCP (Model Context Protocol) integration is planned for a future
version of MyNotes & Tasks.

The future MCP layer is intended to allow AI assistants to securely
interact with the user's productivity workspace.
```
### Planned Capabilities
```
- 📝 AI-powered Notes access
- ✅ AI-powered Task management
- 📅 Google Calendar interaction
- 🔔 Smart reminder management
- 🔎 Unified Notes & Tasks search
- 📊 Productivity statistics
- 🤖 Natural-language task creation
- 🧠 AI task planning and breakdown
- 🗓️ AI-assisted calendar scheduling
- 🔄 Task and Calendar synchronization
- 📜 Activity and productivity summaries
- 🔐 Permission-based MCP access
- 🛡️ User-specific data isolation
- 💬 MCP Tools, Resources and Prompts
- 🔔 Future MCP event/notification support
```
### Planned Architecture

```text
AI Assistant
     ↓
MCP Client
     ↓
MyNotes MCP Server
     ↓
Authentication & Authorization
     ↓
MyNotes Application API
     ↓
MongoDB / Google Calendar / Email
```

# 📈 Project Status

| Feature | Status |
|---|---|
| Flask Backend | ✅ |
| MongoDB Atlas | ✅ |
| User Authentication | ✅ |
| Email Verification | ✅ |
| Password Reset | ✅ |
| Change Password | ✅ |
| Notes | ✅ |
| Note Search | ✅ |
| Note Filters | ✅ |
| Note Sorting | ✅ |
| Pinned Notes | ✅ |
| Tasks | ✅ |
| Task Priorities | ✅ |
| Due Dates | ✅ |
| Due Times | ✅ |
| Email Reminders | ✅ |
| Google OAuth | ✅ |
| Google Calendar Connection | ✅ |
| Google Calendar Disconnect | ✅ |
| Google Calendar Events | ✅ |
| Calendar 10-Minute Reminder | ✅ |
| Calendar 5-Minute Reminder | ✅ |
| Calendar Exact-Time Reminder | ✅ |
| Profile Management | ✅ |
| Profile Photo | ✅ |
| Timezone Support | ✅ |
| Activity Logs | ✅ |
| Render Deployment | ✅ |
| MCP Integration | 🔜 Planned |

---

# 🌐 Project Links

### 🚀 Live Application

[![Live Application](https://img.shields.io/badge/Live%20Application-MyNotes%20%26%20Tasks-2EA44F?style=for-the-badge&logo=render&logoColor=white)](https://mynotestasks.onrender.com/)

### 📦 GitHub Repository

[![Repository](https://img.shields.io/badge/GitHub-MyNotesTasks-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/Aluval/MyNotesTasks)

### 📄 Project Documentation 

[![Documentation PDF](https://img.shields.io/badge/Documentation-PDF-red?style=for-the-badge&logo=adobeacrobatreader)](docs/MyNotes%26Tasks%20Project%20Documentation.pdf)

- Complete project documentation including system architecture,
- workflows, UML diagrams, database design, security,
- Google Calendar integration, email reminders,
- implementation details, testing, deployment and application screenshots.

### 👨‍💻 Developer GitHub

[![Developer GitHub](https://img.shields.io/badge/Developer-Aluval-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/Aluval)

---

# 👨‍💻 Developer

**Aluvala Ediga Harsha Vardhan Goud**

[![GitHub](https://img.shields.io/badge/GitHub-Aluval-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/Aluval)

### 🌐 Portfolio

[![Portfolio](https://img.shields.io/badge/Portfolio-harsha24.online-0A66C2?style=for-the-badge&logo=googlechrome&logoColor=white)](https://harsha24.online/)


[![Google Search](https://img.shields.io/badge/Google-ALUVALA%20EDIGA%20HARSHA%20VARDHAN%20GOUD-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://www.google.com/search?q=ALUVALA+EDIGA+HARSHA+VARDHAN+GOUD)

---

# 📄 License

This project is developed as a personal software project.

Please follow the applicable project terms and attribution requirements when reusing or modifying the project.

---

# ⭐ MyNotes & Tasks

**Organize your thoughts.  
Complete your tasks.  
Stay on schedule.**
