"""
FPS Blending Media - Backend Server
Procesamiento de video con interpolación de frames (doble FPS)
"""

from flask import Flask, render_template, request, jsonify, send_file, url_for
from werkzeug.utils import secure_filename
import os
import cv2
import subprocess
import threading
import time
import shutil
from datetime import datetime, timedelta
import uuid

app = Flask(__name__)

# Configuración
UPLOAD_FOLDER = 'uploads'
OUTPUT_FOLDER = 'output'
TMP_FOLDER = 'tmp'
ALLOWED_EXTENSIONS = {'mp4', 'mov', 'webm'}
MAX_FILE_SIZE = 480 * 1024 * 1024  # 480 MB
MAX_DURATION = 16 * 60  # 16 minutos en segundos
MAX_RESOLUTION = 2048  # 2K

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['OUTPUT_FOLDER'] = OUTPUT_FOLDER
app.config['TMP_FOLDER'] = TMP_FOLDER
app.config['MAX_CONTENT_LENGTH'] = MAX_FILE_SIZE

# Estado de procesamiento
processing_jobs = {}
job_queue = []
queue_lock = threading.Lock()

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def validate_video(filepath):
    """Valida que el video cumpla con los requisitos"""
    try:
        cap = cv2.VideoCapture(filepath)
        if not cap.isOpened():
            return False, "Archivo corrupto o no válido"
        
        fps = cap.get(cv2.CAP_PROP_FPS)
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        
        duration = frame_count / fps if fps > 0 else 0
        
        if duration > MAX_DURATION:
            cap.release()
            return False, f"Duración máxima excedida ({MAX_DURATION/60} minutos)"
        
        if max(width, height) > MAX_RESOLUTION:
            cap.release()
            return False, f"Resolución máxima excedida (2K)"
        
        cap.release()
        return True, "Video válido"
    except Exception as e:
        return False, f"Error al validar: {str(e)}"

def get_video_info(filepath):
    """Obtiene información del video"""
    cap = cv2.VideoCapture(filepath)
    fps = cap.get(cv2.CAP_PROP_FPS)
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    cap.release()
    return fps, width, height, frame_count

def process_video(job_id, input_path, output_path, status_callback):
    """Procesa el video interpolando frames"""
    try:
        status_callback(job_id, "Extrayendo audio...", 5)
        
        # Extraer audio
        audio_path = os.path.join(TMP_FOLDER, f"{job_id}_audio.wav")
        cmd_audio = [
            'ffmpeg', '-i', input_path, '-vn', '-acodec', 'pcm_s16le',
            '-ar', '44100', '-ac', '2', audio_path, '-y'
        ]
        subprocess.run(cmd_audio, capture_output=True, check=False)
        has_audio = os.path.exists(audio_path)
        
        status_callback(job_id, "Leyendo frames...", 10)
        
        # Leer video
        cap = cv2.VideoCapture(input_path)
        fps, width, height, total_frames = get_video_info(input_path)
        new_fps = fps * 2
        new_total_frames = total_frames * 2 - 1
        
        status_callback(job_id, f"Iniciando interpolación ({total_frames} frames)...", 15)
        
        # Configurar writer
        fourcc = cv2.VideoWriter_fourcc(*'mp4v')
        temp_output = os.path.join(TMP_FOLDER, f"{job_id}_temp.mp4")
        out = cv2.VideoWriter(temp_output, fourcc, new_fps, (width, height))
        
        prev_frame = None
        frame_idx = 0
        processed = 0
        
        while True:
            ret, frame = cap.read()
            if not ret:
                break
            
            if prev_frame is not None:
                # Interpolar frame (50% anterior + 50% siguiente)
                blended = cv2.addWeighted(prev_frame, 0.5, frame, 0.5, 0)
                out.write(blended)
                processed += 1
                
                progress = 15 + (processed / total_frames) * 70
                status_callback(job_id, f"Interpolando frame {processed}/{total_frames}", int(progress))
            
            out.write(frame)
            prev_frame = frame
            frame_idx += 1
        
        cap.release()
        out.release()
        
        status_callback(job_id, "Combinando audio y video...", 90)
        
        # Combinar video procesado con audio original
        if has_audio:
            cmd_combine = [
                'ffmpeg', '-i', temp_output, '-i', audio_path,
                '-c:v', 'libx264', '-preset', 'medium', '-crf', '23',
                '-c:a', 'aac', '-b:a', '192k', '-shortest', output_path, '-y'
            ]
        else:
            cmd_combine = [
                'ffmpeg', '-i', temp_output, '-c:v', 'libx264', '-preset', 'medium',
                '-crf', '23', output_path, '-y'
            ]
        
        subprocess.run(cmd_combine, capture_output=True, check=True)
        
        # Limpiar temporales
        if os.path.exists(temp_output):
            os.remove(temp_output)
        if has_audio and os.path.exists(audio_path):
            os.remove(audio_path)
        
        status_callback(job_id, "Completado", 100)
        processing_jobs[job_id]['status'] = 'completed'
        
    except Exception as e:
        status_callback(job_id, f"Error: {str(e)}", 0)
        processing_jobs[job_id]['status'] = 'failed'
        processing_jobs[job_id]['error'] = str(e)
        if os.path.exists(output_path):
            os.remove(output_path)

