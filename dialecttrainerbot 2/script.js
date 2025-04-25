// Global variables
let currentUser = null;
let selectedLanguage = null;
let selectedLevel = null;
let currentWordIndex = 0;
let languageData = null;
let recognition = null;
let progress = {
    currentIndex: 0,
    completedWords: [],
    overall: 0,
    currentAttempts: 0,
    wordHistory: {}
};

// Language codes mapping
const languageCodes = {
    en: 'en-US',
    hi: 'hi-IN',
    es: 'es-ES',
    de: 'de-DE',
    fr: 'fr-FR',
    ar: 'ar-SA'
};

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    // Load language data first
    fetch('data.json')
        .then(response => response.json())
        .then(data => {
            languageData = data.levels; // Store the levels data
            setupAuthHandlers();
            setupLanguageSelection();
            setupVoiceRecognition();
            setupSpeechSynthesis();
            setupRecordingControls();
            setupNavigation();
            setupLevelSelection();
            checkSessionStatus();
        })
        .catch(error => console.error('Error loading language data:', error));
});

// Authentication handling
function setupAuthHandlers() {
    const loginToggle = document.getElementById('login-toggle');
    const signupToggle = document.getElementById('signup-toggle');
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const loginBtn = document.getElementById('login-btn');
    const registerBtn = document.getElementById('register-btn');
    const passwordToggle = document.getElementById('password-toggle');
    const signupPasswordToggle = document.getElementById('signup-password-toggle');
    const confirmPasswordToggle = document.getElementById('confirm-password-toggle');

    // Toggle between login and signup forms
    loginToggle.addEventListener('click', () => {
        loginToggle.classList.add('active');
        signupToggle.classList.remove('active');
        loginForm.classList.remove('hidden');
        signupForm.classList.add('hidden');
    });

    signupToggle.addEventListener('click', () => {
        signupToggle.classList.add('active');
        loginToggle.classList.remove('active');
        signupForm.classList.remove('hidden');
        loginForm.classList.add('hidden');
    });

    // Password visibility toggle for login form
    passwordToggle.addEventListener('click', () => {
        const passwordInput = document.getElementById('password-input');
        const icon = passwordToggle.querySelector('i');
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            icon.classList.remove('fa-eye');
            icon.classList.add('fa-eye-slash');
        } else {
            passwordInput.type = 'password';
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
        }
    });

    // Password visibility toggle for signup form
    signupPasswordToggle.addEventListener('click', () => {
        const passwordInput = document.getElementById('signup-password');
        const icon = signupPasswordToggle.querySelector('i');
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            icon.classList.remove('fa-eye');
            icon.classList.add('fa-eye-slash');
        } else {
            passwordInput.type = 'password';
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
        }
    });

    // Password visibility toggle for confirm password
    confirmPasswordToggle.addEventListener('click', () => {
        const passwordInput = document.getElementById('confirm-password');
        const icon = confirmPasswordToggle.querySelector('i');
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            icon.classList.remove('fa-eye');
            icon.classList.add('fa-eye-slash');
        } else {
            passwordInput.type = 'password';
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
        }
    });

    // Login handler
    loginBtn.addEventListener('click', () => {
        const username = document.getElementById('username-input').value;
        const password = document.getElementById('password-input').value;
        
        if (username && password) {
            currentUser = username;
            document.getElementById('auth-section').classList.add('hidden');
            document.getElementById('dashboard-section').classList.remove('hidden');
            document.getElementById('welcome-username').textContent = `Welcome, ${username}!`;
            
            // Speak welcome message
            speakWelcomeMessage();
            
            // Load user's courses and progress
            const userCourses = JSON.parse(localStorage.getItem(`courses_${currentUser}`)) || [];
            if (userCourses.length > 0) {
                // Calculate average progress across all courses
                const totalProgress = userCourses.reduce((sum, course) => sum + course.progress, 0);
                const averageProgress = Math.round(totalProgress / userCourses.length);
                
                // Update dashboard progress
                const dashboardProgress = document.querySelector('.dashboard-progress');
                dashboardProgress.innerHTML = `
                    <div class="progress-header">
                        <h3>Overall Progress</h3>
                        <div class="progress-stats">
                            <span class="completed-courses">${userCourses.length} courses</span>
                            <span class="progress-percentage">${averageProgress}% Complete</span>
                        </div>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${averageProgress}%"></div>
                    </div>
                    <div class="progress-details">
                        <div class="detail-item">
                            <span class="detail-label">Total Courses:</span>
                            <span class="detail-value">${userCourses.length}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Average Progress:</span>
                            <span class="detail-value">${averageProgress}%</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Last Updated:</span>
                            <span class="detail-value">${new Date().toLocaleDateString()}</span>
                        </div>
                    </div>
                `;
            } else {
                // Initialize new user progress
                const dashboardProgress = document.querySelector('.dashboard-progress');
                dashboardProgress.innerHTML = `
                    <div class="progress-header">
                        <h3>Overall Progress</h3>
                        <div class="progress-stats">
                            <span class="completed-courses">0 courses</span>
                            <span class="progress-percentage">0% Complete</span>
                        </div>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: 0%"></div>
                    </div>
                    <div class="progress-details">
                        <div class="detail-item">
                            <span class="detail-label">Get Started:</span>
                            <span class="detail-value">Select a language to begin!</span>
                        </div>
                    </div>
                `;
            }
        } else {
            alert('Please enter both username and password');
        }
    });

    // Register handler
    registerBtn.addEventListener('click', () => {
        const username = document.getElementById('signup-username').value;
        const password = document.getElementById('signup-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;
        
        if (!username || !password || !confirmPassword) {
            alert('Please fill in all fields');
            return;
        }
        
        if (password !== confirmPassword) {
            alert('Passwords do not match');
            return;
        }
        
        // Store user credentials
        const users = JSON.parse(localStorage.getItem('users')) || {};
        if (users[username]) {
            alert('Username already exists');
            return;
        }
        
        users[username] = { password };
        localStorage.setItem('users', JSON.stringify(users));
        
        // Switch to login form
        loginToggle.click();
        document.getElementById('username-input').value = username;
        document.getElementById('password-input').value = password;
        
        alert('Registration successful! Please login.');
    });

    // Logout functionality
    document.getElementById('logout-btn').addEventListener('click', () => {
        currentUser = null;
        document.getElementById('dashboard-section').classList.add('hidden');
        document.getElementById('auth-section').classList.remove('hidden');
        document.querySelector('input[type="text"]').value = '';
        document.querySelector('input[type="password"]').value = '';
    });

    // Handle My Courses button
    document.getElementById('enrolled-courses-btn').addEventListener('click', () => {
        const enrolledCoursesSection = document.getElementById('enrolled-courses-section');
        const currentProgress = document.querySelector('.current-progress');
        
        if (enrolledCoursesSection.classList.contains('hidden')) {
            enrolledCoursesSection.classList.remove('hidden');
            currentProgress.classList.add('hidden');
            updateEnrolledCourses();
        } else {
            enrolledCoursesSection.classList.add('hidden');
            currentProgress.classList.remove('hidden');
        }
    });

    // Handle Back button
    document.getElementById('back-btn').addEventListener('click', () => {
        const enrolledCoursesSection = document.getElementById('enrolled-courses-section');
        const currentProgress = document.querySelector('.current-progress');
        
        enrolledCoursesSection.classList.add('hidden');
        currentProgress.classList.remove('hidden');
    });
}

