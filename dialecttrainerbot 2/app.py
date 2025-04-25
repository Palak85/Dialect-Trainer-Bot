from flask import Flask, render_template, request, jsonify, session, redirect, url_for
from flask_session import Session
import json
import os
from datetime import datetime

app = Flask(__name__)
app.config['SECRET_KEY'] = os.urandom(24)
app.config['SESSION_TYPE'] = 'filesystem'
app.config['PERMANENT_SESSION_LIFETIME'] = datetime.timedelta(days=7)  # Session lasts 7 days
Session(app)

# Load word database
with open('data.json', 'r', encoding='utf-8') as f:
    word_database = json.load(f)

# User database (in production, use a proper database)
users = {}

@app.route('/')
def index():
    # Check if user is logged in
    if 'username' not in session:
        return render_template('login.html')
    return render_template('index.html', username=session['username'])

@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    
    if username in users and users[username]['password'] == password:
        session['username'] = username
        session.permanent = True  # Make the session permanent
        return jsonify({'success': True})
    return jsonify({'success': False, 'message': 'Invalid credentials'})

@app.route('/signup', methods=['POST'])
def signup():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    
    if username in users:
        return jsonify({'success': False, 'message': 'Username already exists'})
    
    users[username] = {
        'password': password,
        'courses': [],
        'progress': {}
    }
    session['username'] = username
    session.permanent = True  # Make the session permanent
    return jsonify({'success': True})

@app.route('/logout')
def logout():
    session.clear()  # Clear all session data
    return redirect(url_for('index'))

@app.route('/check_session')
def check_session():
    if 'username' in session:
        return jsonify({'logged_in': True, 'username': session['username']})
    return jsonify({'logged_in': False})

@app.route('/get_words')
def get_words():
    language = request.args.get('language')
    level = request.args.get('level')
    
    if language in word_database and level in word_database[language]:
        return jsonify(word_database[language][level])
    return jsonify([])

@app.route('/update_progress', methods=['POST'])
def update_progress():
    if 'username' not in session:
        return jsonify({'success': False})
    
    data = request.get_json()
    language = data.get('language')
    level = data.get('level')
    progress = data.get('progress')
    
    if 'progress' not in users[session['username']]:
        users[session['username']]['progress'] = {}
    
    users[session['username']]['progress'][f"{language}_{level}"] = progress
    return jsonify({'success': True})

@app.route('/get_progress')
def get_progress():
    if 'username' not in session:
        return jsonify({'progress': 0})
    
    language = request.args.get('language')
    level = request.args.get('level')
    
    progress = users[session['username']]['progress'].get(f"{language}_{level}", 0)
    return jsonify({'progress': progress})

@app.route('/enroll_course', methods=['POST'])
def enroll_course():
    if 'username' not in session:
        return jsonify({'success': False})
    
    data = request.get_json()
    language = data.get('language')
    level = data.get('level')
    
    course = f"{language}_{level}"
    if course not in users[session['username']]['courses']:
        users[session['username']]['courses'].append(course)
    
    return jsonify({'success': True})

@app.route('/get_enrolled_courses')
def get_enrolled_courses():
    if 'username' not in session:
        return jsonify({'courses': []})
    
    return jsonify({'courses': users[session['username']]['courses']})

if __name__ == '__main__':
    app.run(debug=True) 