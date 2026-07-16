"""
FPS Doubler - Frame Blending Implementation

This module provides functionality to double video frame rates by creating
intermediate frames through weighted averaging of consecutive frames.
"""

import cv2
import numpy as np
import argparse
from pathlib import Path


def blend_frames(frame1: np.ndarray, frame2: np.ndarray, weight: float = 0.5) -> np.ndarray:
    """
    Blend two frames using weighted averaging.
    
    Args:
        frame1: First frame (numpy array)
        frame2: Second frame (numpy array)
        weight: Weight for frame1 (0.0 to 1.0). Frame2 gets (1.0 - weight)
    
    Returns:
        Blended frame as numpy array
    """
    return cv2.addWeighted(frame1, weight, frame2, 1.0 - weight, 0)


def process_video(input_path: str, output_path: str) -> None:
    """
    Process video and double its FPS using frame blending.
    
    Args:
        input_path: Path to input video file
        output_path: Path to save output video
    """
    # Open input video
    cap = cv2.VideoCapture(input_path)
    
    if not cap.isOpened():
        raise ValueError(f"Could not open video: {input_path}")
    
    # Get video properties
    original_fps = cap.get(cv2.CAP_PROP_FPS)
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    
    # Double the FPS
    new_fps = original_fps * 2
    
    print(f"🎬 Processing video...")
    print(f"   Original FPS: {original_fps}")
    print(f"   New FPS: {new_fps}")
    print(f"   Resolution: {width}x{height}")
    print(f"   Total frames: {total_frames}")
    
    # Read all frames
    frames = []
    frame_count = 0
    
    while True:
        ret, frame = cap.read()
        if not ret:
            break
        frames.append(frame)
        frame_count += 1
        if frame_count % 30 == 0:
            print(f"   Loaded {frame_count}/{total_frames} frames...")
    
    cap.release()
    
    # Create output video writer
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(output_path, fourcc, new_fps, (width, height))
    
    # Write original frames + blended frames
    blended_count = 0
    
    for i in range(len(frames) - 1):
        # Write original frame
        out.write(frames[i])
        
        # Create and write blended frame (50% of current + 50% of next)
        blended = blend_frames(frames[i], frames[i + 1], weight=0.5)
        out.write(blended)
        blended_count += 1
        
        if blended_count % 30 == 0:
            print(f"   Processed {blended_count} blended frames...")
    
    # Write last frame
    if frames:
        out.write(frames[-1])
    
    out.release()
    
    print(f"✅ Video saved to: {output_path}")
    print(f"   Total blended frames created: {blended_count}")


def main():
    """Main entry point for the FPS Doubler CLI."""
    parser = argparse.ArgumentParser(
        description="Double video FPS using frame blending technique"
    )
    parser.add_argument(
        "input",
        type=str,
        help="Path to input video file"
    )
    parser.add_argument(
        "output",
        type=str,
        help="Path to save output video file"
    )
    
    args = parser.parse_args()
    
    # Validate input file exists
    if not Path(args.input).exists():
        print(f" Error: Input file not found: {args.input}")
        return
    
    try:
        process_video(args.input, args.output)
    except Exception as e:
        print(f"❌ Error processing video: {e}")


if __name__ == "__main__":
    main()