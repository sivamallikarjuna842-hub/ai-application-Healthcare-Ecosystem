from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from models import Prescription, Medication, User, PrescriptionStatus
from datetime import datetime, timedelta
import uuid

bp = Blueprint('prescriptions', __name__)

@bp.route('', methods=['GET'])
@jwt_required()
def get_prescriptions():
    """Get prescriptions for user"""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user:
        return {'error': 'User not found'}, 404
    
    # Patients see prescriptions prescribed to them
    if user.role == 'patient':
        prescriptions = Prescription.query.filter_by(patient_id=user_id).all()
    else:
        # Doctors see prescriptions they created
        prescriptions = Prescription.query.filter_by(doctor_id=user_id).all()
    
    # Optional status filter
    status = request.args.get('status')
    if status:
        prescriptions = [p for p in prescriptions if p.status == status]
    
    return {
        'success': True,
        'data': [p.to_dict() for p in prescriptions],
        'count': len(prescriptions)
    }, 200


@bp.route('/<prescription_id>', methods=['GET'])
@jwt_required()
def get_prescription(prescription_id):
    """Get specific prescription"""
    user_id = get_jwt_identity()
    
    prescription = Prescription.query.get(prescription_id)
    
    if not prescription:
        return {'error': 'Prescription not found'}, 404
    
    # Check access
    user = User.query.get(user_id)
    if user.role == 'patient' and prescription.patient_id != user_id:
        return {'error': 'Unauthorized'}, 403
    elif user.role == 'doctor' and prescription.doctor_id != user_id:
        return {'error': 'Unauthorized'}, 403
    
    return {
        'success': True,
        'data': prescription.to_dict()
    }, 200


@bp.route('', methods=['POST'])
@jwt_required()
def create_prescription():
    """Create new prescription"""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user or user.role != 'doctor':
        return {'error': 'Only doctors can create prescriptions'}, 403
    
    data = request.get_json()
    
    # Validate required fields
    if not data or not all(k in data for k in ['patient_id', 'medications']):
        return {'error': 'Missing required fields'}, 400
    
    if not isinstance(data['medications'], list) or len(data['medications']) == 0:
        return {'error': 'At least one medication is required'}, 400
    
    # Get patient
    patient = User.query.get(data['patient_id'])
    if not patient or patient.role != 'patient':
        return {'error': 'Patient not found'}, 404
    
    try:
        # Create prescription
        prescription = Prescription(
            id=uuid.uuid4(),
            patient_id=patient.id,
            doctor_id=user_id,
            prescribed_date=datetime.utcnow().date(),
            status=PrescriptionStatus.ACTIVE,
            instructions=data.get('instructions')
        )
        
        # Set expiry date (default 30 days from now)
        if 'expiry_date' in data:
            prescription.expiry_date = datetime.fromisoformat(data['expiry_date']).date()
        else:
            prescription.expiry_date = datetime.utcnow().date() + timedelta(days=30)
        
        db.session.add(prescription)
        
        # Add medications
        for med_data in data['medications']:
            if not all(k in med_data for k in ['name', 'dosage', 'frequency', 'duration']):
                db.session.rollback()
                return {'error': 'Invalid medication data'}, 400
            
            medication = Medication(
                id=uuid.uuid4(),
                prescription_id=prescription.id,
                name=med_data['name'],
                dosage=med_data['dosage'],
                frequency=med_data['frequency'],
                duration=med_data['duration'],
                quantity=med_data.get('quantity'),
                route=med_data.get('route'),
                notes=med_data.get('notes')
            )
            db.session.add(medication)
        
        db.session.commit()
        
        return {
            'success': True,
            'message': 'Prescription created successfully',
            'data': prescription.to_dict()
        }, 201
    
    except Exception as e:
        db.session.rollback()
        return {'error': str(e)}, 500


@bp.route('/<prescription_id>', methods=['PUT'])
@jwt_required()
def update_prescription(prescription_id):
    """Update prescription"""
    user_id = get_jwt_identity()
    data = request.get_json()
    
    prescription = Prescription.query.get(prescription_id)
    
    if not prescription:
        return {'error': 'Prescription not found'}, 404
    
    # Check permissions (only doctor who created can update)
    if prescription.doctor_id != user_id:
        return {'error': 'Unauthorized'}, 403
    
    try:
        if 'status' in data:
            prescription.status = data['status']
        if 'instructions' in data:
            prescription.instructions = data['instructions']
        if 'expiry_date' in data:
            prescription.expiry_date = datetime.fromisoformat(data['expiry_date']).date()
        
        prescription.updated_at = datetime.utcnow()
        db.session.commit()
        
        return {
            'success': True,
            'message': 'Prescription updated successfully',
            'data': prescription.to_dict()
        }, 200
    
    except Exception as e:
        db.session.rollback()
        return {'error': str(e)}, 500


