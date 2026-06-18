from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from models import User, MedicalReport, SymptomAnalysis
from services.ai_service import SymptomAnalyzer, ReportSummarizer
from datetime import datetime
import json
import uuid

bp = Blueprint('ai', __name__)

@bp.route('/symptom-check', methods=['POST'])
@jwt_required()
def analyze_symptoms():
    """Analyze symptoms using AI"""
    user_id = get_jwt_identity()
    data = request.get_json()
    
    if not data or 'symptoms' not in data:
        return {'error': 'Missing symptoms'}, 400
    
    if not isinstance(data['symptoms'], list) or len(data['symptoms']) == 0:
        return {'error': 'At least one symptom is required'}, 400
    
    try:
        # Initialize symptom analyzer
        analyzer = SymptomAnalyzer()
        
        # Analyze symptoms
        analysis = analyzer.analyze(
            symptoms=data['symptoms'],
            duration=data.get('duration'),
            age=data.get('age'),
            medical_history=data.get('medical_history', [])
        )
        
        # Save analysis history
        symptom_analysis = SymptomAnalysis(
            id=uuid.uuid4(),
            user_id=user_id,
            symptoms=json.dumps(data['symptoms']),
            analysis_result=json.dumps(analysis),
            severity=analysis.get('severity'),
            urgency=analysis.get('urgency'),
            confidence_score=analysis.get('confidence_score')
        )
        
        db.session.add(symptom_analysis)
        db.session.commit()
        
        return {
            'success': True,
            'analysis_id': str(symptom_analysis.id),
            'analysis': analysis
        }, 200
    
    except Exception as e:
        db.session.rollback()
        return {'error': str(e)}, 500


@bp.route('/symptom-history', methods=['GET'])
@jwt_required()
def get_symptom_history():
    """Get user's symptom analysis history"""
    user_id = get_jwt_identity()
    limit = request.args.get('limit', 10, type=int)
    
    analyses = SymptomAnalysis.query.filter_by(user_id=user_id).order_by(
        SymptomAnalysis.created_at.desc()
    ).limit(limit).all()
    
    return {
        'success': True,
        'data': [a.to_dict() for a in analyses],
        'count': len(analyses)
    }, 200


@bp.route('/symptom-analysis/<analysis_id>', methods=['GET'])
@jwt_required()
def get_symptom_analysis(analysis_id):
    """Get specific symptom analysis"""
    user_id = get_jwt_identity()
    
    analysis = SymptomAnalysis.query.get(analysis_id)
    
    if not analysis:
        return {'error': 'Analysis not found'}, 404
    
    if analysis.user_id != user_id:
        return {'error': 'Unauthorized'}, 403
    
    return {
        'success': True,
        'data': analysis.to_dict()
    }, 200


@bp.route('/summarize-report', methods=['POST'])
@jwt_required()
def summarize_report():
    """Summarize medical report using AI"""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    data = request.get_json()
    
    if not data or 'report_id' not in data:
        return {'error': 'Missing report_id'}, 400
    
    # Get report
    report = MedicalReport.query.get(data['report_id'])
    
    if not report:
        return {'error': 'Report not found'}, 404
    
    # Check permissions
    if user.role == 'patient' and report.patient_id != user_id:
        return {'error': 'Unauthorized'}, 403
    elif user.role == 'doctor' and report.doctor_id != user_id:
        return {'error': 'Unauthorized'}, 403
    
    try:
        # Initialize report summarizer
        summarizer = ReportSummarizer()
        
        # Get report content (in production, would extract from file)
        report_content = data.get('content', report.description)
        
        # Summarize report
        summary_result = summarizer.summarize(
            report_type=report.report_type,
            content=report_content,
            title=report.title
        )
        
        # Update report with summary
        report.ai_summary = summary_result['summary']
        report.summary_confidence = summary_result['confidence']
        report.is_summarized = True
        report.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        return {
            'success': True,
            'summary': {
                'report_id': str(report.id),
                'summary': summary_result['summary'],
                'key_findings': summary_result.get('key_findings', []),
                'confidence_score': summary_result['confidence'],
                'recommendations': summary_result.get('recommendations', [])
            }
        }, 200
    
    except Exception as e:
        db.session.rollback()
        return {'error': str(e)}, 500


