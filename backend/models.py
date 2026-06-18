from app import db
from datetime import datetime, timedelta
import uuid
import bcrypt


# Cross-database compatible UUID type
import sqlalchemy.types as types

class GUID(types.TypeDecorator):
    """Platform-independent GUID type.
    Uses PostgreSQL's UUID type when available, otherwise CHAR(32)."""
    impl = types.CHAR(32)
    cache_ok = True

    def load_dialect_impl(self, dialect):
        if dialect.name == 'postgresql':
            from sqlalchemy.dialects.postgresql import UUID
            return dialect.type_descriptor(GUID())
        return dialect.type_descriptor(types.CHAR(32))

    def process_bind_param(self, value, dialect):
        if value is None:
            return None
        if dialect.name == 'postgresql':
            return value
        return str(value).replace('-', '') if isinstance(value, uuid.UUID) else value.replace('-', '')

    def process_result_value(self, value, dialect):
        if value is None:
            return value
        if dialect.name == 'postgresql':
            return value
        return uuid.UUID(value) if isinstance(value, str) else value

# Enums
class UserRole:
    PATIENT = 'patient'
    DOCTOR = 'doctor'
    ADMIN = 'admin'

class AppointmentStatus:
    SCHEDULED = 'scheduled'
    COMPLETED = 'completed'
    CANCELLED = 'cancelled'
    NO_SHOW = 'no_show'

class PrescriptionStatus:
    ACTIVE = 'active'
    EXPIRED = 'expired'
    COMPLETED = 'completed'

class ReportType:
    LAB_TEST = 'lab_test'
    X_RAY = 'x_ray'
    ULTRASOUND = 'ultrasound'
    MRI = 'mri'
    CT_SCAN = 'ct_scan'
    BLOOD_TEST = 'blood_test'
    OTHER = 'other'


class User(db.Model):
    """Base User model"""
    __tablename__ = 'users'
    
    id = db.Column(GUID(), primary_key=True, default=uuid.uuid4)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    first_name = db.Column(db.String(100), nullable=False)
    last_name = db.Column(db.String(100), nullable=False)
    phone = db.Column(db.String(20))
    date_of_birth = db.Column(db.Date)
    gender = db.Column(db.String(20))
    address = db.Column(db.Text)
    city = db.Column(db.String(100))
    state = db.Column(db.String(100))
    postal_code = db.Column(db.String(20))
    country = db.Column(db.String(100))
    role = db.Column(db.String(50), nullable=False, default=UserRole.PATIENT)
    is_active = db.Column(db.Boolean, default=True)
    email_verified = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    appointments_as_patient = db.relationship('Appointment', backref='patient', foreign_keys='Appointment.patient_id')
    appointments_as_doctor = db.relationship('Appointment', backref='doctor', foreign_keys='Appointment.doctor_id')
    reports = db.relationship('MedicalReport', backref='patient', foreign_keys='MedicalReport.patient_id')
    prescriptions = db.relationship('Prescription', backref='patient', foreign_keys='Prescription.patient_id')
    doctor_info = db.relationship('DoctorProfile', backref='user', uselist=False)
    
    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"
    
    def set_password(self, password):
        """Hash and set password"""
        self.password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    def check_password(self, password):
        """Verify password"""
        return bcrypt.checkpw(password.encode('utf-8'), self.password_hash.encode('utf-8'))
    
    def to_dict(self, include_sensitive=False):
        """Convert to dictionary"""
        data = {
            'id': str(self.id),
            'email': self.email,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'full_name': self.full_name,
            'phone': self.phone,
            'role': self.role,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat(),
        }
        if include_sensitive:
            data['email_verified'] = self.email_verified
        return data


