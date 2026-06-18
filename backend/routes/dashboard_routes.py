from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from models import User, Appointment, MedicalReport, Prescription, AppointmentStatus
from datetime import datetime, timedelta, date
from sqlalchemy import func

bp = Blueprint('dashboard', __name__)

@bp.route('/patient', methods=['GET'])
@jwt_required()
def get_patient_dashboard():
    """Get patient dashboard data"""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user or user.role != 'patient':
        return {'error': 'Unauthorized'}, 403
    
    # Get appointments
    total_appointments = Appointment.query.filter_by(patient_id=user_id).count()
    upcoming_appointments = Appointment.query.filter(
        Appointment.patient_id == user_id,
        Appointment.appointment_date >= date.today(),
        Appointment.status == AppointmentStatus.SCHEDULED
    ).count()
    completed_appointments = Appointment.query.filter_by(
        patient_id=user_id,
        status=AppointmentStatus.COMPLETED
    ).count()
    
    # Get medical reports
    total_reports = MedicalReport.query.filter_by(patient_id=user_id).count()
    recent_reports = MedicalReport.query.filter_by(patient_id=user_id).order_by(
        MedicalReport.created_at.desc()
    ).limit(5).all()
    
    # Get prescriptions
    active_prescriptions = Prescription.query.filter_by(
        patient_id=user_id,
        status='active'
    ).count()
    total_prescriptions = Prescription.query.filter_by(patient_id=user_id).count()
    
    # Get next appointment
    next_appointment = Appointment.query.filter(
        Appointment.patient_id == user_id,
        Appointment.appointment_date >= date.today(),
        Appointment.status == AppointmentStatus.SCHEDULED
    ).order_by(Appointment.appointment_date).first()
    
    return {
        'success': True,
        'data': {
            'appointments': {
                'total': total_appointments,
                'upcoming': upcoming_appointments,
                'completed': completed_appointments,
                'next_appointment': next_appointment.to_dict() if next_appointment else None
            },
            'reports': {
                'total': total_reports,
                'recent': [r.to_dict() for r in recent_reports]
            },
            'prescriptions': {
                'total': total_prescriptions,
                'active': active_prescriptions
            }
        }
    }, 200


@bp.route('/doctor', methods=['GET'])
@jwt_required()
def get_doctor_dashboard():
    """Get doctor dashboard data"""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user or user.role != 'doctor':
        return {'error': 'Unauthorized'}, 403
    
    # Get appointments
    today = date.today()
    total_appointments = Appointment.query.filter_by(doctor_id=user_id).count()
    
    today_appointments = Appointment.query.filter(
        Appointment.doctor_id == user_id,
        Appointment.appointment_date == today
    ).count()
    
    upcoming_appointments = Appointment.query.filter(
        Appointment.doctor_id == user_id,
        Appointment.appointment_date >= today,
        Appointment.status == AppointmentStatus.SCHEDULED
    ).count()
    
    completed_appointments = Appointment.query.filter_by(
        doctor_id=user_id,
        status=AppointmentStatus.COMPLETED
    ).count()
    
    # Get unique patients
    unique_patients = db.session.query(func.count(func.distinct(Appointment.patient_id))).filter(
        Appointment.doctor_id == user_id
    ).scalar() or 0
    
    # Get reports
    total_reports_uploaded = MedicalReport.query.filter_by(doctor_id=user_id).count()
    reports_summarized = MedicalReport.query.filter_by(doctor_id=user_id, is_summarized=True).count()
    
    # Get prescriptions
    total_prescriptions = Prescription.query.filter_by(doctor_id=user_id).count()
    
    # Get today's appointments with details
    todays_appointments = Appointment.query.filter(
        Appointment.doctor_id == user_id,
        Appointment.appointment_date == today,
        Appointment.status == AppointmentStatus.SCHEDULED
    ).all()
    
    return {
        'success': True,
        'data': {
            'appointments': {
                'total': total_appointments,
                'today': today_appointments,
                'upcoming': upcoming_appointments,
                'completed': completed_appointments,
                'todays_schedule': [apt.to_dict() for apt in todays_appointments]
            },
            'patients': {
                'total_unique': unique_patients
            },
            'reports': {
                'total_uploaded': total_reports_uploaded,
                'summarized': reports_summarized
            },
            'prescriptions': {
                'total': total_prescriptions
            }
        }
    }, 200


