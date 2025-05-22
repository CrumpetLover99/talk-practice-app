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

const reviewTopicDisplay = document.getElementById('review-topic');
const reviewTimeDisplay = document.getElementById('review-time');
const selfReflectionNotes = document.getElementById('self-reflection-notes');
const downloadAudioBtn = document.getElementById('download-audio-btn');
const downloadNotesBtn = document.getElementById('download-notes-btn');
const restartBtn = document.getElementById('restart-btn');
const pauseBtn = document.getElementById('pause-btn'); // ADD THIS LINE
const resumeBtn = document.getElementById('resume-btn'); // ADD THIS LINE
const restartPracticeBtn = document.getElementById('restart-practice-btn'); // ADD THIS LINE
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
    "Describe the job you applied for (DSIT portfolio analyst) to a non-technical friend.", // Good for practice!
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
    // Add more topics here!
];
let currentTopic = '';
let countdownInterval;
let practiceTimerInterval;
let timeLeft = 120; // 2 minutes in seconds
let mediaRecorder;
let audioChunks = [];
let audioBlob;
let startTime; // To track actual speaking time
let isPaused = false;

// --- EVENT LISTENERS ---
generateTopicBtn.addEventListener('click', generateTopic);
startPracticeBtn.addEventListener('click', startCountdown);
downloadAudioBtn.addEventListener('click', downloadAudio);
downloadNotesBtn.addEventListener('click', downloadNotes);
restartBtn.addEventListener('click', resetApp);
pauseBtn.addEventListener('click', pausePractice); // ADD THIS LINE
resumeBtn.addEventListener('click', resumePractice); // ADD THIS LINE
restartPracticeBtn.addEventListener('click', restartPractice); // ADD THIS LINE
endSessionBtn.addEventListener('click', endPractice);

// --- HELPER FUNCTION TO SHOW/HIDE SECTIONS ---
function showSection(sectionToShow) {
    topicSection.style.display = 'none';
    countdownSection.style.display = 'none';
    practiceSection.style.display = 'none';
    reviewSection.style.display = 'none';

    sectionToShow.style.display = 'block';
}

// Set initial view
showSection(topicSection);

// --- FUNCTIONS ---

function generateTopic() {
    if (appGuide) {
        appGuide.style.display = 'none'; // Hide the app guide
    }
    const randomIndex = Math.floor(Math.random() * topics.length);
    currentTopic = topics[randomIndex];
    currentTopicDisplay.textContent = currentTopic;
    currentTopicDisplay.style.display = 'block'; // ADD THIS LINE: Make the topic box visible
    startPracticeBtn.style.display = 'inline-block'; // Show the "Start Practice" button
}

function startCountdown() {
    showSection(countdownSection);
    countdownDisplay.textContent = 3; // Reset countdown display

    let count = 3;
    countdownInterval = setInterval(() => {
        count--;
        countdownDisplay.textContent = count;
        if (count === 0) {
            clearInterval(countdownInterval);
            startPractice();
        }
    }, 1000); // Update every 1 second (1000 milliseconds)
}

async function startPractice() {
    showSection(practiceSection);
    speakingTopicDisplay.textContent = currentTopic;
    timeLeft = 120; // Reset timer for each practice
    updateTimerDisplay(); // Display initial 02:00
    console.log("startPractice: Initial display updated to 02:00. TimeLeft:", timeLeft); // ADD THIS LOG

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
        console.log("Recording started successfully."); // ADD THIS LOG

        startTime = Date.now(); // Record start time ONLY if recording started

    } catch (err) {
        console.error('Error accessing microphone:', err);
        recordingStatusDisplay.textContent = 'Recording: FAILED (Permission denied or no microphone)';
        alert('Could not access your microphone. Please ensure permissions are granted.');
        downloadAudioBtn.style.display = 'none';
        startTime = null; // Ensure startTime is null if recording failed
        console.log("Microphone access failed. Timer might still run, but no recording."); // ADD THIS LOG
    }
    // --- End Audio Recording Setup ---

    console.log("Attempting to set up practiceTimerInterval."); // ADD THIS LOG

    practiceTimerInterval = setInterval(() => {
        console.log("setInterval: Tick! timeLeft before decrement:", timeLeft); // ADD THIS LOG
        timeLeft--;
        updateTimerDisplay();

        if (timeLeft <= 0) {
            console.log("setInterval: Time's up! Calling endPractice."); // ADD THIS LOG
            clearInterval(practiceTimerInterval);
            endPractice();
        }
    }, 1000); // 1000 milliseconds = 1 second

    console.log("setInterval has been initiated."); // ADD THIS LOG
}