// Language selection handling
function setupLanguageSelection() {
    document.querySelectorAll('.language-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            selectedLanguage = btn.dataset.lang;
            document.querySelectorAll('.language-btn').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            
            // Show level selection
            document.getElementById('level-section').classList.remove('hidden');
            document.getElementById('practice-section').classList.add('hidden');
            
            // Reset progress for new language
            progress = {
                currentIndex: 0,
                completedWords: [],
                overall: 0,
                currentAttempts: 0,
                wordHistory: {}
            };
            
            // Update progress display
            document.querySelector('.progress-text').textContent = '0% Complete';
            document.querySelector('.progress-fill').style.width = '0%';
            
            // Update welcome message based on selected language
            updateWelcomeMessage();
        });
    });
}

function updateWelcomeMessage() {
    const welcomeQuote = document.getElementById('welcome-quote');
    const quotes = {
        en: "Ready to master English? Let's begin!",
        hi: "हिंदी सीखने के लिए तैयार हैं? चलिए शुरू करें!",
        es: "¿Listo para aprender español? ¡Empecemos!",
        de: "Bereit, Deutsch zu lernen? Lass uns anfangen!",
        fr: "Prêt à apprendre le français? Commençons!",
        ar: "هل أنت مستعد لتعلم العربية؟ دعنا نبدأ!"
    };
    
    welcomeQuote.textContent = quotes[selectedLanguage] || quotes.en;
}

