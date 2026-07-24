from flask import Blueprint, render_template, redirect, url_for, flash, request
from flask_login import login_required, current_user
from models.models import db, Patient, Analysis
import uuid

patient_bp = Blueprint('patient', __name__)

@patient_bp.route('/patients')
@login_required
def list_patients():
    search_query = request.args.get('search', '').strip()
    if search_query:
        patients = Patient.query.filter(
            Patient.doctor_id == current_user.id,
            (Patient.first_name.like(f"%{search_query}%")) | (Patient.last_name.like(f"%{search_query}%")) | (Patient.id.cast(db.String).like(f"%{search_query}%"))
        ).all()
    else:
        patients = Patient.query.filter_by(doctor_id=current_user.id).all()
    return render_template('patient.html', patients=patients, search_query=search_query)

@patient_bp.route('/patient/add', methods=['POST'])
@login_required
def add_patient():
    first_name = request.form.get('first_name', '').strip()
    last_name = request.form.get('last_name', '').strip()
    age_str = request.form.get('age', '').strip()
    gender = request.form.get('gender', '').strip()
    clinical_notes = request.form.get('clinical_notes', '').strip()
    
    # 1. Validation
    if not first_name or not age_str or not gender:
        flash('Please fill in all required patient details (First Name, Age, and Gender).', 'danger')
        return redirect(url_for('patient.list_patients'))
        
    try:
        age = int(age_str)
        if age <= 0 or age > 120:
            raise ValueError()
    except ValueError:
        flash('Please provide a valid age between 1 and 120.', 'danger')
        return redirect(url_for('patient.list_patients'))
        
    if gender not in ['Male', 'Female', 'Other']:
        flash('Please select a valid gender option.', 'danger')
        return redirect(url_for('patient.list_patients'))
    
    # name splitting not needed – first_name and last_name are collected directly from the form
    
    new_patient = Patient(
        first_name=first_name,
        last_name=last_name,
        age=age,
        gender=gender,
        medical_history=clinical_notes,
        doctor_id=current_user.id
    )
    
    db.session.add(new_patient)
    db.session.commit()
    flash('Patient profile created successfully. Proceeding to scan upload.', 'success')
    # Move directly to the upload page with the new patient pre-selected
    return redirect(url_for('analysis.upload', patient_id=new_patient.id))

@patient_bp.route('/patient/edit/<int:id>', methods=['POST'])
@login_required
def edit_patient(id):
    patient = Patient.query.filter_by(id=id, doctor_id=current_user.id).first_or_404()
    patient.first_name = request.form.get('first_name', '').strip()
    patient.last_name = request.form.get('last_name', '').strip()
    patient.age = int(request.form.get('age'))
    patient.gender = request.form.get('gender')
    patient.medical_history = request.form.get('clinical_notes')
    
    db.session.commit()
    flash('Patient profile updated successfully.', 'success')
    return redirect(url_for('patient.view_patient', id=id))

@patient_bp.route('/patient/delete/<int:id>', methods=['POST', 'GET'])
@login_required
def delete_patient(id):
    patient = Patient.query.filter_by(id=id, doctor_id=current_user.id).first_or_404()
    db.session.delete(patient)
    db.session.commit()
    flash('Patient profile deleted successfully.', 'success')
    return redirect(url_for('patient.list_patients'))

@patient_bp.route('/patient/<int:id>')
@login_required
def view_patient(id):
    patient = Patient.query.filter_by(id=id, doctor_id=current_user.id).first_or_404()
    analyses = Analysis.query.filter_by(patient_id=patient.id).order_by(Analysis.date_created.desc()).all()
    return render_template('patient.html', active_patient=patient, analyses=analyses)
