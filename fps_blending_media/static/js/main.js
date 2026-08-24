// FPS Blending Media - Lógica del Frontend

// Datos curiosos sobre tecnología de video, frame rates e historia del cine
const facts = [
    "El cine mudo se filmaba a 16-18 fps, pero se proyectaba a 24 fps.",
    "El estándar de 24 fps se estableció en 1927 con 'El cantante de jazz'.",
    "Un frame es una imagen estática; 24 frames por segundo crean la ilusión de movimiento.",
    "La persistencia retiniana permite que nuestro cerebro perciba movimiento continuo.",
    "Peter Jackson filmó 'El Hobbit' a 48 fps para mayor fluidez.",
    "Los videojuegos modernos buscan 60 fps o más para una experiencia suave.",
    "El formato IMAX puede proyectar hasta 48 fps con gran claridad.",
    "La televisión NTSC usa 29.97 fps, mientras PAL usa 25 fps.",
    "El primer video digital fue creado en 1951 por John Logie Baird.",
    "Slow motion se logra grabando a más fps de los que se reproducen.",
    "El ojo humano puede distinguir hasta 1000 fps en ciertas condiciones.",
    "La interpolación de frames se usa en TVs modernas para suavizar contenido.",
    "MPEG fue el primer estándar de compresión de video digital en 1993.",
    "H.264 es el codec de video más usado mundialmente.",
    "YouTube soporta hasta 60 fps para videos en 4K.",
    "Netflix recomienda 24 fps para contenido cinematográfico.",
    "El blending de frames reduce el motion blur en escenas rápidas.",
    "Cada frame de video 4K contiene más de 8 millones de píxeles.",
    "La relación de aspecto 16:9 se estandarizó para HDTV en los 90s.",
    "El cine analógico usaba película de 35mm desde 1892.",
    "La corrección de color digital revolucionó la postproducción en los 2000s.",
    "Los codecs con pérdida descartan datos imperceptibles al ojo humano.",
    "Un video de 1 minuto a 30 fps tiene 1800 frames individuales.",
    "La interpolación óptica de flujo crea frames intermedios más precisos."
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

// Manejar selección de archivo
videoInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        // Validar extensión
        const ext = file.name.split('.').pop().toLowerCase();
        if (!['mp4', 'mov', 'webm'].includes(ext)) {
            showError('Formato no soportado. Use .mp4, .mov o .webm');
            return;
        }
        
        // Validar tamaño (480 MB)
        if (file.size > 480 * 1024 * 1024) {
            showError('El archivo excede el tamaño máximo de 480 MB');
            return;
        }
        
        fileName.textContent = `Archivo seleccionado: ${file.name}`;
        interpolateBtn.style.display = 'inline-block';
        hideError();
    }
});

// Iniciar interpolación
interpolateBtn.addEventListener('click', async () => {
    const file = videoInput.files[0];
    if (!file) return;
    
    // Deshabilitar botones
    loadBtn.disabled = true;
    interpolateBtn.disabled = true;
    
    const formData = new FormData();
    formData.append('video', file);
    
    try {
        // Subir video
        const uploadResponse = await fetch('/upload', {
            method: 'POST',
            body: formData
        });
        
        const uploadData = await uploadResponse.json();
        
        if (!uploadResponse.ok) {
            throw new Error(uploadData.error || 'Error al subir el video');
        }
        
        jobId = uploadData.job_id;
        
        // Cambiar a pantalla de procesamiento
        showScreen('processing');
        startTime = Date.now();
        
        // Iniciar rotación de facts
        rotateFacts();
        
        // Iniciar procesamiento
        await fetch(`/process/${jobId}`, { method: 'POST' });
        
        // Monitorear progreso
        monitorProgress();
        
    } catch (error) {
        showError(error.message);
        loadBtn.disabled = false;
        interpolateBtn.disabled = false;
    }
});

// Monitorear progreso del procesamiento
async function monitorProgress() {
    const pollInterval = setInterval(async () => {
        try {
            const response = await fetch(`/status/${jobId}`);
            const data = await response.json();
            
            // Actualizar barra de progreso
            progressFill.style.width = `${data.progress}%`;
            progressText.textContent = `${data.progress}%`;
            statusText.textContent = data.message;
            
            // Calcular tiempo restante
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
            
            // Verificar completado
            if (data.completed) {
                clearInterval(pollInterval);
                stopFacts();
                showResults(data.download_url);
                return;
            }
            
            // Verificar error
            if (data.status === 'failed') {
                clearInterval(pollInterval);
                stopFacts();
                showError(data.error || 'Error en el procesamiento');
                loadBtn.disabled = false;
                interpolateBtn.disabled = false;
                showScreen('home');
                return;
            }
            
        } catch (error) {
            console.error('Error monitoreando progreso:', error);
            timeRemaining.textContent = 'Reconectando...';
        }
    }, 1000);
}

// Mostrar resultados
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

// Reiniciar aplicación
restartBtn.addEventListener('click', () => {
    jobId = null;
    startTime = null;
    videoInput.value = '';
    fileName.textContent = '';
    progressFill.style.width = '0%';
    progressText.textContent = '0%';
    timeRemaining.textContent = 'Calculando...';
    statusText.textContent = 'Iniciando...';
    resultVideo.src = '';
    
    interpolateBtn.style.display = 'none';
    loadBtn.disabled = false;
    interpolateBtn.disabled = false;
    
    showScreen('home');
});

// Utilidades
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