class DoctorProfile(db.Model):
    """Doctor-specific profile information"""
    __tablename__ = 'doctor_profiles'
    
    id = db.Column(GUID(), primary_key=True, default=uuid.uuid4)
    user_id = db.Column(GUID(), db.ForeignKey('users.id'), nullable=False, unique=True)
    license_number = db.Column(db.String(100), unique=True, nullable=False)
    specialty = db.Column(db.String(100), nullable=False)
    bio = db.Column(db.Text)
    experience_years = db.Column(db.Integer)
    qualification = db.Column(db.String(255))
    hospital_affiliation = db.Column(db.String(255))
    consultation_fee = db.Column(db.Float, default=50.0)
    rating = db.Column(db.Float, default=0.0)
    total_patients = db.Column(db.Integer, default=0)
    is_verified = db.Column(db.Boolean, default=False)
    available_from = db.Column(db.Time)
    available_to = db.Column(db.Time)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    availability_slots = db.relationship('DoctorAvailability', backref='doctor', cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': str(self.id),
            'user_id': str(self.user_id),
            'license_number': self.license_number,
            'specialty': self.specialty,
            'bio': self.bio,
            'experience_years': self.experience_years,
            'consultation_fee': self.consultation_fee,
            'rating': self.rating,
            'total_patients': self.total_patients,
            'is_verified': self.is_verified,
            'user': self.user.to_dict() if self.user else None
        }


class DoctorAvailability(db.Model):
    """Doctor availability slots"""
    __tablename__ = 'doctor_availability'
    
    id = db.Column(GUID(), primary_key=True, default=uuid.uuid4)
    doctor_id = db.Column(GUID(), db.ForeignKey('doctor_profiles.id'), nullable=False)
    date = db.Column(db.Date, nullable=False)
    start_time = db.Column(db.Time, nullable=False)
    end_time = db.Column(db.Time, nullable=False)
    is_booked = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class Appointment(db.Model):
    """Appointment model"""
    __tablename__ = 'appointments'
    
    id = db.Column(GUID(), primary_key=True, default=uuid.uuid4)
    patient_id = db.Column(GUID(), db.ForeignKey('users.id'), nullable=False)
    doctor_id = db.Column(GUID(), db.ForeignKey('users.id'), nullable=False)
    appointment_date = db.Column(db.Date, nullable=False)
    appointment_time = db.Column(db.Time, nullable=False)
    reason = db.Column(db.Text, nullable=False)
    status = db.Column(db.String(50), default=AppointmentStatus.SCHEDULED)
    notes = db.Column(db.Text)
    meeting_link = db.Column(db.String(500))
    is_video_call = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': str(self.id),
            'patient_id': str(self.patient_id),
            'doctor_id': str(self.doctor_id),
            'patient_name': self.patient.full_name,
            'doctor_name': self.doctor.full_name,
            'appointment_date': self.appointment_date.isoformat(),
            'appointment_time': self.appointment_time.isoformat(),
            'reason': self.reason,
            'status': self.status,
            'notes': self.notes,
            'is_video_call': self.is_video_call,
            'created_at': self.created_at.isoformat(),
        }


class MedicalReport(db.Model):
    """Medical report model"""
    __tablename__ = 'medical_reports'
    
    id = db.Column(GUID(), primary_key=True, default=uuid.uuid4)
    patient_id = db.Column(GUID(), db.ForeignKey('users.id'), nullable=False)
    doctor_id = db.Column(GUID(), db.ForeignKey('users.id'))
    report_type = db.Column(db.String(50), nullable=False)
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    file_url = db.Column(db.String(500), nullable=False)
    file_path = db.Column(db.String(500))
    file_size = db.Column(db.Integer)
    mime_type = db.Column(db.String(100))
    ai_summary = db.Column(db.Text)
    summary_confidence = db.Column(db.Float)
    is_summarized = db.Column(db.Boolean, default=False)
    tags = db.Column(db.String(500))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': str(self.id),
            'patient_id': str(self.patient_id),
            'doctor_id': str(self.doctor_id) if self.doctor_id else None,
            'report_type': self.report_type,
            'title': self.title,
            'description': self.description,
            'file_url': self.file_url,
            'ai_summary': self.ai_summary,
            'is_summarized': self.is_summarized,
            'summary_confidence': self.summary_confidence,
            'created_at': self.created_at.isoformat(),
        }


