from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, create_refresh_token, jwt_required, get_jwt_identity
from app import db
from models import User, UserRole
from datetime import datetime, timedelta
from functools import wraps

bp = Blueprint('auth', __name__)

@bp.route('/register', methods=['POST'])
def register():
    """Register a new user"""
    data = request.get_json()
    
    # Validate input
    if not data or not all(k in data for k in ['email', 'password', 'first_name', 'last_name', 'role']):
        return {'error': 'Missing required fields'}, 400
    
    # Check if user exists
    if User.query.filter_by(email=data['email']).first():
        return {'error': 'Email already registered'}, 409
    
    # Validate role
    if data['role'] not in [UserRole.PATIENT, UserRole.DOCTOR, UserRole.ADMIN]:
        return {'error': 'Invalid role'}, 400
    
    try:
        # Create new user
        user = User(
            email=data['email'],
            first_name=data['first_name'],
            last_name=data['last_name'],
            phone=data.get('phone'),
            role=data['role'],
            is_active=True
        )
        user.set_password(data['password'])
        
        db.session.add(user)
        db.session.commit()
        
        # Generate tokens
        access_token = create_access_token(identity=str(user.id))
        refresh_token = create_refresh_token(identity=str(user.id))
        
        return {
            'success': True,
            'message': 'User registered successfully',
            'user': user.to_dict(),
            'access_token': access_token,
            'refresh_token': refresh_token
        }, 201
    
    except Exception as e:
        db.session.rollback()
        return {'error': str(e)}, 500


@bp.route('/login', methods=['POST'])
def login():
    """Login user"""
    data = request.get_json()
    
    if not data or not all(k in data for k in ['email', 'password']):
        return {'error': 'Missing email or password'}, 400
    
    # Find user (case-insensitive email)
    from sqlalchemy import func
    user = User.query.filter(func.lower(User.email) == func.lower(data['email'])).first()
    
    if not user or not user.check_password(data['password']):
        return {'error': 'Invalid email or password'}, 401
    
    if not user.is_active:
        return {'error': 'User account is inactive'}, 403
    
    # Generate tokens
    access_token = create_access_token(identity=str(user.id))
    refresh_token = create_refresh_token(identity=str(user.id))
    
    return {
        'success': True,
        'message': 'Login successful',
        'user': user.to_dict(),
        'access_token': access_token,
        'refresh_token': refresh_token
    }, 200


@bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    """Refresh access token"""
    identity = get_jwt_identity()
    access_token = create_access_token(identity=identity)
    
    return {
        'success': True,
        'access_token': access_token
    }, 200


@bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    """Get current authenticated user"""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user:
        return {'error': 'User not found'}, 404
    
    return {
        'success': True,
        'user': user.to_dict(include_sensitive=True)
    }, 200


@bp.route('/change-password', methods=['POST'])
@jwt_required()
def change_password():
    """Change user password"""
    user_id = get_jwt_identity()
    data = request.get_json()
    
    if not data or not all(k in data for k in ['current_password', 'new_password']):
        return {'error': 'Missing required fields'}, 400
    
    user = User.query.get(user_id)
    
    if not user:
        return {'error': 'User not found'}, 404
    
    if not user.check_password(data['current_password']):
        return {'error': 'Current password is incorrect'}, 401
    
    try:
        user.set_password(data['new_password'])
        db.session.commit()
        
        return {
            'success': True,
            'message': 'Password changed successfully'
        }, 200
    
    except Exception as e:
        db.session.rollback()
        return {'error': str(e)}, 500


@bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    """Logout user (token blacklisting would go here)"""
    return {
        'success': True,
        'message': 'Logged out successfully'
    }, 200


@bp.route('/verify-email', methods=['POST'])
def verify_email():
    """Verify email address"""
    data = request.get_json()
    
    if not data or 'token' not in data:
        return {'error': 'Missing verification token'}, 400
    
    # In production, verify the token
    # For now, just mark as verified
    
    return {
        'success': True,
        'message': 'Email verified successfully'
    }, 200


@bp.route('/forgot-password', methods=['POST'])
def forgot_password():
    """Request password reset"""
    data = request.get_json()
    
    if not data or 'email' not in data:
        return {'error': 'Missing email'}, 400
    
    user = User.query.filter_by(email=data['email']).first()
    
    if not user:
        # Don't reveal if email exists (security best practice)
        return {
            'success': True,
            'message': 'If email exists, reset link sent'
        }, 200
    
    # In production, send reset email
    # For now, just return success
    
    return {
        'success': True,
        'message': 'Password reset email sent'
    }, 200


@bp.route('/reset-password', methods=['POST'])
def reset_password():
    """Reset password with token"""
    data = request.get_json()
    
    if not data or not all(k in data for k in ['token', 'new_password']):
        return {'error': 'Missing required fields'}, 400
    
    # In production, verify the token and find user
    # For now, just return success
    
    return {
        'success': True,
        'message': 'Password reset successful'
    }, 200