// Speech recognition setup
function setupVoiceRecognition() {
    if ('webkitSpeechRecognition' in window) {
        recognition = new webkitSpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.maxAlternatives = 5;

        // Set language based on selection
        const languageCodes = {
            en: 'en-US',
            hi: 'hi-IN',
            es: 'es-ES',
            de: 'de-DE',
            fr: 'fr-FR',
            ar: 'ar-SA'
        };
        
        // Set language and ensure proper initialization
        recognition.lang = languageCodes[selectedLanguage] || 'en-US';
        
        // For Hindi, ensure proper initialization
        if (selectedLanguage === 'hi') {
            recognition.lang = 'hi-IN';
            // Add additional configuration for Hindi
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.maxAlternatives = 10;
        }

        recognition.onresult = (event) => {
            const results = event.results[0];
            const alternatives = Array.from(results).map(result => result.transcript.toLowerCase());
            const currentWord = document.getElementById('current-word').textContent.toLowerCase();
            
            // Calculate accuracy with language-specific handling
            let bestAccuracy = 0;
            let bestMatch = '';
            
            for (const transcript of alternatives) {
                const accuracy = calculateAccuracy(transcript, currentWord, selectedLanguage);
                if (accuracy > bestAccuracy) {
                    bestAccuracy = accuracy;
                    bestMatch = transcript;
                }
            }
            
            // Update feedback with varied messages and accuracy percentage
            const feedback = document.getElementById('feedback');
            const improvementMsg = getImprovementMessage(bestAccuracy, currentWord);
            feedback.innerHTML = `
                <div class="feedback-message">${getFeedbackMessage(bestAccuracy)}</div>
                <div class="accuracy-display">
                    <div class="accuracy-bar">
                        <div class="accuracy-fill" style="width: ${bestAccuracy}%"></div>
                    </div>
                    <div class="accuracy-text">Pronunciation Accuracy: ${bestAccuracy}%</div>
                </div>
                <div class="improvement-message">${improvementMsg}</div>
                <div class="attempts-counter">Attempts: ${progress.currentAttempts || 0}/3</div>
            `;
            feedback.classList.remove('hidden');
            
            // Increment attempt counter
            progress.currentAttempts = (progress.currentAttempts || 0) + 1;
            
            // Check if word is completed (either by accuracy or attempts)
            if (bestAccuracy >= 70 || progress.currentAttempts >= 3) {
                if (!progress.completedWords.includes(currentWordIndex)) {
                    progress.completedWords.push(currentWordIndex);
                    progress.currentAttempts = 0; // Reset attempts for next word
                    updateProgress(); // Update progress display
                }
                
                // Move to next word if available
                if (currentWordIndex < languageData[selectedLevel][selectedLanguage].length - 1) {
                    currentWordIndex++;
                    updateWordDisplay();
                }
            }
            
            // Save word accuracy to history
            saveWordAccuracy(currentWord, bestAccuracy);
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            const feedback = document.getElementById('feedback');
            feedback.innerHTML = `
                <div class="error-message">Sorry, I couldn't hear that. Please try again.</div>
            `;
            feedback.classList.remove('hidden');
        };

        recognition.onstart = () => {
            console.log('Speech recognition started for language:', recognition.lang);
        };

        recognition.onend = () => {
            console.log('Speech recognition ended');
            // For Hindi, restart recognition if it ended
            if (selectedLanguage === 'hi') {
                setTimeout(() => {
                    recognition.start();
                }, 100);
            }
        };
    }
}

