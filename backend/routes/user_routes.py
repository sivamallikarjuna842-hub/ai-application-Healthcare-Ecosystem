from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from models import User, DoctorProfile, UserRole
from datetime import datetime
import uuid

bp = Blueprint('users', __name__)
patient_bp = Blueprint('patients', __name__)
doctor_bp = Blueprint('doctors', __name__)

# User Routes
@bp.route('/<user_id>', methods=['GET'])
@jwt_required()
def get_user(user_id):
    """Get user profile"""
    current_user_id = get_jwt_identity()
    
    user = User.query.get(user_id)
    if not user:
        return {'error': 'User not found'}, 404
    
    # Can view own profile or public profiles
    if current_user_id != user_id and user.role == 'patient':
        return {'error': 'Cannot view other patient profiles'}, 403
    
    return {
        'success': True,
        'data': user.to_dict(include_sensitive=(current_user_id == user_id))
    }, 200


@bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user_profile():
    """Get current user profile"""
    user_id = get_jwt_identity()
    
    user = User.query.get(user_id)
    if not user:
        return {'error': 'User not found'}, 404
    
    data = user.to_dict(include_sensitive=True)
    
    # Add doctor info if applicable
    if user.role == 'doctor':
        doctor_profile = DoctorProfile.query.filter_by(user_id=user_id).first()
        if doctor_profile:
            data['doctor_profile'] = doctor_profile.to_dict()
    
    return {
        'success': True,
        'data': data
    }, 200


@bp.route('/me', methods=['PUT'])
@jwt_required()
def update_current_user():
    """Update current user profile"""
    user_id = get_jwt_identity()
    data = request.get_json()
    
    user = User.query.get(user_id)
    if not user:
        return {'error': 'User not found'}, 404
    
    try:
        # Update user fields
        if 'first_name' in data:
            user.first_name = data['first_name']
        if 'last_name' in data:
            user.last_name = data['last_name']
        if 'phone' in data:
            user.phone = data['phone']
        if 'date_of_birth' in data:
            user.date_of_birth = datetime.fromisoformat(data['date_of_birth']).date()
        if 'gender' in data:
            user.gender = data['gender']
        if 'address' in data:
            user.address = data['address']
        if 'city' in data:
            user.city = data['city']
        if 'state' in data:
            user.state = data['state']
        if 'postal_code' in data:
            user.postal_code = data['postal_code']
        if 'country' in data:
            user.country = data['country']
        
        user.updated_at = datetime.utcnow()
        db.session.commit()
        
        return {
            'success': True,
            'message': 'Profile updated successfully',
            'data': user.to_dict(include_sensitive=True)
        }, 200
    
    except Exception as e:
        db.session.rollback()
        return {'error': str(e)}, 500


# Patient Routes
@patient_bp.route('', methods=['GET'])
@jwt_required()
def get_patients():
    """Get all patients (for doctors)"""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user or user.role != 'doctor':
        return {'error': 'Only doctors can view patients'}, 403
    
    patients = User.query.filter_by(role='patient').all()
    
    return {
        'success': True,
        'data': [p.to_dict() for p in patients],
        'count': len(patients)
    }, 200


@patient_bp.route('/<patient_id>', methods=['GET'])
@jwt_required()
def get_patient(patient_id):
    """Get patient details"""
    user_id = get_jwt_identity()
    current_user = User.query.get(user_id)
    
    patient = User.query.get(patient_id)
    if not patient or patient.role != 'patient':
        return {'error': 'Patient not found'}, 404
    
    # Only the patient or their doctor can view
    if current_user.id != patient.id and current_user.role != 'doctor':
        return {'error': 'Unauthorized'}, 403
    
    return {
        'success': True,
        'data': patient.to_dict(include_sensitive=(current_user.id == patient.id))
    }, 200


# Doctor Routes
@doctor_bp.route('', methods=['GET'])
def get_doctors():
    """Get all doctors (public)"""
    doctors = User.query.filter_by(role='doctor').all()
    
    doctor_data = []
    for doctor in doctors:
        doc_dict = doctor.to_dict()
        profile = DoctorProfile.query.filter_by(user_id=doctor.id).first()
        if profile:
            doc_dict['doctor_profile'] = profile.to_dict()
        doctor_data.append(doc_dict)
    
    return {
        'success': True,
        'data': doctor_data,
        'count': len(doctor_data)
    }, 200


