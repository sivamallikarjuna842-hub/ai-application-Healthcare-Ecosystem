from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from models import MedicalReport, User, ReportType
from datetime import datetime
from werkzeug.utils import secure_filename
import uuid
import os
from services.storage_service import StorageService

bp = Blueprint('reports', __name__)

@bp.route('', methods=['GET'])
@jwt_required()
def get_reports():
    """Get medical reports for user"""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user:
        return {'error': 'User not found'}, 404
    
    # Patients can only see their own reports
    if user.role == 'patient':
        reports = MedicalReport.query.filter_by(patient_id=user_id).all()
    else:
        # Doctors can see reports for their patients
        patient_id = request.args.get('patient_id')
        if patient_id:
            reports = MedicalReport.query.filter_by(patient_id=patient_id).all()
        else:
            reports = MedicalReport.query.all()
    
    # Optional filters
    report_type = request.args.get('report_type')
    if report_type:
        reports = [r for r in reports if r.report_type == report_type]
    
    return {
        'success': True,
        'data': [r.to_dict() for r in reports],
        'count': len(reports)
    }, 200


@bp.route('/<report_id>', methods=['GET'])
@jwt_required()
def get_report(report_id):
    """Get specific report"""
    user_id = get_jwt_identity()
    report = MedicalReport.query.get(report_id)
    
    if not report:
        return {'error': 'Report not found'}, 404
    
    # Check access permissions
    user = User.query.get(user_id)
    if user.role == 'patient' and report.patient_id != user_id:
        return {'error': 'Unauthorized'}, 403
    
    return {
        'success': True,
        'data': report.to_dict()
    }, 200


@bp.route('', methods=['POST'])
@jwt_required()
def upload_report():
    """Upload medical report"""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user or user.role != 'doctor':
        return {'error': 'Only doctors can upload reports'}, 403
    
    # Validate form data
    if 'file' not in request.files:
        return {'error': 'No file provided'}, 400
    
    file = request.files['file']
    if file.filename == '':
        return {'error': 'No file selected'}, 400
    
    # Validate file type
    if not allowed_file(file.filename):
        return {'error': 'File type not allowed'}, 400
    
    # Check file size
    file.seek(0, os.SEEK_END)
    file_size = file.tell()
    file.seek(0)
    
    if file_size > current_app.config['MAX_FILE_SIZE']:
        return {'error': 'File size exceeds limit'}, 400
    
    # Get form data
    form_data = {
        'patient_id': request.form.get('patient_id'),
        'report_type': request.form.get('report_type'),
        'title': request.form.get('title'),
        'description': request.form.get('description'),
        'tags': request.form.get('tags')
    }
    
    # Validate required fields
    if not all(form_data[k] for k in ['patient_id', 'report_type', 'title']):
        return {'error': 'Missing required fields'}, 400
    
    # Validate patient exists
    patient = User.query.get(form_data['patient_id'])
    if not patient:
        return {'error': 'Patient not found'}, 404
    
    # Validate report type
    valid_types = [ReportType.LAB_TEST, ReportType.X_RAY, ReportType.ULTRASOUND,
                   ReportType.MRI, ReportType.CT_SCAN, ReportType.BLOOD_TEST, ReportType.OTHER]
    if form_data['report_type'] not in valid_types:
        return {'error': 'Invalid report type'}, 400
    
    try:
        # Save file
        filename = secure_filename(f"{uuid.uuid4()}_{file.filename}")
        storage_service = StorageService(current_app.config)
        file_url = storage_service.upload_file(file, filename, form_data['report_type'])
        
        # Create report record
        report = MedicalReport(
            id=uuid.uuid4(),
            patient_id=form_data['patient_id'],
            doctor_id=user_id,
            report_type=form_data['report_type'],
            title=form_data['title'],
            description=form_data['description'],
            file_url=file_url,
            file_path=filename,
            file_size=file_size,
            mime_type=file.content_type,
            tags=form_data['tags']
        )
        
        db.session.add(report)
        db.session.commit()
        
        return {
            'success': True,
            'message': 'Report uploaded successfully',
            'data': report.to_dict()
        }, 201
    
    except Exception as e:
        db.session.rollback()
        return {'error': str(e)}, 500


