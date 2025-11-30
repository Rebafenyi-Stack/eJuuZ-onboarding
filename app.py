import os
import requests
import sqlite3
from flask import Flask, request, jsonify, send_from_directory
from datetime import datetime
from dotenv import load_dotenv
from typing import Dict, Any

# Load environment variables from a .env file (recommended for security)
load_dotenv()

# --- CONFIGURATION (Ensure you set these in your .env file or replace placeholders) ---
SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://qumhwyndxapbaxahmotq.supabase.co")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY", "sb_publishable_dswT5lB2HO7DXDG6q3IYnQ_wq5NNZM2")
TARGET_RECEIVING_EMAIL = os.environ.get("TARGET_EMAIL", "rebafenyi@ejuuz.com")

# Formspree configuration
FORMSPREE_ENDPOINT = os.environ.get("FORMSPREE_ENDPOINT", "https://formspree.io/f/mvgegyyn")

# Firebase configuration (you'll need to set up Firebase and get your credentials)
FIREBASE_CREDENTIALS_PATH = os.environ.get("FIREBASE_CREDENTIALS_PATH", "path/to/serviceAccountKey.json")

# SQLite database path
SQLITE_DB_PATH = os.environ.get("SQLITE_DB_PATH", "ejuuz_onboarding.db")

# --- INITIALIZATION ---
app = Flask(__name__, static_folder='.')

# Initialize SQLite database
def init_sqlite_db():
    conn = sqlite3.connect(SQLITE_DB_PATH)
    cursor = conn.cursor()
    
    # Create tables for each role
    tables = {
        'traders': '''
            CREATE TABLE IF NOT EXISTS traders (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                trader_name TEXT,
                trader_id_number TEXT,
                whatsapp TEXT,
                email TEXT,
                trader_business_name TEXT,
                trader_category TEXT,
                trader_description TEXT,
                trader_bank_name TEXT,
                trader_account_number TEXT,
                trader_upload_id TEXT,
                trader_upload_business_doc TEXT,
                trader_consent_tcs BOOLEAN,
                submission_date TEXT
            )
        ''',
        'businesses': '''
            CREATE TABLE IF NOT EXISTS businesses (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                biz_name TEXT,
                biz_reg_number TEXT,
                biz_owner_name TEXT,
                biz_owner_id TEXT,
                biz_address TEXT,
                whatsapp TEXT,
                email TEXT,
                biz_category TEXT,
                biz_description TEXT,
                biz_bank_name TEXT,
                biz_account_number TEXT,
                biz_upload_reg TEXT,
                biz_consent_tcs BOOLEAN,
                submission_date TEXT
            )
        ''',
        'ngos': '''
            CREATE TABLE IF NOT EXISTS ngos (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                ngo_organization_name TEXT,
                ngo_registration_number TEXT,
                ngo_contact_person TEXT,
                ngo_contact_role TEXT,
                whatsapp TEXT,
                email TEXT,
                ngo_physical_address TEXT,
                ngo_type TEXT,
                ngo_purpose TEXT,
                ngo_upload_certificate TEXT,
                ngo_consent_legitimacy BOOLEAN,
                submission_date TEXT
            )
        ''',
        'drivers': '''
            CREATE TABLE IF NOT EXISTS drivers (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                driver_name TEXT,
                license_number TEXT,
                vehicle_reg TEXT,
                whatsapp TEXT,
                email TEXT,
                vehicle_type TEXT,
                delivery_area TEXT,
                upload_license TEXT,
                driver_consent_tcs BOOLEAN,
                submission_date TEXT
            )
        ''',
        'shoppers': '''
            CREATE TABLE IF NOT EXISTS shoppers (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                shopper_name TEXT,
                shopper_id_number TEXT,
                whatsapp TEXT,
                email TEXT,
                shopper_delivery_address TEXT,
                shopper_preferences TEXT,
                shopper_consent_tcs BOOLEAN,
                submission_date TEXT
            )
        '''
    }
    
    for table_name, create_table_sql in tables.items():
        cursor.execute(create_table_sql)
    
    conn.commit()
    conn.close()
    print("SQLite database initialized successfully.")

# Initialize Firebase (optional - only if Firebase credentials are provided)
firebase_initialized = False
try:
    import firebase_admin
    from firebase_admin import credentials, firestore
    
    if os.path.exists(FIREBASE_CREDENTIALS_PATH):
        cred = credentials.Certificate(FIREBASE_CREDENTIALS_PATH)
        firebase_admin.initialize_app(cred)
        db = firestore.client()
        firebase_initialized = True
        print("Firebase initialized successfully.")
    else:
        print("Firebase credentials file not found. Firebase integration disabled.")