function updateTimerDisplay() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;

    const displayString = `<span class="math-inline">\{minutes\.toString\(\)\.padStart\(2, '0'\)\}\:</span>{seconds.toString().padStart(2, '0')}`; // Store in a variable
    console.log("updateTimerDisplay: Trying to set display to:", displayString); // ADD THIS LOG

    timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function endPractice() {
    clearInterval(practiceTimerInterval); // Stop the timer
    if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.stop(); // Stop the recording
    }
    recordingStatusDisplay.textContent = 'Recording: Stopped';
    showSection(reviewSection); // Show the review section
    reviewTopicDisplay.textContent = currentTopic;

    // Calculate actual time spoken (optional, but good to have)
    const endTime = Date.now();
    const durationSeconds = Math.round((endTime - startTime) / 1000);
    const minutes = Math.floor(durationSeconds / 60);
    const seconds = durationSeconds % 60;
    reviewTimeDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// --- NEW CONTROL FUNCTIONS ---

function pausePractice() {
    if (!isPaused) {
        clearInterval(practiceTimerInterval); // Stop the timer
        if (mediaRecorder && mediaRecorder.state === 'recording') {
            mediaRecorder.pause(); // Pause the recording
        }
        recordingStatusDisplay.textContent = 'Recording: PAUSED';
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
        isPaused = false;
        pauseBtn.style.display = 'inline-block';
        resumeBtn.style.display = 'none';
    }
}

async function restartPractice() {
    // Stop current timer and recording if active
    clearInterval(practiceTimerInterval);
    if (mediaRecorder && (mediaRecorder.state === 'recording' || mediaRecorder.state === 'paused')) {
        mediaRecorder.stop(); // Stop will trigger onstop event and create blob
    }
    recordingStatusDisplay.textContent = 'Recording: Stopped (Restarting)';

    // Reset state
    timeLeft = 120;
    isPaused = false;
    audioChunks = [];
    audioBlob = null;
    downloadAudioBtn.style.display = 'none'; // Hide download button until new recording is done

    // Reset button visibility
    pauseBtn.style.display = 'inline-block';
    resumeBtn.style.display = 'none';

    // Start the practice again from the beginning (countdown)
    // We'll reuse startCountdown for a fresh start with the same topic
    startCountdown(); // This will handle showing countdown and then calling startPractice
}

// --- RESET APP FUNCTION (Modified slightly to ensure state is clean) ---
function resetApp() {
    // Stop any running timers/recordings
    clearInterval(countdownInterval);
    clearInterval(practiceTimerInterval);

    if (mediaRecorder && (mediaRecorder.state === 'recording' || mediaRecorder.state === 'paused')) {
        mediaRecorder.stop(); // This will trigger onstop and create blob, but we discard it essentially
    }
    mediaRecorder = null; // Crucial: Reset mediaRecorder

    // Reset all state variables
    currentTopic = '';
    timeLeft = 120;
    audioChunks = [];
    audioBlob = null;
    isPaused = false;
    startTime = null; // Ensure startTime is reset here

    // Reset display elements
    currentTopicDisplay.textContent = ''; // Blank topic on reset
    currentTopicDisplay.style.display = 'none'; // Ensure current topic display is hidden on reset
    timerDisplay.textContent = '02:00';
    recordingStatusDisplay.textContent = 'Recording status: Not recording';
    selfReflectionNotes.value = ''; // Clear notes

    // Reset button visibility
    startPracticeBtn.style.display = 'none'; // Hide "Start Practice" button
    downloadAudioBtn.style.display = 'inline-block'; // Should be hidden unless recording is made, but it's okay for now. We can remove this line.
    downloadNotesBtn.style.display = 'inline-block'; // Same here. We can remove this line.
    pauseBtn.style.display = 'inline-block'; // Ensure it's ready for next start
    resumeBtn.style.display = 'none';

    // --- ADD THESE NEW LINES TO SHOW THE APP GUIDE AND BUTTONS ---
    if (appGuide) {
        appGuide.style.display = 'block'; // Show the app guide again
    }
    generateTopicBtn.style.display = 'inline-block'; // Show the "Generate Topic" button
    // --- END OF NEW LINES ---

    // Show the topic selection section
    showSection(topicSection);
}

// --- DOWNLOAD FUNCTIONS ---

function downloadAudio() {
    if (audioBlob) {
        const url = URL.createObjectURL(audioBlob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        // Generate a filename based on date and topic
        const date = new Date();
        const dateString = date.toISOString().slice(0, 10); // YYYY-MM-DD
        const topicCleaned = currentTopic.replace(/[^a-z0-9]/gi, '_').toLowerCase().substring(0, 50); // Sanitize topic for filename
        a.download = `${dateString}_${topicCleaned}_talk.wav`;
        a.click();
        window.URL.revokeObjectURL(url); // Clean up the URL object
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
    const dateString = date.toISOString().slice(0, 10); // YYYY-MM-DD
    const topicCleaned = currentTopic.replace(/[^a-z0-9]/gi, '_').toLowerCase().substring(0, 50); // Sanitize topic for filename
    a.download = `${dateString}_${topicCleaned}_notes.txt`
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    console.log("Notes download initiated.");
}