// Calculate accuracy between user's speech and target word with language-specific handling
function calculateAccuracy(transcript, targetWord, language) {
    // Normalize the text based on language
    const normalizedTranscript = normalizeText(transcript, language);
    const normalizedTarget = normalizeText(targetWord, language);
    
    // For Spanish, implement stricter matching
    if (language === 'es') {
        // Split into words and compare each word
        const transcriptWords = normalizedTranscript.split(/\s+/);
        const targetWords = normalizedTarget.split(/\s+/);
        
        let correctWords = 0;
        for (let i = 0; i < Math.min(transcriptWords.length, targetWords.length); i++) {
            if (transcriptWords[i] === targetWords[i]) {
                correctWords++;
            }
        }
        
        // Calculate word-level accuracy
        const wordAccuracy = (correctWords / targetWords.length) * 100;
        
        // Add character-level accuracy for more precision
        const transcriptChars = normalizedTranscript.split('');
        const targetChars = normalizedTarget.split('');
        let correctChars = 0;
        for (let i = 0; i < Math.min(transcriptChars.length, targetChars.length); i++) {
            if (transcriptChars[i] === targetChars[i]) {
                correctChars++;
            }
        }
        
        const charAccuracy = (correctChars / targetChars.length) * 100;
        
        // Return the average of word and character accuracy
        return Math.round((wordAccuracy + charAccuracy) / 2);
    }
    
    // For Hindi, implement more lenient matching
    if (language === 'hi') {
        // Remove all spaces and compare
        const cleanTranscript = normalizedTranscript.replace(/\s+/g, '');
        const cleanTarget = normalizedTarget.replace(/\s+/g, '');
        
        // Calculate character-level accuracy with fuzzy matching
        const transcriptChars = cleanTranscript.split('');
        const targetChars = cleanTarget.split('');
        
        let correctChars = 0;
        for (let i = 0; i < Math.min(transcriptChars.length, targetChars.length); i++) {
            if (transcriptChars[i] === targetChars[i]) {
                correctChars++;
            }
        }
        
        // Add bonus for partial matches and word length similarity
        const partialMatches = transcriptChars.filter(char => targetChars.includes(char)).length;
        const lengthSimilarity = 1 - Math.abs(transcriptChars.length - targetChars.length) / Math.max(transcriptChars.length, targetChars.length);
        
        // More lenient scoring for Hindi
        return Math.round(((correctChars + (partialMatches * 0.7) + (lengthSimilarity * 15)) / targetChars.length) * 100);
    }
    
    // Default accuracy calculation for other languages
    const transcriptChars = normalizedTranscript.split('');
    const targetChars = normalizedTarget.split('');
    
    let correctChars = 0;
    for (let i = 0; i < Math.min(transcriptChars.length, targetChars.length); i++) {
        if (transcriptChars[i] === targetChars[i]) {
            correctChars++;
        }
    }
    
    const partialMatches = transcriptChars.filter(char => targetChars.includes(char)).length;
    const lengthSimilarity = 1 - Math.abs(transcriptChars.length - targetChars.length) / Math.max(transcriptChars.length, targetChars.length);
    
    return Math.round(((correctChars + (partialMatches * 0.5) + (lengthSimilarity * 10)) / targetChars.length) * 100);
}

// Normalize text based on language
function normalizeText(text, language) {
    switch(language) {
        case 'hi':
            // For Hindi, remove diacritics and normalize to basic characters
            return text.normalize('NFKD')
                .replace(/[\u0300-\u036f]/g, '')
                .replace(/[\u0900-\u097F]/g, char => char.normalize('NFKD')[0])
                .replace(/\s+/g, '');
        case 'es':
            // For Spanish, handle accents and special characters
            return text.normalize('NFKD')
                .replace(/[\u0300-\u036f]/g, '')
                .toLowerCase()
                .trim();
        case 'ar':
            // For Arabic, normalize to basic characters
            return text.normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
        default:
            // For other languages, just convert to lowercase
            return text.toLowerCase().trim();
    }
}

