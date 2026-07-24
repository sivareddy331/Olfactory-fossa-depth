import os
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from datetime import datetime

def generate_pdf_report(pdf_path, doctor_name, patient, analysis):
    """
    Generate a professional medical PDF report for the Olfactory Fossa scan.
    """
    doc = SimpleDocTemplate(
        pdf_path,
        pagesize=letter,
        rightMargin=40,
        leftMargin=40,
        topMargin=40,
        bottomMargin=40
    )
    
    story = []
    styles = getSampleStyleSheet()
    
    # Custom Styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=22,
        textColor=colors.HexColor('#1e3d59'),
        spaceAfter=15,
        alignment=1 # Centered
    )
    
    section_heading = ParagraphStyle(
        'SecHeading',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=14,
        textColor=colors.HexColor('#17a2b8'),
        spaceBefore=10,
        spaceAfter=10
    )
    
    body_style = ParagraphStyle(
        'BodyTextCustom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#333333')
    )
    
    bold_body = ParagraphStyle(
        'BoldBody',
        parent=body_style,
        fontName='Helvetica-Bold'
    )

    # 1. Header (Hospital Name / Title)
    story.append(Paragraph("METROPOLITAN RADIOLOGY & IMAGING CENTER", title_style))
    story.append(Paragraph("<b>Department of Rhinology & Skull Base Surgery</b>", ParagraphStyle('Sub', parent=title_style, fontSize=11, spaceAfter=20)))
    
    # 2. Divider Line
    d_line = Table([[""]], colWidths=[532])
    d_line.setStyle(TableStyle([
        ('LINEABOVE', (0,0), (-1,-1), 1.5, colors.HexColor('#1e3d59')),
        ('BOTTOMPADDING', (0,0), (-1,-1), 0),
        ('TOPPADDING', (0,0), (-1,-1), 0),
    ]))
    story.append(d_line)
    story.append(Spacer(1, 15))
    
    # 3. Patient & Doctor Info Table
    info_data = [
        [
            Paragraph("<b>Patient Name:</b>", body_style), Paragraph(patient.name, body_style),
            Paragraph("<b>Date of Analysis:</b>", body_style), Paragraph(analysis.date_created.strftime("%Y-%m-%d %H:%M"), body_style)
        ],
        [
            Paragraph("<b>Patient ID:</b>", body_style), Paragraph(patient.patient_uuid, body_style),
            Paragraph("<b>Referring Doctor:</b>", body_style), Paragraph(doctor_name, body_style)
        ],
        [
            Paragraph("<b>Age / Gender:</b>", body_style), Paragraph(f"{patient.age} years / {patient.gender}", body_style),
            Paragraph("<b>Clinical Notes:</b>", body_style), Paragraph(patient.clinical_notes or "N/A", body_style)
        ]
    ]
    info_table = Table(info_data, colWidths=[100, 166, 120, 146])
    info_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(info_table)
    story.append(Spacer(1, 15))
    story.append(d_line)
    story.append(Spacer(1, 15))
    
    # 4. Images Section (Original vs Processed/Annotated)
    story.append(Paragraph("<b>CT Scan Analysis & Measurement Overlays</b>", section_heading))
    
    img_width = 240
    img_height = 240
    
    # Ensure images exist
    orig_img_flowable = Paragraph("Original Scan Missing", body_style)
    proc_img_flowable = Paragraph("Processed Scan Missing", body_style)
    
    if os.path.exists(analysis.original_image):
        orig_img_flowable = Image(analysis.original_image, width=img_width, height=img_height)
    if os.path.exists(analysis.processed_image):
        proc_img_flowable = Image(analysis.processed_image, width=img_width, height=img_height)
        
    image_table_data = [
        [Paragraph("<b>Original CT Image</b>", bold_body), Paragraph("<b>Annotated AI Measurements</b>", bold_body)],
        [orig_img_flowable, proc_img_flowable]
    ]
    image_table = Table(image_table_data, colWidths=[266, 266])
    image_table.setStyle(TableStyle([
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('BOTTOMPADDING', (0,0), (-1,0), 6),
        ('BOTTOMPADDING', (0,1), (-1,-1), 10),
    ]))
    story.append(image_table)
    story.append(Spacer(1, 15))
    
    # 5. Diagnostic Findings
    story.append(Paragraph("<b>Quantitative Measurement & Risk Evaluation</b>", section_heading))
    
    findings_data = [
        [Paragraph("<b>Parameter</b>", bold_body), Paragraph("<b>Value / Class</b>", bold_body), Paragraph("<b>Clinical Range / Reference</b>", bold_body)],
        [Paragraph("Left Fossa Depth", body_style), Paragraph(f"{analysis.left_depth} mm", body_style), Paragraph("Keros I: 1-3mm | II: 4-7mm | III: 8-16mm", body_style)],
        [Paragraph("Right Fossa Depth", body_style), Paragraph(f"{analysis.right_depth} mm", body_style), Paragraph("Keros I: 1-3mm | II: 4-7mm | III: 8-16mm", body_style)],
        [Paragraph("Average Fossa Depth", body_style), Paragraph(f"{analysis.average_depth} mm", body_style), Paragraph("-", body_style)],
        [Paragraph("Keros Classification", body_style), Paragraph(f"<b>{analysis.keros_type}</b>", bold_body), Paragraph(f"Confidence Level: {analysis.confidence_score}%", body_style)],
        [Paragraph("Surgical Vulnerability", body_style), Paragraph(f"<b>{analysis.risk_level}</b>", bold_body), Paragraph("Based on lateral lamella vertical height", body_style)]
    ]
    
    findings_table = Table(findings_data, colWidths=[150, 150, 232])
    findings_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#f8f9fa')),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#dddddd')),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('TOPPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(findings_table)
    story.append(Spacer(1, 15))
    
    # Risk Explanation Box
    risk_color = '#d4edda' if analysis.risk_level == 'Low Risk' else ('#fff3cd' if analysis.risk_level == 'Moderate Risk' else '#f8d7da')
    risk_text_color = '#155724' if analysis.risk_level == 'Low Risk' else ('#856404' if analysis.risk_level == 'Moderate Risk' else '#721c24')
    
    risk_card_data = [[
        Paragraph(f"<b>Diagnostic Impression & Risks:</b><br/>{analysis.risk_level} — {analysis.risk_level == 'Low Risk' and 'Anatomically stable. Minimal risk of perforation.' or (analysis.risk_level == 'Moderate Risk' and 'Moderate lateral lamella vulnerability. Caution recommended.' or 'Highly fragile cribriform-fovea junction. Increased hazard of CSF leaks during endoscopic manipulations.')}", ParagraphStyle('RiskText', parent=body_style, textColor=colors.HexColor(risk_text_color)))
    ]]
    risk_table = Table(risk_card_data, colWidths=[532])
    risk_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor(risk_color)),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor(risk_text_color)),
        ('TOPPADDING', (0,0), (-1,-1), 10),
        ('BOTTOMPADDING', (0,0), (-1,-1), 10),
        ('LEFTPADDING', (0,0), (-1,-1), 10),
        ('RIGHTPADDING', (0,0), (-1,-1), 10),
    ]))
    story.append(risk_table)
    story.append(Spacer(1, 40))
    
    # 6. Sign-off Footer
    sig_data = [
        [Paragraph("", body_style), Paragraph("___________________________", ParagraphStyle('RightText', parent=body_style, alignment=2))],
        [Paragraph("", body_style), Paragraph(f"Dr. {doctor_name}<br/>Reporting Radiologist", ParagraphStyle('RightTextSub', parent=body_style, alignment=2))]
    ]
    sig_table = Table(sig_data, colWidths=[266, 266])
    story.append(sig_table)

    doc.build(story)
