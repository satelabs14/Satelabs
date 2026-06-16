from reportlab.lib.pagesizes import landscape
from reportlab.pdfgen import canvas
from reportlab.lib.colors import Color

def format_issue_date(date_obj):
    if not date_obj:
        return ""
    if hasattr(date_obj, 'strftime'):
        return date_obj.strftime("%B %d, %Y")
    return str(date_obj)

def truncate_text(text, max_length):
    if len(text) > max_length:
        return text[:max_length-3] + "..."
    return text

def draw_spaced_text(pdf, text, x, y, char_space=2):
    current_x = x
    for char in text:
        pdf.drawString(current_x, y, char)
        current_x += pdf.stringWidth(char, pdf._fontname, pdf._fontsize) + char_space

def draw_divider(pdf, x1, y1, x2, y2):
    pdf.setLineWidth(1)
    pdf.line(x1, y1, x2, y2)

def draw_brand_emblem(pdf, x, y):
    pdf.circle(x, y, 20)
    pdf.setFont("Helvetica-Bold", 14)
    pdf.drawString(x - 9, y - 4, "SL")

def build_certificate_pdf(file_path, user, course, certificate):
    pdf = canvas.Canvas(file_path, pagesize=landscape((842, 595)))
    width = 842
    height = 595

    # Watermark
    pdf.saveState()
    pdf.setFont("Helvetica-Bold", 120)
    pdf.setFillColor(Color(0.9, 0.9, 0.9, alpha=0.3))
    pdf.translate(width/2, height/2 - 50)
    pdf.rotate(30)
    pdf.drawCentredString(0, 0, "SATELABS")
    pdf.restoreState()

    # Double Border
    pdf.setLineWidth(3)
    pdf.rect(20, 20, width - 40, height - 40)
    pdf.setLineWidth(1)
    pdf.rect(26, 26, width - 52, height - 52)

    # Header
    pdf.setFont("Helvetica-Bold", 30)
    pdf.drawCentredString(width / 2, 520, "SATELABS CYBERSECURITY ACADEMY")

    pdf.setFont("Helvetica", 20)
    pdf.drawCentredString(width / 2, 480, "CERTIFICATE OF ACHIEVEMENT")

    # Body
    pdf.setFont("Helvetica", 16)
    pdf.drawCentredString(width / 2, 410, "This certificate is proudly presented to")

    pdf.setFont("Helvetica-Bold", 28)
    pdf.drawCentredString(width / 2, 360, user.username)

    pdf.setFont("Helvetica", 16)
    pdf.drawCentredString(width / 2, 315, "for successfully completing the course")

    pdf.setFont("Helvetica-Bold", 22)
    pdf.drawCentredString(width / 2, 275, course.title)

    # Details
    pdf.setFont("Helvetica", 12)
    issued_date_str = format_issue_date(certificate.issued_at)

    pdf.drawString(80, 150, f"Certificate Code: {certificate.certificate_code}")
    pdf.drawString(80, 125, f"Issued Date: {issued_date_str}")
    pdf.drawString(80, 100, f"Student: {user.username}")
    pdf.drawString(80, 75, f"Course: {truncate_text(course.title, 50)}")

    # Verification URL
    pdf.drawString(80, 50, f"Verify at: https://satelabs.com/verify/{certificate.certificate_code}")

    # Signature Area
    draw_divider(pdf, width - 250, 120, width - 80, 120)
    pdf.drawCentredString(width - 165, 105, "Authorized Signature")
    draw_brand_emblem(pdf, width - 165, 155)

    # Footer branding
    pdf.setFont("Helvetica-Bold", 14)
    pdf.drawRightString(width - 80, 75, "SateLabs Official Certification")

    pdf.save()