class Prescription(db.Model):
    """Prescription model"""
    __tablename__ = 'prescriptions'
    
    id = db.Column(GUID(), primary_key=True, default=uuid.uuid4)
    patient_id = db.Column(GUID(), db.ForeignKey('users.id'), nullable=False)
    doctor_id = db.Column(GUID(), db.ForeignKey('users.id'), nullable=False)
    prescribed_date = db.Column(db.Date, nullable=False, default=datetime.utcnow().date)
    expiry_date = db.Column(db.Date)
    status = db.Column(db.String(50), default=PrescriptionStatus.ACTIVE)
    instructions = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    medications = db.relationship('Medication', backref='prescription', cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': str(self.id),
            'patient_id': str(self.patient_id),
            'doctor_id': str(self.doctor_id),
            'patient_name': self.patient.full_name,
            'doctor_name': self.doctor.full_name,
            'prescribed_date': self.prescribed_date.isoformat(),
            'expiry_date': self.expiry_date.isoformat() if self.expiry_date else None,
            'status': self.status,
            'instructions': self.instructions,
            'medications': [med.to_dict() for med in self.medications],
            'created_at': self.created_at.isoformat(),
        }


class Medication(db.Model):
    """Medication in a prescription"""
    __tablename__ = 'medications'
    
    id = db.Column(GUID(), primary_key=True, default=uuid.uuid4)
    prescription_id = db.Column(GUID(), db.ForeignKey('prescriptions.id'), nullable=False)
    name = db.Column(db.String(255), nullable=False)
    dosage = db.Column(db.String(100), nullable=False)
    frequency = db.Column(db.String(100), nullable=False)
    duration = db.Column(db.String(100), nullable=False)
    quantity = db.Column(db.Integer)
    route = db.Column(db.String(100))  # Oral, IV, Topical, etc.
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': str(self.id),
            'name': self.name,
            'dosage': self.dosage,
            'frequency': self.frequency,
            'duration': self.duration,
            'quantity': self.quantity,
            'route': self.route,
            'notes': self.notes,
        }


class SymptomAnalysis(db.Model):
    """Symptom analysis history"""
    __tablename__ = 'symptom_analysis'
    
    id = db.Column(GUID(), primary_key=True, default=uuid.uuid4)
    user_id = db.Column(GUID(), db.ForeignKey('users.id'))
    symptoms = db.Column(db.Text, nullable=False)  # JSON array
    analysis_result = db.Column(db.Text, nullable=False)  # JSON
    severity = db.Column(db.String(50))
    urgency = db.Column(db.String(50))
    confidence_score = db.Column(db.Float)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        import json
        return {
            'id': str(self.id),
            'symptoms': json.loads(self.symptoms) if isinstance(self.symptoms, str) else self.symptoms,
            'analysis': json.loads(self.analysis_result) if isinstance(self.analysis_result, str) else self.analysis_result,
            'severity': self.severity,
            'urgency': self.urgency,
            'confidence_score': self.confidence_score,
            'created_at': self.created_at.isoformat(),
        }


class AuditLog(db.Model):
    """Audit log for tracking user actions"""
    __tablename__ = 'audit_logs'
    
    id = db.Column(GUID(), primary_key=True, default=uuid.uuid4)
    user_id = db.Column(GUID(), db.ForeignKey('users.id'))
    action = db.Column(db.String(255), nullable=False)
    resource_type = db.Column(db.String(100))
    resource_id = db.Column(db.String(255))
    details = db.Column(db.Text)
    ip_address = db.Column(db.String(50))
    user_agent = db.Column(db.String(500))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': str(self.id),
            'user_id': str(self.user_id) if self.user_id else None,
            'action': self.action,
            'resource_type': self.resource_type,
            'resource_id': self.resource_id,
            'created_at': self.created_at.isoformat(),
        }
