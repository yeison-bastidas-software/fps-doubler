# FPS Blending Media

Aplicación web que duplica la tasa de frames de un video mediante interpolación (blending) de frames.

## Descripción

FPS Blending Media es una herramienta que **duplica el frame rate de un video** tomando 50% del frame anterior y 50% del siguiente para crear un frame intermedio, produciendo un video visualmente más suave.

## Requisitos Previos

- Python 3.8+
- FFmpeg instalado en el sistema
- pip (gestor de paquetes de Python)

## Instalación

1. Instalar dependencias de Python:
```bash
pip install -r requirements.txt
```

2. Asegurar que FFmpeg esté instalado:
   - **Ubuntu/Debian**: `sudo apt install ffmpeg`
   - **macOS**: `brew install ffmpeg`
   - **Windows**: Descargar desde https://ffmpeg.org/download.html

## Ejecución

```bash
cd fps_blending_media
python app.py
```

La aplicación estará disponible en: http://localhost:5000

## Uso

1. Click en "Cargar Video" y selecciona un archivo .mp4, .mov o .webm
2. Click en "Interpolar Frames" y espera el procesamiento
3. Visualiza el resultado y click en "Descargar Resultado"
4. Click en "Interpolar Más Videos" para comenzar de nuevo

## Limitaciones

- Tamaño máximo: 480 MB
- Duración máxima: 16 minutos
- Resolución máxima: 2K
- Formatos soportados: .mp4, .mov, .webm

## Características

- **Validación estricta** de archivos según especificaciones
- **Barra de progreso** en tiempo real (0% - 100%)
- **Contador de tiempo estimado** restante
- **24 datos curiosos** sobre tecnología de video durante el procesamiento
- **Manejo de errores** completo con mensajes claros
- **Limpieza automática** de archivos temporales (5 minutos)
- **Cola de un solo job** para evitar sobrecarga
- **Audio preservado** sin alteraciones
- **Diseño responsive** con paleta de colores verde

## Tecnología

- **Backend**: Flask + OpenCV + FFmpeg
- **Frontend**: HTML5 + CSS3 + JavaScript vanilla
- **Procesamiento**: Servidor (no navegador)
- **Algoritmo**: Frame A * 0.5 + Frame B * 0.5

## Estructura

```
fps_blending_media/
├── app.py                 # Servidor Flask
├── requirements.txt       # Dependencias Python
├── static/
│   ├── css/
│   │   └── style.css     # Estilos
│   └── js/
│       └── main.js       # Lógica frontend
├── templates/
│   └── index.html        # Interfaz principal
├── uploads/              # Videos subidos
├── output/               # Resultados procesados
└── tmp/                  # Archivos temporales
```

## Beneficios de esta implementación

1. **OpenCV**: Procesamiento de frames optimizado y rápido
2. **FFmpeg**: Manejo profesional de audio/video, garantiza sincronización perfecta
3. **Flask**: Backend ligero y eficiente
4. **Sin Canvas en navegador**: Todo el procesamiento pesado en servidor
5. **Audio passthrough**: Extracción y remuxeo sin reprocesamiento
6. **Código minimalista**: Sin dependencias innecesarias ni bloatware