@bp.route('/<prescription_id>', methods=['DELETE'])
@jwt_required()
def delete_prescription(prescription_id):
    """Delete prescription"""
    user_id = get_jwt_identity()
    
    prescription = Prescription.query.get(prescription_id)
    
    if not prescription:
        return {'error': 'Prescription not found'}, 404
    
    # Check permissions (only doctor who created can delete)
    if prescription.doctor_id != user_id:
        return {'error': 'Unauthorized'}, 403
    
    try:
        # Delete medications first
        Medication.query.filter_by(prescription_id=prescription_id).delete()
        db.session.delete(prescription)
        db.session.commit()
        
        return {
            'success': True,
            'message': 'Prescription deleted successfully'
        }, 200
    
    except Exception as e:
        db.session.rollback()
        return {'error': str(e)}, 500


@bp.route('/stats', methods=['GET'])
@jwt_required()
def get_prescription_stats():
    """Get prescription statistics"""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user:
        return {'error': 'User not found'}, 404
    
    if user.role == 'doctor':
        total = Prescription.query.filter_by(doctor_id=user_id).count()
        active = Prescription.query.filter_by(doctor_id=user_id, status=PrescriptionStatus.ACTIVE).count()
        expired = Prescription.query.filter_by(doctor_id=user_id, status=PrescriptionStatus.EXPIRED).count()
    else:
        total = Prescription.query.filter_by(patient_id=user_id).count()
        active = Prescription.query.filter_by(patient_id=user_id, status=PrescriptionStatus.ACTIVE).count()
        expired = Prescription.query.filter_by(patient_id=user_id, status=PrescriptionStatus.EXPIRED).count()
    
    return {
        'success': True,
        'stats': {
            'total_prescriptions': total,
            'active_prescriptions': active,
            'expired_prescriptions': expired,
            'completed_prescriptions': total - active - expired
        }
    }, 200


@bp.route('/<prescription_id>/medications', methods=['GET'])
@jwt_required()
def get_prescription_medications(prescription_id):
    """Get medications for prescription"""
    user_id = get_jwt_identity()
    
    prescription = Prescription.query.get(prescription_id)
    
    if not prescription:
        return {'error': 'Prescription not found'}, 404
    
    # Check access
    if prescription.patient_id != user_id and prescription.doctor_id != user_id:
        return {'error': 'Unauthorized'}, 403
    
    return {
        'success': True,
        'data': [m.to_dict() for m in prescription.medications]
    }, 200


@bp.route('/<prescription_id>/medications', methods=['POST'])
@jwt_required()
def add_medication(prescription_id):
    """Add medication to prescription"""
    user_id = get_jwt_identity()
    data = request.get_json()
    
    prescription = Prescription.query.get(prescription_id)
    
    if not prescription:
        return {'error': 'Prescription not found'}, 404
    
    # Check permissions (only doctor who created can add medications)
    if prescription.doctor_id != user_id:
        return {'error': 'Unauthorized'}, 403
    
    # Validate medication data
    if not data or not all(k in data for k in ['name', 'dosage', 'frequency', 'duration']):
        return {'error': 'Missing medication fields'}, 400
    
    try:
        medication = Medication(
            id=uuid.uuid4(),
            prescription_id=prescription.id,
            name=data['name'],
            dosage=data['dosage'],
            frequency=data['frequency'],
            duration=data['duration'],
            quantity=data.get('quantity'),
            route=data.get('route'),
            notes=data.get('notes')
        )
        
        db.session.add(medication)
        prescription.updated_at = datetime.utcnow()
        db.session.commit()
        
        return {
            'success': True,
            'message': 'Medication added successfully',
            'data': medication.to_dict()
        }, 201
    
    except Exception as e:
        db.session.rollback()
        return {'error': str(e)}, 500


@bp.route('/medications/<medication_id>', methods=['DELETE'])
@jwt_required()
def delete_medication(medication_id):
    """Delete medication from prescription"""
    user_id = get_jwt_identity()
    
    medication = Medication.query.get(medication_id)
    
    if not medication:
        return {'error': 'Medication not found'}, 404
    
    prescription = medication.prescription
    
    # Check permissions
    if prescription.doctor_id != user_id:
        return {'error': 'Unauthorized'}, 403
    
    # Ensure at least one medication remains
    if len(prescription.medications) <= 1:
        return {'error': 'Prescription must have at least one medication'}, 400
    
    try:
        db.session.delete(medication)
        prescription.updated_at = datetime.utcnow()
        db.session.commit()
        
        return {
            'success': True,
            'message': 'Medication deleted successfully'
        }, 200
    
    except Exception as e:
        db.session.rollback()
        return {'error': str(e)}, 500
