from flask import Blueprint, render_template, request
from flask_login import login_required, current_user
from models.models import Patient, Analysis

dashboard_bp = Blueprint('dashboard', __name__)

@dashboard_bp.route('/')
@dashboard_bp.route('/dashboard')
@login_required
def index():
    # Query database counts for the current logged-in doctor
    total_patients = Patient.query.filter_by(doctor_id=current_user.id).count()
    total_analyses = Analysis.query.filter_by(user_id=current_user.id).count()
    
    # Recent analyses
    recent_analyses = Analysis.query.filter_by(user_id=current_user.id)\
        .order_by(Analysis.date_created.desc()).limit(5).all()
        
    # Search patients functionality (if query provided)
    search_query = request.args.get('search', '').strip()
    patients_list = []
    if search_query:
        patients_list = Patient.query.filter(
            Patient.doctor_id == current_user.id,
            (Patient.name.like(f"%{search_query}%")) | (Patient.patient_uuid.like(f"%{search_query}%"))
        ).all()
    else:
        patients_list = Patient.query.filter_by(doctor_id=current_user.id).limit(10).all()

    # Calculate statistics for charts/indicators
    keros_i_count = Analysis.query.filter_by(user_id=current_user.id, keros_type='Keros Type I').count()
    keros_ii_count = Analysis.query.filter_by(user_id=current_user.id, keros_type='Keros Type II').count()
    keros_iii_count = Analysis.query.filter_by(user_id=current_user.id, keros_type='Keros Type III').count()
    
    return render_template(
        'dashboard.html',
        total_patients=total_patients,
        total_analyses=total_analyses,
        recent_analyses=recent_analyses,
        patients_list=patients_list,
        search_query=search_query,
        keros_stats={
            'Type I': keros_i_count,
            'Type II': keros_ii_count,
            'Type III': keros_iii_count
        }
    )
