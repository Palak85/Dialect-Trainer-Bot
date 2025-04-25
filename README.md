# Dialect Trainer Bot

A web-based language learning application that helps users improve their pronunciation in multiple languages using speech recognition technology.

## Features

- Multi-language support (English, Hindi, Spanish, German, French, Arabic)
- Three difficulty levels (Beginner, Intermediate, Advanced)
- Real-time pronunciation feedback
- Progress tracking
- User authentication
- Responsive design

## Setup Instructions

1. Install Python 3.8 or higher
2. Install required packages:
   ```bash
   pip install -r requirements.txt
   ```
3. Run the Flask application:
   ```bash
   python app.py
   ```
4. Open your browser and navigate to `http://localhost:5000`

## Project Structure

```
dialecttrainerbot/
├── app.py              # Flask application
├── requirements.txt    # Python dependencies
├── data.json          # Language data
├── static/
│   ├── styles.css     # CSS styles
│   └── script.js      # JavaScript functionality
└── templates/
    ├── index.html     # Main application page
    └── login.html     # Login page
```

## Technologies Used

- Frontend: HTML5, CSS3, JavaScript
- Backend: Python, Flask
- Speech Recognition: Web Speech API
- Data Storage: LocalStorage

## Usage

1. Register/Login to your account
2. Select a language and difficulty level
3. Practice pronunciation with real-time feedback
4. Track your progress through the dashboard
5. View your enrolled courses and completion status

## Notes

- Requires a modern browser with Web Speech API support
- Microphone access is required for pronunciation practice
- Progress is saved locally in the browser

## License

This project is licensed under the MIT License. 
