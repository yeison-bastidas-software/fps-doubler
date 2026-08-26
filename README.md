# FPS Blending Media

Web application that doubles a video's frame rate through frame interpolation (blending).

## Description

FPS Blending Media is a tool that **doubles a video's frame rate** by taking 50% of the preceding frame and 50% of the following frame to create an intermediate frame, producing a visually smoother video.

## Prerequisites

- Python 3.8+
- FFmpeg installed on your system
- pip (Python package manager)

## Installation

1. Install Python dependencies:
```bash
pip install -r requirements.txt
```

2. Ensure FFmpeg is installed:
   - **Ubuntu/Debian**: `sudo apt install ffmpeg`
   - **macOS**: `brew install ffmpeg`
   - **Windows**: Download from https://ffmpeg.org/download.html

## Running the Application

```bash
cd fps_blending_media
python app.py
```

The application will be available at: http://localhost:5000

## Usage

1. Click "Load Video" and select a .mp4, .mov, or .webm file
2. Click "Interpolate Frames" and wait for processing
3. Preview the result and click "Download Result"
4. Click "Interpolate More Videos" to start over

## Limitations

- Max file size: 480 MB
- Max duration: 16 minutes
- Max resolution: 2K
- Supported formats: .mp4, .mov, .webm

## Features

- **Strict validation** of files according to specifications
- **Real-time progress bar** (0% – 100%)
- **Estimated time countdown** based on processing progress
- **24 fun facts** about video technology displayed during processing
- **Comprehensive error handling** with clear user messages
- **Automatic cleanup** of temporary files (after 5 minutes of inactivity)
- **Single-job queue** to prevent server overload
- **Original audio preserved** without re-encoding
- **Responsive design** with green color palette

## Technology Stack

- **Backend**: Flask + OpenCV + FFmpeg
- **Frontend**: HTML5 + CSS3 + Vanilla JavaScript
- **Processing**: Server-side (not browser-based)
- **Algorithm**: Frame A * 0.5 + Frame B * 0.5

## Project Structure

```
fps_blending_media/
├── app.py                 # Flask server
├── requirements.txt       # Python dependencies
├── static/
│   ├── css/
│   │   └── style.css     # Stylesheets
│   └── js/
│       └── main.js       # Frontend logic
├── templates/
│   └── index.html        # Main interface
├── uploads/              # Uploaded videos
├── output/               # Processed results
└── tmp/                  # Temporary files
```

## Why This Implementation Works

1. **OpenCV**: Optimized, fast frame processing
2. **FFmpeg**: Professional-grade audio/video handling, guarantees perfect sync
3. **Flask**: Lightweight, efficient backend framework
4. **No browser Canvas**: All heavy processing happens server-side
5. **Audio passthrough**: Extraction and remuxing without re-encoding
6. **Minimalist code**: No unnecessary dependencies or bloatware

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `FFmpeg not found` error | Add FFmpeg to your system PATH or reinstall it |
| Video processing is very slow | Close other apps to free up RAM/CPU; try a shorter video first |
| Upload fails for large files | Ensure file is under 480 MB and your internet is stable |
| Audio out of sync in output | Verify original video has standard codec (H.264/AAC) |
| Progress bar freezes | Check browser console for errors; refresh and retry |

## Quick Testing

To test without waiting 16 minutes:

1. Use a 10-second clip in 720p resolution
2. Confirm output has double the FPS (e.g., 30 → 60)
3. Verify audio stays synchronized
4. Check that the progress bar and countdown update smoothly

## License

This project is licensed under the MIT License. Feel free to use, modify, and distribute it.