except ImportError:
    print("Firebase admin SDK not installed. Firebase integration disabled.")
except Exception as e:
    print(f"Error initializing Firebase: {e}")

# Initialize SQLite database
init_sqlite_db()

# --- ROUTES FOR SERVING HTML FILES ---
@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/<path:filename>')
def serve_static_files(filename):
    """Serve static files including HTML, CSS, JS, and images"""
    if filename.endswith('.html') or filename.endswith('.css') or filename.endswith('.js') or filename.startswith('images/'):
        return send_from_directory('.', filename)
    else:
        return send_from_directory('.', 'index.html')

# --- HELPER FUNCTIONS ---

def send_formspree_email(role: str, data: Dict[str, Any]) -> bool:
    """Sends the form data to Formspree."""
    try:
        # Prepare data for Formspree
        payload = {
            "role": role,
            "submission_date": datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
        }
        payload.update(data)
        
        # Send to Formspree
        response = requests.post(FORMSPREE_ENDPOINT, data=payload)
        response.raise_for_status()
        print(f"Formspree submission successful for {role}.")
        return True
    except requests.exceptions.RequestException as e:
        print(f"Error sending to Formspree for {role}: {e}")
        return False

def save_to_sqlite(role: str, data: Dict[str, Any]) -> bool:
    """Save form data to SQLite database."""
    try:
        conn = sqlite3.connect(SQLITE_DB_PATH)
        cursor = conn.cursor()
        
        # Map roles to tables
        table_map = {
            'trader': 'traders', 
            'business': 'businesses', 
            'ngo': 'ngos', 
            'driver': 'drivers', 
            'shopper': 'shoppers'
        }
        table_name = table_map.get(role, 'unknown_submissions')
        
        # Prepare columns and values
        columns = ', '.join(data.keys())
        placeholders = ', '.join(['?' for _ in data])
        values = list(data.values())
        
        # Insert data
        insert_sql = f"INSERT INTO {table_name} ({columns}) VALUES ({placeholders})"
        cursor.execute(insert_sql, values)
        
        conn.commit()
        conn.close()
        print(f"Data saved to SQLite for {role}.")
        return True
    except Exception as e:
        print(f"Error saving to SQLite for {role}: {e}")
        return False

def save_to_firebase(role: str, data: Dict[str, Any]) -> bool:
    """Save form data to Firebase Firestore."""
    if not firebase_initialized:
        print("Firebase not initialized. Skipping Firebase save.")
        return False
        
    try:
        # Map roles to collections
        collection_map = {
            'trader': 'traders', 
            'business': 'businesses', 
            'ngo': 'ngos', 
            'driver': 'drivers', 
            'shopper': 'shoppers'
        }
        collection_name = collection_map.get(role, 'unknown_submissions')
        
        # Add timestamp
        data_with_timestamp = data.copy()
        data_with_timestamp['submission_date'] = datetime.now().isoformat()
        
        # Save to Firestore
        doc_ref = db.collection(collection_name).document()
        doc_ref.set(data_with_timestamp)
        
        print(f"Data saved to Firebase for {role}.")
        return True
    except Exception as e:
        print(f"Error saving to Firebase for {role}: {e}")
        return False

# --- FLASK ENDPOINT ---

@app.route('/submit-onboarding', methods=['POST'])
def submit_onboarding():
    """Handles form submission to SQLite, Firebase, and Formspree."""
    
    # Handle both JSON and form data
    if request.is_json:
        data = request.json
    else:
        data = request.form.to_dict()
    
    role = data.get('role', 'unknown')
    
    if not role or role == 'unknown':
        return jsonify({'message': 'Missing user role.'}), 400

    try:
        # Remove the role field from data as it's metadata
        data_copy = data.copy()
        if 'role' in data_copy:
            del data_copy['role']
            
        # 1. Save to SQLite
        sqlite_success = save_to_sqlite(role, data_copy)
        
        # 2. Save to Firebase (if available)
        firebase_success = save_to_firebase(role, data_copy)
        
        # 3. Send to Formspree
        formspree_success = send_formspree_email(role, data_copy)

        return jsonify({
            'message': 'Submission successful!',
            'sqlite_status': 'Saved' if sqlite_success else 'Failed',
            'firebase_status': 'Saved' if firebase_success else 'Skipped/Failed',
            'formspree_status': 'Sent' if formspree_success else 'Failed'
        }), 200

    except Exception as e:
        print(f"Server error during submission: {e}")
        return jsonify({'message': 'Internal Server Error', 'error': 'Could not save data or send email.'}), 500

if __name__ == '__main__':
    # Start the Flask server on port 5000 (separate from the frontend server)
    app.run(host='0.0.0.0', port=5000, debug=True)