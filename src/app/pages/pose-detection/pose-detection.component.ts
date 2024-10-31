import { Component, ElementRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import * as poseDetection from '@tensorflow-models/pose-detection';
import * as tf from '@tensorflow/tfjs';

@Component({
  selector: 'app-pose-detection',
  templateUrl: './pose-detection.component.html',
  styleUrls: ['./pose-detection.component.scss']
})
export class PoseDetectionComponent {
  // References to the HTML elements for video and canvas
  @ViewChild('videoElement', { static: true }) videoRef!: ElementRef<HTMLVideoElement>;
  @ViewChild('canvasElement', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;

  constructor(private router: Router) {}

  // State variables
  showVideo: boolean = false;  // Controls visibility of the video stream
  stream: MediaStream | null = null;  // Holds the video stream from the webcam

  model: any;  // Pose detection model
  isLoading: boolean = false;  // Indicates if the model is loading
  isDetecting: boolean = false;  // Indicates if pose detection is active
  errorMessage: string | null = null;  // Error message for user feedback
  animationFrameId: number | null = null;  // ID for the requestAnimationFrame for rendering poses

  // Lifecycle hook: Called when the component initializes
  async ngOnInit() {
    try {
      // Load the MoveNet model for pose detection
      await this.loadMoveNetModel();
    } catch (error) {
      console.error('Error loading MoveNet model:', error);
      // Display error message if model loading fails
      this.errorMessage = 'Failed to load pose detection model. Please refresh the page.';
    }
  }

  // Starts the camera and sets loading state
  async startCamera() {
    this.isLoading = true;  // Show loading state
    await this.initCam();  // Initialize the camera
    this.isLoading = false;  // Hide loading state
    this.showVideo = true;  // Show the video stream
  }

  // Initializes the webcam and sets up the video stream
  async initCam() {
    try {
      // Request access to the webcam
      navigator.mediaDevices
        .getUserMedia({ video: true, audio: false })
        .then((stream) => {
          this.stream = stream;  // Store the stream
          this.videoRef.nativeElement.srcObject = stream;  // Set the video element's source
          this.videoRef.nativeElement.play();  // Play the video
        })
        .catch((err) => {
          console.error('Error accessing webcam:', err);
          // Display error message if webcam access fails
          this.errorMessage = 'Webcam access error. Check connection and permissions.';
        });
    } catch (error) {
      console.error('Error in initCam:', error);
      // Display error message for general webcam initialization errors
      this.errorMessage = 'Something went wrong while initializing the webcam.';
    }
  }

  // Loads the MoveNet model for pose detection
  async loadMoveNetModel() {
    await tf.ready();  // Wait until TensorFlow.js is ready
    // Create the MoveNet pose detection model
    this.model = await poseDetection.createDetector(poseDetection.SupportedModels.MoveNet, {
      modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING
    });
    console.log('MoveNet model loaded.');  // Log successful model loading
  }

  // Toggles the pose detection process on or off
  toggleDetection() {
    console.log(this.isDetecting);
    if (this.isDetecting) {
      this.detectPoseWithAnimation();  // Start detecting poses if currently detecting
    } else {
      this.stopDetection();  // Stop detecting poses if not currently detecting
    }
  }

  // Detects poses in a loop and renders them with animation
  detectPoseWithAnimation() {
    console.log(this.isDetecting);
    if (!this.isDetecting) return;  // Exit if not currently detecting

    this.animationFrameId = requestAnimationFrame(async () => {
      if (this.model) {
        // Estimate poses from the video stream
        const poses = await this.model.estimatePoses(this.videoRef.nativeElement, {
          flipHorizontal: true  // Flip the poses for a mirror effect
        });
        this.renderPose(poses);  // Render the detected poses
      }
      this.detectPoseWithAnimation();  // Continue the detection loop
    });
  }

  // Renders the detected poses onto the canvas
  renderPose(poses: any[]) {
    console.log(poses);
    const canvas = this.canvasRef.nativeElement;
    const ctx = canvas.getContext('2d');
    // Set the canvas size to match the video stream dimensions
    canvas.width = this.videoRef.nativeElement.videoWidth || 640;
    canvas.height = this.videoRef.nativeElement.videoHeight || 480;

    ctx!.clearRect(0, 0, canvas.width, canvas.height);  // Clear previous drawings
    ctx!.drawImage(this.videoRef.nativeElement, 0, 0, canvas.width, canvas.height);  // Draw the video frame

    poses.forEach((pose: any) => {
      this.drawSkeleton(pose, ctx);  // Draw the detected skeleton for each pose
    });
  }

  // Draws the skeleton of the detected pose on the canvas
  drawSkeleton(pose: any, ctx: any) {
    const minKeypointConfidence = 0.5;  // Minimum confidence to draw keypoints
    // Define connections between keypoints to form the skeleton
    const connections = [
      [0, 1], [1, 2], [2, 3], [0, 4], [4, 5], [5, 6],
      [7, 8], [8, 9], [7, 10], [10, 11], [0, 7],
      [0, 12], [12, 13], [13, 14], [12, 15], [15, 16],
    ];

    // Draw each keypoint
    pose.keypoints.forEach((keypoint: any) => {
      if (keypoint.score > minKeypointConfidence) {
        ctx.fillStyle = '#FF0000'; // Bright red for keypoints
        ctx.shadowColor = '#000000'; // Shadow for better visibility
        ctx.shadowBlur = 5; // Apply shadow blur
        ctx.fillRect(keypoint.x - 4, keypoint.y - 4, 8, 8); // Draw keypoint as a square
      }
    });

    ctx.strokeStyle = '#00FF00'; // Bright green for lines
    ctx.lineWidth = 4; // Thicker lines for skeleton
    ctx.shadowBlur = 0; // Remove shadow for lines

    // Draw connections between keypoints
    connections.forEach(([startIdx, endIdx]) => {
      const startPoint = pose.keypoints[startIdx];
      const endPoint = pose.keypoints[endIdx];

      // Draw a line if both keypoints are detected with sufficient confidence
      if (startPoint && endPoint && startPoint.score > minKeypointConfidence && endPoint.score > minKeypointConfidence) {
        ctx.beginPath();
        ctx.moveTo(startPoint.x, startPoint.y); // Move to start point
        ctx.lineTo(endPoint.x, endPoint.y); // Draw line to end point
        ctx.stroke(); // Render the line
      }
    });
  }

  // Stops the pose detection and animation
  stopDetection() {
    this.isDetecting = false;  // Set detecting state to false
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);  // Cancel the animation frame request
      this.animationFrameId = null;  // Clear the animation frame ID
    }
  }

  // Stops the camera and cleans up resources
  stopCamera() {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());  // Stop all tracks in the stream
      this.stream = null;  // Clear the stream reference
      this.videoRef.nativeElement.srcObject = null;  // Clear the video source
    }
    this.showVideo = false;  // Hide the video stream
    this.stopDetection();  // Stop any ongoing detection
  }
}
