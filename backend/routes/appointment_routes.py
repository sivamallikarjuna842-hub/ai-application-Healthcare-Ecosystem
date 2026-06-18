from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from models import Appointment, User, DoctorProfile, AppointmentStatus
from datetime import datetime, date
from sqlalchemy import and_, or_
import uuid

bp = Blueprint('appointments', __name__)

@bp.route('', methods=['GET'])
@jwt_required()
def get_appointments():
    """Get appointments for user"""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user:
        return {'error': 'User not found'}, 404
    
    # Filter based on user role
    if user.role == 'doctor':
        appointments = Appointment.query.filter_by(doctor_id=user_id).all()
    else:
        appointments = Appointment.query.filter_by(patient_id=user_id).all()
    
    # Optional status filter
    status = request.args.get('status')
    if status:
        appointments = [apt for apt in appointments if apt.status == status]
    
    return {
        'success': True,
        'data': [apt.to_dict() for apt in appointments],
        'count': len(appointments)
    }, 200


@bp.route('/<appointment_id>', methods=['GET'])
@jwt_required()
def get_appointment(appointment_id):
    """Get appointment details"""
    appointment = Appointment.query.get(appointment_id)
    
    if not appointment:
        return {'error': 'Appointment not found'}, 404
    
    return {
        'success': True,
        'data': appointment.to_dict()
    }, 200


@bp.route('', methods=['POST'])
@jwt_required()
def create_appointment():
    """Create new appointment"""
    user_id = get_jwt_identity()
    data = request.get_json()
    
    # Validate input
    required_fields = ['doctor_id', 'appointment_date', 'appointment_time', 'reason']
    if not all(k in data for k in required_fields):
        return {'error': 'Missing required fields'}, 400
    
    # Get users
    patient = User.query.get(user_id)
    doctor = User.query.get(data['doctor_id'])
    
    if not patient or not doctor:
        return {'error': 'Patient or doctor not found'}, 404
    
    if doctor.role != 'doctor':
        return {'error': 'Invalid doctor'}, 400
    
    try:
        # Parse date and time
        apt_date = datetime.fromisoformat(data['appointment_date']).date()
        apt_time = datetime.fromisoformat(data['appointment_time']).time()
        
        # Validate date is in future
        if apt_date < date.today():
            return {'error': 'Appointment date must be in the future'}, 400
        
        # Create appointment
        appointment = Appointment(
            id=uuid.uuid4(),
            patient_id=patient.id,
            doctor_id=doctor.id,
            appointment_date=apt_date,
            appointment_time=apt_time,
            reason=data['reason'],
            status=AppointmentStatus.SCHEDULED,
            notes=data.get('notes'),
            is_video_call=data.get('is_video_call', True)
        )
        
        db.session.add(appointment)
        db.session.commit()
        
        return {
            'success': True,
            'message': 'Appointment created successfully',
            'data': appointment.to_dict()
        }, 201
    
    except Exception as e:
        db.session.rollback()
        return {'error': str(e)}, 500


@bp.route('/<appointment_id>', methods=['PUT'])
@jwt_required()
def update_appointment(appointment_id):
    """Update appointment"""
    user_id = get_jwt_identity()
    data = request.get_json()
    
    appointment = Appointment.query.get(appointment_id)
    
    if not appointment:
        return {'error': 'Appointment not found'}, 404
    
    # Check permissions
    if appointment.patient_id != user_id and appointment.doctor_id != user_id:
        return {'error': 'Unauthorized'}, 403
    
    try:
        # Update fields
        if 'status' in data:
            appointment.status = data['status']
        if 'notes' in data:
            appointment.notes = data['notes']
        if 'appointment_date' in data:
            appointment.appointment_date = datetime.fromisoformat(data['appointment_date']).date()
        if 'appointment_time' in data:
            appointment.appointment_time = datetime.fromisoformat(data['appointment_time']).time()
        
        appointment.updated_at = datetime.utcnow()
        db.session.commit()
        
        return {
            'success': True,
            'message': 'Appointment updated successfully',
            'data': appointment.to_dict()
        }, 200
    
    except Exception as e:
        db.session.rollback()
        return {'error': str(e)}, 500


@bp.route('/<appointment_id>', methods=['DELETE'])
@jwt_required()
def cancel_appointment(appointment_id):
    """Cancel appointment"""
    user_id = get_jwt_identity()
    
    appointment = Appointment.query.get(appointment_id)
    
    if not appointment:
        return {'error': 'Appointment not found'}, 404
    
    # Check permissions
    if appointment.patient_id != user_id and appointment.doctor_id != user_id:
        return {'error': 'Unauthorized'}, 403
    
    # Check if can be cancelled
    if appointment.status == AppointmentStatus.COMPLETED:
        return {'error': 'Cannot cancel completed appointment'}, 400
    
    try:
        appointment.status = AppointmentStatus.CANCELLED
        appointment.updated_at = datetime.utcnow()
        db.session.commit()
        
        return {
            'success': True,
            'message': 'Appointment cancelled successfully'
        }, 200
    
    except Exception as e:
        db.session.rollback()
        return {'error': str(e)}, 500


@bp.route('/doctor/<doctor_id>/availability', methods=['GET'])
def get_doctor_availability(doctor_id):
    """Get doctor's available time slots"""
    from models import DoctorAvailability
    
    doctor = User.query.get(doctor_id)
    
    if not doctor or doctor.role != 'doctor':
        return {'error': 'Doctor not found'}, 404
    
    # Get availability for next 30 days
    doctor_profile = DoctorProfile.query.filter_by(user_id=doctor_id).first()
    
    if not doctor_profile:
        return {'error': 'Doctor profile not found'}, 404
    
    availability = DoctorAvailability.query.filter(
        and_(
            DoctorAvailability.doctor_id == doctor_profile.id,
            DoctorAvailability.is_booked == False,
            DoctorAvailability.date >= date.today()
        )
    ).all()
    
    return {
        'success': True,
        'data': [
            {
                'id': str(slot.id),
                'date': slot.date.isoformat(),
                'start_time': slot.start_time.isoformat(),
                'end_time': slot.end_time.isoformat()
            }
            for slot in availability
        ]
    }, 200


@bp.route('/stats', methods=['GET'])
@jwt_required()
def get_appointment_stats():
    """Get appointment statistics"""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user:
        return {'error': 'User not found'}, 404
    
    if user.role == 'doctor':
        total = Appointment.query.filter_by(doctor_id=user_id).count()
        scheduled = Appointment.query.filter_by(doctor_id=user_id, status=AppointmentStatus.SCHEDULED).count()
        completed = Appointment.query.filter_by(doctor_id=user_id, status=AppointmentStatus.COMPLETED).count()
    else:
        total = Appointment.query.filter_by(patient_id=user_id).count()
        scheduled = Appointment.query.filter_by(patient_id=user_id, status=AppointmentStatus.SCHEDULED).count()
        completed = Appointment.query.filter_by(patient_id=user_id, status=AppointmentStatus.COMPLETED).count()
    
    return {
        'success': True,
        'stats': {
            'total_appointments': total,
            'scheduled_appointments': scheduled,
            'completed_appointments': completed,
            'cancelled_appointments': total - scheduled - completed
        }
    }, 200