// Get appropriate feedback message based on accuracy
function getFeedbackMessage(accuracy) {
    const highAccuracyMessages = [
        "Perfect pronunciation! You're a natural! 🎉",
        "Amazing! Your accent is spot on! 🌟",
        "Incredible! You've mastered this word! 🏆",
        "Outstanding! Your pronunciation is flawless! 💫",
        "Brilliant! You sound like a native speaker! 🎯",
        "Superb! Your pronunciation is perfect! 🌟",
        "Excellent! You've nailed it! 🎯",
        "Fantastic! Your accent is amazing! 💫",
        "Wonderful! You're a language pro! 🏆",
        "Impressive! Your pronunciation is perfect! 🌟"
    ];

    const mediumAccuracyMessages = [
        "Good job! You're getting better! 👍",
        "Nice try! Keep practicing! 💪",
        "You're improving! Almost there! 🚀",
        "Good effort! A little more practice! 🌱",
        "Well done! You're on the right track! 🎯",
        "Not bad! You're making progress! 🌟",
        "Keep going! You're doing great! 💪",
        "You're getting there! Keep it up! 🚀",
        "Good attempt! Practice makes perfect! 🌱",
        "Nice work! You're improving! 🎯"
    ];

    const lowAccuracyMessages = [
        "Let's try again! You can do it! 💪",
        "Practice makes perfect! Try once more! 🌟",
        "Don't give up! You're learning! 🌱",
        "Keep going! Every attempt counts! 🎯",
        "You're getting there! Try again! 🚀",
        "No worries! Let's try one more time! 💪",
        "Keep practicing! You'll get it! 🌟",
        "Don't be discouraged! Try again! 🌱",
        "You're learning! That's what matters! 🎯",
        "Every attempt brings you closer! 🚀"
    ];

    if (accuracy >= 90) {
        return highAccuracyMessages[Math.floor(Math.random() * highAccuracyMessages.length)];
    } else if (accuracy >= 70) {
        return mediumAccuracyMessages[Math.floor(Math.random() * mediumAccuracyMessages.length)];
    } else {
        return lowAccuracyMessages[Math.floor(Math.random() * lowAccuracyMessages.length)];
    }
}

// Speech synthesis setup
function setupSpeechSynthesis() {
    const listenBtn = document.getElementById('listen-btn');
    listenBtn.addEventListener('click', () => {
        const currentWord = document.getElementById('current-word').textContent;
        const speech = new SpeechSynthesisUtterance(currentWord);
        
        // Set language based on selection
        const languageCodes = {
            en: 'en-US',
            hi: 'hi-IN',
            es: 'es-ES',
            de: 'de-DE',
            fr: 'fr-FR',
            ar: 'ar-SA'
        };
        
        speech.lang = languageCodes[selectedLanguage] || 'en-US';
        speech.volume = 1;
        speech.rate = 1;
        speech.pitch = 1;
        
        // Try to find a voice that matches the selected language
        const voices = window.speechSynthesis.getVoices();
        const languageVoice = voices.find(voice => voice.lang.startsWith(languageCodes[selectedLanguage]));
        if (languageVoice) {
            speech.voice = languageVoice;
        }
        
        window.speechSynthesis.speak(speech);
    });
}

// Recording controls
function setupRecordingControls() {
    const recordBtn = document.getElementById('record-btn');
    const listeningIndicator = document.getElementById('listening-indicator');
    let isRecording = false;
    
    recordBtn.addEventListener('click', () => {
        if (recognition) {
            // Check if attempts are exhausted
            if (progress.currentAttempts >= 3) {
                const feedback = document.getElementById('feedback');
                feedback.innerHTML = `
                    <div class="error-message">
                        <i class="fas fa-exclamation-circle"></i>
                        No attempts left for this word. Moving to next word...
                    </div>
                `;
                feedback.classList.remove('hidden');
                
                // Disable record button
                recordBtn.disabled = true;
                recordBtn.classList.add('disabled');
                
                // Add the word to completed words if not already there
                if (!progress.completedWords.includes(currentWordIndex)) {
                    progress.completedWords.push(currentWordIndex);
                    progress.currentAttempts = 0; // Reset attempts for next word
                    updateProgress();
                }
                
                // Move to next word after a short delay
                setTimeout(() => {
                    if (currentWordIndex < languageData[selectedLevel][selectedLanguage].length - 1) {
                        currentWordIndex++;
                        updateWordDisplay();
                        // Re-enable record button for new word
                        recordBtn.disabled = false;
                        recordBtn.classList.remove('disabled');
                    }
                }, 2000);
                return;
            }
            
            if (!isRecording) {
                // Start recording
                recognition.start();
                recordBtn.classList.add('recording');
                recordBtn.innerHTML = '<i class="fas fa-stop mr-2"></i>Stop Recording';
                listeningIndicator.classList.remove('hidden');
                isRecording = true;
                
                // Hide previous feedback
                document.getElementById('feedback').classList.add('hidden');
            } else {
                // Stop recording
                recognition.stop();
                recordBtn.classList.remove('recording');
                recordBtn.innerHTML = '<i class="fas fa-microphone mr-2"></i>Start Recording';
                listeningIndicator.classList.add('hidden');
                isRecording = false;
            }
        }
    });

    recognition.onstart = () => {
        document.getElementById('feedback').classList.add('hidden');
    };

    recognition.onend = () => {
        if (isRecording) {
            recordBtn.classList.remove('recording');
            recordBtn.innerHTML = '<i class="fas fa-microphone mr-2"></i>Start Recording';
            listeningIndicator.classList.add('hidden');
            isRecording = false;
        }
    };
}