@bp.route('/admin', methods=['GET'])
@jwt_required()
def get_admin_dashboard():
    """Get admin dashboard data"""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user or user.role != 'admin':
        return {'error': 'Unauthorized'}, 403
    
    # User statistics
    total_users = User.query.count()
    total_patients = User.query.filter_by(role='patient').count()
    total_doctors = User.query.filter_by(role='doctor').count()
    active_users = User.query.filter_by(is_active=True).count()
    
    # Appointment statistics
    total_appointments = Appointment.query.count()
    completed_this_month = Appointment.query.filter(
        Appointment.status == AppointmentStatus.COMPLETED,
        Appointment.created_at >= datetime.utcnow().replace(day=1)
    ).count()
    
    # Report statistics
    total_reports = MedicalReport.query.count()
    reports_summarized = MedicalReport.query.filter_by(is_summarized=True).count()
    
    # Prescription statistics
    total_prescriptions = Prescription.query.count()
    active_prescriptions = Prescription.query.filter_by(status='active').count()
    
    return {
        'success': True,
        'data': {
            'users': {
                'total': total_users,
                'patients': total_patients,
                'doctors': total_doctors,
                'active': active_users
            },
            'appointments': {
                'total': total_appointments,
                'completed_this_month': completed_this_month
            },
            'reports': {
                'total': total_reports,
                'summarized': reports_summarized
            },
            'prescriptions': {
                'total': total_prescriptions,
                'active': active_prescriptions
            }
        }
    }, 200


@bp.route('/analytics/appointments', methods=['GET'])
@jwt_required()
def get_appointment_analytics():
    """Get appointment analytics"""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    days = request.args.get('days', 30, type=int)
    start_date = datetime.utcnow() - timedelta(days=days)
    
    if user.role == 'doctor':
        query = Appointment.query.filter(
            Appointment.doctor_id == user_id,
            Appointment.created_at >= start_date
        )
    elif user.role == 'patient':
        query = Appointment.query.filter(
            Appointment.patient_id == user_id,
            Appointment.created_at >= start_date
        )
    else:
        query = Appointment.query.filter(Appointment.created_at >= start_date)
    
    # Group by date
    appointments_by_date = {}
    for apt in query.all():
        date_str = apt.created_at.date().isoformat()
        if date_str not in appointments_by_date:
            appointments_by_date[date_str] = 0
        appointments_by_date[date_str] += 1
    
    return {
        'success': True,
        'data': {
            'period_days': days,
            'start_date': start_date.isoformat(),
            'appointments_by_date': appointments_by_date
        }
    }, 200


@bp.route('/analytics/reports', methods=['GET'])
@jwt_required()
def get_report_analytics():
    """Get medical report analytics"""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if user.role == 'doctor':
        reports = MedicalReport.query.filter_by(doctor_id=user_id).all()
    elif user.role == 'patient':
        reports = MedicalReport.query.filter_by(patient_id=user_id).all()
    else:
        reports = MedicalReport.query.all()
    
    # Group by type
    by_type = {}
    for report in reports:
        if report.report_type not in by_type:
            by_type[report.report_type] = 0
        by_type[report.report_type] += 1
    
    # Summarization stats
    total = len(reports)
    summarized = len([r for r in reports if r.is_summarized])
    
    return {
        'success': True,
        'data': {
            'total_reports': total,
            'summarized': summarized,
            'by_type': by_type,
            'summarization_rate': (summarized / total * 100) if total > 0 else 0
        }
    }, 200
