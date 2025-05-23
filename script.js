// Get references to HTML elements
const topicSection = document.getElementById('topic-section');
const countdownSection = document.getElementById('countdown-section');
const practiceSection = document.getElementById('practice-section');
const reviewSection = document.getElementById('review-section');
const appGuide = document.querySelector('.app-guide');

const currentTopicDisplay = document.getElementById('current-topic');
const generateTopicBtn = document.getElementById('generate-topic-btn');
const startPracticeBtn = document.getElementById('start-practice-btn');
const countdownDisplay = document.getElementById('countdown-display');
const speakingTopicDisplay = document.getElementById('speaking-topic');
const timerDisplay = document.getElementById('timer-display');
const recordingStatusDisplay = document.getElementById('recording-status');

// Transcription elements
const transcriptionSection = document.getElementById('transcription-section');
const transcriptionDisplay = document.getElementById('transcription-display');
const transcriptionStatus = document.getElementById('transcription-status');
const transcriptionReview = document.getElementById('transcription-review');
const finalTranscript = document.getElementById('final-transcript');
const downloadTranscriptBtn = document.getElementById('download-transcript-btn');

const reviewTopicDisplay = document.getElementById('review-topic');
const reviewTimeDisplay = document.getElementById('review-time');
const selfReflectionNotes = document.getElementById('self-reflection-notes');
const downloadAudioBtn = document.getElementById('download-audio-btn');
const downloadNotesBtn = document.getElementById('download-notes-btn');
const restartBtn = document.getElementById('restart-btn');
const pauseBtn = document.getElementById('pause-btn');
const resumeBtn = document.getElementById('resume-btn');
const restartPracticeBtn = document.getElementById('restart-practice-btn');
const endSessionBtn = document.getElementById('end-session-btn');

// --- APP STATE VARIABLES ---
let topics = [
    "Explain the plot of your favorite movie in under 2 minutes.",
    "Describe a significant technological innovation and its impact.",
    "Summarize the main idea of a book or article you recently read.",
    "Explain your favorite hobby to someone who knows nothing about it.",
    "Describe the benefits of a healthy diet.",
    "Explain why learning a new language is valuable.",
    "Discuss the pros and cons of remote work.",
    "Describe the job you applied for (DSIT portfolio analyst) to a non-technical friend.",
    "Explain how a simple machine (e.g., lever, pulley) works.",
    "Describe a historical event that interests you.",
    "Explain the concept of 'climate change' to a young child.",
    "Summarize the key functions of your smartphone.",
    "Describe your ideal vacation destination.",
    "Explain why exercise is important for mental health.",
    "Describe a personal achievement you are proud of.",
    "Explain why a specific feature in a software/system you use is underappreciated and how it could deliver more value.",
    "You've encountered a new tool or methodology in your field. Explain why it's a significant improvement over current practices and why colleagues should investigate it.",
    "Describe a recent industry trend or news item related to technology/science. Explain why you believe it will have a major impact (positive or negative) on your work or sector.",
    "Think of a common technical debate in your field (e.g., 'cloud vs. on-premise,' 'agile vs. waterfall'). Explain your preferred approach and the key reasons behind your stance.",
    "You've been asked to contribute to a project, and you have a different idea for its core technical direction. Explain your alternative vision and why it's superior to the current plan."
];

let currentTopic = '';
let countdownInterval;
let practiceTimerInterval;
let timeLeft = 120; // 2 minutes in seconds
let mediaRecorder;
let audioChunks = [];
let audioBlob;
let startTime;
let isPaused = false;

// Speech Recognition variables
let recognition;
let isRecognitionSupported = false;
let fullTranscript = '';
let interimTranscript = '';