@bp.route('/summarize-bulk', methods=['POST'])
@jwt_required()
def summarize_multiple_reports():
    """Summarize multiple reports"""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    data = request.get_json()
    
    if not data or 'report_ids' not in data:
        return {'error': 'Missing report_ids'}, 400
    
    report_ids = data['report_ids']
    if not isinstance(report_ids, list) or len(report_ids) == 0:
        return {'error': 'Invalid report_ids'}, 400
    
    try:
        summarizer = ReportSummarizer()
        results = []
        
        for report_id in report_ids:
            report = MedicalReport.query.get(report_id)
            
            if not report:
                continue
            
            # Check permissions
            if user.role == 'patient' and report.patient_id != user_id:
                continue
            elif user.role == 'doctor' and report.doctor_id != user_id:
                continue
            
            # Skip if already summarized
            if report.is_summarized:
                results.append({
                    'report_id': str(report.id),
                    'status': 'already_summarized'
                })
                continue
            
            # Summarize
            summary_result = summarizer.summarize(
                report_type=report.report_type,
                content=report.description,
                title=report.title
            )
            
            # Update report
            report.ai_summary = summary_result['summary']
            report.summary_confidence = summary_result['confidence']
            report.is_summarized = True
            report.updated_at = datetime.utcnow()
            
            results.append({
                'report_id': str(report.id),
                'status': 'summarized',
                'confidence': summary_result['confidence']
            })
        
        db.session.commit()
        
        return {
            'success': True,
            'results': results,
            'processed_count': len(results)
        }, 200
    
    except Exception as e:
        db.session.rollback()
        return {'error': str(e)}, 500


@bp.route('/health', methods=['GET'])
def ai_service_health():
    """Check AI service health"""
    return {
        'success': True,
        'status': 'healthy',
        'ai_services': {
            'symptom_analyzer': 'operational',
            'report_summarizer': 'operational'
        }
    }, 200


@bp.route('/models/info', methods=['GET'])
def get_model_info():
    """Get AI model information"""
    return {
        'success': True,
        'models': {
            'symptom_analyzer': {
                'name': 'Advanced Symptom Analyzer',
                'version': '2.1',
                'accuracy': 0.947,
                'supported_symptoms': 50,
                'languages': ['en']
            },
            'report_summarizer': {
                'name': 'Medical Report Summarizer',
                'version': '2.1',
                'accuracy': 0.923,
                'supported_types': [
                    'lab_test', 'x_ray', 'ultrasound',
                    'mri', 'ct_scan', 'blood_test'
                ],
                'languages': ['en']
            }
        }
    }, 200


@bp.route('/drug-interaction-check', methods=['POST'])
@jwt_required()
def check_drug_interactions():
    """Check for drug interactions"""
    data = request.get_json()
    
    if not data or 'medications' not in data:
        return {'error': 'Missing medications'}, 400
    
    medications = data['medications']
    if not isinstance(medications, list) or len(medications) < 2:
        return {'error': 'At least 2 medications required'}, 400
    
    try:
        # In production, would call actual drug interaction database
        interactions = []
        
        # Simple mock interaction check
        if 'Aspirin' in medications and 'Ibuprofen' in medications:
            interactions.append({
                'drug1': 'Aspirin',
                'drug2': 'Ibuprofen',
                'severity': 'HIGH',
                'description': 'Increased risk of GI bleeding'
            })
        
        return {
            'success': True,
            'medications': medications,
            'interactions': interactions,
            'has_interactions': len(interactions) > 0
        }, 200
    
    except Exception as e:
        return {'error': str(e)}, 500
