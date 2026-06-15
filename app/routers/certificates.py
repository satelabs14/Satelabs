from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import uuid

from app import models, schemas
from app.dependencies import get_db, get_current_user

router = APIRouter(
    prefix="/certificates",
    tags=["Certificates"]
)


@router.post("/generate/{course_id}")
def generate_certificate(
    course_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    course = db.query(models.Course).filter(
        models.Course.id == course_id
    ).first()

    if not course:
        raise HTTPException(
            status_code=404,
            detail="Course not found"
        )

    existing_certificate = db.query(
        models.Certificate
    ).filter(
        models.Certificate.user_id == current_user.id,
        models.Certificate.course_id == course_id
    ).first()

    if existing_certificate:
        return {
            "message": "Certificate already exists",
            "certificate_code": existing_certificate.certificate_code
        }

    code = str(uuid.uuid4())[:8].upper()

    certificate = models.Certificate(
        user_id=current_user.id,
        course_id=course_id,
        certificate_code=code
    )

    db.add(certificate)
    db.commit()
    db.refresh(certificate)

    return {
        "message": "Certificate generated successfully",
        "certificate_code": code
    }


@router.get(
    "/my-certificates",
    response_model=list[schemas.CertificateOut]
)
def my_certificates(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    certificates = db.query(
        models.Certificate
    ).filter(
        models.Certificate.user_id == current_user.id
    ).all()

    return certificates


@router.get(
    "/{certificate_id}",
    response_model=schemas.CertificateOut
)
def get_certificate(
    certificate_id: int,
    db: Session = Depends(get_db)
):

    certificate = db.query(
        models.Certificate
    ).filter(
        models.Certificate.id == certificate_id
    ).first()

    if not certificate:
        raise HTTPException(
            status_code=404,
            detail="Certificate not found"
        )

    return certificate


@router.get("/verify/{certificate_code}")
def verify_certificate(
    certificate_code: str,
    db: Session = Depends(get_db)
):

    certificate = db.query(
        models.Certificate
    ).filter(
        models.Certificate.certificate_code == certificate_code
    ).first()

    if not certificate:
        raise HTTPException(
            status_code=404,
            detail="Invalid certificate"
        )

    user = db.query(models.User).filter(
        models.User.id == certificate.user_id
    ).first()

    course = db.query(models.Course).filter(
        models.Course.id == certificate.course_id
    ).first()

    return {
        "valid": True,
        "certificate_code": certificate.certificate_code,
        "student": user.username,
        "course": course.title,
        "issued_at": certificate.issued_at
    }