// --- SPEECH RECOGNITION SETUP ---
function initializeSpeechRecognition() {
    // Check for speech recognition support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (SpeechRecognition) {
        isRecognitionSupported = true;
        recognition = new SpeechRecognition();
        
        // Configure recognition
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        
        recognition.onstart = () => {
            transcriptionStatus.textContent = 'Transcription: Listening...';
            console.log('Speech recognition started');
        };
        
        recognition.onresult = (event) => {
            let interim = '';
            let final = '';
            
            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    final += transcript + ' ';
                } else {
                    interim += transcript;
                }
            }
            
            if (final) {
                fullTranscript += final;
            }
            interimTranscript = interim;
            
            // Update display
            const displayText = fullTranscript + (interimTranscript ? `[${interimTranscript}]` : '');
            transcriptionDisplay.textContent = displayText;
            
            // Auto-scroll to bottom
            transcriptionDisplay.scrollTop = transcriptionDisplay.scrollHeight;
        };
        
        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            transcriptionStatus.textContent = `Transcription: Error - ${event.error}`;
        };
        
        recognition.onend = () => {
            transcriptionStatus.textContent = 'Transcription: Stopped';
            console.log('Speech recognition ended');
        };
        
    } else {
        isRecognitionSupported = false;
        console.log('Speech recognition not supported');
    }
}

// --- EVENT LISTENERS ---
generateTopicBtn.addEventListener('click', generateTopic);
startPracticeBtn.addEventListener('click', startCountdown);
downloadAudioBtn.addEventListener('click', downloadAudio);
downloadNotesBtn.addEventListener('click', downloadNotes);
downloadTranscriptBtn.addEventListener('click', downloadTranscript);
restartBtn.addEventListener('click', resetApp);
pauseBtn.addEventListener('click', pausePractice);
resumeBtn.addEventListener('click', resumePractice);
restartPracticeBtn.addEventListener('click', restartPractice);
endSessionBtn.addEventListener('click', endPractice);

// --- HELPER FUNCTION TO SHOW/HIDE SECTIONS ---
function showSection(sectionToShow) {
    topicSection.style.display = 'none';
    countdownSection.style.display = 'none';
    practiceSection.style.display = 'none';
    reviewSection.style.display = 'none';

    sectionToShow.style.display = 'block';
}

// Initialize speech recognition on load
document.addEventListener('DOMContentLoaded', () => {
    initializeSpeechRecognition();
    showSection(topicSection);
});

// --- FUNCTIONS ---

function generateTopic() {
    if (appGuide) {
        appGuide.style.display = 'none';
    }
    const randomIndex = Math.floor(Math.random() * topics.length);
    currentTopic = topics[randomIndex];
    currentTopicDisplay.textContent = currentTopic;
    currentTopicDisplay.style.display = 'block';
    startPracticeBtn.style.display = 'inline-block';
}

function startCountdown() {
    showSection(countdownSection);
    countdownDisplay.textContent = 3;

    let count = 3;
    countdownInterval = setInterval(() => {
        count--;
        countdownDisplay.textContent = count;
        if (count === 0) {
            clearInterval(countdownInterval);
            startPractice();
        }
    }, 1000);
}

