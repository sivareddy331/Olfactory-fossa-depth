import os
from flask import Flask, redirect, url_for
from flask_login import LoginManager
from flask_mail import Mail
from models.models import db, User
from routes.auth import auth_bp
from routes.dashboard import dashboard_bp
from routes.patient import patient_bp
from routes.analysis import analysis_bp
from dotenv import load_dotenv

# Load environment variables from .env file if present
load_dotenv()

# Define root paths
BASE_DIR = os.path.abspath(os.path.dirname(__file__))

app = Flask(__name__)
app.config['SECRET_KEY'] = 'olfactory-fossa-secret-key-12345'
app.config['SQLALCHEMY_DATABASE_URI'] = f"sqlite:///{os.path.abspath(os.path.join(BASE_DIR, '..', 'olfactory_shared.db'))}"
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Mail configuration (Real SMTP Setup via .env)
app.config['MAIL_SERVER'] = 'smtp.gmail.com'
app.config['MAIL_PORT'] = 465
app.config['MAIL_USE_TLS'] = False
app.config['MAIL_USE_SSL'] = True
app.config['MAIL_USERNAME'] = os.environ.get('MAIL_USERNAME', 'dummy@example.com')
app.config['MAIL_PASSWORD'] = os.environ.get('MAIL_PASSWORD', 'dummy-password')
app.config['MAIL_DEFAULT_SENDER'] = os.environ.get('MAIL_DEFAULT_SENDER', 'noreply@fossaweb.com')

# Initialize Mail
mail = Mail(app)

# Setup folder directories
app.config['UPLOAD_FOLDER'] = os.path.join(BASE_DIR, 'uploads')
app.config['REPORTS_FOLDER'] = os.path.join(BASE_DIR, 'reports')

# Initialize DB
db.init_app(app)

# Initialize Login Manager
login_manager = LoginManager()
login_manager.login_view = 'auth.login'
login_manager.login_message_category = 'info'
login_manager.init_app(app)

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

# Register Blueprints
app.register_blueprint(auth_bp)
app.register_blueprint(dashboard_bp)
app.register_blueprint(patient_bp)
app.register_blueprint(analysis_bp)

# Redirect core base path to dashboard (which handles login redirect automatically)
@app.route('/index')
def index_redirect():
    return redirect(url_for('dashboard.index'))

# Ensure DB tables exist and upload folders are initialized
with app.app_context():
    db.create_all()
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
    os.makedirs(app.config['REPORTS_FOLDER'], exist_ok=True)
    os.makedirs(os.path.join(app.root_path, 'static', 'uploads'), exist_ok=True)

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
