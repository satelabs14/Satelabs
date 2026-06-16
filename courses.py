from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy.orm import joinedload
from typing import List
import io
import os
from app.database import get_db
from app import models, schemas
from app.dependencies import get_current_user, get_db
from app.utils import calculate_rank, generate_certificate_code

try:
    from reportlab.pdfgen import canvas  # type: ignore[import]
    from reportlab.lib.pagesizes import letter, landscape  # type: ignore[import]
    from reportlab.lib.utils import ImageReader  # type: ignore[import]
    HAS_REPORTLAB = True
except ImportError:
    HAS_REPORTLAB = False

try:
    import qrcode  # type: ignore[import]
    HAS_QRCODE = True
except ImportError:
    HAS_QRCODE = False

router = APIRouter(prefix="/api/courses", tags=["Courses"])

@router.get("/debug", tags=["Debug"])
def debug_courses(db: Session = Depends(get_db)):
    courses = db.query(models.Course).all()
    return {
        "count": len(courses),
        "titles": [getattr(course, "title", "Unknown") for course in courses]
    }

@router.get("", response_model=List[schemas.CourseWithProgress])
@router.get("/", response_model=List[schemas.CourseWithProgress], include_in_schema=False)
def get_courses(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    # Optimized query to fetch courses and their modules
    courses = db.query(models.Course).options(joinedload(models.Course.modules)).all()

    # Pre-fetch all progress for the current user to avoid N+1 queries
    user_module_progress = {
        p.module_id: p for p in db.query(models.ModuleProgress).filter_by(user_id=current_user.id).all()
    }
    user_course_progress = {
        p.course_id: p for p in db.query(models.UserProgress).filter_by(user_id=current_user.id).all()
    }

    result = []
    for course in courses:
        total_modules = len(course.modules)
        completed_modules = 0
        modules_data = []

        for mod in course.modules:
            is_completed = user_module_progress.get(mod.id) is not None and user_module_progress[mod.id].completed
            if is_completed:
                completed_modules += 1

            modules_data.append(schemas.ModuleOut(
                id=mod.id,
                course_id=mod.course_id,
                title=mod.title,
                content=mod.content,
                points=mod.points,
                completed=is_completed
            ))

        progress_percentage = (completed_modules / total_modules * 100) if total_modules > 0 else 0

        result.append(schemas.CourseWithProgress(
            id=course.id,
            title=course.title,
            description=course.description,
            points=course.points,
            total_modules=total_modules,
            completed_modules=completed_modules,
            progress_percentage=int(progress_percentage),
            modules=modules_data,
            is_enrolled=course.id in user_course_progress
        ))

    return result

@router.get("/{course_id}", response_model=schemas.CourseWithProgress)
def get_course_detail(course_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    course = db.query(models.Course).options(joinedload(models.Course.modules)).filter(models.Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    # Pre-fetch progress
    user_module_progress = {
        p.module_id: p for p in db.query(models.ModuleProgress).filter_by(user_id=current_user.id).all()
    }
    user_course_progress = db.query(models.UserProgress).filter_by(user_id=current_user.id, course_id=course_id).first()

    total_modules = len(course.modules)
    completed_modules = 0
    modules_data = []

    for mod in course.modules:
        is_completed = user_module_progress.get(mod.id) is not None and user_module_progress[mod.id].completed
        if is_completed:
            completed_modules += 1

        modules_data.append(schemas.ModuleOut(
            id=mod.id,
            course_id=mod.course_id,
            title=mod.title,
            content=mod.content,
            points=mod.points,
            completed=is_completed
        ))

    progress_percentage = (completed_modules / total_modules * 100) if total_modules > 0 else 0

    return schemas.CourseWithProgress(
        id=course.id,
        title=course.title,
        description=course.description,
        points=course.points,
        total_modules=total_modules,
        completed_modules=completed_modules,
        progress_percentage=int(progress_percentage),
        modules=modules_data,
        is_enrolled=user_course_progress is not None
    )

@router.post("/{course_id}/enroll")
def enroll_in_course(course_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    existing = db.query(models.UserProgress).filter_by(user_id=current_user.id, course_id=course_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Already enrolled")

    enrollment = models.UserProgress(user_id=current_user.id, course_id=course_id, completed=False, progress_percentage=0)
    db.add(enrollment)

    # Activity Logging
    course = db.query(models.Course).filter_by(id=course_id).first()
    if course:
        activity = models.Activity(
            user_id=current_user.id,
            activity_type="COURSE_ENROLL",
            message=f"Enrolled in course: {course.title}",
            related_id=course.id
        )
        db.add(activity)

    db.commit()
    return {"message": "Successfully enrolled in course", "course_id": course_id}

@router.post("/modules/{module_id}/complete", response_model=schemas.ModuleCompletionResponse)
def complete_module(module_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    module = db.query(models.Module).filter(models.Module.id == module_id).first()
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")
        
    # Auto-enroll if progress doesn't exist to prevent blocking completions
    user_progress = db.query(models.UserProgress).filter_by(user_id=current_user.id, course_id=module.course_id).first()
    if not user_progress:
        user_progress = models.UserProgress(user_id=current_user.id, course_id=module.course_id, completed=False, progress_percentage=0)
        db.add(user_progress)
        db.flush()
        
    progress = db.query(models.ModuleProgress).filter_by(user_id=current_user.id, module_id=module_id).first()
    
    if progress and progress.completed:
        raise HTTPException(status_code=400, detail="Module already completed")
        
    if not progress:
        progress = models.ModuleProgress(user_id=current_user.id, module_id=module_id, completed=True)
        db.add(progress)
    else:
        progress.completed = True
        
    db.flush()
        
    # Award Points
    points_earned = module.points  # Points earned from completing this module
    current_user.points += points_earned
    current_user.rank = calculate_rank(current_user.points)

    # Activity Logging
    activity = models.Activity(
        user_id=current_user.id,
        activity_type="MODULE_COMPLETE",
        message=f"Completed module: {module.title} (Earned {points_earned} Points)",
        related_id=module.id
    )
    db.add(activity)

    # Check Course Completion
    course_modules = db.query(models.Module.id).filter_by(course_id=module.course_id).all()
    total_modules = len(course_modules)
    course_module_ids = [m.id for m in course_modules]
    
    completed_modules = db.query(models.ModuleProgress).filter(
        models.ModuleProgress.user_id == current_user.id,
        models.ModuleProgress.module_id.in_(course_module_ids),
        models.ModuleProgress.completed == True
    ).count()
    
    course_completed = False
    if total_modules > 0:
        progress_percentage = int((completed_modules / total_modules) * 100)
        user_progress.progress_percentage = progress_percentage
        
        if completed_modules >= total_modules:
            user_progress.completed = True
            course_completed = True
            
            # Award Certificate
            existing_cert = db.query(models.Certificate).filter_by(user_id=current_user.id, course_id=module.course_id).first()
            if not existing_cert:
                cert_code = generate_certificate_code(current_user.id, module.course_id)
                cert = models.Certificate(user_id=current_user.id, course_id=module.course_id, certificate_code=cert_code)
                db.add(cert)
                current_user.courses_completed += 1

                # Certificate Activity Logging
                cert_activity = models.Activity(
                    user_id=current_user.id,
                    activity_type="CERTIFICATE_EARNED",
                    message=f"Earned certificate for: {module.course.title}",
                    related_id=module.course_id
                )
                db.add(cert_activity)
        
    db.commit()
    db.refresh(current_user)
    
    return schemas.ModuleCompletionResponse(
        message="Module completed successfully",
        points_earned=points_earned,
        new_points_total=current_user.points,
        new_rank=current_user.rank,
        progress_percentage=user_progress.progress_percentage if user_progress else 0
    )

@router.get("/certificates/{certificate_code}/download")
def download_certificate(certificate_code: str, db: Session = Depends(get_db)):
    cert = db.query(models.Certificate).filter_by(certificate_code=certificate_code).first()
    if not cert:
        raise HTTPException(status_code=404, detail="Certificate not found")
    
    user = db.query(models.User).filter_by(id=cert.user_id).first()
    course = db.query(models.Course).filter_by(id=cert.course_id).first()
    
    if not HAS_REPORTLAB:
        raise HTTPException(
            status_code=501, 
            detail="ReportLab is not installed. PDF generation requires 'pip install reportlab'."
        )
        
    buffer = io.BytesIO()
    
    # Landscape letter format for premium credential feel
    c = canvas.Canvas(buffer, pagesize=landscape(letter))
    width, height = landscape(letter)
    
    # 1. Dark Cyber Theme Background
    c.setFillColorRGB(15/255.0, 23/255.0, 42/255.0) # #0f172a
    c.rect(0, 0, width, height, fill=1, stroke=0)
    
    # 2. Cyber-style Border
    c.setStrokeColorRGB(6/255.0, 182/255.0, 212/255.0) # #06b6d4
    c.setLineWidth(2)
    c.rect(30, 30, width - 60, height - 60)
    c.setLineWidth(0.5)
    c.rect(35, 35, width - 70, height - 70)
    
    # 3. Corner Brackets (Security Theme)
    length = 40
    c.setLineWidth(4)
    # Top-Left
    c.line(20, height - 20, 20 + length, height - 20)
    c.line(20, height - 20, 20, height - 20 - length)
    # Top-Right
    c.line(width - 20, height - 20, width - 20 - length, height - 20)
    c.line(width - 20, height - 20, width - 20, height - 20 - length)
    # Bottom-Left
    c.line(20, 20, 20 + length, 20)
    c.line(20, 20, 20, 20 + length)
    # Bottom-Right
    c.line(width - 20, 20, width - 20 - length, 20)
    c.line(width - 20, 20, width - 20, 20 + length)

    # 4. Logo Positioning
    logo_path = os.path.join("public", "logo.png")
    start_y = height - 120
    if os.path.exists(logo_path):
        c.drawImage(logo_path, width/2 - 40, start_y, width=80, height=80, mask='auto', preserveAspectRatio=True)
        start_y -= 40
        
    # 5. Title
    c.setFont("Helvetica-Bold", 32)
    c.setFillColorRGB(1.0, 1.0, 1.0)
    c.drawCentredString(width/2, start_y - 20, "CERTIFICATE OF COMPLETION")
    
    c.setFont("Helvetica", 12)
    c.setFillColorRGB(148/255.0, 163/255.0, 184/255.0) # #94a3b8
    c.drawCentredString(width/2, start_y - 60, "THIS CERTIFIES THAT")
    
    # 6. Recipient
    c.setFont("Helvetica-Bold", 36)
    c.setFillColorRGB(6/255.0, 182/255.0, 212/255.0) # #06b6d4
    student_name = user.username.upper() if user else "STUDENT"
    c.drawCentredString(width/2, start_y - 110, student_name)
    
    c.setFont("Helvetica", 12)
    c.setFillColorRGB(148/255.0, 163/255.0, 184/255.0)
    c.drawCentredString(width/2, start_y - 150, "HAS SUCCESSFULLY COMPLETED THE REQUIREMENTS FOR")
    
    # 7. Course Title
    c.setFont("Helvetica-Bold", 24)
    c.setFillColorRGB(1.0, 1.0, 1.0)
    course_title = course.title.upper() if course else "COURSE"
    c.drawCentredString(width/2, start_y - 190, course_title)
    
    # 8. Progression / Rank / Stats
    c.setFont("Helvetica", 12)
    c.setFillColorRGB(226/255.0, 232/255.0, 240/255.0) # #e2e8f0
    rank_str = user.rank if user and user.rank else "UNRANKED"
    points_str = str(user.points) if user and user.points else "0"
    c.drawCentredString(width/2, start_y - 230, f"RANK ACHIEVED: {rank_str.upper()}   |   TOTAL POINTS: {points_str}")
    
    # Subtle Separator
    c.setStrokeColorRGB(148/255.0, 163/255.0, 184/255.0, alpha=0.3)
    c.setLineWidth(1)
    c.line(width/2 - 200, start_y - 260, width/2 + 200, start_y - 260)
    
    # 9. Verification Details & Signatures
    c.setFont("Helvetica", 10)
    c.setFillColorRGB(148/255.0, 163/255.0, 184/255.0)
    issue_date = cert.issued_at.strftime('%B %d, %Y')
    verify_url = f"https://satelabs.com/verify/{certificate_code}"
    
    c.drawString(70, 110, f"ISSUED ON: {issue_date.upper()}")
    c.drawString(70, 90, f"CERTIFICATE CODE: {certificate_code}")
    c.drawString(70, 70, f"VERIFY AT: {verify_url.upper()}")
    
    # 10. Official Security Seal Text
    c.setFont("Helvetica-Bold", 12)
    c.setFillColorRGB(6/255.0, 182/255.0, 212/255.0)
    c.drawRightString(width - 70, 110, "SATELABS OFFICIAL CREDENTIAL")
    
    # 11. Optional QR Code Generation
    if HAS_QRCODE:
        try:
            qr = qrcode.QRCode(
                version=1,
                error_correction=qrcode.constants.ERROR_CORRECT_L,
                box_size=10,
                border=1,
            )
            qr.add_data(verify_url)
            qr.make(fit=True)
            
            img = qr.make_image(fill_color="black", back_color="white")
            img_buffer = io.BytesIO()
            img.save(img_buffer, format="PNG")
            img_buffer.seek(0)
            
            c.drawImage(ImageReader(img_buffer), width - 140, 45, width=60, height=60)
        except Exception:
            pass # Fallback elegantly if generation fails
            
    c.save()
    buffer.seek(0)
    
    return StreamingResponse(
        buffer, 
        media_type="application/pdf", 
        headers={"Content-Disposition": f"attachment; filename=SateLabs_Certificate_{certificate_code}.pdf"}
    )