// Navigation
function setupNavigation() {
    document.getElementById('prev-word').addEventListener('click', () => {
        if (currentWordIndex > 0) {
            currentWordIndex--;
            updateWordDisplay();
        }
    });

    document.getElementById('next-word').addEventListener('click', () => {
        const words = languageData[selectedLevel][selectedLanguage];
        if (currentWordIndex < words.length - 1) {
            currentWordIndex++;
            updateWordDisplay();
        }
    });
}

// Update progress tracking
function updateProgress() {
    if (!selectedLanguage || !selectedLevel || !languageData) return;

    const words = languageData[selectedLevel][selectedLanguage];
    const totalWords = words.length;
    const completedWords = progress.completedWords.length;
    
    // Calculate progress as percentage of completed words
    progress.overall = Math.round((completedWords / totalWords) * 100);
    
    // Update progress display with more detailed information
    const progressContainer = document.querySelector('.current-progress');
    progressContainer.innerHTML = `
        <div class="progress-header">
            <h3>Current Progress</h3>
            <div class="progress-stats">
                <span class="completed-words">${completedWords} of ${totalWords} words</span>
                <span class="progress-percentage">${progress.overall}% Complete</span>
            </div>
        </div>
        <div class="progress-bar">
            <div class="progress-fill" style="width: ${progress.overall}%"></div>
        </div>
        <div class="progress-details">
            <div class="detail-item">
                <span class="detail-label">Current Level:</span>
                <span class="detail-value">${selectedLevel.charAt(0).toUpperCase() + selectedLevel.slice(1)}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Language:</span>
                <span class="detail-value">${getLanguageName(selectedLanguage)}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Words Mastered:</span>
                <span class="detail-value">${completedWords}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Remaining Words:</span>
                <span class="detail-value">${totalWords - completedWords}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Current Word Attempts:</span>
                <span class="detail-value">${progress.currentAttempts || 0}/3</span>
            </div>
        </div>
    `;
    
    // Save progress to localStorage
    saveProgress();
}

// Level selection handling
function setupLevelSelection() {
    document.querySelectorAll('#level-section .btn-primary').forEach(btn => {
        btn.addEventListener('click', () => {
            selectedLevel = btn.dataset.level;
            document.querySelectorAll('#level-section .btn-primary').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            
            // Show practice section
            document.getElementById('practice-section').classList.remove('hidden');
            
            // Reset word index and update display
            currentWordIndex = 0;
            updateWordDisplay();
        });
    });
}

// Reset progress for new users
function resetProgress() {
    progress = {
        words: {},
        overall: 0
    };
    document.querySelector('.progress-fill').style.width = '0%';
    document.querySelector('.progress-text').textContent = '0% Complete';
}

// Update word display with level-specific content
function updateWordDisplay() {
    if (!selectedLanguage || !selectedLevel || !languageData) return;

    const currentWord = document.getElementById('current-word');
    const pronunciation = document.getElementById('pronunciation');
    const meaning = document.getElementById('meaning');
    const example = document.getElementById('example');
    const prevBtn = document.getElementById('prev-word');
    const nextBtn = document.getElementById('next-word');
    const recordBtn = document.getElementById('record-btn');

    // Get the words for the selected language and level
    const words = languageData[selectedLevel][selectedLanguage];
    if (!words || !words[currentWordIndex]) return;

    // Update word display
    currentWord.textContent = words[currentWordIndex].text;
    pronunciation.textContent = words[currentWordIndex].pronunciation;
    meaning.textContent = words[currentWordIndex].meaning;
    example.textContent = words[currentWordIndex].example;

    // Update navigation buttons
    prevBtn.disabled = currentWordIndex === 0;
    nextBtn.disabled = currentWordIndex === words.length - 1;

    // Reset record button state for new word
    recordBtn.disabled = false;
    recordBtn.classList.remove('disabled');
    recordBtn.innerHTML = '<i class="fas fa-microphone mr-2"></i>Start Recording';

    // Load progress for the current course
    loadProgress();
}