async function startPractice() {
    showSection(practiceSection);
    speakingTopicDisplay.textContent = currentTopic;
    timeLeft = 120;
    updateTimerDisplay();
    
    // Reset transcription
    fullTranscript = '';
    interimTranscript = '';
    transcriptionDisplay.textContent = '';
    
    // Show transcription section if supported
    if (isRecognitionSupported) {
        transcriptionSection.style.display = 'block';
        transcriptionStatus.textContent = 'Transcription: Starting...';
    }

    // --- Audio Recording Setup ---
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
        audioChunks = [];

        mediaRecorder.ondataavailable = event => {
            audioChunks.push(event.data);
        };

        mediaRecorder.onstop = () => {
            audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
            downloadAudioBtn.style.display = 'inline-block';
            console.log("Recording stopped. Audio Blob created.");
            stream.getTracks().forEach(track => track.stop());
        };

        mediaRecorder.start();
        recordingStatusDisplay.textContent = 'Recording: ACTIVE';
        console.log("Recording started successfully.");

        startTime = Date.now();

    } catch (err) {
        console.error('Error accessing microphone:', err);
        recordingStatusDisplay.textContent = 'Recording: FAILED (Permission denied or no microphone)';
        alert('Could not access your microphone. Please ensure permissions are granted.');
        downloadAudioBtn.style.display = 'none';
        startTime = null;
    }

    // --- Start Speech Recognition ---
    if (isRecognitionSupported) {
        try {
            recognition.start();
        } catch (err) {
            console.error('Error starting speech recognition:', err);
            transcriptionStatus.textContent = 'Transcription: Failed to start';
        }
    }

    // --- Start Timer ---
    practiceTimerInterval = setInterval(() => {
        timeLeft--;
        updateTimerDisplay();

        if (timeLeft <= 0) {
            clearInterval(practiceTimerInterval);
            endPractice();
        }
    }, 1000);
}

function updateTimerDisplay() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function endPractice() {
    clearInterval(practiceTimerInterval);
    
    // Stop audio recording
    if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
    }
    recordingStatusDisplay.textContent = 'Recording: Stopped';
    
    // Stop speech recognition
    if (isRecognitionSupported && recognition) {
        recognition.stop();
    }
    
    // Hide transcription section during practice
    transcriptionSection.style.display = 'none';
    
    showSection(reviewSection);
    reviewTopicDisplay.textContent = currentTopic;

    // Calculate actual time spoken
    const endTime = Date.now();
    const durationSeconds = Math.round((endTime - startTime) / 1000);
    const minutes = Math.floor(durationSeconds / 60);
    const seconds = durationSeconds % 60;
    reviewTimeDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    // Show transcript in review if available
    if (fullTranscript.trim()) {
        transcriptionReview.style.display = 'block';
        finalTranscript.textContent = fullTranscript.trim();
    } else {
        transcriptionReview.style.display = 'none';
    }
}

function pausePractice() {
    if (!isPaused) {
        clearInterval(practiceTimerInterval);
        
        if (mediaRecorder && mediaRecorder.state === 'recording') {
            mediaRecorder.pause();
        }
        recordingStatusDisplay.textContent = 'Recording: PAUSED';
        
        if (isRecognitionSupported && recognition) {
            recognition.stop();
        }
        transcriptionStatus.textContent = 'Transcription: Paused';
        
        isPaused = true;
        pauseBtn.style.display = 'none';
        resumeBtn.style.display = 'inline-block';
    }
}

function resumePractice() {
    if (isPaused) {
        // Resume timer
        practiceTimerInterval = setInterval(() => {
            timeLeft--;
            updateTimerDisplay();

            if (timeLeft <= 0) {
                clearInterval(practiceTimerInterval);
                endPractice();
            }
        }, 1000);

        // Resume recording
        if (mediaRecorder && mediaRecorder.state === 'paused') {
            mediaRecorder.resume();
        }
        recordingStatusDisplay.textContent = 'Recording: ACTIVE';
        
        // Resume speech recognition
        if (isRecognitionSupported) {
            try {
                recognition.start();
            } catch (err) {
                console.error('Error resuming speech recognition:', err);
            }
        }
        
        isPaused = false;
        pauseBtn.style.display = 'inline-block';
        resumeBtn.style.display = 'none';
    }
}

async function restartPractice() {
    // Stop current timer and recording if active
    clearInterval(practiceTimerInterval);
    
    if (mediaRecorder && (mediaRecorder.state === 'recording' || mediaRecorder.state === 'paused')) {
        mediaRecorder.stop();
    }
    recordingStatusDisplay.textContent = 'Recording: Stopped (Restarting)';

    // Stop speech recognition
    if (isRecognitionSupported && recognition) {
        recognition.stop();
    }

    // Reset state
    timeLeft = 120;
    isPaused = false;
    audioChunks = [];
    audioBlob = null;
    fullTranscript = '';
    interimTranscript = '';
    downloadAudioBtn.style.display = 'none';

    // Reset button visibility
    pauseBtn.style.display = 'inline-block';
    resumeBtn.style.display = 'none';

    // Hide transcription section
    transcriptionSection.style.display = 'none';

    // Start fresh
    startCountdown();
}

