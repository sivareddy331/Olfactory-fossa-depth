import os
import uuid
from flask import Blueprint, render_template, redirect, url_for, flash, request, send_from_directory, current_app
from flask_login import login_required, current_user
from werkzeug.utils import secure_filename
from models.models import db, Patient, Analysis
from ai import run_analysis_pipeline
from .pdf_generator import generate_pdf_report

analysis_bp = Blueprint('analysis', __name__)

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@analysis_bp.route('/upload', methods=['GET', 'POST'])
@login_required
def upload():
    # Fetch all patients under this doctor for the dropdown selector
    patients = Patient.query.filter_by(doctor_id=current_user.id).order_by(Patient.name.asc()).all()
    
    if request.method == 'POST':
        patient_id = request.form.get('patient_id')
        file = request.files.get('scan_file')
        
        if not patient_id:
            flash('Please select a patient.', 'danger')
            return redirect(request.url)
            
        if not file or file.filename == '':
            flash('No file selected.', 'danger')
            return redirect(request.url)
            
        if file and allowed_file(file.filename):
            # Safe filenames
            ext = file.filename.rsplit('.', 1)[1].lower()
            unique_prefix = str(uuid.uuid4())
            filename = f"orig_{unique_prefix}.{ext}"
            processed_filename = f"proc_{unique_prefix}.png" # Force output to PNG
            
            # Setup pathing
            upload_dir = current_app.config['UPLOAD_FOLDER']
            static_upload_dir = os.path.join(current_app.root_path, 'static', 'uploads')
            
            # Ensure upload folders exist
            os.makedirs(upload_dir, exist_ok=True)
            os.makedirs(static_upload_dir, exist_ok=True)
            
            # Original file saved in root upload folder
            orig_path = os.path.join(upload_dir, filename)
            file.save(orig_path)
            
            # Processed file path (saved in static folder so browser can view it)
            proc_path = os.path.join(static_upload_dir, processed_filename)
            
            try:
                # Run the complete AI pipeline
                results = run_analysis_pipeline(orig_path, proc_path)
                
                # Also copy original to static uploads for visual display
                static_orig_path = os.path.join(static_upload_dir, filename)
                import shutil
                shutil.copyfile(orig_path, static_orig_path)
                
                # Save results to DB
                new_analysis = Analysis(
                    patient_id=int(patient_id),
                    user_id=current_user.id,
                    original_image=static_orig_path,
                    processed_image=proc_path,
                    left_depth=results['left_depth'],
                    right_depth=results['right_depth'],
                    average_depth=results['average_depth'],
                    keros_type=results['keros_type'],
                    risk_level=results['risk_level'],
                    confidence_score=results['confidence_score']
                )
                
                db.session.add(new_analysis)
                db.session.commit()
                
                # Generate PDF report right away
                pdf_report_name = f"report_{unique_prefix}.pdf"
                pdf_report_path = os.path.join(current_app.config['REPORTS_FOLDER'], pdf_report_name)
                os.makedirs(current_app.config['REPORTS_FOLDER'], exist_ok=True)
                
                patient = Patient.query.get(int(patient_id))
                generate_pdf_report(pdf_report_path, current_user.full_name, patient, new_analysis)
                
                # Update database reference
                new_analysis.pdf_report = pdf_report_path
                db.session.commit()
                
                flash('Analysis completed successfully.', 'success')
                return redirect(url_for('analysis.view_analysis', id=new_analysis.id))
                
            except Exception as e:
                flash(f"Error executing AI pipeline: {str(e)}", 'danger')
                return redirect(request.url)
        else:
            flash('Invalid file format. Allowed: PNG, JPG, JPEG.', 'danger')
            return redirect(request.url)
            
    return render_template('upload.html', patients=patients)

@analysis_bp.route('/analysis/<int:id>')
@login_required
def view_analysis(id):
    analysis = Analysis.query.filter_by(id=id, user_id=current_user.id).first_or_404()
    patient = Patient.query.get(analysis.patient_id)
    
    # Get browser-accessible paths (relative to static)
    orig_relative = 'uploads/' + os.path.basename(analysis.original_image)
    proc_relative = 'uploads/' + os.path.basename(analysis.processed_image)
    
    # Explain risks depending on level
    from ai.risk import assess_surgical_risk
    _, explanation = assess_surgical_risk(analysis.keros_type, analysis.average_depth)
    
    return render_template(
        'analysis.html', 
        analysis=analysis, 
        patient=patient, 
        orig_relative=orig_relative, 
        proc_relative=proc_relative,
        explanation=explanation
    )

@analysis_bp.route('/report/download/<int:id>')
@login_required
def download_report(id):
    analysis = Analysis.query.filter_by(id=id, user_id=current_user.id).first_or_404()
    if not analysis.pdf_report or not os.path.exists(analysis.pdf_report):
        flash('PDF report file not found. Re-generating...', 'info')
        patient = Patient.query.get(analysis.patient_id)
        unique_prefix = str(uuid.uuid4())
        pdf_report_name = f"report_{unique_prefix}.pdf"
        pdf_report_path = os.path.join(current_app.config['REPORTS_FOLDER'], pdf_report_name)
        generate_pdf_report(pdf_report_path, current_user.full_name, patient, analysis)
        analysis.pdf_report = pdf_report_path
        db.session.commit()
        
    directory = os.path.dirname(analysis.pdf_report)
    filename = os.path.basename(analysis.pdf_report)
    return send_from_directory(directory, filename, as_attachment=True)

@analysis_bp.route('/reports')
@login_required
def reports_archive():
    reports_list = Analysis.query.filter_by(user_id=current_user.id).order_by(Analysis.date_created.desc()).all()
    return render_template('report.html', reports_list=reports_list)

