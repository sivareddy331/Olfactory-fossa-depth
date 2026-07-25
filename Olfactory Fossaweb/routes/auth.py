from flask import Blueprint, render_template, redirect, url_for, flash, request, session, current_app
from flask_login import login_user, logout_user, login_required, current_user
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def generate_password_hash(password):
    return pwd_context.hash(password)

def check_password_hash(hashed_password, password):
    return pwd_context.verify(password, hashed_password)
from flask_mail import Message
from models.models import db, User, PasswordResetCode
import random
import string
from datetime import datetime, timedelta

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('dashboard.index'))
    
    if request.method == 'POST':
        email = request.form.get('email', '').strip().lower()
        password = request.form.get('password')
        
        user = User.query.filter((User.email == email) | (User.username == email)).first()
        if user and check_password_hash(user.hashed_password, password):
            login_user(user)
            flash('Logged in successfully.', 'success')
            return redirect(url_for('dashboard.index'))
        else:
            flash('Invalid email or password.', 'danger')
            
    return render_template('login.html')

def validate_credentials(email, password, is_new_password_optional=False):
    if any(c.isupper() for c in email):
        return False, "Email must be in all small (lowercase) letters."
        
    if is_new_password_optional and not password:
        return True, ""
        
    if len(password) < 8:
        return False, "Password must be at least 8 characters long."
        
    if not (any(c.islower() for c in password) and 
            any(c.isupper() for c in password) and 
            any(c.isdigit() for c in password)):
        return False, "Password must contain a mix of small letters, capital letters, and numbers."
        
    return True, ""

@auth_bp.route('/register', methods=['GET', 'POST'])
def register():
    if current_user.is_authenticated:
        return redirect(url_for('dashboard.index'))
        
    if request.method == 'POST':
        username = request.form.get('username')
        email = request.form.get('email')
        password = request.form.get('password')
        full_name = request.form.get('full_name')
        
        # Validation
        valid, msg = validate_credentials(email, password)
        if not valid:
            flash(msg, 'danger')
            return redirect(url_for('auth.register'))
            
        if User.query.filter_by(username=username).first():
            flash('Username already exists.', 'danger')
            return redirect(url_for('auth.register'))
        if User.query.filter_by(email=email).first():
            flash('Email already registered.', 'danger')
            return redirect(url_for('auth.register'))
            
        hashed_password = generate_password_hash(password)
        new_user = User(username=username, email=email, hashed_password=hashed_password, full_name=full_name)
        db.session.add(new_user)
        db.session.commit()
        
        flash('Account created successfully. Please login.', 'success')
        return redirect(url_for('auth.login'))
        
    return render_template('register.html')

@auth_bp.route('/forgot-password', methods=['GET', 'POST'])
def forgot_password():
    if request.method == 'POST':
        email = request.form.get('email')
        user = User.query.filter_by(email=email).first()
        if user:
            # Invalidate any existing unused codes
            PasswordResetCode.query.filter_by(user_id=user.id, used=False).update({'used': True})
            
            # Generate 6-digit code
            code = ''.join(random.choices(string.digits, k=6))
            expires_at = datetime.utcnow() + timedelta(minutes=15)
            
            reset_code = PasswordResetCode(user_id=user.id, code=code, expires_at=expires_at)
            db.session.add(reset_code)
            db.session.commit()
            
            email_sent = False
            # Try to send email
            try:
                mail = current_app.extensions.get('mail')
                msg = Message('FossaWeb Password Reset Code', recipients=[user.email])
                msg.body = f"Your password reset code is: {code}\nThis code will expire in 15 minutes."
                if mail:
                    mail.send(msg)
                    email_sent = True
                    flash('A validation code has been sent to your email.', 'info')
            except Exception as e:
                print(f"Email send failed: {e}")
            
            if not email_sent:
                # Show code directly on the verification page
                session['display_code'] = code
                flash(f'Your verification code is shown below (email delivery unavailable).', 'info')
                
            session['reset_email'] = user.email
            return redirect(url_for('auth.verify_code'))
        else:
            flash('Email not found.', 'danger')
    return render_template('login.html', forgot=True)

@auth_bp.route('/verify-code', methods=['GET', 'POST'])
def verify_code():
    email = session.get('reset_email')
    if not email:
        flash('Session expired. Please request a new code.', 'warning')
        return redirect(url_for('auth.forgot_password'))
        
    if request.method == 'POST':
        code = request.form.get('code')
        user = User.query.filter_by(email=email).first()
        
        if user:
            reset_code = PasswordResetCode.query.filter_by(
                user_id=user.id, 
                code=code, 
                used=False
            ).order_by(PasswordResetCode.created_at.desc()).first()
            
            if reset_code:
                if datetime.utcnow() > reset_code.expires_at:
                    flash('Validation code has expired. Please request a new one.', 'danger')
                else:
                    reset_code.used = True
                    db.session.commit()
                    session['reset_verified'] = True
                    flash('Code verified. Please set your new password.', 'success')
                    return redirect(url_for('auth.reset_password'))
            else:
                flash('Invalid validation code.', 'danger')
        else:
            flash('Error verifying code.', 'danger')
            
    display_code = session.get('display_code')
    if request.method == 'POST':
        # Clear displayed code from session after user attempts to use it
        session.pop('display_code', None)
        display_code = None
    return render_template('verify_code.html', email=email, display_code=display_code)

@auth_bp.route('/reset-password', methods=['GET', 'POST'])
def reset_password():
    email = session.get('reset_email')
    verified = session.get('reset_verified')
    
    if not email or not verified:
        flash('Unauthorized access. Please verify your code first.', 'danger')
        return redirect(url_for('auth.forgot_password'))
        
    if request.method == 'POST':
        password = request.form.get('password')
        confirm_password = request.form.get('confirm_password')
        
        if password != confirm_password:
            flash('Passwords do not match.', 'danger')
            return redirect(url_for('auth.reset_password'))
            
        valid, msg = validate_credentials(email, password)
        if not valid:
            flash(msg, 'danger')
            return redirect(url_for('auth.reset_password'))
            
        user = User.query.filter_by(email=email).first()
        if user:
            user.hashed_password = generate_password_hash(password)
            db.session.commit()
            
            # Clear session
            session.pop('reset_email', None)
            session.pop('reset_verified', None)
            
            flash('Password reset successfully. You can now login.', 'success')
            return redirect(url_for('auth.login'))
        else:
            flash('Error resetting password.', 'danger')
            
    return render_template('reset_password.html')

@auth_bp.route('/logout')
@login_required
def logout():
    logout_user()
    flash('Logged out successfully.', 'info')
    return redirect(url_for('auth.login'))

@auth_bp.route('/profile', methods=['GET', 'POST'])
@login_required
def profile():
    if request.method == 'POST':
        full_name = request.form.get('full_name')
        email = request.form.get('email')
        new_password = request.form.get('password')
        
        # Validate profile credentials update
        valid, msg = validate_credentials(email, new_password, is_new_password_optional=True)
        if not valid:
            flash(msg, 'danger')
            return redirect(url_for('auth.profile'))
            
        # Check if email is already taken by someone else
        existing_user = User.query.filter_by(email=email).first()
        if existing_user and existing_user.id != current_user.id:
            flash('Email already in use by another account.', 'danger')
            return redirect(url_for('auth.profile'))
            
        current_user.full_name = full_name
        current_user.email = email
        if new_password:
            current_user.hashed_password = generate_password_hash(new_password)
            
        db.session.commit()
        flash('Profile updated successfully.', 'success')
        return redirect(url_for('auth.profile'))
    return render_template('profile.html')