def cleanup_old_files():
    """Elimina archivos inactivos después de 5 minutos"""
    now = datetime.now()
    for folder in [UPLOAD_FOLDER, OUTPUT_FOLDER, TMP_FOLDER]:
        for filename in os.listdir(folder):
            filepath = os.path.join(folder, filename)
            try:
                mtime = datetime.fromtimestamp(os.path.getmtime(filepath))
                if now - mtime > timedelta(minutes=5):
                    os.remove(filepath)
            except:
                pass

def update_status(job_id, message, progress):
    """Actualiza el estado del job"""
    if job_id in processing_jobs:
        processing_jobs[job_id]['message'] = message
        processing_jobs[job_id]['progress'] = progress
        if progress == 100:
            processing_jobs[job_id]['completed'] = True

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/upload', methods=['POST'])
def upload():
    if len(job_queue) >= 1 and any(j['status'] == 'processing' for j in processing_jobs.values()):
        return jsonify({'error': 'Solo se permite un video a la vez'}), 429
    
    if 'video' not in request.files:
        return jsonify({'error': 'No se seleccionó archivo'}), 400
    
    file = request.files['video']
    if file.filename == '':
        return jsonify({'error': 'No se seleccionó archivo'}), 400
    
    if not allowed_file(file.filename):
        return jsonify({'error': 'Formato no soportado. Use .mp4, .mov o .webm'}), 400
    
    job_id = str(uuid.uuid4())
    filename = secure_filename(f"{job_id}_{file.filename}")
    filepath = os.path.join(UPLOAD_FOLDER, filename)
    
    file.save(filepath)
    
    # Validar video
    valid, message = validate_video(filepath)
    if not valid:
        os.remove(filepath)
        return jsonify({'error': message}), 400
    
    processing_jobs[job_id] = {
        'input_path': filepath,
        'output_path': os.path.join(OUTPUT_FOLDER, f"{job_id}_result.mp4"),
        'status': 'queued',
        'message': 'En cola...',
        'progress': 0,
        'completed': False,
        'error': None
    }
    
    with queue_lock:
        job_queue.append(job_id)
    
    return jsonify({'job_id': job_id})

@app.route('/process/<job_id>', methods=['POST'])
def process(job_id):
    if job_id not in processing_jobs:
        return jsonify({'error': 'Job no encontrado'}), 404
    
    if processing_jobs[job_id]['status'] != 'queued':
        return jsonify({'error': 'Job ya en procesamiento'}), 400
    
    processing_jobs[job_id]['status'] = 'processing'
    
    thread = threading.Thread(
        target=process_video,
        args=(job_id, processing_jobs[job_id]['input_path'], 
              processing_jobs[job_id]['output_path'], update_status)
    )
    thread.start()
    
    return jsonify({'message': 'Procesamiento iniciado'})

@app.route('/status/<job_id>')
def status(job_id):
    if job_id not in processing_jobs:
        return jsonify({'error': 'Job no encontrado'}), 404
    
    job = processing_jobs[job_id]
    return jsonify({
        'status': job['status'],
        'message': job['message'],
        'progress': job['progress'],
        'completed': job['completed'],
        'error': job['error'],
        'download_url': url_for('download', job_id=job_id) if job['completed'] else None
    })

@app.route('/download/<job_id>')
def download(job_id):
    if job_id not in processing_jobs or not processing_jobs[job_id]['completed']:
        return jsonify({'error': 'Resultado no disponible'}), 404
    
    return send_file(
        processing_jobs[job_id]['output_path'],
        as_attachment=True,
        download_name='fps_blended_result.mp4'
    )

@app.route('/cancel/<job_id>', methods=['POST'])
def cancel(job_id):
    if job_id in processing_jobs:
        processing_jobs[job_id]['status'] = 'cancelled'
        if os.path.exists(processing_jobs[job_id]['input_path']):
            os.remove(processing_jobs[job_id]['input_path'])
        if os.path.exists(processing_jobs[job_id]['output_path']):
            os.remove(processing_jobs[job_id]['output_path'])
    return jsonify({'message': 'Cancelado'})

if __name__ == '__main__':
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)
    os.makedirs(OUTPUT_FOLDER, exist_ok=True)
    os.makedirs(TMP_FOLDER, exist_ok=True)
    
    app.run(host='0.0.0.0', port=5000, threaded=True)
