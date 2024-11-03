import { Injectable } from '@angular/core';
import * as tf from '@tensorflow/tfjs';

@Injectable({
  providedIn: 'root'
})
export class PosePreprocessingService {

  constructor() { }

  landmarksToEmbedding(landmarksFlat: number[]): tf.Tensor2D {
    // Step 1: Reshape the flat input to [17, 2], assuming only x, y are provided and ignoring scores if present
    const landmarks = tf.tensor2d(landmarksFlat, [17, 2]);

    // Step 2: Calculate the center point using LEFT_SHOULDER and RIGHT_SHOULDER indices
    const center = this.getCenterPoint(landmarks, 5, 6); // Indices for left and right shoulders

    // Step 3: Normalize the landmarks
    const normalizedLandmarks = this.normalizeLandmarks(landmarks, center);
    const normalizedTensor = this.normalizeTensorLandmarks(normalizedLandmarks);
    

    return normalizedTensor.reshape([1, 34]);
  }

  private getCenterPoint(landmarks: tf.Tensor2D, leftIndex: number, rightIndex: number): tf.Tensor1D {
    const leftShoulder = landmarks.slice([leftIndex, 0], [1, 2]).flatten();
    const rightShoulder = landmarks.slice([rightIndex, 0], [1, 2]).flatten();
    return leftShoulder.add(rightShoulder).div(tf.scalar(2));
  }

  private normalizeLandmarks(landmarks: tf.Tensor2D, center: tf.Tensor1D): tf.Tensor2D {
    // Subtract center to move the pose center to (0,0) and scale
    return landmarks.sub(center);
  }
  private normalizeTensorLandmarks(landmarksTensor): tf.Tensor2D {
    // Calculate the max absolute value from all elements to use for normalization
    const maxAbs = landmarksTensor.abs().max();

    // Normalize each element to the range [-1, 1]
    const normalizedTensor = landmarksTensor.div(maxAbs);

    return normalizedTensor;
  }

}
