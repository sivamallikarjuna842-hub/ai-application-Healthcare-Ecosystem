#!/usr/bin/env python
"""Database initialization script"""

from app import create_app, db
from models import User, UserRole, DoctorProfile
from datetime import datetime
import uuid

def init_database():
    """Initialize database with tables"""
    app = create_app()
    
    with app.app_context():
        print("Creating database tables...")
        db.create_all()
        print("[OK] Database tables created successfully")
        
        # Check if demo users exist
        if not User.query.filter_by(email='patient@example.com').first():
            print("\nCreating demo users...")
            
            # Demo Patient
            patient = User(
                id=uuid.uuid4(),
                email='patient@example.com',
                first_name='John',
                last_name='Doe',
                phone='+1-555-0100',
                gender='Male',
                role=UserRole.PATIENT,
                is_active=True,
                email_verified=True
            )
            patient.set_password('demo')
            db.session.add(patient)
            
            # Demo Doctor
            doctor = User(
                id=uuid.uuid4(),
                email='doctor@example.com',
                first_name='Sarah',
                last_name='Johnson',
                phone='+1-555-0200',
                gender='Female',
                role=UserRole.DOCTOR,
                is_active=True,
                email_verified=True
            )
            doctor.set_password('demo')
            db.session.add(doctor)
            
            db.session.commit()
            
            # Create doctor profile
            doctor_profile = DoctorProfile(
                id=uuid.uuid4(),
                user_id=doctor.id,
                license_number='MD-12345',
                specialty='General Medicine',
                bio='Experienced general practitioner with 10+ years of practice',
                experience_years=10,
                qualification='MD from State University',
                hospital_affiliation='City Medical Center',
                consultation_fee=50.0,
                is_verified=True
            )
            db.session.add(doctor_profile)
            db.session.commit()
            
            print("[OK] Demo users created:")
            print(f"  - Patient: {patient.email} (password: demo)")
            print(f"  - Doctor: {doctor.email} (password: demo)")
        
        print("\n[OK] Database initialization complete!")


def seed_database():
    """Seed database with sample data"""
    app = create_app()
    
    with app.app_context():
        from models import Appointment, MedicalReport, Prescription, Medication
        from datetime import date, time
        
        # Get demo users
        patient = User.query.filter_by(email='patient@example.com').first()
        doctor = User.query.filter_by(email='doctor@example.com').first()
        
        if not patient or not doctor:
            print("Demo users not found. Run init_database() first.")
            return
        
        # Create sample appointments if none exist
        if not Appointment.query.first():
            print("\nSeeding sample appointments...")
            
            appointment = Appointment(
                id=uuid.uuid4(),
                patient_id=patient.id,
                doctor_id=doctor.id,
                appointment_date=date(2024, 1, 20),
                appointment_time=time(10, 0),
                reason='Regular checkup and health consultation',
                status='scheduled'
            )
            db.session.add(appointment)
            db.session.commit()
            print("[OK] Sample appointment created")
        
        # Create sample medical report if none exist
        if not MedicalReport.query.first():
            print("Seeding sample medical reports...")
            
            report = MedicalReport(
                id=uuid.uuid4(),
                patient_id=patient.id,
                doctor_id=doctor.id,
                report_type='blood_test',
                title='Complete Blood Count',
                description='Routine blood work showing normal levels',
                file_url='/uploads/reports/cbc-2024-01-10.pdf',
                file_path='cbc-2024-01-10.pdf',
                file_size=150000,
                mime_type='application/pdf'
            )
            db.session.add(report)
            db.session.commit()
            print("[OK] Sample medical report created")
        
        # Create sample prescription if none exist
        if not Prescription.query.first():
            print("Seeding sample prescriptions...")
            
            prescription = Prescription(
                id=uuid.uuid4(),
                patient_id=patient.id,
                doctor_id=doctor.id,
                prescribed_date=date(2024, 1, 15),
                status='active',
                instructions='Take with food. Avoid alcohol.',
                expiry_date=date(2024, 2, 15)
            )
            db.session.add(prescription)
            
            # Add medications
            medication1 = Medication(
                id=uuid.uuid4(),
                prescription_id=prescription.id,
                name='Lisinopril',
                dosage='10mg',
                frequency='Once daily',
                duration='30 days',
                quantity=30,
                route='Oral'
            )
            
            medication2 = Medication(
                id=uuid.uuid4(),
                prescription_id=prescription.id,
                name='Aspirin',
                dosage='100mg',
                frequency='Once daily',
                duration='30 days',
                quantity=30,
                route='Oral'
            )
            
            db.session.add(medication1)
            db.session.add(medication2)
            db.session.commit()
            print("[OK] Sample prescription created with medications")
        
        print("\n[OK] Database seeding complete!")


if __name__ == '__main__':
    print("Healthcare Ecosystem - Database Initialization\n")
    
    try:
        init_database()
        seed_database()
        print("\nAll done! Ready to start the application.")
    except Exception as e:
        print(f"\nError: {str(e)}")
        raise