// Get random affirmation message based on accuracy
function getAffirmationMessage(accuracy) {
    const messages = {
        high: [
            `Excellent! You're doing great! (${accuracy}% accuracy)`,
            `Fantastic pronunciation! Keep it up! (${accuracy}% accuracy)`,
            `You're a natural at this! (${accuracy}% accuracy)`,
            `Impressive! Your accent is improving! (${accuracy}% accuracy)`,
            `Wonderful! You're making great progress! (${accuracy}% accuracy)`
        ],
        medium: [
            `Good effort! Practice makes perfect! (${accuracy}% accuracy)`,
            `You're getting better! Keep practicing! (${accuracy}% accuracy)`,
            `Nice try! You're improving! (${accuracy}% accuracy)`,
            `Good job! A little more practice and you'll master it! (${accuracy}% accuracy)`,
            `You're on the right track! (${accuracy}% accuracy)`
        ],
        low: [
            `Keep practicing! You'll get there! (${accuracy}% accuracy)`,
            `Don't give up! Every attempt makes you better! (${accuracy}% accuracy)`,
            `Practice makes perfect! Try again! (${accuracy}% accuracy)`,
            `You're learning! That's what matters! (${accuracy}% accuracy)`,
            `Every expert was once a beginner! (${accuracy}% accuracy)`
        ]
    };

    let category;
    if (accuracy >= 90) {
        category = 'high';
    } else if (accuracy >= 70) {
        category = 'medium';
    } else {
        category = 'low';
    }

    const categoryMessages = messages[category];
    return categoryMessages[Math.floor(Math.random() * categoryMessages.length)];
}

// Motivational quotes
function getRandomQuote() {
    const quotes = [
        "Ready for today's learning? Let's get started!",
        "Every word you learn brings you closer to fluency!",
        "Your language journey begins with a single word!",
        "Let's make today's practice count!",
        "Learning a new language is like discovering a new world!",
        "You're one step closer to mastering your chosen language!"
    ];
    return quotes[Math.floor(Math.random() * quotes.length)];
}

// Welcome message speech
function speakWelcomeMessage() {
    const speech = new SpeechSynthesisUtterance();
    speech.text = "Welcome to Dialect Trainer Bot";
    speech.volume = 1;
    speech.rate = 1;
    speech.pitch = 1;
    speech.voice = window.speechSynthesis.getVoices().find(voice => voice.name.includes('female'));
    window.speechSynthesis.speak(speech);
}

function updateEnrolledCourses() {
    const coursesGrid = document.getElementById('courses-grid');
    const userCourses = JSON.parse(localStorage.getItem(`courses_${currentUser}`)) || [];
    
    coursesGrid.innerHTML = '';
    
    userCourses.forEach((course, index) => {
        const courseCard = document.createElement('div');
        courseCard.className = 'course-card';
        courseCard.innerHTML = `
            <div class="course-header">
                <div class="course-icon">
                    <i class="fas fa-graduation-cap"></i>
                </div>
                <div class="course-info">
                    <h3 class="course-title">${getLanguageName(course.language)} - ${course.level.charAt(0).toUpperCase() + course.level.slice(1)}</h3>
                    <p class="course-level">Progress: ${course.progress}%</p>
                </div>
                <button class="delete-course-btn" data-index="${index}">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="course-progress">
                <div class="progress-text">Progress: ${course.progress}%</div>
                <div class="course-progress-bar">
                    <div class="course-progress-fill" style="width: ${course.progress}%"></div>
                </div>
            </div>
            <button class="continue-btn">Continue Learning</button>
        `;
        
        // Add click handler for the entire card
        courseCard.addEventListener('click', (e) => {
            if (!e.target.closest('.delete-course-btn')) {
                selectedLanguage = course.language;
                selectedLevel = course.level;
                document.getElementById('enrolled-courses-section').classList.add('hidden');
                document.getElementById('current-progress').classList.remove('hidden');
                document.getElementById('level-section').classList.remove('hidden');
                updateWordDisplay();
            }
        });
        
        // Add click handler for the continue button
        const continueBtn = courseCard.querySelector('.continue-btn');
        continueBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            selectedLanguage = course.language;
            selectedLevel = course.level;
            document.getElementById('enrolled-courses-section').classList.add('hidden');
            document.getElementById('current-progress').classList.remove('hidden');
            document.getElementById('level-section').classList.remove('hidden');
            updateWordDisplay();
        });
        
        // Add click handler for the delete button
        const deleteBtn = courseCard.querySelector('.delete-course-btn');
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (confirm('Are you sure you want to delete this course?')) {
                userCourses.splice(index, 1);
                localStorage.setItem(`courses_${currentUser}`, JSON.stringify(userCourses));
                updateEnrolledCourses();
            }
        });
        
        coursesGrid.appendChild(courseCard);
    });
}

