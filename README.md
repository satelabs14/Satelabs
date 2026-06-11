# 🚀 Satelabs

**Learn. Practice. Secure.**

Satelabs is a Cyber Security Learning Platform built using FastAPI and PostgreSQL. The platform helps users learn cyber security concepts, complete hands-on labs, track progress, and earn points.

---

## Features

### Authentication

* User Registration
* User Login
* JWT Authentication
* Protected Routes

### User Dashboard

* Profile Information
* Courses Completed
* Labs Completed
* Points Tracking

### Admin Features

* Role-Based Access Control
* Admin User Management

### Courses

* Create Courses
* View Courses
* Course Completion Tracking

### Labs

* Create Labs
* View Labs
* Lab Completion Tracking

### Gamification

* Points System
* Progress Tracking

---

## Technology Stack

### Backend

* FastAPI
* SQLAlchemy
* PostgreSQL
* JWT Authentication
* Passlib (bcrypt)

### Development Tools

* Python
* Uvicorn
* Git
* GitHub

---

## Project Structure

```text
Satelabs/
│
├── app/
│   ├── routers/
│   │   ├── auth.py
│   │   ├── admin.py
│   │   ├── dashboard.py
│   │   ├── courses.py
│   │   └── labs.py
│   │
│   ├── database.py
│   ├── dependencies.py
│   ├── models.py
│   ├── schemas.py
│   ├── utils.py
│   └── main.py
│
├── .env
├── requirements.txt
└── README.md
```

---

## Current Progress

### Completed

* Authentication System
* JWT Authorization
* Dashboard API
* Admin Module
* Courses Module
* Labs Module
* Points System
* Progress Tracking

### Upcoming Features

* Leaderboard
* Quiz System
* Certificates
* CTF Challenges
* React Frontend
* OWASP Top 10 Learning Path
* Security Labs
* User Achievements

---

## API Documentation

After starting the server:

```bash
uvicorn app.main:app --reload
```

Swagger UI:

```text
http://127.0.0.1:8000/docs
```

---

## Vision

Satelabs aims to become a practical cyber security learning platform where users can:

* Learn cyber security concepts
* Practice through hands-on labs
* Complete quizzes
* Earn certificates
* Participate in Capture The Flag (CTF) challenges
* Build real-world security skills

---

Built with ❤️ by Sateesh
