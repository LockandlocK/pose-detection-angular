import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import * as poseDetection from '@tensorflow-models/pose-detection';
import * as tf from '@tensorflow/tfjs';
import { loadGraphModel } from '@tensorflow/tfjs-converter';
import { PosePreprocessingService } from './services/pose-preprocessing.service';


@Component({
  selector: 'app-pose-detection',
  templateUrl: './pose-detection.component.html',
  styleUrls: ['./pose-detection.component.scss']
})



export class PoseDetectionComponent implements OnInit {
  // References to the HTML elements for video and canvas
  @ViewChild('videoElement', { static: true }) videoRef!: ElementRef<HTMLVideoElement>;
  @ViewChild('canvasElement', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;
  constructor(private posePreprocessingService: PosePreprocessingService) { }

  //constructor(private router: Router) {}

  // State variables
  showVideo: boolean = false;  // Controls visibility of the video stream
  stream: MediaStream | null = null;  // Holds the video stream from the webcam

  model: any;  // Pose detection model
  yoga_model: any;  // yoga detection model
  isLoading: boolean = false;  // Indicates if the model is loading
  isDetecting: boolean = false;  // Indicates if pose detection is active
  errorMessage: string | null = null;  // Error message for user feedback
  animationFrameId: number | null = null;  // ID for the requestAnimationFrame for rendering poses
  minKeypointConfidence: number = 0.5;  // Default value, adjust as needed
  className: string = '';
  inferenceTime: number = 0;

  // Lifecycle hook: Called when the component initializes
  async ngOnInit() {
    try {
      // Load the MoveNet model for pose detection
      await this.loadMoveNetModel();
      await this.loadYogaModel();

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
      modelType: poseDetection.movenet.modelType.SINGLEPOSE_THUNDER
    });
    console.log('MoveNet model loaded.');  // Log successful model loading
  }
  // Loads the yoga estimation model for pose detection

  async loadYogaModel() {
    await tf.ready();  // Wait until TensorFlow.js is ready

    this.yoga_model = await tf.loadLayersModel('/assets/tfjs_model/model.json');
    console.log('YOGA model loaded.');  // Log successful model loading

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
      const startTime = performance.now();  // Start time for inference timing

      if (this.model && this.yoga_model) {
        // Estimate poses from the video stream
        const poses = await this.model.estimatePoses(this.videoRef.nativeElement, {
          flipHorizontal: true  // Flip the poses for a mirror effect
        });
        this.renderPose(poses);  // Render the detected poses
        // estimate yoga pose
        if (poses.length > 0) {
          
          const keypoints = poses[0].keypoints.flatMap(kp => [kp.x, kp.y]);
          const processedKeypoints = this.posePreprocessingService.landmarksToEmbedding(keypoints);
          console.log(`input:  $: (${processedKeypoints})`)
          const yogaPose = await this.predictYogaPose(processedKeypoints);

          this.predictYogaPose(poses);  // Assume using the first detected pose
        }

      }
      this.detectPoseWithAnimation();  // Continue the detection loop
      const endTime = performance.now();  // End time for inference timing
       this.inferenceTime = endTime - startTime;  // Calculate inference time
      console.log(`inferenceTime Pose: (${this.inferenceTime.toFixed(2)} ms)`);

    });
  }
  // Function to predict yoga pose
  async predictYogaPose(pose) {
    const classNames = ["chair", "cobra", "dog", "no_pose", "shoulder", "stand", "triangle", "tree", "warrior"];

    // Predict the yoga pose
    const prediction = await this.yoga_model.predict(pose);
    const predictedClassIndex = prediction.argMax(1).dataSync()[0];
     this.className = classNames[predictedClassIndex];  // Map index to class name

    console.log(`prediction:  $: (${this.className})`)
    // You may want to process the prediction to get human-readable results
  }

  // Renders the detected poses onto the canvas
  renderPose(poses: any[]) {
    //console.log(poses);
    const canvas = this.canvasRef.nativeElement;
    const ctx = canvas.getContext('2d');

    // Set the canvas size to match the video stream dimensions
    canvas.width = this.videoRef.nativeElement.videoWidth || 640;
    canvas.height = this.videoRef.nativeElement.videoHeight || 480;

    ctx.clearRect(0, 0, canvas.width, canvas.height);  // Clear previous drawings
    ctx.drawImage(this.videoRef.nativeElement, 0, 0, canvas.width, canvas.height);  // Draw the video frame

    poses.forEach((pose: any) => {
      // Log coordinates of each keypoint
      pose.keypoints.forEach((keypoint: any, index: number) => {
        if (keypoint.score > 0) {
          //console.log(`Keypoint ${index}: (${keypoint.x}, ${keypoint.y}) with score ${keypoint.score}`);
          const _ = 1
        }
      });
      this.drawSkeleton(pose, ctx);  // Draw the detected skeleton for each pose

    });
  }


  // Draws the skeleton of the detected pose on the canvas
  drawSkeleton(pose: any, ctx: any) {
    const minKeypointConfidence = 0.3;  // Minimum confidence to draw keypoints

    // Define a mapping from keypoint names to indices, adjust according to your model's specifics
    const keypointIndices = {
      "NOSE": 0,
      "LEFT_EYE": 1,
      "RIGHT_EYE": 2,
      "LEFT_EAR": 3,
      "RIGHT_EAR": 4,
      "LEFT_SHOULDER": 5,
      "RIGHT_SHOULDER": 6,
      "LEFT_ELBOW": 7,
      "RIGHT_ELBOW": 8,
      "LEFT_WRIST": 9,
      "RIGHT_WRIST": 10,
      "LEFT_HIP": 11,
      "RIGHT_HIP": 12,
      "LEFT_KNEE": 13,
      "RIGHT_KNEE": 14,
      "LEFT_ANKLE": 15,
      "RIGHT_ANKLE": 16
    };

    // Define the connections using names, which will be converted to indices
    const namedConnections = [
      ["NOSE", "LEFT_EYE"], ["NOSE", "RIGHT_EYE"],
      ["LEFT_EYE", "LEFT_EAR"], ["RIGHT_EYE", "RIGHT_EAR"],
      ["LEFT_SHOULDER", "RIGHT_SHOULDER"],
      ["LEFT_SHOULDER", "LEFT_ELBOW"], ["RIGHT_SHOULDER", "RIGHT_ELBOW"],
      ["LEFT_ELBOW", "LEFT_WRIST"], ["RIGHT_ELBOW", "RIGHT_WRIST"],
      ["LEFT_SHOULDER", "LEFT_HIP"], ["RIGHT_SHOULDER", "RIGHT_HIP"],
      ["LEFT_HIP", "RIGHT_HIP"],
      ["LEFT_HIP", "LEFT_KNEE"], ["RIGHT_HIP", "RIGHT_KNEE"],
      ["LEFT_KNEE", "LEFT_ANKLE"], ["RIGHT_KNEE", "RIGHT_ANKLE"]
    ];

    // Convert named connections to index-based connections
    const connections = namedConnections.map(pair => pair.map(name => keypointIndices[name]));



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
