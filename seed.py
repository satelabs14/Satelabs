from sqlalchemy.orm import Session
from app.database import engine, SessionLocal, Base
from .models import Course, Module, Topic
from app.database import engine, SessionLocal, Base
from models import Course, Module, Topic

Base.metadata.create_all(bind=engine)

def seed_courses():
    db = SessionLocal()
    
    if db.query(Course).count() > 0:
        print("Database already seeded.")
        return

    courses_data = [
        {
            "title": "Cyber Security Foundation",
            "description": "Establish a strong foundational knowledge of modern cybersecurity principles, threats, and defensive strategies.",
            "level": "Initiate",
            "points": 500,
            "modules": [
                {"title": "Introduction to InfoSec", "topics": ["CIA Triad", "Threat Actors", "Basic Terminology"]},
                {"title": "Networking Basics", "topics": ["OSI Model", "TCP/IP Suite", "Common Ports"]},
                {"title": "Basic Cryptography", "topics": ["Symmetric vs Asymmetric", "Hashing", "PKI Fundamentals"]}
            ]
        },
        {
            "title": "Ethical Hacking Associate",
            "description": "Learn the methodology of ethical hacking, scanning, enumeration, and basic exploitation techniques.",
            "level": "Explorer",
            "points": 800,
            "modules": [
                {"title": "Reconnaissance & Footprinting", "topics": ["OSINT", "DNS Enumeration", "Search Engine Dorks"]},
                {"title": "Scanning Networks", "topics": ["Nmap Mastery", "Vulnerability Scanning", "Network Mapping"]},
                {"title": "System Hacking Phase 1", "topics": ["Password Cracking", "Privilege Escalation Basics", "Covering Tracks"]}
            ]
        },
        {
            "title": "Cyber Security Professional Level 1",
            "description": "Advanced defensive techniques, incident response fundamentals, and robust network architecture.",
            "level": "Operator",
            "points": 1200,
            "modules": [
                {"title": "Security Architecture", "topics": ["Zero Trust", "Firewall Configurations", "IDS/IPS"]},
                {"title": "Incident Response (IR)", "topics": ["IR Lifecycle", "Digital Forensics Basics", "Chain of Custody"]},
                {"title": "Identity & Access Management", "topics": ["OAuth/SAML", "MFA Implementation", "Active Directory Security"]}
            ]
        },
        {
            "title": "Cyber Security Professional Level 2",
            "description": "Expert-level penetration testing, advanced forensics, and enterprise security management.",
            "level": "Sentinel",
            "points": 2000,
            "modules": [
                {"title": "Advanced Exploitation", "topics": ["Buffer Overflows", "Return Oriented Programming", "Custom Payloads"]},
                {"title": "Web Application Security", "topics": ["OWASP Top 10 Deep Dive", "SQLi & XSS", "API Security Testing"]},
                {"title": "Malware Analysis", "topics": ["Static Analysis", "Dynamic Analysis", "Reverse Engineering basics"]}
            ]
        },
        {
            "title": "Artificial Intelligence for Cyber Security",
            "description": "Leverage machine learning models to detect anomalies, automate responses, and combat AI-driven threats.",
            "level": "Vanguard",
            "points": 1500,
            "modules": [
                {"title": "AI in Threat Detection", "topics": ["Anomaly Detection Algorithms", "Log Analysis with ML", "Behavioral Analytics"]},
                {"title": "Offensive AI", "topics": ["Deepfakes in Social Engineering", "Automated Fuzzing", "Adversarial Machine Learning"]},
                {"title": "Automated IR", "topics": ["SOAR Platforms", "LLMs for Security Analysts", "Playbook Automation"]}
            ]
        }
    ]

    for c_data in courses_data:
        course = Course(
            title=c_data["title"],
            description=c_data["description"],
            level=c_data["level"],
            points=c_data["points"],
            image_url="/assets/course-placeholder.jpg"
        )
        db.add(course)
        db.commit()
        db.refresh(course)
        
        for m_idx, m_data in enumerate(c_data["modules"]):
            module = Module(
                course_id=course.id,
                title=m_data["title"],
                description=f"Learn about {m_data['title']}",
                order=m_idx + 1,
                points=150
            )
            db.add(module)
            db.commit()
            db.refresh(module)
            
            for t_idx, t_name in enumerate(m_data["topics"]):
                topic = Topic(
                    module_id=module.id,
                    title=t_name,
                    content=f"Content for {t_name} from the SateLabs PDF.",
                    order=t_idx + 1
                )
                db.add(topic)
            db.commit()
            
    print("SateLabs Course System Seeded Successfully!")
    db.close()

if __name__ == "__main__":
    seed_courses()