function getLanguageName(code) {
    const languageNames = {
        en: 'English',
        hi: 'Hindi',
        es: 'Spanish',
        de: 'German',
        fr: 'French',
        ar: 'Arabic'
    };
    return languageNames[code] || code;
}

// Save progress to localStorage
function saveProgress() {
    if (!currentUser) return;

    const userCourses = JSON.parse(localStorage.getItem(`courses_${currentUser}`)) || [];
    const courseIndex = userCourses.findIndex(course => 
        course.language === selectedLanguage && course.level === selectedLevel
    );

    const courseProgress = {
        language: selectedLanguage,
        level: selectedLevel,
        progress: progress.overall,
        completedWords: progress.completedWords,
        currentAttempts: progress.currentAttempts,
        wordHistory: progress.wordHistory,
        lastUpdated: new Date().toISOString()
    };

    if (courseIndex === -1) {
        userCourses.push(courseProgress);
    } else {
        userCourses[courseIndex] = courseProgress;
    }

    localStorage.setItem(`courses_${currentUser}`, JSON.stringify(userCourses));
}

// Load progress from localStorage
function loadProgress() {
    if (!currentUser) return;

    const userCourses = JSON.parse(localStorage.getItem(`courses_${currentUser}`)) || [];
    const courseIndex = userCourses.findIndex(course => 
        course.language === selectedLanguage && course.level === selectedLevel
    );

    if (courseIndex !== -1) {
        const courseProgress = userCourses[courseIndex];
        progress.overall = courseProgress.progress;
        progress.completedWords = courseProgress.completedWords || [];
        progress.currentAttempts = courseProgress.currentAttempts || 0;
        progress.wordHistory = courseProgress.wordHistory || {};
        
        // Update progress display
        updateProgress();
    } else {
        // Initialize new course progress
        progress.overall = 0;
        progress.completedWords = [];
        progress.currentAttempts = 0;
        progress.wordHistory = {};
        saveProgress();
    }
}

// Check session status on page load
document.addEventListener('DOMContentLoaded', function() {
    checkSessionStatus();
});

// Function to check session status
function checkSessionStatus() {
    fetch('/check_session')
        .then(response => response.json())
        .then(data => {
            if (data.logged_in) {
                // User is logged in, show dashboard
                if (window.location.pathname === '/') {
                    window.location.href = '/dashboard';
                }
            } else {
                // User is not logged in, show login page
                if (window.location.pathname !== '/') {
                    window.location.href = '/';
                }
            }
        })
        .catch(error => {
            console.error('Error checking session:', error);
        });
}

// Update the login form submission
document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;

    fetch('/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            window.location.href = '/dashboard';
        } else {
            alert(data.message || 'Login failed');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('An error occurred during login');
    });
});

// Update the signup form submission
document.getElementById('signupForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const username = document.getElementById('signupUsername').value;
    const password = document.getElementById('signupPassword').value;

    fetch('/signup', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            window.location.href = '/dashboard';
        } else {
            alert(data.message || 'Signup failed');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('An error occurred during signup');
    });
});

// Get improvement message based on accuracy
function getImprovementMessage(accuracy, word) {
    const previousAccuracy = getPreviousAccuracy(word);
    const improvement = accuracy - previousAccuracy;
    
    if (improvement > 0) {
        return `You've improved by ${improvement}% from your last attempt! 🚀`;
    } else if (improvement < 0) {
        return `Try to match your previous accuracy of ${previousAccuracy}% 💪`;
    } else {
        return `Keep practicing to improve your pronunciation! 🌟`;
    }
}

// Get previous accuracy for a word
function getPreviousAccuracy(word) {
    const wordHistory = JSON.parse(localStorage.getItem(`word_history_${currentUser}`)) || {};
    return wordHistory[word] || 0;
}

// Save word accuracy to history
function saveWordAccuracy(word, accuracy) {
    const wordHistory = JSON.parse(localStorage.getItem(`word_history_${currentUser}`)) || {};
    wordHistory[word] = accuracy;
    localStorage.setItem(`word_history_${currentUser}`, JSON.stringify(wordHistory));
} 