function resetApp() {
    // Stop any running timers/recordings
    clearInterval(countdownInterval);
    clearInterval(practiceTimerInterval);

    if (mediaRecorder && (mediaRecorder.state === 'recording' || mediaRecorder.state === 'paused')) {
        mediaRecorder.stop();
    }
    mediaRecorder = null;
    
    // Stop speech recognition
    if (isRecognitionSupported && recognition) {
        recognition.stop();
    }

    // Reset all state variables
    currentTopic = '';
    timeLeft = 120;
    audioChunks = [];
    audioBlob = null;
    isPaused = false;
    startTime = null;
    fullTranscript = '';
    interimTranscript = '';

    // Reset display elements
    currentTopicDisplay.textContent = '';
    currentTopicDisplay.style.display = 'none';
    timerDisplay.textContent = '02:00';
    recordingStatusDisplay.textContent = 'Recording status: Not recording';
    transcriptionStatus.textContent = 'Transcription: Ready';
    transcriptionDisplay.textContent = '';
    finalTranscript.textContent = '';
    selfReflectionNotes.value = '';

    // Reset button visibility
    startPracticeBtn.style.display = 'none';
    pauseBtn.style.display = 'inline-block';
    resumeBtn.style.display = 'none';

    // Hide sections
    transcriptionSection.style.display = 'none';
    transcriptionReview.style.display = 'none';

    // Show the app guide again
    if (appGuide) {
        appGuide.style.display = 'block';
    }
    generateTopicBtn.style.display = 'inline-block';

    showSection(topicSection);
}

// --- DOWNLOAD FUNCTIONS ---

function downloadAudio() {
    if (audioBlob) {
        const url = URL.createObjectURL(audioBlob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        const date = new Date();
        const dateString = date.toISOString().slice(0, 10);
        const topicCleaned = currentTopic.replace(/[^a-z0-9]/gi, '_').toLowerCase().substring(0, 50);
        a.download = `${dateString}_${topicCleaned}_talk.wav`;
        a.click();
        window.URL.revokeObjectURL(url);
        console.log("Audio download initiated.");
    } else {
        alert("No audio recorded to download.");
    }
}

function downloadNotes() {
    const notesContent = selfReflectionNotes.value;
    if (notesContent.trim() === '') {
        alert("No notes to download.");
        return;
    }
    const blob = new Blob([notesContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    const date = new Date();
    const dateString = date.toISOString().slice(0, 10);
    const topicCleaned = currentTopic.replace(/[^a-z0-9]/gi, '_').toLowerCase().substring(0, 50);
    a.download = `${dateString}_${topicCleaned}_notes.txt`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    console.log("Notes download initiated.");
}

function downloadTranscript() {
    if (fullTranscript.trim() === '') {
        alert("No transcript available to download.");
        return;
    }
    
    const transcriptContent = `Two-Minute Talk Practice - Speech Transcript\n` +
                            `Topic: ${currentTopic}\n` +
                            `Date: ${new Date().toLocaleString()}\n` +
                            `\n--- TRANSCRIPT ---\n\n` +
                            fullTranscript.trim();
    
    const blob = new Blob([transcriptContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    const date = new Date();
    const dateString = date.toISOString().slice(0, 10);
    const topicCleaned = currentTopic.replace(/[^a-z0-9]/gi, '_').toLowerCase().substring(0, 50);
    a.download = `${dateString}_${topicCleaned}_transcript.txt`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    console.log("Transcript download initiated.");
}
