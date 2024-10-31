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
  @ViewChild('videoElement', { static: true }) videoRef!: ElementRef<HTMLVideoElement>;
  @ViewChild('canvasElement', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;

  constructor(private router: Router) {}

  showVideo: boolean = false;
  stream: MediaStream | null = null;

  model: any;
  isLoading: boolean = false;
  isDetecting: boolean = false;
  errorMessage: string | null = null;
  animationFrameId: number | null = null;

  async ngOnInit() {
    try {
      await this.loadMoveNetModel();
    } catch (error) {
      console.error('Error loading MoveNet model:', error);
      this.errorMessage = 'Failed to load pose detection model. Please refresh the page.';
    }
  }

  async startCamera() {
    this.isLoading = true;
    await this.initCam();
    this.isLoading = false;
    this.showVideo = true;
  }

  async initCam() {
    try {
      navigator.mediaDevices
        .getUserMedia({ video: true, audio: false })
        .then((stream) => {
          this.stream = stream;
          this.videoRef.nativeElement.srcObject = stream;
          this.videoRef.nativeElement.play();
        })
        .catch((err) => {
          console.error('Error accessing webcam:', err);
          this.errorMessage = 'Webcam access error. Check connection and permissions.';
        });
    } catch (error) {
      console.error('Error in initCam:', error);
      this.errorMessage = 'Something went wrong while initializing the webcam.';
    }
  }

  async loadMoveNetModel() {
    await tf.ready();
    this.model = await poseDetection.createDetector(poseDetection.SupportedModels.MoveNet, {
      modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING
    });
    console.log('MoveNet model loaded.');
  }

  toggleDetection() {
    //this.isDetecting = !this.isDetecting;
    console.log(this.isDetecting);
    if (this.isDetecting) {
      this.detectPoseWithAnimation();
    } else {
      this.stopDetection();
    }
  }

  detectPoseWithAnimation() {
    console.log(this.isDetecting);
    if (!this.isDetecting) return;

    this.animationFrameId = requestAnimationFrame(async () => {
      if (this.model) {
        const poses = await this.model.estimatePoses(this.videoRef.nativeElement, {
          flipHorizontal: true
        });
        this.renderPose(poses);
      }
      this.detectPoseWithAnimation();
    });
  }

  renderPose(poses: any[]) {
    console.log(poses);
    const canvas = this.canvasRef.nativeElement;
    const ctx = canvas.getContext('2d');
    canvas.width = this.videoRef.nativeElement.videoWidth || 640;
    canvas.height = this.videoRef.nativeElement.videoHeight || 480;

    ctx!.clearRect(0, 0, canvas.width, canvas.height);
    ctx!.drawImage(this.videoRef.nativeElement, 0, 0, canvas.width, canvas.height);

    poses.forEach((pose: any) => {
      this.drawSkeleton(pose, ctx);
    });
  }

  drawSkeleton(pose: any, ctx: any) {
    const minKeypointConfidence = 0.5;
    const connections = [
      [0, 1], [1, 2], [2, 3], [0, 4], [4, 5], [5, 6],
      [7, 8], [8, 9], [7, 10], [10, 11], [0, 7],
      [0, 12], [12, 13], [13, 14], [12, 15], [15, 16],
    ];

    pose.keypoints.forEach((keypoint: any) => {
      if (keypoint.score > minKeypointConfidence) {
        ctx.fillStyle = '#FF0000'; // Bright red for keypoints
        ctx.shadowColor = '#000000'; // Shadow for better visibility
        ctx.shadowBlur = 5;
        ctx.fillRect(keypoint.x - 4, keypoint.y - 4, 8, 8); // Larger keypoints
      }
    });

    ctx.strokeStyle = '#00FF00'; // Bright green for lines
    ctx.lineWidth = 4; // Thicker lines
    ctx.shadowBlur = 0; // Remove shadow for lines

    connections.forEach(([startIdx, endIdx]) => {
      const startPoint = pose.keypoints[startIdx];
      const endPoint = pose.keypoints[endIdx];

      if (startPoint && endPoint && startPoint.score > minKeypointConfidence && endPoint.score > minKeypointConfidence) {
        ctx.beginPath();
        ctx.moveTo(startPoint.x, startPoint.y);
        ctx.lineTo(endPoint.x, endPoint.y);
        ctx.stroke();
      }
    });
  }


  stopDetection() {
    this.isDetecting = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  stopCamera() {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
      this.videoRef.nativeElement.srcObject = null;
    }
    this.showVideo = false;
    this.stopDetection();
  }
}
