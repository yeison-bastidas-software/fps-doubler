# FPS Blending Media


## Description

FPS Blending Media is a frame blending program, which is basically a tool that **doubles a 
video's frame rate by taking 50% of both the preceding and following frames to create an 
intermediate frame**; this produces a visual effect that makes the resulting video appear 
smoother than the original.

## **Program Execution (User Flow)**

The procedure for the correct use of the program is as follows:
	
	1. Click on the "load video" file and select the video for which you want to 
	interpolate the frames.
	
	2. After waiting for the video to load, click "interpolate frames" and wait 
	for the program to do its job.
	
	3. Once the result is ready, you can view it and click the "download result" 
	button to get the interpolated video. After the download is complete, you can click 
	the "interpolate more videos" button to return to the start.


## **Technical Requirements**
	
	* **Input:** Accept files .mp4, .mov and .webm, and keep the original audio.

	* **Processing:** Use Python (MoviePy or OpenCV) to extract frames, blend them, 
                      and re-encode video. Do not use Browser Canvas 
                      for the heavy processing logic.

	* **Algorithm:** Apply blending (Frame A * 0.5 + Frame B * 0.5).

	* **Output:** Generate a new file in the same directory or direct download.


## **Material Limitations (Original Video)**

	* Max file size: 480 MB.

	* Max duration: 16 minutes.

	* Max resolution: 2k.

	* Comply with the supported video types (mp4, webm, mov).


## **Error Handling**

	* Video that does not meet requirements = Show rejection messages.

	* Video file is corrupt/corrupted/unsafe anomaly = Show rejection messages.

	* An unexpected error occurred during processing that corrupted the 
 	  progress = Show error message / retry and delete the corrupted result.

	* Server timeout due to long-running process = Run processing in 
  	  the background; increase HTTP timeout limit.

	* Orphaned temporary files upon browser closure = Auto-delete 
  	  inactive files after 5 minutes via a cleanup task.

	* Network failure during progress tracking = Pause polling; 
      auto-reconnect; display "Reconnecting..."; maintain server-side state.

	* Multiple videos overloading CPU/RAM = Limit queue to 1 active job; 
  	  display queue position; reject additional requests.

	* Accidental double-click during upload/processing = Disable 
  	  buttons during operations; re-enable upon completion.

    * Possible corrupted audio in the result = Extract audio stream, 
      keep it untouched (passthrough/copy), and remux 
      it with the blended video to guarantee perfect sync.
	

## **Home screen features**

	* A short text containing the name of the program and a brief description of it.

	* A button for uploading the material to be worked on in the program.

	* After loading the material, the button for the program to start its work should appear.


## **Processing Screen Features**

	* Create something that analyzes processing progress and then 
  	  displays it in a progress bar (0% – 100%).

	* Create an estimated time counter that counts down to zero based 
  	  on the processing progress (until processing reaches 100%).

	* Random Facts! Generate 24 short, interesting facts about video technology, 
      frame rates, or the history of cinema to display during loading. 
  	  (to serve as a distraction during long processes). 
  	  The texts must be short enough to fit the available space.

	* Display text explaining the current status of the process, based on its actual stage.


## **Results Screen Features**

	* Processed video that can be previewed before downloading.

	* Button to download the result, opening the file manager 
 	  so the user can choose where to save the video.

	* Button to return to the home screen and repeat the process 
  	  with a new material.


## **Design And Color Palette**

	* Program design theme: simple, easy on the eyes, and intuitive.

	* Intermediate color: Greenish-black 
 	  (or that the user's device theme color can be used).

	* Main color: Pine green.

	* Secondary color: Dark sea green.

	* Third color: Cool mint green.


## **Method Of Implementing The Program**

You must program [FPS Blending Media] in the most optimized way possible. 
Follow these strict rules:

	1. Use only the essential and lightweight libraries required for the task. 
	   Avoid heavy dependencies unless absolutely necessary.

	2. Do not include redundant processes or multiple checks 
	   when a single verification is sufficient.

	3. Write only the necessary lines of code—no filler, 
 	   no unnecessary abstractions, no bloatware.

	4. Ensure the code is clean, readable, and efficient, prioritizing 
	   performance and minimal resource usage.

	5. Every function and module must serve a clear purpose. 
	   If something does not add value, do not include it.

	6. Optimize for speed, memory efficiency, and simplicity while maintaining correctness.

The final program must be production-ready, with no placeholder code, 
no unused imports, and no unnecessary comments. 
Every line should contribute directly to the functionality.