@bp.route('/<report_id>', methods=['PUT'])
@jwt_required()
def update_report(report_id):
    """Update report"""
    user_id = get_jwt_identity()
    data = request.get_json()
    
    report = MedicalReport.query.get(report_id)
    
    if not report:
        return {'error': 'Report not found'}, 404
    
    # Check permissions (only doctor who uploaded can update)
    if report.doctor_id != user_id:
        return {'error': 'Unauthorized'}, 403
    
    try:
        if 'title' in data:
            report.title = data['title']
        if 'description' in data:
            report.description = data['description']
        if 'tags' in data:
            report.tags = data['tags']
        if 'ai_summary' in data:
            report.ai_summary = data['ai_summary']
            report.is_summarized = True
        if 'summary_confidence' in data:
            report.summary_confidence = data['summary_confidence']
        
        report.updated_at = datetime.utcnow()
        db.session.commit()
        
        return {
            'success': True,
            'message': 'Report updated successfully',
            'data': report.to_dict()
        }, 200
    
    except Exception as e:
        db.session.rollback()
        return {'error': str(e)}, 500


@bp.route('/<report_id>', methods=['DELETE'])
@jwt_required()
def delete_report(report_id):
    """Delete report"""
    user_id = get_jwt_identity()
    
    report = MedicalReport.query.get(report_id)
    
    if not report:
        return {'error': 'Report not found'}, 404
    
    # Check permissions (only doctor who uploaded can delete)
    if report.doctor_id != user_id:
        return {'error': 'Unauthorized'}, 403
    
    try:
        # Delete from storage
        storage_service = StorageService(current_app.config)
        storage_service.delete_file(report.file_path)
        
        # Delete from database
        db.session.delete(report)
        db.session.commit()
        
        return {
            'success': True,
            'message': 'Report deleted successfully'
        }, 200
    
    except Exception as e:
        db.session.rollback()
        return {'error': str(e)}, 500


@bp.route('/<report_id>/download', methods=['GET'])
@jwt_required()
def download_report(report_id):
    """Generate download link for report"""
    user_id = get_jwt_identity()
    
    report = MedicalReport.query.get(report_id)
    
    if not report:
        return {'error': 'Report not found'}, 404
    
    # Check access
    user = User.query.get(user_id)
    if user.role == 'patient' and report.patient_id != user_id:
        return {'error': 'Unauthorized'}, 403
    
    return {
        'success': True,
        'download_url': report.file_url
    }, 200


@bp.route('/stats', methods=['GET'])
@jwt_required()
def get_report_stats():
    """Get report statistics"""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user:
        return {'error': 'User not found'}, 404
    
    if user.role == 'doctor':
        total = MedicalReport.query.filter_by(doctor_id=user_id).count()
        summarized = MedicalReport.query.filter_by(doctor_id=user_id, is_summarized=True).count()
    else:
        total = MedicalReport.query.filter_by(patient_id=user_id).count()
        summarized = MedicalReport.query.filter_by(patient_id=user_id, is_summarized=True).count()
    
    # Count by type
    by_type = {}
    for type_val in [ReportType.LAB_TEST, ReportType.X_RAY, ReportType.ULTRASOUND,
                     ReportType.MRI, ReportType.CT_SCAN, ReportType.BLOOD_TEST]:
        if user.role == 'doctor':
            count = MedicalReport.query.filter_by(doctor_id=user_id, report_type=type_val).count()
        else:
            count = MedicalReport.query.filter_by(patient_id=user_id, report_type=type_val).count()
        if count > 0:
            by_type[type_val] = count
    
    return {
        'success': True,
        'stats': {
            'total_reports': total,
            'summarized_reports': summarized,
            'by_type': by_type
        }
    }, 200


def allowed_file(filename):
    """Check if file extension is allowed"""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in current_app.config['ALLOWED_EXTENSIONS']
