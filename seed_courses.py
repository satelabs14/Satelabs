from sqlalchemy.orm import sessionmaker
from app.database import engine
from app import models
import os
from dotenv import load_dotenv

load_dotenv()

SessionLocal = sessionmaker(bind=engine)
db = SessionLocal()

# Check if courses already exist
existing_courses = db.query(models.Course).count()
if existing_courses > 0:
    print("✓ Courses already exist, skipping seed data")
    db.close()
    exit()

# Create sample courses
courses_data = [
    {
        "title": "Introduction to Cybersecurity",
        "description": "Learn the fundamentals of cybersecurity, threats, and defense mechanisms.",
        "points": 100,
        "modules": [
            {"title": "Security Basics", "content": "Understand core security concepts", "points": 20},
            {"title": "Threat Landscape", "content": "Learn about different types of threats", "points": 25},
            {"title": "Defense Strategies", "content": "Explore defense mechanisms", "points": 25},
            {"title": "Best Practices", "content": "Master security best practices", "points": 30},
        ]
    },
    {
        "title": "Network Security",
        "description": "Master network security protocols and attack prevention.",
        "points": 120,
        "modules": [
            {"title": "Network Fundamentals", "content": "Network basics and architecture", "points": 25},
            {"title": "Firewalls & IDS/IPS", "content": "Firewall configurations and intrusion detection", "points": 30},
            {"title": "VPN & Encryption", "content": "Virtual networks and encryption protocols", "points": 30},
            {"title": "Network Monitoring", "content": "Monitor and analyze network traffic", "points": 35},
        ]
    },
    {
        "title": "Web Application Security",
        "description": "Secure web applications against common vulnerabilities.",
        "points": 110,
        "modules": [
            {"title": "OWASP Top 10", "content": "Learn about the top web vulnerabilities", "points": 25},
            {"title": "SQL Injection", "content": "Understand and prevent SQL injection attacks", "points": 25},
            {"title": "XSS & CSRF", "content": "Cross-site scripting and request forgery", "points": 30},
            {"title": "Authentication & Authorization", "content": "Secure user authentication systems", "points": 30},
        ]
    },
    {
        "title": "Cryptography Essentials",
        "description": "Understand encryption, hashing, and digital signatures.",
        "points": 130,
        "modules": [
            {"title": "Cryptography Basics", "content": "Introduction to cryptographic concepts", "points": 30},
            {"title": "Symmetric Encryption", "content": "Learn symmetric encryption algorithms", "points": 30},
            {"title": "Asymmetric Encryption", "content": "Public-key cryptography", "points": 35},
            {"title": "Digital Signatures", "content": "Authentication and integrity verification", "points": 35},
        ]
    },
]

for course_data in courses_data:
    course = models.Course(
        title=course_data["title"],
        description=course_data["description"],
        points=course_data["points"]
    )
    db.add(course)
    db.flush()
    
    for module_data in course_data["modules"]:
        module = models.Module(
            course_id=course.id,
            title=module_data["title"],
            content=module_data["content"],
            points=module_data["points"]
        )
        db.add(module)
    
    print(f"✓ Created course: {course_data['title']}")

db.commit()
print("\n✓ Seed data created successfully!")
db.close()