@doctor_bp.route('/<doctor_id>', methods=['GET'])
def get_doctor(doctor_id):
    """Get doctor details (public)"""
    doctor = User.query.get(doctor_id)
    
    if not doctor or doctor.role != 'doctor':
        return {'error': 'Doctor not found'}, 404
    
    data = doctor.to_dict()
    profile = DoctorProfile.query.filter_by(user_id=doctor_id).first()
    if profile:
        data['doctor_profile'] = profile.to_dict()
    
    return {
        'success': True,
        'data': data
    }, 200


@doctor_bp.route('', methods=['POST'])
@jwt_required()
def create_doctor_profile():
    """Create doctor profile"""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user or user.role != 'doctor':
        return {'error': 'Only doctors can create doctor profiles'}, 403
    
    # Check if profile already exists
    existing_profile = DoctorProfile.query.filter_by(user_id=user_id).first()
    if existing_profile:
        return {'error': 'Doctor profile already exists'}, 409
    
    data = request.get_json()
    
    # Validate required fields
    if not data or not all(k in data for k in ['license_number', 'specialty']):
        return {'error': 'Missing required fields'}, 400
    
    # Check license number uniqueness
    if DoctorProfile.query.filter_by(license_number=data['license_number']).first():
        return {'error': 'License number already registered'}, 409
    
    try:
        profile = DoctorProfile(
            id=uuid.uuid4(),
            user_id=user_id,
            license_number=data['license_number'],
            specialty=data['specialty'],
            bio=data.get('bio'),
            experience_years=data.get('experience_years'),
            qualification=data.get('qualification'),
            hospital_affiliation=data.get('hospital_affiliation'),
            consultation_fee=data.get('consultation_fee', 50.0)
        )
        
        db.session.add(profile)
        db.session.commit()
        
        return {
            'success': True,
            'message': 'Doctor profile created successfully',
            'data': profile.to_dict()
        }, 201
    
    except Exception as e:
        db.session.rollback()
        return {'error': str(e)}, 500


@doctor_bp.route('/me', methods=['PUT'])
@jwt_required()
def update_doctor_profile():
    """Update doctor profile"""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user or user.role != 'doctor':
        return {'error': 'Only doctors can update doctor profiles'}, 403
    
    profile = DoctorProfile.query.filter_by(user_id=user_id).first()
    if not profile:
        return {'error': 'Doctor profile not found'}, 404
    
    data = request.get_json()
    
    try:
        if 'bio' in data:
            profile.bio = data['bio']
        if 'experience_years' in data:
            profile.experience_years = data['experience_years']
        if 'qualification' in data:
            profile.qualification = data['qualification']
        if 'hospital_affiliation' in data:
            profile.hospital_affiliation = data['hospital_affiliation']
        if 'consultation_fee' in data:
            profile.consultation_fee = data['consultation_fee']
        if 'available_from' in data:
            profile.available_from = datetime.fromisoformat(data['available_from']).time()
        if 'available_to' in data:
            profile.available_to = datetime.fromisoformat(data['available_to']).time()
        
        db.session.commit()
        
        return {
            'success': True,
            'message': 'Doctor profile updated successfully',
            'data': profile.to_dict()
        }, 200
    
    except Exception as e:
        db.session.rollback()
        return {'error': str(e)}, 500


@doctor_bp.route('/<doctor_id>/rating', methods=['GET'])
def get_doctor_rating(doctor_id):
    """Get doctor rating and reviews"""
    doctor = User.query.get(doctor_id)
    if not doctor or doctor.role != 'doctor':
        return {'error': 'Doctor not found'}, 404
    
    profile = DoctorProfile.query.filter_by(user_id=doctor_id).first()
    if not profile:
        return {'error': 'Doctor profile not found'}, 404
    
    return {
        'success': True,
        'data': {
            'doctor_id': doctor_id,
            'rating': profile.rating,
            'total_patients': profile.total_patients
        }
    }, 200


@doctor_bp.route('/<doctor_id>/search', methods=['GET'])
def search_doctors():
    """Search doctors by specialty"""
    specialty = request.args.get('specialty')
    
    query = User.query.filter_by(role='doctor')
    
    if specialty:
        query = query.join(DoctorProfile).filter(DoctorProfile.specialty.ilike(f'%{specialty}%'))
    
    doctors = query.all()
    
    doctor_data = []
    for doctor in doctors:
        doc_dict = doctor.to_dict()
        profile = DoctorProfile.query.filter_by(user_id=doctor.id).first()
        if profile:
            doc_dict['doctor_profile'] = profile.to_dict()
        doctor_data.append(doc_dict)
    
    return {
        'success': True,
        'data': doctor_data,
        'count': len(doctor_data)
    }, 200
