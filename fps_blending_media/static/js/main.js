// FPS Blending Media - Frontend Logic

// Fun facts about video technology, frame rates, and cinema history
const facts = [
    "Silent films were shot at 16-18 fps but projected at 24 fps.",
    "The 24 fps standard was established in 1927 with 'The Jazz Singer'.",
    "A frame is a still image; 24 frames per second create the illusion of motion.",
    "Persistence of vision allows our brain to perceive continuous movement.",
    "Peter Jackson filmed 'The Hobbit' at 48 fps for greater smoothness.",
    "Modern video games target 60 fps or higher for a smooth experience.",
    "IMAX format can project up to 48 fps with great clarity.",
    "NTSC television uses 29.97 fps, while PAL uses 25 fps.",
    "The first digital video was created in 1951 by John Logie Baird.",
    "Slow motion is achieved by recording at higher fps than playback.",
    "The human eye can distinguish up to 1000 fps under certain conditions.",
    "Frame interpolation is used in modern TVs to smooth content.",
    "MPEG was the first digital video compression standard in 1993.",
    "H.264 is the most widely used video codec worldwide.",
    "YouTube supports up to 60 fps for 4K videos.",
    "Netflix recommends 24 fps for cinematic content.",
    "Frame blending reduces motion blur in fast scenes.",
    "Each 4K video frame contains over 8 million pixels.",
    "The 16:9 aspect ratio was standardized for HDTV in the 90s.",
    "Analog cinema used 35mm film since 1892.",
    "Digital color grading revolutionized post-production in the 2000s.",
    "Lossy codecs discard data imperceptible to the human eye.",
    "A 1-minute video at 30 fps has 1800 individual frames.",
    "Optical flow interpolation creates more accurate intermediate frames."
];

let currentFactIndex = 0;
let factInterval = null;
let jobId = null;
let startTime = null;
let estimatedTotalTime = null;

// Elementos del DOM
const homeScreen = document.getElementById('home-screen');
const processingScreen = document.getElementById('processing-screen');
const resultsScreen = document.getElementById('results-screen');
const loadBtn = document.getElementById('load-btn');
const videoInput = document.getElementById('video-input');
const interpolateBtn = document.getElementById('interpolate-btn');
const fileName = document.getElementById('file-name');
const errorMessage = document.getElementById('error-message');
const progressFill = document.getElementById('progress-fill');
const progressText = document.getElementById('progress-text');
const timeRemaining = document.getElementById('time-remaining');
const statusText = document.getElementById('status-text');
const randomFact = document.getElementById('random-fact');
const resultVideo = document.getElementById('result-video');
const downloadBtn = document.getElementById('download-btn');
const restartBtn = document.getElementById('restart-btn');

// Mostrar selector de archivos
loadBtn.addEventListener('click', () => {
    videoInput.click();
});

// Handle file selection
videoInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        // Validate extension
        const ext = file.name.split('.').pop().toLowerCase();
        if (!['mp4', 'mov', 'webm'].includes(ext)) {
            showError('Unsupported format. Use .mp4, .mov or .webm');
            return;
        }
        
        // Validate size (480 MB)
        if (file.size > 480 * 1024 * 1024) {
            showError('File exceeds maximum size of 480 MB');
            return;
        }
        
        fileName.textContent = `Selected file: ${file.name}`;
        interpolateBtn.style.display = 'inline-block';
        hideError();
    }
});

// Start interpolation
interpolateBtn.addEventListener('click', async () => {
    const file = videoInput.files[0];
    if (!file) return;
    
    // Disable buttons
    loadBtn.disabled = true;
    interpolateBtn.disabled = true;
    
    const formData = new FormData();
    formData.append('video', file);
    
    try {
        // Upload video
        const uploadResponse = await fetch('/upload', {
            method: 'POST',
            body: formData
        });
        
        const uploadData = await uploadResponse.json();
        
        if (!uploadResponse.ok) {
            throw new Error(uploadData.error || 'Error uploading video');
        }
        
        jobId = uploadData.job_id;
        
        // Switch to processing screen
        showScreen('processing');
        startTime = Date.now();
        
        // Start rotating facts
        rotateFacts();
        
        // Start processing
        await fetch(`/process/${jobId}`, { method: 'POST' });
        
        // Monitor progress
        monitorProgress();
        
    } catch (error) {
        showError(error.message);
        loadBtn.disabled = false;
        interpolateBtn.disabled = false;
    }
});

// Monitor processing progress
async function monitorProgress() {
    const pollInterval = setInterval(async () => {
        try {
            const response = await fetch(`/status/${jobId}`);
            const data = await response.json();
            
            // Update progress bar
            progressFill.style.width = `${data.progress}%`;
            progressText.textContent = `${data.progress}%`;
            statusText.textContent = data.message;
            
            // Calculate remaining time
            if (data.progress > 0 && startTime) {
                const elapsed = (Date.now() - startTime) / 1000;
                const estimatedTotal = elapsed / (data.progress / 100);
                const remaining = Math.max(0, estimatedTotal - elapsed);
                
                if (isFinite(remaining)) {
                    const minutes = Math.floor(remaining / 60);
                    const seconds = Math.floor(remaining % 60);
                    timeRemaining.textContent = `${minutes}m ${seconds}s`;
                }
            }
            
            // Check completion
            if (data.completed) {
                clearInterval(pollInterval);
                stopFacts();
                showResults(data.download_url);
                return;
            }
            
            // Check error
            if (data.status === 'failed') {
                clearInterval(pollInterval);
                stopFacts();
                showError(data.error || 'Processing error');
                loadBtn.disabled = false;
                interpolateBtn.disabled = false;
                showScreen('home');
                return;
            }
            
        } catch (error) {
            console.error('Error monitoring progress:', error);
            timeRemaining.textContent = 'Reconnecting...';
        }
    }, 1000);
}

// Show results
function showResults(downloadUrl) {
    showScreen('results');
    resultVideo.src = downloadUrl;
    resultVideo.load();
    
    downloadBtn.onclick = () => {
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = 'fps_blended_result.mp4';
        a.click();
    };
}

// Restart application
restartBtn.addEventListener('click', () => {
    jobId = null;
    startTime = null;
    videoInput.value = '';
    fileName.textContent = '';
    progressFill.style.width = '0%';
    progressText.textContent = '0%';
    timeRemaining.textContent = 'Calculating...';
    statusText.textContent = 'Starting...';
    resultVideo.src = '';
    
    interpolateBtn.style.display = 'none';
    loadBtn.disabled = false;
    interpolateBtn.disabled = false;
    
    showScreen('home');
});

// Utilities
function showScreen(screenName) {
    homeScreen.classList.remove('active');
    processingScreen.classList.remove('active');
    resultsScreen.classList.remove('active');
    
    if (screenName === 'home') homeScreen.classList.add('active');
    else if (screenName === 'processing') processingScreen.classList.add('active');
    else if (screenName === 'results') resultsScreen.classList.add('active');
}

function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
}

function hideError() {
    errorMessage.style.display = 'none';
}

function rotateFacts() {
    randomFact.textContent = facts[0];
    currentFactIndex = 0;
    
    factInterval = setInterval(() => {
        currentFactIndex = (currentFactIndex + 1) % facts.length;
        randomFact.textContent = facts[currentFactIndex];
    }, 5000);
}

function stopFacts() {
    if (factInterval) {
        clearInterval(factInterval);
        factInterval = null;
    }
}
