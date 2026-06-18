import os
import logging
from flask import Flask
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from config import config
from datetime import datetime

# Initialize extensions
db = SQLAlchemy()
jwt = JWTManager()

def create_app(config_name=None):
    """Application factory"""
    if config_name is None:
        config_name = os.getenv('FLASK_ENV', 'development')
    
    app = Flask(__name__)
    
    # Load configuration
    app.config.from_object(config[config_name])
    
    # Initialize extensions
    db.init_app(app)
    jwt.init_app(app)
    CORS(app, origins=app.config['CORS_ORIGINS'])
    
    # Setup logging
    setup_logging(app)
    
    # Register blueprints
    register_blueprints(app)
    
    # Register error handlers
    register_error_handlers(app)
    
    # Create tables
    with app.app_context():
        db.create_all()
    
    # Health check route
    @app.route('/health', methods=['GET'])
    def health_check():
        return {
            'status': 'healthy',
            'timestamp': datetime.utcnow().isoformat(),
            'environment': app.config['FLASK_ENV']
        }, 200
    
    return app


def register_blueprints(app):
    """Register all API blueprints"""
    from routes import auth_routes, appointment_routes, report_routes, \
                       prescription_routes, user_routes, doctor_routes, \
                       ai_routes, dashboard_routes
    
    # Auth routes
    app.register_blueprint(auth_routes.bp, url_prefix='/api/auth')
    
    # User routes
    app.register_blueprint(user_routes.bp, url_prefix='/api/users')
    app.register_blueprint(user_routes.patient_bp, url_prefix='/api/patients')
    app.register_blueprint(user_routes.doctor_bp, url_prefix='/api/doctors')
    
    # Appointment routes
    app.register_blueprint(appointment_routes.bp, url_prefix='/api/appointments')
    
    # Report routes
    app.register_blueprint(report_routes.bp, url_prefix='/api/reports')
    
    # Prescription routes
    app.register_blueprint(prescription_routes.bp, url_prefix='/api/prescriptions')
    
    # Dashboard routes
    app.register_blueprint(dashboard_routes.bp, url_prefix='/api/dashboard')
    
    # AI routes
    app.register_blueprint(ai_routes.bp, url_prefix='/api/ai')


def register_error_handlers(app):
    """Register error handlers"""
    
    @app.errorhandler(400)
    def bad_request(error):
        return {'error': 'Bad request', 'message': str(error)}, 400
    
    @app.errorhandler(401)
    def unauthorized(error):
        return {'error': 'Unauthorized', 'message': 'Authentication required'}, 401
    
    @app.errorhandler(403)
    def forbidden(error):
        return {'error': 'Forbidden', 'message': 'Access denied'}, 403
    
    @app.errorhandler(404)
    def not_found(error):
        return {'error': 'Not found', 'message': 'Resource not found'}, 404
    
    @app.errorhandler(500)
    def internal_error(error):
        db.session.rollback()
        return {'error': 'Server error', 'message': 'Internal server error'}, 500


def setup_logging(app):
    """Setup application logging"""
    if not app.debug:
        if not os.path.exists('logs'):
            os.mkdir('logs')
        
        file_handler = logging.FileHandler(app.config['LOG_FILE'])
        file_handler.setLevel(logging.INFO)
        
        formatter = logging.Formatter(
            '%(asctime)s %(levelname)s: %(message)s [in %(pathname)s:%(lineno)d]'
        )
        file_handler.setFormatter(formatter)
        
        app.logger.addHandler(file_handler)
        app.logger.setLevel(logging.INFO)
        app.logger.info('Healthcare Ecosystem API startup')


if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, host='0.0.0.0', port=5000)
